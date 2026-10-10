import test from 'node:test';
import assert from 'node:assert/strict';
import { insertMath, mathRangeAt } from '../src/lib/math-editor.js';
import { renderRichInline } from '../src/lib/markdown.js';

test('toolbar inserts into empty inline and display formulas without nested delimiters', () => {
  for (const wrap of ['inline', 'block']) {
    const empty = insertMath('', 0, 0, '‸', wrap);
    const result = insertMath(empty.value, empty.cursor, empty.cursor, '\\sqrt{‸}');
    assert.equal(result.value, wrap === 'block' ? '$$\\sqrt{}$$' : '$\\sqrt{}$');
    const filled = result.value.slice(0, result.cursor) + 'x' + result.value.slice(result.cursor);
    assert.match(renderRichInline(filled), /class="katex"/);
    assert.doesNotMatch(renderRichInline(filled), /katex-error/);
  }
});

test('selected text becomes the fraction numerator and surrounding prose survives', () => {
  const result = insertMath('Cho x+1 nhé', 4, 7, '\\dfrac{‸}{}');
  assert.equal(result.value, 'Cho $\\dfrac{x+1}{}$ nhé');
});

test('display formula retains its delimiters when adding another symbol', () => {
  const value = '$$x + $$';
  assert.equal(insertMath(value, 6, 6, '\\pi ').value, '$$x + \\pi $$');
  assert.equal(insertMath(value, 6, 6, '‸', 'inline').value, value);
  assert.equal(mathRangeAt(value, 6).end, value.length);
});

test('escaped dollars and positions outside math do not count as a formula', () => {
  assert.equal(mathRangeAt('Giá \\$5 và x', 10), null);
  assert.equal(mathRangeAt('$x$ sau', 4), null);
  assert.equal(insertMath('$x$ sau', 4, 7, '\\sqrt{‸}').value, '$x$ $\\sqrt{sau}$');
});
