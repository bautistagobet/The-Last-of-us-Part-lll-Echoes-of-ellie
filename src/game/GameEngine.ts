import * as THREE from 'three';
import { CharacterModel } from './models/CharacterModel';
import { EnemyModel, EnemyType } from './models/EnemyModel';
import { EnvironmentBuilder, InteractiveObject } from './models/EnvironmentBuilder';
import { WallLeanSystem, LeanResult } from './systems/WallLeanSystem';
import { InjurySystem, BodyInjuries } from './systems/InjurySystem';
import { CombatSystem } from './systems/CombatSystem';
import { GrappleSystem } from './systems/GrappleSystem';
import { AISystem } from './systems/AISystem';
import { InventorySystem, CraftingRecipe } from './systems/InventorySystem';
import { soundEngine } from './audio/SoundSystem';

export interface GameEngineState {
  health: number;
  maxHealth: number;
  stamina: number;
  injuries: BodyInjuries;
  knifeDrawn: boolean;
  knifeDurability: number;
  isLeaning: boolean;
  leanSide: 'left' | 'right' | 'front' | 'none';
  leanType?: string;
  isGrappling: boolean;
  grappleProgress: number;
  grappleMashKey: 'F' | 'AD';
  isAimingBottle: boolean;
  bottlesCount: number;
  medkitsCount: number;
  isCrouching: boolean;
  isSprinting: boolean;
  noiseLevel: number; // 0 to 100
  flashlightOn: boolean;
  interactionPrompt: {
    visible: boolean;
    text: string;
    key: string;
  } | null;
  currentObjective: string;
  isInspectingKnife: boolean;
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // World & Actors
  public environment: EnvironmentBuilder;
  public player: CharacterModel;
  public enemies: EnemyModel[] = [];

  // Core Systems
  public wallLeanSystem: WallLeanSystem;
  public injurySystem: InjurySystem;
  public combatSystem: CombatSystem;
  public grappleSystem: GrappleSystem;
  public aiSystem: AISystem;
  public inventorySystem: InventorySystem;

  // Camera & Navigation
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.2;
  public cameraDistance: number = 2.8;
  public isAiming: boolean = false;
  private pointerLocked: boolean = false;

