import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const pink = chalk.hex('#ff5770');

interface ThemeVars {
  '--background': string | null;
  '--primary': string | null;
  '--accent': string | null;
}

const themesDir = path.join(process.cwd(), 'app', 'themes');
const appCssPath = path.join(process.cwd(), 'app', 'app.css');

const componentOutput = path.join(process.cwd(), 'app', 'data', 'theme-swatches-data.ts');
const cssImportOutput = path.join(process.cwd(), 'app', 'themes', 'import-themes.ts');

function formatName(id: string): string {
  if (id === 'light') return 'Light Mode';
  if (id === 'dark') return 'Dark Mode';

  let base = id.replace(/-light$/, '');
  base = base
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (id.endsWith('-light')) {
    return `${base} (Light)`;
  }
  return base;
}

try {
  const paletteData: Record<string, ThemeVars> = {};

  const extractVars = (cssBody: string): ThemeVars => {
    const vars: ThemeVars = { '--background': null, '--primary': null, '--accent': null };
    (['--background', '--primary', '--accent'] as const).forEach((key) => {
      const vMatch = cssBody.match(new RegExp(`${key}:\\s*([^;]+);?`));
      vars[key] = vMatch ? vMatch[1].trim() : null;
    });
    return vars;
  };

  const appCss = fs.readFileSync(appCssPath, 'utf-8');

  const baseThemes = [
    { selector: ':root', name: 'light' },
    { selector: '\\[data-theme=["\']dark["\']\\]', name: 'dark' }
  ];

  for (const { selector, name } of baseThemes) {
    const regex = new RegExp(`${selector}\\s*{([^}]+)}`);
    const match = appCss.match(regex);
    if (match) {
      paletteData[name] = extractVars(match[1]);
    }
  }

  const files = fs.existsSync(themesDir)
    ? fs.readdirSync(themesDir).filter((f) => f.endsWith('.css') && f !== 'index.css')
    : [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(themesDir, file), 'utf-8');
    const regex = /\[data-theme=["']([^"']+)["']\]\s*{([^}]+)}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      paletteData[match[1]] = extractVars(match[2]);
    }
  }

  const sortedEntries = Object.entries(paletteData).sort(([a], [b]) => {
    if (a === 'light' || a === 'dark') return -1;
    if (b === 'light' || b === 'dark') return 1;
    return a.localeCompare(b);
  });

  const themeArrayEntries = sortedEntries.map(([id, vars]) => ({
    id,
    name: formatName(id),
    primary: vars['--primary'] || '',
    bg: vars['--background'] || ''
  }));

  const contentOutput = `                                                                           

export const THEMES = ${JSON.stringify(themeArrayEntries, null, 2)} as const;

export type ThemeId = typeof THEMES[number]['id'];
`;

  const componentDir = path.dirname(componentOutput);
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }
  fs.writeFileSync(componentOutput, contentOutput, 'utf-8');

  const sortedCssFiles = [...files].sort((a, b) => a.localeCompare(b));
  const cssImportsContent = `                                                                           

${sortedCssFiles.map((file) => `import "./${file}";`).join('\n')}
`;

  const cssImportDir = path.dirname(cssImportOutput);
  if (!fs.existsSync(cssImportDir)) {
    fs.mkdirSync(cssImportDir, { recursive: true });
  }
  fs.writeFileSync(cssImportOutput, cssImportsContent, 'utf-8');

  console.log(pink.bold('THEMES: SUCCESS. GENERATED DATA CONFIGURATIONS:'));
  console.log(pink.italic(`❤️  Data Swatches: ${path.relative(process.cwd(), componentOutput)}`));
  console.log(pink.italic(`✨ CSS Imports Rollup: ${path.relative(process.cwd(), cssImportOutput)}`));

} catch (error) {
  console.error(chalk.red('Error generating themes metadata:'), error);
  process.exit(1);
}