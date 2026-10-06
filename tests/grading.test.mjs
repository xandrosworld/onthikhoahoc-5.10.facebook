import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeAttempt } from '../src/lib/grading.js';
import { templateTypes, validateExamConfig } from '../src/lib/exam-config.js';

const mc = (id, points) => ({ id, points, options: [{label:'A',isCorrect:true},{label:'B',isCorrect:false}] });
const tf = id => ({ id, statements: ['a','b','c','d'].map(label=>({label,isTrue:true})) });
const sa = id => ({ id, shortAnswers: [{answer:'0.5'}] });
test('three templates enable exactly the requested question types',()=>{
 assert.deepEqual(templateTypes('MC'),['MULTIPLE_CHOICE']);
 assert.deepEqual(templateTypes('MC_TF'),['MULTIPLE_CHOICE','TRUE_FALSE']);
 assert.deepEqual(templateTypes('FULL'),['MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER']);
});
test('custom per-question scores and section defaults produce actual and normalized totals',()=>{
 const sections=[{type:'MULTIPLE_CHOICE',pointsPerQuestion:2,questions:[mc('a'),mc('b',3)]}];
 const result=gradeAttempt(sections,{'a|':'A','b|':'B'});
 assert.equal(result.rawScore,2); assert.equal(result.maxScore,5); assert.equal(result.score,4);
 assert.equal(result.perQuestion.b.maxPoints,3);
 assert.equal(gradeAttempt(sections,{'a|':'A','b|':'A'}).score,10);
 assert.equal(gradeAttempt(sections,{}).unanswered,2);
});
test('true false tiers scale by the configured question points',()=>{
 for(let correct=0;correct<=4;correct++) {
  const answers=Object.fromEntries(['a','b','c','d'].slice(0,correct).map(label=>[`tf|${label}`,'T']));
  const sections=[{type:'TRUE_FALSE',pointsPerQuestion:2,tfScoring:'TIERED',questions:[tf('tf')]}];
  assert.equal(gradeAttempt(sections,answers).rawScore,[0,0.2,0.5,1,2][correct]);
  sections[0].tfScoring='EQUAL';
  assert.equal(gradeAttempt(sections,answers).rawScore,correct*0.5);
 }
});
test('all three sections combine decimal points without changing short answer matching',()=>{
 const sections=[{type:'MULTIPLE_CHOICE',pointsPerQuestion:0.25,questions:[mc('m')]},{type:'TRUE_FALSE',pointsPerQuestion:1,tfScoring:'EQUAL',questions:[tf('t')]},{type:'SHORT_ANSWER',pointsPerQuestion:0.5,questions:[sa('s')]}];
 const r=gradeAttempt(sections,{'m|':'A','t|a':'T','t|b':'T','s|':'0,50'});
 assert.equal(r.rawScore,1.25);assert.equal(r.maxScore,1.75);assert.equal(r.score,7.14);
 assert.equal(r.breakdown[1].points,0.5);
});
test('legacy null scores preserve the original 3/4/3 grading',()=>{
 const sections=[{type:'MULTIPLE_CHOICE',questions:[mc('m')]},{type:'TRUE_FALSE',questions:[tf('t')]},{type:'SHORT_ANSWER',questions:[sa('s')]}];
 const r=gradeAttempt(sections,{'m|':'A','t|a':'T','t|b':'T','s|':'0.5'});
 assert.equal(r.maxScore,10);assert.equal(r.score,7);
 assert.equal(gradeAttempt([sections[0]],{'m|':'A'}).score,10);
});
test('point validation rejects empty, zero, negative, nonfinite and unknown configurations',()=>{
 const payload={template:'MC',sectionSettings:{MULTIPLE_CHOICE:{pointsPerQuestion:1,tfScoring:'TIERED'}},sections:{MULTIPLE_CHOICE:[mc('m')]}};
 assert.equal(validateExamConfig(payload),null);
 for(const value of ['',0,-1,Infinity,NaN,101,'abc']) {
  assert.ok(validateExamConfig({...payload,sectionSettings:{MULTIPLE_CHOICE:{pointsPerQuestion:value,tfScoring:'TIERED'}}}));
  assert.ok(validateExamConfig({...payload,sections:{MULTIPLE_CHOICE:[mc('m',value)]}}));
 }
 assert.ok(validateExamConfig({...payload,template:'OTHER'}));
});
