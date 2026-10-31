// WCAG 2.1 contrast check for the design tokens in specs/001-public-site-redesign/contracts/design-tokens.md.
// Usage: node scripts/check-contrast.mjs
// Exits non-zero if any declared normal-text pair is under 4.5:1 or large-text pair under 3:1.

const palette = {
  paper: "#FBFBF8",
  teal: "#0A2B36",
  "teal-mid": "#12404F",
  cyan: "#27A9D8",
  chile: "#D62F25",
  lime: "#C9E265",
  agave: "#1F6B4A",
  muted: "#4F6168",
  white: "#FFFFFF",
};

// [foreground, background, kind] where kind is "text" (4.5:1) or "large" (3:1)
const pairs = [
  ["teal", "paper", "text"],
  ["muted", "paper", "text"],
  ["paper", "teal", "text"],
  ["paper", "teal-mid", "text"],
  ["white", "chile", "text"],
  ["chile", "paper", "text"],
  ["cyan", "teal", "text"],
  ["lime", "teal", "text"],
  ["teal", "lime", "text"],
  ["agave", "paper", "text"],
  ["paper", "agave", "text"],
  ["teal", "cyan", "text"],
  ["chile", "teal", "large"],
];

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failed = 0;
for (const [fg, bg, kind] of pairs) {
  const value = ratio(palette[fg], palette[bg]);
  const min = kind === "large" ? 3 : 4.5;
  const ok = value >= min;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${fg.padEnd(9)} on ${bg.padEnd(9)} ${value.toFixed(2).padStart(5)}  (${kind}, min ${min})`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} pair(s) below the required contrast.`);
  process.exit(1);
}
console.log("\nAll declared pairs pass.");
