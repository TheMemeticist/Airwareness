import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud } from '@mui/icons-material';
import styles from './Clouds.module.css';

const CloudElement = ({ delay, duration, size, yPosition, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, (delay + duration) * 1000);
    
    return () => clearTimeout(timer);
  }, [delay, duration, onComplete]);

  return (
    <div
      className={styles.cloud}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        top: `${yPosition}%`,
        '--cloud-scale': size
      }}
    >
      <Cloud />
    </div>
  );
};

const Clouds = () => {
  const cloudsRef = useRef([]);
  const [, forceUpdate] = useState({});
  
  const createCloud = useCallback(() => ({
    duration: 80 + Math.random() * 60,
    delay: Math.random() * (80 + Math.random() * 60),
    size: 1 + Math.random() * 2,
    yPosition: Math.random() * 100,
    key: Date.now()
  }), []);

  const removeCloud = useCallback((key) => {
    cloudsRef.current = cloudsRef.current.filter(cloud => cloud.key !== key);
    forceUpdate({});
  }, []);

  useEffect(() => {
    const addCloudIfNeeded = () => {
      if (cloudsRef.current.length < 3) {
        cloudsRef.current = [...cloudsRef.current, createCloud()];
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