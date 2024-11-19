import React, { useState, useEffect } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import quantaRates from './PathogenInfo.json';
import { calculateWellsRiley } from './transmission-models/Wells-Riley-Model';
import { useAppContext } from '../../../../context/AppContext';
import { alpha, keyframes } from '@mui/material';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const getRiskColor = (risk) => {
  const riskValue = risk * 100;  // Convert from decimal to percentage
  
  if (riskValue === 0) return '#4caf50';  // Green
  if (riskValue <= 50) {
    // Interpolate between green and yellow (0-50%)
    return alpha(
      mix(
        '#4caf50',  // Green
        '#ffeb3b',  // Yellow
        riskValue / 50
      ),
      1
    );
  }
  // Interpolate between yellow and red (50-99%)
  return alpha(
    mix(
      '#ffeb3b',  // Yellow
      '#f44336',  // Red
      (riskValue - 50) / 49
    ),
    1
  );
};

// Helper function to mix colors
function mix(color1, color2, weight) {
  const d2h = (d) => d.toString(16).padStart(2, '0');
  const h2d = (h) => parseInt(h, 16);

  weight = Math.max(0, Math.min(1, weight));
  
  const c1 = {
    r: h2d(color1.slice(1, 3)),
    g: h2d(color1.slice(3, 5)),
    b: h2d(color1.slice(5, 7))
  };
  
  const c2 = {
    r: h2d(color2.slice(1, 3)),
    g: h2d(color2.slice(3, 5)),
    b: h2d(color2.slice(5, 7))
  };

  const r = Math.round(c1.r * (1 - weight) + c2.r * weight);
  const g = Math.round(c1.g * (1 - weight) + c2.g * weight);
  const b = Math.round(c1.b * (1 - weight) + c2.b * weight);

  return `#${d2h(r)}${d2h(g)}${d2h(b)}`;
}

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
    return Number(((1 / totalOccupants) * 100).toFixed(2));
  };

  const getMaxPositivityRate = () => {
    const totalOccupants = getTotalOccupants();
    return Number((((totalOccupants - 1) / totalOccupants) * 100).toFixed(2));
  };

  // Round initial value to 2 decimal places
  const initialPositivityRate = Math.max(0.1, getMinPositivityRate()).toFixed(2);
  
  // State declarations
  const [positivityRate, setPositivityRate] = useState(initialPositivityRate);
  const [tempPositivityRate, setTempPositivityRate] = useState(initialPositivityRate);
  const [pathogen, setPathogen] = useState('sars-cov-2');
  const [quantaRate, setQuantaRate] = useState(quantaRates['sars-cov-2'].quantaRate.toString());
  const [halfLife, setHalfLife] = useState('1.1');
  const [ventilationRate, setVentilationRate] = useState(4);
  const [breathingRate, setBreathingRate] = useState(360);
  const [exposureTime, setExposureTime] = useState(1);
  const [rotation, setRotation] = useState(0);

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
        Math.min(maxPercentage, parsedValue)
      );
      const roundedValue = boundedValue.toFixed(2);
      setPositivityRate(roundedValue);
      setTempPositivityRate(roundedValue);
    }
  };

  const handlePositivityRateChange = (event) => {
    const value = event.target.value;
    setTempPositivityRate(value);
    
    // If the value is a valid number, update immediately
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      validateAndSetPositivityRate(value);
    }
  };

  const handleBlur = () => {
    validateAndSetPositivityRate(tempPositivityRate);
  };

  const handleQuantaRateChange = (event) => {
    const value = event.target.value;
    if (value === '' || parseFloat(value) >= 1) {
      setQuantaRate(value);
    }
  };

  const handlePathogenChange = (event) => {
    const selectedPathogen = event.target.value;
    setPathogen(selectedPathogen);
    setQuantaRate(quantaRates[selectedPathogen].quantaRate.toString());
    setHalfLife(quantaRates[selectedPathogen].halfLife.toString());
  };

  const handleHalfLifeChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.01 && parseFloat(value) <= 24)) {
      setHalfLife(value);
    }
  };

  const calculateRisk = () => {
    const hourlyQuantaRate = quantaRate;
    const currentRoomVolume = getRoomVolume();
    const totalOccupants = getTotalOccupants();
    
    const risk = calculateWellsRiley(
      totalOccupants,
      parseFloat(positivityRate),
      hourlyQuantaRate,
      breathingRate,
      exposureTime,
      currentRoomVolume,
      ventilationRate,
      parseFloat(halfLife)
    );

    return {
      ...risk,
      probability: Math.min(risk.probability, 0.99)
    };
  };

  const riskData = calculateRisk();
  const totalOccupants = getTotalOccupants();
  const riskColor = getRiskColor(riskData.probability);

  // Use useEffect to create continuous rotation
  useEffect(() => {
    let animationFrame;
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Calculate rotation speed based on quanta rate
      // (quantaRate * 0.05) = revolutions per minute
      // Convert to degrees per millisecond
      const degreesPerMs = (parseFloat(quantaRate) * 0.05 * 360) / (60 * 1000);
      
      setRotation(prev => prev + deltaTime * degreesPerMs);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [quantaRate]);

  return (
    <Tile 
      title="Epi-Risk" 
      collapsible={true} 
      icon={
        <CoronavirusIcon 
          className={styles['tile-icon']} 
          sx={{ 
            color: riskColor,
            [`&.${styles['minimized-icon']}`]: { color: riskColor },
          }} 
        />
      }
      helpText={helpText}
      count={
        <Typography sx={{ color: 'var(--off-white)' }}>
          {riskData.probability < 0.01 ? 
            (riskData.probability * 100).toFixed(2) : 
            riskData.probability < 0.1 ?
              (riskData.probability * 100).toFixed(1) :
              Math.round(riskData.probability * 100)}%
        </Typography>
      }
    >
      <div className={styles['epi-risk-container']}>
        <div className={tileStyles['tile-content']}>
          <div 
            className={styles['epi-risk-icon-wrapper']}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <CoronavirusIcon 
              className={styles['epi-risk-icon']} 
              sx={{ color: riskColor }}
            />
          </div>
          <div className={styles['epi-risk-value']} style={{ color: riskColor }}>
            {riskData.probability < 0.01 ? 
              (riskData.probability * 100).toFixed(2) : 
              riskData.probability < 0.1 ?
                (riskData.probability * 100).toFixed(1) :
                Math.round(riskData.probability * 100)}%
          </div>
          
          <Typography variant="body2" className={styles['epi-risk-description']}>
            {riskData.infectiousCount} infectious individuals out of {totalOccupants} total
          </Typography>

          <Box 
            display="flex" 
            flexDirection="column" 
            className={styles['epi-risk-params']} 
            gap={1}
          >
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
                sx={{ 
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'transparent'
                  }
                }}
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
                label="Quanta Rate (per hour)"
                type="number"
                value={quantaRate}
                onChange={handleQuantaRateChange}
                inputProps={{ 
                  min: 1, 
                  step: 25 
                }}
                fullWidth
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'transparent'
                  }
                }}
              />
            </Box>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Half-life (hours)"
                type="number"
                value={halfLife}
                onChange={handleHalfLifeChange}
                inputProps={{ 
                  min: 0.01, 
                  max: 24, 
                  step: 0.05 
                }}
                fullWidth
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'transparent'
                  }
                }}
              />
            </Box>
          </Box>
        </div>
      </div>
    </Tile>
  );
};

export default EpiRisk;
