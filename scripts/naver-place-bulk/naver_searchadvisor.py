"""네이버 서치어드바이저 웹페이지 수집 요청 (undetected-chromedriver)."""

from __future__ import annotations

import json
import logging
import random
import re
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.parse import quote, unquote, urlparse

logger = logging.getLogger(__name__)

LOGIN_ENTRY_URL = "https://searchadvisor.naver.com/"
SITE_BOARD_URL = "https://searchadvisor.naver.com/console/board"
CRAWL_PAGE_PATH = "/console/site/request/crawl"

LogFn = Callable[[str], None] | None


@dataclass
class NaverSubmitOptions:
    site_url: str
    daily_limit: int = 50
    delay_min_sec: float = 10.0
    delay_max_sec: float = 15.0
    login_entry_url: str = LOGIN_ENTRY_URL
    submit_log_path: Path | None = None


@dataclass
class SubmitResult:
    url: str
    ok: bool
    message: str


@dataclass
class BatchSubmitReport:
    submitted: list[SubmitResult] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)

    @property
    def success_count(self) -> int:
        return sum(1 for r in self.submitted if r.ok)

    @property
    def fail_count(self) -> int:
        return sum(1 for r in self.submitted if not r.ok)


def _emit(msg: str, on_log: LogFn) -> None:
    logger.info(msg)
    if on_log:
        on_log(msg)


def normalize_site_url(url: str) -> str:
    url = url.strip().rstrip("/")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def _site_host(url: str) -> str:
    return urlparse(normalize_site_url(url)).netloc.lower()


def url_to_document(site_url: str, page_url: str) -> str:
    """수집 요청 입력값 — 등록 사이트 기준 전체 URL (예: https://mainecoon.cattery.co.kr/강서구메인쿤분양)."""
    site = normalize_site_url(site_url)
    site_parsed = urlparse(site)
    base = f"{site_parsed.scheme}://{site_parsed.netloc}"

    page = page_url.strip()
    if not page:
        return f"{base}/"

    if not page.startswith(("http://", "https://")):
        # mainecoon.cattery.co.kr/슬러그 처럼 scheme 없이 host/path만 있는 경우
        head = page.split("/")[0]
        if "." in head:
            page = "https://" + page.lstrip("/")
        else:
            path = page if page.startswith("/") else f"/{page}"
            return f"{base}{unquote(path)}"

    parsed = urlparse(page)
    path = unquote(parsed.path or "/")
    if not path.startswith("/"):
        path = f"/{path}"
    if parsed.query:
        path += "?" + parsed.query
    return f"{base}{path}"


def read_urls_from_file(path: Path) -> list[str]:
    if not path.exists():
        return []
    urls: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


def _load_submit_log(path: Path) -> dict:
    if not path.exists():
        return {"days": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"days": {}}


