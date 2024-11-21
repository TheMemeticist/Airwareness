import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud } from '@mui/icons-material';
import styles from './Clouds.module.css';

const CloudElement = ({ duration, size, yPosition, initialPosition, startProgress, onComplete, isInitialPhase }) => {
  const handleAnimationEnd = (e) => {
    if (e.animationName === styles.moveCloud) {
      onComplete();
    }
  };

  return (
    <div
      className={`${styles.cloud} ${isInitialPhase ? styles.initialCloud : ''}`}
      style={{
        '--duration': `${duration}s`,
        '--start-progress': startProgress,
        top: `${yPosition}%`,
        '--cloud-scale': size,
        '--initial-position': `${initialPosition}%`
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <Cloud />
    </div>
  );
};

const Clouds = () => {
  const cloudsRef = useRef([]);
  const [isInitialPhase, setIsInitialPhase] = useState(true);
  const [, forceUpdate] = useState({});
  
  const createCloud = useCallback((isInitial = false) => {
    return {
      duration: 60 * (0.85 + Math.random() * 0.3),
      startProgress: 0,
      size: 0.39 + Math.random() * 1.1,
      yPosition: Math.random() * 100,
      initialPosition: -20,
      key: Date.now() + Math.random()
    };
  }, []);

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

    const interval = setInterval(addCloudIfNeeded, 15000);
    addCloudIfNeeded(); // Add initial cloud

    return () => clearInterval(interval);
  }, [createCloud]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialPhase(false);
    }, 7500); // Match the splash screen fade out timing

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.cloudsContainer} ${!isInitialPhase ? styles.afterSplash : ''}`}>
      {cloudsRef.current.map(cloud => (
        <CloudElement 
          key={cloud.key} 
          {...cloud} 
          isInitialPhase={isInitialPhase}
          onComplete={() => removeCloud(cloud.key)}
        />
      ))}
    </div>
  );
};

export default Clouds; 