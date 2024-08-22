import React from 'react';
import Tile from '../Tile';
import styles from './Pm.module.css';
import AnimatedPM from './AnimatedPM';

const Pm = ({ pm1 = 5, pm25 = 12, pm10 = 20, speed = 10, size = 1000, colorScheme = 'default' }) => {
  const helpText = "Monitor PM (Particulate Matter) levels to assess air quality. PM1, PM2.5, and PM10 refer to particles with diameters of 1, 2.5, and 10 micrometers or smaller, respectively. These particles can penetrate the respiratory system, with smaller particles posing greater health risks.";

  return (
    <Tile 
      title="Particulate Matter" 
      helptxt={helpText}
    >
      <div className={styles['tile-content']}>
        <AnimatedPM rpm={speed} size={size} colorScheme={colorScheme} pm1={pm1} pm25={pm25} pm10={pm10} />
      </div>
    </Tile>
  );
};

export default Pm;
