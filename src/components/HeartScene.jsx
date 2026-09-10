import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, Line, OrbitControls, useGLTF } from '@react-three/drei';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import * as THREE from 'three';

export const PARTS = {
  rightAtrium: { name: 'Right atrium', short: 'RA', color: '#3d77d9', position: [-0.52, 0.55, 0], scale: [0.48, 0.54, 0.42], role: 'Receives oxygen-poor blood from the body through the venae cavae.' },
  rightVentricle: { name: 'Right ventricle', short: 'RV', color: '#3975c5', position: [-0.43, -0.32, 0.08], scale: [0.56, 0.76, 0.5], role: 'Pumps oxygen-poor blood to the lungs through the pulmonary artery.' },
  leftAtrium: { name: 'Left atrium', short: 'LA', color: '#d95662', position: [0.46, 0.5, -0.05], scale: [0.43, 0.48, 0.38], role: 'Receives oxygen-rich blood from the lungs through the pulmonary veins.' },
  leftVentricle: { name: 'Left ventricle', short: 'LV', color: '#d93d4c', position: [0.4, -0.35, 0], scale: [0.58, 0.82, 0.55], role: 'The strongest chamber; pumps oxygen-rich blood to the entire body.' },
};

export const VESSELS = [
  { id: 'aorta', name: 'Aorta', color: '#ff5261', info: 'Carries oxygen-rich blood from the left ventricle to the body.', points: [[0.42,-0.34,0],[0.65,0.2,0],[0.55,1.0,0],[0.05,1.38,0],[-0.35,1.18,0]], radius: .12 },
  { id: 'pulmonaryArtery', name: 'Pulmonary artery', color: '#4c8cff', info: 'Carries oxygen-poor blood from the right ventricle to both lungs.', points: [[-.42,-.28,.04],[-.32,.25,.1],[-.05,.72,.25],[-.75,1.0,.32]], radius: .1 },
  { id: 'superiorVenaCava', name: 'Superior vena cava', color: '#4c8cff', info: 'Returns oxygen-poor blood from the upper body.', points: [[-.55,.55,0],[-.7,.95,0],[-.7,1.45,0]], radius: .11 },
  { id: 'inferiorVenaCava', name: 'Inferior vena cava', color: '#4c8cff', info: 'Returns oxygen-poor blood from the lower body.', points: [[-.55,.48,0],[-.78,-.1,0],[-.75,-1.25,0]], radius: .11 },
  { id: 'pulmonaryVeins', name: 'Pulmonary veins', color: '#ff5261', info: 'Return oxygen-rich blood from the lungs to the left atrium.', points: [[1.15,.65,-.1],[.75,.58,-.08],[.46,.48,-.05]], radius: .08 },
];

export const INTERNAL_STRUCTURES = {
  tricuspidValve: { id: 'tricuspidValve', name: 'Tricuspid valve', type: 'valve', color: '#f5b0a7', position: [-.47,.08,.52], info: 'A three-leaflet valve that prevents blood flowing backward from the right ventricle into the right atrium.' },
  mitralValve: { id: 'mitralValve', name: 'Mitral valve', type: 'valve', color: '#f5b0a7', position: [.43,.08,.52], info: 'A two-leaflet valve that prevents blood returning from the left ventricle to the left atrium.' },
  pulmonaryValve: { id: 'pulmonaryValve', name: 'Pulmonary valve', type: 'valve', color: '#8abfff', position: [-.16,.43,.55], info: 'Opens as the right ventricle pumps blood into the pulmonary artery and closes to prevent backflow.' },
  aorticValve: { id: 'aorticValve', name: 'Aortic valve', type: 'valve', color: '#ff9b9b', position: [.22,.43,.55], info: 'Controls oxygen-rich blood leaving the left ventricle through the aorta and prevents backward flow.' },
  septum: { id: 'septum', name: 'Interventricular septum', type: 'wall', color: '#e79791', position: [0,-.45,.48], info: 'A thick muscular wall separating the left and right ventricles so oxygen-rich and oxygen-poor blood do not mix.' },
};

