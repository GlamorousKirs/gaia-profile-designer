                                                                           

export const THEMES = [
  {
    "id": "dark",
    "name": "Dark Mode",
    "primary": "oklch(0.922 0 0)",
    "bg": "oklch(0.145 0 0)"
  },
  {
    "id": "light",
    "name": "Light Mode",
    "primary": "oklch(0.205 0 0)",
    "bg": "oklch(1 0 0)"
  },
  {
    "id": "amethyst-haze",
    "name": "Amethyst Haze",
    "primary": "oklch(0.7058 0.0777 302.0489)",
    "bg": "oklch(0.2166 0.0215 292.8474)"
  },
  {
    "id": "amethyst-haze-light",
    "name": "Amethyst Haze (Light)",
    "primary": "oklch(0.6104 0.0767 299.7335)",
    "bg": "oklch(0.9777 0.0041 301.4256)"
  },
  {
    "id": "apple",
    "name": "Apple",
    "primary": "oklch(0.62 0.18 250)",
    "bg": "oklch(0.99 0 0)"
  },
  {
    "id": "aurora-neon",
    "name": "Aurora Neon",
    "primary": "oklch(72% 0.23 265)",
    "bg": "oklch(14% 0.04 265)"
  },
  {
    "id": "caffeine",
    "name": "Caffeine",
    "primary": "oklch(0.9247 0.0524 66.1732)",
    "bg": "oklch(0.1776 0 0)"
  },
  {
    "id": "caffeine-light",
    "name": "Caffeine (Light)",
    "primary": "oklch(0.4341 0.0392 41.9938)",
    "bg": "oklch(0.9821 0 0)"
  },
  {
    "id": "catppuccin",
    "name": "Catppuccin",
    "primary": "oklch(0.7871 0.1187 304.7693)",
    "bg": "oklch(0.2155 0.0254 284.0647)"
  },
  {
    "id": "catppuccin-light",
    "name": "Catppuccin (Light)",
    "primary": "oklch(0.5547 0.2503 297.0156)",
    "bg": "oklch(0.9578 0.0058 264.5321)"
  },
  {
    "id": "celestial",
    "name": "Celestial",
    "primary": "oklch(95.547% 0.07539 96.149)",
    "bg": "oklch(12% 0.04 255)"
  },
  {
    "id": "CMYK",
    "name": "CMYK",
    "primary": "oklch(70% 0.22 255)",
    "bg": "oklch(10% 0.02 260)"
  },
  {
    "id": "ink-vapor",
    "name": "Ink Vapor",
    "primary": "oklch(60% 0.12 285)",
    "bg": "oklch(97% 0.005 240)"
  },
  {
    "id": "ivory-chrome",
    "name": "Ivory Chrome",
    "primary": "oklch(62% 0.10 255)",
    "bg": "oklch(98% 0.01 95)"
  },
  {
    "id": "marshmallow",
    "name": "Marshmallow",
    "primary": "oklch(0.80 0.14 349.25)",
    "bg": "oklch(0.22 0 0)"
  },
  {
    "id": "marshmallow-light",
    "name": "Marshmallow (Light)",
    "primary": "oklch(0.80 0.14 349.25)",
    "bg": "oklch(0.97 0.01 264.53)"
  },
  {
    "id": "midnight-pearl",
    "name": "Midnight Pearl",
    "primary": "oklch(72% 0.10 240)",
    "bg": "oklch(12% 0.01 260)"
  },
  {
    "id": "mocha-mousse",
    "name": "Mocha Mousse",
    "primary": "oklch(0.7272 0.0539 52.3320)",
    "bg": "oklch(0.2721 0.0141 48.1783)"
  },
  {
    "id": "mocha-mousse-light",
    "name": "Mocha Mousse (Light)",
    "primary": "oklch(0.6083 0.0623 44.3588)",
    "bg": "oklch(0.9529 0.0146 102.4597)"
  },
  {
    "id": "neon-cyberpunk",
    "name": "Neon Cyberpunk",
    "primary": "oklch(70% 0.25 300)",
    "bg": "oklch(12% 0.02 280)"
  },
  {
    "id": "obsidian-gold",
    "name": "Obsidian Gold",
    "primary": "oklch(75% 0.12 85)",
    "bg": "oklch(10% 0.01 260)"
  },
  {
    "id": "pastel-dreams",
    "name": "Pastel Dreams",
    "primary": "oklch(0.79 0.12 295.75)",
    "bg": "oklch(0.22 0.01 56.04)"
  },
  {
    "id": "pastel-dreams-light",
    "name": "Pastel Dreams (Light)",
    "primary": "oklch(0.71 0.16 293.54)",
    "bg": "oklch(0.97 0.01 314.78)"
  },
  {
    "id": "quiet-atelier",
    "name": "Quiet Atelier",
    "primary": "oklch(0.55 0.14 35)",
    "bg": "oklch(0.96 0.01 90)"
  },
  {
    "id": "rose-latte",
    "name": "Rose Latte",
    "primary": "oklch(68% 0.18 12)",
    "bg": "oklch(97% 0.015 15)"
  },
  {
    "id": "royal-velvet",
    "name": "Royal Velvet",
    "primary": "oklch(65% 0.22 315)",
    "bg": "oklch(12% 0.03 300)"
  }
] as const;

export type ThemeId = typeof THEMES[number]['id'];