  // Input states
  private keys: Record<string, boolean> = {};
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 18); // start near farm camp
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerRotationY: number = Math.PI; // facing north towards hospital
  public isCrouched: boolean = false;
  public flashlightOn: boolean = true;
  private footstepTimer: number = 0;

  // Bottle throwing arc
  public isAimingBottle: boolean = false;
  private trajectoryLine: THREE.Line | null = null;

  // Animation frame
  private animationId: number | null = null;
  private lastTime: number = 0;
  private onStateChange?: (state: GameEngineState) => void;
  private nearestInteractive: InteractiveObject | null = null;

  // Graphics Quality Preset
  public graphicsQuality: 'low' | 'med' | 'high' = 'high';

  constructor(container: HTMLElement, onStateChange?: (state: GameEngineState) => void) {
    this.container = container;
    this.onStateChange = onStateChange;

    // 1. Scene with atmospheric fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1312);
    this.scene.fog = new THREE.FogExp2(0x131a17, 0.022);

    // 2. Camera: Over-the-shoulder third-person
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200);
    this.camera.position.set(0, 1.8, 22);

    // 3. Renderer with realistic tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting: Moonlight through storm clouds + warm ambient
    const moonLight = new THREE.DirectionalLight(0x7da4ba, 1.3);
    moonLight.position.set(25, 45, 20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -30;
    this.scene.add(moonLight);

    const ambientLight = new THREE.AmbientLight(0x1a2422, 0.7);
    this.scene.add(ambientLight);

    // 5. Systems initialization
    this.environment = new EnvironmentBuilder(this.scene);
    this.environment.buildWorld();

    this.player = new CharacterModel();
    this.player.group.position.copy(this.playerPos);
    this.scene.add(this.player.group);

    this.wallLeanSystem = new WallLeanSystem();
    this.injurySystem = new InjurySystem();
    this.combatSystem = new CombatSystem();
    this.grappleSystem = new GrappleSystem();
    this.aiSystem = new AISystem();
    this.inventorySystem = new InventorySystem();

    // 6. Spawn Tactical Enemies
    this.spawnEnemies();

    // 7. Trajectory Preview Line for Bottle Throwing
    const trajGeo = new THREE.BufferGeometry();
    const trajPoints = new Float32Array(30 * 3);
    trajGeo.setAttribute('position', new THREE.BufferAttribute(trajPoints, 3));
    this.trajectoryLine = new THREE.Line(
      trajGeo,
      new THREE.LineBasicMaterial({ color: 0x55ff88, transparent: true, opacity: 0.75 })
    );
    this.trajectoryLine.visible = false;
    this.scene.add(this.trajectoryLine);

    // 8. Event listeners
    this.setupInputs();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 9. Start Loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationId = requestAnimationFrame(this.loop);
  }

  private spawnEnemies() {
    // Runner lurking near abandoned patrol truck
    const runner1 = new EnemyModel('runner', new THREE.Vector3(2.0, 0, 8));
    this.enemies.push(runner1);
    this.scene.add(runner1.group);

    // Terrifying Clicker inside the dilapidated hospital entrance
    const clicker1 = new EnemyModel('clicker', new THREE.Vector3(-14, 0, -10));
    this.enemies.push(clicker1);
    this.scene.add(clicker1.group);

    // Runner stalking the overgrown road puddle
    const runner2 = new EnemyModel('runner', new THREE.Vector3(-1.5, 0, -22));
    this.enemies.push(runner2);
    this.scene.add(runner2.group);

    // Clicker lurking in the North wing of the hospital
    const clicker2 = new EnemyModel('clicker', new THREE.Vector3(-22, 0, -20));
    this.enemies.push(clicker2);
    this.scene.add(clicker2.group);

    // Hunter scout near roadblock
    const hunter1 = new EnemyModel('hunter', new THREE.Vector3(3.5, 0, -38));
    this.enemies.push(hunter1);
    this.scene.add(hunter1.group);
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      soundEngine.resume();
      this.keys[e.code] = true;

      // Handle Grapple QTE inputs
      if (this.grappleSystem.isGrappling) {
        this.grappleSystem.registerInput(e.code);
        return;
      }

      // Quick Melee punch (F key)
      if (e.code === 'KeyF') {
        this.combatSystem.startAttack(
          'punch',
          this.injurySystem.getArmInjuryFactor(),
          this.injurySystem.stamina
        );
        this.injurySystem.stamina = Math.max(0, this.injurySystem.stamina - 14);
      }

      // Draw / Holster Dina's Knife (R key)
      if (e.code === 'KeyR') {
        this.combatSystem.toggleKnife();
      }

      // Crouch toggle (C or KeyC)
      if (e.code === 'KeyC') {
        this.isCrouched = !this.isCrouched;
      }

      // Flashlight toggle (KeyT)
      if (e.code === 'KeyT') {
        this.flashlightOn = !this.flashlightOn;
        this.player.setFlashlight(this.flashlightOn);
      }

      // Inspect Dina's Knife (KeyX)
      if (e.code === 'KeyX') {
        if (this.combatSystem.isInspectingKnife) {
          this.combatSystem.stopKnifeInspect();
        } else {
          this.combatSystem.startKnifeInspect();
        }
      }

      // Interact / Collect / Heal (KeyE)
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }

      // Dodge Left alternative (KeyQ)
      if (e.code === 'KeyQ') {
        this.combatSystem.startDodge(
          'left',
          this.injurySystem.stamina,
          this.injurySystem.getLegInjuryFactor()
        );
        this.injurySystem.stamina = Math.max(0, this.injurySystem.stamina - 18);
      }

      // Throw bottle toggle (KeyG)
      if (e.code === 'KeyG') {
        if (this.inventorySystem.supplies.bottles > 0) {
          this.isAimingBottle = !this.isAimingBottle;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock & Mouse Look
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      soundEngine.resume();
      if (!this.pointerLocked) {
        canvas.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      const sensitivity = 0.0022;
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch = Math.max(-0.45, Math.min(0.85, this.cameraPitch + e.movementY * sensitivity));
    });

    // Mouse Buttons: Left Click (Attack/Throw), Right Click (Aim), Mouse 4/5 (Dodges)
    window.addEventListener('mousedown', (e) => {
      soundEngine.resume();

      // Right Click: Aim bottle or combat focus
      if (e.button === 2) {
        e.preventDefault();
        this.isAiming = true;
        if (this.inventorySystem.supplies.bottles > 0) {
          this.isAimingBottle = true;
        }
        return;
      }

      // Left Click (Attack with Knife if equipped or Punch; or Throw bottle if aiming)
      if (e.button === 0) {
        if (this.isAimingBottle) {
          this.throwBottle();
          return;
        }

        const attackType = this.combatSystem.knifeDrawn ? 'knife' : 'punch';
        const staminaCost = attackType === 'knife' ? 18 : 14;
        const success = this.combatSystem.startAttack(
          attackType,
          this.injurySystem.getArmInjuryFactor(),
          this.injurySystem.stamina
        );
        if (success) {
          this.injurySystem.stamina = Math.max(0, this.injurySystem.stamina - staminaCost);
        }
      }

      // Mouse Button 4 (Browser Back / Side button): Dodge Left
      if (e.button === 3) {
        e.preventDefault();
        this.combatSystem.startDodge(
          'left',
          this.injurySystem.stamina,
          this.injurySystem.getLegInjuryFactor()
        );
        this.injurySystem.stamina = Math.max(0, this.injurySystem.stamina - 18);
      }

      // Mouse Button 5 (Browser Forward / Side button): Dodge Right
      if (e.button === 4) {
        e.preventDefault();
        this.combatSystem.startDodge(
          'right',
          this.injurySystem.stamina,
          this.injurySystem.getLegInjuryFactor()
        );
        this.injurySystem.stamina = Math.max(0, this.injurySystem.stamina - 18);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isAiming = false;
        this.isAimingBottle = false;
      }
    });

    // Prevent context menu from right clicks
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleInteraction() {
    if (!this.nearestInteractive) {
      // If no interactive object, check if player has medkit and needs healing
      if (this.inventorySystem.supplies.medkits > 0 && this.injurySystem.health < 90) {
        this.inventorySystem.supplies.medkits--;
        this.injurySystem.healWounds(45);
        soundEngine.playLoot();
      }
      return;
    }

    const item = this.nearestInteractive;
    if (item.collected) return;

    if (item.type === 'note' && item.noteData) {
      this.inventorySystem.addNote({
        id: item.id,
        title: item.noteData.title,
        date: item.noteData.date,
        author: item.noteData.author,
        content: item.noteData.content,
      });
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'loot' && item.lootItems) {
      this.inventorySystem.addSupplies(item.lootItems);
      item.collected = true;
      item.mesh.visible = false;
    } else if (item.type === 'bottle') {
      this.inventorySystem.supplies.bottles++;
      item.collected = true;
      item.mesh.visible = false;
      soundEngine.playLoot();
    }
  }

  private throwBottle() {
    if (this.inventorySystem.supplies.bottles <= 0) return;
    this.inventorySystem.supplies.bottles--;
    this.isAimingBottle = false;

    // Calculate throw target based on camera forward
    const throwDir = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      Math.sin(-this.cameraPitch) + 0.2,
      Math.cos(this.cameraYaw)
    ).normalize();

    const targetLanding = this.playerPos.clone().add(throwDir.clone().multiplyScalar(15));
    targetLanding.y = 0.05;

    // Simulate shatter sound and emit sound event for Clicker & Runner distraction!
    setTimeout(() => {
      soundEngine.playBottleShatter();
      this.aiSystem.emitSound(targetLanding, 24); // Large sound radius!
    }, 450);
  }

  private updateTrajectory() {
    if (!this.trajectoryLine) return;
    if (!this.isAimingBottle) {
      this.trajectoryLine.visible = false;
      return;
    }

    this.trajectoryLine.visible = true;
    const positions = this.trajectoryLine.geometry.attributes.position.array as Float32Array;

    const startPos = this.playerPos.clone();
    startPos.y += 1.3;

    const throwDir = new THREE.Vector3(
      Math.sin(this.cameraYaw),
      Math.sin(-this.cameraPitch) + 0.3,
      Math.cos(this.cameraYaw)
    ).normalize().multiplyScalar(12);

    for (let i = 0; i < 30; i++) {
      const t = i * 0.04;
      const x = startPos.x + throwDir.x * t;
      const y = Math.max(0, startPos.y + throwDir.y * t - 0.5 * 9.8 * t * t);
      const z = startPos.z + throwDir.z * t;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
  }

  private loop(time: number) {
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(delta);
    this.renderer.render(this.scene, this.camera);

    this.animationId = requestAnimationFrame(this.loop);
  }

  private update(delta: number) {
    // 1. Movement Inputs & Acceleration
    const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.isCrouched;
    const forwardKey = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const sideKey = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);

    const isMoving = (forwardKey !== 0 || sideKey !== 0) && !this.grappleSystem.isGrappling;

    // Calculate movement vector relative to camera yaw
    let moveSpeed = this.injurySystem.getMoveSpeed(this.isCrouched ? 2.1 : 3.6, isSprinting);

    if (isMoving) {
      const moveAngle = Math.atan2(sideKey, forwardKey) + this.cameraYaw;
      const targetVel = new THREE.Vector3(Math.sin(moveAngle), 0, Math.cos(moveAngle)).multiplyScalar(moveSpeed);

      this.playerVelocity.lerp(targetVel, delta * 10);
      this.playerRotationY = moveAngle;

      // Noise calculation: crouched = 12%, walk = 35%, sprint = 85%
      const baseNoise = this.isCrouched ? 12 : isSprinting ? 85 : 35;
      if (Math.random() < 0.15) {
        this.aiSystem.emitSound(this.playerPos, this.isCrouched ? 3.0 : isSprinting ? 18.0 : 7.0);
      }

      // Footstep audio cadence
      this.footstepTimer += delta * (isSprinting ? 2.8 : 1.7);
      if (this.footstepTimer > 1.0) {
        const inPuddle = this.playerPos.z > 5 && this.playerPos.z < 11;
        soundEngine.playFootstep(inPuddle ? 'puddle' : 'asphalt', isSprinting);
        this.footstepTimer = 0;
      }
    } else {
      this.playerVelocity.lerp(new THREE.Vector3(0, 0, 0), delta * 12);
    }

    // 2. Collision checks against environment obstacles
    const nextPos = this.playerPos.clone().add(this.playerVelocity.clone().multiplyScalar(delta));
    let collided = false;
    for (const box of this.environment.colliders) {
      if (box.containsPoint(nextPos)) {
        collided = true;
        break;
      }
    }
    if (!collided) {
      this.playerPos.copy(nextPos);
    }

    this.player.group.position.copy(this.playerPos);
    this.player.group.rotation.y = this.playerRotationY;

    // 3. Update Systems
    this.injurySystem.update(delta, isSprinting, isMoving);

    // Surface Leaning System (Priority Mechanic!)
    const isInjured = this.injurySystem.getLegInjuryFactor() > 0.2 || this.injurySystem.getTorsoInjuryFactor() > 0.3;
    const leanResult: LeanResult = this.wallLeanSystem.checkLean(
      this.playerPos,
      this.playerRotationY,
      this.environment.leanableSurfaces,
      isInjured,
      this.injurySystem.stamina,
      this.isCrouched
    );

    // Combat System update & hit resolution
    const combatHit = this.combatSystem.update(
      delta,
      this.playerPos,
      this.playerRotationY,
      this.enemies,
      this.injurySystem.getArmInjuryFactor()
    );

    // Grapple QTE update
    const grappleRes = this.grappleSystem.update(delta);
    if (grappleRes.resolved && !grappleRes.success) {
      // Player failed grapple struggle: take severe damage
      this.injurySystem.applyDamage(grappleRes.damageDealt, 'torso');
    }

    // AI Enemies update
    this.aiSystem.update(
      delta,
      this.enemies,
      this.playerPos,
      this.isCrouched,
      isSprinting,
      this.grappleSystem.isGrappling,
      (enemy) => {
        if (!this.combatSystem.isInvulnerable) {
          this.grappleSystem.startGrapple(enemy, this.playerPos);
        }
      }
    );

    // Rain simulation update
    this.environment.updateRain(delta, this.playerPos);

    // Trajectory arc
    this.updateTrajectory();

    // Heartbeat low health warning
    soundEngine.setHeartbeatActive(this.injurySystem.health < 35);

    // 4. Update Character Procedural Rig & IK
    this.player.update(delta, {
      isMoving,
      isSprinting,
      isCrouching: this.isCrouched,
      isLimping: this.injurySystem.getLegInjuryFactor() > 0.25,
      isLeaning: leanResult.isLeaning,
      leanSide: leanResult.side,
      knifeDrawn: this.combatSystem.knifeDrawn,
      isAttacking: this.combatSystem.isAttacking,
      attackProgress: this.combatSystem.attackProgress,
      attackType: this.combatSystem.attackType,
      isDodging: this.combatSystem.isDodging,
      dodgeProgress: this.combatSystem.dodgeProgress,
      dodgeDirection: this.combatSystem.dodgeDirection,
      isGrappled: this.grappleSystem.isGrappling,
      isInspectingKnife: this.combatSystem.isInspectingKnife,
      inspectProgress: this.combatSystem.inspectProgress,
      legInjury: this.injurySystem.getLegInjuryFactor(),
      armInjury: this.injurySystem.getArmInjuryFactor(),
      torsoInjury: this.injurySystem.getTorsoInjuryFactor(),
      stamina: this.injurySystem.stamina,
    });

    // 5. Camera positioning: cinematic third-person over-the-shoulder
    this.updateCamera(delta);

    // 6. Interactive objects proximity detection
    this.checkInteractions();

    // 7. Push UI State to React
    if (this.onStateChange) {
      this.onStateChange({
        health: this.injurySystem.health,
        maxHealth: this.injurySystem.maxHealth,
        stamina: this.injurySystem.stamina,
        injuries: this.injurySystem.injuries,
        knifeDrawn: this.combatSystem.knifeDrawn,
        knifeDurability: this.combatSystem.knifeDurability,
        isLeaning: leanResult.isLeaning,
        leanSide: leanResult.side,
        leanType: leanResult.surfaceType,
        isGrappling: this.grappleSystem.isGrappling,
        grappleProgress: this.grappleSystem.progress,
        grappleMashKey: this.grappleSystem.mashPromptKey,
        isAimingBottle: this.isAimingBottle,
        bottlesCount: this.inventorySystem.supplies.bottles,
        medkitsCount: this.inventorySystem.supplies.medkits,
        isCrouching: this.isCrouched,
        isSprinting,
        noiseLevel: this.isCrouched ? 15 : isSprinting ? 85 : 35,
        flashlightOn: this.flashlightOn,
        interactionPrompt: this.nearestInteractive
          ? {
              visible: true,
              text: `${this.nearestInteractive.title} — ${this.nearestInteractive.description}`,
              key: 'E',
            }
          : null,
        currentObjective: 'Explora las ruinas del complejo médico de Salt Lake en busca de pistas de Ellie.',
        isInspectingKnife: this.combatSystem.isInspectingKnife,
      });
    }
  }

  private updateCamera(delta: number) {
    const shoulderOffset = new THREE.Vector3(
      this.isAiming ? 0.35 : 0.45,
      this.isCrouched ? 1.15 : 1.55,
      0
    );

    // Rotate shoulder offset according to camera yaw
    shoulderOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

    const targetPos = this.playerPos.clone().add(shoulderOffset);
    const camDist = this.isAiming ? 1.7 : this.cameraDistance;

    const camX = targetPos.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;
    const camY = targetPos.y + Math.sin(this.cameraPitch) * camDist;
    const camZ = targetPos.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 12);
    this.camera.lookAt(targetPos.x, targetPos.y + 0.15, targetPos.z);
  }

  private checkInteractions() {
    this.nearestInteractive = null;
    let closestDist = 2.4;

    for (const obj of this.environment.interactiveObjects) {
      if (obj.collected) continue;
      const dist = this.playerPos.distanceTo(obj.position);
      if (dist < closestDist) {
        closestDist = dist;
        this.nearestInteractive = obj;
      }
    }
  }

  public setQuality(quality: 'low' | 'med' | 'high') {
    this.graphicsQuality = quality;
    if (quality === 'low') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'med') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
    }
  }

  public handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
