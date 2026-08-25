"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ChevronDown, ChevronUp, Play, Pause, X, Compass, Globe } from "lucide-react";
import { Lensflare, LensflareElement } from "three/examples/jsm/objects/Lensflare.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
interface MoonData {
  name: string;
  size: number;
  dist: number;
  speed: number;
  color: number;
  info: string;
  initialAngle?: number;
}
interface CelestialBody {
  name: string;
  size: number;
  dist: number;
  speed: number;
  initialAngle?: number;
  texture?: string;
  color?: number;
  roughness: number;
  metalness: number;
  type: "planet" | "asteroid" | "dwarf";
  info: string;
  discoveryYear: string;
  hasRings?: boolean;
  moons: MoonData[];
}
interface PlanetMeshEntry {
  mesh: THREE.Mesh;
  pivot: THREE.Object3D;
  speed: number;
  moons: { mesh: THREE.Mesh; pivot: THREE.Object3D; speed: number }[];
  type: string;
  orbit: THREE.Mesh;
}
interface AsteroidEntry {
  mesh: THREE.Mesh;
  radius: number;
  angle: number;
  orbitSpeed: number;
  rotSpeed: number;
  type: string;
}
const celestialBodiesData: CelestialBody[] = [
  {
    name: "Mercury",
    size: 0.5,
    dist: 8,
    speed: 0.0041,
    initialAngle: 2.1,
    texture: "Mercury.jpg",
    roughness: 1,
    metalness: 0.02,
    type: "planet",
    info: "Closest Planet To The Sun. Surface Temperatures Range From -173°C To 427°C. Has No Atmosphere & No Moons",
    discoveryYear: "Ancient",
    moons: []
  },
  {
    name: "Venus",
    size: 0.9,
    dist: 11,
    speed: 0.0016,
    initialAngle: 4.8,
    texture: "Venus.jpg",
    roughness: 0.6,
    metalness: 0.05,
    type: "planet",
    info: "Hottest Planet In Our Solar System With Surface Temperatures Of 462°C. Has A Thick, Toxic Atmosphere",
    discoveryYear: "Ancient",
    moons: []
  },
  {
    name: "Earth",
    size: 1,
    dist: 15,
    speed: 0.001,
    initialAngle: 3.45,
    texture: "Earth.jpg",
    roughness: 0.5,
    metalness: 0.01,
    type: "planet",
    info: "The Only Known Planet With Life. 71% Of Surface Covered By Water. Has One Natural Satellite",
    discoveryYear: "Ancient",
    moons: [
      { name: "Moon", size: 0.27, dist: 2.5, speed: 0.037, color: 0x888888, info: "Earth's Only Natural Satellite. Formed 4.5 Billion Years Ago", initialAngle: 1.2 }
    ]
  },
  {
    name: "Mars",
    size: 0.8,
    dist: 19,
    speed: 0.00053,
    initialAngle: 0.9,
    texture: "Mars.jpg",
    roughness: 0.75,
    metalness: 0.02,
    type: "planet",
    info: "The Red Planet. Has The Largest Volcano (Olympus Mons) & Canyon (Valles Marineris) In The Solar System",
    discoveryYear: "Ancient",
    moons: [
      { name: "Phobos", size: 0.05, dist: 1.5, speed: 0.32, color: 0x664422, info: "Largest Moon Of Mars. Orbits Mars 3 Times Per Day", initialAngle: 0.5 },
      { name: "Deimos", size: 0.03, dist: 2.2, speed: 0.08, color: 0x664422, info: "Smaller Moon Of Mars. Takes 30 Hours To Orbit Mars", initialAngle: 2.1 }
    ]
  },
  {
    name: "Vesta",
    size: 0.15,
    dist: 20.5,
    speed: 0.00029,
    initialAngle: 5.2,
    color: 0xcccccc,
    roughness: 1.0,
    metalness: 0.1,
    type: "asteroid",
    info: "Second-Largest Asteroid. Has A Differentiated Interior With Basaltic Surface",
    discoveryYear: "1807",
    moons: []
  },
  {
    name: "Pallas",
    size: 0.12,
    dist: 21.2,
    speed: 0.00022,
    initialAngle: 1.8,
    color: 0xaaaaaa,
    roughness: 1.0,
    metalness: 0.05,
    type: "asteroid",
    info: "Third-Largest Asteroid. Highly Inclined Orbit. Possibly A Protoplanet",
    discoveryYear: "1802",
    moons: []
  },
  {
    name: "Jupiter",
    size: 2,
    dist: 25,
    speed: 0.000084,
    initialAngle: 2.7,
    texture: "Jupiter.jpg",
    roughness: 0.9,
    metalness: 0.0,
    type: "planet",
    info: "Largest Planet In Our Solar System. Great Red Spot Is A Storm Larger Than Earth. Has 95 Known Moons",
    discoveryYear: "Ancient",
    moons: [
      { name: "Io", size: 0.15, dist: 3.5, speed: 0.56, color: 0xffff99, info: "Most Volcanically Active Body In The Solar System", initialAngle: 0.8 },
      { name: "Europa", size: 0.13, dist: 4.2, speed: 0.28, color: 0x88ccee, info: "Ice-Covered Moon With Subsurface Ocean. Potential For Life", initialAngle: 1.5 },
      { name: "Ganymede", size: 0.22, dist: 5.1, speed: 0.14, color: 0x8c7d6b, info: "Largest Moon In The Solar System. Has Its Own Magnetic Field", initialAngle: 3.2 },
      { name: "Callisto", size: 0.20, dist: 6.0, speed: 0.06, color: 0x696969, info: "Most Heavily Cratered Body In The Solar System", initialAngle: 4.9 }
    ]
  },
  {
    name: "Saturn",
    size: 1.7,
    dist: 31,
    speed: 0.000034,
    initialAngle: 5.8,
    texture: "Saturn.jpg",
    hasRings: true,
    roughness: 0.9,
    metalness: 0.0,
    type: "planet",
    info: "Famous For Its Prominent Ring System. Less Dense Than Water. Has 146 Known Moons",
    discoveryYear: "Ancient",
    moons: [
      { name: "Mimas", size: 0.06, dist: 2.8, speed: 1.05, color: 0xb3b3b3, info: "Death Star-Like Appearance With Giant Herschel Crater", initialAngle: 0.9 },
      { name: "Enceladus", size: 0.08, dist: 3.2, speed: 0.73, color: 0xf0f8ff, info: "Ice Geysers From South Pole. Subsurface Ocean", initialAngle: 4.1 },
      { name: "Titan", size: 0.21, dist: 5.5, speed: 0.063, color: 0xffa500, info: "Has Thick Atmosphere & Liquid Methane Lakes", initialAngle: 2.3 }
    ]
  },
  {
    name: "Uranus",
    size: 1.2,
    dist: 37,
    speed: 0.000012,
    initialAngle: 1.2,
    texture: "Uranus.jpg",
    roughness: 0.85,
    metalness: 0.0,
    type: "planet",
    info: "Ice Giant Tilted On Its Side (98° Axial Tilt). Has Faint Rings & 28 Known Moons",
    discoveryYear: "1781",
    moons: [
      { name: "Ariel", size: 0.08, dist: 2.2, speed: 0.39, color: 0x9999a6, info: "Youngest Surface Among Uranian Moons", initialAngle: 2.1 },
      { name: "Titania", size: 0.11, dist: 3.0, speed: 0.12, color: 0x8c8c99, info: "Largest Moon Of Uranus With Deep Canyons", initialAngle: 1.7 }
    ]
  },
  {
    name: "Neptune",
    size: 1.1,
    dist: 42,
    speed: 0.0000061,
    initialAngle: 6.1,
    texture: "Neptune.jpg",
    roughness: 0.85,
    metalness: 0.0,
    type: "planet",
    info: "Windiest Planet With Speeds Up To 2,100 Km/h. Deep Blue Color From Methane In Atmosphere",
    discoveryYear: "1846",
    moons: [
      { name: "Triton", size: 0.11, dist: 3.0, speed: 0.17, color: 0x87ceeb, info: "Largest Moon Of Neptune. Orbits Retrograde", initialAngle: 0.9 }
    ]
  },
  {
    name: "Ceres",
    size: 0.3,
    dist: 22,
    speed: 0.00022,
    color: 0x999999,
    roughness: 1.0,
    metalness: 0.0,
    type: "dwarf",
    info: "Largest Object In Asteroid Belt. Has Water Ice & Possible Subsurface Ocean",
    discoveryYear: "1801",
    moons: []
  },
  {
    name: "Pluto",
    size: 0.4,
    dist: 48,
    speed: 0.000004,
    initialAngle: 5.3,
    color: 0xd1b68c,
    roughness: 1.0,
    metalness: 0.0,
    type: "dwarf",
    info: "Former Ninth Planet. Has Heart-Shaped Nitrogen Plains. Binary System With Charon",
    discoveryYear: "1930",
    moons: [
      { name: "Charon", size: 0.2, dist: 1.8, speed: 0.16, color: 0x808080, info: "Largest Moon Relative To Its Parent Planet", initialAngle: 1.8 }
    ]
  },
  {
    name: "Eris",
    size: 0.35,
    dist: 52,
    speed: 0.0000018,
    initialAngle: 2.7,
    color: 0xe6e6fa,
    roughness: 1.0,
    metalness: 0.0,
    type: "dwarf",
    info: "Most Massive Dwarf Planet. Discovery Led To Pluto's Reclassification",
    discoveryYear: "2005",
    moons: []
  },
  {
    name: "Makemake",
    size: 0.25,
    dist: 50,
    speed: 0.0000032,
    initialAngle: 1.9,
    color: 0x8c4511,
    roughness: 1.0,
    metalness: 0.0,
    type: "dwarf",
    info: "Third-Largest Dwarf Planet. Reddish Surface Likely Due To Organic Compounds",
    discoveryYear: "2005",
    moons: []
  },
  {
    name: "Haumea",
    size: 0.28,
    dist: 51,
    speed: 0.0000035,
    initialAngle: 4.2,
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.1,
    type: "dwarf",
    info: "Elongated Dwarf Planet That Spins Every 4 Hours. Has Ring System",
    discoveryYear: "2004",
    moons: []
  }
];
export default function SolarSystemViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0.4);
  const [bloomStrength, setBloomStrength] = useState<number>(0.5);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showMoons, setShowMoons] = useState<boolean>(true);
  const [showAsteroids, setShowAsteroids] = useState<boolean>(true);
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);
  const [followingTargetName, setFollowingTargetName] = useState<string | null>(null);
  const sceneStateRef = useRef<{
    speed: number;
    isPaused: boolean;
    showOrbits: boolean;
    showMoons: boolean;
    showAsteroids: boolean;
    followingObject: PlanetMeshEntry | THREE.Mesh | null;
    followingType: "planet" | "sun" | null;
    planetMeshes: PlanetMeshEntry[];
    asteroidBelts: AsteroidEntry[];
    sunMesh: THREE.Mesh | null;
    bloomPass: UnrealBloomPass | null;
    controls: OrbitControls | null;
    camera: THREE.PerspectiveCamera | null;
  }>({
    speed: 0.4,
    isPaused: false,
    showOrbits: true,
    showMoons: true,
    showAsteroids: true,
    followingObject: null,
    followingType: null,
    planetMeshes: [],
    asteroidBelts: [],
    sunMesh: null,
    bloomPass: null,
    controls: null,
    camera: null
  });
  useEffect(() => {
    sceneStateRef.current.speed = speed;
    sceneStateRef.current.isPaused = isPaused;
    sceneStateRef.current.showOrbits = showOrbits;
    sceneStateRef.current.showMoons = showMoons;
    sceneStateRef.current.showAsteroids = showAsteroids;
    if (sceneStateRef.current.bloomPass) {
      sceneStateRef.current.bloomPass.strength = bloomStrength;
    }
  }, [speed, isPaused, showOrbits, showMoons, showAsteroids, bloomStrength]);
  const followBodyByName = (name: string) => {
    if (name === "Sun") {
      const sun = sceneStateRef.current.sunMesh;
      const camera = sceneStateRef.current.camera;
      const controls = sceneStateRef.current.controls;
      if (sun && camera && controls) {
        sceneStateRef.current.followingObject = sun;
        sceneStateRef.current.followingType = "sun";
        setFollowingTargetName("Sun");
        camera.position.set(25, 12, 25);
        controls.target.set(0, 0, 0);
      }
      return;
    }
    const foundIndex = celestialBodiesData.findIndex((b) => b.name === name);
    if (foundIndex !== -1) {
      const planetObj = sceneStateRef.current.planetMeshes[foundIndex];
      const body = celestialBodiesData[foundIndex];
      const camera = sceneStateRef.current.camera;
      const controls = sceneStateRef.current.controls;
      if (planetObj && camera && controls) {
        sceneStateRef.current.followingObject = planetObj;
        sceneStateRef.current.followingType = "planet";
        setFollowingTargetName(name);
        const distance = Math.max(body.size * 8, 12);
        const worldPos = new THREE.Vector3();
        planetObj.mesh.getWorldPosition(worldPos);
        camera.position.copy(worldPos.clone().add(new THREE.Vector3(distance, distance * 0.5, distance)));
        controls.target.copy(worldPos);
      }
    }
  };
  const stopFollowing = () => {
    sceneStateRef.current.followingObject = null;
    sceneStateRef.current.followingType = null;
    setFollowingTargetName(null);
    const camera = sceneStateRef.current.camera;
    const controls = sceneStateRef.current.controls;
    if (camera && controls) {
      camera.position.set(0, 30, 70);
      controls.target.set(0, 0, 0);
      controls.reset();
    }
  };
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    scene.fog = new THREE.Fog(0x000814, 180, 260);
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 30, 70);
    sceneStateRef.current.camera = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.4;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.5;
    controls.minDistance = 6;
    controls.maxDistance = 300;
    sceneStateRef.current.controls = controls;
    const textureLoader = new THREE.TextureLoader();
    const ambientLight = new THREE.AmbientLight(0x222222, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 8.0, 1000, 0.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    const fillLight = new THREE.PointLight(0x3366cc, 1.5, 120, 1);
    fillLight.position.set(50, 50, -100);
    scene.add(fillLight);
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load("/Sun.jpg"),
      color: new THREE.Color(1.2, 1.1, 0.9)
    });
    const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    sceneStateRef.current.sunMesh = sun;
    const textureFlare0 = textureLoader.load("/Lensflare.png");
    const textureFlare2 = textureLoader.load("/_Lensflare.png");
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 480, 0, new THREE.Color(1, 0.9, 0.8)));
    lensflare.addElement(new LensflareElement(textureFlare2, 110, 0.2, new THREE.Color(1, 1, 0.6)));
    lensflare.addElement(new LensflareElement(textureFlare2, 60, 0.4, new THREE.Color(0.8, 0.8, 1)));
    sun.add(lensflare);
    const planetMeshes: PlanetMeshEntry[] = [];
    celestialBodiesData.forEach((body) => {
      let material: THREE.Material;
      if (body.texture) {
        material = new THREE.MeshStandardMaterial({
          map: textureLoader.load(`/${body.texture}`),
          metalness: body.metalness || 0.05,
          roughness: body.roughness || 1
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: body.color,
          metalness: body.metalness || 0.05,
          roughness: body.roughness || 1
        });
      }
      const geo = new THREE.SphereGeometry(body.size, 48, 48);
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const pivot = new THREE.Object3D();
      pivot.add(mesh);
      mesh.position.x = body.dist;
      if (body.initialAngle !== undefined) {
        pivot.rotation.y = body.initialAngle;
      }
      scene.add(pivot);
      const orbitGeo = new THREE.RingGeometry(body.dist - 0.05, body.dist + 0.05, 96);
      const orbitMat = new THREE.MeshBasicMaterial({
        color: body.type === "dwarf" ? 0xcc9900 : (body.type === "asteroid" ? 0x995522 : 0x5588cc),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15
      });
      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);
      if (body.hasRings) {
        const ringTex = textureLoader.load("/SaturnRing.png");
        const ringGeo = new THREE.RingGeometry(body.size + 0.4, body.size + 1.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }
      const moons: { mesh: THREE.Mesh; pivot: THREE.Object3D; speed: number }[] = [];
      if (body.moons && body.moons.length > 0) {
        body.moons.forEach((moonData) => {
          const moonGeo = new THREE.SphereGeometry(moonData.size, 24, 24);
          const moonMat = new THREE.MeshStandardMaterial({
            color: moonData.color,
            roughness: 0.9,
            metalness: 0.1
          });
          const moonMesh = new THREE.Mesh(moonGeo, moonMat);
          const moonPivot = new THREE.Object3D();
          moonPivot.add(moonMesh);
          moonMesh.position.x = moonData.dist;
          if (moonData.initialAngle !== undefined) {
            moonPivot.rotation.y = moonData.initialAngle;
          }
          mesh.add(moonPivot);
          moons.push({
            mesh: moonMesh,
            pivot: moonPivot,
            speed: moonData.speed
          });
        });
      }
      planetMeshes.push({
        mesh,
        pivot,
        speed: body.speed,
        moons,
        type: body.type,
        orbit
      });
    });
    sceneStateRef.current.planetMeshes = planetMeshes;
    const asteroidBelts: AsteroidEntry[] = [];
    const createBelt = (count: number, innerR: number, outerR: number, beltType: string) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const radius = innerR + Math.random() * (outerR - innerR);
        const size = 0.015 + Math.random() * 0.05;
        const geo = new THREE.SphereGeometry(size, 6, 6);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x887766,
          roughness: 1.0,
          metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.z = Math.sin(angle) * radius;
        mesh.position.y = (Math.random() - 0.5) * 1.5;
        scene.add(mesh);
        asteroidBelts.push({
          mesh,
          radius,
          angle,
          orbitSpeed: 0.002 + Math.random() * 0.001,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          type: beltType
        });
      }
    };
    createBelt(150, 19.5, 23.5, "mainBelt");
    createBelt(80, 48, 65, "kuiperBelt");
    sceneStateRef.current.asteroidBelts = asteroidBelts;
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 160 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.85 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.6, 0.05);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    sceneStateRef.current.bloomPass = bloomPass;
    const lastPlanetPos = new THREE.Vector3();
    let animationFrameId: number;
    const animateLoop = () => {
      animationFrameId = requestAnimationFrame(animateLoop);
      const state = sceneStateRef.current;
      if (!state.isPaused) {
        const mult = state.speed;
        sun.rotation.y += 0.002 * mult;
        stars.rotation.y += 0.0001 * mult;
        planetMeshes.forEach((p) => {
          p.pivot.rotation.y += p.speed * mult;
          p.mesh.rotation.y += 0.01 * mult;
          if (p.orbit) {
            p.orbit.visible = state.showOrbits;
          }
          if (p.moons) {
            p.moons.forEach((m) => {
              m.pivot.rotation.y += m.speed * 0.1 * mult;
              m.mesh.rotation.y += 0.02 * mult;
              m.mesh.visible = state.showMoons;
            });
          }
        });
        asteroidBelts.forEach((a) => {
          a.mesh.visible = state.showAsteroids;
          if (state.showAsteroids) {
            a.angle += a.orbitSpeed * mult;
            a.mesh.position.x = Math.cos(a.angle) * a.radius;
            a.mesh.position.z = Math.sin(a.angle) * a.radius;
            a.mesh.rotation.y += a.rotSpeed * mult;
          }
        });
      }
      controls.update();
      if (state.followingObject) {
        const targetWorldPos = new THREE.Vector3();
        if (state.followingType === "sun") {
          sun.getWorldPosition(targetWorldPos);
          controls.target.copy(targetWorldPos);
        } else if (state.followingType === "planet" && (state.followingObject as PlanetMeshEntry).mesh) {
          (state.followingObject as PlanetMeshEntry).mesh.getWorldPosition(targetWorldPos);
          const movement = targetWorldPos.clone().sub(lastPlanetPos);
          if (!lastPlanetPos.equals(new THREE.Vector3(0, 0, 0))) {
            camera.position.add(movement);
            controls.target.add(movement);
          }
          lastPlanetPos.copy(targetWorldPos);
        }
      } else {
        lastPlanetPos.set(0, 0, 0);
      }
      composer.render();
    };
    animateLoop();
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      composer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleCanvasClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".controlsPanel") || target?.closest(".healthDashboardCard") || target?.closest(".planetDetailModal")) {
        return;
      }
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const planetMeshesList = planetMeshes.map((p) => p.mesh);
      const intersects = raycaster.intersectObjects([sun, ...planetMeshesList]);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === sun) {
          followBodyByName("Sun");
        } else {
          const index = planetMeshesList.indexOf(hit as THREE.Mesh);
          if (index !== -1) {
            setSelectedBody(celestialBodiesData[index]);
            followBodyByName(celestialBodiesData[index].name);
          }
        }
      }
    };
    window.addEventListener("click", handleCanvasClick);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleCanvasClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  const groupedPlanets = {
    planets: celestialBodiesData.filter((b) => b.type === "planet"),
    dwarfs: celestialBodiesData.filter((b) => b.type === "dwarf"),
    asteroids: celestialBodiesData.filter((b) => b.type === "asteroid")
  };
  return (
    <div className="appContainer">
      <div ref={mountRef} className="threeCanvasContainer" />
      <div className={`controlsPanel ${isControlsCollapsed ? "collapsed" : ""}`}>
        <div className="controlsHeader" onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}>
          <h2>
            <Globe size={16} color="var(--accentPrimary)" />
            <span>Solar Explorer</span>
          </h2>
          <span className="toggleIcon">{isControlsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
        </div>
        {!isControlsCollapsed && (
          <div className="controlsBody">
            <div className="controlGroup">
              <label>
                <span>Simulation Speed</span>
                <span>{speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="sliderInput"
              />
            </div>
            <div className="controlGroup">
              <label>
                <span>Atmospheric Glow</span>
                <span>{bloomStrength.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={bloomStrength}
                onChange={(e) => setBloomStrength(parseFloat(e.target.value))}
                className="sliderInput"
              />
            </div>
            <div className="buttonRow">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`actionBtn ${isPaused ? "active" : ""}`}
              >
                {isPaused ? <Play size={12} style={{ display: "inline", marginRight: "4px" }} /> : <Pause size={12} style={{ display: "inline", marginRight: "4px" }} />}
                <span>{isPaused ? "Resume Orbit" : "Pause Orbit"}</span>
              </button>
              <button
                onClick={() => setShowOrbits(!showOrbits)}
                className={`actionBtn ${showOrbits ? "active" : ""}`}
              >
                <span>{showOrbits ? "Hide Orbits" : "Show Orbits"}</span>
              </button>
            </div>
            <div className="buttonRow">
              <button
                onClick={() => setShowMoons(!showMoons)}
                className={`actionBtn ${showMoons ? "active" : ""}`}
              >
                <span>{showMoons ? "Hide Moons" : "Show Moons"}</span>
              </button>
              <button
                onClick={() => setShowAsteroids(!showAsteroids)}
                className={`actionBtn ${showAsteroids ? "active" : ""}`}
              >
                <span>{showAsteroids ? "Hide Belts" : "Show Belts"}</span>
              </button>
            </div>
            <div className="buttonRow">
              <button
                onClick={() => followBodyByName("Sun")}
                className={`actionBtn ${followingTargetName === "Sun" ? "active" : ""}`}
              >
                <span>Follow Sun</span>
              </button>
              {followingTargetName && (
                <button onClick={stopFollowing} className="actionBtn danger">
                  <span>Reset Camera</span>
                </button>
              )}
            </div>
            <div className="categoryDivider">Celestial Worlds</div>
            {groupedPlanets.planets.map((body) => (
              <div
                key={body.name}
                className={`planetListItem ${followingTargetName === body.name ? "selected" : ""}`}
                onClick={() => {
                  setSelectedBody(body);
                  followBodyByName(body.name);
                }}
              >
                <div className="planetListItemHeader">
                  <span className="planetListItemTitle">{body.name}</span>
                  <span className="planetListItemBadge">Planet</span>
                </div>
                <span className="planetListItemSub">Distance: {body.dist} AU | Moons: {body.moons?.length || 0}</span>
              </div>
            ))}
            <div className="categoryDivider">Dwarf Planets</div>
            {groupedPlanets.dwarfs.map((body) => (
              <div
                key={body.name}
                className={`planetListItem ${followingTargetName === body.name ? "selected" : ""}`}
                onClick={() => {
                  setSelectedBody(body);
                  followBodyByName(body.name);
                }}
              >
                <div className="planetListItemHeader">
                  <span className="planetListItemTitle">{body.name}</span>
                  <span className="planetListItemBadge">Dwarf</span>
                </div>
                <span className="planetListItemSub">Distance: {body.dist} AU</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedBody && (
        <div className="planetDetailModal">
          <div className="modalHeader">
            <div className="modalTitle">
              <Compass size={20} color="var(--accentPrimary)" />
              <span>{selectedBody.name}</span>
            </div>
            <button onClick={() => setSelectedBody(null)} className="modalCloseBtn">
              <X size={16} />
            </button>
          </div>
          <div className="modalContent">
            <div className="modalGrid">
              <div className="gridCard">
                <div className="gridCardLabel">Distance From Sun</div>
                <div className="gridCardValue">{selectedBody.dist} AU</div>
              </div>
              <div className="gridCard">
                <div className="gridCardLabel">Relative Size</div>
                <div className="gridCardValue">{selectedBody.size}x Earth</div>
              </div>
              <div className="gridCard">
                <div className="gridCardLabel">Orbital Speed</div>
                <div className="gridCardValue">{(selectedBody.speed * 1000).toFixed(2)} Index</div>
              </div>
              <div className="gridCard">
                <div className="gridCardLabel">Discovery Era</div>
                <div className="gridCardValue">{selectedBody.discoveryYear}</div>
              </div>
            </div>
            <div className="descriptionCard">{selectedBody.info}</div>
            {selectedBody.moons && selectedBody.moons.length > 0 && (
              <div className="moonsContainer">
                <div className="gridCardLabel">Known Moons ({selectedBody.moons.length})</div>
                {selectedBody.moons.map((moon) => (
                  <div key={moon.name} className="moonCard">
                    <div>
                      <div className="moonCardName">{moon.name}</div>
                      <div className="moonCardDetails">{moon.info}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="buttonRow">
              <button
                onClick={() => {
                  if (followingTargetName === selectedBody.name) {
                    stopFollowing();
                  } else {
                    followBodyByName(selectedBody.name);
                  }
                }}
                className={`actionBtn ${followingTargetName === selectedBody.name ? "active" : ""}`}
              >
                <span>{followingTargetName === selectedBody.name ? "Stop Following" : "Follow Orbit"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}