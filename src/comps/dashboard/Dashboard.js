import React from 'react';
import styles from './Dashboard.module.css';
import Tile from './tiles/Tile';
import Room from './tiles/room/Room';
import Co2 from './tiles/co2/Co2';
import Pm from './tiles/pm/Pm';
import CentralVentilation from './tiles/airsystem/CentralVentilation';
import AirPurifier from './tiles/airsystem/AirPurifier';
import Aqi from './tiles/aqi/Aqi';

const Dashboard = () => {
  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <h2 className={styles['dashboard-header']}>AIR SUPPORT PROJECT</h2>
        <div className={styles['dashboard-content']}>
          <Room />
          <Co2 />
          <Pm />
          <CentralVentilation />
          <AirPurifier />
          <Aqi />
          {/* Add more specific tiles as needed */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;