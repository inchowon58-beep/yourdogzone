"""유아독존 지역 SEO 대량 발행 GUI (템플릿 · API 배포 · 웹문서 등록)"""

from __future__ import annotations

import os
import sys
import threading
import traceback
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

from dotenv import load_dotenv

from app_paths import app_dir, is_frozen  # noqa: E402

ROOT = app_dir()
if not is_frozen():
    sys.path.insert(0, str(Path(__file__).resolve().parent))


def _load_env() -> None:
    candidates: list[tuple[Path, bool]] = []
    if not is_frozen():
        src = Path(__file__).resolve().parent
        # 잘못된 로컬 키보다 대량등록 .env(운영 검증된 키)를 우선
        candidates.extend(
            [
                (src.parent.parent / ".env.local", False),
                (src.parent.parent / ".env", False),
                (src.parent / "naver-place-bulk" / ".env", True),
                (src / ".env", True),
            ]
        )
    candidates.append((ROOT / ".env", True))
    for p, override in candidates:
        if p.exists():
            load_dotenv(p, override=override, encoding="utf-8-sig")


_load_env()

from publisher.config import (  # noqa: E402
    load_config,
    load_gui_settings,
    save_gui_settings,
)
from publisher.pipeline import run_pipeline  # noqa: E402
from publisher.slug import CATEGORY_META  # noqa: E402
from publisher.adoption_forms import (  # noqa: E402
    ADOPTION_FORMS,
    DEFAULT_ADOPTION_FORM,
)


class SeoPublisherApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("유아독존 SEO")
        self.geometry("900x980")
        self.minsize(760, 780)

        cfg = load_config()
        saved = load_gui_settings()
        self._running = False
        self._last_urls: list[str] = []

        frm = ttk.Frame(self, padding=12)
        frm.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            frm,
            text="템플릿 기반 발행 (Gemini 없음) · 카테고리별 기본내용 + 페이지별 변형",
            font=("Segoe UI", 11, "bold"),
        ).pack(anchor=tk.W, pady=(0, 8))

        meta = ttk.LabelFrame(frm, text="사이트 · 인증", padding=8)
        meta.pack(fill=tk.X, pady=(0, 8))

        r0 = ttk.Frame(meta)
        r0.pack(fill=tk.X, pady=2)
        ttk.Label(r0, text="API/사이트 URL", width=16).pack(side=tk.LEFT)
        self.api_var = tk.StringVar(value=cfg.api_base)
        ttk.Entry(r0, textvariable=self.api_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        r1 = ttk.Frame(meta)
        r1.pack(fill=tk.X, pady=2)
        ttk.Label(r1, text="관리자 비밀키", width=16).pack(side=tk.LEFT)
        self.secret_var = tk.StringVar(value=cfg.admin_secret)
        ttk.Entry(r1, textvariable=self.secret_var, show="*").pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )
        ttk.Label(
            meta,
            text="Vercel ACADEMY_ADMIN_SECRET 과 동일 (로컬 .env에서 자동 로드됨)",
            foreground="#666",
        ).pack(anchor=tk.W, pady=(0, 4))

        r2 = ttk.Frame(meta)
        r2.pack(fill=tk.X, pady=2)
        ttk.Label(r2, text="카테고리", width=16).pack(side=tk.LEFT)
        cat_labels = [f"{k} — {v['title']}" for k, v in CATEGORY_META.items()]
        self.cat_combo = ttk.Combobox(
            r2, state="readonly", width=28, values=cat_labels
        )
        saved_cat = str(saved.get("category") or "shelter")
        cat_set = next(
            (x for x in cat_labels if x.startswith(f"{saved_cat} ")),
            "shelter — 강아지보호소",
        )
        self.cat_combo.set(cat_set)
        self.cat_combo.pack(side=tk.LEFT, padx=(4, 8))
        self.cat_combo.bind("<<ComboboxSelected>>", self._on_category_change)

        ttk.Label(r2, text="양식").pack(side=tk.LEFT)
        self.form_combo = ttk.Combobox(r2, state="readonly", width=22, values=[])
        self.form_combo.pack(side=tk.LEFT, padx=(4, 0))
        self._refresh_form_options(
            initial_form=str(saved.get("form_id") or "")
        )

        r3 = ttk.Frame(meta)
        r3.pack(fill=tk.X, pady=2)
        ttk.Label(r3, text="웹문서 폴더", width=16).pack(side=tk.LEFT)
        self.webdoc_var = tk.StringVar(value=str(cfg.webdoc_dir))
        ttk.Entry(r3, textvariable=self.webdoc_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        img = ttk.LabelFrame(
            frm,
            text="글 작성 이미지 (CDN 폴더 · 페이지마다 랜덤)",
            padding=8,
        )
        img.pack(fill=tk.X, pady=(0, 8))

        i0 = ttk.Frame(img)
        i0.pack(fill=tk.X, pady=2)
        ttk.Label(i0, text="이미지 폴더 URL", width=16).pack(side=tk.LEFT)
        self.image_cdn_var = tk.StringVar(
            value=cfg.image_cdn
            or str(saved.get("image_cdn") or "")
        )
        ttk.Entry(i0, textvariable=self.image_cdn_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 8)
        )
        ttk.Label(i0, text="최대번호").pack(side=tk.LEFT)
        self.image_max_var = tk.StringVar(
            value=str(cfg.image_max or saved.get("image_max") or "")
        )
        ttk.Entry(i0, textvariable=self.image_max_var, width=6).pack(
            side=tk.LEFT, padx=(4, 0)
        )

        i1 = ttk.Frame(img)
        i1.pack(fill=tk.X, pady=2)
        ttk.Label(i1, text="확장자", width=16).pack(side=tk.LEFT)
        self.image_ext_var = tk.StringVar(
            value=cfg.image_ext or str(saved.get("image_ext") or "webp")
        )
        ttk.Entry(i1, textvariable=self.image_ext_var, width=8).pack(
            side=tk.LEFT, padx=(4, 8)
        )
        ttk.Label(
            i1,
            text="비워두면 이미지 없이 글만 발행 / 예: 폴더 + 79 → 01.webp~79.webp 랜덤",
            foreground="#666",
        ).pack(side=tk.LEFT)

        web = ttk.LabelFrame(
            frm,
            text="네이버 웹문서 등록 (서치어드바이저)",
            padding=8,
        )
        web.pack(fill=tk.X, pady=(0, 8))

        w0 = ttk.Frame(web)
        w0.pack(fill=tk.X, pady=2)
        ttk.Label(w0, text="네이버 아이디", width=16).pack(side=tk.LEFT)
        self.naver_id_var = tk.StringVar(value=cfg.naver_id)
        ttk.Entry(w0, textvariable=self.naver_id_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        w1 = ttk.Frame(web)
        w1.pack(fill=tk.X, pady=2)
        ttk.Label(w1, text="네이버 비밀번호", width=16).pack(side=tk.LEFT)
        self.naver_pw_var = tk.StringVar(value=cfg.naver_password)
        ttk.Entry(w1, textvariable=self.naver_pw_var, show="*").pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        w2 = ttk.Frame(web)
        w2.pack(fill=tk.X, pady=2)
        ttk.Label(w2, text="등록 사이트 URL", width=16).pack(side=tk.LEFT)
        self.naver_site_var = tk.StringVar(
            value=cfg.naver_site or cfg.site_url
        )
        ttk.Entry(w2, textvariable=self.naver_site_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        w3 = ttk.Frame(web)
        w3.pack(fill=tk.X, pady=2)
        ttk.Label(w3, text="2Captcha 키", width=16).pack(side=tk.LEFT)
        self.twocaptcha_var = tk.StringVar(value=cfg.twocaptcha_api_key)
        ttk.Entry(w3, textvariable=self.twocaptcha_var, show="*").pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0)
        )

        ttk.Label(
            web,
            text="체크 시 Chrome 실행 → 네이버 로그인 → 서치어드바이저에서 해당 사이트 웹문서 등록(최대 50)",
            foreground="#666",
        ).pack(anchor=tk.W, pady=(4, 0))

        save_row = ttk.Frame(web)
        save_row.pack(fill=tk.X, pady=(6, 0))
        ttk.Button(
            save_row, text="로그인 설정 저장", command=self.save_settings
        ).pack(side=tk.LEFT)

        ttk.Label(frm, text="키워드 (한 줄에 하나) — 예: 안산 강아지보호소").pack(
            anchor=tk.W
        )
        self.text = scrolledtext.ScrolledText(frm, height=10, font=("Consolas", 11))
        self.text.pack(fill=tk.BOTH, expand=True, pady=(4, 8))
        seed = saved.get("last_keywords")
        if isinstance(seed, str) and seed.strip():
            self.text.insert(tk.END, seed)

        row = ttk.Frame(frm)
        row.pack(fill=tk.X, pady=4)
        ttk.Button(row, text="TXT 불러오기", command=self.load_txt).pack(side=tk.LEFT)
        ttk.Label(row, text="최대 개수").pack(side=tk.LEFT, padx=(12, 4))
        self.count_var = tk.StringVar(value=str(saved.get("count") or "200"))
        ttk.Entry(row, textvariable=self.count_var, width=8).pack(side=tk.LEFT)

        opts = ttk.Frame(frm)
        opts.pack(fill=tk.X, pady=4)
        self.publish_var = tk.BooleanVar(value=True)
        self.indexnow_var = tk.BooleanVar(value=True)
        self.webdoc_check = tk.BooleanVar(
            value=bool(saved.get("webdoc_enabled"))
        )
        ttk.Checkbutton(
            opts, text="사이트에 발행 (API)", variable=self.publish_var
        ).pack(side=tk.LEFT)
        ttk.Checkbutton(opts, text="IndexNow", variable=self.indexnow_var).pack(
            side=tk.LEFT, padx=(12, 0)
        )
        ttk.Checkbutton(
            opts,
            text="웹문서 등록 (최대 50건)",
            variable=self.webdoc_check,
        ).pack(side=tk.LEFT, padx=(12, 0))

        btns = ttk.Frame(frm)
        btns.pack(fill=tk.X, pady=8)
        self.run_btn = ttk.Button(
            btns, text="생성 · 발행 실행", command=self.start
        )
        self.run_btn.pack(side=tk.LEFT)
        ttk.Button(
            btns, text="생성만", command=lambda: self.start(generate_only=True)
        ).pack(side=tk.LEFT, padx=8)
        ttk.Button(btns, text="첫 URL 열기", command=self.open_first).pack(
            side=tk.LEFT, padx=8
        )
        ttk.Button(btns, text="URL 복사", command=self.copy_urls).pack(
            side=tk.LEFT, padx=8
        )

        ttk.Label(frm, text="로그 / URL").pack(anchor=tk.W)
        self.log = scrolledtext.ScrolledText(frm, height=12, font=("Consolas", 10))
        self.log.pack(fill=tk.BOTH, expand=True, pady=(4, 0))

        if cfg.admin_secret:
            self.append_log("관리자 비밀키: .env에서 로드됨")
        else:
            self.append_log("경고: 관리자 비밀키가 비어 있습니다.")
        if cfg.naver_id:
            self.append_log(f"네이버 아이디: {cfg.naver_id} (설정 로드됨)")
        else:
            self.append_log("네이버 로그인 정보가 비어 있습니다. 위 칸에 입력하세요.")

    def _category_id(self) -> str:
        raw = self.cat_combo.get().split("—")[0].strip()
        return raw or "shelter"

    def _form_id(self) -> str | None:
        if self._category_id() != "adoption":
            return None
        raw = self.form_combo.get().split("—")[0].strip()
        return raw or DEFAULT_ADOPTION_FORM

    def _on_category_change(self, _event=None) -> None:
        self._refresh_form_options()

    def _refresh_form_options(self, initial_form: str = "") -> None:
        cat = self._category_id()
        if cat == "adoption":
            values = [f"{fid} — {label}" for fid, label in ADOPTION_FORMS]
            self.form_combo.configure(state="readonly", values=values)
            prefer = initial_form or DEFAULT_ADOPTION_FORM
            match = next(
                (v for v in values if v.startswith(f"{prefer} ")),
                values[0],
            )
            self.form_combo.set(match)
        elif cat == "shelter":
            values = ["shelter_trust — 기본(신뢰가이드)"]
            self.form_combo.configure(state="readonly", values=values)
            self.form_combo.set(values[0])
        else:
            values = ["(해당 없음)"]
            self.form_combo.configure(state="disabled", values=values)
            self.form_combo.set(values[0])

    def _settings_payload(self) -> dict:
        return {
            "naver_id": self.naver_id_var.get().strip(),
            "naver_password": self.naver_pw_var.get().strip(),
            "naver_site": self.naver_site_var.get().strip(),
            "twocaptcha_api_key": self.twocaptcha_var.get().strip(),
            "webdoc_dir": self.webdoc_var.get().strip(),
            "api_base": self.api_var.get().strip(),
            "image_cdn": self.image_cdn_var.get().strip().rstrip("/"),
            "image_max": self.image_max_var.get().strip(),
            "image_ext": self.image_ext_var.get().strip().lstrip(".") or "webp",
            "webdoc_enabled": bool(self.webdoc_check.get()),
            "count": self.count_var.get().strip(),
            "last_keywords": self.text.get("1.0", tk.END).strip(),
            "category": self._category_id(),
            "form_id": self._form_id() or "",
            "daily_limit": "50",
            "delay_min": "15",
            "delay_max": "20",
            "type_id_min": "0.10",
            "type_id_max": "0.28",
            "type_pw_min": "0.08",
            "type_pw_max": "0.22",
            "page_wait": "60",
        }

    def save_settings(self) -> None:
        save_gui_settings(self._settings_payload())
        # .env 에도 동기화 (비밀키 유지)
        env_path = ROOT / ".env"
        lines = []
        if env_path.exists():
            lines = env_path.read_text(encoding="utf-8-sig").splitlines()
        kv = {
            "SEO_API_BASE": self.api_var.get().strip(),
            "SEO_SITE_URL": self.api_var.get().strip(),
            "ACADEMY_ADMIN_SECRET": self.secret_var.get().strip(),
            "WEBDOC_DIR": self.webdoc_var.get().strip(),
            "NAVER_ID": self.naver_id_var.get().strip(),
            "NAVER_PASSWORD": self.naver_pw_var.get().strip(),
            "NAVER_SITE": self.naver_site_var.get().strip(),
            "TWOCAPTCHA_API_KEY": self.twocaptcha_var.get().strip(),
            "IMAGE_CDN": self.image_cdn_var.get().strip().rstrip("/"),
            "IMAGE_MAX": self.image_max_var.get().strip(),
            "IMAGE_EXT": self.image_ext_var.get().strip().lstrip(".") or "webp",
        }
        by_key: dict[str, str] = {}
        order: list[str] = []
        for line in lines:
            if not line.strip() or line.strip().startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip()
            if k not in by_key:
                order.append(k)
            by_key[k] = v
        for k, v in kv.items():
            if k not in by_key:
                order.append(k)
            by_key[k] = v
        env_path.write_text(
            "\n".join(f"{k}={by_key[k]}" for k in order) + "\n",
            encoding="utf-8",
        )
        messagebox.showinfo("저장", "로그인·사이트 설정을 저장했습니다.")

    def load_txt(self) -> None:
        path = filedialog.askopenfilename(
            filetypes=[("Text", "*.txt"), ("All", "*.*")]
        )
        if not path:
            return
        self.text.delete("1.0", tk.END)
        self.text.insert(tk.END, Path(path).read_text(encoding="utf-8-sig"))

    def append_log(self, msg: str) -> None:
        self.log.insert(tk.END, msg + "\n")
        self.log.see(tk.END)

    def start(self, generate_only: bool = False) -> None:
        if self._running:
            return
        keywords = self.text.get("1.0", tk.END)
        if not keywords.strip():
            messagebox.showwarning("안내", "키워드를 입력하세요.")
            return
        if self.webdoc_check.get() and not generate_only:
            if not self.naver_id_var.get().strip() or not self.naver_pw_var.get().strip():
                messagebox.showwarning(
                    "안내",
                    "웹문서 등록을 쓰려면 네이버 아이디/비밀번호를 입력하세요.",
                )
                return
        try:
            count = int(self.count_var.get().strip() or "0") or None
        except ValueError:
            count = None
        try:
            image_max = int(self.image_max_var.get().strip() or "0")
        except ValueError:
            image_max = 0

        os.environ["SEO_API_BASE"] = self.api_var.get().strip()
        os.environ["SEO_SITE_URL"] = self.api_var.get().strip()
        os.environ["ACADEMY_ADMIN_SECRET"] = self.secret_var.get().strip()
        os.environ["WEBDOC_DIR"] = self.webdoc_var.get().strip()
        os.environ["NAVER_ID"] = self.naver_id_var.get().strip()
        os.environ["NAVER_PASSWORD"] = self.naver_pw_var.get().strip()
        os.environ["NAVER_SITE"] = self.naver_site_var.get().strip()
        os.environ["TWOCAPTCHA_API_KEY"] = self.twocaptcha_var.get().strip()
        os.environ["IMAGE_CDN"] = self.image_cdn_var.get().strip().rstrip("/")
        os.environ["IMAGE_MAX"] = str(image_max)
        os.environ["IMAGE_EXT"] = (
            self.image_ext_var.get().strip().lstrip(".") or "webp"
        )

        # 실행 전 설정 자동 저장
        save_gui_settings(self._settings_payload())

        self._running = True
        self.run_btn.configure(state=tk.DISABLED)
        self.log.delete("1.0", tk.END)

        def worker() -> None:
            try:
                cfg = load_config()
                result = run_pipeline(
                    cfg=cfg,
                    category=self._category_id(),
                    form_id=self._form_id(),
                    keyword_text=keywords,
                    count=count,
                    image_cdn=self.image_cdn_var.get().strip(),
                    image_max=image_max,
                    image_ext=self.image_ext_var.get().strip() or "webp",
                    do_publish=not generate_only and self.publish_var.get(),
                    do_indexnow=not generate_only and self.indexnow_var.get(),
                    do_webdoc=not generate_only and self.webdoc_check.get(),
                    webdoc_limit=50,
                    on_log=lambda m: self.after(0, self.append_log, m),
                )
                urls = result.get("urls") or []
                self._last_urls = urls

                def done() -> None:
                    self.append_log(f"완료: {result.get('generated')}건 생성")
                    img = result.get("image_info") or {}
                    if img.get("mode") == "cdn_random":
                        self.append_log(
                            f"이미지: {img.get('cdnBase')} ({img.get('range')}.{img.get('ext')} 랜덤)"
                        )
                    self.append_log(f"URL 파일: {result.get('urls_file')}")
                    for u in urls[:30]:
                        self.append_log(u)
                    if len(urls) > 30:
                        self.append_log(f"… 외 {len(urls) - 30}건")
                    errs = result.get("errors") or []
                    if errs:
                        self.append_log(f"오류 {len(errs)}건:")
                        for e in errs[:20]:
                            self.append_log(f"  - {e}")
                    if urls:
                        self._copy_urls_to_clipboard(urls)
                        self.append_log(f"발행 URL {len(urls)}건을 클립보드에 복사했습니다.")
                    messagebox.showinfo(
                        "완료",
                        f"{result.get('generated')}건 처리했습니다."
                        + (f"\nURL {len(urls)}건을 클립보드에 복사했습니다." if urls else ""),
                    )

                self.after(0, done)
            except Exception as e:
                tb = traceback.format_exc()

                def fail() -> None:
                    self.append_log(tb)
                    messagebox.showerror("오류", str(e))

                self.after(0, fail)
            finally:
                def unlock() -> None:
                    self._running = False
                    self.run_btn.configure(state=tk.NORMAL)

                self.after(0, unlock)

        threading.Thread(target=worker, daemon=True).start()

    def open_first(self) -> None:
        if not self._last_urls:
            messagebox.showinfo("안내", "먼저 실행해 URL을 생성하세요.")
            return
        webbrowser.open(self._last_urls[0])

    def _copy_urls_to_clipboard(self, urls: list[str]) -> None:
        text = "\n".join(u.strip() for u in urls if u.strip())
        self.clipboard_clear()
        self.clipboard_append(text)
        self.update_idletasks()

    def copy_urls(self) -> None:
        if not self._last_urls:
            messagebox.showinfo("안내", "복사할 URL이 없습니다. 먼저 생성·발행하세요.")
            return
        self._copy_urls_to_clipboard(self._last_urls)
        messagebox.showinfo(
            "완료", f"URL {len(self._last_urls)}개를 클립보드에 복사했습니다."
        )


if __name__ == "__main__":
    SeoPublisherApp().mainloop()
