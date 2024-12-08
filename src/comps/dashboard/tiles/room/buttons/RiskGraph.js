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

// Add the color mixing helper function from EpiRisk
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

// Add the getRiskColor function from EpiRisk
const getRiskColor = (risk) => {
  const riskValue = risk * 100;  // Convert from decimal to percentage
  
  if (riskValue === 0) return '#4caf50';  // Green
  if (riskValue <= 49.5) {  // Changed from 50 to 49.5 to account for max 99%
    // Interpolate between green and yellow (0-49.5%)
    return alpha(
      mix(
        '#4caf50',  // Green
        '#ffeb3b',  // Yellow
        riskValue / 49.5
      ),
      1
    );
  }
  // Interpolate between yellow and red (49.5-99%)
  return alpha(
    mix(
      '#ffeb3b',  // Yellow
      '#f44336',  // Red
      (riskValue - 49.5) / 49.5
    ),
    1
  );
};

export const RiskGraph = ({ risk, exposureTime }) => {
  const [dataPoints, setDataPoints] = useState([]);
  const lastUpdateTime = useRef(0);
  const chartRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Update data points when risk or time changes
  useEffect(() => {
    const currentTime = Date.now();
    // Only update every 2 seconds to match Timer update frequency
    if (currentTime - lastUpdateTime.current >= 2000) {
      setDataPoints(prev => [...prev, { time: exposureTime, risk }]);
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

  const data = {
    labels: dataPoints.map(point => point.time.toFixed(1)),
    datasets: [
      {
        label: 'Transmission Risk',
        data: dataPoints.map(point => (point.risk * 100).toFixed(1)),
        borderColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;

          if (!chartArea) {
            // This can happen when the chart is not yet rendered
            return getRiskColor(0);
          }

          // Create gradient
          const gradientBorder = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          
          // Add color stops
          gradientBorder.addColorStop(0, getRiskColor(0));      // 0% risk (bottom)
          gradientBorder.addColorStop(0.495, getRiskColor(0.495)); // 49.5% risk
          gradientBorder.addColorStop(1, getRiskColor(0.99));   // 99% risk (top)
          
          return gradientBorder;
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;

          if (!chartArea) {
            return alpha(getRiskColor(0), 0.1);
          }

          // Create gradient
          const gradientBg = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          
          // Add color stops with transparency
          gradientBg.addColorStop(0, alpha(getRiskColor(0), 0.1));
          gradientBg.addColorStop(0.495, alpha(getRiskColor(0.495), 0.1));
          gradientBg.addColorStop(1, alpha(getRiskColor(0.99), 0.1));
          
          return gradientBg;
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
    animation: {
      duration: 0
    },
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
          maxTicksLimit: isHovered ? 5 : 0,
          callback: function(value, index) {
            // Hide the first tick label
            return index === 0 ? '' : this.getLabelForValue(value);
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
          maxTicksLimit: isHovered ? 5 : 0
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