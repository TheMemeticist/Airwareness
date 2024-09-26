import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import Room from './tiles/room/Room';
import Co2 from './tiles/co2/Co2';
import Pm from './tiles/pm/Pm';
import CentralVentilation from './tiles/airsystem/CentralVentilation';
import AirPurifier from './tiles/airsystem/AirPurifier';
import Aqi from './tiles/aqi/Aqi';
import EpiRisk from './tiles/epirisk/EpiRisk';
import Occupants from './tiles/occupants/Occupants';
import { useAppContext } from '../../context/AppContext';
import { FormControl, InputLabel, Select, MenuItem, Box, Button } from '@mui/material';

const ArrowDownIcon = () => (
  <svg
    className={styles['select-icon']}
    focusable="false"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M7 10l5 5 5-5z"></path>
  </svg>
);

const Dashboard = () => {
  const { state, dispatch } = useAppContext();
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  useEffect(() => {
    if (state.buildings.length > 0 && !state.buildings.find(b => b.id === selectedBuildingId)) {
      setSelectedBuildingId(state.buildings[0].id);
    }
  }, [state.buildings, selectedBuildingId]);

  const selectedBuilding = state.buildings.find(b => b.id === selectedBuildingId);

  const handleBuildingChange = (event) => {
    setSelectedBuildingId(event.target.value);
  };

  const createNewBuilding = () => {
    const newBuildingId = String(Date.now());
    const newRoomId = String(Date.now() + 1); // Ensure unique ID for the room
    const sourceBuilding = state.buildings[state.buildings.length - 1]; // Get the last building
    const newBuilding = {
      id: newBuildingId,
      name: `${sourceBuilding.name} (copy)`,
      sourceId: sourceBuilding.id,
      rooms: [{
        id: newRoomId,
        name: 'Room 1',
        height: '10',
        floorArea: '900',
      }],
    };
    dispatch({
      type: 'ADD_BUILDING',
      payload: newBuilding,
    });
    setSelectedBuildingId(newBuildingId);
  };

  const deleteBuilding = () => {
    if (state.buildings.length <= 1) return;
    const newBuildings = state.buildings.filter(b => b.id !== selectedBuildingId);
    dispatch({
      type: 'DELETE_BUILDING',
      payload: { buildingId: selectedBuildingId },
    });
    setSelectedBuildingId(newBuildings[0].id);
  };

  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <h2 className={styles['dashboard-header']}>AIR SUPPORT PROJECT</h2>
        <Box className={styles['building-select-container']}>
          <FormControl variant="outlined" size="small" className={styles['building-select']}>
            <InputLabel id="building-select-label" className={styles['building-select-label']}>Building</InputLabel>
            <Select
              labelId="building-select-label"
              id="building-select"
              value={selectedBuildingId}
              onChange={handleBuildingChange}
              label="Select a Building"
              IconComponent={ArrowDownIcon}
              className={styles['building-select']}
              MenuProps={{
                classes: { paper: styles['menu-paper'] }
              }}
            >
              {state.buildings.map((building) => (
                <MenuItem 
                  key={building.id} 
                  value={building.id} 
                  className={styles['building-select-item']}
                >
                  {building.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box className={styles['building-actions-container']}>
            <Button
              variant="contained"
              onClick={createNewBuilding}
              className={`${styles['action-button']} ${styles['add-building-button']}`}
            >
              <span className={styles['button-content']}>+</span>
            </Button>
            {state.buildings.length > 1 && (
              <Button
                variant="contained"
                onClick={deleteBuilding}
                className={`${styles['action-button']} ${styles['delete-building-button']}`}
              >
                <span className={styles['button-content']}>-</span>
              </Button>
            )}
          </Box>
        </Box>
        <div className={styles['dashboard-content']}>
          {selectedBuilding && selectedBuilding.rooms.length > 0 ? (
            <div className={styles['responsive-layout']}>
              <div className={styles['main-component']}>
                <Room buildingId={selectedBuilding.id} roomId={selectedBuilding.rooms[0].id} />
              </div>
              <div className={styles['secondary-components']}>
                {/* <Occupants buildingId={selectedBuilding.id} roomId={selectedBuilding.rooms[0].id} />
                <Co2 />
                <Pm />
                <CentralVentilation />
                <AirPurifier />
                <Aqi />
                <EpiRisk /> */}
              </div>
            </div>
          ) : (
            <p className={styles['no-rooms-message']}>No rooms available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;