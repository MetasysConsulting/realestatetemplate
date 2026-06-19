/** Normalize CRLF from legacy HTML templates so SSR and client hydration match. */
export function normalizeTemplateHtml(html: string): string {
  return html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
