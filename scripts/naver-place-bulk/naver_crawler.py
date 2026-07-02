"""네이버 지도 플레이스 크롤러 — 검색 후 목록을 클릭하며 수집 (봇 탐지 완화)"""

from __future__ import annotations

import random
import re
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote

from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from master_registry import normalize_place_name

SCRIPT_DIR = Path(__file__).parent
NAVER_HOME = "https://www.naver.com"
NAVER_LOGIN_URL = (
    "https://nid.naver.com/nidlogin.login?url=" + quote(NAVER_HOME, safe="")
)
MAP_HOME = "https://map.naver.com/"
MAX_PLACE_IMAGES = 3
LogFn = Callable[[str], None]
ReadyFn = Callable[[str], None]  # 사용자 [확인] 대기 (GUI에서 구현)
PlacePromptFn = Callable[[str], str]  # "collect" | "skip" | "done"


class CrawlStopped(Exception):
    """사용자가 수집 중지를 요청함."""


@dataclass
class PlaceData:
    name: str
    address: str
    phone: str
    description: str
    image_urls: list[str] = field(default_factory=list)
    naver_place_url: str = ""
    place_id: str = ""

    def to_api_payload(self) -> dict[str, Any]:
        return {
            "place_id": self.place_id or None,
            "name": self.name,
            "address": self.address,
            "phone": self.phone or None,
            "description": self.description,
            "image_urls": self.image_urls[:MAX_PLACE_IMAGES],
            "naver_place_url": self.naver_place_url,
        }


def _read_chrome_version_string() -> str | None:
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

    for chrome in (
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    ):
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


def _configure_modern_browser(driver, *, log: LogFn = print) -> None:
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
        log(f"  User-Agent 설정 스킵: {exc}")

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
        log(
            f"  경고: Chrome({installed})과 드라이버({running}) major 버전이 다릅니다. "
            "Chrome 업데이트 또는 'pip install -U undetected-chromedriver' 를 실행하세요."
        )
    else:
        log(f"  브라우저 버전: {running or version}")


def _parse_browser_version_from_error(exc: Exception) -> int | None:
    match = re.search(r"Current browser version is (\d+)", str(exc))
    return int(match.group(1)) if match else None


def create_chrome_driver(log: LogFn = print) -> webdriver.Chrome:
    """웹페이지수집요청과 동일 — undetected-chromedriver + Chrome 버전 맞춤."""
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
            _configure_modern_browser(driver, log=log)
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
                        _configure_modern_browser(driver, log=log)
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


def start_naver_browser(log: LogFn = print) -> webdriver.Chrome:
    """Chrome 실행 후 네이버 로그인 페이지로 이동 (웹페이지수집요청 방식)."""
    log("Chrome 브라우저 실행 (undetected-chromedriver)")
    major = get_chrome_major_version()
    if major:
        log(f"  감지된 Chrome 버전: {major}")
    driver = create_chrome_driver(log=log)
    driver.get(NAVER_LOGIN_URL)
    time.sleep(2.0)
    return driver


def _is_naver_logged_in(driver) -> bool:
    url = (driver.current_url or "").lower()
    return "nid.naver.com" not in url and "nidlogin" not in url


