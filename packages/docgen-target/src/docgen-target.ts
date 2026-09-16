import type { Diagnostic } from "@blockml/bom";
import type {
  CompileRequest,
  RenderContext,
  RenderOutput,
  RenderTarget,
} from "@blockml/compiler";
import { assembleSite } from "./assemble-site.js";
import { resolveHostDocSetFqn } from "./host.js";
import { DOCSET_BASE_TYPE, resolveDocgenOptions } from "./options.js";
import { validatePublishReady } from "./validate-publish-ready.js";

export interface DocgenRenderOutput extends RenderOutput {
  files: { path: string; content: string }[];
  diagnostics?: Diagnostic[];
}

function errorDiag(code: string, message: string, file: string): Diagnostic {
  return {
    severity: "error",
    code,
    message,
    source: { file, line: 1, column: 1 },
  };
}

export class DocgenTarget implements RenderTarget {
  readonly name = "docgen";
  readonly accepts: Array<"document"> = ["document"];

  validateRequest(request: CompileRequest): Diagnostic[] {
    void request;
    return [];
  }

  render(request: CompileRequest, ctx: RenderContext): DocgenRenderOutput {
    resolveDocgenOptions(request.targetOptions as Record<string, unknown> | undefined);
    const registry = ctx.session.typeRegistry;
    const hostPath = ctx.session.sourceFilePath;

    const host = resolveHostDocSetFqn(registry, hostPath);
    if (!host.fqn || !host.block) {
      return {
        files: [],
        diagnostics: [
          errorDiag(
            "BML_DOCGEN_HOST_NOT_DOCSET",
            host.error ?? `Host must be a subtype of ${DOCSET_BASE_TYPE}`,
            hostPath ?? "<host>",
          ),
        ],
      };
    }

    const gate = validatePublishReady(registry, host.fqn);
    if (gate.length > 0) {
      return { files: [], diagnostics: gate };
    }

    const assembled = assembleSite(registry, host.fqn);
    if (assembled.diagnostics.some((d) => d.severity === "error")) {
      return { files: [], diagnostics: assembled.diagnostics };
    }

    return {
      files: assembled.files,
      diagnostics: assembled.diagnostics.filter((d) => d.severity !== "info"),
    };
  }
}
