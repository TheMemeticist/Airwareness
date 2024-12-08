import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import ThreeDScene from './threescene/3Dscene';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';
import { Settings as SettingsIcon, Help as HelpIcon } from '@mui/icons-material';
import RoomSettings from './buttons/settings/RoomSettings';
import { Timer } from './buttons/Timer';
import { RoomControls } from './buttons/RoomControls';
import { useRoomDimensions } from './hooks/useRoomDimensions';
import ArticleIcon from '@mui/icons-material/Article';
import descriptionStyles from '../TileDescriptions.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { RiskGraph } from './buttons/RiskGraph';

const Room = React.memo(({ buildingId, roomId, children }) => {
  const { state, dispatch } = useAppContext();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [currentRisk, setCurrentRisk] = useState(0);

  // Memoize building and rooms lookup
  const { building, rooms } = useMemo(() => {
    const building = state.buildings.find(b => b.id === buildingId);
    return {
      building,
      rooms: building?.rooms || []
    };
  }, [state.buildings, buildingId]);

  // Memoize room lookup
  const room = useMemo(() => 
    rooms.find(r => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  // Use the new hook
  const {
    dimensions,
    dimensionsInMeters,
    inputValues,
    handleInputChange,
    handleIncrement,
    handleDecrement
  } = useRoomDimensions(room, dispatch, buildingId);

  // Add this function inside the Room component
  const handleFloorAreaIncrement = (step) => {
    handleIncrement('floorArea')(step);
  };

  const handleFloorAreaDecrement = (step) => {
    handleDecrement('floorArea')(step);
  };

  // Memoize room actions with rooms dependency
  const roomActions = useMemo(() => ({
    createNewRoom: () => {
      const newRoomId = String(Date.now());
      dispatch({
        type: 'ADD_ROOM',
        payload: {
          buildingId,
          room: {
            id: newRoomId,
            name: `${room?.name || 'New Room'} (copy)`,
            height: room?.height || '',
            floorArea: room?.floorArea || '',
          },
        },
      });
      setSelectedRoomId(newRoomId);
    },
    deleteRoom: () => {
      if (rooms.length <= 1) return;
      dispatch({
        type: 'DELETE_ROOM',
        payload: { buildingId, roomId: selectedRoomId }
      });
      setSelectedRoomId(rooms[0].id);
    }
  }), [buildingId, room, rooms, selectedRoomId, dispatch]);

  useEffect(() => {
    setSelectedRoomId(roomId);
  }, [roomId]);

  // Handler for room name changes
  const handleRoomNameChange = useCallback((roomId, newName) => {
    dispatch({
      type: 'UPDATE_ROOM',
      payload: {
        buildingId,
        roomId,
        roomData: { name: newName }
      }
    });
  }, [buildingId, dispatch]);

  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
  }, []);

  const speedSliderRef = useRef(null);
  const simulationTimerRef = useRef(null);

  // Add event listener to hide speed slider on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        speedSliderRef.current &&
        !speedSliderRef.current.contains(event.target) &&
        simulationTimerRef.current &&
        !simulationTimerRef.current.contains(event.target)
      ) {
        setShowSpeedControl(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add this useEffect near your other useEffects
  useEffect(() => {
    const handleGlobalClick = () => {
      if (showDescription) {
        setShowDescription(false);
      }
    };

    if (showDescription) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [showDescription]);

  // Add this effect to update risk from EpiRisk calculations
  useEffect(() => {
    const subscription = state.riskUpdates.subscribe(risk => {
      setCurrentRisk(risk);
    });
    return () => subscription.unsubscribe();
  }, [state.riskUpdates]);

  if (!room) {
    return (
      <Tile title="Room Not Found" isRoomTile={true}>
        <div className={tileStyles['tile-content']}>
          <p>Unable to find room data. Please check the provided building and room IDs.</p>
          <p>Building ID: {buildingId}</p>
          <p>Room ID: {roomId}</p>
        </div>
      </Tile>
    );
  }

  const { name, height, floorArea } = room;

  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
  };

  const helpText = "Use this tool to edit room attributes such as size and ventilation rate (natural or HVAC). This helps provide more accurate air quality estimates.";

  // Add console.log to debug click handler
  const handleHelpClick = (e) => {
    e.stopPropagation();  // Prevent the click from immediately triggering the global handler
    setShowDescription(!showDescription);
  };

  return (
    <Tile
      title={
        <Box className={styles['room-title-container']}>
          <span className={styles['room-name']}>{room?.name}</span>
          <HelpIcon 
            className={styles['help-icon']}
            fontSize="small"
            onClick={handleHelpClick}
          />
        </Box>
      }
      helptxt={helpText}
      isRoomTile={true}
      collapsible={false}
    >
      <div className={`${tileStyles['tile-content']} ${styles['room-content']}`}>
        <Button
          className={styles['settings-button']}
          onClick={() => setSettingsOpen(true)}
          aria-label="Room Settings"
        >
          <SettingsIcon />
        </Button>
        <Timer initialSpeed={speed} onSpeedChange={handleSpeedChange} />

        {room ? (
          <>
            <div className={styles['room-image-container']}>
              <ThreeDScene
                dimensions={{
                  width: dimensions.width,
                  length: dimensions.length,
                  height: dimensions.height
                }}
                simulationSpeed={speed}
              />
            </div>
            <RoomControls
              inputValues={inputValues}
              handleInputChange={handleInputChange}
              handleIncrement={handleIncrement}
              handleDecrement={handleDecrement}
            />
            <div className={styles['room-icons-container']}>
              {children}
            </div>
          </>
        ) : (
          <p>Please select a room or create a new one.</p>
        )}

        <RiskGraph 
          risk={currentRisk} 
          exposureTime={state.exposureTime} 
        />

        <RoomSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          selectedRoomId={selectedRoomId}
          rooms={rooms}
          onRoomChange={(newRoomId) => {
            setSelectedRoomId(newRoomId);
            setSettingsOpen(false);
          }}
          onCreateRoom={roomActions.createNewRoom}
          onDeleteRoom={roomActions.deleteRoom}
          onRoomNameChange={handleRoomNameChange}
        />
      </div>

      {showDescription && (
        <>
          <div 
            className={styles['description-overlay']}
            onClick={() => setShowDescription(false)}
          />
          <div 
            className={styles['description-container']}
            onClick={() => setShowDescription(false)}
          >
            <div 
              className={styles['description-primary']}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                className={styles['close-button']}
                onClick={() => setShowDescription(false)}
                size="small"
                sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="body2" color="white" textAlign="left">
                <p>This visualization tool simulates a Wells-Riley risk assessment in 3D space.</p>
                <p>In well-mixed air conditions, one infectious dose (quanta) will cause infection in approximately 63% of susceptible individuals. Each red particle represents one quanta that could potentially cause infection:</p>
                <ul>
                  <li>Particles move realistically and dilute through the space, affected by ventilation rates (ACH)</li>
                  <li>Higher ventilation rates increase particle speed and dilution</li>
                  <li>Particle count scales with the number of infectious occupants and their emission rate</li>
                  <li>The simulation accounts for room size and particle decay over time</li>
                </ul>
        
                <p>The particle behavior updates in real-time to reflect how air quality interventions affect transmission risk.</p>
                <p>The time controls allow you to:</p>
                <ul>
                  <li>Reset the simulation to start fresh</li>
                  <li>Adjust simulation speed using the speed multiplier so you can observe long-term exposure patterns</li>
                </ul>

                <Button
                  variant="contained"
                  className={descriptionStyles['source-button']}
                  href="https://www.nafahq.org/assets/pdf/2012-03-01-Wells-Riley-Final-Report/"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<ArticleIcon />}
                >
                  Learn more about indoor space management
                </Button>
              </Typography>
            </div>
          </div>
        </>
      )}
    </Tile>
  );
});

export default Room;