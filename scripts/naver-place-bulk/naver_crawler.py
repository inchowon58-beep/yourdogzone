"""네이버 지도 플레이스 크롤러 (Selenium)"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


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


class NaverPlaceCrawler:
    def __init__(self, headless: bool = True, delay: float = 1.5):
        self.delay = delay
        self.driver = self._create_driver(headless)
        self.wait = WebDriverWait(self.driver, 15)

    def _create_driver(self, headless: bool) -> webdriver.Chrome:
        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1400,900")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--lang=ko-KR")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=options)

    def close(self) -> None:
        self.driver.quit()

    def _sleep(self) -> None:
        time.sleep(self.delay)

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
        print(f"  검색: {query}")
        self.driver.get(url)
        self._sleep()

        if not self._switch_frame("searchIframe"):
            print("  ⚠ searchIframe 로드 실패")
            return []

        place_ids: list[str] = []
        seen: set[str] = set()
        scroll_rounds = 0

        while len(place_ids) < max_items and scroll_rounds < 15:
            links = self.driver.find_elements(By.CSS_SELECTOR, "a.place_bluelink, a[href*='/place/']")
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
                    By.CSS_SELECTOR,
                    "#_pcmap_list_scroll_container, .Ryr1F",
                )
                self.driver.execute_script(
                    "arguments[0].scrollTop = arguments[0].scrollHeight", container
                )
            except Exception:
                self.driver.execute_script("window.scrollBy(0, 800);")
            self._sleep()
            scroll_rounds += 1

        print(f"  → {len(place_ids)}곳 발견")
        return place_ids[:max_items]

    def _scrape_detail(self, place_id: str) -> PlaceData | None:
        url = f"https://map.naver.com/p/place/{place_id}/home"
        self.driver.get(url)
        self._sleep()

        if not self._switch_frame("entryIframe"):
            print(f"    ⚠ entryIframe 실패 (place {place_id})")
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
            "div.zPfVt",
            "div.AX_W3",
            "div.place_section_content",
            "span.PYg7R",
        )

        image_urls = self._scrape_images(place_id)

        if not name or not address:
            print(f"    ⚠ 필수 정보 누락: name={bool(name)} address={bool(address)}")
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
        self.driver.get(photo_url)
        self._sleep()

        urls: list[str] = []
        if self._switch_frame("entryIframe"):
            imgs = self.driver.find_elements(By.CSS_SELECTOR, "img")
            for img in imgs:
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
            print(f"  [{i}/{len(place_ids)}] place/{pid} 수집 중...")
            try:
                place = self._scrape_detail(pid)
                if place:
                    results.append(place)
                    print(f"    ✓ {place.name} | 이미지 {len(place.image_urls)}장")
            except Exception as e:
                print(f"    ✗ 오류: {e}")
            self._sleep()

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
