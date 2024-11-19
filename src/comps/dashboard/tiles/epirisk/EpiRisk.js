import React, { useState } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import quantaRates from './PathogenInfo.json';

const EpiRisk = ({ risk = 0.5 }) => {
  const [positivityRate, setPositivityRate] = useState('0.1');
  const [pathogen, setPathogen] = useState('sars-cov-2');
  const [quantaRate, setQuantaRate] = useState('1.0');
  const [decayRate, setDecayRate] = useState('0.63');

  const helpText = "Calculates infection risk using the Wells-Riley model. Different pathogens produce varying amounts of infectious particles (quanta) per minute, affecting transmission probability.";

  const handlePositivityRateChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.1 && parseFloat(value) <= 100)) {
      setPositivityRate(value);
    }
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

  return (
    <Tile 
      title="Epi-Risk" 
      collapsible={true} 
      icon={<CoronavirusIcon className={styles['tile-icon']} />}
      helpText={helpText}
    >
      <div className={styles['epi-risk-container']}>
        <div className={tileStyles['tile-content']}>
          <CoronavirusIcon className={styles['epi-risk-icon']} />
          <div className={styles['epi-risk-value']}>{(risk * 100).toFixed(1)}%</div>
          
          <Typography variant="body2" className={styles['epi-risk-description']}>
            Transmission risk varies by pathogen and environmental factors
          </Typography>

          <Box display="flex" flexDirection="column" className={styles['epi-risk-params']} gap={2}>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Positivity Rate (%)"
                type="number"
                value={positivityRate}
                onChange={handlePositivityRateChange}
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
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
