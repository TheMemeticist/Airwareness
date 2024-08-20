import React from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import roomImage from './iso-metric-room.png';

const Room = ({ title, children }) => {
  return (
    <Tile title={title}>
      <div className={styles['room-content']}>
        <img src={roomImage} alt="Room" className={styles['room-image']} />
        {children}
      </div>
    </Tile>
  );
};

export default Room;
