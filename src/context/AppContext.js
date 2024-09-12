import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const initialState = {
  buildings: [
    {
      id: '1',
      name: 'Building 1',
      rooms: [
        {
          id: '1',
          name: 'Room 1',
          height: '10',
          floorArea: '900',
          occupants: {
            groups: [
              { name: 'Group 1', count: 1, age: '18' }
            ],
            activityLevel: 2
          }
        },
      ],
    },
  ],
};

const AppContext = createContext();

function reducer(state, action) {
  console.log('Reducer called with action:', action);
  switch (action.type) {
    case 'UPDATE_ROOM':
      return {
        ...state,
        buildings: state.buildings.map(building =>
          building.id === action.payload.buildingId
            ? {
                ...building,
                rooms: building.rooms.map(room =>
                  room.id === action.payload.roomId
                    ? { ...room, ...action.payload.roomData }
                    : room
                ),
              }
            : building
        ),
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'ADD_ROOM':
      return {
        ...state,
        buildings: state.buildings.map(building =>
          building.id === action.payload.buildingId
            ? {
                ...building,
                rooms: [...building.rooms, action.payload.room],
              }
            : building
        ),
      };
    case 'DELETE_ROOM':
      return {
        ...state,
        buildings: state.buildings.map(building =>
          building.id === action.payload.buildingId
            ? {
                ...building,
                rooms: building.rooms.filter(room => room.id !== action.payload.roomId),
              }
            : building
        ),
      };
    case 'ADD_BUILDING':
      return {
        ...state,
        buildings: [...state.buildings, action.payload],
      };
    case 'DELETE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.filter(building => building.id !== action.payload.buildingId),
      };
    case 'UPDATE_OCCUPANTS':
      return {
        ...state,
        buildings: state.buildings.map(building =>
          building.id === action.payload.buildingId
            ? {
                ...building,
                rooms: building.rooms.map(room =>
                  room.id === action.payload.roomId
                    ? { ...room, occupants: action.payload.occupants }
                    : room
                ),
              }
            : building
        ),
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [storedState, setStoredState] = useLocalStorage('appState', initialState);
  const [state, dispatch] = useReducer(reducer, storedState);

  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}