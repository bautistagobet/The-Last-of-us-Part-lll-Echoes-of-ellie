import * as THREE from 'three';

/**
 * Procedural Articulated 3D Character Model: JJ
 * Anatomically proportioned with realistic clothing, leather jacket, backpack,
 * combat boots, holster, hair, and Dina's detailed switchblade knife.
 * Includes procedural skeleton joints for realistic locomotion, limping,
 * injury postures, and Inverse Kinematics for wall/surface leaning.
 */

export interface CharacterAnimationState {
  isMoving: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isLimping: boolean;
  isLeaning: boolean;
  leanSide: 'left' | 'right' | 'front' | 'none';
  leanHandWorldPos?: THREE.Vector3;
  knifeDrawn: boolean;
  isAttacking: boolean;
  attackProgress: number; // 0 to 1
  attackType: 'punch' | 'knife';
  isDodging: boolean;
  dodgeProgress: number;
  dodgeDirection: 'left' | 'right';
  isGrappled: boolean;
  isInspectingKnife: boolean;
  inspectProgress: number;
  legInjury: number; // 0 to 1
  armInjury: number;
  torsoInjury: number;
  stamina: number;
}

export class CharacterModel {
  public group: THREE.Group;
  public pelvis: THREE.Group;
  public spine: THREE.Group;
  public chest: THREE.Group;
  public neck: THREE.Group;
  public head: THREE.Group;

  // Limbs
  public leftUpperArm: THREE.Group;
  public leftLowerArm: THREE.Group;
  public leftHand: THREE.Group;

  public rightUpperArm: THREE.Group;
  public rightLowerArm: THREE.Group;
  public rightHand: THREE.Group;

  public leftUpperLeg: THREE.Group;
  public leftLowerLeg: THREE.Group;
  public leftFoot: THREE.Group;

  public rightUpperLeg: THREE.Group;
  public rightLowerLeg: THREE.Group;
  public rightFoot: THREE.Group;

  // Equipment & Weapons
  public backpackGroup: THREE.Group;
  public knifeSheath: THREE.Group;
  public knifeInHand: THREE.Group;
  public knifeInSheath: THREE.Group;
  public flashlight: THREE.SpotLight;
  public flashlightMesh: THREE.Mesh;

  private walkCycleTime = 0;
  private breathTime = 0;