def _save_submit_log(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_today_submit_count(log_path: Path | None) -> int:
    if not log_path:
        return 0
    data = _load_submit_log(log_path)
    today = date.today().isoformat()
    return int(data.get("days", {}).get(today, {}).get("count", 0))


def record_submit(log_path: Path | None, url: str, ok: bool, message: str) -> None:
    if not log_path:
        return
    data = _load_submit_log(log_path)
    today = date.today().isoformat()
    day = data.setdefault("days", {}).setdefault(
        today, {"count": 0, "entries": []}
    )
    if ok:
        day["count"] = int(day.get("count", 0)) + 1
    day.setdefault("entries", []).append(
        {
            "at": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "ok": ok,
            "message": message,
        }
    )
    _save_submit_log(log_path, data)


def crawl_page_url(site_url: str) -> str:
    site = normalize_site_url(site_url)
    return f"https://searchadvisor.naver.com{CRAWL_PAGE_PATH}?site={quote(site, safe='')}"


def _is_logged_in(driver) -> bool:
    """콘솔(/console/) 페이지에 실제 접속 가능한지 확인."""
    url = (driver.current_url or "").lower()
    if "nid.naver.com" in url or "nidlogin" in url:
        return False
    if "searchadvisor.naver.com" not in url:
        return False
    if "/console/" not in url:
        return False
    try:
        body = (driver.page_source or "").lower()
        if "nidlogin" in body or "sign in" in body:
            return False
        if "로그인" in body and "console/board" not in url and "request/crawl" not in url:
            return False
    except Exception:
        pass
    return True


def verify_console_login(driver, *, on_log: LogFn = None) -> bool:
    """사이트 목록(콘솔) 접근으로 로그인 여부 검증."""
    try:
        driver.get(SITE_BOARD_URL)
        time.sleep(random.uniform(2.0, 3.0))
        if _is_logged_in(driver):
            return True
        url = (driver.current_url or "").lower()
        if "nid.naver.com" in url or "nidlogin" in url:
            _emit("  네이버 로그인 페이지로 이동됨 — 로그인이 필요합니다.", on_log)
            return False
        _emit(f"  콘솔 접근 실패 (현재 URL: {driver.current_url})", on_log)
        return False
    except Exception as exc:
        _emit(f"  콘솔 접근 확인 오류: {exc}", on_log)
        return False


def wait_for_manual_login(
    driver,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    poll_sec: float = 2.0,
    max_wait_sec: int = 900,
    prompt: bool = True,
) -> bool:
    """브라우저에서 수동 로그인 후 [로그인 완료] 확인까지 대기."""
    if on_ready_for_login:
        on_ready_for_login()

    if prompt:
        _emit(
            "Chrome에서 네이버 로그인을 완료한 뒤, "
            "프로그램 팝업 [확인]을 눌러 주세요.",
            on_log,
        )
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        if login_confirmed and login_confirmed():
            _emit("로그인 완료 버튼 확인 — 콘솔 접근 검증 중...", on_log)
            if verify_console_login(driver, on_log=on_log):
                _emit("로그인 및 콘솔 접근 확인됨.", on_log)
                return True
            _emit(
                "아직 로그인되지 않았습니다. 브라우저에서 로그인 후 다시 [확인]을 눌러 주세요.",
                on_log,
            )
            if on_ready_for_login:
                on_ready_for_login()
            time.sleep(poll_sec)
            continue
        time.sleep(poll_sec)
    _emit("로그인 대기 시간 초과.", on_log)
    return False


def _read_chrome_version_string() -> str | None:
    """설치된 Chrome 전체 버전 (예: 131.0.6778.86)."""
    import re
    import subprocess
    import sys
    from pathlib import Path

    if sys.platform == "win32":
        try:
            import winreg

            reg_paths = [
                (winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Google\Chrome\BLBeacon"),
                (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Wow6432Node\Google\Chrome\BLBeacon"),
            ]
            for root, subkey in reg_paths:
                try:
                    key = winreg.OpenKey(root, subkey)
                    version, _ = winreg.QueryValueEx(key, "version")
                    winreg.CloseKey(key)
                    text = str(version).strip()
                    if re.match(r"^\d+\.\d+\.\d+\.\d+$", text):
                        return text
                except OSError:
                    continue
        except ImportError:
            pass

    chrome_paths = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    ]
    for chrome in chrome_paths:
        if not chrome.exists():
            continue
        try:
            result = subprocess.run(
                [str(chrome), "--version"],
                capture_output=True,
                text=True,
                timeout=10,
                encoding="utf-8",
                errors="replace",
            )
            text = (result.stdout or result.stderr or "").strip()
            match = re.search(r"(\d+\.\d+\.\d+\.\d+)", text)
            if match:
                return match.group(1)
        except Exception:
            continue
    return None


def get_chrome_major_version() -> int | None:
    """설치된 Chrome major 버전 (예: 131)."""
    version = _read_chrome_version_string()
    if not version:
        return None
    try:
        major = int(version.split(".")[0])
        return major if major > 0 else None
    except ValueError:
        return None


def _build_chrome_user_agent(version: str) -> str:
    major = version.split(".")[0]
    return (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        f"Chrome/{major}.0.0.0 Safari/537.36"
    )


def _browser_version_from_driver(driver) -> str:
    try:
        caps = driver.capabilities or {}
        return str(caps.get("browserVersion") or caps.get("version") or "").strip()
    except Exception:
        return ""


def _configure_modern_browser(driver, *, on_log: LogFn = None) -> None:
    """네이버 '구형 브라우저' 경고 방지 — 실제 Chrome 버전에 맞는 UA 적용."""
    installed = _read_chrome_version_string()
    running = _browser_version_from_driver(driver)
    version = installed or running
    if not version:
        return

    ua = _build_chrome_user_agent(version)
    major = version.split(".")[0]
    try:
        driver.execute_cdp_cmd(
            "Network.setUserAgentOverride",
            {
                "userAgent": ua,
                "acceptLanguage": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "platform": "Win32",
            },
        )
    except Exception as exc:
        _emit(f"  User-Agent 설정 스킵: {exc}", on_log)

    try:
        driver.execute_cdp_cmd(
            "Emulation.setUserAgentOverride",
            {
                "userAgent": ua,
                "acceptLanguage": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "platform": "Win32",
                "userAgentMetadata": {
                    "brands": [
                        {"brand": "Google Chrome", "version": major},
                        {"brand": "Chromium", "version": major},
                        {"brand": "Not.A/Brand", "version": "24"},
                    ],
                    "fullVersionList": [
                        {"brand": "Google Chrome", "version": version},
                        {"brand": "Chromium", "version": version},
                        {"brand": "Not.A/Brand", "version": "24.0.0.0"},
                    ],
                    "fullVersion": version,
                    "platform": "Windows",
                    "platformVersion": "10.0.0",
                    "architecture": "x86",
                    "model": "",
                    "mobile": False,
                },
            },
        )
    except Exception:
        pass

    if running and installed and running.split(".")[0] != installed.split(".")[0]:
        _emit(
            f"  경고: Chrome({installed})과 드라이버({running}) major 버전이 다릅니다. "
            "Chrome을 최신으로 업데이트하거나 'pip install -U undetected-chromedriver' 를 실행하세요.",
            on_log,
        )
    else:
        _emit(f"  브라우저 버전: {running or version}", on_log)


def _parse_browser_version_from_error(exc: Exception) -> int | None:
    import re

    match = re.search(r"Current browser version is (\d+)", str(exc))
    if match:
        return int(match.group(1))
    return None


def _create_driver(*, on_log: LogFn = None):
    import undetected_chromedriver as uc

    installed_version = _read_chrome_version_string()
    detected = get_chrome_major_version()

    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=ko-KR")
    options.add_argument("--window-size=1280,900")
    if installed_version:
        options.add_argument(f"--user-agent={_build_chrome_user_agent(installed_version)}")
    # headless 는 CSRF/탐지 이슈로 사용하지 않음

    version_candidates: list[int | None] = []
    if detected is not None:
        version_candidates.append(detected)
    version_candidates.append(None)

    seen: set[int | None] = set()
    attempts: list[dict] = []
    for ver in version_candidates:
        if ver in seen:
            continue
        seen.add(ver)
        for use_sub in (True, False):
            kwargs: dict = {"use_subprocess": use_sub}
            if ver is not None:
                kwargs["version_main"] = ver
            attempts.append(kwargs)

    last_err: Exception | None = None
    for kwargs in attempts:
        try:
            driver = uc.Chrome(options=options, **kwargs)
            driver.set_page_load_timeout(60)
            _configure_modern_browser(driver, on_log=on_log)
            return driver
        except Exception as exc:
            last_err = exc
            parsed = _parse_browser_version_from_error(exc)
            if parsed is not None and parsed not in seen:
                seen.add(parsed)
                for use_sub in (True, False):
                    try:
                        driver = uc.Chrome(
                            options=options,
                            version_main=parsed,
                            use_subprocess=use_sub,
                        )
                        driver.set_page_load_timeout(60)
                        _configure_modern_browser(driver, on_log=on_log)
                        return driver
                    except Exception as exc2:
                        last_err = exc2
            continue

    hint = f" (설치 Chrome: {installed_version or detected})" if (installed_version or detected) else ""
    raise RuntimeError(
        f"Chrome/chromedriver 버전 불일치{hint}.\n"
        "Chrome을 최신으로 업데이트한 뒤 "
        "'pip install -U undetected-chromedriver selenium' 를 실행하고 다시 시도하세요.\n"
        f"상세: {last_err}"
    ) from last_err


def list_registered_sites(driver) -> list[str]:
    from selenium.webdriver.common.by import By

    sites: list[str] = []
    for link in driver.find_elements(By.CSS_SELECTOR, "tbody a.api_link"):
        text = (link.text or "").strip()
        if text.startswith("http"):
            sites.append(normalize_site_url(text))
    return sites


def resolve_registered_site(driver, wanted_site: str, *, on_log: LogFn = None) -> str | None:
    """사이트 목록에서 등록된 URL과 매칭 (정확·호스트·접두사)."""
    wanted = normalize_site_url(wanted_site)
    wanted_host = _site_host(wanted)
    prefix = wanted_host.split(".")[0]

    registered = list_registered_sites(driver)
    if not registered:
        return None

    for reg in registered:
        if reg == wanted:
            return reg
    for reg in registered:
        if _site_host(reg) == wanted_host:
            return reg

    prefix_matches = [reg for reg in registered if _site_host(reg).split(".")[0] == prefix]
    if len(prefix_matches) == 1:
        _emit(f"  등록 사이트 자동 매칭: {wanted} → {prefix_matches[0]}", on_log)
        return prefix_matches[0]

    host_contains = [reg for reg in registered if prefix in _site_host(reg)]
    if len(host_contains) == 1:
        _emit(f"  등록 사이트 자동 매칭: {wanted} → {host_contains[0]}", on_log)
        return host_contains[0]

    return None


def _click_site_link(driver, registered_site: str, *, on_log: LogFn = None) -> bool:
    from selenium.webdriver.common.by import By

    target = normalize_site_url(registered_site)
    target_host = _site_host(target)
    for link in driver.find_elements(By.CSS_SELECTOR, "tbody a.api_link"):
        text = (link.text or "").strip()
        if not text.startswith("http"):
            continue
        reg = normalize_site_url(text)
        if reg == target or _site_host(reg) == target_host:
            try:
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", link)
                time.sleep(0.3)
                link.click()
                return True
            except Exception:
                try:
                    driver.execute_script("arguments[0].click();", link)
                    return True
                except Exception as exc:
                    _emit(f"  사이트 클릭 실패: {exc}", on_log)
                    return False
    return False


def _wait_for_crawl_page(driver, *, timeout: float = 25.0):
    from selenium.webdriver.support.ui import WebDriverWait

    WebDriverWait(driver, timeout).until(lambda d: _find_crawl_input(d) is not None)


def _find_crawl_input(driver):
    from selenium.webdriver.common.by import By

    def usable(el) -> bool:
        try:
            return el.is_displayed() and el.is_enabled()
        except Exception:
            return False

    # 수집 요청 페이지 전용 입력 (maxlength=2048)
    for el in driver.find_elements(By.CSS_SELECTOR, 'input[maxlength="2048"]'):
        if usable(el):
            return el

    for el in driver.find_elements(By.CSS_SELECTOR, "input[type='text']"):
        ml = (el.get_attribute("maxlength") or "").strip()
        if ml == "253":
            continue
        label = el.get_attribute("aria-label") or ""
        el_id = el.get_attribute("id") or ""
        if "검색" in label:
            continue
        if usable(el) and ml in ("2048", "2000", "1024", ""):
            return el

    for by, sel in (
        (By.XPATH, "//label[contains(.,'URL') or contains(.,'url')]/following::input[1]"),
        (By.CSS_SELECTOR, "textarea"),
    ):
        for el in driver.find_elements(by, sel):
            if usable(el):
                return el
    return None


def _find_confirm_button(driver):
    from selenium.webdriver.common.by import By

    for btn in driver.find_elements(By.CSS_SELECTOR, "button.accent, button.v-btn.accent"):
        if not btn.is_displayed() or not btn.is_enabled():
            continue
        if "확인" in (btn.text or ""):
            return btn

    for btn in driver.find_elements(
        By.XPATH,
        "//button[contains(@class,'accent')][.//span[contains(normalize-space(.),'확인')]]",
    ):
        if btn.is_displayed() and btn.is_enabled():
            return btn

    for label in ("확인", "수집 요청", "수집요청"):
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            if btn.is_displayed() and btn.is_enabled():
                return btn
    return None


def _count_crawl_history_rows(driver) -> int:
    from selenium.webdriver.common.by import By

    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            ".v-data-table tbody tr, .v-data-table__wrapper tbody tr, table tbody tr",
        )
        return len([r for r in rows if (r.text or "").strip()])
    except Exception:
        return 0


def _document_match_variants(document: str) -> set[str]:
    from urllib.parse import unquote, urlparse

    doc = unquote(document.strip())
    variants: set[str] = set()
    if not doc:
        return variants
    variants.add(doc)
    if doc.startswith(("http://", "https://")):
        parsed = urlparse(doc)
        path = unquote(parsed.path or "")
        if path:
            variants.add(path)
            variants.add(path.lstrip("/"))
        host_path = f"{parsed.netloc}{path}"
        variants.add(host_path)
    else:
        variants.add(doc.lstrip("/"))
    return {v for v in variants if v}


def _crawl_submitted_in_history(
    driver,
    document: str,
    *,
    before_count: int | None = None,
) -> bool:
    """수집 요청 내역 테이블에 URL/경로가 나타났는지 확인."""
    from selenium.webdriver.common.by import By

    variants = _document_match_variants(document)
    if not variants:
        return False

    try:
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            ".v-data-table tbody tr, .v-data-table__wrapper tbody tr, table tbody tr",
        )
        visible = [r for r in rows if (r.text or "").strip()]
        if before_count is not None and len(visible) <= before_count:
            return False
        for row in visible[:15]:
            text = (row.text or "").replace("\n", " ")
            if any(v in text for v in variants):
                return True
    except Exception:
        pass
    return False


