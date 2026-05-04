import React, { useState, useEffect } from 'react';
import './styles/global.css';

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('✅ App mounted');
  }, []);

  console.log('🔄 App render:', count);

  return (
    <div className="app" style={{ padding: '20px' }}>
      <h1>Karbure - Test de stabilité</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <p>Si ce compteur fonctionne normalement, le problème vient des hooks.</p>
    </div>
  );
}

export default App;