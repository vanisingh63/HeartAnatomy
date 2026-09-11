import React, { useEffect, useState } from 'react';
import HeartScene, { EXTERIOR_STRUCTURES, INTERNAL_STRUCTURES, PARTS, VESSELS } from './components/HeartScene.jsx';

const CHAMBER_CONTENTS = {
  rightAtrium: [
    ['Superior vena cava opening', 'Entry for oxygen-poor blood returning from the upper body.'], ['Inferior vena cava opening', 'Entry for blood returning from the lower body.'], ['Coronary sinus', 'Returns blood collected from the heart muscle.'], ['Fossa ovalis', 'Depression marking the former fetal opening between the atria.'], ['Pectinate muscles', 'Parallel muscular ridges that assist atrial contraction.'], ['Tricuspid valve entrance', 'Opening through which blood enters the right ventricle.'],
  ],
  rightVentricle: [
    ['Tricuspid valve', 'Prevents backward flow into the right atrium.'], ['Chordae tendineae', 'Tough cords anchoring the valve leaflets.'], ['Papillary muscles', 'Keep the tricuspid valve from inverting.'], ['Trabeculae carneae', 'Muscular ridges lining the ventricular wall.'], ['Moderator band', 'Carries electrical signals across the ventricle.'], ['Pulmonary valve', 'Controls blood leaving for the lungs.'], ['Right ventricular outflow tract', 'Smooth passage directing blood toward the pulmonary valve.'],
  ],
  leftAtrium: [
    ['Four pulmonary-vein openings', 'Return oxygen-rich blood from both lungs.'], ['Smooth atrial wall', 'Supports efficient filling of the chamber.'], ['Left atrial appendage', 'Muscular pouch that increases atrial capacity.'], ['Interatrial septum', 'Wall separating the left and right atria.'], ['Mitral-valve entrance', 'Opening directing blood into the left ventricle.'],
  ],
  leftVentricle: [
    ['Mitral valve', 'Prevents backward flow into the left atrium.'], ['Chordae tendineae', 'Fibrous cords stabilizing the mitral leaflets.'], ['Papillary muscles', 'Tense the chordae during contraction.'], ['Trabeculae carneae', 'Muscular ridges strengthening the inner surface.'], ['Aortic valve', 'Controls blood entering the aorta.'], ['Interventricular septum', 'Thick wall separating both ventricles.'], ['Thick ventricular myocardium', 'Generates the pressure needed for systemic circulation.'],
  ],
};

const QUIZZES = {
  rightAtrium: ['Which landmark marks the former fetal atrial opening?', ['Fossa ovalis', 'Moderator band', 'Aortic valve'], 'Fossa ovalis'],
  rightVentricle: ['Which structure carries signals across this ventricle?', ['Moderator band', 'Coronary sinus', 'Mitral valve'], 'Moderator band'],
  leftAtrium: ['Which vessels deliver oxygen-rich blood here?', ['Pulmonary veins', 'Venae cavae', 'Pulmonary artery'], 'Pulmonary veins'],
  leftVentricle: ['Which valve controls blood leaving this chamber?', ['Aortic valve', 'Tricuspid valve', 'Pulmonary valve'], 'Aortic valve'],
};

