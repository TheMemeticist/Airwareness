import React, { useState } from 'react';
import Tile from '../Tile';
import BiohazardIcon from './BiohazardIcon';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

const EpiRisk = ({ risk = 0.5 }) => {
  const [positivityRate, setPositivityRate] = useState('0.1');
  const [pathogen, setPathogen] = useState('sars-cov-2');

  const helpText = "This tile displays the Wells-Riley model of transmission risk. It estimates the probability of infection based on various factors such as room size, ventilation, occupancy, and pathogen characteristics.";

  const handlePositivityRateChange = (event) => {
    const value = event.target.value;
    if (value === '' || (parseFloat(value) >= 0.1 && parseFloat(value) <= 100)) {
      setPositivityRate(value);
    }
  };

  const handlePathogenChange = (event) => {
    setPathogen(event.target.value);
  };

  // Custom arrow down icon
  const ArrowDownIcon = () => (
    <svg
      className={styles['select-icon']}
      focusable="false"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 10l5 5 5-5z"></path>
    </svg>
  );

  return (
    <Tile 
      title="Epi-Risk" 
      collapsible={true} 
      icon={<BiohazardIcon className={styles['tile-icon']} />}
      count={risk * 100}
    >
      <div className={styles['epi-risk-container']}>
        <div className={tileStyles['tile-content']}>
          <BiohazardIcon />
          <div className={styles['epi-risk-value']}>{(risk * 100).toFixed(1)}%</div>
          <Box display="flex" flexDirection="row" className={styles['epi-risk-params']} gap={2}>
            <Box flex={1}>
              <TextField
                className={tileStyles['tile-text-field']}
                label="Positivity Rate (%)"
                type="number"
                value={positivityRate}
                onChange={handlePositivityRateChange}
                inputProps={{ min: 1, max: 100, step: 1 }}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Box>
            <Box flex={1}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel id="pathogen-select-label">Pathogen</InputLabel>
                <Select
                  labelId="pathogen-select-label"
                  id="pathogen-select"
                  value={pathogen}
                  onChange={handlePathogenChange}
                  label="Pathogen"
                  IconComponent={ArrowDownIcon}
                >
                  <MenuItem value="sars-cov-2">SARS-CoV-2</MenuItem>
                  <MenuItem value="measles">Measles</MenuItem>
                  <MenuItem value="influenza">Influenza</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </div>
      </div>
    </Tile>
  );
};

export default EpiRisk;
