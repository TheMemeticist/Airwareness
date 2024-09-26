import React, { useState, useEffect } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import ThreeDScene from './3DScene/3Dscene'; // Import the new component
import { TextField, Box, Select, MenuItem, Button, FormControl, InputLabel } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';
import { debounce } from 'lodash'; // Import debounce from lodash

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

const Room = ({ buildingId, roomId, children }) => {
  const { state, dispatch } = useAppContext();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId);
  const [dimensions, setDimensions] = useState({ height: 0, floorArea: 0, sideLength: 0 }); // Add state for dimensions

  const building = state.buildings.find(b => b.id === buildingId);
  const rooms = building?.rooms || [];
  const room = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    setSelectedRoomId(roomId);
  }, [roomId]);

  useEffect(() => {
    if (room) {
      console.log('Room data:', room);
      const sideLength = Math.sqrt(room.floorArea);
      setDimensions({
        height: isNaN(room.height) ? 0 : room.height,
        floorArea: isNaN(room.floorArea) ? 0 : room.floorArea,
        sideLength: isNaN(sideLength) ? 0 : sideLength,
        width: isNaN(sideLength) ? 0 : sideLength,
        length: isNaN(sideLength) ? 0 : sideLength
      });
    }
  }, [room]);

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

  const updateRoom = debounce((field, value) => {
    console.log(`Updating ${field} to ${value}`);
    dispatch({
      type: 'UPDATE_ROOM',
      payload: {
        buildingId,
        roomId: selectedRoomId,
        roomData: { [field]: value }
      }
    });
    setDimensions(prev => {
      const newDimensions = { ...prev, [field]: value };
      if (field === 'floorArea') {
        newDimensions.sideLength = Math.sqrt(value); // Update side length when floor area changes
      }
      return newDimensions;
    }); // Update dimensions state
  }, 300); // Debounce with 300ms delay

  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
  };

  const createNewRoom = () => {
    const newRoomId = String(Date.now());
    const newRoom = {
      id: newRoomId,
      name: `${room.name} (copy)`,
      height: room.height || '',
      floorArea: room.floorArea || '',
    };
    dispatch({
      type: 'ADD_ROOM',
      payload: {
        buildingId,
        room: newRoom,
      },
    });
    setSelectedRoomId(newRoomId);
  };

  const deleteRoom = () => {
    if (rooms.length <= 1) return;
    const newRooms = rooms.filter(r => r.id !== selectedRoomId);
    dispatch({
      type: 'DELETE_ROOM',
      payload: {
        buildingId,
        roomId: selectedRoomId,
      },
    });
    setSelectedRoomId(newRooms[0].id);
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
                onClick={createNewRoom}
                className={`${styles['action-button']} ${styles['add-room-button']}`}
              >
                <span className={styles['button-content']}>+</span>
              </Button>
              {rooms.length > 1 && (
                <Button
                  variant="contained"
                  onClick={deleteRoom}
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
      collapsible={false}  // Add this line
    >
      <div className={`${tileStyles['tile-content']} ${styles['room-content']}`}>
        {room ? (
          <>
            <div className={styles['room-image-container']}>
              <ThreeDScene
                title="Room"
                size={200}
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
                value={room.height || ''}
                onChange={(e) => updateRoom('height', e.target.value)}
                variant="outlined"
                size="small"
              />
              <TextField
                className={`${tileStyles['tile-text-field']} ${styles['room-input']}`}
                label="Floor Area (ft²)"
                type="number"
                value={room.floorArea || ''}
                onChange={(e) => updateRoom('floorArea', e.target.value)}
                variant="outlined"
                size="small"
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
};

export default Room;