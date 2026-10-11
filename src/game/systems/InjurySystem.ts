/**
 * Realistic Injury System
 * Tracks individual body part damage:
 * - Leg injury: decreases sprint speed, triggers uneven limping, reduces dodge range/speed
 * - Arm injury: slows knife draws and melee attack frequency, reduces melee damage
 * - Torso injury: accelerates stamina drain, causes labored breathing audio and red vignette
 * - Bleeding state: slow gradual health loss until bandaged
 */

export interface BodyInjuries {
  head: number;      // 0 to 100
  torso: number;     // 0 to 100
  leftArm: number;   // 0 to 100
  rightArm: number;  // 0 to 100
  leftLeg: number;   // 0 to 100
  rightLeg: number;  // 0 to 100
  isBleeding: boolean;
}

export class InjurySystem {
  public health: number = 100;
  public maxHealth: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;

  public injuries: BodyInjuries = {
    head: 0,
    torso: 15, // JJ starts slightly fatigued from his trek leaving Jackson
    leftArm: 0,
    rightArm: 0,
    leftLeg: 20, // minor sprain/bruise from the road
    rightLeg: 0,
    isBleeding: false,
  };

  public isHealing: boolean = false;
  public healingProgress: number = 0; // 0 to 1

  /**
   * Apply incoming damage to specific or randomized body parts
   */
  public applyDamage(amount: number, targetPart?: keyof Omit<BodyInjuries, 'isBleeding'>) {
    this.health = Math.max(0, this.health - amount);

    // If specific body part isn't targeted, distribute realistically
    const part = targetPart || (Math.random() < 0.4 ? 'torso' : Math.random() < 0.7 ? 'rightLeg' : 'rightArm');
    this.injuries[part] = Math.min(100, this.injuries[part] + amount * 1.2);

    if (amount > 25) {
      this.injuries.isBleeding = true;
    }
  }

  public update(delta: number, isSprinting: boolean, isMoving: boolean) {
    // Bleeding logic
    if (this.injuries.isBleeding) {
      this.health = Math.max(5, this.health - delta * 0.8);
    }

    // Stamina calculation affected by torso injury
    const torsoFatigueMultiplier = 1 + (this.injuries.torso / 100) * 1.5;

    if (isSprinting && isMoving) {
      const drain = 22 * torsoFatigueMultiplier * delta;
      this.stamina = Math.max(0, this.stamina - drain);
    } else {
      // Recovery is slower if torso is injured
      const regenRate = (18 / torsoFatigueMultiplier) * delta;
      this.stamina = Math.min(this.maxStamina, this.stamina + regenRate);
    }
  }

  /**
   * Returns current overall leg injury normalized (0 to 1)
   */
  public getLegInjuryFactor(): number {
    return Math.max(this.injuries.leftLeg, this.injuries.rightLeg) / 100;
  }

  /**
   * Returns current arm injury normalized (0 to 1)
   */
  public getArmInjuryFactor(): number {
    return Math.max(this.injuries.leftArm, this.injuries.rightArm) / 100;
  }

  /**
   * Returns torso injury normalized (0 to 1)
   */
  public getTorsoInjuryFactor(): number {
    return this.injuries.torso / 100;
  }

  /**
   * Calculate adjusted movement speed
   */
  public getMoveSpeed(baseSpeed: number, isSprinting: boolean): number {
    const legDamage = this.getLegInjuryFactor();
    if (isSprinting) {
      if (this.stamina <= 0 || legDamage > 0.6) {
        // Can't sprint when legs are severely broken or stamina empty
        return baseSpeed * (1 - legDamage * 0.4);
      }
      return baseSpeed * 1.7 * (1 - legDamage * 0.35);
    }
    return baseSpeed * (1 - legDamage * 0.45);
  }

  /**
   * Calculate adjusted dodge distance / duration
   */
  public getDodgeModifier(): { distanceMultiplier: number; durationMultiplier: number } {
    const legDamage = this.getLegInjuryFactor();
    return {
      distanceMultiplier: Math.max(0.45, 1 - legDamage * 0.55),
      durationMultiplier: 1 + legDamage * 0.4, // takes longer / clumsier
    };
  }

  /**
   * Treat wounds with medkit or bandage
   */
  public healWounds(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.injuries.head = Math.max(0, this.injuries.head - amount * 0.8);
    this.injuries.torso = Math.max(0, this.injuries.torso - amount * 0.8);
    this.injuries.leftArm = Math.max(0, this.injuries.leftArm - amount * 0.8);
    this.injuries.rightArm = Math.max(0, this.injuries.rightArm - amount * 0.8);
    this.injuries.leftLeg = Math.max(0, this.injuries.leftLeg - amount * 0.8);
    this.injuries.rightLeg = Math.max(0, this.injuries.rightLeg - amount * 0.8);
    this.injuries.isBleeding = false;
  }
}
