import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const THEME_KEY = 'site_theme';
const SCENE_PALETTES = {
  dark: {
    main: 0x656565,
    accent: 0xc0ff6b,
    dark: 0x000000,
    edge: 0xffffff,
    glass: 0xd5d5d5,
  },
  light: {
    main: 0x656565,
    accent: 0x5378e8,
    dark: 0x1c2733,
    edge: 0x5378e8,
    glass: 0xd5d5d5,
  },
};

function getScenePalette() {
  const theme = document.body.dataset.theme || localStorage.getItem(THEME_KEY);
  return theme === 'light' ? SCENE_PALETTES.light : SCENE_PALETTES.dark;
}

function createBox(width, height, depth, material, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(position.x, position.y, position.z);
  return mesh;
}

function addEdges(mesh, color = 0xffffff, opacity = 0.36) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  mesh.add(edges);
  return edges;
}

export default function AuthScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.1, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const palette = getScenePalette();

    const mainMaterial = new THREE.MeshStandardMaterial({
      color: palette.main,
      metalness: 0.12,
      roughness: 0.38,
    });
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: palette.accent,
      metalness: 0.08,
      roughness: 0.32,
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: palette.dark,
      metalness: 0.18,
      roughness: 0.42,
    });
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: palette.glass,
      metalness: 0.05,
      roughness: 0.45,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: palette.glass,
      transparent: true,
      opacity: 0.72,
      metalness: 0,
      roughness: 0.08,
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.65));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(palette.accent, 1.4);
    rimLight.position.set(4, 2, -2);
    scene.add(rimLight);

    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    const truckGroup = new THREE.Group();
    sceneGroup.add(truckGroup);

    const cargo = createBox(2.35, 1.18, 1, mainMaterial, { x: -0.58, y: 0, z: 0 });
    addEdges(cargo);
    truckGroup.add(cargo);

    const cargoDoor = createBox(0.06, 0.82, 1.03, lightMaterial, { x: 0.22, y: 0.03, z: 0.02 });
    truckGroup.add(cargoDoor);

    const cab = createBox(0.92, 0.92, 1, lightMaterial, { x: 1.18, y: -0.13, z: 0 });
    addEdges(cab);
    truckGroup.add(cab);

    const windshield = createBox(0.46, 0.34, 1.04, glassMaterial, { x: 1.4, y: 0.08, z: 0.02 });
    truckGroup.add(windshield);

    const bumper = createBox(0.26, 0.18, 1.04, darkMaterial, { x: 1.78, y: -0.45, z: 0.02 });
    truckGroup.add(bumper);

    const wheelGeometry = new THREE.TorusGeometry(0.28, 0.075, 18, 48);
    const hubGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 28);
    const wheels = [
      { x: -1.25, y: -0.68 },
      { x: 1.1, y: -0.68 },
    ].map((position) => {
      const wheel = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeometry, darkMaterial);
      const hub = new THREE.Mesh(hubGeometry, whiteMaterial);
      hub.rotation.x = Math.PI / 2;
      wheel.add(tire, hub);
      wheel.position.set(position.x, position.y, 0.55);
      truckGroup.add(wheel);
      return wheel;
    });

    const parcelGroup = new THREE.Group();
    sceneGroup.add(parcelGroup);

    [
      { x: -2.45, y: 0.78, z: -0.1, s: 0.42, material: whiteMaterial },
      { x: -2.9, y: 0.2, z: 0.18, s: 0.34, material: lightMaterial },
      { x: 2.15, y: 0.92, z: -0.25, s: 0.36, material: whiteMaterial },
      { x: 2.55, y: 0.36, z: 0.14, s: 0.28, material: mainMaterial },
    ].forEach((parcel, index) => {
      const box = createBox(parcel.s, parcel.s, parcel.s, parcel.material, parcel);
      box.rotation.set(0.25, 0.35 + index * 0.25, 0.18);
      addEdges(box, index % 2 === 0 ? palette.main : palette.edge, 0.54);
      parcelGroup.add(box);
    });

    const routeMaterial = new THREE.LineBasicMaterial({
      color: palette.accent,
      transparent: true,
      opacity: 0.55,
    });
    const route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.2, -1.05, -0.1),
        new THREE.Vector3(-1.5, -1.28, -0.15),
        new THREE.Vector3(0.45, -1.08, -0.1),
        new THREE.Vector3(2.9, -1.25, -0.16),
      ]),
      routeMaterial
    );
    sceneGroup.add(route);

    const dotGeometry = new THREE.SphereGeometry(0.055, 16, 16);
    const routeDots = [-2.6, -1.35, -0.15, 1.15, 2.35].map((x) => {
      const dot = new THREE.Mesh(dotGeometry, lightMaterial);
      dot.position.set(x, -1.18 + Math.sin(x) * 0.08, -0.05);
      sceneGroup.add(dot);
      return dot;
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.012, 10, 96),
      new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.22 })
    );
    halo.position.set(0.15, -0.08, -0.5);
    halo.scale.set(1.25, 0.55, 1);
    sceneGroup.add(halo);

    const clock = new THREE.Clock();
    let frameId = 0;

    function resize() {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      const isCompact = width < 780;
      camera.position.z = isCompact ? 9.2 : 8.7;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      sceneGroup.scale.setScalar(isCompact ? 0.46 : 0.98);
      sceneGroup.position.set(isCompact ? 0.08 : 0.88, isCompact ? -0.12 : 0.34, 0);
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      truckGroup.rotation.y = Math.sin(elapsed * 0.55) * 0.12 - 0.08;
      truckGroup.position.y = Math.sin(elapsed * 1.8) * 0.035;
      parcelGroup.rotation.y = elapsed * 0.18;
      parcelGroup.children.forEach((parcel, index) => {
        parcel.position.y += Math.sin(elapsed * 1.4 + index) * 0.0018;
        parcel.rotation.x += 0.003 + index * 0.0008;
        parcel.rotation.y += 0.004;
      });
      wheels.forEach((wheel) => {
        wheel.rotation.z = -elapsed * 2.6;
      });
      routeDots.forEach((dot, index) => {
        dot.scale.setScalar(1 + Math.sin(elapsed * 2.2 + index) * 0.18);
      });
      halo.rotation.z = Math.sin(elapsed * 0.5) * 0.08;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      wheelGeometry.dispose();
      hubGeometry.dispose();
      dotGeometry.dispose();
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="auth-scene" ref={mountRef} aria-hidden="true" />;
}
