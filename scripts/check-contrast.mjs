// WCAG 2.1 contrast check for the design tokens in specs/001-public-site-redesign/contracts/design-tokens.md
// and the admin light and dark themes in specs/002-admin-redesign/contracts/admin-ui-contract.md.
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

// ---- Admin themes (keep the values in sync with src/app/admin/admin.css) ----
const adminThemes = {
  light: {
    bg: "#F4F6F5",
    surface: "#FFFFFF",
    "surface-2": "#ECF0EF",
    text: "#0A2B36",
    muted: "#4F6168",
    accent: "#0A2B36",
    "on-accent": "#FBFBF8",
    action: "#D62F25",
    white: "#FFFFFF",
    "new-bg": "#DDF0FA",
    "new-fg": "#0A2B36",
    "confirmed-bg": "#D9EFE3",
    "confirmed-fg": "#134D35",
    "cancelled-bg": "#FBE0DE",
    "cancelled-fg": "#8E1F18",
    "noshow-bg": "#E8E8E4",
    "noshow-fg": "#3D4A4F",
    "warn-bg": "#FBE9CC",
    "warn-fg": "#6B3F00",
  },
  dark: {
    bg: "#0B1417",
    surface: "#121D21",
    "surface-2": "#1A282D",
    text: "#EAF1F1",
    muted: "#9DB0B5",
    accent: "#C9E265",
    "on-accent": "#0B1417",
    action: "#D62F25",
    white: "#FFFFFF",
    "new-bg": "#12384A",
    "new-fg": "#BEE6F7",
    "confirmed-bg": "#14402E",
    "confirmed-fg": "#BFE8D2",
    "cancelled-bg": "#4A1B18",
    "cancelled-fg": "#F6C6C2",
    "noshow-bg": "#2A3539",
    "noshow-fg": "#C9D4D6",
    "warn-bg": "#4A3410",
    "warn-fg": "#F6DCB0",
  },
};

// [foreground, background, kind]: "text" needs 4.5:1, "large" and "ui" (non-text) need 3:1
const adminPairs = [
  ["text", "bg", "text"],
  ["text", "surface", "text"],
  ["text", "surface-2", "text"],
  ["muted", "bg", "text"],
  ["muted", "surface", "text"],
  ["muted", "surface-2", "text"],
  ["accent", "bg", "text"],
  ["accent", "surface", "text"],
  ["on-accent", "accent", "text"],
  ["white", "action", "text"],
  ["action", "bg", "ui"],
  ["new-fg", "new-bg", "text"],
  ["confirmed-fg", "confirmed-bg", "text"],
  ["cancelled-fg", "cancelled-bg", "text"],
  ["noshow-fg", "noshow-bg", "text"],
  ["warn-fg", "warn-bg", "text"],
];

for (const [theme, colors] of Object.entries(adminThemes)) {
  console.log(`\nAdmin ${theme} theme`);
  for (const [fg, bg, kind] of adminPairs) {
    const value = ratio(colors[fg], colors[bg]);
    const min = kind === "text" ? 4.5 : 3;
    const ok = value >= min;
    if (!ok) failed += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${fg.padEnd(13)} on ${bg.padEnd(13)} ${value.toFixed(2).padStart(5)}  (${kind}, min ${min})`,
    );
  }
}

if (failed > 0) {
  console.error(`\n${failed} pair(s) below the required contrast.`);
  process.exit(1);
}
console.log("\nAll declared pairs pass.");
