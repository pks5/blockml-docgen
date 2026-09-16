import type { MemberValue } from "@blockml/bom";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function memberValueAsText(value: MemberValue | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value.kind === "literal") {
    return value.value == null ? undefined : String(value.value);
  }
  if (value.kind === "expression" || value.kind === "interpolated") {
    return value.raw;
  }
  return value.address.raw;
}

export function relativePath(from: string, to: string): string {
  const fromParts = from.split("/").filter(Boolean);
  const toParts = to.split("/").filter(Boolean);
  fromParts.pop();
  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++;
  }
  const ups = fromParts.length - common;
  const prefix = ups === 0 ? "./" : "../".repeat(ups);
  return prefix + toParts.slice(common).join("/");
}

export function kebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

export function simpleName(fqn: string): string {
  const parts = fqn.split(".");
  return parts[parts.length - 1] ?? fqn;
}
