import React from 'react';
import ReactDOM from 'react-dom';
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

// Dynamically attach the React app to a container element if it exists
const container = document.getElementById('react-widget-root');
if (container) {
  ReactDOM.render(<App />, container);
}

export default App;
