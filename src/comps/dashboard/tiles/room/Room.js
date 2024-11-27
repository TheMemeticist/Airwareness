import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import ThreeDScene from './3DScene/3Dscene'; // Import the new component
import { TextField, Box, Button, IconButton, Slider, Tooltip } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';
import { debounce } from 'lodash'; // Import debounce from lodash
import ReactDOM from 'react-dom';
import { Settings as SettingsIcon, ArrowUpward, ArrowDownward, Speed as SpeedIcon, Restore as RestoreIcon } from '@mui/icons-material';
import RoomSettings from './settings/RoomSettings';

// Custom arrow down icon
const ArrowDownIcon = () => (
  <svg
    className={styles['select-icon']}
    focusable="false"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M7 10l5 5 5-5z"></path>
  </svg>
);

// Memoize expensive calculations
const calculateDimensions = (floorArea, height) => ({
  height: parseFloat(height) || 0,
  floorArea: parseFloat(floorArea) || 0,
  sideLength: Math.sqrt(parseFloat(floorArea)) || 0,
  width: Math.sqrt(parseFloat(floorArea)) || 0,
  length: Math.sqrt(parseFloat(floorArea)) || 0
});

// Memoize conversion function
const toMeters = {
  length: (ft) => ft * 0.3048,
  area: (sqft) => sqft * 0.092903
};

