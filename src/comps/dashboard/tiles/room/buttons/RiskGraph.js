import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import styles from './RiskGraph.module.css';
import { alpha } from '@mui/material';
import { useAppContext } from '../../../../../context/AppContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Constants
const MAX_DATA_POINTS = 500; // Limit to prevent unbounded growth, adjust as needed
const LOW_COLOR = '#4caf50'; // Green
const MID_COLOR = '#ffeb3b'; // Yellow
const HIGH_COLOR = '#f44336'; // Red

// Color mixing function
function mix(color1, color2, weight) {
  const d2h = (d) => d.toString(16).padStart(2, '0');
  const h2d = (h) => parseInt(h, 16);

  weight = Math.max(0, Math.min(1, weight));
  
  const c1 = {
    r: h2d(color1.slice(1, 3)),
    g: h2d(color1.slice(3, 5)),
    b: h2d(color1.slice(5, 7))
  };
  
  const c2 = {
    r: h2d(color2.slice(1, 3)),
    g: h2d(color2.slice(3, 5)),
    b: h2d(color2.slice(5, 7))
  };

  const r = Math.round(c1.r * (1 - weight) + c2.r * weight);
  const g = Math.round(c1.g * (1 - weight) + c2.g * weight);
  const b = Math.round(c1.b * (1 - weight) + c2.b * weight);

  return `#${d2h(r)}${d2h(g)}${d2h(b)}`;
}

// Get a color from 0 to 1 risk, smoothly transitioning from green to yellow to red
const getRiskColor = (risk) => {
  const riskValue = risk * 100;  // Convert from decimal [0,1] to percentage [0,100]

  if (riskValue === 0) return LOW_COLOR;
  if (riskValue <= 49.5) {
    // Interpolate between green and yellow
    return alpha(
      mix(LOW_COLOR, MID_COLOR, riskValue / 49.5),
      1
    );
  }

  // Interpolate between yellow and red for values > 49.5%
  return alpha(
    mix(MID_COLOR, HIGH_COLOR, (riskValue - 49.5) / 49.5),
    1
  );
};

// Helper to create gradients for border and background
const createGradient = (ctx, chartArea, transparency = 1) => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  // We create three stops: at 0%, around 49.5%, and 100%
  gradient.addColorStop(0, alpha(getRiskColor(0), transparency));
  gradient.addColorStop(0.495, alpha(getRiskColor(0.495), transparency));
  gradient.addColorStop(1, alpha(getRiskColor(0.99), transparency));
  return gradient;
};

export const RiskGraph = ({ risk, exposureTime }) => {
  const { state } = useAppContext();
  const [dataPoints, setDataPoints] = useState([]);
  const lastUpdateTime = useRef(0);
  const chartRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Add data point at most every 2 seconds
  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime.current >= 2000) {
      setDataPoints(prev => {
        const newData = [...prev, { time: exposureTime, risk }];
        // Limit data points to prevent unbounded growth
        if (newData.length > MAX_DATA_POINTS) {
          newData.shift();
        }
        return newData;
      });
      lastUpdateTime.current = currentTime;
    }
  }, [risk, exposureTime]);

  // Reset graph when timer resets
  useEffect(() => {
    if (exposureTime === 0) {
      setDataPoints([]);
      lastUpdateTime.current = 0;
    }
  }, [exposureTime]);

  // Add this effect to watch for graph data reset
  useEffect(() => {
    if (state.graphDataReset) {
      setDataPoints([]);
      lastUpdateTime.current = 0;
    }
  }, [state.graphDataReset]);

  const data = {
    labels: dataPoints.map(point => point.time.toFixed(1)),
    datasets: [
      {
        label: 'Transmission Risk',
        data: dataPoints.map(point => (point.risk * 100).toFixed(1)),
        borderColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // If the chart is not rendered yet, default to low risk color
            return getRiskColor(0);
          }

          // Create a vertical gradient for the line border
          return createGradient(ctx, chartArea, 1);
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return alpha(getRiskColor(0), 0.1);
          }

          // Create a vertical gradient for the line background
          return createGradient(ctx, chartArea, 0.1);
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        display: isHovered,
        min: 0,
        title: {
          display: isHovered,
          text: 'Time (hours)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: isHovered ? 5 : 1,
          // Show at least one label for context
          callback: function(value, index) {
            return this.getLabelForValue(value);
          }
        },
        grid: {
          display: isHovered,
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        display: isHovered,
        title: {
          display: isHovered,
          text: 'Risk (%)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxTicksLimit: isHovered ? 5 : 1
        },
        grid: {
          display: isHovered,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        min: 0,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: isHovered,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `Risk: ${context.raw}%`,
          title: (context) => `Time: ${context[0].label} hours`
        }
      }
    }
  };
  
  return (
    <div 
      className={styles.graphContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered && (
        <div className={styles.miniLabel}>
          Risk Trend
        </div>
      )}
      <Line data={data} options={options} ref={chartRef} />
    </div>
  );
};
