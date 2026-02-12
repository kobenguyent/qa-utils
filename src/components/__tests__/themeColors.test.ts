import fs from 'fs';
import path from 'path';

describe('Theme colors - no hard-coded light-only colors', () => {
  it('does not contain legacy light-only hex colors in KobeanAssistant', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../utils/KobeanAssistant.tsx'), 'utf8');
    expect(file).not.toMatch(/#212529|#495057|#dee2e6|#f8f9fa|rgba\(255,255,255,0.8\)/);
  });

  it('uses CSS variables in jsonStyles', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../../styles/jsonStyles.ts'), 'utf8');
    expect(file).toMatch(/var\(--/);
    // Ensure no remaining hard-coded colors in jsonStyles
    expect(file).not.toMatch(/#1e293b|#ffffff|#ced4da|#198754|#d63384/);
  });
});
