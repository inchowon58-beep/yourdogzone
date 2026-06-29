"""네이버 지도 플레이스 크롤러 (Selenium + 보안문자 대응)"""

from __future__ import annotations

import os
import random
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

SCRIPT_DIR = Path(__file__).parent
CHROME_PROFILE_DIR = SCRIPT_DIR / "chrome_profile"
LogFn = Callable[[str], None]


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
            "name": self.name,
            "address": self.address,
            "phone": self.phone or None,
            "description": self.description,
            "image_urls": self.image_urls[:10],
            "naver_place_url": self.naver_place_url,
        }


def _find_chrome_binary() -> str | None:
    candidates = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


def _resolve_chromedriver_path() -> str | None:
    cache_root = os.path.join(os.path.expanduser("~"), ".wdm", "drivers", "chromedriver")
    if not os.path.isdir(cache_root):
        return None
    newest: str | None = None
    newest_mtime = 0.0
    for root, _dirs, files in os.walk(cache_root):
        for name in files:
            if name.lower() == "chromedriver.exe":
                full = os.path.join(root, name)
                mtime = os.path.getmtime(full)
                if mtime > newest_mtime:
                    newest_mtime = mtime
                    newest = full
    return newest


def create_chrome_driver(
    headless: bool = False,
    use_profile: bool = True,
    log: LogFn = print,
) -> webdriver.Chrome:
    chrome_path = _find_chrome_binary()
    if not chrome_path:
        raise RuntimeError(
            "Google Chrome이 설치되어 있지 않습니다.\n"
            "https://www.google.com/chrome/ 에서 설치 후 다시 시도하세요."
        )

    if headless:
        log("⚠ '브라우저 숨김'은 네이버 보안문자에 걸리기 쉽습니다. 해제를 권장합니다.")

    profile_path = str(CHROME_PROFILE_DIR.resolve()) if use_profile else None
    if use_profile:
        CHROME_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        log(f"Chrome 프로필: {CHROME_PROFILE_DIR.name} (네이버 로그인 유지)")

    errors: list[str] = []

    # 1) undetected-chromedriver (네이버 봇 탐지 우회 — 권장)
    try:
        import undetected_chromedriver as uc

        options = uc.ChromeOptions()
        options.binary_location = chrome_path
        if profile_path:
            options.add_argument(f"--user-data-dir={profile_path}")
        options.add_argument("--lang=ko-KR")
        options.add_argument("--window-size=1400,900")
        if headless:
            options.add_argument("--headless=new")

        driver = uc.Chrome(options=options, headless=headless, use_subprocess=True)
        log("✓ Chrome 시작 (undetected-chromedriver)")
        return driver
    except Exception as e:
        errors.append(f"undetected-chromedriver: {e}")

    # 2) Selenium Manager
    options = Options()
    options.binary_location = chrome_path
    if profile_path:
        options.add_argument(f"--user-data-dir={profile_path}")
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1400,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--lang=ko-KR")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    try:
        driver = webdriver.Chrome(options=options)
        log("✓ Chrome 시작 (Selenium Manager)")
        return driver
    except Exception as e:
        errors.append(f"Selenium Manager: {e}")

    # 3) 캐시 chromedriver
    driver_path = _resolve_chromedriver_path()
    if driver_path:
        try:
            service = ChromeService(executable_path=driver_path)
            driver = webdriver.Chrome(service=service, options=options)
            log("✓ Chrome 시작 (캐시 chromedriver)")
            return driver
        except Exception as e:
            errors.append(f"캐시 chromedriver: {e}")

    detail = "\n".join(f"  - {m}" for m in errors)
    raise RuntimeError(f"Chrome을 시작하지 못했습니다.\n{detail}")


