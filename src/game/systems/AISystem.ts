import * as THREE from 'three';
import { EnemyModel } from '../models/EnemyModel';
import { soundEngine } from '../audio/SoundSystem';

export interface SoundEvent {
  position: THREE.Vector3;
  radius: number;
  duration: number;
}

export class AISystem {
  public soundEvents: SoundEvent[] = [];
  private clickTimer: number = 0;

  /**
   * Broadcast a sound into the world (e.g. footsteps, sprinting, bottle shatter)
   */
  public emitSound(pos: THREE.Vector3, radius: number) {
    this.soundEvents.push({
      position: pos.clone(),
      radius,
      duration: 1.5,
    });
  }

  public update(
    delta: number,
    enemies: EnemyModel[],
    playerPos: THREE.Vector3,
    isPlayerCrouched: boolean,
    isPlayerSprinting: boolean,
    isGrappling: boolean,
    onGrappleTrigger: (enemy: EnemyModel) => void
  ) {
    // 1. Decay sound events
    for (let i = this.soundEvents.length - 1; i >= 0; i--) {
      this.soundEvents[i].duration -= delta;
      if (this.soundEvents[i].duration <= 0) {
        this.soundEvents.splice(i, 1);
      }
    }

    // 2. Clicker atmospheric clicks timer
    this.clickTimer += delta;
    if (this.clickTimer > 4.5) {
      const activeClickers = enemies.filter((e) => e.type === 'clicker' && e.health > 0);
      if (activeClickers.length > 0) {
        soundEngine.playClickerSound('click');
      }
      this.clickTimer = 0;
    }

    // 3. Process each enemy
    for (const enemy of enemies) {
      if (enemy.health <= 0) continue;

      enemy.update(delta);

      const distToPlayer = enemy.group.position.distanceTo(playerPos);
      const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.group.position);
      const enemyForward = new THREE.Vector3(0, 0, 1).applyEuler(enemy.group.rotation).normalize();

      // Hearing check
      let heardSound = false;
      let soundTarget: THREE.Vector3 | null = null;

      for (const snd of this.soundEvents) {
        const d = enemy.group.position.distanceTo(snd.position);
        // Clickers have 2x hearing acuity!
        const hearingMult = enemy.type === 'clicker' ? 2.0 : 1.0;
        if (d <= snd.radius * hearingMult) {
          heardSound = true;
          soundTarget = snd.position;
          break;
        }
      }

      // Sight check (Clickers are 100% blind; Runners have 80 deg cone; Hunters have 90 deg cone)
      let spottedPlayer = false;
      if (enemy.type !== 'clicker') {
        const viewDist = isPlayerCrouched ? 8.5 : 18.0;
        if (distToPlayer <= viewDist) {
          const angle = enemyForward.angleTo(toPlayer.clone().normalize());
          if (angle < Math.PI / 3) {
            spottedPlayer = true;
          }
        }
      }

      // State Machine Transitions
      if (spottedPlayer) {
        if (enemy.state !== 'hunt' && enemy.state !== 'attack') {
          enemy.state = 'hunt';
          soundEngine.playRunnerGrowl();
        }
        enemy.targetPos.copy(playerPos);
      } else if (heardSound && soundTarget) {
        if (enemy.state !== 'hunt') {
          enemy.state = 'alert';
          if (enemy.type === 'clicker') {
            soundEngine.playClickerSound('click');
          }
        }
        enemy.targetPos.copy(soundTarget);
      }

      // Navigation & Movement
      if (enemy.state === 'hunt' || enemy.state === 'alert') {
        // Face target
        const lookTarget = enemy.targetPos.clone();
        lookTarget.y = enemy.group.position.y;
        enemy.group.lookAt(lookTarget);

        const moveDir = new THREE.Vector3().subVectors(enemy.targetPos, enemy.group.position);
        moveDir.y = 0;
        const dToTarget = moveDir.length();

        if (dToTarget > 1.2) {
          moveDir.normalize();
          const speed = enemy.state === 'hunt' ? (enemy.type === 'runner' ? 4.6 : 3.4) : 1.8;
          enemy.speed = speed;
          enemy.group.position.add(moveDir.multiplyScalar(speed * delta));
        } else {
          enemy.speed = 0;
          if (enemy.state === 'alert') {
            // Reached sound source, return to idle after checking
            enemy.state = 'idle';
          }
        }

        // Attack / Grapple trigger when close to player
        if (enemy.state === 'hunt' && distToPlayer <= 1.4 && !isGrappling && enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 2.5;
          // Trigger Grapple QTE!
          onGrappleTrigger(enemy);
        }
      } else {
        // Idle / Patrol
        enemy.speed = 0;
      }
    }
  }
}
