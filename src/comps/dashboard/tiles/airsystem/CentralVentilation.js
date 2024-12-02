import React, { useState, useMemo } from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import { TextField, Box, IconButton, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Air } from '@mui/icons-material';
import { useAppContext } from '../../../../context/AppContext';

const CentralVentilation = () => {
  const { state, dispatch } = useAppContext();
  const [ach, setAch] = useState(state.ventilationRate?.toString() || '1'); // Get initial value from global state

  // Calculate CFM per person
  const cfmPerPerson = useMemo(() => {
    // Get the active building and room
    const activeBuilding = state.buildings.find(b => b.rooms.length > 0);
    const activeRoom = activeBuilding?.rooms[0];
    
    if (!activeRoom?.height || !activeRoom?.floorArea || !activeRoom?.occupants?.groups) {
      return 0;
    }

    // Calculate room volume in cubic feet (convert from meters if necessary)
    const roomVolume = parseFloat(activeRoom.height) * parseFloat(activeRoom.floorArea);
    
    // Calculate total occupants
    const totalOccupants = activeRoom.occupants.groups.reduce(
      (sum, group) => sum + (group.count || 0), 
      0
    );

    if (totalOccupants === 0) return 0;

    // Convert ACH to CFM per person
    // CFM = (ACH * Room Volume) / (60 minutes)
    const totalCFM = (parseFloat(ach) * roomVolume) / 60;
    return Math.round(totalCFM / totalOccupants);
  }, [ach, state.buildings]);

  const increaseAch = () => {
    const newValue = (parseFloat(ach) + 1).toFixed(1);
    setAch(newValue);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(newValue) });
  };

  const decreaseAch = () => {
    const newValue = Math.max(0, parseFloat(ach) - 1).toFixed(1);
    setAch(newValue);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(newValue) });
  };

  const handleAchChange = (e) => {
    setAch(e.target.value);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(e.target.value) });
  };

  return (
    <Tile 
      title="Central Ventilation" 
      helptxt="This represents a central HVAC system."
      collapsible={true}
      count={`${ach} ACH / ${cfmPerPerson} cfm/person`}
      icon={<Air className={styles['tile-icon']} />}
    >
      {({ isCollapsed }) => (
        <>
          {isCollapsed && (
            <div className={styles['collapsed-content']}>
              <div className={styles['minimized-icon']}>
                <Air sx={{ fontSize: '80px' }} />
              </div>
              <Typography className={styles['collapsed-number']}>
                {ach} ACH / {cfmPerPerson} cfm/person
              </Typography>
            </div>
          )}
          {!isCollapsed && (
            <div className={`${tileStyles['tile-content']} ${styles['central-vent-container']}`}>
              <Air 
                className={styles['purifier-image']}
                sx={{ fontSize: '8rem' }}
              />
              <Box display="flex" flexDirection="row" className={styles['vent-params']} gap={2} alignItems="center">
                <IconButton onClick={decreaseAch} className={styles['ach-button']}>
                  <RemoveIcon />
                </IconButton>
                <TextField
                  className={tileStyles['tile-text-field']} // Use tile-text-field class from Tile.module.css
                  label="ACH"
                  type="number"
                  value={ach}
                  onChange={handleAchChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ inputProps: { min: 0, step: 1 } }}
                />
                <IconButton onClick={increaseAch} className={styles['ach-button']}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" className={styles['cfm-label']}>
                {cfmPerPerson} CFM per person
              </Typography>
            </div>
          )}
        </>
      )}
    </Tile>
  );
};

export default CentralVentilation;