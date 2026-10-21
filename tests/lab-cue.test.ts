import test from 'node:test';
import assert from 'node:assert/strict';
import {VillainCue} from '../src/lab/experiments/villain-cue';
class Param{value=0;setValueAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
class Node{frequency=new Param();gain=new Param();type='';started=false;stopped=false;disconnected=false;connect(){}start(){this.started=true;}stop(){this.stopped=true;}disconnect(){this.disconnected=true;}}
class Context{state='running';currentTime=0;destination={};nodes:Node[]=[];gate?:Promise<void>;closed=false;async resume(){await this.gate;}async close(){this.closed=true;}createOscillator(){const n=new Node();this.nodes.push(n);return n;}createGain(){return new Node();}}
test('villain cue stays bounded and cancel/dispose prevent late audio after activation',async()=>{
 const context=new Context();const cue=new VillainCue(()=>context as unknown as AudioContext);await cue.play();assert.equal(context.nodes.length,8);assert.ok(context.nodes.every(n=>n.started&&n.stopped));cue.stop();assert.ok(context.nodes.every(n=>n.disconnected));let release!:()=>void;context.gate=new Promise<void>(r=>release=r);const pending=cue.play();cue.stop();release();await pending;assert.equal(context.nodes.length,8);cue.dispose();assert.equal(context.closed,true);
});
