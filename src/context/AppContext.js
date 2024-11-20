import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import pathogenData from '../comps/dashboard/tiles/epirisk/PathogenInfo.json';

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
              { name: 'Teacher', count: 1, age: '35' },
              { name: 'Students', count: 22, age: '13' }
            ],
            activityLevel: 2
          }
        },
      ],
    },
  ],
  pathogens: {
    ...pathogenData
  },
  currentPathogen: 'sars-cov-2',
  infectiousCount: 0,
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
    case 'SET_CURRENT_PATHOGEN':
      return {
        ...state,
        currentPathogen: action.payload
      };
    case 'UPDATE_PATHOGEN':
      return {
        ...state,
        pathogens: {
          ...state.pathogens,
          [action.payload.pathogenId]: {
            ...state.pathogens[action.payload.pathogenId],
            ...action.payload.updates
          }
        }
      };
    case 'UPDATE_INFECTIOUS_COUNT':
      return {
        ...state,
        infectiousCount: action.payload
      };
    case 'ADD_PATHOGEN':
      return {
        ...state,
        pathogens: {
          ...state.pathogens,
          [action.payload.id]: action.payload.pathogen
        }
      };
    case 'DELETE_PATHOGEN': {
      const newPathogens = { ...state.pathogens };
      delete newPathogens[action.payload.pathogenId];
      
      return {
        ...state,
        pathogens: newPathogens,
        currentPathogen: action.payload.nextPathogenId
      };
    }
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