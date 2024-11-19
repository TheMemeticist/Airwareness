import React, { useState, useEffect } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
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

const getRiskSize = (positivityRate) => {
  // Convert from string to number and from percentage to decimal
  const rate = parseFloat(positivityRate) / 100;
  
  // Base size is 8rem (smaller default)
  const baseSize = 8;
  // Scale factor between 1 and 1.5 based on positivity rate
  const scale = 1 + (rate * 0.5); // This will give us 1× at 0% and 1.5× at 100%
  
  return `${baseSize * scale}rem`;
};

const EpiRisk = () => {
  const { state, dispatch } = useAppContext();

  // Move memoized helper inside component
  const memoizedCalculateRisk = React.useCallback((params) => {
    const { totalOccupants, positivityRate, quantaRate, breathingRate, exposureTime, roomVolume, ventilationRate, halfLife } = params;
    
    const risk = calculateWellsRiley(
      totalOccupants,
      parseFloat(positivityRate),
      quantaRate,
      breathingRate,
      exposureTime,
      roomVolume,
      ventilationRate,
      parseFloat(halfLife)
    );

    return {
      ...risk,
      probability: Math.min(risk.probability, 0.99)
    };
  }, []);

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
  const [quantaRate, setQuantaRate] = useState(state.pathogens['sars-cov-2'].quantaRate.toString());
  const [halfLife, setHalfLife] = useState('1.1');
  const [ventilationRate, setVentilationRate] = useState(4);
  const [breathingRate, setBreathingRate] = useState(360);
  const [exposureTime, setExposureTime] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Add new state for animated value
  const [displayValue, setDisplayValue] = useState(0);

  const helpText = "Calculates infection risk using the Wells-Riley model. Different pathogens produce varying amounts of infectious particles (quanta) per minute, affecting transmission probability.";

  // Add room dimensions dependency to recalculate risk
  const activeRoom = React.useMemo(() => {
    const activeBuilding = state.buildings.find(b => b.rooms.length > 0);
    return activeBuilding?.rooms[0];
  }, [state.buildings]);

  const getRoomVolume = React.useCallback(() => {
    if (!activeRoom?.height || !activeRoom?.floorArea) return 1000;
    return parseFloat(activeRoom.height) * parseFloat(activeRoom.floorArea);
  }, [activeRoom]);

  const validateAndSetPositivityRate = (value) => {
    const minPercentage = getMinPositivityRate();
    const maxPercentage = getMaxPositivityRate();
    const parsedValue = parseFloat(value);

    if (!isNaN(parsedValue)) {
      const boundedValue = Math.max(
        minPercentage, 
        Math.min(maxPercentage, parsedValue)
      );
      const roundedValue = Number(boundedValue.toFixed(2));
      setPositivityRate(roundedValue.toString());
      setTempPositivityRate(roundedValue.toString());
    }
  };

  const handlePositivityRateChange = (event) => {
    const value = event.target.value;
    
    // Allow empty string for typing
    if (value === '') {
      setTempPositivityRate('');
      return;
    }

    // Allow typing decimal points
    if (value === '.' || value.endsWith('.')) {
      setTempPositivityRate(value);
      return;
    }

    // Allow typing numbers with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value)) {
      setTempPositivityRate(value);
      
      // Only update the actual rate if it's a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        validateAndSetPositivityRate(value);
      }
    }
  };

  const handleBlur = () => {
    if (tempPositivityRate === '' || tempPositivityRate === '.') {
      // Reset to minimum value if empty
      validateAndSetPositivityRate(getMinPositivityRate());
    } else {
      validateAndSetPositivityRate(tempPositivityRate);
    }
  };

  const handleQuantaRateChange = (event) => {
    const value = event.target.value;
    
    // Allow empty string for typing
    if (value === '') {
      setQuantaRate('');
      return;
    }

    // Parse the value to a number
    const numValue = parseFloat(value);
    
    // Validate the number
    if (!isNaN(numValue) && numValue >= 1) {
      setQuantaRate(value);
      
      // Ensure we're dispatching a number, not a string
      dispatch({
        type: 'UPDATE_PATHOGEN',
        payload: {
          pathogenId: pathogen,
          updates: { quantaRate: numValue }
        }
      });
    }
  };

  // Add a blur handler to ensure valid value when focus leaves
  const handleQuantaRateBlur = () => {
    if (quantaRate === '' || isNaN(parseFloat(quantaRate))) {
      // Reset to minimum value if empty or invalid
      const minValue = '1';
      setQuantaRate(minValue);
      dispatch({
        type: 'UPDATE_PATHOGEN',
        payload: {
          pathogenId: pathogen,
          updates: { quantaRate: parseFloat(minValue) }
        }
      });
    }
  };

  const handlePathogenChange = (event) => {
    const selectedPathogen = event.target.value;
    setPathogen(selectedPathogen);
    setQuantaRate(state.pathogens[selectedPathogen].quantaRate.toString());
    setHalfLife(state.pathogens[selectedPathogen].halfLife.toString());
    
    // Add this dispatch
    dispatch({ 
      type: 'SET_CURRENT_PATHOGEN',
      payload: selectedPathogen
    });
  };

  const handleHalfLifeChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.01 && parseFloat(value) <= 24)) {
      setHalfLife(value);
    }
  };

  // Memoize risk calculation
  const riskData = React.useMemo(() => {
    return memoizedCalculateRisk({
      totalOccupants: getTotalOccupants(),
      positivityRate,
      quantaRate,
      breathingRate,
      exposureTime,
      roomVolume: getRoomVolume(),
      ventilationRate,
      halfLife
    });
  }, [
    positivityRate, 
    quantaRate, 
    breathingRate,
    exposureTime, 
    ventilationRate, 
    halfLife,
    memoizedCalculateRisk,
    getTotalOccupants,
    getRoomVolume
  ]);

  const totalOccupants = getTotalOccupants();
  const riskColor = getRiskColor(riskData.probability);

  // Use useEffect to create continuous rotation
  useEffect(() => {
    // Cache the parsed quanta rate
    const parsedQuantaRate = parseFloat(quantaRate);
    const degreesPerMs = (parsedQuantaRate * 0.05 * 360) / (60 * 1000);
    let lastTime = performance.now();
    let animationFrame;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      setRotation(prev => (prev + deltaTime * degreesPerMs) % 360); // Prevent unbounded growth
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [quantaRate]);

  // Animate risk value changes
  useEffect(() => {
    const targetValue = riskData.probability * 100;
    const startValue = displayValue;
    const duration = 1200; // increased from 500 to 1200ms
    const steps = 60;     // increased from 20 to 60 steps for smoother animation
    const stepDuration = duration / steps;
    const increment = (targetValue - startValue) / steps;
    
    let currentStep = 0;
    
    const animateValue = () => {
      if (currentStep < steps) {
        setDisplayValue(prev => {
          const newValue = startValue + (increment * (currentStep + 1));
          // Smoother decimal handling
          if (newValue < 1) return Number(newValue.toFixed(2));
          if (newValue < 10) return Number(newValue.toFixed(1));
          return Number(newValue.toFixed(0));
        });
        currentStep++;
        setTimeout(animateValue, stepDuration);
      }
    };

    animateValue();
  }, [riskData.probability]);

  // Replace the direct risk display with animated value
  const formattedDisplayValue = React.useMemo(() => {
    if (displayValue < 1) return displayValue.toFixed(2);
    if (displayValue < 10) return displayValue.toFixed(1);
    return Math.round(displayValue);
  }, [displayValue]);

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
          {formattedDisplayValue}%
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
              sx={{ 
                color: riskColor,
                fontSize: getRiskSize(positivityRate)
              }}
            />
          </div>
          <div className={styles['epi-risk-value']} style={{ color: riskColor }}>
            {formattedDisplayValue}%
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
                value={tempPositivityRate}
                onChange={handlePositivityRateChange}
                onBlur={handleBlur}
                type="number"
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
                  {Object.entries(state.pathogens).map(([key, data]) => (
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
                onBlur={handleQuantaRateBlur}
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