def _read_feedback(driver) -> str:
    from selenium.webdriver.common.by import By

    texts: list[str] = []
    selectors = [
        "[role='alert']",
        ".toast",
        ".alert",
        "[class*='toast']",
        "[class*='snack']",
        "[class*='Snackbar']",
    ]
    for sel in selectors:
        for el in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                if not el.is_displayed():
                    continue
                t = (el.text or "").strip()
                if t and len(t) < 500:
                    texts.append(t)
            except Exception:
                continue
    return " | ".join(texts[:3])


def _clear_input_field(driver, element) -> None:
    """Vue/Vuetify 입력창 — 기존 값 완전 삭제."""
    from selenium.webdriver.common.keys import Keys

    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        element.click()
    except Exception:
        pass
    time.sleep(0.15)

    for _ in range(3):
        try:
            element.send_keys(Keys.CONTROL, "a")
            element.send_keys(Keys.BACKSPACE)
            element.send_keys(Keys.DELETE)
        except Exception:
            pass
        try:
            driver.execute_script(
                """
                const el = arguments[0];
                el.focus();
                const setter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                setter.call(el, '');
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                """,
                element,
            )
        except Exception:
            pass
        time.sleep(0.1)
        current = (element.get_attribute("value") or "").strip()
        if not current:
            return


