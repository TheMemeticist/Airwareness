import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Tile from '../Tile';
import styles from './Room.module.css';
import tileStyles from '../Tile.module.css';
import ThreeDScene from './threescene/3Dscene';
import { Box, Button } from '@mui/material';
import { useAppContext } from '../../../../context/AppContext';
import { Settings as SettingsIcon } from '@mui/icons-material';
import RoomSettings from './settings/RoomSettings';
import { Timer } from './buttons/Timer';
import { RoomControls } from './buttons/RoomControls';
import { useRoomDimensions } from './hooks/useRoomDimensions';

const Room = React.memo(({ buildingId, roomId, children }) => {
  const { state, dispatch } = useAppContext();
  const [selectedRoomId, setSelectedRoomId] = useState(roomId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

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

  return (
    <Tile
      title={
        <Box className={styles['room-title-container']}>
          <span className={styles['room-name']}>{room?.name}</span>
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
    </Tile>
  );
});

export default Room;