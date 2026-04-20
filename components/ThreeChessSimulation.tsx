"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

type PieceGroup = THREE.Group & { userData: { rank: number; file: number; type: string; side: "w" | "b"; moved?: number } };

const CYAN = 0x5ff0e6;
const AMBER = 0xffb547;
const GREEN = 0x7dff9c;

function squareToPosition(rank: number, file: number) {
  return new THREE.Vector3(file - 3.5, 0, 3.5 - rank);
}

function makeLine(points: THREE.Vector3[], color: number, opacity = 0.75) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function makePiece(type: string, side: "w" | "b", rank: number, file: number): PieceGroup {
  const color = side === "w" ? CYAN : AMBER;
  const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.9 });
  const group = new THREE.Group() as PieceGroup;
  group.userData = { rank, file, type, side };

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.16, 24), mat.clone());
  base.position.y = 0.1;
  group.add(base);

  const height = { P: 0.45, R: 0.62, N: 0.78, B: 0.82, Q: 1.0, K: 1.1 }[type] ?? 0.55;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, height, 16), mat.clone());
  body.position.y = 0.22 + height / 2;
  group.add(body);

  const headGeo = type === "N" ? new THREE.BoxGeometry(0.36, 0.42, 0.24)
    : type === "B" ? new THREE.ConeGeometry(0.25, 0.45, 18)
      : type === "R" ? new THREE.BoxGeometry(0.42, 0.22, 0.42)
        : type === "Q" ? new THREE.OctahedronGeometry(0.28)
          : type === "K" ? new THREE.TetrahedronGeometry(0.32)
            : new THREE.SphereGeometry(0.22, 16, 10);
  const head = new THREE.Mesh(headGeo, mat.clone());
  head.position.y = height + 0.34;
  if (type === "N") head.rotation.y = side === "w" ? Math.PI : 0;
  group.add(head);

  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 0.43, 0, Math.PI * 2).getSpacedPoints(64).map(p => new THREE.Vector3(p.x, 0.035, p.y))),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  group.add(ring);

  group.position.copy(squareToPosition(rank, file));
  return group;
}

function makeBoard() {
  const board = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 0.28, 9.2),
    new THREE.MeshBasicMaterial({ color: 0x07131f, transparent: true, opacity: 0.65 })
  );
  base.position.y = -0.18;
  board.add(base);

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const dark = (rank + file) % 2 === 1;
      const square = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: dark ? CYAN : 0xe8ecf7, transparent: true, opacity: dark ? 0.14 : 0.035, side: THREE.DoubleSide })
      );
      square.rotation.x = -Math.PI / 2;
      square.position.copy(squareToPosition(rank, file));
      square.position.y = 0.005;
      board.add(square);
    }
  }

  for (let i = 0; i <= 8; i++) {
    const p = i - 4;
    board.add(makeLine([new THREE.Vector3(-4, 0.03, p), new THREE.Vector3(4, 0.03, p)], CYAN, 0.38));
    board.add(makeLine([new THREE.Vector3(p, 0.03, -4), new THREE.Vector3(p, 0.03, 4)], CYAN, 0.38));
  }
  board.add(makeLine([new THREE.Vector3(-4.45, 0.05, -4.45), new THREE.Vector3(4.45, 0.05, -4.45), new THREE.Vector3(4.45, 0.05, 4.45), new THREE.Vector3(-4.45, 0.05, 4.45), new THREE.Vector3(-4.45, 0.05, -4.45)], AMBER, 0.7));
  return board;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse(child => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(m => m.dispose());
    else material?.dispose?.();
  });
}

export function ThreeChessSimulation({ size = 560, className = "" }: { size?: number; className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.06);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 7.8, 9.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const board = makeBoard();
    scene.add(board);

    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);
    const pieces: PieceGroup[] = [];
    const setup = ["RNBQKBNR", "PPPPPPPP", "", "", "", "", "PPPPPPPP", "RNBQKBNR"];
    const resetPieces = () => {
      pieces.splice(0).forEach(p => { piecesGroup.remove(p); disposeObject(p); });
      setup.forEach((row, rank) => row.split("").forEach((type, file) => {
        const side = rank < 2 ? "b" : "w";
        const p = makePiece(type, side, rank, file);
        pieces.push(p);
        piecesGroup.add(p);
      }));
    };
    resetPieces();

    const spark = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0 })
    );
    spark.position.y = 0.08;
    board.add(spark);

    const moves = [
      { from: [6, 4], to: [4, 4] }, { from: [1, 4], to: [3, 4] },
      { from: [7, 6], to: [5, 5] }, { from: [1, 3], to: [3, 3] },
      { from: [4, 4], to: [3, 3], capture: true }, { from: [0, 3], to: [3, 3], capture: true },
    ];
    const timers: number[] = [];
    let moveIndex = 0;

    const playMove = () => {
      if (moveIndex >= moves.length) {
        timers.push(window.setTimeout(() => { moveIndex = 0; resetPieces(); playMove(); }, 1600));
        return;
      }
      const m = moves[moveIndex++];
      const actor = pieces.find(p => p.userData.rank === m.from[0] && p.userData.file === m.from[1]);
      if (!actor) { playMove(); return; }
      const target = pieces.find(p => p.userData.rank === m.to[0] && p.userData.file === m.to[1]);
      const from = squareToPosition(m.from[0], m.from[1]);
      const to = squareToPosition(m.to[0], m.to[1]);
      (spark.geometry as THREE.BufferGeometry).setFromPoints([from, new THREE.Vector3(to.x, 0.08, to.z)]);

      const tl = gsap.timeline({ onComplete: () => {
        actor.userData.rank = m.to[0];
        actor.userData.file = m.to[1];
        timers.push(window.setTimeout(playMove, 750));
      }});
      tl.to((spark.material as THREE.LineBasicMaterial), { opacity: 1, duration: 0.12 })
        .to((spark.material as THREE.LineBasicMaterial), { opacity: 0, duration: 0.45 }, "+=0.15")
        .to(actor.position, { x: to.x, z: to.z, duration: 0.72, ease: "power2.inOut" }, 0.15)
        .to(actor.position, { y: 1.35, duration: 0.36, yoyo: true, repeat: 1, ease: "power1.out" }, 0.15)
        .to(actor.rotation, { y: actor.rotation.y + Math.PI * 0.5, duration: 0.72, ease: "power2.inOut" }, 0.15);
      if (m.capture && target) {
        tl.to(target.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.3, ease: "back.in(2)", onComplete: () => {
          piecesGroup.remove(target);
          const idx = pieces.indexOf(target);
          if (idx >= 0) pieces.splice(idx, 1);
          disposeObject(target);
        }}, 0.34);
      }
    };
    timers.push(window.setTimeout(playMove, 900));

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(Array.from({ length: 780 }, () => (Math.random() - 0.5) * 34)), 3)),
      new THREE.PointsMaterial({ color: CYAN, transparent: true, opacity: 0.32, size: 0.035 })
    );
    scene.add(stars);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const t = performance.now() * 0.001;
      board.rotation.y = Math.sin(t * 0.32) * 0.045;
      stars.rotation.y += 0.0008;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      gsap.killTweensOf("*");
      observer.disconnect();
      mount.removeChild(renderer.domElement);
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ width: size, height: size * 0.82, maxWidth: "100%" }} aria-label="Live Three.js chess simulation" />;
}