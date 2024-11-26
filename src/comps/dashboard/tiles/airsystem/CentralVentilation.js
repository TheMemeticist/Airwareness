import React, { useState } from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import { TextField, Box, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Air } from '@mui/icons-material';
import { useAppContext } from '../../../../context/AppContext';

const CentralVentilation = () => {
  const { state, dispatch } = useAppContext();
  const [ach, setAch] = useState(state.ventilationRate?.toString() || '1'); // Get initial value from global state

  const increaseAch = () => {
    const newValue = (parseFloat(ach) + 0.1).toFixed(1);
    setAch(newValue);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(newValue) });
  };

  const decreaseAch = () => {
    const newValue = Math.max(0, parseFloat(ach) - 0.1).toFixed(1);
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
      count={`${ach} ACH`}
      icon={<Air className={styles['tile-icon']} />}
    >
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
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          />
          <IconButton onClick={increaseAch} className={styles['ach-button']}>
            <AddIcon />
          </IconButton>
        </Box>
      </div>
    </Tile>
  );
};

export default CentralVentilation;