"""유아독존 SEO — 로컬 FastAPI (브라우저 UI)."""

from __future__ import annotations

import os
import sys
import threading
import traceback
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app_paths import app_dir, resource_dir  # noqa: E402
from publisher.adoption_forms import (  # noqa: E402
    ADOPTION_FORMS,
    DEFAULT_ADOPTION_FORM,
)
from publisher.config import load_config, load_gui_settings, save_gui_settings  # noqa: E402
from publisher.pipeline import run_pipeline  # noqa: E402
from publisher.slug import CATEGORY_META  # noqa: E402

STATIC = resource_dir() / "web" / "static"
if not STATIC.exists():
    STATIC = Path(__file__).resolve().parent / "static"

app = FastAPI(title="유아독존 SEO")
app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")

# 같은 스레드에서 상태 갱신 중 로그를 남겨도 멈추지 않도록 재진입 락
_job_lock = threading.RLock()
_job: dict[str, Any] = {
    "running": False,
    "logs": [],
    "result": None,
    "error": None,
}


def _append_log(msg: str) -> None:
    with _job_lock:
        _job["logs"].append(msg)
        if len(_job["logs"]) > 2000:
            _job["logs"] = _job["logs"][-1500:]


class RunBody(BaseModel):
    category: str = "shelter"
    form_id: str | None = None
    keywords: str = ""
    count: int | None = None
    image_cdn: str = ""
    image_max: int = 0
    image_ext: str = "webp"
    api_base: str = ""
    webdoc_dir: str = ""
    naver_id: str = ""
    naver_password: str = ""
    naver_site: str = ""
    do_publish: bool = True
    do_indexnow: bool = True
    do_webdoc: bool = False
    generate_only: bool = False


class SettingsBody(BaseModel):
    api_base: str = ""
    webdoc_dir: str = ""
    naver_id: str = ""
    naver_password: str = ""
    naver_site: str = ""
    image_cdn: str = ""
    image_max: str = ""
    image_ext: str = "webp"
    category: str = "shelter"
    form_id: str = ""
    last_keywords: str = ""
    webdoc_enabled: bool = False
    count: str = ""


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    cfg = load_config()
    saved = load_gui_settings()
    categories = [
        {"id": k, "label": v["title"]} for k, v in CATEGORY_META.items()
    ]
    forms = [{"id": fid, "label": label} for fid, label in ADOPTION_FORMS]
    return {
        "categories": categories,
        "forms": forms,
        "defaultFormId": DEFAULT_ADOPTION_FORM,
        "adminSecretLoaded": bool((cfg.admin_secret or "").strip()),
        "twocaptchaLoaded": bool((cfg.twocaptcha_api_key or "").strip()),
        "settings": {
            "api_base": saved.get("api_base") or cfg.api_base,
            "webdoc_dir": saved.get("webdoc_dir") or str(cfg.webdoc_dir),
            "naver_id": saved.get("naver_id") or cfg.naver_id,
            "naver_password": saved.get("naver_password") or cfg.naver_password,
            "naver_site": saved.get("naver_site") or cfg.naver_site or cfg.site_url,
            "image_cdn": saved.get("image_cdn") or cfg.image_cdn,
            "image_max": str(saved.get("image_max") or cfg.image_max or ""),
            "image_ext": saved.get("image_ext") or cfg.image_ext or "webp",
            "category": saved.get("category") or "shelter",
            "form_id": saved.get("form_id") or DEFAULT_ADOPTION_FORM,
            "last_keywords": saved.get("last_keywords") or "",
            "webdoc_enabled": bool(saved.get("webdoc_enabled")),
            "count": str(saved.get("count") or ""),
        },
    }


@app.post("/api/settings")
def save_settings(body: SettingsBody) -> dict[str, str]:
    data = body.model_dump()
    save_gui_settings(data)
    # .env 동기화 (비밀키는 유지)
    env_path = app_dir() / ".env"
    lines: list[str] = []
    if env_path.exists():
        lines = env_path.read_text(encoding="utf-8-sig").splitlines()
    kv: dict[str, str] = {}
    order: list[str] = []
    for line in lines:
        if not line.strip() or line.strip().startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        if k not in kv:
            order.append(k)
        kv[k] = v
    updates = {
        "SEO_API_BASE": body.api_base.strip(),
        "SEO_SITE_URL": body.api_base.strip(),
        "WEBDOC_DIR": body.webdoc_dir.strip(),
        "NAVER_ID": body.naver_id.strip(),
        "NAVER_PASSWORD": body.naver_password.strip(),
        "NAVER_SITE": body.naver_site.strip(),
        "IMAGE_CDN": body.image_cdn.strip().rstrip("/"),
        "IMAGE_MAX": body.image_max.strip(),
        "IMAGE_EXT": (body.image_ext.strip().lstrip(".") or "webp"),
    }
    for k, v in updates.items():
        if k not in kv:
            order.append(k)
        kv[k] = v
    env_path.write_text(
        "\n".join(f"{k}={kv[k]}" for k in order) + "\n",
        encoding="utf-8",
    )
    return {"ok": "true"}


