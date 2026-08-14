/** 관리자 등록 SEO HTML — script/이벤트 핸들러 등 위험 태그 제거 */
export function sanitizeSeoDetailHtml(input: string): string {
  let html = input.trim();
  if (!html) return "";

  html = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/<meta[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi,
      '$1=$2#$2'
    )
    .replace(/(href|src)\s*=\s*javascript:[^\s>]*/gi, '$1="#"');

  return html.slice(0, 80_000);
}

/** 태그가 없으면 줄바꿈을 문단으로 */
export function normalizeSeoDetailInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeSeoDetailHtml(trimmed) || null;
  }
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
  return sanitizeSeoDetailHtml(paragraphs) || null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
