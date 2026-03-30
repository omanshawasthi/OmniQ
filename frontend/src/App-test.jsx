import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue', fontSize: '48px' }}>QUEUELESS</h1>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        Smart Queue Management System
      </p>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h2>Features:</h2>
        <ul>
          <li>Smart Queue Management</li>
          <li>Multi-Branch Support</li>
          <li>Mobile First Design</li>
          <li>Real-time Updates</li>
        </ul>
      </div>
      <button style={{
        padding: '12px 24px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer'
      }}>
        Get Started
      </button>
    </div>
  )
}

export default App
