#!/usr/bin/env python3
"""
네이버 플레이스 크롤링 예시 (Selenium)

  pip install selenium requests python-dotenv webdriver-manager

주의: 네이버 이용약관·robots.txt를 준수하세요. 상업적 대량 크롤링 전 법적 검토가 필요합니다.
수집 후 register_via_api.py 로 YourDogZone API에 전송합니다.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

# from selenium import webdriver
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.common.by import By
# from webdriver_manager.chrome import ChromeDriverManager


def crawl_naver_place(place_url: str) -> dict[str, Any]:
    """
    플레이스 URL에서 학원 정보 추출 (구현 스켈레톤).
    실제 셀렉터는 네이버 UI 변경에 따라 수정이 필요합니다.
    """
    # driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    # driver.get(place_url)
    # time.sleep(3)
    #
    # name = driver.find_element(By.CSS_SELECTOR, "span.GHAhO").text  # 예시
    # address = driver.find_element(By.CSS_SELECTOR, "span.LDgIH").text
    # phone = driver.find_element(By.CSS_SELECTOR, "span.xlx7Q").text
    # description = driver.find_element(By.CSS_SELECTOR, "div.AX_W3").text
    #
    # images = []
    # for img in driver.find_elements(By.CSS_SELECTOR, "img.K0PDV"):
    #     src = img.get_attribute("src")
    #     if src and "pstatic.net" in src:
    #         images.append(src)
    # driver.quit()

    raise NotImplementedError(
        "Selenium 셀렉터는 네이버 페이지 구조에 맞게 직접 구현하세요. "
        "아래 샘플 JSON 형식으로 register_via_api.py 를 사용할 수 있습니다."
    )


SAMPLE_OUTPUT = [
    {
        "name": "OO애견미용학원",
        "address": "경기도 부천시 원미구 중동 123-4",
        "phone": "032-123-4567",
        "description": "네이버 플레이스 원본 소개글...",
        "image_urls": [
            "https://search.pstatic.net/sunny/?src=https%3A%2F%2F...",
        ],
        "naver_place_url": "https://map.naver.com/p/search/.../place/...",
    }
]


if __name__ == "__main__":
    out = "academies.sample.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(SAMPLE_OUTPUT, f, ensure_ascii=False, indent=2)
    print(f"샘플 파일 생성: {out}")
    print("python register_via_api.py --json academies.sample.json --gemini")
