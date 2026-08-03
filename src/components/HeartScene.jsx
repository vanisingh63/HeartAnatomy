import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment, Line } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';

/*
  MODEL PATH: update this if your model lives somewhere else.
*/
const MODEL_PATH = '/models/heart/scene.gltf';

// Keywords used to auto-detect which meshes are which anatomical part,
// IF your model has separate named meshes. Since many free models are a
// single merged mesh, this often won't match anything — that's fine,
// the label system below covers you regardless.
const CHAMBER_KEYWORDS = {
  leftAtrium: ['left_atrium', 'leftatrium', 'la_'],
  rightAtrium: ['right_atrium', 'rightatrium', 'ra_'],
  leftVentricle: ['left_ventricle', 'leftventricle', 'lv_'],
  rightVentricle: ['right_ventricle', 'rightventricle', 'rv_'],
};

function findMatch(name, keywords) {
  const n = name.toLowerCase();
  return keywords.some((k) => n.includes(k));
}

const LOCAL_STORAGE_KEY = 'heart-chamber-labels-v1';

// ---------- Blood flow: tube + directional arrows + flowing particles ----------

function BloodVessel({ curve, color, label, count = 26, speed = 0.35, particleSize = 0.012 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => new Array(count).fill(0).map((_, i) => i / count), [count]);

  // Static tube showing the vessel path itself (so it reads even when paused)
  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.008, 8, false), [curve]);

  // A few fixed arrowheads along the path so direction is legible at a glance
  const arrowPositions = useMemo(() => [0.2, 0.45, 0.7, 0.9], []);

  useFrame(() => {
    if (!meshRef.current) return;
    offsets.forEach((offset, i) => {
      const t = (offset + performance.now() * 0.0001 * speed) % 1;
      const point = curve.getPointAt(t);
      dummy.position.copy(point);
      const pulse = 1 + Math.sin(performance.now() * 0.005 + i) * 0.25;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* vessel tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.3} />
      </mesh>

      {/* direction arrows */}
      {arrowPositions.map((t, i) => {
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          tangent
        );
        return (
          <mesh key={i} position={point} quaternion={quaternion}>
            <coneGeometry args={[0.016, 0.04, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}

      {/* flowing blood-cell particles, glowing */}
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <sphereGeometry args={[particleSize, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      {/* callout label: anchor point on the tube + a leader line out to readable text,
          so it's unambiguous which vessel the label belongs to regardless of camera angle */}
      {(() => {
        const anchor = curve.getPointAt(0.02);
        const labelPos = anchor.clone().multiplyScalar(1.7);
        return (
          <group>
            <Line points={[anchor, labelPos]} color={color} lineWidth={1.5} />
            <mesh position={anchor}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <Html position={labelPos} center occlude={false}>
              <div style={vesselTagStyle(color)}>{label}</div>
            </Html>
          </group>
        );
      })()}
    </group>
  );
}

function useVesselCurves(radius) {
  return useMemo(() => {
    const r = radius * 1.15;
    const makeCurve = (points) =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));

    return [
      {
        curve: makeCurve([
          [0, r, 0], [r * 0.4, r * 0.6, r * 0.3], [r * 0.2, 0, r * 0.5], [0, -r * 0.3, r * 0.2],
        ]),
        color: '#ff3b3b',
        label: 'Oxygen-rich blood → to body (Aorta)',
      },
      {
        curve: makeCurve([
          [0, -r, 0], [-r * 0.4, -r * 0.5, -r * 0.3], [-r * 0.3, 0, -r * 0.4], [0, r * 0.3, -r * 0.2],
        ]),
        color: '#3b6bff',
        label: 'Oxygen-poor blood → to lungs (Vena Cava)',
      },
    ];
  }, [radius]);
}

// ---------- Chamber label markers (manually placed, since the model is one merged mesh) ----------

function LabelMarker({ label, onDelete, editMode }) {
  return (
    <Html position={label.position} center occlude={false}>
      <div style={markerWrapStyle}>
        <div style={markerDotStyle} />
        <div style={markerTagStyle}>
          {label.name}
          {editMode && (
            <button style={markerDeleteStyle} onClick={() => onDelete(label.id)}>
              ✕
            </button>
          )}
        </div>
      </div>
    </Html>
  );
}

function HeartModel({ onReady, onSelect, entered, editMode, onPlaceLabel }) {
  const groupRef = useRef();
  const { scene } = useGLTF(MODEL_PATH);
  const [radius, setRadius] = useState(1);
  const chamberMeshes = useRef({});

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y, size.z) / 2;
    setRadius(r || 1);

    const names = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        names.push(child.name);
        for (const [key, keywords] of Object.entries(CHAMBER_KEYWORDS)) {
          if (findMatch(child.name, keywords)) chamberMeshes.current[key] = child;
        }
      }
    });
    console.log('[HeartScene] Mesh names found:', names);
    onReady?.(box);
  }, [scene, onReady]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const beat = 1 + Math.sin(t * 3.2) * 0.03;
    const hasNamedChambers = Object.keys(chamberMeshes.current).length > 0;
    if (hasNamedChambers) {
      ['leftVentricle', 'rightVentricle'].forEach((key) => {
        const mesh = chamberMeshes.current[key];
        if (mesh) mesh.scale.setScalar(beat);
      });
    } else if (groupRef.current) {
      // no separate chamber meshes found -> pulse the whole heart instead
      groupRef.current.scale.setScalar(beat);
    }
    if (groupRef.current && !entered) {
      groupRef.current.rotation.y = t * 0.08;
    }
  });

  const vessels = useVesselCurves(radius);

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onClick={(e) => {
          e.stopPropagation();
          if (editMode) {
            onPlaceLabel(e.point);
          } else if (!entered) {
            onSelect(e.point);
          }
        }}
      />
      {vessels.map((v, i) => (
        <BloodVessel key={i} curve={v.curve} color={v.color} label={v.label} />
      ))}
    </group>
  );
}

