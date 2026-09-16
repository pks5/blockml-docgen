import type { BlockDefinition } from "@blockml/bom";
import {
  collectBaseTypeChain,
  rootFqnByFilePath,
  type TypeRegistry,
} from "@blockml/framework";
import { DOCSET_BASE_TYPE } from "./options.js";
import { getPropertyText, registryHasDoc } from "./bom-walk.js";

export function isDocSetType(block: BlockDefinition, registry: TypeRegistry): boolean {
  if (block.type === DOCSET_BASE_TYPE) {
    return true;
  }
  const chain = collectBaseTypeChain(block, registry);
  return chain.some((b) => b.type === DOCSET_BASE_TYPE);
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

export function resolveHostDocSetFqn(
  registry: TypeRegistry,
  sourceFilePath: string | undefined,
): { fqn?: string; block?: BlockDefinition; error?: string } {
  if (!sourceFilePath) {
    return { error: "DocGen requires a host document sourceFilePath" };
  }
  const want = normalizePath(sourceFilePath);
  const roots = rootFqnByFilePath(registry);

  for (const [filePath, fqn] of roots) {
    const file = normalizePath(filePath);
    if (file === want || file.endsWith(want) || want.endsWith(file)) {
      const block = registryHasDoc(registry, fqn);
      if (!block) {
        continue;
      }
      if (!isDocSetType(block, registry)) {
        return {
          error: `Host root ${block.type} is not a subtype of ${DOCSET_BASE_TYPE}`,
        };
      }
      return { fqn: block.type, block };
    }
  }

  const base = want.split("/").pop();
  if (base) {
    const matches: Array<{ fqn: string; block: BlockDefinition }> = [];
    for (const [filePath, fqn] of roots) {
      const file = normalizePath(filePath);
      if (file.endsWith(`/${base}`) || file === base) {
        const block = registryHasDoc(registry, fqn);
        if (block && isDocSetType(block, registry)) {
          matches.push({ fqn: block.type, block });
        }
      }
    }
    if (matches.length === 1) {
      return matches[0]!;
    }
  }

  return { error: `No DocSet host found for file ${sourceFilePath}` };
}

export function docSetTitle(block: BlockDefinition): string {
  return getPropertyText(block, "title") ?? block.name;
}

export function docSetHomePage(block: BlockDefinition): string | undefined {
  return getPropertyText(block, "homePage");
}

export function docSetRootPageGroup(block: BlockDefinition): string | undefined {
  return getPropertyText(block, "rootPageGroup");
}
