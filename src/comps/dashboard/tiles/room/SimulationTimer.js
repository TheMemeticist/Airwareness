import React, { useState, useEffect, useRef } from 'react';
import styles from './Room.module.css';
import { Timer as TimerIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const SimulationTimer = ({ speed }) => {
  const [time, setTime] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const timerRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prevTime => prevTime + (speed / 10));
    }, 100);

    return () => clearInterval(interval);
  }, [speed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        timerRef.current && 
        !timerRef.current.contains(event.target) &&
        sliderRef.current && 
        !sliderRef.current.contains(event.target)
      ) {
        setIsSliderVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleSlider = () => {
    setIsSliderVisible(prev => !prev);
  };

  return (
    <div className={styles['simulation-timer']} ref={timerRef}>
      <span className={styles['timer-text']}>{formatTime(time)}</span>
      <IconButton 
        onClick={toggleSlider}
        className={styles['timer-reset-button']}
        size="small"
      >
        <TimerIcon />
      </IconButton>
      {isSliderVisible && (
        <div className={styles['slider-speed']} ref={sliderRef}>
          {/* Slider component goes here */}
        </div>
      )}
    </div>
  );
};

export default SimulationTimer; 