import React from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import roomImage from './iso-metric-classroom.png';

const Room = ({ title, children }) => {
  const helpText = "Use this tool to edit room attributes such as size and ventilation rate (natural or HVAC). This helps provide more accurate air quality estimates.";

  return (
    <Tile 
      title="Room" 
      helptxt={helpText}
    >
      <div className={styles['tile-content']}>
        <img src={roomImage} alt="Room" className={styles['room-image']} />
        {children}
      </div>
    </Tile>
  );
};

export default Room;