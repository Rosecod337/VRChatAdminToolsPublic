"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { MemoryRound, ReactionRound } = require("../apps/client-beta/renderer/arcade");
const { AutoRefreshController } = require("../apps/client-beta/renderer/auto-refresh");
const { steps } = require("../apps/client-beta/renderer/onboarding");

test("memory game always has eight pairs, rejects repeated clicks and completes in eight perfect moves", () => {
  const game = new MemoryRound(() => 0.5); assert.equal(game.deck.length,16);
  const pairs = new Map(); game.deck.forEach((value,index) => { pairs.set(value,[...(pairs.get(value)||[]),index]); });
  assert.equal(pairs.size,8);
  for (const indexes of pairs.values()) { assert.equal(indexes.length,2); assert.equal(game.choose(indexes[0]),"first"); assert.equal(game.choose(indexes[0]),"ignored"); game.choose(indexes[1]); }
  assert.equal(game.matched.size,16); assert.equal(game.moves,8); assert.equal(game.choose(0),"ignored");
});
test("mismatched memory cards wait for reveal and a reaction false start is not recorded", () => {
  const memory = new MemoryRound(()=>0.8); const different=memory.deck.findIndex(value=>value!==memory.deck[0]);
  memory.choose(0); assert.equal(memory.choose(different),"miss"); assert.equal(memory.choose(2),"ignored"); memory.hide(); assert.equal(memory.open.length,0);
  const reaction = new ReactionRound(); reaction.wait(); assert.equal(reaction.press(5),null); assert.equal(reaction.scores.length,0);
  for(let index=0;index<5;index+=1) { reaction.wait(); reaction.ready(100); assert.equal(reaction.press(350),250); assert.equal(reaction.press(360),null); }
  assert.equal(reaction.phase,"complete"); assert.equal(reaction.scores.length,5);
});
test("automatic refresh never overlaps, backs off failures and stops while hidden", async () => {
  let now=0, paused=false, calls=0, failure=true, finish;
  const timers = new Map(); let serial=0;
  const controller = new AutoRefreshController({ getJob:()=>({key:"friends",interval:15000,run:async()=>{calls+=1;if(failure)throw Error("network");await new Promise(resolve=>{finish=resolve;});}}), paused:()=>paused,now:()=>now,setTimer:(callback,delay)=>{timers.set(++serial,{callback,delay});return serial;},clearTimer:id=>timers.delete(id) });
  controller.wake(); assert.equal(timers.size,1); await controller.tick(); assert.equal(controller.state().failures,1); assert.equal(controller.dueAt,30000);
  failure=false; const running=controller.tick(); await Promise.resolve(); await controller.tick(); assert.equal(calls,2); finish(); await running; assert.equal(controller.state().failures,0);
  paused=true; controller.wake(); assert.equal(timers.size,0); await controller.tick(); assert.equal(calls,2);
  paused=false; controller.wake(); assert.equal(timers.size,1); controller.stop(); assert.equal(timers.size,0);
});
test("tutorial covers navigation, provenance, search, settings and gated paid tools", () => {
  assert.ok(steps.length>=8); assert.ok(steps.every(step=>step.target&&step.title&&step.description));
  assert.ok(steps.filter(step=>!step.paid).every(step=>!['games','personal-tools'].includes(step.view)));
  assert.ok(steps.some(step=>step.description.includes("не полный каталог")));
});
