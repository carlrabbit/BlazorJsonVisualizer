export const SUPPORTED_SCHEMA_VERSIONS = ["1.0"] as const;
export const SUPPORTED_MODES = ["dark"] as const;

export type SupportedSchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number];
export type SupportedMode = (typeof SUPPORTED_MODES)[number];

export interface ThemePluginTokens {
  readonly tokens: Record<string, string>;
}

export interface ThemeDocument {
  readonly schemaVersion: string;
  readonly id: string;
  readonly name: string;
  readonly mode: string;
  readonly tokens: Record<string, string>;
  readonly plugins: Record<string, ThemePluginTokens>;
}

export interface ThemeDiagnostic {
  readonly field: string;
  readonly message: string;
}

export interface ThemeParseResult {
  readonly valid: boolean;
  readonly theme: ThemeDocument | undefined;
  readonly diagnostics: readonly ThemeDiagnostic[];
}

export interface ThemeExportResult {
  readonly json: string;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  for (const v of Object.values(value)) {
    if (typeof v !== "string") {
      return false;
    }
  }

  return true;
}

function isPluginTokensRecord(
  value: unknown
): value is Record<string, ThemePluginTokens> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  for (const entry of Object.values(value)) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      Array.isArray(entry)
    ) {
      return false;
    }

    const pluginEntry = entry as Record<string, unknown>;
    if (!("tokens" in pluginEntry)) {
      return false;
    }

    if (!isStringRecord(pluginEntry["tokens"])) {
      return false;
    }
  }

  return true;
}

export function parseTheme(json: string): ThemeParseResult {
  const diagnostics: ThemeDiagnostic[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      theme: undefined,
      diagnostics: [{ field: "(root)", message: "Theme JSON is not valid JSON." }],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      theme: undefined,
      diagnostics: [
        {
          field: "(root)",
          message: "Theme JSON must be a JSON object.",
        },
      ],
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj["schemaVersion"] !== "string") {
    diagnostics.push({
      field: "schemaVersion",
      message: "Required field 'schemaVersion' must be a string.",
    });
  } else if (
    !(SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(
      obj["schemaVersion"]
    )
  ) {
    diagnostics.push({
      field: "schemaVersion",
      message: `Unsupported schemaVersion '${obj["schemaVersion"]}'. Supported: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`,
    });
  }

  if (typeof obj["id"] !== "string") {
    diagnostics.push({
      field: "id",
      message: "Required field 'id' must be a string.",
    });
  }

  if (typeof obj["name"] !== "string") {
    diagnostics.push({
      field: "name",
      message: "Required field 'name' must be a string.",
    });
  }

  if (typeof obj["mode"] !== "string") {
    diagnostics.push({
      field: "mode",
      message: "Required field 'mode' must be a string.",
    });
  } else if (
    !(SUPPORTED_MODES as readonly string[]).includes(obj["mode"])
  ) {
    diagnostics.push({
      field: "mode",
      message: `Unsupported mode '${obj["mode"]}'. Supported: ${SUPPORTED_MODES.join(", ")}.`,
    });
  }

  if (!("tokens" in obj)) {
    diagnostics.push({
      field: "tokens",
      message: "Required field 'tokens' is missing.",
    });
  } else if (!isStringRecord(obj["tokens"])) {
    diagnostics.push({
      field: "tokens",
      message:
        "Field 'tokens' must be an object where all values are strings.",
    });
  }

  if ("plugins" in obj && !isPluginTokensRecord(obj["plugins"])) {
    diagnostics.push({
      field: "plugins",
      message:
        "Field 'plugins' must be an object where each entry has a 'tokens' map with string values.",
    });
  }

  if (diagnostics.length > 0) {
    return { valid: false, theme: undefined, diagnostics };
  }

  const theme: ThemeDocument = {
    schemaVersion: obj["schemaVersion"] as string,
    id: obj["id"] as string,
    name: obj["name"] as string,
    mode: obj["mode"] as string,
    tokens: obj["tokens"] as Record<string, string>,
    plugins: "plugins" in obj
      ? (obj["plugins"] as Record<string, ThemePluginTokens>)
      : {},
  };

  return { valid: true, theme, diagnostics: [] };
}

export function exportTheme(theme: ThemeDocument): ThemeExportResult {
  const normalized = {
    schemaVersion: theme.schemaVersion,
    id: theme.id,
    name: theme.name,
    mode: theme.mode,
    tokens: theme.tokens,
    plugins: theme.plugins,
  };

  return { json: JSON.stringify(normalized, null, 2) };
}
