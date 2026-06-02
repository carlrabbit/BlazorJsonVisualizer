export type JsonPointerSegment = string | number;

export interface JsonPointerParseResult {
  success: boolean;
  segments: JsonPointerSegment[];
  reason?: "invalidPath";
}

export function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

export function parseJsonPointer(path: string): JsonPointerParseResult {
  if (path === "" || path === "/") {
    return { success: true, segments: [] };
  }

  if (!path.startsWith("/")) {
    return { success: false, segments: [], reason: "invalidPath" };
  }

  const parts = path.slice(1).split("/");
  const segments: JsonPointerSegment[] = parts.map((part) => {
    const decoded = decodeJsonPointerSegment(part);
    const asNumber = Number(decoded);
    // Only treat as array index if it's a non-negative integer with no leading zeros
    if (/^\d+$/.test(decoded) && String(asNumber) === decoded) {
      return asNumber;
    }
    return decoded;
  });

  return { success: true, segments };
}
