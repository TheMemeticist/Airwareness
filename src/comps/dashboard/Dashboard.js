import React from 'react';
import styles from './Dashboard.module.css'; // Import the CSS module

const Dashboard = () => {
  return (
    <div className={styles['dashboard-wrapper']}>
      <div className={styles['dashboard-container']}>
        <h2 className={styles['dashboard-header']}>Dashboard</h2>
        <div className={styles['dashboard-content']}>
          <p>This is your dashboard content.</p>
          {/* TODO: Add more dashboard content components here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
