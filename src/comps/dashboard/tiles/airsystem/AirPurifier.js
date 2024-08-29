import React from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import airPurifierImage from './ASP-box.png';

const AirPurifier = ({ airflow = 500 }) => {
  return (
    <Tile title="Air Purifier" helptxt="This represents an air purifier unit.">
      <div className={tileStyles['tile-content']}> {/* Use tileStyles for tile-content */}
        <img src={airPurifierImage} alt="Air Purifier" className={styles['purifier-image']} />
        <h2>{airflow} CFM</h2>
      </div>
    </Tile>
  );
};

export default AirPurifier;