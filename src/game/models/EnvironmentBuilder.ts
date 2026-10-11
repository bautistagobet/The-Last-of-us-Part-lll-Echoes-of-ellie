import * as THREE from 'three';

export interface InteractiveObject {
  id: string;
  type: 'loot' | 'note' | 'bottle' | 'door';
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  title: string;
  description: string;
  collected?: boolean;
  lootItems?: {
    rags?: number;
    alcohol?: number;
    blades?: number;
    tape?: number;
    scrap?: number;
  };
  noteData?: {
    title: string;
    date: string;
    content: string;
    author: string;
  };
}

export class EnvironmentBuilder {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public leanableSurfaces: {
    box: THREE.Box3;
    normal: THREE.Vector3;
    height: number;
    type: 'wall' | 'car' | 'barrier' | 'tree' | 'table';
  }[] = [];
  public interactiveObjects: InteractiveObject[] = [];
  public rainParticles: THREE.Points | null = null;
  public rainGeometry: THREE.BufferGeometry | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public buildWorld() {
    this.createTerrainAndRoad();
    this.createHospitalRuins();
    this.createAbandonedVehicles();
    this.createBarricadesAndPillars();
    this.createForestAndFoliage();
    this.createRainSystem();
    this.spawnCollectiblesAndLoot();
  }

