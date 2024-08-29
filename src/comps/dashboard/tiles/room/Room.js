import React, { useEffect } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import roomImage from './iso-metric-classroom.png';
import { TextField, Box } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';

const Room = ({ title, children }) => {
  const { state, dispatch } = useAppContext();
  const { height, floorArea } = state.room || {};

  useEffect(() => {
    console.log('Room state:', state.room);
  }, [state.room]);

  const updateRoom = (field, value) => {
    console.log(`Updating ${field} to ${value}`);
    dispatch({ type: 'UPDATE_ROOM', payload: { [field]: value } });
  };

  const helpText = "Use this tool to edit room attributes such as size and ventilation rate (natural or HVAC). This helps provide more accurate air quality estimates.";

  return (
    <Tile title="Room" helptxt={helpText}>
      <div className={tileStyles['tile-content']}>
        <img src={roomImage} alt="Room" className={styles['room-image']} />
        <Box display="flex" flexDirection="row" className={styles['room-params']} gap={2}>
          <Box flex={1}>
            <TextField
              className={tileStyles['tile-text-field']}
              label="Height (ft)"
              type="number"
              value={height || ''}
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
              value={floorArea || ''}
              onChange={(e) => updateRoom('floorArea', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
        {children}
      </div>
    </Tile>
  );
};

export default Room;