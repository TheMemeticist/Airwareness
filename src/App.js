// App.js
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './App.module.css';
import SplashScreen from './comps/splashscreen/SplashScreen';
import Dashboard from './comps/dashboard/Dashboard';
import Clouds from './comps/clouds/Clouds';
import { AppProvider } from './context/AppContext';

// Import fonts directly in JavaScript
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@200;500&display=swap&family=Material+Symbols+Outlined';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const App = () => {
  return (
    <AppProvider>
      <div className={styles.app}>
        {/* <Clouds /> */}
        <Dashboard />
      </div>
    </AppProvider>
  );
};

// Attach the React app to the container element
const container = document.getElementById('react-widget-root');
if (container) {
  ReactDOM.render(<App />, container);
}

export default App;
