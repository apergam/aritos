import { Quaternion, Vector3 } from 'three';
import type { Vec } from './simulation';

// Closed rings start as a real linked pair, with positive capsule clearance.
// This is spawn geometry: their later motion and collection remain fully dynamic.
export const LINKED_RING_SEPARATION = .35;
export function linkedPairPoses(center: Readonly<Vec>) {
 const turn = new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI/4)
  .multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),Math.PI/2));
 return [
  {position:{x:center.x,y:center.y-LINKED_RING_SEPARATION/2,z:center.z},rotation:turn},
  {position:{x:center.x,y:center.y+LINKED_RING_SEPARATION/2,z:center.z},rotation:turn.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI/2))},
 ] as const;
}
