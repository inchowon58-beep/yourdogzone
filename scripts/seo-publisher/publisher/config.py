from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

from app_paths import app_dir


def _tool_root() -> Path:
    return app_dir()


@dataclass
class Config:
    tool_root: Path
    api_base: str
    admin_secret: str
    site_url: str
    webdoc_dir: Path
    naver_id: str = ""
    naver_password: str = ""
    naver_site: str = ""
    twocaptcha_api_key: str = ""
    image_cdn: str = ""
    image_max: int = 0
    image_ext: str = "webp"
    chunk_size: int = 5


def settings_path(root: Path | None = None) -> Path:
    return (root or _tool_root()) / "gui_settings.json"


def load_gui_settings(root: Path | None = None) -> dict:
    path = settings_path(root)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception:
        return {}


def save_gui_settings(data: dict, root: Path | None = None) -> None:
    path = settings_path(root)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def load_config() -> Config:
    root = _tool_root()
    saved = load_gui_settings(root)

    api_base = (
        os.getenv("SEO_API_BASE")
        or os.getenv("SITE_URL")
        or "https://www.yourdogzone.co.kr"
    ).rstrip("/")
    site_url = (
        os.getenv("SEO_SITE_URL") or api_base
    ).rstrip("/")
    secret = (
        os.getenv("ACADEMY_ADMIN_SECRET")
        or os.getenv("ADMIN_SECRET")
        or ""
    ).strip().strip('"').strip("'")
    webdoc = Path(
        os.getenv("WEBDOC_DIR")
        or r"C:\Users\USER\Desktop\VM웹문서자동등록"
    )
    naver_id = (
        os.getenv("NAVER_ID")
        or str(saved.get("naver_id") or "")
    ).strip()
    naver_password = (
        os.getenv("NAVER_PASSWORD")
        or str(saved.get("naver_password") or "")
    ).strip()
    naver_site = (
        os.getenv("NAVER_SITE")
        or str(saved.get("naver_site") or "")
        or site_url
    ).strip().rstrip("/")
    twocaptcha = (
        os.getenv("TWOCAPTCHA_API_KEY")
        or str(saved.get("twocaptcha_api_key") or "")
    ).strip()
    image_cdn = (
        os.getenv("IMAGE_CDN")
        or str(saved.get("image_cdn") or "")
    ).strip().rstrip("/")
    try:
        image_max = int(
            os.getenv("IMAGE_MAX")
            or saved.get("image_max")
            or 0
        )
    except (TypeError, ValueError):
        image_max = 0
    image_ext = (
        os.getenv("IMAGE_EXT")
        or str(saved.get("image_ext") or "webp")
    ).strip().lstrip(".") or "webp"

    return Config(
        tool_root=root,
        api_base=api_base,
        admin_secret=secret,
        site_url=site_url,
        webdoc_dir=webdoc,
        naver_id=naver_id,
        naver_password=naver_password,
        naver_site=naver_site,
        twocaptcha_api_key=twocaptcha,
        image_cdn=image_cdn,
        image_max=image_max,
        image_ext=image_ext,
    )
