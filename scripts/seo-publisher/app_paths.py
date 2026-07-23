"""실행파일(exe) / 소스 공통 경로."""

from __future__ import annotations

import sys
from pathlib import Path


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def app_dir() -> Path:
    """설정·출력·.env 가 놓이는 폴더 (exe 옆 또는 스크립트 폴더)."""
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resource_dir() -> Path:
    """번들 리소스 (_MEIPASS 또는 소스 폴더)."""
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS", app_dir()))
    return Path(__file__).resolve().parent
