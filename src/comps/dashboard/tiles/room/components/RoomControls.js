import React from 'react';
import { TextField, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import styles from '../Room.module.css';
import tileStyles from '../../Tile.module.css';

export const RoomControls = ({ 
  inputValues, 
  handleInputChange, 
  handleIncrement, 
  handleDecrement 
}) => {
  return (
    <div className={styles['room-params']}>
      {/* Height Input */}
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

      {/* Floor Area Input */}
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
  );
};