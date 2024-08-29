import React from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import centralVentImage from './Vent-Image.png';

const CentralVentilation = ({ airflow = 1000 }) => {
  return (
    <Tile title="Central Ventilation" helptxt="This represents a central HVAC system.">
      <div className={styles['tile-content']}>
        <img src={centralVentImage} alt="Central Ventilation" className={styles['purifier-image']} />
        <h2>{airflow} CFM</h2>
      </div>
    </Tile>
  );
};

export default CentralVentilation;