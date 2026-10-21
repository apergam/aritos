import test from 'node:test';
import assert from 'node:assert/strict';
import {GameSession} from '../src/game/session';
import {VillainEncounterController} from '../src/lab/experiments/enemies';
import {Simulation,initPhysics,DT} from '../src/physics';

test('variable pressure changes real local impulse and snapshots independent simultaneous pulse strengths',async()=>{
 await initPhysics();
 const run=(intensity:number)=>{const s=new Simulation();s.setGravity({x:0,y:0,z:0});const ring=s.addRing(-3.8,-4.8,0);s.pump('left',intensity);for(let i=0;i<24;i++)s.step();const y=ring.body.translation().y;s.dispose();return y;};
 assert.ok(run(1.5)>run(.5)+.1);
 const s=new Simulation();try{s.pump('left',.5);s.pump('right',1.5);s.strength=25;assert.deepEqual(s.pulses.map(p=>p.strength),[37.5,112.5]);assert.deepEqual(s.pulses.map(p=>p.intensity),[.5,1.5]);s.pump('left',Infinity);assert.equal(s.pulses.length,2);}finally{s.dispose();}
});

test('session bounds intensity, rejects invalid inputs and keeps normal pump at accepted 75',async()=>{
 await initPhysics();const session=new GameSession();const events:unknown[]=[];session.subscribe(e=>events.push(e));
 try{session.dispatch({type:'pump',side:'left',intensity:NaN});assert.equal(events.length,0);session.dispatch({type:'pump',side:'left',intensity:90});assert.equal(session.simulation.pulses[0]!.strength,112.5);session.dispatch({type:'pump',side:'right'});assert.equal(session.simulation.pulses[1]!.strength,75);}finally{session.dispose();}
});

test('per-pulse intensity has the same fixed-tick outcome across render frame schedules',async()=>{
 await initPhysics();
 const run=(frames:number[])=>{const s=new Simulation();s.setGravity({x:0,y:0,z:0});const ring=s.addRing(-3.8,-4.8,0);s.pump('left',1.5);let accumulator=0;for(const frame of frames){accumulator+=frame;while(accumulator+1e-10>=DT){s.step();accumulator-=DT;}}const p={...ring.body.translation()};s.dispose();return p;};
 assert.deepEqual(run(Array(60).fill(1/60)),run(Array(20).fill(1/20)));
});

test('twenty-ring stack reset uses count spacing and real collect victory; restart restores twenty',async()=>{
 await initPhysics();const session=new GameSession({lab:{ringCount:20},scene:'stack',mode:'collect'});let wins=0;session.subscribe(e=>{if(e.type==='victory')wins++;});
 try{assert.equal(session.simulation.count,20);for(let i=0;i<7200&&!session.snapshot().won;i++)session.step();assert.equal(session.snapshot().collected,20);assert.equal(session.snapshot().total,20);assert.equal(wins,1);session.startRound();assert.equal(session.snapshot().active,20);assert.equal(session.snapshot().total,20);assert.equal(session.simulation.count,20);}finally{session.dispose();}
});


test('fourteen physical rings remain contained under strong pulses and inversion',async()=>{
 await initPhysics();for(const model of ['single-button','two-button']as const){const session=new GameSession({model,mode:'classic'});const enemy=new VillainEncounterController(session);try{enemy.request(2);assert.equal(enemy.beforeStep()?.spawned.length,2);for(let i=0;i<2400;i++){if(i%90===0){session.dispatch({type:'orient',gravity:{x:Math.sin(i*.01)*2,y:Math.cos(i*.012)*3,z:Math.sin(i*.02)}});session.dispatch({type:'pump',side:model==='single-button'?'center':i%180===0?'left':'right',intensity:1.5});}session.step();}assert.equal(session.simulation.escaped,false);assert.equal(session.snapshot().active,14);assert.equal(session.snapshot().total,14);}finally{enemy.dispose();session.dispose();}}
});
