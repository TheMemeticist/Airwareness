import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud } from '@mui/icons-material';
import styles from './Clouds.module.css';
import { useAppContext } from '../../context/AppContext';

const CloudElement = ({ duration, size, yPosition, onComplete }) => {
  return (
    <div
      className={styles.cloud}
      style={{
        '--duration': `${duration}s`,
        top: `${yPosition}%`,
        '--cloud-scale': size,
      }}
      onAnimationEnd={onComplete}
    >
      <Cloud />
    </div>
  );
};

const Clouds = () => {
  const { state } = useAppContext();
  const cloudsRef = useRef([]);
  const [, forceUpdate] = useState({});
  
  const createCloud = useCallback(() => {
    return {
      duration: 60 * (0.85 + Math.random() * 0.3),
      size: 0.39 + Math.random() * 1.1,
      yPosition: Math.random() * 100,
      key: Date.now() + Math.random()
    };
  }, []);

  const removeCloud = useCallback((key) => {
    cloudsRef.current = cloudsRef.current.filter(cloud => cloud.key !== key);
    forceUpdate({});
  }, []);

  useEffect(() => {
    if (!state.splashScreenVisible) {
      const addCloudIfNeeded = () => {
        if (cloudsRef.current.length < 3) {
          cloudsRef.current = [...cloudsRef.current, createCloud()];
          forceUpdate({});
        }
      };

      const interval = setInterval(addCloudIfNeeded, 15000);
      addCloudIfNeeded(); // Add initial cloud

      return () => clearInterval(interval);
    }
  }, [createCloud, state.splashScreenVisible]);

  if (state.splashScreenVisible) return null;

  return (
    <div className={styles.cloudsContainer}>
      {cloudsRef.current.map(cloud => (
        <CloudElement 
          key={cloud.key} 
          {...cloud} 
          onComplete={() => removeCloud(cloud.key)}
        />
      ))}
    </div>
  );
};

export default Clouds; 