def _fill_input_field(driver, element, text: str) -> None:
    """입력창 비운 뒤 URL 입력 (Vue 반응형 필드 대응)."""
    _clear_input_field(driver, element)
    time.sleep(0.15)

    try:
        driver.execute_script(
            """
            const el = arguments[0];
            const val = arguments[1];
            el.focus();
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            """,
            element,
            text,
        )
    except Exception:
        element.send_keys(text)
        return

    time.sleep(0.1)
    current = element.get_attribute("value") or ""
    if current != text:
        _clear_input_field(driver, element)
        element.send_keys(text)


def _type_like_human(driver, element, text: str) -> None:
    _fill_input_field(driver, element, text)


def _submit_one_url_ui(driver, document: str, *, on_log: LogFn = None) -> tuple[bool, str]:
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    wait = WebDriverWait(driver, 20)
    try:
        inp = wait.until(lambda d: _find_crawl_input(d))
    except Exception:
        return False, "수집 URL 입력창을 찾지 못했습니다."

    _type_like_human(driver, inp, document)
    time.sleep(random.uniform(0.3, 0.8))

    before_rows = _count_crawl_history_rows(driver)

    buttons = _find_confirm_button(driver)
    if not buttons:
        return False, "확인 버튼을 찾지 못했습니다."
    btn = buttons
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)

    time.sleep(random.uniform(2.0, 3.0))

    if _crawl_submitted_in_history(driver, document, before_count=before_rows):
        return True, "수집 요청 내역에 등록됨"

    feedback = _read_feedback(driver)
    page = (driver.page_source or "")[:8000]

    fail_words = ("실패", "오류", "한도", "초과", "불가", "limit")
    ok_words = ("성공", "완료", "접수", "요청되었", "success", "등록")

    lower_fb = feedback.lower()

    if feedback and any(w in feedback for w in fail_words):
        return False, feedback or "수집 요청 실패 (오류 메시지)"

    if feedback and any(w in feedback for w in ok_words):
        return True, feedback

    if _crawl_submitted_in_history(driver, document):
        return True, "수집 요청 내역에 등록됨"

    # UI 확인 버튼으로 이미 요청됐을 수 있음 — API 중복 호출은 오류를 유발함
    api_ok, api_msg = _submit_one_url_api(driver, document, on_log=on_log)
    if api_ok is True:
        return True, api_msg
    if api_ok is False and api_msg and "json" not in api_msg.lower():
        return False, api_msg

    if any(w in page for w in ok_words):
        return True, feedback or "요청 완료 (UI)"
    if _crawl_submitted_in_history(driver, document):
        return True, "수집 요청 내역에 등록됨"
    return True, feedback or "요청 전송됨 (결과 메시지 미확인)"


def _submit_one_url_api(driver, document: str, *, on_log: LogFn = None) -> tuple[bool | None, str]:
    """브라우저 세션 쿠키로 API 호출 (UI 보조). 실패 시 None 반환."""
    try:
        csrf = driver.execute_script(
            "return (window.__NUXT__ && window.__NUXT__.state && window.__NUXT__.state.csrfToken) "
            "|| (window.__NUXT__ && window.__NUXT__.state && window.__NUXT__.state.csrf) "
            "|| '';"
        )
        if not csrf:
            return None, ""

        site = driver.execute_script(
            "try { return new URL(window.location.href).searchParams.get('site') || ''; }"
            "catch(e) { return ''; }"
        )
        if not site:
            return None, ""

        payload = driver.execute_async_script(
            """
            const site = arguments[0];
            const doc = arguments[1];
            const csrf = arguments[2];
            const done = arguments[arguments.length - 1];
            fetch('/api-console/request/crawl', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json;charset=UTF-8'},
                body: JSON.stringify({site: site, document: doc, _csrf: csrf})
            })
            .then(async r => {
                const text = await r.text();
                let body = {};
                if (text) {
                    try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
                }
                return {status: r.status, body: body};
            })
            .then(done)
            .catch(e => done({status: 0, error: String(e)}));
            """,
            site,
            document,
            csrf,
        )
        if not payload:
            return None, ""
        body = payload.get("body") or {}
        if payload.get("status") == 200 and body.get("code") == 0:
            return True, body.get("message") or "SUCCESS"
        msg = body.get("message") or payload.get("error") or str(body)
        if msg and ("json" in msg.lower() or "unexpected end" in msg.lower()):
            return None, ""
        if msg:
            return False, msg
        return None, ""
    except Exception as exc:
        _emit(f"  API 보조 호출 스킵: {exc}", on_log)
        return None, ""


