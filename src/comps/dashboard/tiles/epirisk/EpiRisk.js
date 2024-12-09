import React, { useState, useEffect } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography, Button } from '@mui/material';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import { calculateWellsRiley } from './transmission-models/Wells-Riley-Model';
import { useAppContext } from '../../../../context/AppContext';
import { alpha, keyframes } from '@mui/material';
import ArrowDownIcon from '@mui/icons-material/ArrowDownward';
import PathogenEditor from './PathogenEditor';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import descriptionStyles from '../TileDescriptions.module.css';
import { Subject } from 'rxjs';

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
  if (riskValue <= 49.5) {  // Changed from 50 to 49.5 to account for max 99%
    // Interpolate between green and yellow (0-49.5%)
    return alpha(
      mix(
        '#4caf50',  // Green
        '#ffeb3b',  // Yellow
        riskValue / 49.5
      ),
      1
    );
  }
  // Interpolate between yellow and red (49.5-99%)
  return alpha(
    mix(
      '#ffeb3b',  // Yellow
      '#f44336',  // Red
      (riskValue - 49.5) / 49.5
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

// Add this constant at the top of the file, after imports
const MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 300,
      scrollbarGutter: 'stable both-edges',
      marginRight: 0
    }
  },
  // Prevent menu from modifying body styles
  disableScrollLock: true,
  // Ensure menu is properly positioned
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left'
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left'
  }
};

// Add this before the EpiRisk component
const riskUpdates = new Subject();

