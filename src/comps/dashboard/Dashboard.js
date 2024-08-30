import React from 'react';
import styles from './Dashboard.module.css';
import Room from './tiles/room/Room';
import Co2 from './tiles/co2/Co2';
import Pm from './tiles/pm/Pm';
import CentralVentilation from './tiles/airsystem/CentralVentilation';
import AirPurifier from './tiles/airsystem/AirPurifier';
import Aqi from './tiles/aqi/Aqi';
import EpiRisk from './tiles/epirisk/EpiRisk';
import { useAppContext } from '../../context/AppContext';

const Dashboard = () => {
  const { state } = useAppContext();
  const firstBuilding = state.buildings[0];
  const firstRoom = firstBuilding?.rooms[0];

  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <h2 className={styles['dashboard-header']}>AIR SUPPORT PROJECT</h2>
        <div className={styles['dashboard-content']}>
          {firstBuilding && firstRoom ? (
            <Room buildingId={firstBuilding.id} roomId={firstRoom.id} />
          ) : (
            <p>No rooms available</p>
          )}
          <Co2 />
          <Pm />
          <CentralVentilation />
          <AirPurifier />
          <Aqi />
          <EpiRisk />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;