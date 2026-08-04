import React, { useState } from 'react';
import HeartScene, { EXTERIOR_STRUCTURES, INTERNAL_STRUCTURES, PARTS, VESSELS } from './components/HeartScene.jsx';

export default function App() {
  const [selected, setSelected] = useState(null);
  const [cutaway, setCutaway] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const returnToOverview = () => {
    setSelected(null);
    setResetSignal((value) => value + 1);
  };
  const handleSelect = (part) => {
    if (!part || selected?.id === part.id) {
      returnToOverview();
      return;
    }
    setSelected(part);
  };
  const selectFromNavigator = (part, type) => {
    setCutaway(type !== 'exterior');
    const position = part.position || (part.points ? part.points[Math.floor(part.points.length / 2)] : [0, 0, 0]);
    handleSelect({ ...part, type: part.type || type, position });
  };
  const navGroups = [
    { title: 'Exterior landmarks', items: EXTERIOR_STRUCTURES },
    { title: 'Four chambers', items: Object.entries(PARTS).map(([id, part]) => ({ id, ...part, type: 'chamber' })) },
    { title: 'Heart valves', items: Object.values(INTERNAL_STRUCTURES).filter((part) => part.type === 'valve') },
    { title: 'Major blood vessels', items: VESSELS },
    { title: 'Heart wall', items: [INTERNAL_STRUCTURES.septum] },
  ];
  return <main className="app">
    <header className="topbar">
      <div><div className="eyebrow">IMMERSIVE ANATOMY · MODULE 01</div><h1>Inside the human heart</h1></div>
      <div className="status"><i /> Live cardiac cycle</div>
    </header>
    <section className="viewport"><HeartScene selected={selected} cutaway={cutaway} onSelect={handleSelect} resetSignal={resetSignal} /></section>
    <aside className="navigator panel">
      <p className="panel-kicker">ANATOMY NAVIGATOR</p><h2>Heart structures</h2>
      <div className="navigator-scroll">{navGroups.map((group) => <section className="nav-section" key={group.title}><h3>{group.title}</h3><div className="chamber-list">{group.items.map((part, index) => <button type="button" key={part.id} className={selected?.id === part.id ? 'selected' : ''} onClick={() => selectFromNavigator(part, part.points ? 'vessel' : part.type)}><span>{String(index + 1).padStart(2,'0')}</span><i style={{background:part.color}} />{part.name}<b>›</b></button>)}</div></section>)}</div>
      <p className="tip">Select any structure here or directly on the model. Drag to rotate · scroll to zoom.</p>
    </aside>
    <aside className={`detail panel ${selected ? 'visible' : ''}`}>
      {selected ? <><button type="button" className="close" aria-label="Close inspection and show all labels" onClick={returnToOverview}>×</button><p className="panel-kicker">{selected.type === 'exterior' ? 'EXTERIOR ANATOMY' : selected.type === 'chamber' ? 'CHAMBER' : selected.type === 'vessel' ? 'MAJOR BLOOD VESSEL' : selected.type === 'valve' ? 'HEART VALVE' : 'CARDIAC STRUCTURE'}</p><div className="detail-title"><i style={{background:selected.color}} /><h2>{selected.name}</h2></div><p>{selected.role || selected.info}</p>{selected.type === 'chamber' && <div className="metric"><span>Cardiac side</span><strong>{selected.id.startsWith('left') ? 'Oxygen-rich' : 'Oxygen-poor'}</strong></div>}<button type="button" className="focus" onClick={() => setResetSignal(v => v + 1)}>Focus view</button><button type="button" className="back-labels" onClick={returnToOverview}>← Back to all labels</button></> : <><p className="panel-kicker">GUIDED EXPLORATION</p><h2>Choose a structure</h2><p>Select any exterior landmark, chamber, valve, or vessel to learn its role.</p></>}
    </aside>
    <div className="toolbar">
      <button type="button" className={cutaway ? 'active' : ''} onClick={() => { returnToOverview(); setCutaway(v => !v); }}><span>◐</span>{cutaway ? 'Cutaway on' : 'Exterior view'}</button>
      <button type="button" onClick={returnToOverview}><span>⌂</span>Reset view</button>
      <div className="flow-key"><i className="blue" /> Deoxygenated <i className="red" /> Oxygenated</div>
    </div>
  </main>;
}