def navigate_to_crawl_page(driver, site_url: str, *, on_log: LogFn = None) -> str:
    """사이트 목록에서 등록 사이트를 찾아 웹페이지 수집 페이지로 이동. 실제 등록 URL 반환."""
    wanted = normalize_site_url(site_url)
    _emit(f"사이트 목록에서 '{wanted}' 검색 중...", on_log)

    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.5, 3.5))

    registered = resolve_registered_site(driver, wanted, on_log=on_log)
    if not registered:
        sites = list_registered_sites(driver)
        sample = "\n".join(f"  • {s}" for s in sites[:15])
        extra = f"\n  … 외 {len(sites) - 15}개" if len(sites) > 15 else ""
        raise RuntimeError(
            f"서치어드바이저에 '{wanted}' 가 등록되어 있지 않습니다.\n"
            f"GUI [네이버 수집] 탭의 '서치어드바이저 등록 사이트'를 아래 목록과 일치하게 설정하세요.\n"
            f"{sample}{extra}"
        )

    if registered != wanted:
        _emit(f"  사용할 등록 URL: {registered}", on_log)

    if _click_site_link(driver, registered, on_log=on_log):
        _emit("  사이트 목록에서 클릭 완료", on_log)
        time.sleep(random.uniform(1.5, 2.5))

    target = crawl_page_url(registered)
    _emit(f"  웹페이지 수집 페이지 이동", on_log)
    driver.get(target)
    time.sleep(random.uniform(2.5, 4.0))

    if "request/crawl" not in (driver.current_url or ""):
        _emit(f"  재시도: {target}", on_log)
        driver.get(target)
        time.sleep(2.5)

    try:
        _wait_for_crawl_page(driver, timeout=25.0)
    except Exception:
        current = driver.current_url or ""
        if "nid.naver.com" in current or "nidlogin" in current:
            raise RuntimeError("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.") from None
        raise RuntimeError(
            f"수집 요청 입력창(input maxlength=2048)을 찾지 못했습니다.\n"
            f"현재 URL: {current}\n"
            f"등록 사이트 URL이 정확한지 확인하세요: {registered}"
        ) from None

    _emit("  수집 요청 페이지 준비 완료.", on_log)
    return registered


def start_naver_browser(*, on_log: LogFn = None):
    """Chrome을 열고 네이버 로그인 페이지로 이동."""
    _emit("Chrome 브라우저 실행 (undetected-chromedriver)", on_log)
    major = get_chrome_major_version()
    if major:
        _emit(f"  감지된 Chrome 버전: {major}", on_log)
    driver = _create_driver(on_log=on_log)
    driver.get(
        "https://nid.naver.com/nidlogin.login?url="
        + quote("https://searchadvisor.naver.com/console/board", safe="")
    )
    time.sleep(2.0)
    return driver


def prepare_naver_session(
    driver,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
) -> bool:
    """기존 브라우저 세션 확인 또는 수동 로그인 대기."""
    try:
        if verify_console_login(driver, on_log=on_log):
            _emit("네이버 로그인 세션이 유효합니다.", on_log)
            return True
    except Exception as exc:
        _emit(f"  세션 확인 중 오류: {exc}", on_log)

    _emit("네이버 로그인이 필요합니다.", on_log)
    return wait_for_manual_login(
        driver,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
    )


def _resolve_submit_batch(
    urls: list[str],
    options: NaverSubmitOptions,
    *,
    on_log: LogFn = None,
) -> tuple[list[str], list[str], BatchSubmitReport]:
    report = BatchSubmitReport()
    if not urls:
        _emit("수집 요청할 URL이 없습니다.", on_log)
        return [], [], report

    log_path = options.submit_log_path
    already_today = get_today_submit_count(log_path)
    remaining = max(0, options.daily_limit - already_today)
    if remaining <= 0:
        _emit(
            f"오늘 일일 한도({options.daily_limit}개)를 이미 사용했습니다. 내일 다시 시도하세요.",
            on_log,
        )
        report.skipped = list(urls)
        return [], report.skipped, report

    batch = urls[:remaining]
    if len(urls) > remaining:
        report.skipped = urls[remaining:]
        _emit(
            f"일일 한도: 오늘 {already_today}건 사용됨 → 이번에 {len(batch)}건만 요청 "
            f"({len(report.skipped)}건 스킵)",
            on_log,
        )
    return batch, report.skipped, report


