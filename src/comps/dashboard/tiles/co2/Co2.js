import React, { useState } from 'react';
import Tile from '../Tile';
import AnimatedCO2 from './AnimatedCO2';
import styles from './Co2.module.css';
import tileStyles from '../Tile.module.css';

const Co2 = ({ co2ppm = 420, speed = 10, size = 100, colorScheme = 'default' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const helpText = "Monitor the CO₂ levels to ensure adequate ventilation and maintain optimal indoor air quality.";

  return (
    <Tile 
      title="CO₂" 
      helptxt={helpText}
      collapsible={true}
      icon={<AnimatedCO2 rpm={speed} size={24} colorScheme={colorScheme} co2ppm={co2ppm} />}
      count={co2ppm}
    >
      <div className={`${tileStyles['tile-content']} ${styles['co2-container']}`}>
        {!collapsed && (
          <AnimatedCO2 rpm={speed} size={size} colorScheme={colorScheme} co2ppm={co2ppm} />
        )}
      </div>
    </Tile>
  );
};

export default Co2;