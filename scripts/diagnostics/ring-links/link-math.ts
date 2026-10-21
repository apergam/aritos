import {RING, type Ring} from '../../../src/physics.ts';
import {Quaternion,Vector3} from 'three';
const points=Array.from({length:RING.segments},(_,i)=>new Vector3(Math.cos(i*Math.PI*2/RING.segments)*RING.radius,Math.sin(i*Math.PI*2/RING.segments)*RING.radius,0));
export function ringData(r:Ring){const c=new Vector3().copy(r.body.translation()),q=new Quaternion().copy(r.body.rotation());return {r,c,n:new Vector3(0,0,1).applyQuaternion(q),vertices:points.map(p=>p.clone().applyQuaternion(q).add(c))};}
export function linking(a:ReturnType<typeof ringData>,b:ReturnType<typeof ringData>){
 if(a.c.distanceToSquared(b.c)>4*RING.radius**2)return 0;
 let sum=0;
 for(let k=0;k<b.vertices.length;k++){
  const p=b.vertices[k],q=b.vertices[(k+1)%b.vertices.length];
  const dp=p.clone().sub(a.c).dot(a.n),dq=q.clone().sub(a.c).dot(a.n);
  if((dp<0&&dq>=0)||(dq<0&&dp>=0)){
   const t=dp/(dp-dq),intersection=p.clone().lerp(q,t);
   const inside=a.vertices.every((v,j)=>a.vertices[(j+1)%a.vertices.length].clone().sub(v).cross(intersection.clone().sub(v)).dot(a.n)>=-1e-9);
   if(inside)sum+=dq>dp?1:-1;
  }
 }
 return sum;
}
