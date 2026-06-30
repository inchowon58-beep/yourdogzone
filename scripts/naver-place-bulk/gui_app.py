#!/usr/bin/env python3
"""YourDogZone 네이버 플레이스 자동 수집·등록 GUI"""

from __future__ import annotations

import queue
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, scrolledtext, ttk

from pipeline import (
    LISTING_CATEGORIES,
    PipelineSettings,
    category_label,
    format_category_option,
    list_crawled_files,
    load_settings_from_files,
    parse_category_option,
    parse_search_lines,
    register_from_json,
    run_collect,
    run_collect_and_register,
    save_settings,
)

SCRIPT_DIR = Path(__file__).parent
APP_TITLE = "유아독존 — 네이버 플레이스 자동 등록"

CATEGORY_OPTIONS = [format_category_option(k) for k in LISTING_CATEGORIES]


class AcademyRegisterApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("720x860")
        self.minsize(640, 700)
        self.configure(bg="#f5f5f7")

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.worker: threading.Thread | None = None
        self.running = False
        self.last_json: Path | None = None

        self._build_ui()
        self._load_initial_settings()
        self.after(150, self._poll_log)

    def _build_ui(self) -> None:
        pad = {"padx": 12, "pady": 6}

        header = tk.Label(
            self,
            text="네이버 수집 → 중복 자동 제거 → Gemini → 신규만 등록",
            font=("Segoe UI", 11, "bold"),
            bg="#f5f5f7",
            fg="#333",
        )
        header.pack(pady=(14, 4))

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=False, padx=12, pady=4)

        # --- 설정 탭 ---
        tab_settings = tk.Frame(notebook, bg="#fff")
        notebook.add(tab_settings, text="  설정  ")

        frm = tk.Frame(tab_settings, bg="#fff")
        frm.pack(fill="x", padx=16, pady=12)

        tk.Label(frm, text="등록 카테고리", bg="#fff", anchor="w").grid(
            row=0, column=0, sticky="w", **pad
        )
        self.category_var = tk.StringVar()
        self.category_combo = ttk.Combobox(
            frm,
            textvariable=self.category_var,
            values=CATEGORY_OPTIONS,
            state="readonly",
            width=30,
        )
        self.category_combo.grid(row=0, column=1, sticky="w", **pad)
        self.category_combo.bind("<<ComboboxSelected>>", self._on_category_change)
        tk.Label(
            frm,
            text="선택한 카테고리로 사이트에 저장됩니다 (academy / adoption / shelter / funeral / breeder / hospital)",
            bg="#fff",
            fg="#888",
            font=("Segoe UI", 8),
            wraplength=420,
            justify="left",
        ).grid(row=1, column=1, sticky="w", padx=12)

        tk.Label(frm, text="사이트 URL", bg="#fff", anchor="w").grid(row=2, column=0, sticky="w", **pad)
        self.api_url_var = tk.StringVar()
        tk.Entry(frm, textvariable=self.api_url_var, width=52).grid(row=2, column=1, **pad)

        tk.Label(frm, text="관리자 비밀키", bg="#fff", anchor="w").grid(row=3, column=0, sticky="w", **pad)
        self.secret_var = tk.StringVar()
        tk.Entry(frm, textvariable=self.secret_var, width=52, show="•").grid(row=3, column=1, **pad)

        tk.Label(
            frm,
            text="(Vercel ACADEMY_ADMIN_SECRET 과 동일)",
            bg="#fff",
            fg="#888",
            font=("Segoe UI", 8),
        ).grid(row=4, column=1, sticky="w", padx=12)

        tk.Label(frm, text="Gemini API 키", bg="#fff", anchor="w").grid(
            row=5, column=0, sticky="w", **pad
        )
        self.gemini_key_var = tk.StringVar()
        tk.Entry(frm, textvariable=self.gemini_key_var, width=52, show="•").grid(
            row=5, column=1, **pad
        )
        tk.Label(
            frm,
            text="(로컬 PC에서 gemini-2.5-flash 변환 — Google AI Studio 키)",
            bg="#fff",
            fg="#888",
            font=("Segoe UI", 8),
        ).grid(row=6, column=1, sticky="w", padx=12)

        tk.Label(frm, text="타이틀 추가 문구", bg="#fff", anchor="w").grid(
            row=7, column=0, sticky="w", **pad
        )
        self.seo_suffix_var = tk.StringVar()
        tk.Entry(frm, textvariable=self.seo_suffix_var, width=52).grid(row=7, column=1, **pad)
        tk.Label(
            frm,
            text='페이지 title 뒤에 붙는 문구 (예: "반려견 미용 추천" → 업체명|지역|추가문구|유아독존)',
            bg="#fff",
            fg="#888",
            font=("Segoe UI", 8),
            wraplength=420,
            justify="left",
        ).grid(row=8, column=1, sticky="w", padx=12)

        tk.Label(frm, text="검색어 (줄마다 1개)", bg="#fff", anchor="nw").grid(
            row=9, column=0, sticky="nw", **pad
        )
        self.search_text = scrolledtext.ScrolledText(frm, width=40, height=8, font=("Segoe UI", 10))
        self.search_text.grid(row=9, column=1, **pad)
        self.search_hint_label = tk.Label(
            frm,
            text="예: 강아지분양|1000  /  인천강아지분양|500  (지역별 추가 검색 시 신규만 쌓임)",
            bg="#fff",
            fg="#888",
            font=("Segoe UI", 8),
            justify="left",
        )
        self.search_hint_label.grid(row=10, column=1, sticky="w", padx=12)

        opts = tk.Frame(frm, bg="#fff")
        opts.grid(row=11, column=1, sticky="w", **pad)

        tk.Label(opts, text="검색당 최대", bg="#fff").pack(side="left")
        self.max_var = tk.IntVar(value=3)
        tk.Spinbox(opts, from_=1, to=20, textvariable=self.max_var, width=5).pack(side="left", padx=6)

        tk.Label(opts, text="대기(초)", bg="#fff").pack(side="left", padx=(12, 0))
        self.delay_var = tk.DoubleVar(value=3.0)
        tk.Spinbox(opts, from_=1, to=10, increment=0.5, textvariable=self.delay_var, width=5).pack(
            side="left", padx=6
        )

        opts2 = tk.Frame(frm, bg="#fff")
        opts2.grid(row=12, column=1, sticky="w", padx=12, pady=(0, 6))

        self.gemini_var = tk.BooleanVar(value=True)
        tk.Checkbutton(opts2, text="Gemini 소개글 편집 (로컬)", variable=self.gemini_var, bg="#fff").pack(
            side="left"
        )

        tk.Label(
            tab_settings,
            text="※ [수집 + 등록] 한 번이면 됩니다 — 검색어를 바꿔 여러 번 돌려도 중복은 자동 건너뜁니다.",
            bg="#fff",
            fg="#c62828",
            font=("Segoe UI", 9),
            justify="left",
        ).pack(padx=16, pady=(0, 8), anchor="w")

        tk.Button(
            tab_settings,
            text="💾 설정 저장",
            command=self._save_settings,
            bg="#e8e8ed",
            relief="flat",
            padx=12,
            pady=6,
        ).pack(pady=8)

        # --- 수집 파일 탭 ---
        tab_files = tk.Frame(notebook, bg="#fff")
        notebook.add(tab_files, text="  수집 파일  ")

        tk.Label(
            tab_files,
            text="이전에 수집한 JSON 파일만 등록할 때 선택하세요. (파일명·내용의 category 기준)",
            bg="#fff",
            fg="#666",
        ).pack(pady=8)

        self.json_combo = ttk.Combobox(tab_files, width=60, state="readonly")
        self.json_combo.pack(padx=16, pady=4)
        tk.Button(
            tab_files,
            text="목록 새로고침",
            command=self._refresh_json_list,
            relief="flat",
            bg="#e8e8ed",
        ).pack(pady=4)

        # --- 버튼 ---
        btn_frame = tk.Frame(self, bg="#f5f5f7")
        btn_frame.pack(fill="x", padx=12, pady=10)

        self.btn_collect = tk.Button(
            btn_frame,
            text="▶  수집 시작",
            font=("Segoe UI", 11, "bold"),
            bg="#5c6bc0",
            fg="white",
            relief="flat",
            padx=16,
            pady=10,
            command=self._on_collect,
        )
        self.btn_collect.pack(side="left", padx=6)

        self.btn_register = tk.Button(
            btn_frame,
            text="▶  수집 + 등록 (추천)",
            font=("Segoe UI", 11, "bold"),
            bg="#2e7d32",
            fg="white",
            relief="flat",
            padx=16,
            pady=10,
            command=self._on_collect_register,
        )
        self.btn_register.pack(side="left", padx=6)

        self.btn_json_register = tk.Button(
            btn_frame,
            text="📄 JSON만 등록",
            font=("Segoe UI", 10),
            bg="#ef6c00",
            fg="white",
            relief="flat",
            padx=12,
            pady=10,
            command=self._on_json_register,
        )
        self.btn_json_register.pack(side="left", padx=6)

        # --- 로그 ---
        log_frame = tk.LabelFrame(self, text=" 진행 로그 ", bg="#f5f5f7", padx=8, pady=8)
        log_frame.pack(fill="both", expand=True, padx=12, pady=(0, 12))

        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=16,
            font=("Consolas", 9),
            bg="#1e1e1e",
            fg="#d4d4d4",
            insertbackground="white",
        )
        self.log_text.pack(fill="both", expand=True)

    def _current_category_id(self) -> str:
        return parse_category_option(self.category_var.get())

    def _set_category_id(self, category_id: str) -> None:
        if category_id not in LISTING_CATEGORIES:
            category_id = "academy"
        self.category_var.set(format_category_option(category_id))
        self._update_search_hint(category_id)

    def _update_search_hint(self, category_id: str | None = None) -> None:
        cat = category_id or self._current_category_id()
        cfg = LISTING_CATEGORIES.get(cat, LISTING_CATEGORIES["academy"])
        hint = cfg["search_hint"]
        self.search_hint_label.config(
            text=(
                f"예: {hint}|1000  /  인천{hint}|500  (지역별 추가 검색 OK, 중복 자동 제거)\n"
                f"     부천 {hint}|5  (← |숫자 는 검색당 최대 건수)"
            )
        )

    def _on_category_change(self, _event=None) -> None:
        self._update_search_hint()

    def _load_initial_settings(self) -> None:
        s = load_settings_from_files()
        self._set_category_id(s.category)
        self.api_url_var.set(s.api_url)
        self.secret_var.set(s.admin_secret)
        self.gemini_key_var.set(s.gemini_api_key)
        self.seo_suffix_var.set(s.seo_title_suffix)
        self.max_var.set(s.max_per_search)
        self.delay_var.set(s.delay_seconds)
        self.gemini_var.set(s.refine_with_gemini)

        if s.searches:
            lines = []
            for item in s.searches:
                q = item.get("query", "")
                m = item.get("max", s.max_per_search)
                lines.append(f"{q}|{m}" if m != s.max_per_search else q)
            self.search_text.insert("1.0", "\n".join(lines))
        else:
            hint = LISTING_CATEGORIES.get(s.category, LISTING_CATEGORIES["academy"])["search_hint"]
            self.search_text.insert(
                "1.0",
                f"부천 {hint}\n인천 {hint}\n서울 강남 {hint}",
            )

        self._refresh_json_list()
        self._log(
            f"프로그램 준비 완료. 카테고리: {category_label(s.category)} — 설정 확인 후 버튼을 누르세요."
        )

    def _get_settings(self) -> PipelineSettings:
        searches = parse_search_lines(self.search_text.get("1.0", "end"), self.max_var.get())
        return PipelineSettings(
            api_url=self.api_url_var.get().strip(),
            admin_secret=self.secret_var.get().strip(),
            gemini_api_key=self.gemini_key_var.get().strip(),
            seo_title_suffix=self.seo_suffix_var.get().strip(),
            category=self._current_category_id(),
            searches=searches,
            max_per_search=self.max_var.get(),
            delay_seconds=self.delay_var.get(),
            refine_with_gemini=self.gemini_var.get(),
            use_chrome_profile=True,
        )

    def _save_settings(self) -> None:
        try:
            s = self._get_settings()
            save_settings(s)
            self._log(
                f"✓ 설정 저장 완료 — 카테고리: {category_label(s.category)} (.env + config.json)"
            )
            messagebox.showinfo("저장", f"설정이 저장되었습니다.\n카테고리: {category_label(s.category)}")
        except Exception as e:
            messagebox.showerror("오류", str(e))

    def _refresh_json_list(self) -> None:
        files = list_crawled_files()
        names = [f.name for f in files]
        self.json_combo["values"] = names
        if names:
            self.json_combo.current(0)

    def _log(self, msg: str) -> None:
        self.log_queue.put(msg)

    def _wait_user_confirm(self, message: str) -> None:
        """작업 스레드에서 호출 — 메인 스레드 팝업 [확인]까지 대기."""
        done = threading.Event()

        def show_dialog() -> None:
            win = tk.Toplevel(self)
            win.title("네이버 로그인")
            win.geometry("480x260")
            win.configure(bg="#ffffff")
            win.transient(self)
            win.grab_set()
            win.attributes("-topmost", True)

            tk.Label(
                win,
                text=message,
                font=("Segoe UI", 11),
                bg="#ffffff",
                fg="#222",
                wraplength=420,
                justify="center",
            ).pack(pady=(28, 10), padx=24)

            tk.Label(
                win,
                text="Chrome 창을 닫지 마세요.",
                font=("Segoe UI", 9),
                bg="#ffffff",
                fg="#c62828",
            ).pack(pady=(0, 8))

            def on_ok() -> None:
                done.set()
                win.destroy()

            tk.Button(
                win,
                text="확인 — 수집 시작",
                font=("Segoe UI", 12, "bold"),
                bg="#5c6bc0",
                fg="white",
                relief="flat",
                padx=28,
                pady=12,
                command=on_ok,
            ).pack(pady=16)

            win.protocol("WM_DELETE_WINDOW", lambda: None)
            win.lift()
            win.focus_force()

        self.after(0, show_dialog)
        done.wait()

    def _poll_log(self) -> None:
        while True:
            try:
                msg = self.log_queue.get_nowait()
            except queue.Empty:
                break
            self.log_text.insert("end", msg + "\n")
            self.log_text.see("end")
        self.after(150, self._poll_log)

    def _set_buttons(self, enabled: bool) -> None:
        state = "normal" if enabled else "disabled"
        self.btn_collect.configure(state=state)
        self.btn_register.configure(state=state)
        self.btn_json_register.configure(state=state)

    def _run_async(self, target) -> None:
        if self.running:
            messagebox.showwarning("실행 중", "이미 작업이 진행 중입니다.")
            return

        try:
            settings = self._get_settings()
            save_settings(settings)
        except Exception as e:
            messagebox.showerror("설정 오류", str(e))
            return

        self.running = True
        self._set_buttons(False)
        self._log("\n" + "—" * 40)
        self._log(f"카테고리: {category_label(settings.category)} ({settings.category})")

        def worker():
            try:
                target(settings)
            except Exception as e:
                self._log(f"\n✗ 오류: {e}")
            finally:
                self.running = False
                self.after(0, lambda: self._set_buttons(True))
                self.after(0, self._refresh_json_list)
                self._log("—" * 40 + "\n작업 종료.\n")

        self.worker = threading.Thread(target=worker, daemon=True)
        self.worker.start()

    def _on_collect(self) -> None:
        def job(settings: PipelineSettings):
            path = run_collect(
                settings,
                self._log,
                on_browser_ready=self._wait_user_confirm,
            )
            if path:
                self.last_json = path
                self._log(f"\n✓ 수집 완료. 마스터에 누적됨 (등록은 '수집 + 등록' 사용)")

        self._run_async(job)

    def _on_collect_register(self) -> None:
        def job(settings: PipelineSettings):
            if not settings.admin_secret:
                raise ValueError("관리자 비밀키를 입력하세요.")
            ok = run_collect_and_register(
                settings,
                self._log,
                on_browser_ready=self._wait_user_confirm,
            )
            if ok:
                self._log(f"\n✓ 수집 및 신규 등록 완료! ({category_label(settings.category)})")
            else:
                self._log("\n⚠ 등록 중 일부 실패 — 로그를 확인하세요")

        self._run_async(job)

    def _on_json_register(self) -> None:
        name = self.json_combo.get()
        if not name:
            messagebox.showwarning("파일 없음", "등록할 crawled_*.json 파일이 없습니다.\n먼저 수집을 실행하세요.")
            return

        path = SCRIPT_DIR / name

        def job(settings: PipelineSettings):
            if not settings.admin_secret:
                raise ValueError("관리자 비밀키를 입력하세요.")
            ok, fail = register_from_json(path, settings, self._log)
            if ok and not fail:
                self._log("\n✓ JSON 등록 완료!")

        self._run_async(job)


def main() -> None:
    app = AcademyRegisterApp()
    app.mainloop()


if __name__ == "__main__":
    main()
