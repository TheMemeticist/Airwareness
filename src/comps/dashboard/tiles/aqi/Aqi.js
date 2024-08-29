import React from 'react';
import Tile from '../Tile';
import styles from './Aqi.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import CloudOutlined from '@material-ui/icons/CloudOutlined';

const Aqi = ({ aqi = 50 }) => {
  const helpText = "Monitor the AQI (Air Quality Index) to assess air quality. AQI values range from 0 to 500, with higher values indicating worse air quality.";

  return (
    <Tile title="AQI" helptxt={helpText}>
      <div className={tileStyles['tile-content']}> {/* Use tileStyles for tile-content */}
        <CloudOutlined className={styles['aqi-icon']} />
        <div className={styles['aqi-value']}>{aqi}</div>
      </div>
    </Tile>
  );
};

export default Aqi;
