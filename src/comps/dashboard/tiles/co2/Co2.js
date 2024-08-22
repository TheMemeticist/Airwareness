import React from 'react';
import Tile from '../Tile';
import styles from './Co2.module.css';
import AnimatedCO2 from './AnimatedCO2'; // New component

const Co2 = ({ co2ppm = 420, speed = 10, size = 100, colorScheme = 'default' }) => {
  const helpText = "Monitor the CO₂ levels to ensure adequate ventilation and maintain optimal indoor air quality. Elevated CO₂ levels can indicate poor ventilation and may affect cognitive function and overall comfort.";

  return (
    <Tile 
      title="CO₂" 
      helptxt={helpText}
    >
      <div className={styles['tile-content']}>
        <AnimatedCO2 rpm={speed} size={size} colorScheme={colorScheme} co2ppm={co2ppm} />
      </div>
    </Tile>
  );
};

export default Co2;