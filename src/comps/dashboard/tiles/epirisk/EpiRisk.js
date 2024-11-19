import React, { useState } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import quantaRates from './PathogenInfo.json';
import { calculateWellsRiley } from './transmission-models/Wells-Riley-Model';
import { useAppContext } from '../../../../context/AppContext';
import { alpha } from '@mui/material';

const getRiskColor = (probability) => {
  const percentage = probability * 100;
  if (percentage <= 0) return '#4caf50'; // green
  if (percentage >= 100) return '#f44336'; // red
  
  // Interpolate between green -> yellow -> red
  if (percentage <= 50) {
    // Green to Yellow
    const ratio = percentage / 50;
    return `rgb(${76 + (179 * ratio)}, ${175 - (30 * ratio)}, ${80 - (80 * ratio)})`;
  } else {
    // Yellow to Red
    const ratio = (percentage - 50) / 50;
    return `rgb(${255 - (11 * ratio)}, ${145 - (121 * ratio)}, ${0 + (54 * ratio)})`;
  }
};

const EpiRisk = () => {
  const { state } = useAppContext();

  const getTotalOccupants = () => {
    const activeBuilding = state.buildings.find(b => b.rooms.length > 0);
    if (!activeBuilding?.rooms[0]?.occupants?.groups) return 100;

    return activeBuilding.rooms[0].occupants.groups.reduce(
      (sum, group) => sum + (group.count || 0), 
      0
    );
  };
  
  const getMinPositivityRate = () => {
    const totalOccupants = getTotalOccupants();
    return (1 / totalOccupants) * 100;
  };

  const getMaxPositivityRate = () => {
    const totalOccupants = getTotalOccupants();
    return ((totalOccupants - 1) / totalOccupants) * 100;
  };

  // Round initial value to 2 decimal places
  const initialPositivityRate = (Math.round(Math.max(0.1, getMinPositivityRate()) * 100) / 100).toString();
  
  // State declarations
  const [positivityRate, setPositivityRate] = useState(initialPositivityRate);
  const [tempPositivityRate, setTempPositivityRate] = useState(initialPositivityRate);
  const [pathogen, setPathogen] = useState('sars-cov-2');
  const [quantaRate, setQuantaRate] = useState('1.0');
  const [decayRate, setDecayRate] = useState('0.63');
  const [ventilationRate, setVentilationRate] = useState(4);
  const [breathingRate, setBreathingRate] = useState(360);
  const [exposureTime, setExposureTime] = useState(1);

  const helpText = "Calculates infection risk using the Wells-Riley model. Different pathogens produce varying amounts of infectious particles (quanta) per minute, affecting transmission probability.";

  const getRoomVolume = () => {
    const activeBuilding = state.buildings.find(b => b.rooms.length > 0);
    if (!activeBuilding) return 1000;

    const activeRoom = activeBuilding.rooms[0];
    if (!activeRoom?.height || !activeRoom?.floorArea) return 1000;

    return activeRoom.height * activeRoom.floorArea;
  };

  const validateAndSetPositivityRate = (value) => {
    const minPercentage = getMinPositivityRate();
    const maxPercentage = getMaxPositivityRate();
    const parsedValue = parseFloat(value);

    if (!isNaN(parsedValue)) {
      const boundedValue = Math.max(
        minPercentage, 
        Math.min(maxPercentage, Math.round(parsedValue * 100) / 100)
      );
      setPositivityRate(boundedValue.toString());
      setTempPositivityRate(boundedValue.toString());
    }
  };

  const handlePositivityRateChange = (event) => {
    const value = event.target.value;
    setTempPositivityRate(value);
  };

  const handleBlur = () => {
    validateAndSetPositivityRate(tempPositivityRate);
  };

  const handleQuantaRateChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.1 && parseFloat(value) <= 100)) {
      setQuantaRate(value);
    }
  };

  const handlePathogenChange = (event) => {
    const selectedPathogen = event.target.value;
    setPathogen(selectedPathogen);
    setQuantaRate(quantaRates[selectedPathogen].quantaRate.toString());
    setDecayRate(quantaRates[selectedPathogen].decayRate.toString());
  };

  const handleDecayRateChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.01 && parseFloat(value) <= 10)) {
      setDecayRate(value);
    }
  };

  const calculateRisk = () => {
    const hourlyQuantaRate = quantaRate;
    const currentRoomVolume = getRoomVolume();
    const totalOccupants = getTotalOccupants();
    
    return calculateWellsRiley(
      totalOccupants,
      parseFloat(positivityRate),
      hourlyQuantaRate,
      breathingRate,
      exposureTime,
      currentRoomVolume,
      ventilationRate,
      parseFloat(decayRate)
    );
  };

  const riskData = calculateRisk();
  const totalOccupants = getTotalOccupants();
  const riskColor = getRiskColor(riskData.probability);

  return (
    <Tile 
      title="Epi-Risk" 
      collapsible={true} 
      icon={
        <CoronavirusIcon 
          className={styles['tile-icon']} 
          sx={{ 
            color: riskColor,
            [`&.${styles['minimized-icon']}`]: { color: riskColor }
          }} 
        />
      }
      helpText={helpText}
      count={
        <Typography sx={{ color: 'var(--off-white)' }}>
          {(riskData.probability * 100).toFixed(1)}%
        </Typography>
      }
    >
      <div className={styles['epi-risk-container']}>
        <div className={tileStyles['tile-content']}>
          <CoronavirusIcon 
            className={styles['epi-risk-icon']} 
            sx={{ color: riskColor }}
          />
          <div className={styles['epi-risk-value']} style={{ color: riskColor }}>
            {(riskData.probability * 100).toFixed(1)}%
          </div>
          
          <Typography variant="body2" className={styles['epi-risk-description']}>
            {riskData.infectiousCount} infectious individuals out of {totalOccupants} total
          </Typography>

          <Box display="flex" flexDirection="column" className={styles['epi-risk-params']} gap={2}>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Positivity Rate (%)"
                type="number"
                value={tempPositivityRate}
                onChange={handlePositivityRateChange}
                onBlur={handleBlur}
                inputProps={{ 
                  min: getMinPositivityRate(), 
                  max: getMaxPositivityRate(), 
                  step: 5 
                }}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
            <Box flex={1}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>Pathogen</InputLabel>
                <Select
                  value={pathogen}
                  onChange={handlePathogenChange}
                  label="Pathogen"
                >
                  {Object.entries(quantaRates).map(([key, data]) => (
                    <MenuItem key={key} value={key}>{data.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Quanta Rate (per minute)"
                type="number"
                value={quantaRate}
                onChange={handleQuantaRateChange}
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Decay Rate (per hour)"
                type="number"
                value={decayRate}
                onChange={handleDecayRateChange}
                inputProps={{ min: 0.01, max: 10, step: 0.01 }}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </div>
      </div>
    </Tile>
  );
};

export default EpiRisk;
