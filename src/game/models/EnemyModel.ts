import * as THREE from 'three';

export type EnemyType = 'runner' | 'clicker' | 'hunter';
export type EnemyAIState = 'idle' | 'patrol' | 'alert' | 'hunt' | 'attack' | 'stagger' | 'dead';

export class EnemyModel {
  public group: THREE.Group;
  public type: EnemyType;
  public pelvis: THREE.Group;
  public spine: THREE.Group;
  public chest: THREE.Group;
  public head: THREE.Group;

  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;

  public health: number;
  public maxHealth: number;
  public state: EnemyAIState = 'idle';
  public alertLevel: number = 0; // 0 to 1
  public speed: number = 0;
  public targetPos: THREE.Vector3 = new THREE.Vector3();
  public staggerTime: number = 0;
  public attackCooldown: number = 0;
  public patrolWaypoints: THREE.Vector3[] = [];
  public currentWaypointIdx: number = 0;

  private animTimer: number = Math.random() * 10;
  private clickerTwitchTimer: number = 0;

  constructor(type: EnemyType, startPos: THREE.Vector3) {
    this.type = type;
    this.group = new THREE.Group();
    this.group.position.copy(startPos);

    if (type === 'clicker') {
      this.health = 160;
      this.maxHealth = 160;
    } else if (type === 'runner') {
      this.health = 80;
      this.maxHealth = 80;
    } else {
      this.health = 100;
      this.maxHealth = 100;
    }

    // Material definitions
    const fleshMaterial = new THREE.MeshStandardMaterial({
      color: type === 'clicker' ? 0x8a7b6b : type === 'runner' ? 0x9e887d : 0xb5886d,
      roughness: 0.8,
    });
    const clothesMaterial = new THREE.MeshStandardMaterial({
      color: type === 'clicker' ? 0x3d3835 : type === 'runner' ? 0x4a362f : 0x2f3c30,
      roughness: 0.9,
    });
    const fungusMaterial = new THREE.MeshStandardMaterial({
      color: 0xc49666, // Fungal golden-brown cordyceps
      roughness: 0.95,
      bumpScale: 0.05,
    });
    const fungusBloodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b3224, // Bloody raw fungal core
      roughness: 0.6,
    });

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.group.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.2, 10),
      clothesMaterial
    );
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // Spine & Chest
    this.spine = new THREE.Group();
    this.spine.position.y = 0.1;
    this.pelvis.add(this.spine);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.2;
    this.spine.add(this.chest);

    const chestMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.32, 0.25),
      clothesMaterial
    );
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Head
    this.head = new THREE.Group();
    this.head.position.y = 0.32;
    this.chest.add(this.head);

    if (type === 'clicker') {
      // Cordyceps blooming fungal plate head!
      // Split cranium with fan-like fungal petals bursting through
      const baseHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        fleshMaterial
      );
      this.head.add(baseHead);

      // Fungal plates bursting open
      for (let i = 0; i < 7; i++) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.14, 0.04, 7),
          i % 2 === 0 ? fungusMaterial : fungusBloodyMaterial
        );
        const angle = (i / 7) * Math.PI * 1.8 - 0.4;
        plate.position.set(Math.cos(angle) * 0.08, 0.08 + Math.sin(angle) * 0.05, Math.sin(angle) * 0.08);
        plate.rotation.set(Math.random() * 0.5, angle, Math.PI / 4 + Math.random() * 0.4);
        plate.castShadow = true;
        this.head.add(plate);
      }

      // Fungal shoulder growths
      const fungalShoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        fungusMaterial
      );
      fungalShoulder.position.set(0.22, 0.18, 0);
      fungalShoulder.scale.set(1.4, 0.8, 1);
      this.chest.add(fungalShoulder);

    } else if (type === 'runner') {
      // Runner: disfigured head, open jaw, blood spatter
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        fleshMaterial
      );
      headMesh.scale.set(0.9, 1.05, 1.0);
      headMesh.castShadow = true;
      this.head.add(headMesh);

      const jawMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.08, 0.1),
        fungusBloodyMaterial
      );
      jawMesh.position.set(0, -0.06, 0.06);
      jawMesh.rotation.x = 0.2; // agape mouth
      this.head.add(jawMesh);

      // Early fungal spore veins
      const sporePatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.03),
        fungusMaterial
      );
      sporePatch.position.set(0.06, 0.08, 0.09);
      this.head.add(sporePatch);
    } else {
      // Hunter: human with beanie hat
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        fleshMaterial
      );
      this.head.add(headMesh);

      const beanie = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1d241d })
      );
      beanie.position.y = 0.04;
      this.head.add(beanie);
    }

    // Arms
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.24, 0.2, 0);
    this.chest.add(this.leftArm);

    const lArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8),
      fleshMaterial
    );
    lArmMesh.position.y = -0.25;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.24, 0.2, 0);
    this.chest.add(this.rightArm);

    const rArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8),
      fleshMaterial
    );
    rArmMesh.position.y = -0.25;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);

    // Legs
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.12, -0.1, 0);
    this.pelvis.add(this.leftLeg);

    const lLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.85, 8),
      clothesMaterial
    );
    lLegMesh.position.y = -0.42;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.12, -0.1, 0);
    this.pelvis.add(this.rightLeg);

    const rLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.85, 8),
      clothesMaterial
    );
    rLegMesh.position.y = -0.42;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
  }

  public update(delta: number) {
    if (this.health <= 0) {
      this.state = 'dead';
      // Fall down on ground
      this.group.rotation.x = -Math.PI / 2;
      this.group.position.y = 0.2;
      return;
    }

    this.animTimer += delta;
    if (this.staggerTime > 0) {
      this.staggerTime -= delta;
      this.spine.rotation.x = -0.4;
      this.chest.rotation.y = 0.3;
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // AI Animation Behavior
    if (this.type === 'clicker') {
      // Clicker distinctive twitching: sporadic nervous micro-shakes
      this.clickerTwitchTimer += delta;
      if (this.clickerTwitchTimer > 0.3) {
        if (Math.random() > 0.4) {
          this.head.rotation.z = (Math.random() - 0.5) * 0.6;
          this.head.rotation.y = (Math.random() - 0.5) * 0.5;
        }
        this.clickerTwitchTimer = 0;
      }

      // Stalking posture: hunch forward, raised claw hands
      this.spine.rotation.x = 0.35 + Math.sin(this.animTimer * 2) * 0.08;
      this.leftArm.rotation.x = -0.7 + Math.sin(this.animTimer * 3) * 0.15;
      this.rightArm.rotation.x = -0.8 + Math.cos(this.animTimer * 3) * 0.15;
      this.leftArm.rotation.z = 0.3;
      this.rightArm.rotation.z = -0.3;
    } else if (this.type === 'runner') {
      // Runner: erratic, hyperactive twitches
      const isCharging = this.state === 'hunt' || this.state === 'attack';
      const cycleSpeed = isCharging ? 12 : 4;
      const legStride = Math.sin(this.animTimer * cycleSpeed);

      this.leftLeg.rotation.x = legStride * (isCharging ? 0.7 : 0.4);
      this.rightLeg.rotation.x = -legStride * (isCharging ? 0.7 : 0.4);

      if (isCharging) {
        this.spine.rotation.x = 0.5; // lunging forward
        this.leftArm.rotation.x = -1.2 + Math.sin(this.animTimer * 10) * 0.4;
        this.rightArm.rotation.x = -1.2 + Math.cos(this.animTimer * 10) * 0.4;
      } else {
        this.spine.rotation.x = 0.2 + Math.sin(this.animTimer * 4) * 0.1;
        this.leftArm.rotation.x = legStride * 0.4;
        this.rightArm.rotation.x = -legStride * 0.4;
      }
    } else {
      // Human Hunter
      const isWalking = this.speed > 0.1;
      if (isWalking) {
        const stride = Math.sin(this.animTimer * 6);
        this.leftLeg.rotation.x = stride * 0.5;
        this.rightLeg.rotation.x = -stride * 0.5;
        this.leftArm.rotation.x = -stride * 0.4;
        this.rightArm.rotation.x = stride * 0.4;
      }
    }
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.staggerTime = 0.45;
  }
}
