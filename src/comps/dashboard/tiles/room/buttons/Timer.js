import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Speed as SpeedIcon,
  Restore as RestoreIcon,
  FastForward,
  FastRewind,
  DirectionsRun as VacateIcon
} from '@mui/icons-material';
import { useAppContext } from '../../../../../context/AppContext';
import styles from './Timer.module.css';

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

export const Timer = ({ initialSpeed = 80, onSpeedChange, roomId, buildingId }) => {
  const { state, dispatch } = useAppContext();
  const [displayTime, setDisplayTime] = useState(0);
  const timeRef = useRef(0);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(initialSpeed);

  // Get the current room's vacated state
  const room = state.buildings
    .find(b => b.id === buildingId)
    ?.rooms.find(r => r.id === roomId);
  const isVacated = room?.vacated || false;

  useEffect(() => {
    if (state.timerReset) {
      resetTimer();

    }
  }, [state.timerReset]);

  useEffect(() => {
    let intervalId;
    let displayIntervalId;

    if (isRunning) {
      // Use a fixed interval of 16ms (approximately 60fps)
      // But increment by an amount proportional to the speed
      intervalId = setInterval(() => {
        const increment = speed / 60; // Convert speed to increment per frame
        timeRef.current += increment;
      }, 16);

      // Keep display updates at 2-second intervals
      displayIntervalId = setInterval(() => {
        setDisplayTime(timeRef.current);
        dispatch({
          type: 'UPDATE_EXPOSURE_TIME',
          payload: timeRef.current / 3600
        });
      }, 2000);

      onSpeedChange(speed);
    }

    return () => {
      clearInterval(intervalId);
      clearInterval(displayIntervalId);
    };
  }, [isRunning, speed, onSpeedChange, dispatch]);

  const resetTimer = () => {
    timeRef.current = 0;
    setDisplayTime(0);
    // Reset exposure time first
    dispatch({
      type: 'UPDATE_EXPOSURE_TIME',
      payload: 0
    });
    // Reset infectious count
    dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 0 });
    dispatch({ type: 'RESET_GRAPH_DATA' });
    requestAnimationFrame(() => {
      dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 1 });
    });
    
    // Reset vacated state to false if room is currently vacated
    if (isVacated) {
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          buildingId,
          roomId,
          roomData: {
            ...room,
            vacated: false
          }
        }
      });
    }
  };

  const handleVacate = () => {
    console.log('Vacating room:', !isVacated);
    
    // Reset timer when un-vacating the room
    if (isVacated) {
      resetTimer();
    }
    
    dispatch({
      type: 'UPDATE_ROOM',
      payload: {
        buildingId,
        roomId,
        roomData: {
          ...room,
          vacated: !isVacated
        }
      }
    });
  };

  const adjustSpeed = (multiplier) => {
    const newSpeed = Math.max(1, Math.round(speed * multiplier));
    setSpeed(newSpeed);
  };

  const handleSpeedInputChange = (event) => {
    const value = Math.max(1, Math.round(Number(event.target.value)));
    setSpeed(value);
  };

  return (
    <div className={styles['timer-wrapper']}>
      <div className={styles['timer-container']}>
        <div className={styles['timer-row']}>
          <Tooltip title="Reset Timer: Resets the simulation to the initial state.">
            <IconButton
              className={styles['timer-button']}
              onClick={resetTimer}
              aria-label="Reset Timer"
            >
              <RestoreIcon className={styles['timer-icon']} />
            </IconButton>
          </Tooltip>
          <div className={styles['timer-display']}>
            <span className={styles['timer-value']}>{formatTime(displayTime).value}</span>
            <span className={styles['timer-unit']}>{formatTime(displayTime).unit}</span>
          </div>
          <Tooltip title="Vacate Room: Stops pathogen generation. As if infected people vacated the room. Watch risk decay over time.">
            <IconButton
              className={`${styles['timer-button']} ${isVacated ? styles['active'] : ''}`}
              onClick={handleVacate}
              aria-label="Vacate"
            >
              <VacateIcon className={`${styles['timer-icon']} ${styles['vacate-icon']}`} />
            </IconButton>
          </Tooltip>
        </div>

        <div className={styles['speed-controls-wrapper']}>
          <div className={styles['speed-controls']}>
            <IconButton
              className={styles['timer-button']}
              onClick={() => adjustSpeed(0.61)}
              aria-label="Decrease Speed"
            >
              <FastRewind className={styles['timer-icon']} />
            </IconButton>

            <div className={styles['speed-input-container']}>
              <input
                type="number"
                min="1"
                value={speed}
                onChange={handleSpeedInputChange}
                className={styles['speed-input']}
              />
              <span className={styles['speed-label']}>speed multiplier</span>
            </div>

            <IconButton
              className={styles['timer-button']}
              onClick={() => adjustSpeed(1.61)}
              aria-label="Increase Speed"
            >
              <FastForward className={styles['timer-icon']} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};