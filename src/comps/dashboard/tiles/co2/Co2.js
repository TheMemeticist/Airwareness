import React from 'react';
import Tile from '../Tile';
import styles from './Co2.module.css';

const Co2 = ({ title, co2ppm = 420 }) => {
  return (
    <Tile title={"CO₂"} helptxt={"This is the amount of CO₂ in the air."}>
      <div className={styles['co2-content']}>
        <div className={styles['co2-icon-container']}>
          <span className={`material-symbols-outlined ${styles['leaf-icon']}`}>eco</span>
        </div>
        <h3>{co2ppm} ppm</h3>
      </div>
    </Tile>
  );
};

export default Co2;