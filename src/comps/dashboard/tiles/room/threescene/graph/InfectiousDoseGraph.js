import React, { useRef, useEffect, useState } from 'react';
import { useGraphData } from './useGraphData';
import styles from './InfectiousDoseGraph.module.css';

const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)}m`;
  } else if (seconds < 86400) {
    return `${(seconds / 3600).toFixed(1)}h`;
  } else {
    return `${(seconds / 86400).toFixed(1)}d`;
  }
};

const calculateFontSize = (canvas, baseFontSize = 24, isMinimized = true) => {
  const scale = Math.min(canvas.width / 200, canvas.height / 500);
  const baseSize = Math.max(Math.floor(baseFontSize * scale), 12);
  return isMinimized ? baseSize * 2 : baseSize;
};

const InfectiousDoseGraph = ({ particleSystem, speed }) => {
  const canvasRef = useRef(null);
  const data = useGraphData(particleSystem, speed);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    const padding = {
      left: 90,
      right: 100,
      top: 60,
      bottom: 70
    };

    const graphWidth = width - (padding.left + padding.right);
    const graphHeight = height - (padding.top + padding.bottom);

    // Find max values for both metrics
    const maxDoses = Math.max(...data.map(d => d.doses));

    // Calculate responsive font size
    const fontSize = calculateFontSize(canvas, 24, !isHovered);
    
    // Draw Y-axis labels and grid lines
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${fontSize}px Arial`;

    // Draw doses labels (right side)
    const dosesSteps = 5;
    for (let i = 0; i <= dosesSteps; i++) {
      const y = padding.top + (graphHeight * (1 - i / dosesSteps));
      const value = (maxDoses * i / dosesSteps).toFixed(1);
      ctx.fillText(`${value}`, width - padding.right + 10, y + 3);
      
      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw time labels with larger font
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    const timeSteps = 4;
    
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding.left + (graphWidth * (i / timeSteps));
      const currentTime = data[Math.floor((data.length - 1) * (i / timeSteps))]?.simulationTime || 0;
      ctx.fillText(formatTime(currentTime), x, height - padding.bottom / 2);
    }

    // Draw lines
    const drawLine = (metric, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      data.forEach((point, i) => {
        const x = padding.left + (i / (data.length - 1)) * graphWidth;
        const y = padding.top + graphHeight - (point[metric] / maxDoses * graphHeight);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
    };

    drawLine('doses', 'rgba(0, 255, 0, 0.8)');
  }, [data]);

  return (
    <div 
      className={styles['graph-container']}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className={styles['graph-title']}>Total Infectious Doses In Space</h3>
      <canvas
        ref={canvasRef}
        className={styles['graph-canvas']}
        width={800}
        height={480}
      />
      <div className={styles.legend}>
        <div className={styles['legend-item']}>
          <div className={styles['legend-color']} style={{ background: 'rgba(0, 255, 0, 0.8)' }}></div>
        </div>
      </div>
    </div>
  );
};

export default InfectiousDoseGraph;