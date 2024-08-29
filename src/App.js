import React from 'react';
import styles from './App.module.css';
import SplashScreen from './comps/splashscreen/SplashScreen';
import Dashboard from './comps/dashboard/Dashboard';
import { AppProvider } from './context/AppContext';

const App = () => {
  return (
    <AppProvider>
      <div className={styles.app}>
        <SplashScreen />
        <Dashboard />
      </div>
    </AppProvider>
  );
};

export default App;
