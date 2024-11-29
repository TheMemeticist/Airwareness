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
  const scale = Math.min(canvas.width / 100, canvas.height / 480);
  const baseSize = Math.max(Math.floor(baseFontSize * scale), 10);
  return isMinimized ? baseSize * 1.5 : baseSize;
};

const InfectiousDoseGraph = ({ particleSystem, speed }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastDrawnDataRef = useRef([]);
  
  // Memoize isHovered to prevent unnecessary rerenders
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  
  // Memoize data updates when minimized
  const data = useGraphData(particleSystem, speed, !isHovered);

  // Add resize observer to handle container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.floor(width * window.devicePixelRatio),
          height: Math.floor(height * window.devicePixelRatio)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update canvas size when dimensions change
  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = dimensions.width;
    canvasRef.current.height = dimensions.height;
  }, [dimensions]);

  // Optimize drawing function to run less frequently when minimized
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawGraph = () => {
      // Still update when minimized, just less frequently
      if (!isHovered) {
        const shouldUpdate = Date.now() % 3000 < 50; // Update roughly every 500ms
        if (!shouldUpdate) return;
      }

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      if (data.length < 2) return;

      const padding = {
        left: Math.floor(width * 0.12),    // ~12% of width
        right: Math.floor(width * 0.15),   // Increased to 15% to accommodate numbers
        top: Math.floor(height * 0.12),    // ~12% of height
        bottom: Math.floor(height * 0.15)  // ~15% of height
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
      const dosesSteps = isHovered ? 5 : 2;
      for (let i = 1; i <= dosesSteps; i++) {
        const y = padding.top + (graphHeight * (1 - i / dosesSteps));
        const value = (maxDoses * i / dosesSteps).toFixed(2);
        ctx.fillText(`${value}`, width - padding.right + 5, y + 3);
        
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
      const timeSteps = isHovered ? 4 : 2;
      
      for (let i = 0; i <= timeSteps; i++) {
        const x = padding.left + (graphWidth * (i / timeSteps));
        const currentTime = data[Math.floor((data.length - 1) * (i / timeSteps))]?.simulationTime || 0;
        ctx.fillText(formatTime(currentTime), x, height - padding.bottom / 2);
      }

      // Draw lines
      const drawLine = (metric, color) => {
        ctx.strokeStyle = color;
        const lineWidth = Math.max(2, Math.floor(width / 200));
        ctx.lineWidth = lineWidth;
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

      lastDrawnDataRef.current = data;
    };

    // Use requestAnimationFrame for smoother rendering
    const animate = () => {
      drawGraph();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [data, dimensions, isHovered]);

  return (
    <div 
      ref={containerRef}
      className={styles['graph-container']}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <>
        <h3 className={styles['graph-title']}>Infectious Doses per 100 ft³</h3>
        <h3 className={styles['minimized-title']}>Infectious Dose Saturation</h3>
      </>
      <canvas
        ref={canvasRef}
        className={styles['graph-canvas']}
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