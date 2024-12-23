import React from 'react';
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Button,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './RoomSettings.module.css';

const RoomSettings = ({ 
  open, 
  onClose, 
  selectedRoomId, 
  rooms, 
  onRoomChange,
  onCreateRoom,
  onDeleteRoom,
  onRoomNameChange
}) => {
  if (!open) return null;

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <h3>Room Settings</h3>
        <IconButton onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className={styles.settingsContent}>
        <Box className={styles.roomSelector}>
          <FormControl fullWidth size="small">
            <InputLabel id="room-settings-select-label">Room</InputLabel>
            <Select
              labelId="room-settings-select-label"
              value={selectedRoomId}
              onChange={(e) => onRoomChange(e.target.value)}
              label="Room"
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box className={styles.roomActions}>
            <Button
              variant="contained"
              onClick={onCreateRoom}
              className={`${styles.actionButton} ${styles.addRoomButton}`}
            >
              <span className={styles.buttonContent}>+</span>
            </Button>
            {rooms.length > 1 && (
              <Button
                variant="contained"
                onClick={onDeleteRoom}
                className={`${styles.actionButton} ${styles.deleteRoomButton}`}
              >
                <span className={styles.buttonContent}>-</span>
              </Button>
            )}
          </Box>
        </Box>
        
        {selectedRoomId && (
          <TextField
            size="small"
            label="Room Name"
            value={selectedRoom?.name || ''}
            onChange={(e) => onRoomNameChange(selectedRoomId, e.target.value)}
            className={styles.roomNameInput}
            fullWidth
          />
        )}
      </div>
    </div>
  );
};

export default RoomSettings; 