export const EXTERIOR_STRUCTURES = [
  { id: 'heartApex', name: 'Apex of heart', type: 'exterior', color: '#e35a63', position: [.12,-1.42,.55], labelPosition: [.78,-1.48,.72], info: 'The pointed lower tip of the heart, formed mainly by the left ventricle and directed down and to the left.' },
  { id: 'ascendingAorta', name: 'Ascending aorta', type: 'exterior', color: '#ff6570', position: [.28,1.1,.3], labelPosition: [.92,1.38,.55], info: 'The first section of the aorta, carrying oxygen-rich blood upward from the left ventricle.' },
  { id: 'pulmonaryTrunk', name: 'Pulmonary trunk', type: 'exterior', color: '#548cff', position: [-.18,.88,.45], labelPosition: [-.92,1.2,.68], info: 'Carries oxygen-poor blood from the right ventricle before dividing into the left and right pulmonary arteries.' },
  { id: 'superiorVenaCavaExterior', name: 'Superior vena cava', type: 'exterior', color: '#4f87e8', position: [-.62,1.12,.12], labelPosition: [-1.18,1.52,.4], info: 'The large vein returning oxygen-poor blood from the head, neck, arms, and upper body to the right atrium.' },
  { id: 'rightAuricle', name: 'Right auricle', type: 'exterior', color: '#c74b58', position: [-.55,.55,.5], labelPosition: [-1.2,.55,.72], info: 'A small muscular pouch of the right atrium that increases its capacity.' },
  { id: 'leftAuricle', name: 'Left auricle', type: 'exterior', color: '#d85b64', position: [.5,.62,.5], labelPosition: [1.12,.72,.72], info: 'A small ear-shaped extension of the left atrium that contributes to atrial filling.' },
  { id: 'rightVentricularSurface', name: 'Right ventricle', type: 'exterior', color: '#d04c57', position: [-.38,-.35,.62], labelPosition: [-1.08,-.42,.82], info: 'Forms most of the front surface of the heart and pumps oxygen-poor blood toward the lungs.' },
  { id: 'leftVentricularSurface', name: 'Left ventricle', type: 'exterior', color: '#e13f4d', position: [.38,-.5,.62], labelPosition: [1.08,-.55,.82], info: 'Forms the left border and apex of the heart and pumps oxygen-rich blood into the aorta.' },
  { id: 'coronaryArteries', name: 'Coronary arteries', type: 'exterior', color: '#ff6a70', position: [.05,-.18,.72], labelPosition: [.9,.05,.92], info: 'Surface arteries that supply oxygen-rich blood directly to the heart muscle.' },
];

function XRButton() {
  const { gl } = useThree();
  useEffect(() => {
    gl.xr.enabled = true;
    const button = VRButton.createButton(gl);
    button.classList.add('xr-entry');
    document.body.appendChild(button);
    return () => button.remove();
  }, [gl]);
  return null;
}

function AnatomicalExterior({ cutaway }) {
  const { scene } = useGLTF('/models/heart/scene.gltf');
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if (!child.isMesh) return;
      const source = child.material;
      child.material = new THREE.MeshPhysicalMaterial({
        map: source.map,
        normalMap: source.normalMap,
        roughnessMap: source.roughnessMap,
        color: source.color,
        roughness: .28,
        metalness: 0,
        clearcoat: .72,
        clearcoatRoughness: .18,
        sheen: .5,
        sheenColor: new THREE.Color('#5b1119'),
        sheenRoughness: .48,
        envMapIntensity: 2.1,
        transparent: true,
        depthWrite: !cutaway,
      });
      child.material.normalScale.set(1.35, 1.35);
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return copy;
  }, [scene]);
  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.material.opacity = cutaway ? .2 : 1;
      child.material.depthWrite = !cutaway;
      child.material.side = cutaway ? THREE.DoubleSide : THREE.FrontSide;
      child.renderOrder = cutaway ? 2 : 0;
    });
  }, [model, cutaway]);
  return <primitive object={model} scale={1.8} position={[0, -.05, 0]} rotation={[0, Math.PI, 0]} />;
}

