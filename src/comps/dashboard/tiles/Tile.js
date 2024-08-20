import React from 'react';
import styles from './Tile.module.css';

const Tile = ({ title, children }) => {
  return (
    <div className={styles['tile']}>
      <h3 className={styles['tile-header']}>{title}</h3>
      <div className={styles['tile-content']}>
        {children}
      </div>
    </div>
  );
};

export default Tile;