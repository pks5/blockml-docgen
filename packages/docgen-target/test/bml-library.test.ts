import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "@blockml/parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const blocksRoot = join(pkgRoot, "blocks/org/blockml/bml/target/docgen");

const EXPECTED = [
  "DocgenType",
  "DocgenOptions",
  "DocgenRenderOutput",
  "DocgenConstants",
  "DefaultMainLayout",
  "DefaultTheme",
  "HighlightJs",
  "Render",
  "ValidatePublishReady",
  "AssembleSite",
  "RenderPageBody",
  "WrapMainLayout",
  "ArchitectureOverview",
  "V1Scope",
  "PublicApi",
];

function walkBmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkBmlFiles(full));
    } else if (entry.endsWith(".bml")) {
      results.push(full);
    }
  }
  return results;
}

function parseLibraryCatalog(): Set<string> {
  const library = readFileSync(join(blocksRoot, "Library.bml"), "utf8");
  const catalog = new Set<string>();
  const blocksSection = library.match(/<blocks(?:\s[^>]*)?>([\s\S]*?)<\/blocks>/)?.[1];
  expect(blocksSection, "Library.bml blocks aggregation").toBeTruthy();
  const compRegex = /<(?:[\w]+:)?(\w+)\s*\/>/g;
  let m;
  while ((m = compRegex.exec(blocksSection!)) !== null) {
    catalog.add(m[1]!);
  }
  return catalog;
}

describe("DocGen BML library", () => {
  it("parses every target .bml file without error diagnostics", () => {
    const files = walkBmlFiles(blocksRoot);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const result = parse(source, { filePath: file, continueOnError: true });
      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors, file).toEqual([]);
    }
  });

  it("catalog lists expected blocks", () => {
    const catalog = parseLibraryCatalog();
    for (const name of EXPECTED) {
      expect(catalog.has(name), name).toBe(true);
    }
  });
});
