import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud } from '@mui/icons-material';
import styles from './Clouds.module.css';

const CloudElement = ({ duration, size, yPosition, initialPosition, startProgress, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration * (1 - startProgress) * 1000);
    
    return () => clearTimeout(timer);
  }, [duration, startProgress, onComplete]);

  return (
    <div
      className={styles.cloud}
      style={{
        '--duration': `${duration}s`,
        '--start-progress': startProgress,
        top: `${yPosition}%`,
        '--cloud-scale': size,
        '--initial-position': `${initialPosition}%`
      }}
    >
      <Cloud />
    </div>
  );
};

const Clouds = () => {
  const cloudsRef = useRef([]);
  const [, forceUpdate] = useState({});
  
  const createCloud = useCallback((isInitial = false) => {
    const initialPos = Math.random() * 100;
    const distanceToTravel = 110 - initialPos;
    const baseSpeed = 0.15;
    const speedVariation = baseSpeed * (0.8 + Math.random() * 0.4);
    const duration = distanceToTravel / speedVariation;
    
    return {
      duration,
      startProgress: Math.random(),
      size: 0.39 + Math.random() * 1.1,
      yPosition: Math.random() * 100,
      initialPosition: initialPos,
      key: Date.now()
    };
  }, []);

  const removeCloud = useCallback((key) => {
    cloudsRef.current = cloudsRef.current.filter(cloud => cloud.key !== key);
    forceUpdate({});
  }, []);

  useEffect(() => {
    const addCloudIfNeeded = () => {
      if (cloudsRef.current.length < 3) {
        cloudsRef.current = [...cloudsRef.current, createCloud(cloudsRef.current.length === 0)];
        forceUpdate({});
      }
    };

    const interval = setInterval(addCloudIfNeeded, 5000);
    addCloudIfNeeded(); // Add initial cloud

    return () => clearInterval(interval);
  }, [createCloud]);

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