function Chamber({ id, selected, showLabel, cutaway, onSelect }) {
  const data = PARTS[id];
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const beat = 1 + Math.pow(Math.max(0, Math.sin(clock.elapsedTime * 4.2)), 8) * .06;
    ref.current.scale.set(data.scale[0] * beat, data.scale[1] * beat, data.scale[2] * beat);
  });
  return (
    <group position={data.position}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onSelect({ id, ...data, type: 'chamber' }); }}>
        <sphereGeometry args={[1, 48, 32, cutaway ? Math.PI * .12 : 0, cutaway ? Math.PI * 1.55 : Math.PI * 2]} />
        <meshPhysicalMaterial color={data.color} roughness={.58} clearcoat={.28} clearcoatRoughness={.62} transparent opacity={cutaway ? (selected ? .96 : .76) : .08} emissive={data.color} emissiveIntensity={selected ? .12 : .01} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh scale={[data.scale[0] * .72, data.scale[1] * .72, data.scale[2] * .72]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial color="#260609" roughness={.72} clearcoat={.18} transparent opacity={cutaway ? .96 : 0} side={THREE.BackSide} />
      </mesh>
      {cutaway && showLabel && <Html position={[0, 0, .48]} center zIndexRange={[4, 1]}><button className={`part-label ${selected ? 'active' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSelect({ id, ...data, type: 'chamber' }); }}><b>{data.short}</b><span>{data.name}</span></button></Html>}
    </group>
  );
}

function Vessel({ vessel, selected, showLabel, onSelect }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(vessel.points.map(p => new THREE.Vector3(...p))), [vessel]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 50, vessel.radius, 12, false), [curve, vessel.radius]);
  const particles = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!particles.current) return;
    for (let i = 0; i < 18; i++) {
      const p = curve.getPointAt((i / 18 + clock.elapsedTime * .13) % 1);
      dummy.position.copy(p); dummy.scale.setScalar(.55 + Math.sin(clock.elapsedTime * 5 + i) * .12); dummy.updateMatrix();
      particles.current.setMatrixAt(i, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  const labelPoint = curve.getPointAt(.62).clone().add(new THREE.Vector3(vessel.points[0][0] < 0 ? -.18 : .18, .04, .25));
  return <group onClick={(e) => { e.stopPropagation(); onSelect({ ...vessel, type: 'vessel', position: curve.getPointAt(.5).toArray() }); }}>
    <mesh geometry={geometry}><meshPhysicalMaterial color={vessel.color} roughness={.52} clearcoat={.38} clearcoatRoughness={.5} transparent opacity={selected ? .98 : .82} emissive={vessel.color} emissiveIntensity={selected ? .12 : .015} /></mesh>
    <instancedMesh ref={particles} args={[null, null, 18]}><sphereGeometry args={[.027, 10, 6]} /><meshStandardMaterial color={vessel.color} roughness={.7} /></instancedMesh>
    {showLabel && <Html position={labelPoint} center zIndexRange={[4, 1]}>
      <button className={`part-label vessel-label ${selected ? 'active' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSelect({ ...vessel, type: 'vessel', position: curve.getPointAt(.5).toArray() }); }}><span>{vessel.name}</span></button>
    </Html>}
  </group>;
}

function FlowPath({ points, color }) {
  return <Line points={points} color={color} lineWidth={2} dashed dashSize={.08} gapSize={.05} transparent opacity={.65} />;
}

