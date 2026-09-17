import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bootstrapFullProjectRegistry } from "@blockml/framework";
import {
  buildPagePathMap,
  compositionInstanceFqns,
  getBlockLevelComposition,
  registryHasDoc,
} from "../src/bom-walk.js";
import { buildSiteNav, refsGroup } from "../src/navigation.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const repoRoot = join(pkgRoot, "../..");

describe("page group navigation", () => {
  it("resolves QName parent refs to group FQNs", () => {
    const fqn =
      "org.blockml.bml.bmldocs.a04_rendering.data.pagegroup.RootPageGroup";
    expect(refsGroup("a04pgroup:RootPageGroup", fqn)).toBe(true);
    expect(refsGroup(fqn, fqn)).toBe(true);
    expect(refsGroup("RootPageGroup", fqn)).toBe(true);
  });

  it("builds main menu from root children and side TOC under Docs", () => {
    const { registry, diagnostics } = bootstrapFullProjectRegistry({
      rootDir: repoRoot,
    });
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);

    const docSetFqn = "org.blockml.bml.bmldocs.a04_rendering.data.BmlDocSet_A04";
    const docSet = registryHasDoc(registry, docSetFqn)!;
    const pageFqns = compositionInstanceFqns(
      getBlockLevelComposition(docSet, "pages"),
    );
    const pathByPageFqn = buildPagePathMap(docSet, pageFqns);
    const introFqn =
      "org.blockml.bml.bmldocs.a04_rendering.data.page.docs.Introduction";

    const nav = buildSiteNav(registry, docSetFqn, pathByPageFqn, introFqn);

    expect(nav.mainMenu.map((m) => m.label)).toEqual(["Documentation"]);
    expect(nav.mainMenu[0]?.current).toBe(true);

    const labels = flattenLabels(nav.sideTree);
    expect(labels).toContain("Documentation"); // DocsPageGroup ToC page title
    expect(labels).toContain("Getting Started");
    expect(labels).toContain("Introduction to BlockML");
    expect(labels).toContain("Foundations");
    expect(labels).toContain("Blocks");

    const introNode = findPage(nav.sideTree, "Introduction to BlockML");
    expect(introNode?.current).toBe(true);
  });
});

function flattenLabels(nodes: { label: string; children?: unknown[] }[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    out.push(n.label);
    if (n.children) {
      out.push(...flattenLabels(n.children as { label: string; children?: unknown[] }[]));
    }
  }
  return out;
}

function findPage(
  nodes: { kind?: string; label: string; current?: boolean; children?: unknown[] }[],
  label: string,
): { label: string; current?: boolean } | undefined {
  for (const n of nodes) {
    if (n.label === label) {
      return n;
    }
    if (n.children) {
      const found = findPage(
        n.children as {
          kind?: string;
          label: string;
          current?: boolean;
          children?: unknown[];
        }[],
        label,
      );
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
