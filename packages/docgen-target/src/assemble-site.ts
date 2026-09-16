import type { Diagnostic } from "@blockml/bom";
import type { RenderOutputFile } from "@blockml/compiler";
import type { TypeRegistry } from "@blockml/framework";
import {
  buildPagePathMap,
  compositionInstanceFqns,
  getBlockLevelComposition,
  getPropertyText,
  registryHasDoc,
} from "./bom-walk.js";
import { docSetHomePage, docSetRootPageGroup, docSetTitle } from "./host.js";
import { wrapMainLayout, type NavLink } from "./layout/default-main-layout.js";
import { renderPageBody } from "./render-content.js";

function buildNav(
  registry: TypeRegistry,
  docSetFqn: string,
  pathByPageFqn: Map<string, string>,
  currentPageFqn: string,
): NavLink[] {
  const docSet = registryHasDoc(registry, docSetFqn)!;
  const rootGroupFqn = docSetRootPageGroup(docSet);
  const links: NavLink[] = [];

  if (rootGroupFqn) {
    const group = registryHasDoc(registry, rootGroupFqn);
    if (group) {
      const pageFqns = compositionInstanceFqns(getBlockLevelComposition(group, "pages"));
      for (const fqn of pageFqns) {
        const page = registryHasDoc(registry, fqn);
        const href = pathByPageFqn.get(fqn);
        if (!page || !href) {
          continue;
        }
        links.push({
          label: getPropertyText(page, "title") ?? page.name,
          href,
          current: fqn === currentPageFqn,
        });
      }
    }
  }

  if (links.length === 0) {
    const pageFqns = compositionInstanceFqns(getBlockLevelComposition(docSet, "pages"));
    for (const fqn of pageFqns) {
      const page = registryHasDoc(registry, fqn);
      const href = pathByPageFqn.get(fqn);
      if (!page || !href) {
        continue;
      }
      links.push({
        label: getPropertyText(page, "title") ?? page.name,
        href,
        current: fqn === currentPageFqn,
      });
    }
  }

  return links;
}

export function assembleSite(
  registry: TypeRegistry,
  docSetFqn: string,
): { files: RenderOutputFile[]; diagnostics: Diagnostic[] } {
  const docSet = registryHasDoc(registry, docSetFqn);
  if (!docSet) {
    return {
      files: [],
      diagnostics: [
        {
          severity: "error",
          code: "BML_DOCGEN_HOST_NOT_DOCSET",
          message: `DocSet ${docSetFqn} not found`,
          source: { file: "<registry>", line: 1, column: 1 },
        },
      ],
    };
  }

  const pageFqns = compositionInstanceFqns(getBlockLevelComposition(docSet, "pages"));
  const pathByPageFqn = buildPagePathMap(docSet, pageFqns);
  const siteTitle = docSetTitle(docSet);
  const homePage = docSetHomePage(docSet);
  const files: RenderOutputFile[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const pageFqn of pageFqns) {
    const page = registryHasDoc(registry, pageFqn);
    if (!page) {
      diagnostics.push({
        severity: "error",
        code: "BML_DOCGEN_PAGE_MISSING",
        message: `Page ${pageFqn} missing from registry`,
        source: { file: "<registry>", line: 1, column: 1 },
      });
      continue;
    }
    const pagePath = pathByPageFqn.get(pageFqn)!;
    const pageTitle = getPropertyText(page, "title") ?? page.name;
    const bodyInner = renderPageBody(pageFqn, {
      registry,
      pagePath,
      pathByPageFqn,
    });
    const nav = buildNav(registry, docSetFqn, pathByPageFqn, pageFqn);
    const html = wrapMainLayout({
      documentTitle: `${pageTitle} — ${siteTitle}`,
      siteTitle,
      pagePath,
      nav,
      bodyInner,
    });
    files.push({ path: pagePath, content: html });
  }

  if (homePage) {
    const homePath = pathByPageFqn.get(homePage);
    const homeFile = homePath ? files.find((f) => f.path === homePath) : undefined;
    if (homeFile && homePath !== "index.html" && !files.some((f) => f.path === "index.html")) {
      files.push({ path: "index.html", content: homeFile.content });
    }
  } else if (files.length > 0 && !files.some((f) => f.path === "index.html")) {
    files.push({ path: "index.html", content: files[0]!.content });
  }

  return { files, diagnostics };
}
