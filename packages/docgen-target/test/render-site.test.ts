import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  bootstrapTypeRegistry,
  TypeRegistry,
} from "@blockml/framework";
import { clearTargets, compileToOutput, registerTarget } from "@blockml/compiler";
import { readFileSync } from "node:fs";
import { DocgenTarget } from "../src/docgen-target.js";
import { validatePublishReady } from "../src/validate-publish-ready.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const repoRoot = join(pkgRoot, "../..");
const docgenLibrary = join(
  repoRoot,
  "packages/docgen/blocks/org/blockml/bml/docgen/Library.bml",
);

function bootstrapFixture(fixtureDir: string): TypeRegistry {
  const result = bootstrapTypeRegistry({
    rootDir: repoRoot,
    libraryPaths: [docgenLibrary],
    paths: [fixtureDir],
  });
  const errors = result.diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      `bootstrap failed:\n${errors.map((d) => d.message).join("\n")}`,
    );
  }
  return result.registry;
}

describe("validatePublishReady", () => {
  it("accepts the mini publish-ready DocSet", () => {
    const fixtureDir = join(__dirname, "fixtures/mini-docset");
    const registry = bootstrapFixture(fixtureDir);
    const diags = validatePublishReady(
      registry,
      "org.blockml.bml.target.docgen.fixture.MiniDocSet",
    );
    expect(diags).toEqual([]);
  });

  it("rejects pages that still have message altitude", () => {
    const fixtureDir = join(__dirname, "fixtures/dirty-docset");
    const registry = bootstrapFixture(fixtureDir);
    const diags = validatePublishReady(
      registry,
      "org.blockml.bml.target.docgen.fixture.dirty.DirtyDocSet",
    );
    expect(diags.some((d) => d.code === "BML_DOCGEN_PUBLISH_NOT_READY")).toBe(
      true,
    );
    expect(diags.some((d) => d.message.includes("message"))).toBe(true);
  });
});

describe("DocgenTarget render", () => {
  it("emits HTML for the mini DocSet", () => {
    clearTargets();
    registerTarget(new DocgenTarget());

    const fixtureDir = join(__dirname, "fixtures/mini-docset");
    const registry = bootstrapFixture(fixtureDir);
    const hostPath = join(fixtureDir, "MiniDocSet.bml");
    const source = readFileSync(hostPath, "utf8");

    const result = compileToOutput(
      {
        scope: {
          kind: "document",
          document: { source, filePath: hostPath },
        },
      },
      "docgen",
      { typeRegistry: registry, rootDir: repoRoot },
    );

    expect(result.success).toBe(true);
    expect(result.output?.files.length).toBeGreaterThanOrEqual(2);
    const home = result.output?.files.find((f) => f.path === "home.html");
    const about = result.output?.files.find((f) => f.path === "about.html");
    const index = result.output?.files.find((f) => f.path === "index.html");
    expect(home?.content).toContain("This is the home page");
    expect(home?.content).toContain("<pre><code>");
    expect(home?.content).toContain("First item");
    expect(home?.content).toContain('class="dg-sidebar"');
    expect(home?.content).toContain("dg-toc-page");
    expect(about?.content).toContain("About explains");
    expect(about?.content).toContain("Also read");
    expect(index?.content).toContain("This is the home page");
  });

  it("returns gate diagnostics for dirty DocSet", () => {
    clearTargets();
    registerTarget(new DocgenTarget());

    const fixtureDir = join(__dirname, "fixtures/dirty-docset");
    const registry = bootstrapFixture(fixtureDir);
    const hostPath = join(fixtureDir, "DirtyDocSet.bml");
    const source = readFileSync(hostPath, "utf8");

    const result = compileToOutput(
      {
        scope: {
          kind: "document",
          document: { source, filePath: hostPath },
        },
      },
      "docgen",
      { typeRegistry: registry, rootDir: repoRoot },
    );

    expect(result.success).toBe(false);
    expect(
      [...result.diagnostics, ...(result.output?.diagnostics ?? [])].some(
        (d) => d.code === "BML_DOCGEN_PUBLISH_NOT_READY",
      ) ||
        result.diagnostics.some((d) => d.code === "BML_DOCGEN_PUBLISH_NOT_READY"),
    ).toBe(true);
  });
});
