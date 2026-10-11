import test from 'node:test';
import assert from 'node:assert/strict';
import {fmtDate,fmtDateTime} from '../src/lib/utils.js';
import {templateTypes,validateExamConfig} from '../src/lib/exam-config.js';
test('four-part template includes essay while existing templates retain their parts',()=>{
  assert.deepEqual(templateTypes('FULL_ESSAY'),['MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER','ESSAY']);
  assert.equal(templateTypes('FULL').length,3);
  assert.match(validateExamConfig({template:'FULL_ESSAY',sectionSettings:{},sections:{}}),/Điểm/);
});
test('WordPress UTC and serialized demo dates render without breaking content cards',()=>{
  assert.equal(fmtDate('$D2026-10-11T00:00:00.000Z'),fmtDate('2026-10-11T00:00:00.000Z'));
  assert.equal(fmtDateTime('2026-10-11 07:30:00'),fmtDateTime('2026-10-11T07:30:00Z'));
  assert.equal(fmtDate('invalid'),'—');
  assert.equal(fmtDate(null),'—');
});
