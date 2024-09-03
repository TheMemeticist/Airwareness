import React, { useState } from 'react';
import Tile from '../Tile';
import styles from './Occupants.module.css';
import tileStyles from '../Tile.module.css';
import { Box, Slider, Typography, TextField } from '@mui/material';
import { PeopleIcon, HotelIcon, DirectionsRunIcon } from './OccupantIcons';

const Occupants = ({ initialAdults = 8, initialChildren = 2 }) => {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [activityLevel, setActivityLevel] = useState(2);
  const helpText = "This tile shows the current number of adult and child occupants in the room and their activity level.";

  const handleActivityChange = (event, newValue) => {
    setActivityLevel(newValue);
  };

  const handleAdultsChange = (event) => {
    setAdults(parseInt(event.target.value) || 0);
  };

  const handleChildrenChange = (event) => {
    setChildren(parseInt(event.target.value) || 0);
  };

  const getActivityDetails = () => {
    if (activityLevel <= 1) return { icon: <HotelIcon />, text: 'Sleeping' };
    if (activityLevel <= 2) return { icon: <PeopleIcon />, text: 'Sitting' };
    if (activityLevel <= 3) return { icon: <PeopleIcon />, text: 'Standing' };
    if (activityLevel <= 3.5) return { icon: <DirectionsRunIcon />, text: 'Walking' };
    return { icon: <DirectionsRunIcon />, text: 'Running' };
  };

  return (
    <Tile title="Occupants" helptxt={helpText}>
      <div className={`${tileStyles['tile-content']} ${styles['occupants-container']}`}>
        <Box className={styles['occupants-inputs-container']}>
          <TextField
            className={`${tileStyles['tile-text-field']} ${styles['occupants-input']} ${styles['adults-input']}`}
            label="Adults"
            type="number"
            value={adults}
            onChange={handleAdultsChange}
            variant="outlined"
            size="small"
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
          <Box className={styles['occupants-icon-container']}>
            <PeopleIcon />
          </Box>
          <TextField
            className={`${tileStyles['tile-text-field']} ${styles['occupants-input']} ${styles['children-input']}`}
            label="Children"
            type="number"
            value={children}
            onChange={handleChildrenChange}
            variant="outlined"
            size="small"
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
        </Box>
        <Box className={styles['activity-container']}>
          <Typography id="activity-slider" gutterBottom>
            Activity
          </Typography>
          <Box className={styles['slider-container']}>
            <HotelIcon />
            <Slider
              value={activityLevel}
              onChange={handleActivityChange}
              aria-labelledby="activity-slider"
              step={0.1}
              min={0}
              max={4}
              className={styles['activity-slider']}
            />
            <DirectionsRunIcon />
          </Box>
        </Box>
        <Box className={styles['current-activity']}>
          {getActivityDetails().icon}
          <Typography variant="body2">
            {getActivityDetails().text}
          </Typography>
        </Box>
      </div>
    </Tile>
  );
};

export default Occupants;
