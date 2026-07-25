(() => {
  const $ = (id) => document.getElementById(id);

  let meta = null;
  let pollTimer = null;
  let lastLogLen = 0;
  let lastUrls = [];

  function setSecretBadge(ok) {
    const el = $("secretBadge");
    if (ok) {
      el.textContent = "관리자 비밀키 · .env 로드됨";
      el.classList.remove("warn");
    } else {
      el.textContent = "비밀키 없음 · .env 확인";
      el.classList.add("warn");
    }
  }

  function fillCategories() {
    const sel = $("category");
    sel.innerHTML = "";
    for (const c of meta.categories) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.label;
      sel.appendChild(opt);
    }
  }

  function refreshForms() {
    const cat = $("category").value;
    const sel = $("formId");
    sel.innerHTML = "";
    if (cat === "adoption") {
      sel.disabled = false;
      for (const f of meta.forms) {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = f.label;
        sel.appendChild(opt);
      }
      const prefer = meta.settings?.form_id || meta.defaultFormId;
      if ([...sel.options].some((o) => o.value === prefer)) sel.value = prefer;
    } else if (cat === "shelter") {
      sel.disabled = false;
      const opt = document.createElement("option");
      opt.value = "shelter_trust";
      opt.textContent = "기본(신뢰가이드)";
      sel.appendChild(opt);
    } else {
      sel.disabled = true;
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "해당 없음";
      sel.appendChild(opt);
    }
  }

  function applySettings(s) {
    $("apiBase").value = s.api_base || "";
    $("webdocDir").value = s.webdoc_dir || "";
    $("naverId").value = s.naver_id || "";
    $("naverPassword").value = s.naver_password || "";
    $("naverSite").value = s.naver_site || "";
    $("imageCdn").value = s.image_cdn || "";
    $("imageMax").value = s.image_max || "";
    $("imageExt").value = s.image_ext || "webp";
    $("keywords").value = s.last_keywords || "";
    $("count").value = s.count || "";
    $("doWebdoc").checked = !!s.webdoc_enabled;
    if (s.category) $("category").value = s.category;
    refreshForms();
    if (s.form_id && $("category").value === "adoption") {
      $("formId").value = s.form_id;
    }
  }

  function payload(generateOnly = false) {
    const category = $("category").value;
    return {
      category,
      form_id: category === "adoption" ? $("formId").value : null,
      keywords: $("keywords").value,
      count: Number($("count").value) || null,
      image_cdn: $("imageCdn").value.trim(),
      image_max: Number($("imageMax").value) || 0,
      image_ext: $("imageExt").value.trim() || "webp",
      api_base: $("apiBase").value.trim(),
      webdoc_dir: $("webdocDir").value.trim(),
      naver_id: $("naverId").value.trim(),
      naver_password: $("naverPassword").value,
      naver_site: $("naverSite").value.trim(),
      do_publish: $("doPublish").checked,
      do_indexnow: $("doIndexnow").checked,
      do_webdoc: $("doWebdoc").checked,
      generate_only: generateOnly,
    };
  }

  function settingsPayload() {
    return {
      api_base: $("apiBase").value.trim(),
      webdoc_dir: $("webdocDir").value.trim(),
      naver_id: $("naverId").value.trim(),
      naver_password: $("naverPassword").value,
      naver_site: $("naverSite").value.trim(),
      image_cdn: $("imageCdn").value.trim(),
      image_max: $("imageMax").value.trim(),
      image_ext: $("imageExt").value.trim() || "webp",
      category: $("category").value,
      form_id: $("category").value === "adoption" ? $("formId").value : "",
      last_keywords: $("keywords").value,
      webdoc_enabled: $("doWebdoc").checked,
      count: $("count").value.trim(),
    };
  }

  function setRunning(running) {
    $("btnRun").disabled = running;
    $("btnGenerate").disabled = running;
  }

  async function copyText(text) {
    const value = (text || "").trim();
    if (!value) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function setCopyHint(msg) {
    $("urlCopyHint").textContent = msg || "";
  }

  function renderUrls(urls) {
    lastUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
    const box = $("urls");
    const btn = $("btnCopyUrls");
    btn.disabled = lastUrls.length === 0;
    if (lastUrls.length === 0) {
      box.innerHTML = "";
      return;
    }
    const shown = lastUrls.slice(0, 40);
    box.innerHTML = shown
      .map(
        (u, i) =>
          `<div class="url-row">
            <a href="${u}" target="_blank" rel="noopener">${u}</a>
            <button type="button" class="copy-one" data-idx="${i}">복사</button>
          </div>`
      )
      .join("");
    if (lastUrls.length > 40) {
      box.innerHTML += `<div>… 외 ${lastUrls.length - 40}건 (전체 복사에 포함)</div>`;
    }
  }

  function renderJob(job) {
    const log = $("log");
    if (job.logs && job.logs.length !== lastLogLen) {
      log.textContent = job.logs.join("\n");
      log.scrollTop = log.scrollHeight;
      lastLogLen = job.logs.length;
    }
    if (job.result) {
      const urls = job.result.urls || [];
      renderUrls(urls);
      if (urls.length) setCopyHint(`${urls.length}건 · 전체 복사 가능`);
    }
    if (!job.running) {
      setRunning(false);
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (job.error) {
        setCopyHint(`오류: ${job.error}`);
      }
    }
  }

  async function pollOnce() {
    try {
      const res = await fetch("/api/job", { cache: "no-store" });
      if (!res.ok) return;
      renderJob(await res.json());
    } catch {
      // 로컬 서버 일시 지연 — 다음 폴링에서 재시도
    }
  }

  async function startPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(pollOnce, 800);
    await pollOnce();
  }

  async function run(generateOnly) {
    lastLogLen = 0;
    $("log").textContent = "";
    renderUrls([]);
    setCopyHint("");
    setRunning(true);
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(generateOnly)),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "실행 실패");
      setRunning(false);
      return;
    }
    await startPoll();
  }

  $("category").addEventListener("change", refreshForms);
  $("btnSave").addEventListener("click", async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsPayload()),
    });
    alert("설정을 저장했습니다.");
  });
  $("btnRun").addEventListener("click", () => run(false));
  $("btnGenerate").addEventListener("click", () => run(true));
  $("btnCopyUrls").addEventListener("click", async () => {
    if (!lastUrls.length) {
      alert("복사할 URL이 없습니다.");
      return;
    }
    const ok = await copyText(lastUrls.join("\n"));
    setCopyHint(ok ? `${lastUrls.length}건 클립보드에 복사됨` : "복사 실패");
  });
  $("urls").addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-one");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-idx"));
    const url = lastUrls[idx];
    if (!url) return;
    const ok = await copyText(url);
    btn.textContent = ok ? "됨" : "실패";
    setTimeout(() => {
      btn.textContent = "복사";
    }, 1200);
  });
  $("btnShutdown").addEventListener("click", async () => {
    if (!confirm("프로그램을 종료할까요?")) return;
    await fetch("/api/shutdown", { method: "POST" });
    document.body.innerHTML =
      '<p style="padding:40px;text-align:center;font-family:sans-serif">종료되었습니다. 창을 닫아도 됩니다.</p>';
  });

  (async () => {
    const res = await fetch("/api/meta");
    meta = await res.json();
    setSecretBadge(!!meta.adminSecretLoaded);
    fillCategories();
    applySettings(meta.settings || {});

    // 창을 다시 열어도 진행 중 작업·직전 결과를 이어서 표시
    try {
      const jobRes = await fetch("/api/job", { cache: "no-store" });
      const job = await jobRes.json();
      if (job.running) {
        setRunning(true);
        await startPoll();
      } else {
        renderJob(job);
      }
    } catch {
      // 무시
    }
  })();
})();
