import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const initialState = {
  room: {
    height: '10',
    floorArea: '900',
  },
  // Add other initial state properties here
};

const AppContext = createContext();

function reducer(state, action) {
  console.log('Reducer called with action:', action);
  switch (action.type) {
    case 'UPDATE_ROOM':
      return { ...state, room: { ...state.room, ...action.payload } };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
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