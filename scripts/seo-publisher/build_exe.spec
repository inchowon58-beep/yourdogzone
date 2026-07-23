# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller — 유아독존 SEO 단일 exe (웹문서 등록 의존성 포함)."""

from pathlib import Path

from PyInstaller.utils.hooks import collect_all, collect_submodules

block_cipher = None
root = Path(SPECPATH)

datas = [
    (str(root / ".env.example"), "."),
    (str(root / "keywords.example.txt"), "."),
]

binaries = []
hiddenimports = collect_submodules("publisher") + [
    "app_paths",
    "dotenv",
    "certifi",
    "requests",
    "selenium",
    "undetected_chromedriver",
    "urllib3",
    "charset_normalizer",
    "idna",
]

for pkg in ("undetected_chromedriver", "selenium", "requests", "certifi"):
    try:
        _datas, _binaries, _hidden = collect_all(pkg)
        datas += _datas
        binaries += _binaries
        hiddenimports += _hidden
    except Exception:
        pass

a = Analysis(
    [str(root / "app_gui.py")],
    pathex=[str(root)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="유아독존 SEO",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
