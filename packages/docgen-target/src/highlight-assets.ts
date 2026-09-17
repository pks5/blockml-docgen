import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RenderOutputFile } from "@blockml/compiler";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Mirrors org.blockml.bml.target.docgen.config.HighlightJs. */
export const HIGHLIGHT_CORE_SCRIPT = "js/highlight/highlight.min.js";
export const HIGHLIGHT_BLOCKML_GRAMMAR = "js/highlight/languages/blockml.min.js";
export const HIGHLIGHT_STYLESHEET = "js/highlight/styles/a11y-dark.min.css";
export const DEFAULT_CODE_LANGUAGE = "blockml";

const LANGUAGE_ID_RE = /^[A-Za-z][\w-]*$/;

const VENDOR_FILES: ReadonlyArray<{ vendor: string; path: string }> = [
  {
    vendor: "vendor/highlight/highlight.min.js",
    path: HIGHLIGHT_CORE_SCRIPT,
  },
  {
    vendor: "vendor/highlight/languages/blockml.min.js",
    path: HIGHLIGHT_BLOCKML_GRAMMAR,
  },
  {
    vendor: "vendor/highlight/styles/a11y-dark.min.css",
    path: HIGHLIGHT_STYLESHEET,
  },
];

export function highlightLanguageId(language: string | undefined): string {
  if (language && LANGUAGE_ID_RE.test(language)) {
    return language;
  }
  return DEFAULT_CODE_LANGUAGE;
}

export function highlightSiteFiles(): RenderOutputFile[] {
  return VENDOR_FILES.map((asset) => ({
    path: asset.path,
    content: readFileSync(join(PKG_ROOT, asset.vendor), "utf8"),
  }));
}
