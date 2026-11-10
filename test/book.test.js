import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadBook,saveBook,recordServe} from '../src/book.js';
const mem=()=>{const m={};return {getItem:k=>(k in m?m[k]:null),setItem:(k,v)=>{m[k]=String(v);}};};
test('first serve unlocks the coaster, three stars add a photo',()=>{
  const b=loadBook(mem());
  let r=recordServe(b,'민지','negroni',2,1);assert.equal(r.coaster,true);assert.equal(r.photo,false);
  r=recordServe(b,'민지','negroni',3,2);assert.equal(r.coaster,false);assert.equal(r.photo,true);assert.equal(r.best,true);
  assert.equal(b.coasters.negroni.n,2);assert.equal(b.coasters.negroni.best,3);assert.equal(b.photos.length,1);
});
test('same guest and drink refresh instead of piling up; cap holds',()=>{
  const b=loadBook(mem());
  recordServe(b,'a','x',3,1);const r=recordServe(b,'a','x',3,2);
  assert.equal(r.photo,false);assert.equal(b.photos.length,1);assert.equal(b.photos[0].ts,2);
  for(let i=0;i<40;i++)recordServe(b,'g'+i,'x',3,i);
  assert.ok(b.photos.length<=24);
});
test('zero stars records nothing; storage round-trips and survives junk',()=>{
  const st=mem(),b=loadBook(st);
  assert.deepEqual(recordServe(b,'a','x',0),{coaster:false,photo:false,best:false});
  recordServe(b,'a','x',3,5);saveBook(b,st);
  assert.equal(loadBook(st).photos.length,1);
  st.setItem('courte.book','{oops');assert.deepEqual(loadBook(st),{photos:[],coasters:{}});
});
