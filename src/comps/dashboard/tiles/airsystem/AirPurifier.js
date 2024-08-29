import React from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import airPurifierImage from './ASP-box.png';

const AirPurifier = ({ airflow = 500 }) => {
  return (
    <Tile title="Air Purifier" helptxt="This represents an air purifier unit.">
      <div className={styles['tile-content']}>
        <img src={airPurifierImage} alt="Air Purifier" className={styles['purifier-image']} />
        <h2>{airflow} CFM</h2>
      </div>
    </Tile>
  );
};

export default AirPurifier;