def submit_crawl_urls(
    urls: list[str],
    options: NaverSubmitOptions,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    stop_requested: Callable[[], bool] | None = None,
    keep_browser_open: bool = False,
    existing_driver=None,
) -> BatchSubmitReport:
    """브라우저에서 수집 요청을 순차 제출. existing_driver 가 있으면 로그인 세션 재사용."""
    batch, skipped, report = _resolve_submit_batch(urls, options, on_log=on_log)
    if not batch:
        return report

    site = normalize_site_url(options.site_url)
    log_path = options.submit_log_path
    driver = existing_driver
    owns_driver = driver is None
    login_ok = False
    try:
        if owns_driver:
            driver = start_naver_browser(on_log=on_log)
            if not wait_for_manual_login(
                driver,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
            ):
                raise RuntimeError("네이버 로그인 대기가 종료되었습니다.")
        else:
            if not prepare_naver_session(
                driver,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
            ):
                raise RuntimeError("네이버 로그인 세션이 유효하지 않습니다.")

        login_ok = True
        active_site = navigate_to_crawl_page(driver, site, on_log=on_log)

        _emit(f"수집 요청 시작: {len(batch)}건 (사이트: {active_site})", on_log)
        for idx, page_url in enumerate(batch, start=1):
            if stop_requested and stop_requested():
                _emit("사용자 중단 요청으로 수집 요청을 멈춥니다.", on_log)
                break

            document = url_to_document(active_site, page_url)
            _emit(f"[{idx}/{len(batch)}] 수집 요청: {document}", on_log)

            try:
                ok, message = _submit_one_url_ui(driver, document, on_log=on_log)
            except Exception as exc:
                ok, message = False, str(exc)

            result = SubmitResult(url=page_url, ok=ok, message=message)
            report.submitted.append(result)
            record_submit(log_path, page_url, ok, message)

            if ok:
                _emit(f"  ✓ 성공: {message}", on_log)
            else:
                _emit(f"  ✗ 실패: {message}", on_log)
                if re.search(r"한도|limit|초과", message, re.I):
                    _emit("  일일 한도 도달로 중단합니다.", on_log)
                    break

            if idx < len(batch):
                delay = random.uniform(options.delay_min_sec, options.delay_max_sec)
                _emit(f"  … {delay:.1f}초 대기", on_log)
                time.sleep(delay)

        _emit(
            f"수집 요청 완료: 성공 {report.success_count} / 실패 {report.fail_count}",
            on_log,
        )
        return report
    except Exception as exc:
        _emit(f"오류 발생: {exc}", on_log)
        raise
    finally:
        if driver and owns_driver and not keep_browser_open:
            try:
                if login_ok:
                    _emit("브라우저를 10초 후 닫습니다. (확인용으로 직접 닫아도 됩니다)", on_log)
                    time.sleep(10)
                driver.quit()
            except Exception:
                pass


SITE_REGISTER_URL = "https://searchadvisor.naver.com/console/register"
NAVER_VERIFY_WAIT_SEC = 180


def _is_html_tag_radio_selected(driver) -> bool:
    """선택된 라디오가 'HTML 태그'(파일 업로드 아님)인지 — .v-radio 단위로만 판별."""
    try:
        return bool(
            driver.execute_script(
                """
                for (const item of document.querySelectorAll('.v-radio')) {
                    const input = item.querySelector('input[type=radio]');
                    if (!input || !input.checked) continue;
                    const text = (item.innerText || '').replace(/\\s+/g, ' ').trim();
                    if (text.includes('태그') && !text.includes('업로드') && !text.includes('파일')) {
                        return true;
                    }
                }
                return false;
                """
            )
        )
    except Exception:
        return False


def _is_html_tag_meta_panel_visible(driver) -> bool:
    """HTML 태그 방식 선택 시 보이는 meta 코드 영역."""
    try:
        return bool(
            driver.execute_script(
                """
                for (const el of document.querySelectorAll('textarea, code, pre, input[readonly], .v-text-field input')) {
                    if (el.offsetParent === null) continue;
                    const v = el.value || el.innerText || el.textContent || '';
                    if (v.includes('naver-site-verification')) return true;
                }
                return false;
                """
            )
        )
    except Exception:
        return False


def _select_html_tag_method(driver, *, on_log: LogFn = None) -> bool:
    """소유확인 페이지에서 'HTML 태그' 라디오 버튼 선택 (HTML 파일 업로드 아님)."""
    from selenium.webdriver.common.by import By

    if _is_html_tag_radio_selected(driver):
        _emit("  HTML 태그 방식 이미 선택됨", on_log)
        return True

    _emit("  HTML 태그 라디오 선택 시도...", on_log)

    try:
        selected = driver.execute_script(
            """
            for (const item of document.querySelectorAll('.v-radio')) {
                const text = (item.innerText || '').replace(/\\s+/g, ' ').trim();
                if (!text.includes('태그') || text.includes('업로드') || text.includes('파일')) continue;
                const input = item.querySelector('input[type=radio]');
                item.click();
                if (input) {
                    input.click();
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return true;
            }
            const radios = Array.from(document.querySelectorAll('input[type=radio]'));
            if (radios.length >= 2) {
                const r = radios[1];
                const node = r.closest('.v-radio') || r.parentElement;
                if (node) node.click();
                r.click();
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            return false;
            """
        )
        time.sleep(1.0)
        if selected and _is_html_tag_radio_selected(driver) and _is_html_tag_meta_panel_visible(driver):
            _emit("  HTML 태그 라디오 선택 완료 (JS)", on_log)
            return True
        if selected and _is_html_tag_radio_selected(driver):
            _emit("  HTML 태그 라디오 선택됨 — meta 패널 로딩 대기", on_log)
            time.sleep(1.5)
            if _is_html_tag_meta_panel_visible(driver):
                _emit("  HTML 태그 라디오 선택 완료 (JS)", on_log)
                return True
    except Exception as exc:
        _emit(f"  HTML 태그 JS 선택 실패: {exc}", on_log)

    xpaths = (
        "//label[contains(.,'HTML') and contains(.,'태그') and not(contains(.,'업로드'))]",
        "//div[contains(@class,'v-radio')][contains(.,'HTML') and contains(.,'태그')]",
        "//*[normalize-space(.)='HTML 태그']",
    )
    for xpath in xpaths:
        for el in driver.find_elements(By.XPATH, xpath):
            try:
                if not el.is_displayed():
                    continue
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                time.sleep(0.2)
                driver.execute_script("arguments[0].click();", el)
                time.sleep(0.6)
                if _is_html_tag_radio_selected(driver) and _is_html_tag_meta_panel_visible(driver):
                    _emit("  HTML 태그 라디오 선택 완료 (XPath)", on_log)
                    return True
            except Exception:
                continue

    _emit("  ⚠ HTML 태그 라디오 선택 실패 — HTML 파일 업로드가 선택된 상태일 수 있음", on_log)
    return False


