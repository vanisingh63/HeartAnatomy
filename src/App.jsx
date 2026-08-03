import React from 'react';
import HeartScene from './components/HeartScene.jsx';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={titleStyle}>
        <h1 style={{ margin: 0, fontSize: 18, letterSpacing: 1 }}>ORGAN EXPLORER</h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>Module 01 — The Heart</p>
      </div>
      <HeartScene />
    </div>
  );
}

const titleStyle = {
  position: 'absolute',
  top: 20,
  left: 24,
  color: '#e8f1ff',
  zIndex: 10,
  fontFamily: 'inherit',
};
