import React, { useState, useEffect } from 'react';
import styles from './Room.module.css';
import { Timer as TimerIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const SimulationTimer = ({ speed }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prevTime => prevTime + (speed / 10));
    }, 100);

    return () => clearInterval(interval);
  }, [speed]);

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setTime(0);
  };

  return (
    <div className={styles['simulation-timer']}>
      <span className={styles['timer-text']}>{formatTime(time)}</span>
      <IconButton 
        onClick={handleReset}
        className={styles['timer-reset-button']}
        size="small"
      >
        <TimerIcon />
      </IconButton>
    </div>
  );
};

export default SimulationTimer; 