class NaverPlaceCrawler:
    CAPTCHA_TIMEOUT = 300  # 5분

    def __init__(
        self,
        headless: bool = False,
        delay: float = 2.0,
        use_profile: bool = True,
        log: LogFn = print,
    ):
        self.delay = delay
        self.log = log
        self.driver = create_chrome_driver(headless, use_profile, log)
        self.wait = WebDriverWait(self.driver, 20)
        self._prepare_naver_session()

    def close(self) -> None:
        try:
            self.driver.quit()
        except Exception:
            pass

    def _sleep(self, extra: float = 0) -> None:
        time.sleep(self.delay + extra + random.uniform(0.3, 1.2))

    def _page_has_captcha(self) -> bool:
        try:
            src = self.driver.page_source
            keywords = ("보안 문자", "보안문자", "보안 확인", "자동입력 방지")
            return any(k in src for k in keywords)
        except Exception:
            return False

    def _wait_captcha_if_needed(self) -> None:
        if not self._page_has_captcha():
            return

        self.log("")
        self.log("=" * 44)
        self.log("⚠ 네이버 보안문자가 표시되었습니다!")
        self.log("  1) 열린 Chrome 창으로 이동")
        self.log("  2) 보안문자 입력 후 확인 클릭")
        self.log("  3) (권장) 네이버 로그인 — 다음부터 덜 뜸")
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

    def _prepare_naver_session(self) -> None:
        self.log("네이버 접속 중... (로그인 세션 준비)")
        self.driver.get("https://www.naver.com")
        self._sleep(2)
        self._wait_captcha_if_needed()
        self.log("  팁: Chrome에서 네이버 로그인하면 보안문자가 줄어듭니다.")

    def _navigate(self, url: str) -> None:
        self.driver.get(url)
        self._sleep(1.5)
        self._wait_captcha_if_needed()

    def _switch_frame(self, frame_id: str) -> bool:
        self.driver.switch_to.default_content()
        try:
            self.wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, frame_id)))
            return True
        except Exception:
            return False

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

    def _collect_place_ids_from_search(self, query: str, max_items: int) -> list[str]:
        url = f"https://map.naver.com/p/search/{quote(query)}"
        self.log(f"  검색: {query}")
        self._navigate(url)

        if not self._switch_frame("searchIframe"):
            self.log("  ⚠ searchIframe 로드 실패 — 보안문자 확인")
            self._wait_captcha_if_needed()
            if not self._switch_frame("searchIframe"):
                return []

        place_ids: list[str] = []
        seen: set[str] = set()
        scroll_rounds = 0

        while len(place_ids) < max_items and scroll_rounds < 15:
            links = self.driver.find_elements(
                By.CSS_SELECTOR, "a.place_bluelink, a[href*='/place/']"
            )
            for link in links:
                href = link.get_attribute("href") or ""
                m = re.search(r"/place/(\d+)", href)
                if not m:
                    continue
                pid = m.group(1)
                if pid in seen:
                    continue
                seen.add(pid)
                place_ids.append(pid)
                if len(place_ids) >= max_items:
                    break

            if len(place_ids) >= max_items:
                break

            try:
                container = self.driver.find_element(
                    By.CSS_SELECTOR, "#_pcmap_list_scroll_container, .Ryr1F"
                )
                self.driver.execute_script(
                    "arguments[0].scrollTop = arguments[0].scrollHeight", container
                )
            except Exception:
                self.driver.execute_script("window.scrollBy(0, 600);")
            self._sleep(0.8)
            scroll_rounds += 1

        self.log(f"  → {len(place_ids)}곳 발견")
        return place_ids[:max_items]

    def _scrape_detail(self, place_id: str) -> PlaceData | None:
        url = f"https://map.naver.com/p/place/{place_id}/home"
        self._navigate(url)

        if not self._switch_frame("entryIframe"):
            self.log(f"    ⚠ 상세 로드 실패 (place {place_id})")
            return None

        name = self._text("span.GHAhO", "h2.GHAhO", "#_title span", "div.place_title")
        address = self._text("span.LDgIH", "a.LDgIH", "span.IH7VW")
        phone = self._text("span.xlx7Q", "a.tel", "span.Pxlxi")

        if not phone:
            try:
                tel = self.driver.find_element(By.CSS_SELECTOR, "a[href^='tel:']")
                phone = (tel.get_attribute("href") or "").replace("tel:", "").strip()
            except Exception:
                pass

        description = self._text(
            "div.zPfVt", "div.AX_W3", "div.place_section_content", "span.PYg7R"
        )
        image_urls = self._scrape_images(place_id)

        if not name or not address:
            self.log(f"    ⚠ 필수 정보 누락: name={bool(name)} address={bool(address)}")
            return None

        return PlaceData(
            name=name,
            address=address,
            phone=phone,
            description=description or f"{name} 애견미용학원입니다.",
            image_urls=image_urls,
            naver_place_url=url,
            place_id=place_id,
        )

    def _scrape_images(self, place_id: str) -> list[str]:
        photo_url = f"https://map.naver.com/p/place/{place_id}/photo"
        self._navigate(photo_url)

        urls: list[str] = []
        if self._switch_frame("entryIframe"):
            for img in self.driver.find_elements(By.CSS_SELECTOR, "img"):
                src = img.get_attribute("src") or img.get_attribute("data-src") or ""
                if not src or "pstatic.net" not in src:
                    continue
                if "icon" in src or "logo" in src.lower():
                    continue
                src = re.sub(r"type=[a-z_]+", "type=w1080", src)
                if src not in urls:
                    urls.append(src)
                if len(urls) >= 10:
                    break
        return urls

    def crawl_query(self, query: str, max_items: int = 5) -> list[PlaceData]:
        results: list[PlaceData] = []
        place_ids = self._collect_place_ids_from_search(query, max_items)

        for i, pid in enumerate(place_ids, start=1):
            self.log(f"  [{i}/{len(place_ids)}] place/{pid} 수집 중...")
            try:
                place = self._scrape_detail(pid)
                if place:
                    results.append(place)
                    self.log(f"    ✓ {place.name} | 이미지 {len(place.image_urls)}장")
            except Exception as e:
                self.log(f"    ✗ 오류: {e}")
            self._sleep(1)

        return results

    def crawl_many(self, queries: list[dict[str, Any]], default_max: int = 5) -> list[PlaceData]:
        all_places: list[PlaceData] = []
        seen_ids: set[str] = set()

        for q in queries:
            query = str(q.get("query", "")).strip()
            max_items = int(q.get("max", default_max))
            if not query:
                continue
            for place in self.crawl_query(query, max_items):
                if place.place_id in seen_ids:
                    continue
                seen_ids.add(place.place_id)
                all_places.append(place)

        return all_places
