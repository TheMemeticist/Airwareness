import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import pathogenData from '../comps/dashboard/tiles/epirisk/PathogenInfo.json';
import { Subject } from 'rxjs';

const createFreshRiskUpdates = () => new Subject();

// Separate the non-serializable state
const nonSerializableState = {
  riskUpdates: createFreshRiskUpdates()
};

// Initial state without non-serializable values
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
  currentPathogen: 'sars-cov-2-omicron',
  infectiousCount: 0,
  splashScreenVisible: true,
  ventilationRate: 1,
  exposureTime: 0,
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
    case 'SET_SPLASH_SCREEN_VISIBLE':
      return {
        ...state,
        splashScreenVisible: action.payload
      };
    case 'UPDATE_PARTICLE_HALF_LIFE':
      return {
        ...state,
        particleHalfLife: action.payload
      };
    case 'UPDATE_VENTILATION_RATE':
      return {
        ...state,
        ventilationRate: action.payload
      };
    case 'RESET_TIMER':
      return {
        ...state,
        timerReset: Date.now()
      };
    case 'UPDATE_EXPOSURE_TIME':
      return {
        ...state,
        exposureTime: action.payload
      };
    case 'SET_RISK_UPDATES':
      // Don't store this in the serializable state
      nonSerializableState.riskUpdates = action.payload;
      return state;
    case 'RESET_STATE':
      // Reset both serializable and non-serializable state
      nonSerializableState.riskUpdates = createFreshRiskUpdates();
      return {
        ...initialState,
        riskUpdates: nonSerializableState.riskUpdates
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [storedState, setStoredState] = useLocalStorage('appState', initialState);
  const [state, dispatch] = useReducer(reducer, {
    ...(storedState || initialState),
    riskUpdates: nonSerializableState.riskUpdates
  });

  // Add an effect to handle initialization
  useEffect(() => {
    if (!storedState) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [storedState]);

  useEffect(() => {
    // Only store serializable state
    const stateToStore = { ...state };
    delete stateToStore.riskUpdates;
    setStoredState(stateToStore);
  }, [state, setStoredState]);

  // Provide both state and non-serializable state
  return (
    <AppContext.Provider value={{ 
      state: {
        ...state,
        riskUpdates: nonSerializableState.riskUpdates
      }, 
      dispatch 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}