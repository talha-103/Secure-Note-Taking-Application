export function parseInterests(value) {
  return value
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean);
}
