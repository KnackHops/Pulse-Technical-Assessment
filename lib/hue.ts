// Deterministic per-id hue so a peer's dot color is the same everywhere it's
// drawn — on the map and in the connection cards. Shared by WorldMap + page.

// Per-id hue (0–359) from a small string hash.
export function dotHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

// The exact dot fill the map uses, so cards match the on-map dot.
export function hueCss(id: string): string {
  return `hsl(${dotHue(id)} 70% 60%)`;
}