export default function App() {
  const [selected, setSelected] = useState(null);
  const [cutaway, setCutaway] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [viewPreset, setViewPreset] = useState('front');
  const [insideChamber, setInsideChamber] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [colorBlindSafe, setColorBlindSafe] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [caption, setCaption] = useState('');
  const [resetSignal, setResetSignal] = useState(0);

  const returnToOverview = () => { setSelected(null); setSelectedFeature(null); setQuizAnswer(null); setResetSignal(v => v + 1); };
  const resetAll = () => {
    window.speechSynthesis?.cancel();
    setSelected(null);
    setSelectedFeature(null);
    setQuizAnswer(null);
    setCutaway(false);
    setExploded(false);
    setViewPreset('front');
    setInsideChamber(false);
    setResetSignal(v => v + 1);
  };
  const handleSelect = (part) => {
    if (!part || selected?.id === part.id) return returnToOverview();
    setSelected(part); setSelectedFeature(null); setQuizAnswer(null); setInsideChamber(false);
  };
  const selectFromNavigator = (part, type) => {
    setCutaway(type !== 'exterior'); setExploded(false);
    const position = part.position || (part.points ? part.points[Math.floor(part.points.length / 2)] : [0, 0, 0]);
    handleSelect({ ...part, type: part.type || type, position });
  };
  const navGroups = [
    { title: 'Exterior landmarks', items: EXTERIOR_STRUCTURES },
    { title: 'Four chambers', items: Object.entries(PARTS).map(([id, part]) => ({ id, ...part, type: 'chamber' })) },
    { title: 'Heart valves', items: Object.values(INTERNAL_STRUCTURES).filter(part => part.type === 'valve') },
    { title: 'Major blood vessels', items: VESSELS },
    { title: 'Heart wall', items: [INTERNAL_STRUCTURES.septum] },
  ];
  const narrate = () => {
    if (!selected || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const contents = selected.type === 'chamber' ? ` Inside this chamber are ${CHAMBER_CONTENTS[selected.id].map(item => item[0]).join(', ')}.` : '';
    const narration = `${selected.name}. ${selected.role || selected.info}.${contents}`;
    setCaption(narration);
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(narration));
  };
  const quiz = selected?.type === 'chamber' ? QUIZZES[selected.id] : null;
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') returnToOverview();
      if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey) setAnimationPaused(value => !value);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return <main className={`app ${colorBlindSafe ? 'colorblind-safe' : ''} ${reducedMotion ? 'reduced-motion' : ''}`} style={{ '--text-scale': textScale }}>
    <header className="topbar"><div><div className="eyebrow">IMMERSIVE ANATOMY · MODULE 01</div><h1>Inside the human heart</h1></div><div className="status"><i /> Live cardiac cycle</div></header>
    <section className="viewport" aria-label="Interactive three-dimensional human heart anatomy model"><HeartScene selected={selected} cutaway={cutaway} exploded={exploded} insideChamber={insideChamber} selectedFeature={selectedFeature} onFeatureSelect={setSelectedFeature} viewPreset={viewPreset} colorBlindSafe={colorBlindSafe} motionEnabled={!animationPaused && !reducedMotion} onSelect={handleSelect} resetSignal={resetSignal} /></section>
    <aside className="navigator panel"><p className="panel-kicker">ANATOMY NAVIGATOR</p><h2>Heart structures</h2><div className="navigator-scroll">{navGroups.map(group => <section className="nav-section" key={group.title}><h3>{group.title}</h3><div className="chamber-list">{group.items.map((part, index) => <button type="button" key={part.id} className={selected?.id === part.id ? 'selected' : ''} onClick={() => selectFromNavigator(part, part.points ? 'vessel' : part.type)}><span>{String(index + 1).padStart(2, '0')}</span><i style={{ background: part.color }} />{part.name}<b>›</b></button>)}</div></section>)}</div><p className="tip">Select a structure or the model. Drag to rotate · scroll to zoom.</p></aside>
    <aside className={`detail panel ${selected ? 'visible' : ''}`}>
      {selected ? <><button type="button" className="close" onClick={returnToOverview}>×</button><p className="panel-kicker">{selected.type === 'chamber' ? 'IMMERSIVE CHAMBER' : selected.type === 'exterior' ? 'EXTERIOR ANATOMY' : selected.type === 'vessel' ? 'MAJOR BLOOD VESSEL' : selected.type === 'valve' ? 'HEART VALVE' : 'CARDIAC STRUCTURE'}</p><div className="detail-title"><i style={{ background: selected.color }} /><h2>{selected.name}</h2></div><p>{selected.role || selected.info}</p><button type="button" className="narrate" onClick={narrate}>▶ Hear explanation</button>
        {selected.type === 'chamber' && <><div className="metric"><span>Blood status</span><strong>{selected.id.startsWith('left') ? '◉ Oxygen-rich' : '◉ Oxygen-poor'}</strong></div><div className="inside-list"><h3>Inside this chamber</h3>{CHAMBER_CONTENTS[selected.id].map(([name, description], index) => <button type="button" key={name} className={selectedFeature === name ? 'open' : ''} onClick={() => setSelectedFeature(selectedFeature === name ? null : name)}><span><i>{String(index + 1).padStart(2, '0')}</i>{name}<b>{selectedFeature === name ? '−' : '+'}</b></span>{selectedFeature === name && <p>{description}</p>}</button>)}</div><div className="quiz"><h3>Check your knowledge</h3><p>{quiz[0]}</p>{quiz[1].map(option => <button type="button" className={quizAnswer === option ? (option === quiz[2] ? 'correct' : 'wrong') : ''} key={option} onClick={() => setQuizAnswer(option)}>{option}</button>)}{quizAnswer && <strong>{quizAnswer === quiz[2] ? 'Correct — well done.' : 'Try again.'}</strong>}</div></>}
        <button type="button" className="focus" onClick={() => setResetSignal(v => v + 1)}>Focus view</button><button type="button" className="back-labels" onClick={returnToOverview}>← Back to all labels</button></> : <><p className="panel-kicker">GUIDED EXPLORATION</p><h2>Choose a structure</h2><p>Select any landmark, chamber, valve, or vessel to learn its role.</p></>}
    </aside>
    <div className="toolbar"><div className="view-presets">{['front', 'back', 'cutaway', 'transparent'].map(view => <button type="button" key={view} className={viewPreset === view ? 'active' : ''} onClick={() => { setViewPreset(view); if (view === 'cutaway' || view === 'transparent') setCutaway(true); setResetSignal(v => v + 1); }}>{view}</button>)}</div><button type="button" className={cutaway ? 'active' : ''} onClick={() => { returnToOverview(); setExploded(false); setCutaway(v => !v); }}><span>◐</span>{cutaway ? 'Cutaway on' : 'Exterior view'}</button><button type="button" className={exploded ? 'active' : ''} onClick={() => { returnToOverview(); setCutaway(true); setExploded(v => !v); }}><span>✣</span>{exploded ? 'Assemble chambers' : 'Split chambers'}</button><button type="button" onClick={resetAll}><span>⌂</span>Reset</button><div className="flow-key"><i className="blue" /> Oxygen-poor <i className="red" /> Oxygen-rich</div></div>
    {selected?.type === 'chamber' && <button type="button" className="enter-floating" onClick={() => { setInsideChamber(v => !v); setResetSignal(v => v + 1); }}>{insideChamber ? '← Chamber overview' : 'Enter this chamber →'}</button>}
    <button type="button" className="accessibility-toggle" aria-expanded={accessibilityOpen} onClick={() => setAccessibilityOpen(v => !v)}>Accessibility</button>
    {accessibilityOpen && <aside className="accessibility-panel panel" aria-label="Accessibility settings"><h2>Accessibility</h2><label><input type="checkbox" checked={colorBlindSafe} onChange={e => setColorBlindSafe(e.target.checked)} /> Colour-blind-safe mode</label><label><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} /> Reduced motion</label><label><input type="checkbox" checked={animationPaused} onChange={e => setAnimationPaused(e.target.checked)} /> Pause animation <kbd>P</kbd></label><label>Text size<select value={textScale} onChange={e => setTextScale(Number(e.target.value))}><option value="0.9">Small</option><option value="1">Default</option><option value="1.2">Large</option><option value="1.4">Extra large</option></select></label><p>Press Escape to leave an inspection view. All controls are reachable with Tab.</p></aside>}
    {caption && <div className="captions" role="status"><span>{caption}</span><button type="button" aria-label="Close narration captions" onClick={() => { setCaption(''); window.speechSynthesis?.cancel(); }}>×</button></div>}
    <div className="sr-only" aria-live="polite">{selected ? `${selected.name}. ${selected.role || selected.info}` : 'Full heart overview. No structure selected.'}</div>
    <div className="orientation"><b>S</b><span><i>L</i> FRONT <i>R</i></span><b>I</b></div>
  </main>;
}
