import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';

const NetworkToggle = () => {
  const { network, toggleNetwork } = useNetwork();
  
  return (
    <div 
      className="network-toggle" 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        backgroundColor: network === 'mainnet' ? '#00C08B' : '#F5A623',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
      }}
      onClick={toggleNetwork}
    >
      <div style={{ marginRight: '8px' }}>
        {network === 'mainnet' ? '🌐' : '🧪'}
      </div>
      {network === 'mainnet' ? 'MAINNET' : 'TESTNET'}
      <div style={{ 
        marginLeft: '8px', 
        fontSize: '12px', 
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '2px 4px',
        borderRadius: '4px'
      }}>
        Click to Toggle
      </div>
    </div>
  );
};

export default NetworkToggle; 