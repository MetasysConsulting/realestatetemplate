export type TemplateChromeParts = {
  headerHtml: string;
  footerHtml: string;
  tailHtml: string;
};

export function extractTemplateChrome(html: string): TemplateChromeParts {
  const headerHtml = html.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
  const footerHtml = html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? "";

  const loginStart = html.indexOf("<!-- .login -->");
  const mobileStart = html.indexOf("<!-- mobile-nav -->");
  const tailStart =
    loginStart >= 0 ? loginStart : mobileStart >= 0 ? mobileStart : -1;

  let tailHtml = "";
  if (tailStart >= 0) {
    const mobileEnd = html.indexOf("</div>", html.lastIndexOf('id="menu-mobile"'));
    const closeOffcanvas = html.indexOf("</div>", mobileEnd + 1);
    tailHtml = html.slice(tailStart, closeOffcanvas > tailStart ? closeOffcanvas + 6 : undefined);
  }

  return { headerHtml, footerHtml, tailHtml };
}
