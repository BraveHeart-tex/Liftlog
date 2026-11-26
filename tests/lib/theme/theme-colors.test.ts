import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

import { getThemeColors, type AppColorScheme } from '@/src/theme/tokens';

// Navigation, the tab bar and system UI read JavaScript colors; drift from
// global.css makes them differ from in-app NativeWind colors.

const cssPath = join(process.cwd(), 'global.css');
const root = postcss.parse(readFileSync(cssPath, 'utf8'));

function readCssColors(scheme: AppColorScheme) {
  const colors: Record<string, string> = {};

  root.walkRules(`.theme-${scheme}`, rule => {
    rule.walkDecls(/^--color-/, decl => {
      const key = decl.prop
        .replace(/^--color-/, '')
        .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      colors[key] = decl.value;
    });
  });

  return colors;
}

describe('theme colors', () => {
  it.each<AppColorScheme>(['light', 'dark'])(
    'equal every global.css color token in the %s theme',
    scheme => {
      const cssColors = readCssColors(scheme);

      expect(Object.keys(cssColors).length).toBeGreaterThan(0);
      expect(getThemeColors(scheme)).toEqual(cssColors);
    }
  );
});
