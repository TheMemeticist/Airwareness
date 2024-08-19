import React from 'react';
import styles from './App.module.css';
import SplashScreen from './comps/splashscreen/SplashScreen';
import Dashboard from './comps/dashboard/Dashboard';

const App: React.FC = () => {
  return (
    <div className={styles.app}>
      <SplashScreen />
      <Dashboard /> 
    </div>
  );
};

export default App;