const EpiRisk = () => {
  const { state, dispatch } = useAppContext();

  // Ensure we have a valid initial pathogen with safety checks
  const [pathogen, setPathogen] = useState(() => {
    const currentPathogen = state.currentPathogen;
    const pathogens = state.pathogens || {};
    const pathogenKeys = Object.keys(pathogens);
    
    // Return current pathogen if valid, otherwise first available, or a default
    if (pathogens[currentPathogen]) return currentPathogen;
    if (pathogenKeys.length > 0) return pathogenKeys[0];
    return 'tuberculosis'; // Fallback default
  });

  // Get initial values safely with null coalescing
  const [quantaRate, setQuantaRate] = useState(() => {
    const currentPathogenData = state.pathogens?.[pathogen];
    return currentPathogenData?.quantaRate?.toString() || '25';
  });

  const [halfLife, setHalfLife] = useState(() => {
    const currentPathogenData = state.pathogens?.[pathogen];
    return currentPathogenData?.halfLife?.toString() || '1.1';
  });

  // Move memoized helper inside component
  const memoizedCalculateRisk = React.useCallback((params) => {
    const { totalOccupants, positivityRate, quantaRate, breathingRate, exposureTime, roomVolume, ventilationRate, halfLife } = params;
    
    // Add validation to prevent invalid calculations
    if (!totalOccupants || totalOccupants <= 0) {
      return {
        probability: 0,
        infectiousCount: 0
      };
    }
    
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

    // Ensure probability is always between 0 and 0.99
    return {
      ...risk,
      probability: Math.max(0, Math.min(risk.probability, 0.99))
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

  // Add state to track if we're using minimum rate
  const [isUsingMinRate, setIsUsingMinRate] = useState(true);  // Start with true since we init with min rate

  // Update handlePositivityRateChange to track when user moves away from min rate
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
        const minPercentage = getMinPositivityRate();
        const maxPercentage = getMaxPositivityRate();
        const boundedValue = Math.max(
          minPercentage, 
          Math.min(maxPercentage, numValue)
        );
        const roundedValue = Number(boundedValue.toFixed(2));
        setPositivityRate(roundedValue.toString());
        setTempPositivityRate(roundedValue.toString());
        
        // Update isUsingMinRate based on whether we're at the minimum
        setIsUsingMinRate(roundedValue === minPercentage);
      }
    }
  };

  const handleBlur = () => {
    if (tempPositivityRate === '' || tempPositivityRate === '.') {
      const minValue = getMinPositivityRate();
      setPositivityRate(minValue.toString());
      setTempPositivityRate(minValue.toString());
    } else {
      const numValue = parseFloat(tempPositivityRate);
      if (!isNaN(numValue)) {
        const minPercentage = getMinPositivityRate();
        const maxPercentage = getMaxPositivityRate();
        const boundedValue = Math.max(
          minPercentage, 
          Math.min(maxPercentage, numValue)
        );
        const roundedValue = Number(boundedValue.toFixed(2));
        setPositivityRate(roundedValue.toString());
        setTempPositivityRate(roundedValue.toString());
      }
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
    dispatch({ type: 'RESET_TIMER' });
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

  // Add safety check for handlePathogenChange
  const handlePathogenChange = (event) => {
    const selectedPathogen = event.target.value;
    const pathogenData = state.pathogens?.[selectedPathogen];
    
    if (!pathogenData) return; // Exit if pathogen data is not available
    
    setPathogen(selectedPathogen);
    setQuantaRate(pathogenData.quantaRate?.toString() || '25');
    setHalfLife(pathogenData.halfLife?.toString() || '1.1');
    
    dispatch({ 
      type: 'SET_CURRENT_PATHOGEN',
      payload: selectedPathogen
    });
    dispatch({ type: 'RESET_TIMER' });
  };

  const handleHalfLifeChange = (event) => {
    const value = event.target.value;
    
    // Allow empty string for typing
    if (value === '') {
      setHalfLife('');
      return;
    }

    // Parse and validate the value (in hours)
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setHalfLife(numValue.toString());
      
      // Update global state
      dispatch({
        type: 'UPDATE_PATHOGEN',
        payload: {
          pathogenId: pathogen,
          updates: { halfLife: numValue }
        }
      });
      dispatch({ type: 'RESET_TIMER' });
    }
  };

  const handleHalfLifeBlur = (event) => {
    const value = event.target.value;
    
    // Default to 1.1 hours if empty or invalid
    if (value === '' || isNaN(parseFloat(value))) {
      const defaultValue = '1.1';
      setHalfLife(defaultValue);
      dispatch({
        type: 'UPDATE_PATHOGEN',
        payload: {
          pathogenId: pathogen,
          updates: { halfLife: parseFloat(defaultValue) }
        }
      });
      return;
    }

    // Clamp value to valid range (only minimum)
    const numValue = parseFloat(value);
    const clampedValue = Math.max(2/3600, numValue); // 2 seconds minimum
    const formattedValue = clampedValue.toString();
    
    setHalfLife(formattedValue);
    dispatch({
      type: 'UPDATE_PATHOGEN',
      payload: {
        pathogenId: pathogen,
        updates: { halfLife: clampedValue }
      }
    });
    dispatch({ type: 'RESET_TIMER' });
  };

  // Separate memo for dynamic risk calculation
  const dynamicRiskData = React.useMemo(() => {
    return memoizedCalculateRisk({
      totalOccupants: getTotalOccupants(),
      positivityRate,
      quantaRate,
      breathingRate,
      exposureTime: state.exposureTime,
      roomVolume: getRoomVolume(),
      ventilationRate: state.ventilationRate,
      halfLife
    });
  }, [
    positivityRate, 
    quantaRate, 
    breathingRate,
    state.exposureTime,
    state.ventilationRate,
    halfLife,
    memoizedCalculateRisk,
    getTotalOccupants,
    getRoomVolume
  ]);

  // Separate memo for fixed 1-hour risk calculation
  const fixedRiskData = React.useMemo(() => {
    return memoizedCalculateRisk({
      totalOccupants: getTotalOccupants(),
      positivityRate,
      quantaRate,
      breathingRate,
      exposureTime: 1, // Fixed 1-hour exposure
      roomVolume: getRoomVolume(),
      ventilationRate: state.ventilationRate,
      halfLife
    });
  }, [
    positivityRate, 
    quantaRate, 
    breathingRate,
    state.ventilationRate,
    halfLife,
    memoizedCalculateRisk,
    getTotalOccupants,
    getRoomVolume
  ]);

  // Format display values
  const formattedDynamicValue = (dynamicRiskData.probability * 100).toFixed(1);
  const formattedFixedValue = (fixedRiskData.probability * 100).toFixed(1);

  const totalOccupants = getTotalOccupants();
  const riskColor = getRiskColor(dynamicRiskData.probability);

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
    const targetValue = Math.max(0, dynamicRiskData.probability * 100); // Ensure target is never negative
    const startValue = displayValue;
    const duration = 1200;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = (targetValue - startValue) / steps;
    
    let currentStep = 0;
    
    const animateValue = () => {
      if (currentStep < steps) {
        setDisplayValue(prev => {
          const newValue = Math.max(0, startValue + (increment * (currentStep + 1))); // Ensure value is never negative
          if (newValue < 1) return Number(newValue.toFixed(2));
          if (newValue < 10) return Number(newValue.toFixed(1));
          return Number(newValue.toFixed(0));
        });
        currentStep++;
        setTimeout(animateValue, stepDuration);
      }
    };

    animateValue();
  }, [dynamicRiskData.probability]);

  // Replace the direct risk display with animated value
  const formattedDisplayValue = React.useMemo(() => {
    if (displayValue < 1) return displayValue.toFixed(2);
    if (displayValue < 10) return displayValue.toFixed(1);
    return Math.round(displayValue);
  }, [displayValue]);

  // Add this effect to update particle system when infectious count changes
  useEffect(() => {
    dispatch({
      type: 'UPDATE_INFECTIOUS_COUNT',
      payload: dynamicRiskData.infectiousCount
    });
  }, [dynamicRiskData.infectiousCount, dispatch]);

  const handleDeletePathogen = () => {
    // Get all pathogen IDs
    const pathogens = Object.keys(state.pathogens);
    
    // Don't allow deletion if there's only one pathogen
    if (pathogens.length <= 1) return;
    
    // Find the next available pathogen that isn't the current one
    const nextPathogen = pathogens.find(p => p !== pathogen);
    
    if (!nextPathogen) return; // Safety check
    
    // Update local state first
    setPathogen(nextPathogen);
    setQuantaRate(state.pathogens[nextPathogen].quantaRate.toString());
    setHalfLife(state.pathogens[nextPathogen].halfLife.toString());
    
    // Update global state
    dispatch({
      type: 'SET_CURRENT_PATHOGEN',
      payload: nextPathogen
    });
    
    // Wait for state updates to complete before deleting
    setTimeout(() => {
      dispatch({
        type: 'DELETE_PATHOGEN',
        payload: {
          pathogenId: pathogen,
          nextPathogenId: nextPathogen
        }
      });
    }, 0);
  };

  useEffect(() => {
    // Update particle system when half-life changes
    dispatch({
      type: 'UPDATE_PARTICLE_HALF_LIFE',
      payload: parseFloat(halfLife)
    });
  }, [halfLife, dispatch]);

  // Update effect to use isUsingMinRate
  useEffect(() => {
    const minRate = getMinPositivityRate();
    const maxRate = getMaxPositivityRate();
    const currentRate = parseFloat(positivityRate);

    // If using min rate or current rate is below minimum, set to new minimum
    if (isUsingMinRate || currentRate <= minRate) {
      const newRate = minRate.toString();
      setPositivityRate(newRate);
      setTempPositivityRate(newRate);
    } else if (currentRate > maxRate) {
      // Handle the max rate case
      const newRate = maxRate.toString();
      setPositivityRate(newRate);
      setTempPositivityRate(newRate);
    }
  }, [getTotalOccupants()]); // Dependency on total occupants

  // Reset exposure time when timer resets
  useEffect(() => {
    if (state.timerReset) {
      dispatch({
        type: 'UPDATE_EXPOSURE_TIME',
        payload: 0
      });
    }
  }, [state.timerReset, dispatch]);

  // Update the risk calculation to emit updates
  useEffect(() => {
    const risk = dynamicRiskData.probability;
    riskUpdates.next(risk);
  }, [dynamicRiskData.probability]);

  // Add this to component initialization
  useEffect(() => {
    dispatch({
      type: 'SET_RISK_UPDATES',
      payload: riskUpdates
    });
  }, [dispatch]);

  return (
    <Tile 
      title="Transmission" 
      collapsible={true} 
      icon={<CoronavirusIcon />}
      count={`${formattedDynamicValue}% Risk`}
      helpText={helpText}
    >
      {({ isCollapsed }) => (
        <>
          {isCollapsed ? (
            <div className={styles['collapsed-content']}>
              <div className={styles['minimized-icon']}>
                <CoronavirusIcon 
                  className={styles['tile-icon']} 
                  sx={{ 
                    // Use dynamic risk color when collapsed
                    color: getRiskColor(dynamicRiskData.probability), 
                    fontSize: '60px' 
                  }}
                />
              </div>
              <Typography variant="subtitle1" className={styles['pathogen-subtitle']}>
                {state.pathogens[pathogen].name}
              </Typography>
              <Typography>
                {formattedDynamicValue}% Risk
              </Typography>
            </div>
          ) : (
            <div className={`${tileStyles['tile-content']} ${styles['epi-risk-container']}`}>
              <Box className={styles['pathogen-title-container']}>
                <FormControl variant="outlined" size="small" className={styles['pathogen-select-container']}>
                  <InputLabel id="pathogen-select-label" className={styles['pathogen-select-label']}>Pathogen</InputLabel>
                  <Select
                    labelId="pathogen-select-label"
                    id="pathogen-select"
                    value={pathogen}
                    onChange={handlePathogenChange}
                    label="Select a Pathogen"
                    className={styles['pathogen-select']}
                    IconComponent={ArrowDownIcon}
                    MenuProps={MENU_PROPS}
                    sx={{
                      '&.Mui-focused': {
                        backgroundColor: 'var(--off-black-1) !important',
                        opacity: '1 !important'
                      },
                      '& .MuiOutlinedInput-root.Mui-focused': {
                        backgroundColor: 'var(--off-black-1) !important',
                        opacity: '1 !important'
                      }
                    }}
                  >
                    {Object.entries(state.pathogens).map(([key, data]) => (
                      <MenuItem key={key} value={key}>
                        {data.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div className={styles['pathogen-actions']}>
                  <Button
                    variant="contained"
                    className={`${styles['action-button']} ${styles['add-pathogen-button']}`}
                    onClick={() => {
                      const id = `custom-${Date.now()}`;
                      dispatch({
                        type: 'ADD_PATHOGEN',
                        payload: {
                          id,
                          pathogen: {
                            name: `New Pathogen`,
                            quantaRate: 25,
                            halfLife: 1.1
                          }
                        }
                      });
                      setPathogen(id);
                    }}
                    title="Add new pathogen"
                  >
                    <AddIcon className={styles['button-content']} />
                  </Button>
                  <Button
                    variant="contained"
                    className={`${styles['action-button']} ${styles['delete-pathogen-button']}`}
                    onClick={handleDeletePathogen}
                    disabled={Object.keys(state.pathogens).length <= 1}
                    title="Delete current pathogen"
                  >
                    <DeleteIcon className={styles['button-content']} />
                  </Button>
                </div>
              </Box>
              <div 
                className={styles['epi-risk-icon-wrapper']}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <CoronavirusIcon 
                  className={styles['epi-risk-icon']} 
                  sx={{ 
                    // Use fixed 1-hour risk color when expanded
                    color: getRiskColor(fixedRiskData.probability), 
                    fontSize: getRiskSize(positivityRate)
                  }}
                />
              </div>
              <div className={styles['epi-risk-value']} style={{ color: getRiskColor(fixedRiskData.probability) }}>
                {formattedFixedValue}% Risk
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  1-hour exposure assessment
                </Typography>
              </div>
              <Typography variant="body2" className={styles['epi-risk-description']}>
                {dynamicRiskData.infectiousCount} infectious individuals out of {totalOccupants} total
              </Typography>
              <PathogenEditor
                tempPositivityRate={tempPositivityRate}
                handlePositivityRateChange={handlePositivityRateChange}
                handleBlur={handleBlur}
                getMinPositivityRate={getMinPositivityRate}
                getMaxPositivityRate={getMaxPositivityRate}
                pathogen={pathogen}
                state={state}
                dispatch={dispatch}
                quantaRate={quantaRate}
                handleQuantaRateChange={handleQuantaRateChange}
                handleQuantaRateBlur={handleQuantaRateBlur}
                halfLife={halfLife}
                handleHalfLifeChange={handleHalfLifeChange}
                handleHalfLifeBlur={handleHalfLifeBlur}
              />
              <Box className={styles['source-buttons-container']}>
                <header>
                  <Typography variant="subtitle2">
                    Sources:
                  </Typography>
                </header>
                  {state.pathogens[pathogen]?.links?.map((link, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      className={styles['source-button']}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      startIcon={<ArticleIcon />}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </Box>
              <div className={descriptionStyles['description-container']}>
                <Typography 
                  variant="body2" 
                  color="white" 
                  className={descriptionStyles['description-primary']}
                >
                  <p>This tool provides two complementary views of transmission risk: This expanded view shows a standardized 1-hour baseline assessment, while the collapsed view displays real-time dynamic risk calculations based on the elapsed exposure time. Both use an implementation of the Wells-Riley model, a well-established framework for assessing the risk of airborne infection in indoor environments, to estimate infection probability.</p>
                  
                  <p>The model accounts for various factors including room occupancy, ventilation rates, pathogen characteristics, and exposure time. Using the pathogen editor, you can customize parameters to evaluate transmission risks for different scenarios and pathogens.</p>

                  <Button
                    variant="contained"
                    className={descriptionStyles['source-button']}
                    href="https://en.wikipedia.org/wiki/Wells-Riley_model"
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<ArticleIcon />}
                  >
                    Learn more about the Wells-Riley model
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

export default EpiRisk;
