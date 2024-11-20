import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import ThreeDScene from './3DScene/3Dscene'; // Import the new component
import { TextField, Box, Select, MenuItem, Button, FormControl, InputLabel } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';
import { debounce } from 'lodash'; // Import debounce from lodash
import ReactDOM from 'react-dom';

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

const Room = React.memo(({ buildingId, roomId, children }) => {
  const { state, dispatch } = useAppContext();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId);
  
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
  }, []);

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
          <FormControl variant="outlined" size="small" className={styles['room-select-container']}>
            <InputLabel id="room-select-label" className={styles['room-select-label']}>Room</InputLabel>
            <Select
              labelId="room-select-label"
              id="room-select"
              value={selectedRoomId}
              onChange={handleRoomChange}
              label="Select a Room"
              className={styles['room-select']}
              IconComponent={ArrowDownIcon}
            >
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box className={styles['room-actions-container']}>
            <Box className={styles['room-actions']}>
              <Button
                variant="contained"
                onClick={roomActions.createNewRoom}
                className={`${styles['action-button']} ${styles['add-room-button']}`}
              >
                <span className={styles['button-content']}>+</span>
              </Button>
              {rooms.length > 1 && (
                <Button
                  variant="contained"
                  onClick={roomActions.deleteRoom}
                  className={`${styles['action-button']} ${styles['delete-room-button']}`}
                >
                  <span className={styles['button-content']}>-</span>
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      }
      helptxt={helpText}
      isRoomTile={true}
      collapsible={false}
    >
      <div className={`${tileStyles['tile-content']} ${styles['room-content']}`}>
        {room ? (
          <>
            <div className={styles['room-image-container']}>
              <ThreeDScene
                dimensions={{
                  width: dimensions.width,
                  length: dimensions.length,
                  height: dimensions.height
                }}
              />
            </div>
            <div className={styles['room-params']}>
              <TextField
                className={`${tileStyles['tile-text-field']} ${styles['room-input']}`}
                label="Height (ft)"
                type="number"
                value={inputValues.height}
                onChange={handleInputChange('height')}
                variant="outlined"
                size="small"
                inputProps={{ step: 5 }}
              />
              <TextField
                className={`${tileStyles['tile-text-field']} ${styles['room-input']}`}
                label="Floor Area (ft²)"
                type="number"
                value={inputValues.floorArea}
                onChange={handleInputChange('floorArea')}
                variant="outlined"
                size="small"
                inputProps={{ step: 500 }}
              />
            </div>
            <div className={styles['room-icons-container']}>
              {children}
            </div>
          </>
        ) : (
          <p>Please select a room or create a new one.</p>
        )}
      </div>
    </Tile>
  );
});

export default Room;