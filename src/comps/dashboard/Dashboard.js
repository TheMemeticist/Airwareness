import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './Dashboard.module.css';
import Room from './tiles/room/Room';
import Co2 from './tiles/co2/Co2';
import Pm from './tiles/pm/Pm';
import Airflow from './tiles/airsystem/Airflow';
import AirPurifier from './tiles/airsystem/AirPurifier';
import Aqi from './tiles/aqi/Aqi';
import EpiRisk from './tiles/epirisk/EpiRisk';
import Occupants from './tiles/occupants/Occupants';
import { useAppContext } from '../../context/AppContext';
import { FormControl, InputLabel, Select, MenuItem, Box, Button, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import GitHubIcon from '@mui/icons-material/GitHub';

const ArrowDownIcon = React.memo(() => (
  <svg
    className={styles['select-icon']}
    focusable="false"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M7 10l5 5 5-5z"></path>
  </svg>
));

const Dashboard = React.memo(() => {
  const { state, dispatch } = useAppContext();
  
  const [selectedBuildingId, setSelectedBuildingId] = useState(() => 
    state.buildings.length > 0 ? state.buildings[0].id : ''
  );

  const selectedBuilding = useMemo(() => 
    state.buildings.find(b => b.id === selectedBuildingId),
    [state.buildings, selectedBuildingId]
  );

  const handleBuildingChange = useCallback((event) => {
    setSelectedBuildingId(event.target.value);
  }, []);

  const createNewBuilding = useCallback(() => {
    const sourceBuilding = state.buildings[state.buildings.length - 1];
    const newBuildingId = String(Date.now());
    const newRoomId = String(Date.now() + 1);
    
    dispatch({
      type: 'ADD_BUILDING',
      payload: {
        id: newBuildingId,
        name: `${sourceBuilding.name} (copy)`,
        sourceId: sourceBuilding.id,
        rooms: [{
          id: newRoomId,
          name: 'Room 1',
          height: '10',
          floorArea: '900',
        }],
      },
    });
    setSelectedBuildingId(newBuildingId);
  }, [state.buildings, dispatch]);

  const deleteBuilding = useCallback(() => {
    if (state.buildings.length <= 1) return;
    dispatch({
      type: 'DELETE_BUILDING',
      payload: { buildingId: selectedBuildingId },
    });
    setSelectedBuildingId(state.buildings[0].id);
  }, [state.buildings, selectedBuildingId, dispatch]);

  const buildingMenuItems = useMemo(() => 
    state.buildings.map((building) => (
      <MenuItem 
        key={building.id} 
        value={building.id} 
        className={styles['building-select-item']}
      >
        {building.name}
      </MenuItem>
    )),
    [state.buildings]
  );

  const handleReset = useCallback(() => {
    localStorage.clear();
    dispatch({ type: 'RESET_STATE' });
    window.location.reload();
  }, [dispatch]);

  const dashboardContent = useMemo(() => {
    if (!selectedBuilding || !selectedBuilding.rooms.length) {
      return <p className={styles['no-rooms-message']}>No rooms available</p>;
    }

    return (
      <div className={styles['responsive-layout']}>
        <div className={styles['main-component']}>
          <Room 
            buildingId={selectedBuilding.id} 
            roomId={selectedBuilding.rooms[0].id} 
          />
        </div>
        <div className={styles['secondary-components']}>
          <EpiRisk />
          <Occupants 
            buildingId={selectedBuilding.id} 
            roomId={selectedBuilding.rooms[0].id} 
          />
          <Airflow />
        </div>
      </div>
    );
  }, [selectedBuilding]);

  const buildingActions = useMemo(() => (
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
  ), [state.buildings.length, createNewBuilding, deleteBuilding]);

  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <div className={styles['nav-buttons-container']}>
          <div className={styles['left-nav-buttons']}>
            <Tooltip title="AIR SUPPORT Project Homepage">
              <a href="https://airsupportproject.com/" className={styles['home-link']}>
                <HomeIcon className={styles['home-icon']} />
              </a>
            </Tooltip>
            <Tooltip title="View on GitHub">
              <a href="https://github.com/TheMemeticist/Airwareness" className={styles['github-link']}>
                <GitHubIcon className={styles['github-icon']} />
              </a>
            </Tooltip>
          </div>
          <Tooltip title="Reset Application Data">
            <button onClick={handleReset} className={styles['reset-button']}>
              <RestartAltIcon className={styles['reset-icon']} />
            </button>
          </Tooltip>
        </div>
        {/* <div className={styles['header-container']}>
          <h2 className={styles['dashboard-header']}>AIR SUPPORT PROJECT</h2>
        </div> */}
        {/* <Box className={styles['building-select-container']}>
          <FormControl variant="outlined" size="small" className={styles['building-select']}>
            <InputLabel id="building-select-label" className={styles['building-select-label']}>
              Building
            </InputLabel>
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
              {buildingMenuItems}
            </Select>
          </FormControl>
          {buildingActions}
        </Box> */}
        {dashboardContent}
        <footer className={styles['disclaimer-footer']}>
          <small>
            Disclaimer: This application provides estimates and models based on available data and simplified assumptions. 
            Results may not accurately represent all real-world scenarios, variables, or edge cases. 
            This tool should be used as one of many resources in decision-making processes.
          </small>
        </footer>
      </div>
    </div>
  );
});

export default Dashboard;