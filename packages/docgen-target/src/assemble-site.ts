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
import { lookupByTypeRef } from "./html.js";
import { docSetHomePage, docSetTitle } from "./host.js";
import { highlightSiteFiles } from "./highlight-assets.js";
import { wrapMainLayout } from "./layout/default-main-layout.js";
import { buildSiteNav } from "./navigation.js";
import { renderPageBody } from "./render-content.js";

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
    const { mainMenu, sideTree } = buildSiteNav(
      registry,
      docSetFqn,
      pathByPageFqn,
      pageFqn,
    );
    const html = wrapMainLayout({
      documentTitle: `${pageTitle} — ${siteTitle}`,
      siteTitle,
      pagePath,
      mainMenu,
      sideTree,
      bodyInner,
    });
    files.push({ path: pagePath, content: html });
  }

  if (homePage) {
    const homePath = lookupByTypeRef(homePage, pathByPageFqn);
    const homeFile = homePath ? files.find((f) => f.path === homePath) : undefined;
    if (homeFile && homePath !== "index.html" && !files.some((f) => f.path === "index.html")) {
      files.push({ path: "index.html", content: homeFile.content });
    }
  } else if (files.length > 0 && !files.some((f) => f.path === "index.html")) {
    files.push({ path: "index.html", content: files[0]!.content });
  }

  files.push(...highlightSiteFiles());

  return { files, diagnostics };
}