def _click_ownership_verify_button(driver, *, on_log: LogFn = None) -> bool:
    """하단 [소유 확인] 버튼만 클릭 (일반 [확인] 과 구분)."""
    from selenium.webdriver.common.by import By

    for label in ("소유 확인", "소유확인"):
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            try:
                if btn.is_displayed() and btn.is_enabled():
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                    time.sleep(0.3)
                    btn.click()
                    _emit(f"  [{label}] 버튼 클릭", on_log)
                    return True
            except Exception:
                try:
                    driver.execute_script("arguments[0].click();", btn)
                    _emit(f"  [{label}] 버튼 클릭 (JS)", on_log)
                    return True
                except Exception:
                    continue
    return False


def _click_success_dialog_confirm(driver, *, on_log: LogFn = None) -> bool:
    """소유 확인 완료 팝업의 [확인] 클릭."""
    from selenium.webdriver.common.by import By

    page = driver.page_source or ""
    if not any(w in page for w in ("소유 확인", "소유확인", "완료", "인증")):
        return False

    for root_sel in ("[role='dialog']", ".v-dialog", ".v-dialog__content"):
        for root in driver.find_elements(By.CSS_SELECTOR, root_sel):
            try:
                if not root.is_displayed():
                    continue
                text = root.text or ""
                if "자동입력" in text or "보안" in text:
                    continue
                for btn in root.find_elements(By.XPATH, ".//button[contains(.,'확인')]"):
                    if btn.is_displayed() and btn.is_enabled():
                        btn.click()
                        _emit("  소유 확인 완료 팝업 [확인] 클릭", on_log)
                        time.sleep(1.5)
                        return True
            except Exception:
                continue
    return False


def _navigate_to_verify_page(driver, site_url: str, *, on_log: LogFn = None) -> None:
    site = normalize_site_url(site_url)
    urls = [
        f"https://searchadvisor.naver.com/console/verify?site={quote(site, safe='')}",
        f"https://searchadvisor.naver.com/console/site/verify?site={quote(site, safe='')}",
    ]
    for url in urls:
        driver.get(url)
        time.sleep(random.uniform(2.5, 3.5))
        if "verify" in (driver.current_url or "").lower() or _extract_naver_verification_token(
            driver.page_source or ""
        ):
            _emit(f"  사이트 소유확인 페이지: {driver.current_url}", on_log)
            return

    driver.get(SITE_BOARD_URL)
    time.sleep(2.5)
    if _click_site_link(driver, site, on_log=on_log):
        time.sleep(2.0)
    _click_button_by_labels(
        driver,
        ("소유 확인", "소유확인", "사이트 소유", "소유"),
        on_log=on_log,
    )
    time.sleep(2.0)


def _register_site_from_board(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
) -> None:
    """웹마스터 도구 사이트 목록(board)에서 URL 등록."""
    site = normalize_site_url(site_url)
    _emit(f"  사이트 목록(board)에서 등록: {site}", on_log)
    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.5, 3.5))

    clicked = _click_button_by_labels(
        driver,
        ("사이트 등록", "URL 등록", "사이트 추가", "등록"),
        on_log=on_log,
    )
    if clicked:
        time.sleep(1.5)

    if not _fill_site_url_input(driver, site):
        raise RuntimeError(
            "사이트 URL 입력란을 찾지 못했습니다.\n"
            f"https://searchadvisor.naver.com/console/board 에서 직접 URL을 입력해 주세요."
        )

    _click_button_by_labels(
        driver,
        ("등록", "다음", "확인", "시작", "추가"),
        on_log=on_log,
    )
    time.sleep(random.uniform(2.5, 3.5))


def _handle_captcha_if_needed(
    driver,
    *,
    gemini_api_key: str = "",
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
) -> None:
    from naver_captcha import captcha_modal_visible, solve_naver_captcha_modal

    if not captcha_modal_visible(driver) and not _needs_captcha(driver.page_source or ""):
        return

    _emit("  자동입력 방지(CAPTCHA) 감지", on_log)
    if gemini_api_key.strip():
        for attempt in range(3):
            if solve_naver_captcha_modal(driver, gemini_api_key, on_log=on_log):
                if not captcha_modal_visible(driver):
                    _emit("  CAPTCHA 자동 입력 완료", on_log)
                    return
                _emit(f"  CAPTCHA 재시도 ({attempt + 2}/3)", on_log)
                time.sleep(1.5)
            else:
                break

    _emit(
        "  CAPTCHA 자동 처리 실패 — 브라우저에서 직접 입력 후 프로그램 [확인]을 눌러 주세요.",
        on_log,
    )
    if on_ready_for_login:
        on_ready_for_login()
    if login_confirmed:
        deadline = time.time() + 300
        while time.time() < deadline:
            if login_confirmed():
                return
            time.sleep(1.0)


def _extract_naver_verification_token(page_source: str) -> str | None:
    patterns = [
        r'name="naver-site-verification"\s+content="([^"]+)"',
        r'content="([^"]+)"\s+name="naver-site-verification"',
        r'"naver-site-verification"\s*:\s*"([^"]+)"',
        r"naver-site-verification[^>]*content=[\"']([^\"']+)[\"']",
    ]
    for pattern in patterns:
        match = re.search(pattern, page_source, re.I)
        if match:
            token = match.group(1).strip()
            if token and token not in ("PENDING", "..."):
                return token
    return None