  constructor() {
    this.group = new THREE.Group();

    // Base colors & materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb498,
      roughness: 0.65,
      metalness: 0.05,
    });
    const jacketMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e352f, // Worn olive drab tactical jacket
      roughness: 0.85,
      metalness: 0.1,
    });
    const undershirtMaterial = new THREE.MeshStandardMaterial({
      color: 0x48423d, // Dark faded henley
      roughness: 0.9,
    });
    const jeansMaterial = new THREE.MeshStandardMaterial({
      color: 0x242e3b, // Worn denim with mud stains
      roughness: 0.88,
      metalness: 0.05,
    });
    const leatherMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d271d, // Weathered brown leather boots/belts/holster
      roughness: 0.6,
      metalness: 0.2,
    });
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x211713, // Dark textured hair
      roughness: 0.95,
    });
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dde3,
      metalness: 0.9,
      roughness: 0.25,
    });
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a858,
      metalness: 0.85,
      roughness: 0.35,
    });

    // 1. Pelvis / Hips (Root of body hierarchy, y ~ 0.95m)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.96;
    this.group.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.18, 12),
      jeansMaterial
    );
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // Leather belt with weathered buckle
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.04, 12),
      leatherMaterial
    );
    belt.position.y = 0.08;
    this.pelvis.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.045, 0.02),
      brassMaterial
    );
    buckle.position.set(0, 0.08, 0.19);
    this.pelvis.add(buckle);

    // 2. Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.09;
    this.pelvis.add(this.spine);

    const lowerTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.18, 0.18, 12),
      undershirtMaterial
    );
    lowerTorso.position.y = 0.09;
    lowerTorso.castShadow = true;
    this.spine.add(lowerTorso);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.18;
    this.spine.add(this.chest);

    // Jacket Upper Torso
    const chestMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.3, 0.26),
      jacketMaterial
    );
    chestMesh.position.y = 0.15;
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Jacket collar
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.17, 0.08, 12, 1, true, -Math.PI * 0.7, Math.PI * 1.4),
      jacketMaterial
    );
    collar.position.set(0, 0.3, 0.02);
    this.chest.add(collar);

    // 3. Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.3;
    this.chest.add(this.neck);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.1, 10),
      skinMaterial
    );
    neckMesh.position.y = 0.05;
    this.neck.add(neckMesh);

    this.head = new THREE.Group();
    this.head.position.y = 0.1;
    this.neck.add(this.head);

    // Head base (jaw + skull)
    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 16, 16),
      skinMaterial
    );
    cranium.position.set(0, 0.09, 0);
    cranium.scale.set(0.9, 1.1, 1.0);
    cranium.castShadow = true;
    this.head.add(cranium);

    const jaw = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.11, 0.14),
      skinMaterial
    );
    jaw.position.set(0, 0.02, 0.03);
    this.head.add(jaw);

    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMaterial
    );
    hair.position.set(0, 0.12, -0.01);
    hair.rotation.x = -0.2;
    this.head.add(hair);

    // Subtle face details (eyes sockets, brow, nose)
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.05, 5),
      skinMaterial
    );
    nose.position.set(0, 0.08, 0.12);
    nose.rotation.x = Math.PI * 0.45;
    this.head.add(nose);

    // 4. Arms (Left & Right)
    // Left Arm
    this.leftUpperArm = new THREE.Group();
    this.leftUpperArm.position.set(0.24, 0.25, 0);
    this.chest.add(this.leftUpperArm);

    const lBicep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.28, 10),
      jacketMaterial
    );
    lBicep.position.y = -0.14;
    lBicep.castShadow = true;
    this.leftUpperArm.add(lBicep);

    this.leftLowerArm = new THREE.Group();
    this.leftLowerArm.position.y = -0.28;
    this.leftUpperArm.add(this.leftLowerArm);

    const lForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.26, 10),
      jacketMaterial
    );
    lForearm.position.y = -0.13;
    lForearm.castShadow = true;
    this.leftLowerArm.add(lForearm);

    this.leftHand = new THREE.Group();
    this.leftHand.position.y = -0.26;
    this.leftLowerArm.add(this.leftHand);

    const lHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.09, 0.04),
      skinMaterial
    );
    lHandMesh.position.y = -0.045;
    this.leftHand.add(lHandMesh);

    // Right Arm
    this.rightUpperArm = new THREE.Group();
    this.rightUpperArm.position.set(-0.24, 0.25, 0);
    this.chest.add(this.rightUpperArm);

    const rBicep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.28, 10),
      jacketMaterial
    );
    rBicep.position.y = -0.14;
    rBicep.castShadow = true;
    this.rightUpperArm.add(rBicep);

    this.rightLowerArm = new THREE.Group();
    this.rightLowerArm.position.y = -0.28;
    this.rightUpperArm.add(this.rightLowerArm);

    const rForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.26, 10),
      jacketMaterial
    );
    rForearm.position.y = -0.13;
    rForearm.castShadow = true;
    this.rightLowerArm.add(rForearm);

    this.rightHand = new THREE.Group();
    this.rightHand.position.y = -0.26;
    this.rightLowerArm.add(this.rightHand);

    const rHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.09, 0.04),
      skinMaterial
    );
    rHandMesh.position.y = -0.045;
    this.rightHand.add(rHandMesh);

    // 5. Legs (Left & Right)
    // Left Leg
    this.leftUpperLeg = new THREE.Group();
    this.leftUpperLeg.position.set(0.12, -0.05, 0);
    this.pelvis.add(this.leftUpperLeg);

    const lThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.44, 10),
      jeansMaterial
    );
    lThigh.position.y = -0.22;
    lThigh.castShadow = true;
    this.leftUpperLeg.add(lThigh);

    this.leftLowerLeg = new THREE.Group();
    this.leftLowerLeg.position.y = -0.44;
    this.leftUpperLeg.add(this.leftLowerLeg);

    const lShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.42, 10),
      jeansMaterial
    );
    lShin.position.y = -0.21;
    lShin.castShadow = true;
    this.leftLowerLeg.add(lShin);

    this.leftFoot = new THREE.Group();
    this.leftFoot.position.y = -0.42;
    this.leftLowerLeg.add(this.leftFoot);

    const lBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.22),
      leatherMaterial
    );
    lBoot.position.set(0, -0.03, 0.05);
    lBoot.castShadow = true;
    this.leftFoot.add(lBoot);

    // Right Leg
    this.rightUpperLeg = new THREE.Group();
    this.rightUpperLeg.position.set(-0.12, -0.05, 0);
    this.pelvis.add(this.rightUpperLeg);

    const rThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.44, 10),
      jeansMaterial
    );
    rThigh.position.y = -0.22;
    rThigh.castShadow = true;
    this.rightUpperLeg.add(rThigh);

    this.rightLowerLeg = new THREE.Group();
    this.rightLowerLeg.position.y = -0.44;
    this.rightUpperLeg.add(this.rightLowerLeg);

    const rShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.42, 10),
      jeansMaterial
    );
    rShin.position.y = -0.21;
    rShin.castShadow = true;
    this.rightLowerLeg.add(rShin);

    this.rightFoot = new THREE.Group();
    this.rightFoot.position.y = -0.42;
    this.rightLowerLeg.add(this.rightFoot);

    const rBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.22),
      leatherMaterial
    );
    rBoot.position.set(0, -0.03, 0.05);
    rBoot.castShadow = true;
    this.rightFoot.add(rBoot);

    // 6. Backpack & Survival Gear (Back of chest)
    this.backpackGroup = new THREE.Group();
    this.backpackGroup.position.set(0, 0.15, -0.18);
    this.chest.add(this.backpackGroup);

    const packMain = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.38, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x333b2e, roughness: 0.9 })
    );
    packMain.castShadow = true;
    this.backpackGroup.add(packMain);

    // Rolled sleeping bag atop backpack
    const bedroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.32, 10),
      new THREE.MeshStandardMaterial({ color: 0x47382d, roughness: 0.95 })
    );
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.22, 0);
    bedroll.castShadow = true;
    this.backpackGroup.add(bedroll);

    // Antenna & side pouch
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.35, 6),
      steelMaterial
    );
    antenna.position.set(0.14, 0.25, 0.02);
    this.backpackGroup.add(antenna);

    // Flashlight mounted on left chest harness strap
    this.flashlightMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.02, 0.12, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 })
    );
    this.flashlightMesh.rotation.x = Math.PI / 2;
    this.flashlightMesh.position.set(0.12, 0.22, 0.14);
    this.chest.add(this.flashlightMesh);

    this.flashlight = new THREE.SpotLight(0xfffaed, 2.5, 30, Math.PI / 6, 0.4, 1.2);
    this.flashlight.position.set(0.12, 0.22, 0.18);
    this.flashlight.target.position.set(0.12, 0.18, 5);
    this.chest.add(this.flashlight);
    this.chest.add(this.flashlight.target);

    // 7. Dina's Knife: detailed 3D model
    const createKnifeModel = () => {
      const knife = new THREE.Group();

      // Blade: clipped drop-point survival blade with blood groove / fuller
      const bladeGeo = new THREE.BoxGeometry(0.03, 0.18, 0.006);
      const blade = new THREE.Mesh(bladeGeo, steelMaterial);
      blade.position.y = 0.09;
      blade.castShadow = true;
      knife.add(blade);

      // Blade tip taper
      const tipGeo = new THREE.ConeGeometry(0.015, 0.05, 4);
      const tip = new THREE.Mesh(tipGeo, steelMaterial);
      tip.position.y = 0.2;
      tip.rotation.y = Math.PI / 4;
      knife.add(tip);

      // Brass Guard / Bolster
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.012, 0.016),
        brassMaterial
      );
      guard.position.y = 0.006;
      knife.add(guard);

      // Handle / Grip: Rosewood with ergonomics
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.12, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.55 })
      );
      handle.position.y = -0.06;
      knife.add(handle);

      // Brass pins in handle
      const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022), brassMaterial);
      pin1.rotation.x = Math.PI / 2;
      pin1.position.set(0, -0.04, 0);
      knife.add(pin1);

      const pin2 = pin1.clone();
      pin2.position.set(0, -0.08, 0);
      knife.add(pin2);

      return knife;
    };

    // Knife in Sheath (on right hip belt)
    this.knifeSheath = new THREE.Group();
    this.knifeSheath.position.set(-0.21, 0.04, 0.05);
    this.knifeSheath.rotation.z = -0.15;
    this.knifeSheath.rotation.y = 0.2;
    this.pelvis.add(this.knifeSheath);

    const sheathHolster = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.22, 0.025),
      leatherMaterial
    );
    sheathHolster.position.y = -0.1;
    this.knifeSheath.add(sheathHolster);

    this.knifeInSheath = createKnifeModel();
    this.knifeInSheath.position.y = -0.02;
    this.knifeInSheath.rotation.z = Math.PI; // Hilt pointing upward
    this.knifeSheath.add(this.knifeInSheath);

    // Knife in Right Hand (when drawn)
    this.knifeInHand = createKnifeModel();
    this.knifeInHand.position.set(0, -0.05, 0.04);
    this.knifeInHand.rotation.x = Math.PI / 2;
    this.knifeInHand.rotation.z = 0;
    this.knifeInHand.visible = false;
    this.rightHand.add(this.knifeInHand);
  }

  /**
   * Updates character procedural animations and bone kinematics
   */
  public update(delta: number, state: CharacterAnimationState) {
    this.breathTime += delta * (1.2 + (1 - (state.stamina / 100)) * 2.5); // faster breathing when low stamina

    // 1. Torso breathing animation
    const breathAmount = Math.sin(this.breathTime) * (0.015 + state.torsoInjury * 0.03);
    this.chest.scale.set(1 + breathAmount, 1 + breathAmount * 0.5, 1 + breathAmount * 1.5);
    this.spine.rotation.x = (state.torsoInjury > 0.4 ? 0.2 : 0) + breathAmount * 0.5;

    // 2. Weapon state
    this.knifeInSheath.visible = !state.knifeDrawn;
    this.knifeInHand.visible = state.knifeDrawn;

    // 3. Crouching stance
    const targetPelvisY = state.isCrouching ? 0.65 : (state.isLimping ? 0.91 : 0.96);
    this.pelvis.position.y += (targetPelvisY - this.pelvis.position.y) * Math.min(1, delta * 10);

    // 4. Locomotion / Walking / Sprinting / Limping cycle
    if (state.isMoving) {
      const speedMultiplier = state.isSprinting ? 9.5 : (state.isCrouching ? 4.5 : 6.0);
      const limpFactor = state.legInjury > 0 ? (1.0 - state.legInjury * 0.4) : 1.0;
      this.walkCycleTime += delta * speedMultiplier * limpFactor;

      const stride = Math.sin(this.walkCycleTime);
      const armStride = Math.cos(this.walkCycleTime);

      // Leg swings
      if (state.isLimping || state.legInjury > 0.2) {
        // Uneven stride: right leg hurts, left leg takes heavier duty
        const unevenLeft = Math.sin(this.walkCycleTime) * 0.55;
        const unevenRight = Math.sin(this.walkCycleTime + 0.3) * (0.25 * (1 - state.legInjury * 0.5));

        this.leftUpperLeg.rotation.x = unevenLeft;
        this.leftLowerLeg.rotation.x = Math.max(0, -unevenLeft * 0.8);

        this.rightUpperLeg.rotation.x = unevenRight - 0.15;
        this.rightLowerLeg.rotation.x = Math.max(0.1, -unevenRight * 0.5);

        // Body tilts sideways on limp step
        this.pelvis.rotation.z = Math.sin(this.walkCycleTime) * (0.08 + state.legInjury * 0.12);
        this.spine.rotation.z = -this.pelvis.rotation.z * 0.6;
      } else {
        const legAmp = state.isSprinting ? 0.8 : 0.45;
        this.leftUpperLeg.rotation.x = stride * legAmp;
        this.leftLowerLeg.rotation.x = Math.max(0, -stride * legAmp * 1.1);

        this.rightUpperLeg.rotation.x = -stride * legAmp;
        this.rightLowerLeg.rotation.x = Math.max(0, stride * legAmp * 1.1);

        this.pelvis.rotation.z = 0;
        this.spine.rotation.z = 0;
      }

      // Arm swing if not attacking or inspecting
      if (!state.isAttacking && !state.isInspectingKnife && !state.isLeaning) {
        const armAmp = state.isSprinting ? 0.7 : 0.35;
        const injuredArmDamp = 1 - state.armInjury * 0.6;

        this.leftUpperArm.rotation.x = -armStride * armAmp;
        this.leftLowerArm.rotation.x = -0.3;

        this.rightUpperArm.rotation.x = armStride * armAmp * injuredArmDamp;
        this.rightLowerArm.rotation.x = -0.4;
      }
    } else {
      // Idle pose reset
      const resetSpeed = Math.min(1, delta * 8);
      this.leftUpperLeg.rotation.x += (0 - this.leftUpperLeg.rotation.x) * resetSpeed;
      this.leftLowerLeg.rotation.x += (0 - this.leftLowerLeg.rotation.x) * resetSpeed;
      this.rightUpperLeg.rotation.x += (0 - this.rightUpperLeg.rotation.x) * resetSpeed;
      this.rightLowerLeg.rotation.x += (0 - this.rightLowerLeg.rotation.x) * resetSpeed;

      if (!state.isAttacking && !state.isInspectingKnife && !state.isLeaning) {
        this.leftUpperArm.rotation.x += (-0.05 - this.leftUpperArm.rotation.x) * resetSpeed;
        this.leftUpperArm.rotation.z += (0.1 - this.leftUpperArm.rotation.z) * resetSpeed;
        this.leftLowerArm.rotation.x += (-0.15 - this.leftLowerArm.rotation.x) * resetSpeed;

        this.rightUpperArm.rotation.x += (-0.05 - this.rightUpperArm.rotation.x) * resetSpeed;
        this.rightUpperArm.rotation.z += (-0.1 - this.rightUpperArm.rotation.z) * resetSpeed;
        this.rightLowerArm.rotation.x += (-0.15 - this.rightLowerArm.rotation.x) * resetSpeed;
      }
    }

    // 5. Surface Leaning / Wall support IK
    if (state.isLeaning) {
      if (state.leanSide === 'left') {
        // Left arm extends outward against wall
        this.leftUpperArm.rotation.x = 0.2;
        this.leftUpperArm.rotation.z = 1.25; // Reaching leftwards
        this.leftLowerArm.rotation.x = -0.3;
        this.leftLowerArm.rotation.z = -0.2;
        this.spine.rotation.z = 0.18; // Lean body towards left wall
      } else if (state.leanSide === 'right') {
        // Right arm extends outward against wall
        this.rightUpperArm.rotation.x = 0.2;
        this.rightUpperArm.rotation.z = -1.25; // Reaching rightwards
        this.rightLowerArm.rotation.x = -0.3;
        this.rightLowerArm.rotation.z = 0.2;
        this.spine.rotation.z = -0.18; // Lean body towards right wall
      } else if (state.leanSide === 'front') {
        // Both hands rest on barrier / desk / car hood
        this.leftUpperArm.rotation.x = -0.7;
        this.leftUpperArm.rotation.z = 0.3;
        this.leftLowerArm.rotation.x = -0.6;

        this.rightUpperArm.rotation.x = -0.7;
        this.rightUpperArm.rotation.z = -0.3;
        this.rightLowerArm.rotation.x = -0.6;
        this.spine.rotation.x = 0.3; // forward lean
      }
    }

    // 6. Combat Attack Animations (Melee Punch or Knife Slash)
    if (state.isAttacking) {
      const p = state.attackProgress;
      if (state.attackType === 'knife') {
        // Dynamic horizontal slash / thrust
        if (p < 0.4) {
          // Wind up
          this.rightUpperArm.rotation.x = -0.8;
          this.rightUpperArm.rotation.y = 0.8;
          this.rightUpperArm.rotation.z = -0.5;
          this.rightLowerArm.rotation.x = -1.2;
          this.spine.rotation.y = 0.35;
        } else if (p < 0.7) {
          // Swift cross slash
          const strike = (p - 0.4) / 0.3;
          this.rightUpperArm.rotation.x = -0.3;
          this.rightUpperArm.rotation.y = -0.9 * strike;
          this.rightUpperArm.rotation.z = 0.3;
          this.rightLowerArm.rotation.x = -0.5;
          this.spine.rotation.y = -0.4 * strike;
        } else {
          // Recovery
          this.rightUpperArm.rotation.x = -0.1;
          this.rightUpperArm.rotation.y = 0;
          this.spine.rotation.y = 0;
        }
      } else {
        // Melee brawler punch
        if (p < 0.45) {
          // Draw back fist
          this.rightUpperArm.rotation.x = 0.3;
          this.rightUpperArm.rotation.z = -0.4;
          this.rightLowerArm.rotation.x = -1.5; // fist clenched back
          this.spine.rotation.y = 0.3;
        } else if (p < 0.75) {
          // Explosive right cross
          this.rightUpperArm.rotation.x = -1.4;
          this.rightUpperArm.rotation.z = 0.1;
          this.rightLowerArm.rotation.x = -0.2;
          this.spine.rotation.y = -0.45;
        } else {
          // Recoil
          this.rightUpperArm.rotation.x = -0.3;
          this.spine.rotation.y = 0;
        }
      }
    }

    // 7. Dodge Animation
    if (state.isDodging) {
      const dp = state.dodgeProgress;
      const rollSide = state.dodgeDirection === 'left' ? 1 : -1;
      this.pelvis.rotation.z = Math.sin(dp * Math.PI) * 0.45 * rollSide;
      this.spine.rotation.x = Math.sin(dp * Math.PI) * 0.3;
      this.pelvis.position.y = (state.isCrouching ? 0.65 : 0.9) - Math.sin(dp * Math.PI) * 0.25;
    }

    // 8. Inspect Knife Animation (Emotional contemplation of Dina's gift)
    if (state.isInspectingKnife) {
      // Bring right hand up to eye level and rotate blade
      this.rightUpperArm.rotation.x = -1.1;
      this.rightUpperArm.rotation.y = 0.35;
      this.rightUpperArm.rotation.z = -0.2;
      this.rightLowerArm.rotation.x = -1.2;
      this.rightHand.rotation.y = Math.sin(this.breathTime * 1.5) * 0.4;
      this.head.rotation.x = 0.3; // look down at knife
      this.head.rotation.y = -0.15;
    } else if (!state.isAttacking) {
      this.head.rotation.x = 0;
      this.head.rotation.y = 0;
    }
  }

  public setFlashlight(on: boolean) {
    this.flashlight.visible = on;
  }
}
