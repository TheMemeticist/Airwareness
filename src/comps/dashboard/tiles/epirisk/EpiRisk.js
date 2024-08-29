import React from 'react';
import Tile from '../Tile';
import styles from './EpiRisk.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles
import Warning from '@material-ui/icons/Warning';

const EpiRisk = ({ risk = 0.5 }) => {
  const helpText = "This tile displays the Wells-Riley model of transmission risk. It estimates the probability of infection based on various factors such as room size, ventilation, and occupancy.";

  return (
    <Tile title="Epi-Risk" helptxt={helpText}>
      <div className={tileStyles['tile-content']}> {/* Use tileStyles for tile-content */}
        <Warning className={styles['epi-risk-icon']} />
        <div className={styles['epi-risk-value']}>{(risk * 100).toFixed(1)}%</div>
      </div>
    </Tile>
  );
};

export default EpiRisk;
