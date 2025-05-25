export function calculateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}
