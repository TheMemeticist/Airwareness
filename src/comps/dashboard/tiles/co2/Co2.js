import React from 'react';
import Tile from '../Tile';
import styles from './Co2.module.css';
import EcoIcon from '@material-ui/icons/Eco';

const Co2 = ({ title, children }) => {
  return (
    <Tile title={title}>
      <div className={styles['co2-content']}>
        <EcoIcon className={styles['co2-icon']} />
        <span className="material-symbols-outlined">co2</span>
        {children}
      </div>
    </Tile>
  );
};

export default Co2;