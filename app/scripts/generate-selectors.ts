import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export function generateSelectorsPlugin(): Plugin {
    const cssPath = path.resolve(__dirname, '../premade/gaia.css');
    const outputPath = path.resolve(__dirname, '../data/gaia-selectors.json');

    function extractAndSaveSelectors() {
        try {
            if (!fs.existsSync(cssPath)) {
                console.warn(`[Selector Generator] gaia.css not found at ${cssPath}`);
                return;
            }

            let rawCss = fs.readFileSync(cssPath, 'utf-8');

            rawCss = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

            const rulesRegex = /([^{}]+)(?=\s*\{)/g;
            const matches = rawCss.match(rulesRegex) || [];
            const uniqueSet = new Set<string>();

            matches.forEach((block) => {
                const cleanSelector = block
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s*,\s*/g, ', ')
                    .replace(/\s+/g, ' ');

                if (
                    cleanSelector &&
                    !cleanSelector.startsWith("@") &&
                    !cleanSelector.match(/^\d+%/)
                ) {
                    uniqueSet.add(cleanSelector);
                }
            });

            const selectorsArray = Array.from(uniqueSet);

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(selectorsArray, null, 2), 'utf-8');

            console.log(`[Selector Generator] Successfully generated ${selectorsArray.length} selectors.`);
        } catch (error) {
            console.error('[Selector Generator] Error processing selectors:', error);
        }
    }

    return {
        name: 'generate-selectors-plugin',
        buildStart() {
            extractAndSaveSelectors();
        },
        handleHotUpdate({ file }) {
            if (file.endsWith('gaia.css')) {
                console.log('[Selector Generator] gaia.css changed, regenerating list...');
                extractAndSaveSelectors();
            }
        }
    };
}