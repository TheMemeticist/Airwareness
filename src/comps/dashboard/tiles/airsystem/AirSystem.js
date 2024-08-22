import React from 'react';
import Tile from '../Tile';
import styles from './AirSystem.module.css';
import tileStyles from '../Tile.module.css';
import airImage from './ASP-box.png';

const AirSystem = ({ title, airflow = 700 }) => {
  return (
    <Tile title="Air System" helptxt="This represents an air purifier or window inlet of air flow.">
      <div className={tileStyles['tile-content']}>
        <img src={airImage} alt="Air Purifier" className={styles['purifier-image']} />
        <h2>{airflow} CFM</h2>
      </div>
    </Tile>
  );
};

export default AirSystem;