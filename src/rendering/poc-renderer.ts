import * as THREE from 'three';
import type { SessionSnapshot } from '../game/session';
import { RING } from '../physics';
import { applyRingAppearance } from '../themes/ring-appearance';
import type { ThemeId } from '../themes';

/** Owns stable-ID ring meshes and geometry/material cleanup; callers supply snapshots, never Rapier bodies. */
export class PocRingRenderer {
  private readonly geometry = new THREE.TorusGeometry(RING.radius, RING.tube, 12, 36);
  private readonly meshes = new Map<number, THREE.Mesh<THREE.TorusGeometry, THREE.MeshPhysicalMaterial>>();
  private readonly palette = [0xf09c7a, 0xe5c16a, 0x759fb9, 0x9c8ca7, 0x72b9a2, 0xe2b4bb];
  private currentTheme: ThemeId = 'ocean';
  setTheme(id:ThemeId):void { this.currentTheme=id; }
  constructor(private readonly scene: THREE.Scene) {}
  update(snapshot: SessionSnapshot, enemyIds:ReadonlySet<number>=new Set()): void {
    const current = new Set(snapshot.rings.map(r => r.id));
    for (const [id, mesh] of this.meshes) if (!current.has(id)) {
      this.scene.remove(mesh); mesh.material.dispose(); this.meshes.delete(id);
    }
    for (const ring of snapshot.rings) {
      let mesh = this.meshes.get(ring.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.geometry, new THREE.MeshPhysicalMaterial({ color: this.palette[ring.id % this.palette.length], roughness: .29, metalness: .04 }));
        this.scene.add(mesh); this.meshes.set(ring.id, mesh);
      }
      mesh.position.set(ring.position.x, ring.position.y, ring.position.z);
      mesh.quaternion.set(ring.rotation.x, ring.rotation.y, ring.rotation.z, ring.rotation.w);
      applyRingAppearance(mesh.material,this.currentTheme,ring.id,ring.threaded);
      if(enemyIds.has(ring.id)){mesh.material.color.setHex(0xff3038);mesh.material.emissive.setHex(0x4e0508);mesh.material.emissiveIntensity=.22;}
    }
  }
  dispose(): void {
    for (const mesh of this.meshes.values()) { this.scene.remove(mesh); mesh.material.dispose(); }
    this.meshes.clear(); this.geometry.dispose();
  }
}
