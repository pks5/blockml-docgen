export interface DocgenOptions {
  rootDir?: string;
}

export const DEFAULT_DOCGEN_OPTIONS: Required<DocgenOptions> = {
  rootDir: "",
};

export function resolveDocgenOptions(
  targetOptions: Record<string, unknown> | undefined,
): Required<DocgenOptions> {
  const rootDir =
    typeof targetOptions?.rootDir === "string" && targetOptions.rootDir.length > 0
      ? targetOptions.rootDir
      : process.cwd();
  return { rootDir };
}

export const DOCSET_BASE_TYPE = "org.blockml.bml.docgen.core.DocSet";
export const PAGE_MAPPING_TYPE = "org.blockml.bml.docgen.core.PageMapping";
export const TYPE_REF_ENTITY = "org.blockml.bml.type.TypeReferenceEntity";

export const PAGE_FQNS = {
  section: "org.blockml.bml.docgen.page.Section",
  paragraph: "org.blockml.bml.docgen.page.Paragraph",
  text: "org.blockml.bml.docgen.page.Text",
  codeBlock: "org.blockml.bml.docgen.page.CodeBlock",
  list: "org.blockml.bml.docgen.page.List",
  listItem: "org.blockml.bml.docgen.page.ListItem",
  image: "org.blockml.bml.docgen.page.Image",
  navigation: "org.blockml.bml.docgen.page.Navigation",
  navigationItem: "org.blockml.bml.docgen.page.NavigationItem",
} as const;
