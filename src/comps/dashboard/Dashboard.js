import React from 'react';
import './Dashboard.css'; // Import the CSS file

const Dashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <h2 className="dashboard-header">Dashboard</h2>
        <div className="dashboard-content">
          {/* Your dashboard content goes here */}
          <p>This is your dashboard content.</p>
          {/* Add more content here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
