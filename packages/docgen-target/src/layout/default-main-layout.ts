import { escapeHtml, relativePath } from "../html.js";
import type { NavLink, NavTreeNode } from "../navigation.js";
import { DEFAULT_THEME_CSS } from "../theme/default-theme.js";

function renderNavLink(link: NavLink, pagePath: string): string {
  const href = relativePath(pagePath, link.href);
  // Section-level selection (not a specific page document)
  const current = link.current ? ` aria-current="true"` : "";
  return `<a href="${escapeHtml(href)}"${current}>${escapeHtml(link.label)}</a>`;
}

function renderTreeNodes(nodes: NavTreeNode[], pagePath: string): string {
  if (nodes.length === 0) {
    return "";
  }
  const items = nodes
    .map((node) => {
      if (node.kind === "page") {
        const href = node.href ? relativePath(pagePath, node.href) : "#";
        const current = node.current ? ` aria-current="page"` : "";
        return `<li class="dg-toc-page"><a href="${escapeHtml(href)}"${current}>${escapeHtml(node.label)}</a></li>`;
      }
      const childHtml = node.children?.length
        ? `\n${renderTreeNodes(node.children, pagePath)}`
        : "";
      const label = node.href
        ? `<a href="${escapeHtml(relativePath(pagePath, node.href))}"${node.current ? ` aria-current="true"` : ""}>${escapeHtml(node.label)}</a>`
        : `<span class="dg-toc-group-label">${escapeHtml(node.label)}</span>`;
      return `<li class="dg-toc-group${node.current ? " is-active" : ""}">${label}${childHtml}</li>`;
    })
    .join("\n");
  return `<ul class="dg-toc">\n${items}\n</ul>`;
}

export function wrapMainLayout(args: {
  documentTitle: string;
  siteTitle: string;
  pagePath: string;
  mainMenu: NavLink[];
  sideTree: NavTreeNode[];
  bodyInner: string;
}): string {
  const mainNavHtml =
    args.mainMenu.length > 0
      ? args.mainMenu
          .map((link) => renderNavLink(link, args.pagePath))
          .join("\n      ")
      : "";

  const sideHtml = renderTreeNodes(args.sideTree, args.pagePath);
  const sidebar =
    sideHtml.length > 0
      ? `  <aside class="dg-sidebar">
    <nav class="dg-side-nav" aria-label="Contents">
${sideHtml}
    </nav>
  </aside>`
      : "";

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
    ${
      mainNavHtml
        ? `<nav class="dg-nav" aria-label="Site">
      ${mainNavHtml}
    </nav>`
        : ""
    }
  </header>
  <div class="dg-shell">
${sidebar}
  <main class="dg-main">
${args.bodyInner}
  </main>
  </div>
</body>
</html>
`;
}

export type { NavLink, NavTreeNode };
