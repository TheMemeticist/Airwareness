import React, { useState } from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import centralVentImage from './Vent-Image.png';
import { TextField, Box, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

const CentralVentilation = () => {
  const [ach, setAch] = useState('1'); // Default ACH value

  const increaseAch = () => setAch(prev => (parseFloat(prev) + 0.1).toFixed(1));
  const decreaseAch = () => setAch(prev => Math.max(0, parseFloat(prev) - 0.1).toFixed(1));

  return (
    <Tile 
      title="Central Ventilation" 
      helptxt="This represents a central HVAC system."
      collapsible={true}
      count={`${ach} ACH`}
      icon={<img src={centralVentImage} alt="Central Ventilation" className={styles['tile-icon']} />}
    >
      <div className={`${tileStyles['tile-content']} ${styles['central-vent-container']}`}>
        <img src={centralVentImage} alt="Central Ventilation" className={styles['purifier-image']} />
        <Box display="flex" flexDirection="row" className={styles['vent-params']} gap={2} alignItems="center">
          <IconButton onClick={decreaseAch} className={styles['ach-button']}>
            <RemoveIcon />
          </IconButton>
          <TextField
            className={tileStyles['tile-text-field']} // Use tile-text-field class from Tile.module.css
            label="ACH"
            type="number"
            value={ach}
            onChange={(e) => setAch(e.target.value)}
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