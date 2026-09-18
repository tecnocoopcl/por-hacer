export const PALETTE = [
  "#4fc3f7", "#a5d6a7", "#ffcc80", "#ce93d8", "#ef9a9a",
  "#80cbc4", "#ffab91", "#b0bec5", "#fff176", "#f48fb1",
];

export function colorForCategoria(cat) {
  if (!cat) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
