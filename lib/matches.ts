export function matchNumberFromSlug(slug: string | null | undefined) {
  if (!slug) return "—";
  const numeric = slug.match(/[0-9]+/)?.[0];
  return numeric ?? slug;
}

export function matchNumberValue(slug: string | null | undefined) {
  const value = Number.parseInt(matchNumberFromSlug(slug), 10);
  return Number.isFinite(value) ? value : 0;
}

export function compareMatchesByNumberDesc<T extends { slug: string }>(a: T, b: T) {
  return matchNumberValue(b.slug) - matchNumberValue(a.slug);
}