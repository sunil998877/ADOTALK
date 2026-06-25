export function isValidObjectId(id?: string): id is string {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

export function resolveObjectId(...candidates: (string | string[] | undefined)[]): string | undefined {
  for (const candidate of candidates) {
    const id = Array.isArray(candidate) ? candidate[0] : candidate;
    if (isValidObjectId(id)) return id;
  }
  return undefined;
}
