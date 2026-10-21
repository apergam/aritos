/** Original short villain phrase, synthesized locally; no recording or asset license dependency. */
export class VillainCue {
 private context?:AudioContext;
 private nodes:Array<OscillatorNode>=[];
 private gains:Array<GainNode>=[];
 private generation=0;
 private disposed=false;
 constructor(private readonly factory:()=>AudioContext = ()=>new AudioContext()){}
 async unlock():Promise<void>{if(this.disposed)return;try{this.context??=this.factory();await this.context.resume();}catch{/* Visual encounter remains usable without audio. */}}
 async play():Promise<void>{
  this.stop();const generation=this.generation;await this.unlock();
  const ctx=this.context;if(this.disposed||generation!==this.generation||!ctx||ctx.state!=='running')return;
  const notes=[196,185,155.56,130.81,146.83,155.56,123.47,98];
  notes.forEach((frequency,index)=>{
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+index*.17;
   oscillator.type='triangle';oscillator.frequency.value=frequency;
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.055,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+.23);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.nodes=this.nodes.filter(node=>node!==oscillator);this.gains=this.gains.filter(node=>node!==gain);};
   oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(at);oscillator.stop(at+.25);
   this.nodes.push(oscillator);this.gains.push(gain);
  });
 }
 stop():void{this.generation++;for(const node of this.nodes){try{node.stop();node.disconnect();}catch{}}for(const gain of this.gains)gain.disconnect();this.nodes=[];this.gains=[];}
 dispose():void{this.stop();this.disposed=true;try{void this.context?.close().catch(()=>{});}catch{}this.context=undefined;}
}