def _click_button_by_labels(driver, labels: tuple[str, ...], *, on_log: LogFn = None) -> bool:
    from selenium.webdriver.common.by import By

    for label in labels:
        for btn in driver.find_elements(
            By.XPATH,
            f"//button[contains(normalize-space(.), '{label}')]",
        ):
            try:
                if btn.is_displayed() and btn.is_enabled():
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                    time.sleep(0.3)
                    btn.click()
                    return True
            except Exception:
                try:
                    driver.execute_script("arguments[0].click();", btn)
                    return True
                except Exception as exc:
                    _emit(f"  버튼 클릭 실패 ({label}): {exc}", on_log)
    for label in labels:
        for el in driver.find_elements(By.CSS_SELECTOR, "button.accent, a.accent, button.v-btn.accent"):
            if label in (el.text or "") and el.is_displayed():
                try:
                    el.click()
                    return True
                except Exception:
                    pass
    return False


def _fill_site_url_input(driver, site_url: str) -> bool:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys

    site = normalize_site_url(site_url)
    selectors = [
        'input[type="url"]',
        'input[placeholder*="http"]',
        'input[maxlength="2048"]',
        'input[maxlength="253"]',
        "input[type='text']",
    ]
    for sel in selectors:
        for el in driver.find_elements(By.CSS_SELECTOR, sel):
            try:
                if not el.is_displayed() or not el.is_enabled():
                    continue
                aria = el.get_attribute("aria-label") or ""
                if "검색" in aria:
                    continue
                el.click()
                el.send_keys(Keys.CONTROL, "a")
                el.send_keys(Keys.DELETE)
                el.send_keys(site)
                return True
            except Exception:
                continue
    return False


def _needs_captcha(page_source: str) -> bool:
    lower = page_source.lower()
    return any(
        w in lower
        for w in (
            "자동입력 방지",
            "captcha",
            "보안문자",
            "anti-spam",
        )
    )


def register_site_and_get_verification_token(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    gemini_api_key: str = "",
    skip_captcha: bool = False,
) -> str:
    """board → 사이트 등록 → 소유확인 → HTML 태그 → meta token."""
    site = normalize_site_url(site_url)
    _emit(f"네이버 사이트 등록: {site}", on_log)

    driver.get(SITE_BOARD_URL)
    time.sleep(random.uniform(2.0, 3.0))
    if not _is_logged_in(driver):
        if not wait_for_manual_login(
            driver,
            on_log=on_log,
            login_confirmed=login_confirmed,
            on_ready_for_login=on_ready_for_login,
        ):
            raise RuntimeError("네이버 로그인이 필요합니다.")

    existing = resolve_registered_site(driver, site, on_log=on_log)
    if not existing:
        _register_site_from_board(driver, site, on_log=on_log)
        if not skip_captcha:
            _handle_captcha_if_needed(
                driver,
                gemini_api_key=gemini_api_key,
                on_log=on_log,
                login_confirmed=login_confirmed,
                on_ready_for_login=on_ready_for_login,
            )
    else:
        _emit(f"  이미 등록된 사이트: {existing}", on_log)
        site = existing

    _navigate_to_verify_page(driver, site, on_log=on_log)
    if not _select_html_tag_method(driver, on_log=on_log):
        raise RuntimeError(
            "HTML 태그 라디오를 선택하지 못했습니다.\n"
            "브라우저에서 [HTML 태그]를 직접 선택한 뒤 [확인]을 눌러 주세요."
        )

    token = _extract_naver_verification_token(driver.page_source or "")
    if token:
        _emit(f"  네이버 meta token: {token[:8]}…", on_log)
        return token

    raise RuntimeError(
        "HTML 태그 meta 를 찾지 못했습니다.\n"
        "소유확인 페이지에서 [HTML 태그]를 선택했는지 확인하세요."
    )


def fetch_html_tag_verification_token(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
) -> str:
    """HTML 태그 소유확인 meta 만 가져옴 (캡챠 자동·소유확인 클릭 없음)."""
    return register_site_and_get_verification_token(
        driver,
        site_url,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
        gemini_api_key="",
        skip_captcha=True,
    )


def confirm_site_ownership(
    driver,
    site_url: str,
    *,
    on_log: LogFn = None,
    login_confirmed: Callable[[], bool] | None = None,
    on_ready_for_login: Callable[[], None] | None = None,
    gemini_api_key: str = "",
) -> bool:
    """재배포 후 소유 확인 클릭 → CAPTCHA 시 Gemini 자동 입력."""
    site = normalize_site_url(site_url)
    _emit(f"네이버 [소유 확인] 클릭: {site}", on_log)

    _navigate_to_verify_page(driver, site, on_log=on_log)
    if not _select_html_tag_method(driver, on_log=on_log):
        raise RuntimeError(
            "HTML 태그 라디오를 선택하지 못했습니다.\n"
            "소유 확인 전 [HTML 태그]를 선택해야 합니다."
        )

    if not _click_ownership_verify_button(driver, on_log=on_log):
        raise RuntimeError("소유 확인 버튼을 찾지 못했습니다.")

    time.sleep(random.uniform(1.5, 2.5))
    _handle_captcha_if_needed(
        driver,
        gemini_api_key=gemini_api_key,
        on_log=on_log,
        login_confirmed=login_confirmed,
        on_ready_for_login=on_ready_for_login,
    )
    time.sleep(random.uniform(2.0, 3.0))
    _click_success_dialog_confirm(driver, on_log=on_log)
    time.sleep(random.uniform(1.5, 2.5))

    result = driver.page_source or ""
    ok_words = ("소유 확인이 완료", "소유확인 완료", "인증되었습니다", "verified", "완료")
    if any(w in result for w in ok_words):
        _emit("  ✓ 네이버 소유 확인 성공", on_log)
        _click_success_dialog_confirm(driver, on_log=on_log)
        return True

    driver.get(SITE_BOARD_URL)
    time.sleep(2.5)
    if resolve_registered_site(driver, site, on_log=on_log):
        _emit("  ✓ 사이트 목록 등록 확인 (소유 확인 완료로 간주)", on_log)
        return True

    _emit("  ⚠ 소유 확인 결과를 자동으로 확인하지 못했습니다.", on_log)
    return False