function ExteriorFlow({ color, points, reverse = false }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points]);
  const dots = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!dots.current) return;
    for (let i = 0; i < 24; i++) {
      let t = (i / 24 + clock.elapsedTime * .12) % 1;
      if (reverse) t = 1 - t;
      dummy.position.copy(curve.getPointAt(t));
      dummy.scale.setScalar(.7 + Math.sin(clock.elapsedTime * 6 + i) * .16);
      dummy.updateMatrix(); dots.current.setMatrixAt(i, dummy.matrix);
    }
    dots.current.instanceMatrix.needsUpdate = true;
  });
  return <group>
    <Line points={curve.getPoints(80)} color={color} lineWidth={1} transparent opacity={.5} />
    <instancedMesh ref={dots} args={[null, null, 24]}>
      <sphereGeometry args={[.032, 10, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  </group>;
}

function ExteriorLabels({ selected, onSelect }) {
  return <group>{EXTERIOR_STRUCTURES.filter((part) => !selected || selected.id === part.id).map((part) => <group key={part.id}>
    <Line points={[part.position, part.labelPosition]} color={part.color} lineWidth={1} transparent opacity={.7} />
    <mesh position={part.position} onClick={(e) => { e.stopPropagation(); onSelect(part); }}><sphereGeometry args={[.035,12,10]} /><meshBasicMaterial color={part.color} toneMapped={false} /></mesh>
    <Html position={part.labelPosition} center zIndexRange={[4,1]}><button className={`part-label exterior-label ${selected?.id === part.id ? 'active' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSelect(part); }}>{part.name}</button></Html>
  </group>)}</group>;
}

function CutawayAnatomy({ selected, onSelect }) {
  const wallGeometry = useMemo(() => {
    const heart = new THREE.Shape();
    heart.moveTo(0, -1.48);
    heart.bezierCurveTo(-.32, -1.22, -1.08, -.78, -1.08, .28);
    heart.bezierCurveTo(-1.08, 1.08, -.48, 1.38, -.04, 1.05);
    heart.bezierCurveTo(.48, 1.42, 1.08, 1.02, 1.08, .28);
    heart.bezierCurveTo(1.08, -.7, .48, -1.25, 0, -1.48);
    [[-.52,.55,.35,.39],[-.43,-.35,.4,.64],[.46,.5,.31,.34],[.4,-.36,.4,.66]].forEach(([x,y,rx,ry]) => {
      const hole = new THREE.Path();
      hole.absellipse(x, y, rx, ry, 0, Math.PI * 2, true);
      heart.holes.push(hole);
    });
    return new THREE.ExtrudeGeometry(heart, { depth: .18, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: .055, bevelThickness: .045, curveSegments: 48 });
  }, []);
  const valveMaterial = <meshPhysicalMaterial color="#f7b4a9" roughness={.46} clearcoat={.35} side={THREE.DoubleSide} />;
  return <group position={[0, 0, .24]}>
    <mesh geometry={wallGeometry} castShadow receiveShadow>
      <meshPhysicalMaterial color="#c9686d" roughness={.5} clearcoat={.3} clearcoatRoughness={.5} sheen={.45} sheenColor="#711824" side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -.45, .24]} scale={[.16, .78, .12]} onClick={(e) => { e.stopPropagation(); onSelect(INTERNAL_STRUCTURES.septum); }}>
      <capsuleGeometry args={[1, 1, 12, 24]} />
      <meshPhysicalMaterial color="#e79791" roughness={.54} clearcoat={.25} />
    </mesh>
    <group position={[-.47,.08,.28]} scale={[1.1,.58,1]} rotation={[0,0,-.08]} onClick={(e) => { e.stopPropagation(); onSelect(INTERNAL_STRUCTURES.tricuspidValve); }}>
      <mesh><torusGeometry args={[.25,.045,12,38]} />{valveMaterial}</mesh>
      <mesh position={[-.08,-.03,.01]} rotation={[0,0,.35]}><coneGeometry args={[.09,.22,3]} />{valveMaterial}</mesh>
      <mesh position={[.09,-.03,.01]} rotation={[0,0,-.35]}><coneGeometry args={[.09,.22,3]} />{valveMaterial}</mesh>
    </group>
    <group position={[.43,.08,.28]} scale={[1.05,.56,1]} rotation={[0,0,.06]} onClick={(e) => { e.stopPropagation(); onSelect(INTERNAL_STRUCTURES.mitralValve); }}>
      <mesh><torusGeometry args={[.24,.045,12,38]} />{valveMaterial}</mesh>
      <mesh position={[-.08,-.03,.01]} rotation={[0,0,.35]}><coneGeometry args={[.09,.22,3]} />{valveMaterial}</mesh>
      <mesh position={[.09,-.03,.01]} rotation={[0,0,-.35]}><coneGeometry args={[.09,.22,3]} />{valveMaterial}</mesh>
    </group>
    <group position={[-.16,.43,.29]} onClick={(e) => { e.stopPropagation(); onSelect(INTERNAL_STRUCTURES.pulmonaryValve); }}><mesh scale={[1,.55,1]}><torusGeometry args={[.15,.038,12,32]} />{valveMaterial}</mesh></group>
    <group position={[.22,.43,.3]} onClick={(e) => { e.stopPropagation(); onSelect(INTERNAL_STRUCTURES.aorticValve); }}><mesh scale={[1,.55,1]}><torusGeometry args={[.14,.038,12,32]} />{valveMaterial}</mesh></group>
    {Object.values(INTERNAL_STRUCTURES).filter((part) => !selected || selected.id === part.id).map((part) => <Html key={part.id} position={part.position} center zIndexRange={[4, 1]}><button className={`anatomy-callout ${selected?.id === part.id ? 'active' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onSelect(part); }}>{part.name}</button></Html>)}
  </group>;
}

function Heart({ selected, cutaway, onSelect }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const contraction = Math.pow(Math.max(0, Math.sin(t * 4.2)), 12);
    group.current.rotation.y = Math.sin(t * .22) * .07;
    group.current.scale.set(1 + contraction * .018, 1 - contraction * .026, 1 + contraction * .022);
  });
  return <group ref={group} position={[0, -.05, 0]} rotation={[-.08, 0, -.08]}>
    <AnatomicalExterior cutaway={cutaway} />
    {!cutaway && <>
      <ExteriorFlow color="#ff4655" points={[[0,1.95,.1],[0,1.55,.05],[.42,1.25,.18],[.76,.72,.38],[.55,.18,.65],[.28,-.55,.72]]} />
      <ExteriorFlow color="#3977ff" reverse points={[[-.08,-1.7,.15],[-.25,-1.38,.32],[-.48,-1.05,.5],[-.58,-.62,.58]]} />
      <ExteriorLabels selected={selected} onSelect={onSelect} />
    </>}
    {cutaway && <>
      <CutawayAnatomy selected={selected} onSelect={onSelect} />
      {Object.keys(PARTS).map(id => <Chamber key={id} id={id} cutaway selected={selected?.id === id} showLabel={!selected || selected.id === id} onSelect={onSelect} />)}
      {VESSELS.map(v => <Vessel key={v.id} vessel={v} selected={selected?.id === v.id} showLabel={!selected || selected.id === v.id} onSelect={onSelect} />)}
      <FlowPath color="#4c8cff" points={[[-.75,1.45,0],[-.55,.55,0],[-.43,-.32,.08],[-.05,.72,.25],[-.75,1,.32]]} />
      <FlowPath color="#ff5261" points={[[1.15,.65,-.1],[.46,.5,-.05],[.4,-.35,0],[.55,1,0],[.05,1.38,0]]} />
    </>}
  </group>;
}

