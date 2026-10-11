import * as THREE from 'three';
import { EnemyModel } from '../models/EnemyModel';
import { soundEngine } from '../audio/SoundSystem';

export class GrappleSystem {
  public isGrappling: boolean = false;
  public grappleEnemy: EnemyModel | null = null;
  public progress: number = 0; // 0 to 100
  public targetProgress: number = 100;
  public struggleTimer: number = 0;
  public maxStruggleTime: number = 5.0; // 5 seconds before fatal/severe damage
  public mashPromptKey: 'F' | 'AD' = 'F';
  public lastADKey: 'A' | 'D' = 'A';

  public startGrapple(enemy: EnemyModel, playerPos: THREE.Vector3) {
    if (this.isGrappling || enemy.health <= 0) return;

    this.isGrappling = true;
    this.grappleEnemy = enemy;
    this.progress = 25; // initial start
    this.struggleTimer = 0;
    this.mashPromptKey = Math.random() > 0.5 ? 'F' : 'AD';

    // Snap enemy right in front of player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.group.position).normalize();
    enemy.group.position.copy(playerPos).sub(toPlayer.multiplyScalar(0.95));
    enemy.group.lookAt(playerPos.x, enemy.group.position.y, playerPos.z);
    enemy.state = 'attack';

    soundEngine.playStruggleEffort();
  }

  public registerInput(key: string): boolean {
    if (!this.isGrappling) return false;

    if (this.mashPromptKey === 'F' && (key.toLowerCase() === 'f' || key === 'KeyF')) {
      this.progress += 12;
      soundEngine.playStruggleEffort();
      return true;
    } else if (this.mashPromptKey === 'AD') {
      const lower = key.toLowerCase();
      if ((lower === 'a' && this.lastADKey === 'D') || (lower === 'd' && this.lastADKey === 'A')) {
        this.progress += 14;
        this.lastADKey = lower === 'a' ? 'A' : 'D';
        soundEngine.playStruggleEffort();
        return true;
      }
    }
    return false;
  }

  public update(delta: number): { resolved: boolean; success: boolean; damageDealt: number } {
    if (!this.isGrappling || !this.grappleEnemy) {
      return { resolved: false, success: false, damageDealt: 0 };
    }

    this.struggleTimer += delta;

    // Decay progress slowly
    this.progress = Math.max(0, this.progress - delta * 15);

    // Check if player succeeded in breaking free
    if (this.progress >= this.targetProgress) {
      // Violent escape: push enemy backwards
      const enemy = this.grappleEnemy;
      const pushDir = new THREE.Vector3().subVectors(enemy.group.position, enemy.group.position).normalize();
      enemy.takeDamage(20);
      enemy.staggerTime = 1.0;
      enemy.group.position.add(new THREE.Vector3(0, 0, 1.4));

      soundEngine.playPunch(true);

      this.isGrappling = false;
      this.grappleEnemy = null;
      this.progress = 0;
      return { resolved: true, success: true, damageDealt: 0 };
    }

    // Check timeout / failed struggle
    if (this.struggleTimer >= this.maxStruggleTime) {
      const enemy = this.grappleEnemy;
      const damage = enemy.type === 'clicker' ? 55 : 30; // Clicker bite is devastating
      soundEngine.playClickerSound('shriek');

      // Break grapple but with heavy damage
      enemy.staggerTime = 0.5;
      this.isGrappling = false;
      this.grappleEnemy = null;
      this.progress = 0;
      return { resolved: true, success: false, damageDealt: damage };
    }

    return { resolved: false, success: false, damageDealt: 0 };
  }
}