class NaverPlaceCrawler:
    CAPTCHA_TIMEOUT = 300
    MAP_HOME = MAP_HOME

    def __init__(
        self,
        delay: float = 2.0,
        use_profile: bool = True,
        log: LogFn = print,
        on_user_ready: ReadyFn | None = None,
        stop_event: threading.Event | None = None,
    ):
        self.delay = delay
        self.log = log
        self.on_user_ready = on_user_ready
        self.stop_event = stop_event
        self._map_ready = False
        self._list_page = 1
        self.driver = start_naver_browser(log)
        self.wait = WebDriverWait(self.driver, 25)
        self._prepare_naver_session()

    def close(self) -> None:
        try:
            self.driver.quit()
        except Exception:
            pass
        self.driver = None

    def _sleep(self, extra: float = 0) -> None:
        time.sleep(self.delay + extra + random.uniform(0.5, 1.5))

    def _check_stop(self) -> None:
        if self.stop_event and self.stop_event.is_set():
            raise CrawlStopped()

    def stop_requested(self) -> bool:
        return bool(self.stop_event and self.stop_event.is_set())

    def _page_has_captcha(self) -> bool:
        try:
            src = self.driver.page_source
            keywords = ("보안 문자", "보안문자", "보안 확인", "자동입력 방지")
            return any(k in src for k in keywords)
        except Exception:
            return False

    def _wait_user_ready(self, message: str, *, reason: str = "ready") -> None:
        if self.on_user_ready:
            self.log(message)
            self.on_user_ready(message)
            self._sleep(0.5)
            return

        if reason == "captcha":
            self._wait_captcha_poll()
            return

        self.log(message)
        self.log(f"  (GUI 없음 — {self.CAPTCHA_TIMEOUT // 60}분 후 자동 진행)")
        time.sleep(min(10, self.CAPTCHA_TIMEOUT))

    def _wait_captcha_poll(self) -> None:
        self.log("")
        self.log("=" * 44)
        self.log("⚠ 네이버 보안문자가 표시되었습니다!")
        self.log("  Chrome 창에서 보안문자를 입력해 주세요.")
        self.log(f"  → 최대 {self.CAPTCHA_TIMEOUT // 60}분 대기합니다...")
        self.log("=" * 44)

        start = time.time()
        while time.time() - start < self.CAPTCHA_TIMEOUT:
            if not self._page_has_captcha():
                self.log("✓ 보안문자 통과! 수집을 계속합니다.")
                self._sleep(1)
                return
            time.sleep(2)

        raise TimeoutError(
            "보안문자 입력 시간이 초과되었습니다. "
            "Chrome에서 네이버 로그인 후 다시 시도하세요."
        )

    def _wait_captcha_if_needed(self) -> None:
        if not self._page_has_captcha():
            return

        self._wait_user_ready(
            "⚠ 보안문자가 표시되었습니다.\n"
            "Chrome에서 입력한 뒤 프로그램의 [확인] 버튼을 눌러주세요.",
            reason="captcha",
        )

    def _prepare_naver_session(self) -> None:
        self.log("① 네이버 로그인 페이지 — 로그인을 완료해 주세요.")
        self._wait_user_ready(
            "Chrome에서 네이버 로그인을 완료해 주세요.\n"
            "캡차·2단계 인증은 직접 처리한 뒤,\n"
            "[확인 — 수집 시작]을 눌러주세요.",
            reason="login",
        )

        if not _is_naver_logged_in(self.driver):
            self.log("  ⚠ 아직 로그인 페이지입니다. 로그인 후 다시 시도해 주세요.")

        self.log("② 네이버 지도로 이동합니다...")
        self.driver.get(self.MAP_HOME)
        self._sleep(3)
        self._wait_captcha_if_needed()
        self._map_ready = True
        self.log("✓ 지도 준비 완료 — 검색·수집을 시작합니다.")

    def _human_click(self, element) -> None:
        self._safe_click(element)
        self._sleep(0.3)

    def _is_dom_error(self, exc: BaseException) -> bool:
        msg = str(exc).lower()
        return (
            isinstance(exc, StaleElementReferenceException)
            or "stale element" in msg
            or "no such element" in msg
            or "element not found" in msg
        )

    def _safe_click(self, element) -> None:
        """stale / element not found 대비 — JS 클릭 우선."""
        for attempt in range(3):
            try:
                self.driver.execute_script(
                    "arguments[0].scrollIntoView({block:'center', behavior:'instant'});",
                    element,
                )
                self._sleep(0.2)
                try:
                    element.click()
                except Exception:
                    self.driver.execute_script("arguments[0].click();", element)
                self._sleep(0.5)
                return
            except Exception as exc:
                if attempt < 2 and self._is_dom_error(exc):
                    self._sleep(0.5)
                    continue
                if attempt < 2:
                    self._sleep(0.4)
                    continue
                try:
                    ActionChains(self.driver).move_to_element(element).click().perform()
                    self._sleep(0.5)
                except Exception:
                    raise exc from exc
                return

    def _human_type(self, element, text: str) -> None:
        """검색창만 지우고 입력 (Ctrl+A 전체선택 사용 안 함)."""
        self._human_click(element)
        try:
            element.clear()
        except Exception:
            pass
        current = element.get_attribute("value") or ""
        for _ in range(len(current) + 3):
            element.send_keys(Keys.BACKSPACE)
        for ch in text:
            element.send_keys(ch)
            time.sleep(random.uniform(0.06, 0.18))
        self._sleep(0.3)

    def _switch_frame(self, frame_id: str) -> bool:
        self.driver.switch_to.default_content()
        try:
            self.wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, frame_id)))
            return True
        except Exception:
            return False

    def _top_document(self) -> None:
        self.driver.switch_to.default_content()

    def _text(self, *selectors: str) -> str:
        for sel in selectors:
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, sel)
                text = (el.text or el.get_attribute("textContent") or "").strip()
                if text:
                    return text
            except Exception:
                continue
        return ""

    def _field_by_blind_label(self, label: str) -> str:
        """place_blind 라벨(주소·전화번호 등)로 홈 탭 필드 추출."""
        try:
            for blind in self.driver.find_elements(By.CSS_SELECTOR, "span.place_blind"):
                if (blind.text or "").strip() != label:
                    continue
                block = blind.find_element(
                    By.XPATH, "./ancestor::div[contains(@class,'O8qbU')][1]"
                )
                if label == "주소":
                    for sel in ("span.pz7wy", "a.PkgBl span", "span.LDgIH"):
                        try:
                            el = block.find_element(By.CSS_SELECTOR, sel)
                            text = (el.text or el.get_attribute("textContent") or "").strip()
                            if text:
                                return text
                        except Exception:
                            continue
                if label == "전화번호":
                    for sel in ("span.xlx7Q", "span.Pxlxi"):
                        try:
                            el = block.find_element(By.CSS_SELECTOR, sel)
                            text = (el.text or "").strip()
                            if text:
                                return text
                        except Exception:
                            continue
                text = (block.text or "").replace(label, "", 1).strip()
                if text:
                    return text.split("\n")[0].strip()
        except Exception:
            pass
        return ""

    def _scrape_place_name(self) -> str:
        selectors = (
            "h1#_header",
            "h1.bh9OH",
            "h1[class*='bh9OH']",
            "span.GHAhO",
            "h2.GHAhO",
            "#_title span",
            "div.place_title",
        )
        name = self._text(*selectors)
        if name:
            return name

        self._top_document()
        for sel in selectors:
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, sel)
                text = (el.text or el.get_attribute("textContent") or "").strip()
                if text:
                    self._switch_frame("entryIframe")
                    return text
            except Exception:
                continue
        self._switch_frame("entryIframe")
        return ""

    def _ensure_map_home(self) -> None:
        if self._map_ready:
            return

        self.log("네이버 지도로 이동합니다...")
        self.driver.get(self.MAP_HOME)
        self._sleep(3)
        self._wait_captcha_if_needed()
        self._map_ready = True

    def _find_map_search_input(self):
        self._top_document()
        selectors = (
            "input.input_search",
            "input#search-input",
            "input[placeholder*='검색']",
            "input[role='combobox']",
            "div.search_box input",
        )
        for sel in selectors:
            try:
                el = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, sel)))
                if el.is_displayed():
                    return el
            except Exception:
                continue
        raise RuntimeError("지도 검색창을 찾지 못했습니다. Chrome에서 지도가 열렸는지 확인하세요.")

    def _wait_search_results(self, timeout: float = 20.0) -> list:
        """searchIframe 안에 업체 링크가 나타날 때까지 대기."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            self._top_document()
            if self._switch_frame("searchIframe"):
                links = self._find_place_links_in_frame()
                if links:
                    return links
            self._sleep(0.5)
        return []

    def _place_tab_url(self, place_id: str, tab: str = "home", query: str = "") -> str:
        if query:
            q = quote(query)
            place_path = quote(f"/{tab}", safe="")
            return (
                f"https://map.naver.com/p/search/{q}/place/{place_id}"
                f"?placePath={place_path}"
            )
        return f"https://map.naver.com/p/place/{place_id}/{tab}"

    def _open_place_tab(self, place_id: str, tab: str, query: str = "") -> bool:
        url = self._place_tab_url(place_id, tab, query)
        self.log(f"    → {tab} 탭: place/{place_id}")
        self._top_document()
        current_pid = self._place_id_from_url(self.driver.current_url or "")
        if current_pid == place_id and tab == "home":
            if self._switch_frame("entryIframe"):
                return True
        self.driver.get(url)
        self._sleep(2.5)
        self._wait_captcha_if_needed()
        return self._wait_entry_frame()

    def _ensure_entry_frame(self) -> bool:
        self._top_document()
        if self._switch_frame("entryIframe"):
            return True
        return self._wait_entry_frame()

    def _click_panel_tab(self, tab: str) -> bool:
        """상세 패널 안에서 홈/정보/사진 탭 클릭."""
        tab_map = {
            "home": ("홈", "home"),
            "information": ("정보", "information"),
            "photo": ("사진", "photo"),
        }
        label, path_key = tab_map.get(tab, (tab, tab))
        selectors = (
            "a[href*='information']",
            "a[href*='photo']",
            "a[href*='home']",
            "a[role='tab']",
            "a._tab-menu",
        )
        candidates: list = []
        for sel in selectors:
            try:
                candidates.extend(self.driver.find_elements(By.CSS_SELECTOR, sel))
            except Exception:
                continue

        seen: set[str] = set()
        for el in candidates:
            try:
                if self._is_save_or_bookmark_element(el):
                    continue
                text = (el.text or el.get_attribute("textContent") or "").strip()
                href = (el.get_attribute("href") or "").lower()
                key = f"{text}|{href}"
                if key in seen:
                    continue
                seen.add(key)
                if label in text or (
                    path_key in href and ("/place/" in href or "placepath" in href)
                ):
                    self._safe_click(el)
                    self._sleep(1.2)
                    return True
            except Exception:
                continue
        return False

    def _switch_place_tab(self, place_id: str, query: str, tab: str) -> bool:
        self._top_document()
        if self._switch_frame("entryIframe") and self._click_panel_tab(tab):
            return True
        return self._open_place_tab(place_id, tab, query)

    def _scrape_home_fields(self, fallback_name: str = "") -> tuple[str, str, str]:
        name = self._scrape_place_name() or (fallback_name or "").strip()
        address = self._field_by_blind_label("주소") or self._text(
            "a.PkgBl span.pz7wy",
            "span.pz7wy",
            "span.LDgIH",
            "a.PkgBl span",
            "a.LDgIH",
            "span.IH7VW",
        )
        phone = self._field_by_blind_label("전화번호") or self._text(
            "span.xlx7Q", "a.tel", "span.Pxlxi"
        )
        if not phone:
            try:
                tel = self.driver.find_element(By.CSS_SELECTOR, "a[href^='tel:']")
                phone = (tel.get_attribute("href") or "").replace("tel:", "").strip()
            except Exception:
                pass
        return name, address, phone

    def _wait_entry_frame(self) -> bool:
        for _ in range(16):
            self._top_document()
            if self._switch_frame("entryIframe"):
                return True
            self._sleep(0.5)
        return False

    def _is_unwanted_navigation_url(self, url: str) -> bool:
        """플레이스 상세가 아닌 저장·등록·수정 제안 페이지."""
        u = (url or "").lower()
        if "smartplace.naver.com" in u:
            return True
        if "home-engage" in u or "moredetail" in u:
            return True
        if "place/manage" in u or "place/register" in u:
            return True
        return False

    def _is_save_or_bookmark_element(self, el) -> bool:
        """목록·상세의 저장(찜)·공유·수정 제안 버튼."""
        try:
            href = (el.get_attribute("href") or "").lower()
            if self._is_unwanted_navigation_url(href):
                return True
            for attr in ("aria-label", "title", "data-clickcode"):
                val = (el.get_attribute(attr) or "").strip()
                lower = val.lower()
                if any(
                    k in val
                    for k in ("저장", "찜", "북마크", "내 장소", "수정 제안", "플레이스 등록")
                ):
                    return True
                if any(k in lower for k in ("save", "bookmark", "zzim", "favorite")):
                    return True
            text = (el.text or el.get_attribute("textContent") or "").strip()
            if text in ("저장", "찜", "공유", "수정"):
                return True
            cls = (el.get_attribute("class") or "").lower()
            if any(
                n in cls
                for n in ("bookmark", "zzim", "save", "favorite", "clip", "pin")
            ):
                return True
        except Exception:
            pass
        return False

    def _recover_from_unwanted_page(self, search_url: str = "") -> None:
        """저장/등록 페이지로 잘못 이동했을 때 검색·상세로 복귀."""
        self.log("    ⚠ 저장·등록 페이지로 이동됨 — 뒤로가기로 복귀")
        self._top_document()
        for _ in range(4):
            url = self.driver.current_url or ""
            if not self._is_unwanted_navigation_url(url):
                if search_url and "/search/" in url:
                    break
                if self._place_id_from_url(url):
                    break
                if self._switch_frame("entryIframe"):
                    break
            try:
                self.driver.back()
                self._sleep(1.2)
            except Exception:
                break
        if search_url and self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.driver.get(search_url)
            self._sleep(2)
        self._wait_captcha_if_needed()

    def _get_place_click_target(self, row):
        """업체명(span.YwYLL)만 클릭 — 행 좌측 저장·찜 버튼 회피."""
        try:
            name_el = row.find_element(By.CSS_SELECTOR, "span.YwYLL")
            if name_el.is_displayed() and not self._is_save_or_bookmark_element(name_el):
                return name_el
        except Exception:
            pass
        link = self._get_place_row_link(row)
        if link and not self._is_save_or_bookmark_element(link):
            return link
        return None

    def _safe_click_place_target(self, row) -> bool:
        target = self._get_place_click_target(row)
        if not target:
            return False
        self._safe_click(target)
        return True

    def _is_external_ad_href(self, href: str) -> bool:
        """플레이스 패널이 아닌 외부·광고 URL."""
        h = (href or "").strip().lower()
        if not h or h in ("#", "javascript:void(0)", "javascript:;"):
            return False
        if h.startswith("http"):
            if "map.naver.com" in h and "/place/" in h:
                return False
            if "smartplace.naver.com" in h:
                return True
            return True
        ad_hints = (
            "adcr",
            "/ad/",
            "powerlink",
            "saedu",
            "clickchoice",
            "nid_ad",
            "advert",
            "sponsor",
            "banner",
        )
        return any(x in h for x in ad_hints)

    def _is_place_name_link(self, link) -> bool:
        """플레이스 업체 이름 링크 (배너·외부 광고·저장 버튼 제외)."""
        try:
            if self._is_save_or_bookmark_element(link):
                return False
            if self._is_ad_link(link):
                return False
            href = (link.get_attribute("href") or "").strip()
            if self._is_external_ad_href(href):
                return False
            classes = link.get_attribute("class") or ""
            if "U70Fj" in classes:
                try:
                    link.find_element(By.CSS_SELECTOR, "span.YwYLL")
                    return True
                except Exception:
                    pass
            if "place_bluelink" in classes:
                return True
            if "/place/" in href:
                return True
            try:
                link.find_element(By.CSS_SELECTOR, "span.YwYLL")
                return True
            except Exception:
                pass
        except Exception:
            pass
        return False

    def _get_place_row_link(self, row):
        """목록 행에서 플레이스 업체 이름 링크만 반환."""
        try:
            name_el = row.find_element(By.CSS_SELECTOR, "span.YwYLL")
            link = name_el.find_element(By.XPATH, "./ancestor::a[1]")
            if self._is_place_name_link(link):
                return link
        except Exception:
            pass
        for sel in (
            "a.U70Fj.k4f_J",
            "a.U70Fj",
            "a.place_bluelink",
            "a[class*='place_bluelink']",
        ):
            try:
                link = row.find_element(By.CSS_SELECTOR, sel)
                if self._is_place_name_link(link):
                    return link
            except Exception:
                continue
        return None

    def _is_place_list_row(self, row) -> bool:
        """검색 목록의 실제 플레이스 업체 행인지."""
        if self._row_is_ad(row):
            return False
        try:
            tag = (row.tag_name or "").lower()
            if tag not in ("li", "div"):
                return False
        except Exception:
            return False
        if self._get_place_row_link(row):
            return True
        try:
            row.find_element(By.CSS_SELECTOR, "a.place_thumb")
            row.find_element(By.CSS_SELECTOR, "span.YwYLL")
            return True
        except Exception:
            pass
        return False

    def _verify_place_detail_opened(self) -> bool:
        """클릭 후 플레이스 상세가 열렸는지."""
        self._top_document()
        url = self.driver.current_url or ""
        if self._is_unwanted_navigation_url(url):
            return False
        if self._place_id_from_url(url):
            return True
        if self._switch_frame("entryIframe"):
            return True
        return False

    def _is_ad_link(self, link) -> bool:
        """광고 항목 제외."""
        try:
            block = link.find_element(By.XPATH, "./ancestor::li[1]")
            text = (block.text or "")[:120]
            html = (block.get_attribute("outerHTML") or "").lower()
            if text.startswith("광고") or "\n광고\n" in text or text.strip() == "광고":
                return True
            if "ad_badge" in html or "adbadge" in html or "place_ad" in html:
                return True
            if "광고" in text.split("\n")[0]:
                return True
            if re.search(r"class=\"[^\"]*\bad[_-]", html):
                return True
            try:
                block.find_element(By.CSS_SELECTOR, "[class*='ad_badge'], [class*='place_ad'], em.ad")
                return True
            except Exception:
                pass
        except Exception:
            pass
        try:
            label = (link.get_attribute("aria-label") or "").strip()
            if "광고" in label:
                return True
        except Exception:
            pass
        try:
            href = (link.get_attribute("href") or "").strip()
            if self._is_external_ad_href(href):
                return True
        except Exception:
            pass
        title = (link.text or link.get_attribute("textContent") or "").strip()
        if title == "광고" or title.startswith("광고 "):
            return True
        return False

    def _row_is_ad(self, row) -> bool:
        try:
            text = (row.text or "")[:200]
            html = (row.get_attribute("outerHTML") or "").lower()
            if text.startswith("광고") or text.strip() == "광고":
                return True
            if "\n광고\n" in text or text.split("\n")[0].strip() == "광고":
                return True
            if "ad_badge" in html or "adbadge" in html or "place_ad" in html:
                return True
            if re.search(r"class=\"[^\"]*\bad[_-]", html):
                return True
            ad_class_hints = (
                "ad_area",
                "ad_banner",
                "banner_ad",
                "place_banner",
                "sponsored",
                "powerlink",
                "ad_item",
                "adcard",
            )
            if any(h in html for h in ad_class_hints):
                return True
            try:
                row.find_element(
                    By.CSS_SELECTOR,
                    "[class*='ad_badge'], [class*='place_ad'], em.ad, [class*='AdArea']",
                )
                return True
            except Exception:
                pass
            # 플레이스 업체명(span.YwYLL) 없이 외부 링크만 있으면 배너 광고
            has_place_name = "ywyll" in html
            if not has_place_name:
                try:
                    row.find_element(By.CSS_SELECTOR, "span.YwYLL")
                    has_place_name = True
                except Exception:
                    pass
            if not has_place_name:
                for a in row.find_elements(By.CSS_SELECTOR, "a[href]"):
                    href = a.get_attribute("href") or ""
                    if self._is_external_ad_href(href):
                        return True
                if "oncelazyload-placeholder" in html and "place_thumb" not in html:
                    return True
            # 출발/도착만 있는 행은 플레이스가 아님
            if not has_place_name and ("출발" in text and "도착" in text):
                return True
        except Exception:
            pass
        return False

    def _extract_row_name(self, row) -> str:
        """목록 행에서 업체명만 추출 (span.YwYLL 우선)."""
        try:
            el = row.find_element(By.CSS_SELECTOR, "span.YwYLL")
            name = (el.text or el.get_attribute("textContent") or "").strip()
            if name:
                return name
        except Exception:
            pass
        try:
            img = row.find_element(By.CSS_SELECTOR, "img.K0PDV, img[alt]")
            alt = (img.get_attribute("alt") or "").strip()
            if alt and alt not in ("광고",):
                return alt
        except Exception:
            pass
        return (row.text or "").split("\n")[0].strip()[:50]

    def _list_non_ad_rows(self) -> list:
        """검색 목록 행(li) — 플레이스 업체만, 광고·배너 제외."""
        row_selectors = (
            "#_pcmap_list_scroll_container > ul > li",
            "#_pcmap_list_scroll_container li.VLTHu",
            "li.VLTHu",
            "li.UEzoS",
        )
        rows: list = []
        seen_keys: set[str] = set()

        for sel in row_selectors:
            try:
                candidates = self.driver.find_elements(By.CSS_SELECTOR, sel)
            except Exception:
                continue

            for row in candidates:
                try:
                    if not row.is_displayed():
                        continue
                    if not self._is_place_list_row(row):
                        continue
                    title = self._extract_row_name(row)
                    if not title or title == "광고":
                        continue
                    key = normalize_place_name(title)
                    if not key or key in seen_keys:
                        continue
                    seen_keys.add(key)
                    rows.append(row)
                except Exception:
                    continue

            if rows:
                return rows

        return rows

    def _snapshot_list_rows(self) -> list[dict[str, str]]:
        """현재 화면 목록을 place_id·이름만 추출 (DOM 참조 보관 안 함)."""
        snapshots: list[dict[str, str]] = []
        seen: set[str] = set()
        for row in self._list_non_ad_rows():
            try:
                pid = self._extract_id_from_row(row)
                title = self._extract_row_name(row)
                key = pid or normalize_place_name(title)
                if not key or key in seen:
                    continue
                seen.add(key)
                snapshots.append({"place_id": pid or "", "title": title})
            except Exception:
                continue
        return snapshots

    def _name_matches_known(self, norm: str, known_names: set[str]) -> bool:
        """정규화된 업체명이 마스터 목록과 일치하는지 (부분 일치 포함)."""
        if not norm:
            return False
        if norm in known_names:
            return True
        for known in known_names:
            if len(known) >= 3 and (known in norm or norm in known):
                return True
        return False

    def _is_known_place(
        self,
        *,
        place_id: str,
        title: str,
        known_ids: set[str],
        known_names: set[str],
    ) -> bool:
        pid = (place_id or "").strip()
        if pid and pid in known_ids:
            return True
        norm = normalize_place_name(title)
        return self._name_matches_known(norm, known_names)

    def _row_matches_target(
        self,
        *,
        pid: str,
        row_title: str,
        title_key: str,
        target: str,
    ) -> bool:
        row_key = normalize_place_name(row_title)
        if target and pid == target:
            return True
        if not title_key:
            return False
        if row_key == title_key:
            return True
        if title_key in row_key or row_key in title_key:
            return True
        return False

    def _find_matching_list_row(
        self,
        *,
        place_id: str = "",
        title: str = "",
    ):
        target = (place_id or "").strip()
        title_key = normalize_place_name(title)
        if not target and not title_key:
            return None
        for row in self._list_non_ad_rows():
            try:
                pid = self._extract_id_from_row(row)
                row_title = self._extract_row_name(row)
                if self._row_matches_target(
                    pid=pid,
                    row_title=row_title,
                    title_key=title_key,
                    target=target,
                ):
                    return row
            except Exception:
                continue
        return None

    def _scroll_list_to_top(self) -> None:
        if not self._switch_frame("searchIframe"):
            return
        for sel in ("#_pcmap_list_scroll_container", ".Ryr1F", "div[role='list']"):
            try:
                container = self.driver.find_element(By.CSS_SELECTOR, sel)
                self.driver.execute_script("arguments[0].scrollTop = 0;", container)
                self._sleep(0.5)
                return
            except Exception:
                continue

    def _ensure_row_visible(
        self,
        *,
        place_id: str = "",
        title: str = "",
        max_scrolls: int = 50,
    ) -> bool:
        """가상 스크롤 목록에서 업체 행이 보일 때까지 스크롤."""
        target = (place_id or "").strip()
        title_key = normalize_place_name(title)
        if not target and not title_key:
            return False

        self._top_document()
        self._scroll_list_to_top()

        for _ in range(max_scrolls):
            if not self._switch_frame("searchIframe"):
                return False
            row = self._find_matching_list_row(place_id=target, title=title)
            if row:
                try:
                    self.driver.execute_script(
                        "arguments[0].scrollIntoView({block:'center'});",
                        row,
                    )
                    self._sleep(0.6)
                except Exception:
                    pass
                return True
            if not self._scroll_list_down():
                break
        return False

    def _click_row_fresh(self, *, place_id: str = "", title: str = "") -> str:
        """목록을 다시 읽고 해당 행 클릭 → place_id."""
        target = (place_id or "").strip()
        title_key = normalize_place_name(title)

        if not self._ensure_row_visible(place_id=target, title=title):
            return ""

        for attempt in range(3):
            if not self._switch_frame("searchIframe"):
                return ""
            row = self._find_matching_list_row(place_id=target, title=title)
            if not row:
                self._sleep(0.6)
                continue
            try:
                pid = self._extract_id_from_row(row)
                row_title = self._extract_row_name(row)
                label = row_title or target or title or "(업체)"
                try:
                    self.driver.execute_script(
                        "arguments[0].scrollIntoView({block:'center'});",
                        row,
                    )
                    self._sleep(0.4)
                except Exception:
                    pass
                self.log(f"    → 목록 클릭: {label}")
                if not self._safe_click_place_target(row):
                    self._sleep(0.4)
                    continue

                self._sleep(2.0)
                self._wait_captcha_if_needed()
                if self._is_unwanted_navigation_url(self.driver.current_url or ""):
                    self.log(f"    ⊘ 저장/등록 페이지 오클릭 — 스킵: {label}")
                    self._recover_from_unwanted_page()
                    self._switch_frame("searchIframe")
                    continue
                if not self._verify_place_detail_opened():
                    self.log(f"    ⊘ 광고/배너 항목 — 스킵: {label}")
                    self._top_document()
                    try:
                        self.driver.back()
                        self._sleep(1.0)
                    except Exception:
                        pass
                    self._switch_frame("searchIframe")
                    continue
                return (
                    self._place_id_from_url(self.driver.current_url or "")
                    or pid
                    or target
                )
            except Exception as exc:
                if self._is_dom_error(exc):
                    break
                continue
            self._sleep(0.6)

        return ""

    def _extract_id_from_row(self, row) -> str:
        """목록 행 HTML에서 place ID 추출 (클릭 없음)."""
        try:
            html = row.get_attribute("outerHTML") or ""
        except Exception:
            return ""

        for pattern in (
            r'data-cid="(\d+)"',
            r'data-id="(\d+)"',
            r'data-place-id="(\d+)"',
            r'/place/(\d+)',
            r'"id":"(\d{8,12})"',
        ):
            m = re.search(pattern, html)
            if m:
                return m.group(1)

        try:
            for link in row.find_elements(By.CSS_SELECTOR, "a"):
                pid = self._place_id_from_link(link)
                if pid:
                    return pid
        except Exception:
            pass

        return ""

    def _click_row_get_id(self, row) -> str:
        """목록 행 1회 클릭 → URL에서 place ID (검색으로 돌아가지 않음)."""
        title = self._extract_row_name(row) or "(업체)"
        self.log(f"    → 목록 클릭: {title}")
        if not self._safe_click_place_target(row):
            return ""

        self._sleep(2.2)
        self._wait_captcha_if_needed()

        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.log(f"    ⊘ 저장/등록 페이지 오클릭 — 스킵: {title}")
            self._recover_from_unwanted_page()
            return ""

        if not self._verify_place_detail_opened():
            self.log(f"    ⊘ 광고/배너 항목 — 스킵: {title}")
            return ""

        pid = self._place_id_from_url(self.driver.current_url or "")
        if not pid:
            self._wait_detail_panel()
            pid = self._place_id_from_url(self.driver.current_url or "")
        return pid

    def _return_to_search(self, search_url: str) -> None:
        """검색 목록으로 복귀 — 뒤로가기 우선(스크롤 위치 유지), 실패 시 URL 이동."""
        self.log("    ← 검색 목록으로 복귀")
        self._top_document()
        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self._recover_from_unwanted_page(search_url)
            self._switch_frame("searchIframe")
            return
        restored = False
        for _ in range(3):
            try:
                url = self.driver.current_url or ""
                if "/search/" in url and "/place/" not in url:
                    restored = True
                    break
                self.driver.back()
                self._sleep(1.2)
            except Exception:
                break
        if not restored:
            self.driver.get(search_url)
            self._sleep(2)
        self._wait_captcha_if_needed()
        self._switch_frame("searchIframe")

    def _open_row(self, row) -> tuple[str, bool]:
        """목록 행 클릭 → (place_id, 이미 상세 열림 여부)."""
        pid = self._extract_id_from_row(row)
        title = self._extract_row_name(row) or (row.text or "").split("\n")[0].strip()[:36]
        self.log(f"    → 목록 클릭: {title}")
        if not self._safe_click_place_target(row):
            return "", False
        self._sleep(2.0)
        self._wait_captcha_if_needed()
        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.log(f"    ⊘ 저장/등록 페이지 오클릭 — 스킵: {title}")
            self._recover_from_unwanted_page()
            return "", False
        if not self._verify_place_detail_opened():
            self.log(f"    ⊘ 광고/배너 항목 — 스킵: {title}")
            return "", False
        opened = self._place_id_from_url(self.driver.current_url or "") or pid
        return opened, True

    def _find_place_links_in_frame(self) -> list:
        """검색 iframe 안의 업체 링크 (광고·배너 제외)."""
        selectors = (
            "a.U70Fj",
            "a.place_bluelink",
            "a[class*='place_bluelink']",
            "a[href*='/place/']",
        )
        seen_keys: set[str] = set()
        found: list = []

        for sel in selectors:
            try:
                candidates = self.driver.find_elements(By.CSS_SELECTOR, sel)
            except Exception:
                continue

            for link in candidates:
                try:
                    if not link.is_displayed():
                        continue
                    if not self._is_place_name_link(link):
                        continue
                    title = (link.text or link.get_attribute("textContent") or "").strip()
                    href = link.get_attribute("href") or ""
                    if not title and "/place/" not in href:
                        continue
                    if title == "광고" or title.startswith("광고 "):
                        continue
                    key = self._place_id_from_link(link) or href or title
                    if not key or key in seen_keys:
                        continue
                    seen_keys.add(key)
                    found.append(link)
                except Exception:
                    continue

            if found:
                return found

        return found

    def _normalize_collected_images(self, urls: list[str]) -> list[str]:
        """프록시 URL → ldb-phinf 원본 URL."""
        from image_uploader import normalize_image_urls

        return normalize_image_urls(urls, max_count=MAX_PLACE_IMAGES)

    def _collect_place_images(self) -> list[str]:
        urls: list[str] = []
        try:
            imgs = self.driver.find_elements(By.CSS_SELECTOR, "img")
        except Exception:
            return urls

        for img in imgs:
            try:
                src = img.get_attribute("src") or img.get_attribute("data-src") or ""
            except Exception:
                continue
            if not src or "pstatic.net" not in src:
                continue
            if "icon" in src or "logo" in src.lower():
                continue
            src = re.sub(r"type=[a-z_]+", "type=w1080", src)
            if src not in urls:
                urls.append(src)
            if len(urls) >= MAX_PLACE_IMAGES:
                break
        return self._normalize_collected_images(urls)

    def scrape_place_by_id(
        self,
        place_id: str,
        query: str = "",
        *,
        already_open: bool = False,
        fallback_name: str = "",
    ) -> PlaceData | None:
        """place ID로 홈 → 정보 → 사진 탭 순서 수집."""
        self._top_document()
        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.log("    ⚠ 저장/등록 페이지 감지 — 복귀 후 재시도")
            self._recover_from_unwanted_page(
                f"https://map.naver.com/p/search/{quote(query)}" if query else ""
            )

        place_url = self._place_tab_url(place_id, "home", query)

        if already_open:
            self._top_document()
            if not self._ensure_entry_frame():
                already_open = False

        if not already_open:
            if not self._open_place_tab(place_id, "home", query):
                self.log("    ⚠ 홈 탭 로드 실패")
                return None

        if not self._ensure_entry_frame():
            self.log("    ⚠ 상세 패널(entryIframe) 로드 실패")
            return None

        self._switch_place_tab(place_id, query, "home")
        self._ensure_entry_frame()
        self._sleep(1.2)

        self.log("    [1/3] 홈 — 이름·주소·전화")
        name, address, phone = self._scrape_home_fields(fallback_name)
        if name:
            self.log(f"         이름: {name}")
        if address:
            self.log(f"         주소: {address[:30]}…")
        if phone:
            self.log(f"         전화: {phone}")

        description = ""
        self.log("    [2/3] 정보 — 소개글")
        if self._switch_place_tab(place_id, query, "information"):
            self._ensure_entry_frame()
            self._sleep(1)
            description = self._text(
                "div.AX_W3._6sPQ",
                "div.AX_W3",
                "div.zPfVt",
                "div.place_section_content",
            )
            if description:
                self.log(f"         소개: {description[:40]}…")
        else:
            self.log("         ⚠ 정보 탭 실패 — 홈 데이터만 사용")

        image_urls: list[str] = []
        self.log("    [3/3] 사진 — 이미지 수집 (최대 3장)")
        if self._switch_place_tab(place_id, query, "photo"):
            self._ensure_entry_frame()
            self._sleep(1.5)
            image_urls = self._collect_place_images()
        else:
            self.log("         ⚠ 사진 탭 실패 — 홈 이미지 사용")
            image_urls = self._collect_place_images()
        self.log(f"         사진 {len(image_urls)}장")

        if not name or not address:
            self.log("    → 홈 탭 재시도 (이름·주소)")
            self._switch_place_tab(place_id, query, "home")
            self._ensure_entry_frame()
            self._sleep(1)
            name2, address2, phone2 = self._scrape_home_fields(fallback_name)
            name = name or name2
            address = address or address2
            phone = phone or phone2
            if name:
                self.log(f"         이름: {name}")
            if address:
                self.log(f"         주소: {address[:30]}…")

        if not name or not address:
            self.log(f"    ⚠ 필수 정보 누락: name={bool(name)} address={bool(address)}")
            return None

        return PlaceData(
            name=name,
            address=address,
            phone=phone,
            description=description or f"{name} 애견미용학원입니다.",
            image_urls=image_urls,
            naver_place_url=place_url,
            place_id=place_id,
        )

    def _search_on_map(self, query: str) -> None:
        self._ensure_map_home()
        self.log(f"  검색창에 입력: {query}")
        search_input = self._find_map_search_input()
        self._human_type(search_input, query)
        search_input.send_keys(Keys.ENTER)
        self._sleep(2.5)
        self._wait_captcha_if_needed()

        links = self._wait_search_results(timeout=12)
        if links:
            self.log(f"  ✓ 검색 결과 {len(links)}개 확인")
            return

        self.log("  ⚠ 검색창 입력으로 목록이 안 보임 → URL 검색으로 재시도")
        self._top_document()
        search_url = f"https://map.naver.com/p/search/{quote(query)}"
        self.driver.get(search_url)
        self._sleep(3)
        self._wait_captcha_if_needed()

        links = self._wait_search_results(timeout=15)
        if not links:
            raise RuntimeError(
                "검색 결과 목록을 찾지 못했습니다.\n"
                "Chrome에서 지도 검색 결과가 보이는지 확인하세요."
            )
        self.log(f"  ✓ URL 검색 결과 {len(links)}개 확인")

    def _scroll_list_down(self) -> bool:
        selectors = ("#_pcmap_list_scroll_container", ".Ryr1F", "div[role='list']")
        for sel in selectors:
            try:
                container = self.driver.find_element(By.CSS_SELECTOR, sel)
                self.driver.execute_script(
                    "arguments[0].scrollTop = arguments[0].scrollTop + 520;",
                    container,
                )
                self._sleep(1.2)
                return True
            except Exception:
                continue
        return False

    def _scroll_list_to_bottom(self) -> bool:
        """목록 맨 아래(페이지 번호 영역)까지 스크롤."""
        if not self._switch_frame("searchIframe"):
            return False
        for sel in ("#_pcmap_list_scroll_container", ".Ryr1F", "div[role='list']"):
            try:
                container = self.driver.find_element(By.CSS_SELECTOR, sel)
                self.driver.execute_script(
                    "arguments[0].scrollTop = arguments[0].scrollHeight;",
                    container,
                )
                self._sleep(1.0)
                return True
            except Exception:
                continue
        return False

    def _list_scroll_at_bottom(self) -> bool:
        if not self._switch_frame("searchIframe"):
            return False
        try:
            container = self.driver.find_element(
                By.CSS_SELECTOR, "#_pcmap_list_scroll_container"
            )
            top, height, client = self.driver.execute_script(
                "return [arguments[0].scrollTop, arguments[0].scrollHeight,"
                " arguments[0].clientHeight];",
                container,
            )
            return float(top) + float(client) >= float(height) - 24
        except Exception:
            return False

    def _pagination_links(self) -> list:
        if not self._switch_frame("searchIframe"):
            return []
        selectors = (
            "div.zRM9F a",
            "div.XUrfU div.zRM9F a",
            ".cmm_page_wrap a",
            "[class*='pagination'] a",
        )
        for sel in selectors:
            try:
                links = [
                    a
                    for a in self.driver.find_elements(By.CSS_SELECTOR, sel)
                    if a.is_displayed()
                ]
                if links:
                    return links
            except Exception:
                continue
        return []

    def _read_active_list_page(self) -> int:
        try:
            if not self._switch_frame("searchIframe"):
                return self._list_page
            for sel in (
                "div.zRM9F a[aria-current='page']",
                "div.zRM9F a.on",
                "div.zRM9F a[aria-selected='true']",
                "div.zRM9F strong",
            ):
                try:
                    el = self.driver.find_element(By.CSS_SELECTOR, sel)
                    text = (el.text or "").strip()
                    if text.isdigit():
                        return int(text)
                except Exception:
                    continue
            for link in self._pagination_links():
                cls = (link.get_attribute("class") or "").lower()
                aria = (link.get_attribute("aria-current") or "").lower()
                if "on" in cls or aria in ("page", "true"):
                    text = (link.text or "").strip()
                    if text.isdigit():
                        return int(text)
        except Exception:
            pass
        return self._list_page

    def _click_list_page_number(self, page: int) -> bool:
        if not self._switch_frame("searchIframe"):
            return False
        target = str(page)
        for link in self._pagination_links():
            if (link.text or "").strip() == target:
                try:
                    self._safe_click(link)
                    return True
                except Exception:
                    return False
        try:
            el = self.driver.find_element(
                By.XPATH,
                f"//div[contains(@class,'zRM9F')]//a[normalize-space()='{target}']",
            )
            self._safe_click(el)
            return True
        except Exception:
            return False

    def _click_list_next_arrow(self) -> bool:
        if not self._switch_frame("searchIframe"):
            return False
        for sel in ("a.cmm_pg_next", ".cmm_pg_next"):
            try:
                el = self.driver.find_element(By.CSS_SELECTOR, sel)
                if not el.is_displayed():
                    continue
                if (el.get_attribute("aria-disabled") or "").lower() == "true":
                    return False
                self._safe_click(el)
                return True
            except Exception:
                continue
        try:
            links = self._pagination_links()
            if not links:
                return False
            last = links[-1]
            text = (last.text or "").strip()
            label = (last.get_attribute("aria-label") or "").lower()
            if text.isdigit():
                return False
            if text in (">", "›", "»", "다음") or "다음" in label or "next" in label:
                if (last.get_attribute("aria-disabled") or "").lower() == "true":
                    return False
                self._safe_click(last)
                return True
        except Exception:
            pass
        return False

    def _go_to_next_list_page(self, *, max_pages: int = 20) -> bool:
        """목록 하단 페이지 번호(2, 3…) 또는 다음(>) 버튼으로 이동."""
        if self._list_page >= max_pages:
            return False
        if not self._switch_frame("searchIframe"):
            return False

        self._scroll_list_to_bottom()
        self._sleep(0.8)
        before = self._read_active_list_page()
        next_num = before + 1

        clicked = False
        if self._click_list_page_number(next_num):
            clicked = True
        elif self._click_list_next_arrow():
            clicked = True

        if not clicked:
            return False

        self._sleep(2.0)
        self._wait_captcha_if_needed()
        after = self._read_active_list_page()
        if after <= before:
            after = next_num
        self._list_page = after
        self._scroll_list_to_top()
        return True

    def _list_search_rows(self) -> list:
        """검색 결과 — 업체 링크 목록 (행 또는 a 태그)."""
        links = self._find_place_links_in_frame()
        if links:
            return links

        row_selectors = (
            "#_pcmap_list_scroll_container li.VLTHu",
            "li.VLTHu",
            "li.UEzoS",
        )
        rows: list = []
        seen_keys: set[str] = set()

        for sel in row_selectors:
            try:
                candidates = self.driver.find_elements(By.CSS_SELECTOR, sel)
            except Exception:
                continue

            for row in candidates:
                try:
                    if not row.is_displayed():
                        continue
                    if not self._is_place_list_row(row):
                        continue
                    link = self._get_place_row_link(row)
                    if not link:
                        continue
                    title = (link.text or self._extract_row_name(row) or "").strip()
                    key = self._place_id_from_link(link) or title
                    if not key or key in seen_keys:
                        continue
                    seen_keys.add(key)
                    rows.append(link)
                except Exception:
                    continue

            if rows:
                return rows

        return rows

    def _click_place_link(self, link) -> tuple[str, str, str]:
        """업체 링크 클릭 → 상세 패널 열기."""
        if not self._is_place_name_link(link):
            return "", "", ""
        if self._is_save_or_bookmark_element(link):
            return "", "", ""
        title = (link.text or link.get_attribute("textContent") or "").strip()
        place_id = self._place_id_from_link(link)
        place_url = link.get_attribute("href") or ""

        self.log(f"    → '{title or place_id or '업체'}' 클릭 (상세 진입)")
        try:
            name_el = link.find_element(By.CSS_SELECTOR, "span.YwYLL")
            self._human_click(name_el)
        except Exception:
            self._human_click(link)
        self._sleep(2.5)
        self._wait_captcha_if_needed()
        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.log(f"    ⊘ 저장/등록 페이지 오클릭 — 스킵: {title or place_id}")
            self._recover_from_unwanted_page()
            return "", "", ""
        self._wait_detail_panel()

        if not place_id:
            place_id = self._place_id_from_url(self.driver.current_url or "")
        if not place_id:
            self._top_document()
            if self._switch_frame("entryIframe"):
                for a in self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/place/']"):
                    place_id = self._place_id_from_url(a.get_attribute("href") or "")
                    if place_id:
                        place_url = a.get_attribute("href") or place_url
                        break

        return place_id, title, place_url

    def _click_row_and_open_detail(self, row) -> tuple[str, str, str]:
        """목록 1줄 또는 링크 클릭 → 상세 패널 열기."""
        tag = (row.tag_name or "").lower()
        if tag == "a":
            return self._click_place_link(row)
        link = self._get_place_row_link(row)
        if not link:
            return "", "", ""
        return self._click_place_link(link)

    def _wait_detail_panel(self) -> bool:
        """오른쪽 상세 패널(entryIframe) 로딩 대기."""
        self._top_document()
        for _ in range(12):
            if self._switch_frame("entryIframe"):
                name = self._scrape_place_name()
                if name:
                    return True
            self._sleep(0.5)
        return False

    def _place_id_from_url(self, url: str) -> str:
        m = re.search(r"/place/(\d+)", url or "")
        return m.group(1) if m else ""

    def _place_id_from_link(self, link) -> str:
        href = link.get_attribute("href") or ""
        pid = self._place_id_from_url(href)
        if pid:
            return pid

        for attr in ("data-cid", "data-id", "data-place-id", "data-nclicks"):
            val = (link.get_attribute(attr) or "").strip()
            if val.isdigit() and len(val) >= 6:
                return val

        try:
            onclick = link.get_attribute("onclick") or ""
            m = re.search(r"place[/\"'](\d+)", onclick)
            if m:
                return m.group(1)
            m = re.search(r"(\d{8,12})", onclick)
            if m:
                return m.group(1)
        except Exception:
            pass

        try:
            block = link.find_element(By.XPATH, "./ancestor::li[1]")
            html = block.get_attribute("outerHTML") or ""
            m = re.search(r'data-cid="(\d+)"', html)
            if m:
                return m.group(1)
            m = re.search(r"/place/(\d+)", html)
            if m:
                return m.group(1)
        except Exception:
            pass

        return ""

    def _resolve_place_id(self, link, search_url: str = "") -> str:
        """링크에서 place ID 추출 — 없으면 1회 클릭 후 URL에서 확인."""
        pid = self._place_id_from_link(link)
        if pid:
            return pid

        title = ""
        try:
            title = (link.text or link.get_attribute("textContent") or "").strip()[:36]
        except Exception:
            title = "(업체)"

        self.log(f"    → ID 확인 클릭: {title}")
        try:
            row = link.find_element(By.XPATH, "./ancestor::li[1]")
            if not self._safe_click_place_target(row):
                self._safe_click(link)
        except Exception:
            try:
                self._safe_click(link)
            except Exception as e:
                self.log(f"    ⚠ 클릭 실패: {e}")
                return ""

        self._sleep(2.2)
        self._wait_captcha_if_needed()

        if self._is_unwanted_navigation_url(self.driver.current_url or ""):
            self.log(f"    ⊘ 저장/등록 페이지 오클릭 — 스킵: {title}")
            self._recover_from_unwanted_page(search_url)
            return ""

        pid = self._place_id_from_url(self.driver.current_url or "")
        if not pid:
            self._wait_detail_panel()
            pid = self._place_id_from_url(self.driver.current_url or "")

        if search_url and pid:
            self._top_document()
            self.driver.get(search_url)
            self._sleep(2)
            self._wait_captcha_if_needed()
            self._switch_frame("searchIframe")

        return pid

    def scrape_open_panel(self) -> PlaceData | None:
        """현재 열린 우측 패널만 읽기 — 클릭·이동 없음."""
        self._top_document()
        place_url = self.driver.current_url or ""
        place_id = self._place_id_from_url(place_url)

        if not self._switch_frame("entryIframe"):
            return None

        name, address, phone = self._scrape_home_fields()
        description = self._text(
            "div.zPfVt", "div.AX_W3", "div.place_section_content", "span.PYg7R"
        )
        image_urls = self._scrape_visible_images()

        if not place_id:
            try:
                for a in self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/place/']"):
                    place_id = self._place_id_from_url(a.get_attribute("href") or "")
                    if place_id:
                        place_url = a.get_attribute("href") or place_url
                        break
            except Exception:
                pass

        if not name or not address:
            return None

        if not place_url and place_id:
            place_url = f"https://map.naver.com/p/place/{place_id}/home"

        return PlaceData(
            name=name,
            address=address,
            phone=phone,
            description=description or f"{name} 애견미용학원입니다.",
            image_urls=image_urls,
            naver_place_url=place_url,
            place_id=place_id,
        )

    def _scrape_visible_images(self) -> list[str]:
        """탭 클릭 없이 현재 화면에 보이는 이미지만 수집."""
        urls: list[str] = []
        for img in self.driver.find_elements(By.CSS_SELECTOR, "img"):
            src = img.get_attribute("src") or img.get_attribute("data-src") or ""
            if not src or "pstatic.net" not in src:
                continue
            if "icon" in src or "logo" in src.lower():
                continue
            src = re.sub(r"type=[a-z_]+", "type=w1080", src)
            if src not in urls:
                urls.append(src)
            if len(urls) >= MAX_PLACE_IMAGES:
                break
        return self._normalize_collected_images(urls)

    def crawl_many_manual(
        self,
        queries: list[dict[str, Any]],
        default_max: int,
        on_place_prompt: PlacePromptFn,
    ) -> list[PlaceData]:
        all_places: list[PlaceData] = []
        seen_ids: set[str] = set()

        for q in queries:
            query = str(q.get("query", "")).strip()
            max_items = int(q.get("max", default_max))
            if not query:
                continue

            collected = 0
            self.log(f"\n--- 검색어: '{query}' (목표 {max_items}곳) ---")
            self.log("  Chrome에서 이 검색어로 검색 → 업체 클릭 → [이 장소 수집]")

            while collected < max_items:
                msg = (
                    f"검색어: {query}\n"
                    f"진행: {collected} / {max_items}곳 수집됨\n\n"
                    "1) Chrome에서 검색\n"
                    "2) 업체 클릭 (우측 패널 열림)\n"
                    "3) [이 장소 수집] 클릭"
                )
                action = on_place_prompt(msg)

                if action == "done":
                    self.log("사용자가 수집을 종료했습니다.")
                    return all_places
                if action == "skip":
                    self.log("  → 건너뜀, 다음 업체로...")
                    continue

                place = self.scrape_open_panel()
                if not place:
                    self.log("  ⚠ 우측 패널이 안 보입니다. 업체를 클릭했는지 확인하세요.")
                    continue
                if place.place_id and place.place_id in seen_ids:
                    self.log(f"  ⚠ 이미 수집함: {place.name}")
                    continue
                if place.place_id:
                    seen_ids.add(place.place_id)

                all_places.append(place)
                collected += 1
                self.log(f"  ✓ 수집 ({collected}/{max_items}): {place.name}")

        return all_places

    def _scrape_current_detail(self, place_id: str, place_url: str) -> PlaceData | None:
        self._top_document()
        if not self._switch_frame("entryIframe"):
            self.log("    ⚠ 상세 패널 로드 실패")
            return None

        self._sleep(1.5)

        name, address, phone = self._scrape_home_fields()
        description = self._text(
            "div.zPfVt", "div.AX_W3", "div.place_section_content", "span.PYg7R"
        )
        image_urls = self._scrape_images_in_panel()

        if not name or not address:
            self.log(f"    ⚠ 필수 정보 누락: name={bool(name)} address={bool(address)}")
            return None

        if not place_url:
            place_url = f"https://map.naver.com/p/place/{place_id}/home"

        return PlaceData(
            name=name,
            address=address,
            phone=phone,
            description=description or f"{name} 애견미용학원입니다.",
            image_urls=image_urls,
            naver_place_url=place_url,
            place_id=place_id,
        )

    def _scrape_images_in_panel(self) -> list[str]:
        urls: list[str] = []

        tab_selectors = (
            "a[href*='photo']",
            "a._tab-menu",
            "button._tab-menu",
            "span:contains('사진')",
        )
        for sel in tab_selectors:
            if ":contains" in sel:
                continue
            try:
                for tab in self.driver.find_elements(By.CSS_SELECTOR, sel):
                    if self._is_save_or_bookmark_element(tab):
                        continue
                    label = (tab.text or tab.get_attribute("textContent") or "").strip()
                    if "사진" in label or "photo" in (tab.get_attribute("href") or ""):
                        self._human_click(tab)
                        self._sleep(1.5)
                        break
            except Exception:
                continue

        for img in self.driver.find_elements(By.CSS_SELECTOR, "img"):
            src = img.get_attribute("src") or img.get_attribute("data-src") or ""
            if not src or "pstatic.net" not in src:
                continue
            if "icon" in src or "logo" in src.lower():
                continue
            src = re.sub(r"type=[a-z_]+", "type=w1080", src)
            if src not in urls:
                urls.append(src)
            if len(urls) >= MAX_PLACE_IMAGES:
                break

        return self._normalize_collected_images(urls)

    def crawl_query(
        self,
        query: str,
        max_items: int = 5,
        *,
        skip_place_ids: set[str] | None = None,
        skip_names: set[str] | None = None,
    ) -> list[PlaceData]:
        """검색 목록을 위→아래로 스크롤하며 신규만 수집 (페이지 번호 2·3… 자동 이동)."""
        results: list[PlaceData] = []
        known_ids = set(skip_place_ids or ())
        known_names = set(skip_names or ())
        processed_ids: set[str] = set(known_ids)
        processed_names: set[str] = set(known_names)
        skipped_known = 0
        self._list_page = 1

        self.log(f"  ① 지도에서 검색: {query}")
        self._search_on_map(query)
        search_url = (
            self.driver.current_url
            or f"https://map.naver.com/p/search/{quote(query)}"
        )

        self.log(
            f"  ② 목록 순서대로 수집 (최대 {max_items}곳, "
            f"이미 수집 {len(known_ids)}곳 — 업체명·ID로 클릭 없이 건너뜀)"
        )

        no_progress_rounds = 0
        scroll_rounds = 0
        max_scroll_rounds = max(80, max_items // 3 + 20)

        try:
            while len(results) < max_items and scroll_rounds <= max_scroll_rounds:
                self._check_stop()

                if not self._switch_frame("searchIframe"):
                    self._wait_captcha_if_needed()
                    if not self._switch_frame("searchIframe"):
                        self.log("  ⚠ 검색 목록을 찾지 못했습니다.")
                        break

                snapshots = self._snapshot_list_rows()
                if not snapshots:
                    self.log("  ⚠ 검색 결과 행이 없습니다.")
                    break

                new_in_round = 0
                for snap in snapshots:
                    self._check_stop()
                    if len(results) >= max_items:
                        break

                    pid = snap.get("place_id") or ""
                    title = snap.get("title") or ""
                    norm_title = normalize_place_name(title)

                    if pid and pid in processed_ids:
                        continue
                    if norm_title and norm_title in processed_names:
                        continue

                    if self._is_known_place(
                        place_id=pid,
                        title=title,
                        known_ids=known_ids,
                        known_names=known_names,
                    ):
                        if pid:
                            processed_ids.add(pid)
                        if norm_title:
                            processed_names.add(norm_title)
                        skipped_known += 1
                        if skipped_known <= 5 or skipped_known % 25 == 0:
                            self.log(
                                f"    ⊘ 이미 수집: {title or pid} "
                                f"({skipped_known}곳, 클릭 없음)"
                            )
                        continue

                    try:
                        opened = self._click_row_fresh(place_id=pid, title=title)
                        if not opened:
                            self.log(
                                f"    ⚠ 목록 클릭 실패 — 다음 라운드에서 재시도: "
                                f"{title or pid}"
                            )
                            break

                        pid = opened

                        if pid in processed_ids:
                            self._return_to_search(search_url)
                            break
                        processed_ids.add(pid)

                        if self._is_known_place(
                            place_id=pid,
                            title=title,
                            known_ids=known_ids,
                            known_names=known_names,
                        ):
                            if norm_title:
                                processed_names.add(norm_title)
                            skipped_known += 1
                            self._return_to_search(search_url)
                            break

                        if norm_title:
                            processed_names.add(norm_title)

                        self.log(
                            f"  → [{len(results) + 1}/{max_items}] "
                            f"{title} (ID: {pid})"
                        )
                        place = self.scrape_place_by_id(
                            pid,
                            query,
                            already_open=True,
                            fallback_name=title,
                        )
                        self._return_to_search(search_url)

                        if place:
                            results.append(place)
                            known_ids.add(pid)
                            if place.name:
                                known_names.add(normalize_place_name(place.name))
                            new_in_round += 1
                            self.log(
                                f"    ✓ 수집 완료: {place.name} | "
                                f"사진 {len(place.image_urls)}장"
                            )
                        else:
                            self.log(f"    ⚠ 수집 실패: {title}")

                    except CrawlStopped:
                        raise
                    except Exception as e:
                        if self._is_dom_error(e):
                            self.log(f"    ⚠ 목록 갱신됨 — 다음 라운드에서 재시도 ({title or pid})")
                        else:
                            self.log(f"    ✗ 오류: {e}")
                        try:
                            self._return_to_search(search_url)
                        except Exception:
                            pass
                        break

                    # 상세 수집 후 목록 스크롤이 초기화되므로 1건 처리마다 재탐색
                    break

                if len(results) >= max_items:
                    break

                if new_in_round == 0:
                    no_progress_rounds += 1
                else:
                    no_progress_rounds = 0

                if len(results) >= max_items:
                    break

                self.log("  ③ 목록 아래로 스크롤 — 다음 업체 탐색")
                scrolled = self._scroll_list_down()
                scroll_rounds += 1
                at_bottom = self._list_scroll_at_bottom()

                # 1페이지 스크롤 끝 → 하단 2, 3… 페이지 버튼으로 이동
                if new_in_round == 0 and (at_bottom or not scrolled):
                    if self._go_to_next_list_page():
                        self.log(
                            f"  ④ 검색 목록 {self._list_page}페이지 — 추가 업체 탐색"
                        )
                        no_progress_rounds = 0
                        continue

                if no_progress_rounds >= 8:
                    if self._go_to_next_list_page():
                        self.log(
                            f"  ④ 검색 목록 {self._list_page}페이지 — 추가 업체 탐색"
                        )
                        no_progress_rounds = 0
                        continue
                    self.log("  목록 끝 — 더 이상 신규 업체가 없습니다.")
                    break

        except CrawlStopped:
            self.log(f"  ⏹ 수집 중지 — 이 검색어에서 {len(results)}곳 확보")

        if skipped_known:
            self.log(f"  ⊘ 이전에 수집한 업체 {skipped_known}곳 건너뜀 (목록 위치 유지)")
        self.log(f"  → {len(results)}곳 수집 완료")
        return results

    def crawl_many(
        self,
        queries: list[dict[str, Any]],
        default_max: int = 5,
        *,
        skip_place_ids: set[str] | None = None,
        skip_names: set[str] | None = None,
    ) -> list[PlaceData]:
        all_places: list[PlaceData] = []
        seen_ids: set[str] = set(skip_place_ids or ())
        seen_names: set[str] = set(skip_names or ())

        if seen_ids or seen_names:
            self.log(
                f"  마스터에 이미 있는 업체 "
                f"(ID {len(seen_ids)} / 이름 {len(seen_names)}) — 목록에서 클릭 없이 건너뜀"
            )

        stopped = False
        for q in queries:
            if self.stop_requested():
                stopped = True
                break

            query = str(q.get("query", "")).strip()
            max_items = int(q.get("max", default_max))
            if not query:
                continue

            self.log(f"\n--- 검색: {query} (최대 {max_items}곳) ---")
            try:
                batch = self.crawl_query(
                    query,
                    max_items,
                    skip_place_ids=seen_ids,
                    skip_names=seen_names,
                )
            except Exception as e:
                self.log(f"⚠ 검색 '{query}' 오류: {e}")
                batch = []
            for place in batch:
                if not place.place_id:
                    continue
                if place.place_id in seen_ids:
                    continue
                seen_ids.add(place.place_id)
                if place.name:
                    seen_names.add(normalize_place_name(place.name))
                all_places.append(place)

            if self.stop_requested():
                stopped = True
                break

            self._sleep(3)

        if stopped:
            self.log(f"\n⏹ 수집 중지됨 — 지금까지 {len(all_places)}곳")
        return all_places
