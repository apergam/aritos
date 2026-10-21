import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game/session.ts';
import { initPhysics, Simulation, DT, RING } from '../src/physics.ts';
import { PLAYER_TOY_LAYOUT, PLAYER_TOY_SETTINGS } from '../src/models/selected-toy.ts';

await initPhysics();
const run=(simulation:Simulation,seconds:number)=>{for(let i=0;i<seconds/DT;i++)simulation.step();};

test('selected toy settings are immutable and select the approved width-eight raised layout',()=>{
  assert.deepEqual(PLAYER_TOY_SETTINGS,{width:8,ringCount:12,pegLayout:'raised'});
  assert.equal(Object.isFrozen(PLAYER_TOY_SETTINGS),true);
  assert.equal(PLAYER_TOY_LAYOUT.width,8);
  assert.equal(PLAYER_TOY_LAYOUT.ringCount,12);
  assert.equal(PLAYER_TOY_LAYOUT.pegLayout,'raised');
  assert.deepEqual(PLAYER_TOY_LAYOUT.pegs.map(p=>[p.x,p.baseY]),[[-1.7,-3.8],[1.7,-2.2]]);
  assert.ok(Math.abs(PLAYER_TOY_LAYOUT.pegs[0].tipY-.55)<1e-9);
  assert.ok(Math.abs(PLAYER_TOY_LAYOUT.pegs[1].tipY-2.15)<1e-9);
  assert.equal(PLAYER_TOY_LAYOUT.supports.length,2);
  assert.throws(()=>new Simulation({width:7,pegLayout:'raised'}),RangeError);
  assert.throws(()=>new Simulation({width:8,ringCount:20,pegLayout:'raised'}),RangeError);
  assert.throws(()=>new Simulation({width:9,ringCount:20,pegLayout:'raised'}),RangeError);
});

test('raised free starts fit walls and clear real shafts, bases, supports, and one another',()=>{
  const simulation=new Simulation(PLAYER_TOY_SETTINGS);
  try {
    simulation.reset('free');
    assert.equal(simulation.rings.length,12);
    const extent=RING.radius+RING.tube;
    for(const ring of simulation.rings){
      const p=ring.body.translation();
      assert.ok(Math.abs(p.x)+extent<=simulation.layout.tank.x);
      assert.ok(Math.abs(p.y)+extent<=simulation.layout.tank.y);
      assert.ok(Math.abs(p.z)+extent<=simulation.layout.tank.z);
      for(const peg of simulation.layout.pegs){
        assert.ok(Math.hypot(p.x-peg.x,p.z-peg.z)>=extent+0.11,'ring spawn clears the peg shaft');
        const dx=Math.max(Math.abs(p.x-peg.x)-.76,0);
        const dz=Math.max(Math.abs(p.z-peg.z)-.76,0);
        const dy=Math.max(Math.abs(p.y-(peg.baseY-.15/2))-.15/2,0);
        assert.ok(Math.hypot(dx,dy,dz)>extent,'ring spawn clears the raised pedestal');
      }
      for(const support of simulation.layout.supports){
        const dx=Math.max(Math.abs(p.x-support.center.x)-support.halfExtents.x,0);
        const dy=Math.max(Math.abs(p.y-support.center.y)-support.halfExtents.y,0);
        const dz=Math.max(Math.abs(p.z-support.center.z)-support.halfExtents.z,0);
        assert.ok(Math.hypot(dx,dy,dz)>extent,'ring spawn clears the physical attachment support');
      }
    }
    for(let i=0;i<simulation.rings.length;i++)for(let j=i+1;j<simulation.rings.length;j++){
      const a=simulation.rings[i].body.translation(),b=simulation.rings[j].body.translation();
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>=2*extent,'initial rings do not overlap');
    }
  } finally { simulation.dispose(); }
});

test('both raised bases collect rings after real threading and physical base contact',()=>{
  const simulation=new Simulation(PLAYER_TOY_SETTINGS);
  simulation.mode='collect';
  try {
    for(const peg of simulation.layout.pegs)simulation.addRing(peg.x,peg.baseY+1.5,peg.z);
    simulation.setGravity({x:0,y:-3,z:0});
    assert.equal(simulation.count,2);
    run(simulation,10);
    assert.equal(simulation.collected,2);
    assert.equal(simulation.totalRings,2);
    assert.equal(simulation.rings.length,0);
    assert.equal(simulation.won,true);
    assert.equal(simulation.escaped,false);
  } finally { simulation.dispose(); }
});

test('twelve and fourteen rings have real classic capacity and extract under inversion',()=>{
  for(const count of [12,14]){
    const simulation=new Simulation(PLAYER_TOY_SETTINGS);
    try {
      for(let i=0;i<count;i++){
        const peg=simulation.layout.pegs[i%simulation.layout.pegs.length];
        const level=Math.floor(i/simulation.layout.pegs.length);
        simulation.addRing(peg.x,peg.baseY+.6+level*.55,peg.z);
      }
      run(simulation,10);
      assert.equal(simulation.count,count,`${count} ring stack fits the raised peg shafts`);
      assert.equal(simulation.rings.length,count);
      assert.equal(simulation.won,true,`${count} ring stack completes classic victory`);
      simulation.setGravity({x:0,y:3,z:0});
      run(simulation,9);
      assert.equal(simulation.count,0,`${count} ring stack extracts when inverted`);
      assert.equal(simulation.rings.length,count,'classic mode retains all rings');
      assert.equal(simulation.escaped,false);
    } finally { simulation.dispose(); }
  }
});

test('selected layout stays contained in both models and rule modes and carries through restart',()=>{
  for(const model of ['single-button','two-button'] as const)for(const mode of ['classic','collect'] as const){
    const session=new GameSession({model,mode,lab:PLAYER_TOY_SETTINGS});
    try {
      session.startRound({scene:'free'});
      session.dispatch({type:'pump',side:model==='single-button'?'center':'left'});
      for(let i=0;i<3/DT;i++){
        if(i===120)session.dispatch({type:'orient',gravity:{x:0,y:3,z:0}});
        session.step();
      }
      assert.equal(session.simulation.escaped,false);
      session.startRound();
      assert.deepEqual(session.simulation.layout,PLAYER_TOY_LAYOUT);
      assert.equal(session.snapshot().total,12);
    } finally { session.dispose(); }
  }
});
