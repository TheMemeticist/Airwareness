import React from 'react';
import styles from './Dashboard.module.css';
import Tile from './tiles/Tile';
import Room from './tiles/room/Room';
import Co2 from './tiles/co2/Co2';



const Dashboard = () => {
  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <h2 className={styles['dashboard-header']}>Dashboard</h2>
        <div className={styles['dashboard-content']}>
          <Room title="Room" />
          <Co2 />
          <Tile />
          {/* Add more specific tiles as needed */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;