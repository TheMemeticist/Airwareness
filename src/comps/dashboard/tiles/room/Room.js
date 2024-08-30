import React, { useState } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import roomImage from './iso-metric-classroom.png';
import { TextField, Box, Select, MenuItem, Button, FormControl, InputLabel } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';

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

  const building = state.buildings.find(b => b.id === buildingId);
  const rooms = building?.rooms || [];
  const room = rooms.find(r => r.id === selectedRoomId);

  if (!room) {
    return (
      <Tile title="Room Not Found">
        <div className={tileStyles['tile-content']}>
          <p>Unable to find room data. Please check the provided building and room IDs.</p>
          <p>Building ID: {buildingId}</p>
          <p>Room ID: {roomId}</p>
        </div>
      </Tile>
    );
  }

  const { name, height, floorArea } = room;

  const updateRoom = (field, value) => {
    console.log(`Updating ${field} to ${value}`);
    dispatch({
      type: 'UPDATE_ROOM',
      payload: {
        buildingId,
        roomId: selectedRoomId,  // Use selectedRoomId instead of roomId
        roomData: { [field]: value }
      }
    });
  };

  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
  };

  const createNewRoom = () => {
    const newRoomId = String(Date.now());
    const newRoom = {
      id: newRoomId,
      name: `New Room ${rooms.length + 1}`,
      height: room.height || '',
      floorArea: room.floorArea || '',
      // Add any other attributes you want to copy here
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

  return (
    <Tile title={
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
    } helptxt={helpText}>
      <div className={tileStyles['tile-content']}>
        {room ? (
          <>
            <img src={roomImage} alt="Room" className={styles['room-image']} />
            <Box display="flex" flexDirection="row" className={styles['room-params']} gap={2}>
              <Box flex={1}>
                <TextField
                  className={tileStyles['tile-text-field']}
                  label="Height (ft)"
                  type="number"
                  value={room.height || ''}
                  onChange={(e) => updateRoom('height', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box flex={1}>
                <TextField
                  className={tileStyles['tile-text-field']}
                  label="Floor Area (ft²)"
                  type="number"
                  value={room.floorArea || ''}
                  onChange={(e) => updateRoom('floorArea', e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
            {children}
          </>
        ) : (
          <p>Please select a room or create a new one.</p>
        )}
      </div>
    </Tile>
  );
};

export default Room;