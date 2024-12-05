import React, { useState, useMemo } from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import { TextField, Box, IconButton, Typography, Button } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Air, Article as ArticleIcon } from '@mui/icons-material';
import { useAppContext } from '../../../../context/AppContext';
import descriptionStyles from '../TileDescriptions.module.css';  // Add this import

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
    const currentValue = Math.max(0.01, parseFloat(ach) || 0.01);
    const newValue = (currentValue + 1).toFixed(1);
    setAch(newValue);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(newValue) });
  };

  const decreaseAch = () => {
    const currentValue = Math.max(0.1, parseFloat(ach) || 0.1);
    let newValue;
    
    if (currentValue <= 1) {
      // Decrease by 0.1 but don't go below 0.1
      newValue = Math.max(0.1, currentValue - 0.1).toFixed(1);
    } else {
      // If we're above 1, decrease by 1
      newValue = Math.max(0.1, currentValue - 1).toFixed(1);
    }
    
    setAch(newValue);
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: parseFloat(newValue) });
  };

  const handleAchChange = (e) => {
    const value = Math.max(0.1, parseFloat(e.target.value) || 0.1);
    setAch(value.toString());
    dispatch({ type: 'UPDATE_VENTILATION_RATE', payload: value });
  };

  return (
    <Tile 
      title="Airflow" 
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
                {ach} ACH / {cfmPerPerson} CFM (per Person)
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
                  className={tileStyles['tile-text-field']}
                  label="ACH"
                  type="number"
                  value={ach}
                  onChange={handleAchChange}
                  variant="outlined"
                  size="small"
                  InputProps={{ 
                    inputProps: { 
                      min: 0.1, 
                      step: 0.1  
                    } 
                  }}
                />
                <IconButton onClick={increaseAch} className={styles['ach-button']}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" className={styles['cfm-label']}>
                {cfmPerPerson} CFM per person
              </Typography>
              
              <div className={descriptionStyles['description-container']}>
                <Typography 
                  variant="body2" 
                  color="white" 
                  className={descriptionStyles['description-primary']}
                >
                  <p>This tool monitors and controls the room's ventilation rate, measured in Air Changes per Hour (ACH) and Cubic Feet per Minute (CFM) per person.</p>
                  
                  <p>ACH represents the airflow rate relative to the room's volume, indicating how much fresh air flows through the space each hour. This flow creates a dilution effect, mixing fresh air with existing room air. CFM per person shows the fresh air delivery rate for each occupant. Higher ACH rates indicate better air dilution, which can help reduce airborne transmission risks.</p>

                  <Button
                    variant="contained"
                    className={descriptionStyles['source-button']}
                    href="https://www.epa.gov/indoor-air-quality-iaq/how-much-ventilation-do-i-need-my-home-improve-indoor-air-quality"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<ArticleIcon />}
                  >
                    Learn more about ventilation rates
                  </Button>
                </Typography>
              </div>
            </div>
          )}
        </>
      )}
    </Tile>
  );
};

export default CentralVentilation;