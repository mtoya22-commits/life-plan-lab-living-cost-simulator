import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INPUT, RESULT } from '../../src/strings/ja';

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8');

describe('文言の ja.ts 集約', () => {
  it('collapsible の summary 見出しが ja.ts に存在する', () => {
    expect(INPUT.mortgageHeading).toBe('住宅ローン・教育費の扱い');
    expect(RESULT.fixedVariableNoteHeading).toBe('固定費・変動費について');
  });

  it('InputScreen / ResultScreen の summary がハードコードされていない', () => {
    const input = read('../../src/features/input/InputScreen.tsx');
    const result = read('../../src/features/results/ResultScreen.tsx');
    expect(input).toContain('{INPUT.mortgageHeading}');
    expect(input).not.toContain('<summary>住宅ローン・教育費の扱い</summary>');
    expect(result).toContain('{RESULT.fixedVariableNoteHeading}');
    expect(result).not.toContain('<summary>固定費・変動費について</summary>');
  });
});
