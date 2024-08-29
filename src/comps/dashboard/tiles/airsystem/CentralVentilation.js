import React, { useState } from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import centralVentImage from './Vent-Image.png';
import { TextField, Box } from '@mui/material';

const CentralVentilation = () => {
  const [ach, setAch] = useState('1'); // Default ACH value

  return (
    <Tile title="Central Ventilation" helptxt="This represents a central HVAC system.">
      <div className={tileStyles['tile-content']}>
        <h2>{ach} ACH</h2>
        <img src={centralVentImage} alt="Central Ventilation" className={styles['purifier-image']} />
        <Box display="flex" flexDirection="row" className={styles['vent-params']} gap={2}>
          <Box flex={1}>
            <TextField
              className={tileStyles['tile-text-field']} // Use tile-text-field class from Tile.module.css
              label="ACH"
              type="number"
              value={ach}
              onChange={(e) => setAch(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </div>
    </Tile>
  );
};

export default CentralVentilation;