  /**
   * Overgrown cracked asphalt road and muddy embankments with puddles
   */
  private createTerrainAndRoad() {
    // 1. Mud / overgrown ground
    const groundGeo = new THREE.PlaneGeometry(160, 160, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f251c, // Dark wet mossy soil
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Cracked asphalt highway down the center (z: -70 to 70)
    const roadGeo = new THREE.PlaneGeometry(14, 150);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x222426, // Wet cracked asphalt
      roughness: 0.45, // wet sheen
      metalness: 0.25,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    // Weathered yellow road divider lines
    for (let z = -65; z < 65; z += 6) {
      const lineGeo = new THREE.PlaneGeometry(0.3, 3);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0xa69742,
        roughness: 0.7,
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.03, z);
      line.receiveShadow = true;
      this.scene.add(line);
    }

    // 3. Rain Puddles (high specular reflectivity)
    const puddlePositions = [
      { x: -2.5, z: 8, w: 4.5, h: 3.2 },
      { x: 3.2, z: -12, w: 5.0, h: 4.0 },
      { x: -1.2, z: -28, w: 6.2, h: 3.5 },
      { x: 4.0, z: 24, w: 3.8, h: 5.2 },
      { x: -14, z: -10, w: 7, h: 6 },
    ];

    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x161c18,
      roughness: 0.08, // Mirror-like wet puddle
      metalness: 0.6,
    });

    puddlePositions.forEach((p) => {
      const puddle = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(p.x, 0.035, p.z);
      puddle.receiveShadow = true;
      this.scene.add(puddle);
    });
  }

  /**
   * Abandoned Hospital Outpost & crumbling brick structure
   */
  private createHospitalRuins() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x47433f, // Weathered concrete/brick
      roughness: 0.88,
      metalness: 0.1,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x36271c,
      roughness: 0.8,
    });

    // Main Hospital Wall (Left side of road: x = -14)
    const createWall = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, y + h / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);

      const box = new THREE.Box3().setFromObject(wall);
      this.colliders.push(box);

      // Register as leanable surface
      this.leanableSurfaces.push({
        box,
        normal: new THREE.Vector3(x > 0 ? -1 : 1, 0, 0),
        height: h,
        type: 'wall',
      });
      return wall;
    };

    // Hospital exterior facade
    createWall(-18, 0, -15, 1.2, 5.5, 24);
    // Hospital North wing
    createWall(-26, 0, -27, 16, 5.5, 1.2);
    // Hospital South wing
    createWall(-26, 0, -3, 16, 5.5, 1.2);

    // Interior partitions & medical rooms
    createWall(-24, 0, -15, 1.0, 4.0, 10);

    // Weathered Hospital Sign "ST. MARY'S RECOVERY FACILITY - WLF SECTOR 4"
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x1f2922, roughness: 0.7 })
    );
    sign.position.set(-17.2, 4.5, -15);
    sign.rotation.y = Math.PI / 2;
    this.scene.add(sign);

    // Broken interior hospital gurneys / tables (leanable)
    const tableGeo = new THREE.BoxGeometry(2.4, 0.9, 1.1);
    const gurney = new THREE.Mesh(tableGeo, woodMat);
    gurney.position.set(-21, 0.45, -12);
    gurney.castShadow = true;
    this.scene.add(gurney);

    const gurneyBox = new THREE.Box3().setFromObject(gurney);
    this.colliders.push(gurneyBox);
    this.leanableSurfaces.push({
      box: gurneyBox,
      normal: new THREE.Vector3(0, 0, 1),
      height: 0.9,
      type: 'table',
    });
  }

  /**
   * Abandoned rusted military Humvees and civilian sedans
   */
  private createAbandonedVehicles() {
    const carMat1 = new THREE.MeshStandardMaterial({
      color: 0x3d302a, // Rusted military brown
      roughness: 0.75,
      metalness: 0.4,
    });
    const carMat2 = new THREE.MeshStandardMaterial({
      color: 0x22353b, // Faded weathered patrol blue
      roughness: 0.7,
      metalness: 0.5,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x151f1f,
      roughness: 0.2,
      metalness: 0.9,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9,
    });

    const spawnCar = (x: number, z: number, rotY: number, mat: THREE.Material) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(x, 0, z);
      carGroup.rotation.y = rotY;

      // Chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 4.4), mat);
      body.position.y = 0.8;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Roof
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.4), glassMat);
      cabin.position.set(0, 1.5, -0.2);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
      const wheelPositions = [
        [-1.1, 0.38, 1.4],
        [1.1, 0.38, 1.4],
        [-1.1, 0.38, -1.4],
        [1.1, 0.38, -1.4],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, tireMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, wy, wz);
        w.castShadow = true;
        carGroup.add(w);
      });

      this.scene.add(carGroup);

      const box = new THREE.Box3().setFromObject(carGroup);
      this.colliders.push(box);

      // Register sides of vehicle as leanable surfaces
      this.leanableSurfaces.push({
        box,
        normal: new THREE.Vector3(Math.sin(rotY + Math.PI / 2), 0, Math.cos(rotY + Math.PI / 2)),
        height: 1.2,
        type: 'car',
      });
    };

    // Patrol truck blocking the road
    spawnCar(2.5, 6, 0.35, carMat1);
    // Overturned rusted SUV near hospital entrance
    spawnCar(-9, -8, -0.85, carMat2);
    // Abandoned ambulance down the road
    spawnCar(-2.0, -35, 0.1, carMat1);
  }

  /**
   * Concrete jersey barriers and stone pillars for cover & surface leaning
   */
  private createBarricadesAndPillars() {
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x4d4c48,
      roughness: 0.9,
    });

    const spawnBarrier = (x: number, z: number, rotY: number) => {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 0.6), barrierMat);
      barrier.position.set(x, 0.55, z);
      barrier.rotation.y = rotY;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);

      const box = new THREE.Box3().setFromObject(barrier);
      this.colliders.push(box);
      this.leanableSurfaces.push({
        box,
        normal: new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY)),
        height: 1.1,
        type: 'barrier',
      });
    };

    spawnBarrier(-3.5, 15, 0.1);
    spawnBarrier(4.2, -4, -0.2);
    spawnBarrier(-5.5, -22, 0.4);
    spawnBarrier(3.0, -48, -0.15);

    // Highway overpass support columns
    const columnGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
    const col1 = new THREE.Mesh(columnGeo, barrierMat);
    col1.position.set(-8, 4, 2);
    col1.castShadow = true;
    this.scene.add(col1);

    const colBox1 = new THREE.Box3().setFromObject(col1);
    this.colliders.push(colBox1);
    this.leanableSurfaces.push({
      box: colBox1,
      normal: new THREE.Vector3(1, 0, 0),
      height: 2.5,
      type: 'wall',
    });

    const col2 = new THREE.Mesh(columnGeo, barrierMat);
    col2.position.set(8, 4, -18);
    col2.castShadow = true;
    this.scene.add(col2);

    const colBox2 = new THREE.Box3().setFromObject(col2);
    this.colliders.push(colBox2);
    this.leanableSurfaces.push({
      box: colBox2,
      normal: new THREE.Vector3(-1, 0, 0),
      height: 2.5,
      type: 'wall',
    });
  }

  /**
   * Pacific Northwest Pine Trees, Birch, and Thick Fern Foliage
   */
  private createForestAndFoliage() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3b2b1e,
      roughness: 0.95,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1f3622,
      roughness: 0.8,
    });

    const spawnPineTree = (x: number, z: number, scale = 1.0) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.5 * scale, 7 * scale, 8), trunkMat);
      trunk.position.y = 3.5 * scale;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Pine foliage tiers
      for (let i = 0; i < 4; i++) {
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry((2.4 - i * 0.45) * scale, (2.6 - i * 0.3) * scale, 7),
          foliageMat
        );
        foliage.position.y = (4.0 + i * 1.5) * scale;
        foliage.castShadow = true;
        treeGroup.add(foliage);
      }

      this.scene.add(treeGroup);

      // Tree trunk collider
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, 2, z),
        new THREE.Vector3(1.2 * scale, 4, 1.2 * scale)
      );
      this.colliders.push(box);
      this.leanableSurfaces.push({
        box,
        normal: new THREE.Vector3(0, 0, 1),
        height: 2.0,
        type: 'tree',
      });
    };

    // Dense forest along the right highway verge (Cascades foothills)
    for (let z = -60; z <= 60; z += 12) {
      spawnPineTree(12 + Math.random() * 8, z + Math.random() * 4, 0.9 + Math.random() * 0.4);
      spawnPineTree(20 + Math.random() * 10, z + Math.random() * 5, 1.1 + Math.random() * 0.3);
    }

    // Left forest border behind hospital
    for (let z = -60; z <= 60; z += 16) {
      spawnPineTree(-38 - Math.random() * 8, z + Math.random() * 4, 1.0 + Math.random() * 0.4);
    }
  }

  /**
   * Procedural Falling Rain Particle System
   */
  private createRainSystem() {
    const rainCount = 2800;
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 30;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x88aacc,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.scene.add(this.rainParticles);
  }

  public updateRain(delta: number, playerPos: THREE.Vector3) {
    if (!this.rainParticles || !this.rainGeometry) return;
    const positions = this.rainGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= delta * 35; // fall speed
      // slight wind slant
      positions[i] -= delta * 4;

      if (positions[i + 1] < 0) {
        positions[i + 1] = 25 + Math.random() * 5;
        positions[i] = playerPos.x + (Math.random() - 0.5) * 60;
        positions[i + 2] = playerPos.z + (Math.random() - 0.5) * 60;
      }
    }
    this.rainGeometry.attributes.position.needsUpdate = true;
  }

  /**
   * Spawns narrative collectibles, notes, supplies & glass bottles
   */
  private spawnCollectiblesAndLoot() {
    // 1. Carta de Dina (Found near JJ's opening camp / motorcycle)
    const noteMat = new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 0.6 });
    const note1Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.35), noteMat);
    note1Mesh.position.set(0, 0.85, 22);
    note1Mesh.castShadow = true;
    this.scene.add(note1Mesh);

    this.interactiveObjects.push({
      id: 'note_dina',
      type: 'note',
      position: new THREE.Vector3(0, 0.85, 22),
      mesh: note1Mesh,
      title: 'Carta de Dina',
      description: 'Una carta arrugada y manchada de lágrimas dejada junto al cuchillo.',
      noteData: {
        title: 'Carta de Dina — Jackson',
        date: 'Otoño, 2039',
        author: 'Dina',
        content: `JJ,

Sé que no pude detenerte. Veo en tus ojos la misma mirada obstinada que tenía ella cada vez que miraba hacia el horizonte buscando fantasmas.

No te guardo rencor, mi amor. Pero prométeme que volverás. La granja siempre será tu hogar. 

Llévate mi cuchillo. Perteneció a mi hermana Talia, y luego me salvó la vida en Seattle incontables veces. Si encuentras a Ellie... dile que nunca la odié. Dile que sólo quería que estuviéramos a salvo.

Vuelve a casa conmigo, JJ. Por favor.

— Mamá (Dina)`,
      },
    });

    // 2. Fotografía desgastada de Ellie y Joel
    const photoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.25), noteMat);
    photoMesh.position.set(-22, 0.95, -12); // inside hospital table
    photoMesh.castShadow = true;
    this.scene.add(photoMesh);

    this.interactiveObjects.push({
      id: 'photo_ellie_joel',
      type: 'note',
      position: new THREE.Vector3(-22, 0.95, -12),
      mesh: photoMesh,
      title: 'Polaroid Desgastada',
      description: 'Una fotografía de Ellie adolescente con una guitarra junto a Joel.',
      noteData: {
        title: 'Fotografía en el Museo de Seattle',
        date: 'Inscripción al reverso',
        author: 'Ellie Williams',
        content: `Al reverso está escrito con la caligrafía de Ellie:

"Si tuviera una segunda oportunidad en este mundo... volvería a salvarte. Aunque el mundo entero ardiera.

JJ, si alguna vez lees esto: estoy en los laboratorios de Saint Mary's, en Salt Lake. Hay una última cosa que debo terminar."`,
      },
    });

    // 3. Grabación de Radio WLF
    const radioMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x2b382d, metalness: 0.6 })
    );
    radioMesh.position.set(2.5, 1.35, 6); // on military truck hood
    radioMesh.castShadow = true;
    this.scene.add(radioMesh);

    this.interactiveObjects.push({
      id: 'radio_log',
      type: 'note',
      position: new THREE.Vector3(2.5, 1.35, 6),
      mesh: radioMesh,
      title: 'Registro de Radio Militar WLF',
      description: 'Transmisión interceptada de una patrulla cerca del hospital.',
      noteData: {
        title: 'Frecuencia Táctica WLF 104.2 MHz',
        date: 'Hace 48 horas',
        author: 'Patrulla Norte',
        content: `[ESTÁTICA]... Centro, aquí Delta-2. Vimos a una intrusa solitaria atravesar el sector inundado hace dos noches. 

Llevaba una mochila desgastada y una guitarra acústica a la espalda. Creímos que era de Jackson o de los Serafitas, pero se movía como un fantasma entre los Chasqueadores. No disparó ni una sola bala. Despachó a tres infectados sólo con un machete.

Se dirige hacia las ruinas del complejo médico de Salt Lake. Tengan extrema precaución.`,
      },
    });

    // 4. Distraction Glass Bottles (pickup to throw!)
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0x3d6645, // green beer bottle
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    const bottleCoords = [
      { x: -1.5, z: 12 },
      { x: 3.8, z: -2 },
      { x: -10, z: -14 },
      { x: 1.2, z: -20 },
    ];

    bottleCoords.forEach((bc, idx) => {
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.24, 8), bottleMat);
      bMesh.position.set(bc.x, 0.12, bc.z);
      bMesh.rotation.z = Math.PI / 2; // lying on ground
      bMesh.castShadow = true;
      this.scene.add(bMesh);

      this.interactiveObjects.push({
        id: `bottle_${idx}`,
        type: 'bottle',
        position: new THREE.Vector3(bc.x, 0.12, bc.z),
        mesh: bMesh,
        title: 'Botella de Vidrio',
        description: 'Puede lanzarse para distraer a los Chasqueadores y Corredores hacia otra zona.',
      });
    });

    // 5. Lootable Toolboxes & Medical Supplies
    const toolBoxMat = new THREE.MeshStandardMaterial({ color: 0x8b3024, roughness: 0.6 });
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), toolBoxMat);
    box1.position.set(-23, 0.15, -8);
    box1.castShadow = true;
    this.scene.add(box1);

    this.interactiveObjects.push({
      id: 'loot_meds',
      type: 'loot',
      position: new THREE.Vector3(-23, 0.15, -8),
      mesh: box1,
      title: 'Botiquín de Emergencia Abandonado',
      description: 'Contiene vendas de tela y alcohol para curación.',
      lootItems: { rags: 2, alcohol: 2, blades: 1, scrap: 5 },
    });

    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), toolBoxMat);
    box2.position.set(-8, 0.8, -8); // truck trunk
    box2.castShadow = true;
    this.scene.add(box2);

    this.interactiveObjects.push({
      id: 'loot_truck',
      type: 'loot',
      position: new THREE.Vector3(-8, 0.8, -8),
      mesh: box2,
      title: 'Caja de Suministros del Vehículo',
      description: 'Piezas de metal, cinta aislante y cuchillas para fabricar.',
      lootItems: { blades: 2, tape: 2, scrap: 8 },
    });
  }
}
