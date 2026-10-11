import * as THREE from 'three';
import { EnemyModel } from '../models/EnemyModel';
import { soundEngine } from '../audio/SoundSystem';

export interface CombatHitResult {
  hit: boolean;
  target?: EnemyModel;
  damage: number;
  isFatal?: boolean;
}

export class CombatSystem {
  public knifeDrawn: boolean = false;
  public knifeDurability: number = 100; // 0 to 100
  public maxKnifeDurability: number = 100;

  public isAttacking: boolean = false;
  public attackType: 'punch' | 'knife' = 'punch';
  public attackProgress: number = 0; // 0 to 1
  public attackDuration: number = 0.45; // seconds
  private hasDealtDamageThisAttack: boolean = false;

  public isDodging: boolean = false;
  public dodgeDirection: 'left' | 'right' = 'left';
  public dodgeProgress: number = 0;
  public dodgeDuration: number = 0.38;
  public isInvulnerable: boolean = false;

  public isInspectingKnife: boolean = false;
  public inspectProgress: number = 0;

  /**
   * Toggle draw / holster Dina's knife (R key)
   */
  public toggleKnife() {
    if (this.isAttacking || this.isDodging) return;
    this.knifeDrawn = !this.knifeDrawn;
    soundEngine.playKnife(this.knifeDrawn ? 'draw' : 'sheath');
  }

  /**
   * Trigger melee attack (F for punch, Left Click for knife if drawn)
   */
  public startAttack(type: 'punch' | 'knife', armInjuryFactor = 0, currentStamina = 100): boolean {
    if (this.isAttacking || this.isDodging || this.isInspectingKnife) return false;
    if (currentStamina < 15) return false; // not enough stamina

    this.isAttacking = true;
    this.attackType = type;
    this.attackProgress = 0;
    this.hasDealtDamageThisAttack = false;

    // Arm injury makes attack slower
    this.attackDuration = (type === 'knife' ? 0.42 : 0.48) * (1 + armInjuryFactor * 0.5);

    if (type === 'knife') {
      soundEngine.playKnife('slash');
    } else {
      soundEngine.playPunch(false);
    }

    return true;
  }

  /**
   * Trigger directional dodge (Mouse 4/5 or Q/E)
   */
  public startDodge(direction: 'left' | 'right', currentStamina = 100, legInjuryFactor = 0): boolean {
    if (this.isDodging || this.isAttacking || currentStamina < 20) return false;

    this.isDodging = true;
    this.dodgeDirection = direction;
    this.dodgeProgress = 0;
    this.dodgeDuration = 0.36 * (1 + legInjuryFactor * 0.4);
    this.isInvulnerable = true;

    soundEngine.playDodge();
    return true;
  }

  /**
   * Inspect knife (X key) to trigger emotional memories of Dina
   */
  public startKnifeInspect() {
    if (this.isAttacking || this.isDodging) return;
    this.isInspectingKnife = true;
    this.knifeDrawn = true;
    this.inspectProgress = 0;
  }

  public stopKnifeInspect() {
    this.isInspectingKnife = false;
    this.inspectProgress = 0;
  }

  /**
   * Updates attack and dodge timers and tests collision with enemies in arc
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerRotationY: number,
    enemies: EnemyModel[],
    armInjuryFactor = 0
  ): CombatHitResult | null {
    // 1. Attack Progression & Hit Detection
    if (this.isAttacking) {
      this.attackProgress += delta / this.attackDuration;

      // Peak of the swing: check hit zone (between 35% and 60% of animation)
      if (this.attackProgress >= 0.35 && this.attackProgress <= 0.65 && !this.hasDealtDamageThisAttack) {
        const attackRange = this.attackType === 'knife' ? 1.85 : 1.6;
        const forward = new THREE.Vector3(Math.sin(playerRotationY), 0, Math.cos(playerRotationY));

        for (const enemy of enemies) {
          if (enemy.health <= 0) continue;

          const toEnemy = new THREE.Vector3().subVectors(enemy.group.position, playerPos);
          toEnemy.y = 0;
          const dist = toEnemy.length();

          if (dist <= attackRange) {
            // Check cone angle in front of player
            const angle = forward.angleTo(toEnemy.normalize());
            if (angle < Math.PI / 3) {
              // Valid Hit!
              this.hasDealtDamageThisAttack = true;

              const baseDamage = this.attackType === 'knife' ? 45 : 25;
              const actualDamage = baseDamage * (1 - armInjuryFactor * 0.35);

              enemy.takeDamage(actualDamage);

              // Push enemy backwards
              const knockbackDir = forward.clone().multiplyScalar(0.7);
              enemy.group.position.add(knockbackDir);

              if (this.attackType === 'knife') {
                soundEngine.playKnife('hit');
                this.knifeDurability = Math.max(0, this.knifeDurability - 5);
              } else {
                soundEngine.playPunch(true);
              }

              return {
                hit: true,
                target: enemy,
                damage: actualDamage,
                isFatal: enemy.health <= 0,
              };
            }
          }
        }
      }

      if (this.attackProgress >= 1.0) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    }

    // 2. Dodge Progression
    if (this.isDodging) {
      this.dodgeProgress += delta / this.dodgeDuration;

      // i-frame window: invulnerable during first 65% of dodge
      this.isInvulnerable = this.dodgeProgress < 0.65;

      if (this.dodgeProgress >= 1.0) {
        this.isDodging = false;
        this.dodgeProgress = 0;
        this.isInvulnerable = false;
      }
    }

    // 3. Inspect Progression
    if (this.isInspectingKnife) {
      this.inspectProgress += delta * 0.5;
    }

    return null;
  }

  public sharpenKnife(amount = 40) {
    this.knifeDurability = Math.min(this.maxKnifeDurability, this.knifeDurability + amount);
  }
}
