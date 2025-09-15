export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function html(strings: TemplateStringsArray, ...values: any[]): string {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    // Don't escape if explicitly marked as safe HTML
    const escaped = value?.__html ? value.__html : escapeHtml(String(value ?? ""));
    result += escaped + strings[i + 1];
  }

  return result;
}

export function safeHtml(html: string) {
  return { __html: html };
}
