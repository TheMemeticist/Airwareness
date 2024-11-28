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
    const seconds = (timeInSeconds % 60).toFixed(2);
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.padStart(5, '0')
    };
  };

  const toggleSlider = () => {
    setIsSliderVisible(prev => !prev);
  };

  return (
    <div className={styles['timer-container']} ref={timerRef}>
      <div className={styles['timer-display']}>
        <span className={styles['time-group']}>
          <span className={styles['time-value']}>{formatTime(time).hours}</span>
          <span className={styles['time-unit']}>h</span>
        </span>
        <span className={styles['time-separator']}>:</span>
        <span className={styles['time-group']}>
          <span className={styles['time-value']}>{formatTime(time).minutes}</span>
          <span className={styles['time-unit']}>m</span>
        </span>
        <span className={styles['time-separator']}>:</span>
        <span className={styles['time-group']}>
          <span className={styles['time-value']}>{formatTime(time).seconds}</span>
          <span className={styles['time-unit']}>s</span>
        </span>
      </div>
      <div className={styles['timer-label']}>Elapsed Time</div>
      <IconButton 
        onClick={toggleSlider}
        className={styles['timer-button']}
        size="small"
        title="Adjust simulation speed"
      >
        <TimerIcon className={styles['timer-icon']} />
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