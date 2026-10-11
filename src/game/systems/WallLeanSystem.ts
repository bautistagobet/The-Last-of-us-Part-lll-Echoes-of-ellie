import * as THREE from 'three';

export interface LeanResult {
  isLeaning: boolean;
  side: 'left' | 'right' | 'front' | 'none';
  distance: number;
  contactPoint?: THREE.Vector3;
  surfaceNormal?: THREE.Vector3;
  surfaceType?: 'wall' | 'car' | 'barrier' | 'tree' | 'table';
  surfaceHeight?: number;
}

export class WallLeanSystem {
  private raycaster: THREE.Raycaster;
  private playerPos: THREE.Vector3 = new THREE.Vector3();
  private forwardVec: THREE.Vector3 = new THREE.Vector3();
  private leftVec: THREE.Vector3 = new THREE.Vector3();
  private rightVec: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 1.35; // Maximum distance to reach out and touch surface
  }

  /**
   * Evaluates if JJ should lean onto an adjacent surface based on proximity and condition
   */
  public checkLean(
    playerWorldPos: THREE.Vector3,
    playerRotationY: number,
    surfaces: {
      box: THREE.Box3;
      normal: THREE.Vector3;
      height: number;
      type: 'wall' | 'car' | 'barrier' | 'tree' | 'table';
    }[],
    isInjured: boolean,
    stamina: number,
    isCrouching: boolean
  ): LeanResult {
    // Condition check: JJ leans when injured, exhausted (stamina < 50), or when deliberately taking cover
    const shouldLeanCondition = isInjured || stamina < 50 || isCrouching;

    if (!shouldLeanCondition) {
      return { isLeaning: false, side: 'none', distance: 999 };
    }

    this.playerPos.copy(playerWorldPos);
    this.playerPos.y += 1.0; // Chest / shoulder raycast height

    // Orientation vectors
    this.forwardVec.set(Math.sin(playerRotationY), 0, Math.cos(playerRotationY)).normalize();
    this.leftVec.set(Math.sin(playerRotationY + Math.PI / 2), 0, Math.cos(playerRotationY + Math.PI / 2)).normalize();
    this.rightVec.set(Math.sin(playerRotationY - Math.PI / 2), 0, Math.cos(playerRotationY - Math.PI / 2)).normalize();

    // Test Left, Right, and Front directions
    const checkDirections: { side: 'left' | 'right' | 'front'; dir: THREE.Vector3 }[] = [
      { side: 'left', dir: this.leftVec },
      { side: 'right', dir: this.rightVec },
      { side: 'front', dir: this.forwardVec },
    ];

    let closestHit: {
      side: 'left' | 'right' | 'front';
      dist: number;
      point: THREE.Vector3;
      normal: THREE.Vector3;
      surfaceType: 'wall' | 'car' | 'barrier' | 'tree' | 'table';
      height: number;
    } | null = null;

    for (const d of checkDirections) {
      const ray = new THREE.Ray(this.playerPos, d.dir);

      for (const surface of surfaces) {
        const intersection = ray.intersectBox(surface.box, new THREE.Vector3());
        if (intersection) {
          const dist = this.playerPos.distanceTo(intersection);
          if (dist <= 1.25 && (!closestHit || dist < closestHit.dist)) {
            closestHit = {
              side: d.side,
              dist,
              point: intersection,
              normal: surface.normal,
              surfaceType: surface.type,
              height: surface.height,
            };
          }
        }
      }
    }

    if (closestHit) {
      return {
        isLeaning: true,
        side: closestHit.side,
        distance: closestHit.dist,
        contactPoint: closestHit.point,
        surfaceNormal: closestHit.normal,
        surfaceType: closestHit.surfaceType,
        surfaceHeight: closestHit.height,
      };
    }

    return { isLeaning: false, side: 'none', distance: 999 };
  }
}