@app.get("/api/job")
def job_status() -> dict[str, Any]:
    with _job_lock:
        return {
            "running": _job["running"],
            "logs": list(_job["logs"]),
            "result": _job["result"],
            "error": _job["error"],
        }


@app.post("/api/run")
def start_run(body: RunBody) -> dict[str, Any]:
    with _job_lock:
        if _job["running"]:
            raise HTTPException(409, "이미 발행 중입니다.")
        _job["running"] = True
        _job["logs"] = []
        _job["result"] = None
        _job["error"] = None

    def worker() -> None:
        try:
            if body.api_base.strip():
                os.environ["SEO_API_BASE"] = body.api_base.strip()
                os.environ["SEO_SITE_URL"] = body.api_base.strip()
            if body.webdoc_dir.strip():
                os.environ["WEBDOC_DIR"] = body.webdoc_dir.strip()
            if body.naver_id.strip():
                os.environ["NAVER_ID"] = body.naver_id.strip()
            if body.naver_password.strip():
                os.environ["NAVER_PASSWORD"] = body.naver_password.strip()
            if body.naver_site.strip():
                os.environ["NAVER_SITE"] = body.naver_site.strip()
            if body.image_cdn.strip():
                os.environ["IMAGE_CDN"] = body.image_cdn.strip().rstrip("/")
            os.environ["IMAGE_MAX"] = str(body.image_max or 0)
            os.environ["IMAGE_EXT"] = (
                body.image_ext.strip().lstrip(".") or "webp"
            )

            save_gui_settings(
                {
                    **load_gui_settings(),
                    "api_base": body.api_base.strip(),
                    "webdoc_dir": body.webdoc_dir.strip(),
                    "naver_id": body.naver_id.strip(),
                    "naver_password": body.naver_password.strip(),
                    "naver_site": body.naver_site.strip(),
                    "image_cdn": body.image_cdn.strip().rstrip("/"),
                    "image_max": str(body.image_max or ""),
                    "image_ext": body.image_ext.strip().lstrip(".") or "webp",
                    "category": body.category,
                    "form_id": body.form_id or "",
                    "last_keywords": body.keywords,
                    "webdoc_enabled": body.do_webdoc,
                    "count": str(body.count or ""),
                }
            )

            cfg = load_config()
            form_id = body.form_id if body.category == "adoption" else None
            result = run_pipeline(
                cfg=cfg,
                category=body.category,
                form_id=form_id,
                keyword_text=body.keywords,
                count=body.count,
                image_cdn=body.image_cdn,
                image_max=body.image_max,
                image_ext=body.image_ext,
                do_publish=not body.generate_only and body.do_publish,
                do_indexnow=not body.generate_only and body.do_indexnow,
                do_webdoc=not body.generate_only and body.do_webdoc,
                webdoc_limit=50,
                on_log=_append_log,
            )
            with _job_lock:
                _job["result"] = {
                    "generated": result.get("generated"),
                    "urls": result.get("urls") or [],
                    "errors": result.get("errors") or [],
                    "urls_file": result.get("urls_file"),
                }
            _append_log(f"완료: {result.get('generated')}건")
        except Exception as e:
            tb = traceback.format_exc()
            _append_log(tb)
            with _job_lock:
                _job["error"] = str(e)
                if _job["result"] is None:
                    _job["result"] = {
                        "generated": 0,
                        "urls": [],
                        "errors": [str(e)],
                        "urls_file": None,
                    }
        finally:
            with _job_lock:
                _job["running"] = False

    threading.Thread(target=worker, daemon=True).start()
    return {"ok": True, "started": True}


@app.post("/api/shutdown")
def shutdown() -> JSONResponse:
    """브라우저 [프로그램 종료] — 로컬 서버 종료."""

    def _exit() -> None:
        import time

        time.sleep(0.4)
        os._exit(0)

    threading.Thread(target=_exit, daemon=True).start()
    return JSONResponse({"ok": True})
