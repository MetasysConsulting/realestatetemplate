/**
 * Keep login/register modals from chrome tail; drop mobile offcanvas nav
 * (it can sit on top of search UI and steal clicks toward "/").
 */
export function sanitizeChromeTailForSearch(tailHtml: string): string {
  if (!tailHtml.trim()) return "";

  let html = tailHtml;
  html = html.replace(/<!--\s*mobile-nav\s*-->[\s\S]*?(?=<!--|\s*$)/i, "");
  html = html.replace(
    /<div[^>]*id=["']menu-mobile["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i,
    "",
  );
  html = html.replace(
    /<div[^>]*class=["'][^"']*mobile-nav-wrap[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/i,
    "",
  );
  return html.trim();
}
