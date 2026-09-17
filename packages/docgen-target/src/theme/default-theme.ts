/** DefaultTheme CSS — v1 single theme seam. */
export const DEFAULT_THEME_CSS = `
:root {
  --dg-bg: #f7f5f1;
  --dg-fg: #1a1a1a;
  --dg-muted: #5c5c5c;
  --dg-accent: #0b5fff;
  --dg-border: #d9d4cb;
  --dg-code-bg: #ece8e0;
  --dg-max: 52rem;
  --dg-sidebar: 16.5rem;
  --dg-font: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --dg-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--dg-font);
  color: var(--dg-fg);
  background: var(--dg-bg);
  line-height: 1.55;
}
.dg-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1.25rem 2rem;
  border-bottom: 1px solid var(--dg-border);
  padding: 1rem 1.25rem;
  background: #fff;
}
.dg-header a { color: var(--dg-accent); text-decoration: none; }
.dg-header a:hover { text-decoration: underline; }
.dg-brand { font-weight: 700; font-size: 1.1rem; margin: 0; }
.dg-nav { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; font-size: 0.95rem; margin: 0; }
.dg-nav a[aria-current="true"] { font-weight: 700; color: var(--dg-fg); }
.dg-shell {
  display: flex;
  align-items: flex-start;
  gap: 0;
  min-height: calc(100vh - 4.5rem);
}
.dg-sidebar {
  flex: 0 0 var(--dg-sidebar);
  width: var(--dg-sidebar);
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: 100vh;
  overflow: auto;
  padding: 1.25rem 1rem 2rem 1.25rem;
  border-right: 1px solid var(--dg-border);
  background: #fff;
  font-size: 0.9rem;
}
.dg-side-nav a { color: var(--dg-fg); text-decoration: none; }
.dg-side-nav a:hover { color: var(--dg-accent); }
.dg-side-nav a[aria-current="page"] {
  font-weight: 700;
  color: var(--dg-accent);
}
.dg-toc {
  list-style: none;
  margin: 0;
  padding: 0;
}
.dg-toc .dg-toc {
  margin: 0.2rem 0 0.4rem 0.75rem;
  padding-left: 0.65rem;
  border-left: 1px solid var(--dg-border);
}
.dg-toc-page, .dg-toc-group { margin: 0.2rem 0; }
.dg-toc-group > a,
.dg-toc-group-label {
  display: block;
  font-weight: 650;
  margin: 0.55rem 0 0.2rem;
  color: var(--dg-muted);
}
.dg-toc-group.is-active > a,
.dg-toc-group.is-active > .dg-toc-group-label {
  color: var(--dg-fg);
}
.dg-main {
  flex: 1 1 auto;
  max-width: var(--dg-max);
  margin: 0;
  padding: 1.5rem 1.5rem 3rem;
  min-width: 0;
}
.dg-main h1 { font-size: 1.85rem; margin: 0 0 1rem; line-height: 1.25; }
.dg-main h2 { font-size: 1.35rem; margin: 1.75rem 0 0.75rem; }
.dg-main p { margin: 0 0 1rem; }
.dg-main section { margin: 0 0 1.25rem; }
.dg-main ul { margin: 0 0 1rem; padding-left: 1.25rem; }
.dg-main li { margin: 0.25rem 0; }
.dg-main pre {
  background: var(--dg-code-bg);
  border: 1px solid var(--dg-border);
  padding: 0.85rem 1rem;
  overflow-x: auto;
  font-family: var(--dg-mono);
  font-size: 0.88rem;
  margin: 0 0 1rem;
}
.dg-main code { font-family: var(--dg-mono); font-size: 0.9em; }
.dg-main img { max-width: 100%; height: auto; }
.dg-nav-block { margin: 1rem 0 1.5rem; padding: 0.75rem 1rem; border: 1px solid var(--dg-border); background: #fff; }
.dg-nav-block h2 { margin-top: 0; font-size: 1.1rem; }
.dg-muted { color: var(--dg-muted); font-size: 0.95rem; }
@media (max-width: 860px) {
  .dg-shell { flex-direction: column; }
  .dg-sidebar {
    position: static;
    width: 100%;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--dg-border);
  }
}
`.trim();
