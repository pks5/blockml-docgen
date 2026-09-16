import { escapeHtml } from "../html.js";
import { relativePath } from "../html.js";
import { DEFAULT_THEME_CSS } from "../theme/default-theme.js";

export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
}

export function wrapMainLayout(args: {
  documentTitle: string;
  siteTitle: string;
  pagePath: string;
  nav: NavLink[];
  bodyInner: string;
}): string {
  const navHtml = args.nav
    .map((link) => {
      const href = relativePath(args.pagePath, link.href);
      const current = link.current ? ` aria-current="page"` : "";
      return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(link.label)}</a>`;
    })
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(args.documentTitle)}</title>
  <style>${DEFAULT_THEME_CSS}</style>
</head>
<body>
  <header class="dg-header">
    <p class="dg-brand">${escapeHtml(args.siteTitle)}</p>
    <nav class="dg-nav" aria-label="Site">
      ${navHtml}
    </nav>
  </header>
  <main class="dg-main">
${args.bodyInner}
  </main>
</body>
</html>
`;
}