const Timer = ({ speed = 1 }) => {
  const { state, dispatch } = useAppContext();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Add effect to listen for timer reset
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
    }
    return () => clearInterval(intervalId);
  }, [isRunning, speed]);

  const resetTimer = () => {
    setTime(0);
    // Reset particles by triggering a quick update cycle
    dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 0 });
    requestAnimationFrame(() => {
      dispatch({ type: 'UPDATE_INFECTIOUS_COUNT', payload: 1 });
    });
  };

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(2)} seconds`;
    } else if (seconds < 3600) {
      const minutes = (seconds / 60).toFixed(2);
      return `${minutes} minutes`;
    } else if (seconds < 86400) {
      const hours = (seconds / 3600).toFixed(2);
      return `${hours} hours`;
    } else {
      const days = (seconds / 86400).toFixed(2);
      return `${days} days`;
    }
  };

  return (
    <div className={styles['timer-container']}>
      <span className={styles['timer-display']}>
        {formatTime(time)}
      </span>
      <Tooltip 
        title="Reset Simulation" 
        placement="bottom"
        sx={{
          fontSize: '14px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          '& .MuiTooltip-arrow': {
            color: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <IconButton
          className={styles['timer-reset-button']}
          onClick={resetTimer}
          aria-label="Reset Timer"
          sx={{ 
            '&:hover': {
              color: 'var(--bright-yellow)',
              backgroundColor: 'rgba(221, 193, 19, 0.1)'
            }
          }}
        >
          <RestoreIcon sx={{ 
            width: '32px', 
            height: '32px' 
          }} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const Room = React.memo(({ buildingId, roomId, children }) => {
  const { state, dispatch } = useAppContext();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeed] = useState(30);
  
  // Memoize building and rooms lookup
  const { building, rooms } = useMemo(() => {
    const building = state.buildings.find(b => b.id === buildingId);
    return {
      building,
      rooms: building?.rooms || []
    };
  }, [state.buildings, buildingId]);

  // Memoize room lookup
  const room = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  // Initialize input values with room data
  const [inputValues, setInputValues] = useState({
    height: room?.height || '',
    floorArea: room?.floorArea || ''
  });

  // Update input values when room changes
  useEffect(() => {
    if (room) {
      setInputValues({
        height: room.height || '',
        floorArea: room.floorArea || ''
      });
    }
  }, [room]);

  // Memoize dimensions calculations
  const dimensions = useMemo(() => 
    calculateDimensions(room?.floorArea, room?.height),
    [room?.floorArea, room?.height]
  );

  // Debounce dimension updates
  const debouncedDimensionUpdate = useMemo(() => 
    debounce((newDimensions) => {
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          buildingId,
          roomId: selectedRoomId,
          roomData: newDimensions
        }
      });
    }, 100),
    [buildingId, selectedRoomId, dispatch]
  );

  // Optimize input handler with batched updates
  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    
    // Batch state updates
    ReactDOM.unstable_batchedUpdates(() => {
      setInputValues(prev => ({...prev, [field]: value}));
      
      const newDimensions = calculateDimensions(
        field === 'floorArea' ? value : inputValues.floorArea,
        field === 'height' ? value : inputValues.height
      );
      
      debouncedDimensionUpdate(newDimensions);
    });
  }, [buildingId, selectedRoomId, inputValues, dispatch]);

  // Cleanup debounced function
  useEffect(() => {
    return () => debouncedDimensionUpdate.cancel();
  }, [debouncedDimensionUpdate]);

  // Memoize room actions with rooms dependency
  const roomActions = useMemo(() => ({
    createNewRoom: () => {
      const newRoomId = String(Date.now());
      dispatch({
        type: 'ADD_ROOM',
        payload: {
          buildingId,
          room: {
            id: newRoomId,
            name: `${room?.name || 'New Room'} (copy)`,
            height: room?.height || '',
            floorArea: room?.floorArea || '',
          },
        },
      });
      setSelectedRoomId(newRoomId);
    },
    deleteRoom: () => {
      if (rooms.length <= 1) return;
      dispatch({
        type: 'DELETE_ROOM',
        payload: { buildingId, roomId: selectedRoomId }
      });
      setSelectedRoomId(rooms[0].id);
    }
  }), [buildingId, room, rooms, selectedRoomId, dispatch]);

  useEffect(() => {
    setSelectedRoomId(roomId);
  }, [roomId]);

  // Handler for room name changes
  const handleRoomNameChange = useCallback((roomId, newName) => {
    dispatch({
      type: 'UPDATE_ROOM',
      payload: {
        buildingId,
        roomId,
        roomData: { name: newName }
      }
    });
  }, [buildingId, dispatch]);

  // Handler for incrementing a field
  const handleIncrement = (field) => () => {
    const step = field === 'height' ? 5 : 500;
    const currentValue = parseFloat(inputValues[field]) || 0;
    const newValue = currentValue + step;
    handleInputChange(field)({ target: { value: newValue } });
  };

  // Handler for decrementing a field
  const handleDecrement = (field) => () => {
    const step = field === 'height' ? 5 : 500;
    const currentValue = parseFloat(inputValues[field]) || 0;
    const newValue = currentValue - step >= 0 ? currentValue - step : 0;
    handleInputChange(field)({ target: { value: newValue } });
  };

  if (!room) {
    return (
      <Tile title="Room Not Found" isRoomTile={true}>
        <div className={tileStyles['tile-content']}>
          <p>Unable to find room data. Please check the provided building and room IDs.</p>
          <p>Building ID: {buildingId}</p>
          <p>Room ID: {roomId}</p>
        </div>
      </Tile>
    );
  }

  const { name, height, floorArea } = room;

  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
  };

  const helpText = "Use this tool to edit room attributes such as size and ventilation rate (natural or HVAC). This helps provide more accurate air quality estimates.";

  // Convert dimensions from feet to meters
  const dimensionsInMeters = {
    height: dimensions.height * 0.3048,
    floorArea: dimensions.floorArea * 0.092903,
    sideLength: dimensions.sideLength * 0.3048
  };

  return (
    <Tile
      title={
        <Box className={styles['room-title-container']}>
          <span className={styles['room-name']}>{room?.name}</span>
        </Box>
      }
      helptxt={helpText}
      isRoomTile={true}
      collapsible={false}
    >
      <div className={`${tileStyles['tile-content']} ${styles['room-content']}`}>
        <Button
          className={styles['settings-button']}
          onClick={() => setSettingsOpen(true)}
          aria-label="Room Settings"
        >
          <SettingsIcon />
        </Button>
        <Timer speed={speed} />

        {room ? (
          <>
            <div className={styles['room-image-container']}>
              <ThreeDScene
                dimensions={{
                  width: dimensions.width,
                  length: dimensions.length,
                  height: dimensions.height
                }}
                simulationSpeed={speed}
              />
            </div>
            <div className={styles['speed-slider-container']}>
              <div className={styles['speed-label-top']}>Sim Speed</div>
              <Slider
                className={styles['speed-slider']}
                orientation="vertical"
                value={speed}
                onChange={(_, newValue) => setSpeed(newValue)}
                min={1}
                max={50}
                aria-label="Speed"
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1x' },
                  { value: 50, label: '50x' }
                ]}
              />
            </div>
            <div className={styles['room-params']}>
              {/* Height Input - Now in its own container */}
              <div className={styles['height-input-container']}>
                <div className={styles['room-input-container']}>
                  <TextField
                    className={`${tileStyles['tile-text-field']} ${styles['room-input']}`}
                    label="Height (ft)"
                    type="number"
                    value={inputValues.height}
                    onChange={handleInputChange('height')}
                    variant="outlined"
                    size="small"
                    inputProps={{ step: 5 }}
                    InputProps={{
                      className: styles['hide-spin-buttons']
                    }}
                  />
                  <div className={styles['custom-arrows']}>
                    <IconButton
                      className={`${styles['custom-arrow']} ${styles['custom-arrow-up']}`}
                      onClick={handleIncrement('height')}
                      aria-label="Increase Height"
                      size="small"
                    >
                      <ArrowUpward fontSize="small" sx={{ color: 'var(--off-white)' }} />
                    </IconButton>
                    <IconButton
                      className={`${styles['custom-arrow']} ${styles['custom-arrow-down']}`}
                      onClick={handleDecrement('height')}
                      aria-label="Decrease Height"
                      size="small"
                    >
                      <ArrowDownward fontSize="small" sx={{ color: 'var(--off-white)' }} />
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Floor Area Input - Now in its own container */}
              <div className={styles['floor-area-input-container']}>
                <div className={styles['room-input-container']}>
                  <TextField
                    className={`${tileStyles['tile-text-field']} ${styles['room-input']}`}
                    label="Floor Area (ft²)"
                    type="number"
                    value={inputValues.floorArea}
                    onChange={handleInputChange('floorArea')}
                    variant="outlined"
                    size="small"
                    inputProps={{ step: 500 }}
                    InputProps={{
                      className: styles['hide-spin-buttons']
                    }}
                  />
                  <div className={styles['custom-arrows']}>
                    <IconButton
                      className={`${styles['custom-arrow']} ${styles['custom-arrow-up']}`}
                      onClick={handleIncrement('floorArea')}
                      aria-label="Increase Floor Area"
                      size="small"
                    >
                      <ArrowUpward fontSize="small" sx={{ color: 'var(--off-white)' }} />
                    </IconButton>
                    <IconButton
                      className={`${styles['custom-arrow']} ${styles['custom-arrow-down']}`}
                      onClick={handleDecrement('floorArea')}
                      aria-label="Decrease Floor Area"
                      size="small"
                    >
                      <ArrowDownward fontSize="small" sx={{ color: 'var(--off-white)' }} />
                    </IconButton>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles['room-icons-container']}>
              {children}
            </div>
          </>
        ) : (
          <p>Please select a room or create a new one.</p>
        )}

        <RoomSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          selectedRoomId={selectedRoomId}
          rooms={rooms}
          onRoomChange={(newRoomId) => {
            setSelectedRoomId(newRoomId);
            setSettingsOpen(false);
          }}
          onCreateRoom={roomActions.createNewRoom}
          onDeleteRoom={roomActions.deleteRoom}
          onRoomNameChange={handleRoomNameChange}
        />
      </div>
    </Tile>
  );
});

export default Room;