function CameraRig({ entered, targetPoint }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (entered && targetPoint) {
      gsap.to(camera.position, {
        x: targetPoint.x * 0.15,
        y: targetPoint.y * 0.15,
        z: targetPoint.z * 0.15 + 0.3,
        duration: 1.6,
        ease: 'power3.inOut',
      });
    } else {
      gsap.to(camera.position, { x: 0, y: 0, z: 4, duration: 1.4, ease: 'power3.inOut' });
    }
  }, [entered, targetPoint, camera]);

  return <OrbitControls ref={controlsRef} enablePan={false} minDistance={0.1} maxDistance={8} />;
}

export default function HeartScene() {
  const [entered, setEntered] = useState(false);
  const [targetPoint, setTargetPoint] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labels));
  }, [labels]);

  const handlePlaceLabel = useCallback((point) => {
    const name = window.prompt(
      'Name this chamber/part (e.g. "Left Ventricle", "Right Atrium"):'
    );
    if (!name) return;
    setLabels((prev) => [
      ...prev,
      { id: Date.now(), name, position: [point.x, point.y, point.z] },
    ]);
  }, []);

  const handleDeleteLabel = useCallback((id) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleExportLabels = useCallback(() => {
    const json = JSON.stringify(labels, null, 2);
    navigator.clipboard?.writeText(json);
    console.log('[HeartScene] Exported labels JSON:', json);
    alert('Label positions copied to clipboard and printed to console — paste them to Claude to bake in permanently.');
  }, [labels]);

  return (
    <>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />
        <pointLight position={[-3, -2, -3]} intensity={0.4} color="#ff6666" />
        <React.Suspense fallback={<Html center style={{ color: 'white' }}>Loading heart model…</Html>}>
          <HeartModel
            entered={entered}
            editMode={editMode}
            onPlaceLabel={handlePlaceLabel}
            onSelect={(point) => {
              setTargetPoint(point);
              setEntered(true);
            }}
          />
          {entered &&
            labels.map((label) => (
              <LabelMarker key={label.id} label={label} editMode={editMode} onDelete={handleDeleteLabel} />
            ))}
        </React.Suspense>
        <CameraRig entered={entered} targetPoint={targetPoint} />
        <Environment preset="studio" />
      </Canvas>

      {/* legend, top-right */}
      <div style={legendStyle}>
        <div style={legendRowStyle}><span style={legendDotStyle('#ff3b3b')} /> Oxygen-rich blood (leaving heart)</div>
        <div style={legendRowStyle}><span style={legendDotStyle('#3b6bff')} /> Oxygen-poor blood (returning to heart)</div>
      </div>

      {/* bottom controls */}
      <div style={overlayStyle}>
        {!entered ? (
          <p style={hintStyle}>🖱️ Click the heart to travel inside</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>
            <button style={backButtonStyle} onClick={() => setEntered(false)}>
              ← Exit chamber view
            </button>
            <button
              style={editMode ? editButtonActiveStyle : editButtonStyle}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? '✓ Done labeling' : '📍 Add chamber label'}
            </button>
            {labels.length > 0 && (
              <button style={exportButtonStyle} onClick={handleExportLabels}>
                Export labels
              </button>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <div style={editHintStyle}>Click anywhere on the heart to drop a label there</div>
      )}
    </>
  );
}

function vesselTagStyle(color) {
  return {
    background: 'rgba(6,10,15,0.9)',
    border: `2px solid ${color}`,
    color: color,
    fontWeight: 700,
    padding: '3px 7px',
    borderRadius: 5,
    fontSize: 10,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transform: 'scale(0.8)',
    transformOrigin: 'center',
    boxShadow: `0 0 6px ${color}`,
  };
}

const markerWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const markerDotStyle = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#ffd23b',
  boxShadow: '0 0 8px 2px rgba(255,210,59,0.8)',
};

const markerTagStyle = {
  background: 'rgba(6,10,15,0.9)',
  border: '1px solid #ffd23b',
  color: '#fff',
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const markerDeleteStyle = {
  background: 'none',
  border: 'none',
  color: '#ff6b6b',
  cursor: 'pointer',
  fontSize: 11,
  padding: 0,
};

const legendStyle = {
  position: 'absolute',
  top: 20,
  right: 24,
  background: 'rgba(6,10,15,0.7)',
  padding: '10px 14px',
  borderRadius: 10,
  color: '#e8f1ff',
  fontSize: 12,
};

const legendRowStyle = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 };

function legendDotStyle(color) {
  return { width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' };
}

const overlayStyle = {
  position: 'absolute',
  bottom: 24,
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
};

const hintStyle = {
  color: '#e8f1ff',
  background: 'rgba(10,16,24,0.6)',
  padding: '8px 18px',
  borderRadius: 999,
  fontSize: 14,
  letterSpacing: 0.3,
};

const backButtonStyle = {
  background: '#ff3b3b',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const editButtonStyle = {
  background: '#ffd23b',
  color: '#1a1400',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const editButtonActiveStyle = {
  ...editButtonStyle,
  background: '#3bff7a',
};

const exportButtonStyle = {
  background: '#2a3a4a',
  color: '#e8f1ff',
  border: '1px solid #4a6a8a',
  padding: '10px 20px',
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const editHintStyle = {
  position: 'absolute',
  top: 80,
  left: 0,
  width: '100%',
  textAlign: 'center',
  color: '#ffd23b',
  fontSize: 13,
  pointerEvents: 'none',
};

useGLTF.preload(MODEL_PATH);