useGLTF.preload('/models/heart/scene.gltf');

function CameraRig({ selected, resetSignal }) {
  const { camera } = useThree();
  const controls = useRef();
  useEffect(() => {
    const target = selected?.position ? new THREE.Vector3(...selected.position) : new THREE.Vector3(0, .05, 0);
    const destination = selected?.position ? target.clone().add(new THREE.Vector3(0, .05, 2.0)) : new THREE.Vector3(0, .15, 4.3);
    let frame;
    const start = camera.position.clone(); const started = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - started) / 700); const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(start, destination, eased); controls.current?.target.lerp(target, .14); controls.current?.update();
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [selected, resetSignal, camera]);
  return <OrbitControls ref={controls} enableDamping dampingFactor={.08} minDistance={.55} maxDistance={7} />;
}

export default function HeartScene({ selected, cutaway, onSelect, resetSignal }) {
  return <Canvas shadows camera={{ position: [0, .15, 4.3], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMappingExposure = 1.3; }} onPointerMissed={() => onSelect(null)}>
    <color attach="background" args={['#02070b']} />
    <fog attach="fog" args={['#02070b', 6, 10]} />
    <ambientLight intensity={.24} />
    <spotLight position={[2.4, 4.5, 4.5]} intensity={6.2} angle={.34} penumbra={.86} color="#ffe4da" castShadow shadow-bias={-.0002} />
    <spotLight position={[-3.5, 1.5, 3]} intensity={3.4} angle={.42} penumbra={1} color="#dcecff" />
    <pointLight position={[2.5, -1.8, 1]} intensity={2.1} color="#ff354b" />
    <Suspense fallback={<Html center><div className="loading">Preparing anatomy…</div></Html>}>
      <Heart selected={selected} cutaway={cutaway} onSelect={onSelect} />
      <Environment resolution={512}>
        <Lightformer intensity={5.2} color="#fff5ef" position={[0, 4, 3]} scale={[5, 2, 1]} />
        <Lightformer intensity={1.7} color="#8fb9cd" position={[-4, 0, 2]} scale={[2, 4, 1]} />
        <Lightformer intensity={2.2} color="#e94855" position={[4, -1, -2]} scale={[2, 3, 1]} />
      </Environment>
    </Suspense>
    <CameraRig selected={selected} resetSignal={resetSignal} />
    <XRButton />
  </Canvas>;
}
