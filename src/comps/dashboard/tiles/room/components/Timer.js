import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Slider, Tooltip } from '@mui/material';
import { Speed as SpeedIcon, Restore as RestoreIcon } from '@mui/icons-material';
import { useAppContext } from '../../../../../context/AppContext';
import styles from '../Room.module.css';

const formatTime = (seconds) => {
  if (seconds < 60) {
    return { value: seconds.toFixed(1), unit: 'sec' };
  } else if (seconds < 3600) {
    return { value: (seconds / 60).toFixed(1), unit: 'min' };
  } else if (seconds < 86400) {
    return { value: (seconds / 3600).toFixed(1), unit: 'hr' };
  } else {
    return { value: (seconds / 86400).toFixed(1), unit: 'days' };
  }
};

export const Timer = ({ initialSpeed = 50, onSpeedChange }) => {
  const { state, dispatch } = useAppContext();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const speedDropdownRef = useRef(null);
  const speedButtonRef = useRef(null);

  useEffect(() => {
    if (state.timerReset) {
      resetTimer();
    }
  }, [state.timerReset]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      const interval = 1000 / speed;
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, interval);
      onSpeedChange(speed);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, speed, onSpeedChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        speedDropdownRef.current && 
        !speedDropdownRef.current.contains(event.target) &&
        speedButtonRef.current && 
        !speedButtonRef.current.contains(event.target)
      ) {
        setShowSpeedControl(false);
      }
    };

    if (showSpeedControl) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedControl]);

  const resetTimer = () => {
    setTime(0);
    dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 0 });
    requestAnimationFrame(() => {
      dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 1 });
    });
  };

  return (
    <div className={styles['timer-wrapper']}>
      <div className={styles['timer-container']}>
        <Tooltip title="Simulation Speed">
          <IconButton
            ref={speedButtonRef}
            className={styles['timer-button']}
            onClick={() => setShowSpeedControl(!showSpeedControl)}
            aria-label="Speed Control"
          >
            <SpeedIcon className={styles['timer-icon']} />
          </IconButton>
        </Tooltip>

        <div className={styles['timer-display']}>
          <span className={styles['timer-value']}>{formatTime(time).value}</span>
          <span className={styles['timer-unit']}>{formatTime(time).unit}</span>
        </div>

        <Tooltip title="Reset Timer">
          <IconButton
            className={styles['timer-button']}
            onClick={resetTimer}
            aria-label="Reset Timer"
          >
            <RestoreIcon className={styles['timer-icon']} />
          </IconButton>
        </Tooltip>

        <div 
          ref={speedDropdownRef}
          className={`${styles['speed-dropdown']} ${showSpeedControl ? styles['show'] : ''}`}
        >
          <div className={styles['speed-label']}>Speed</div>
          <Slider
            orientation="vertical"
            value={speed}
            onChange={(_, newValue) => setSpeed(newValue)}
            min={1}
            max={100}
            aria-label="Speed"
            valueLabelDisplay="auto"
            marks={[
              { value: 1, label: '1x' },
              { value: 50, label: '50x' },
              { value: 100, label: '100x' }
            ]}
            className={styles['speed-dropdown-slider']}
          />
        </div>
      </div>
    </div>
  );
};