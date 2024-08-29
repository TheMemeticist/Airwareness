import React, { useState, useEffect } from 'react';
import styles from './AnimatedAQI.module.css';

const AnimatedAQI = ({ rpm = 1, size = 4, colorScheme = 'default', aqi }) => {
  const [randomOffsets, setRandomOffsets] = useState([]);

  useEffect(() => {
    setRandomOffsets(
      Array(3).fill().map(() => ({
        radius: 0.9 + Math.random() * 0.2,
        speed: 0.8 + Math.random() * 0.4,
        flux: () => 0.95 + Math.random() * 0.1,
        orbitRadius: 0.3 + Math.random() * 0.2,
        startAngle: Math.random() * 360
      }))
    );
  }, []);

  const centerX = size / 2;
  const centerY = size / 2;
  const largeCircleRadius = size * 0.07 * 1.5;
  const smallCircleRadius = size * 0.06 * 1.5;
  const orbitRadius = size * 0.45;
  const edgeCircleRadius = size * 0.44;
  const crossLength = size * 0.85;
  const smallEdgeCircleRadius = size * 0.025;

  const calculateAnimationDuration = (baseSpeed) => {
    if (rpm === 0) return 'none';
    return `${60 / (rpm * baseSpeed)}s`;
  };

  const edgeCirclePositions = [
    { cx: centerX, cy: 5 },
    { cx: size-5, cy: centerY },
    { cx: centerX, cy: size-5 },
    { cx: 5, cy: centerY }
  ];

  return (
    <svg className={styles.animatedAQI} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <line
        x1={centerX - crossLength / 2}
        y1={centerY}
        x2={centerX + crossLength / 2}
        y2={centerY}
        stroke="var(--light-tan)"
        strokeWidth="0.25"
      />
      <line
        x1={centerX}
        y1={centerY - crossLength / 2}
        x2={centerX}
        y2={centerY + crossLength / 2}
        stroke="var(--light-tan)"
        strokeWidth="0.25"
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={orbitRadius}
        fill="none"
        stroke="var(--off-white)"
        strokeWidth="0.0"
        opacity="0.5"
        stroke="var(--off-black-1)"
        strokeWidth="1px"
      />
      <circle cx={centerX} cy={centerY} r={largeCircleRadius} fill="var(--light-blue)"  />
      <text
        x={centerX}
        y={centerY - largeCircleRadius * 0.2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--off-white)"
        fontSize={`${largeCircleRadius * 0.9}px`}
        fontWeight="bold"
      >
        {aqi}
      </text>
      <text
        x={centerX}
        y={centerY + largeCircleRadius * 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--off-white)"
        fontSize={`${largeCircleRadius * 0.5}px`}
        fontWeight="normal"
        fontFamily="var(--font-primary)"
      >
        AQI
      </text>
      {randomOffsets.map((offset, index) => (
        <circle
          key={index}
          className={`${styles.orbitingCircle} ${styles[`orbit${index + 1}`]}`}
          cx={centerX}
          cy={centerY}
          r={smallCircleRadius}
          fill="var(--light-tan)"
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            animation: `
              ${styles.orbit} ${calculateAnimationDuration(offset.speed)} linear infinite,
              ${styles.flux} ${calculateAnimationDuration(2.5)} ease-in-out infinite alternate
            `,
            animationDelay: `${index * 1.5}s, ${index * 1.5}s`,
            transform: `rotate(${offset.startAngle}deg) translate(${size * offset.orbitRadius}px) rotate(-${offset.startAngle}deg)`
          }}
        />
      ))}
      {edgeCirclePositions.map((pos, index) => (
        <circle
          key={`edge-${index}`}
          cx={pos.cx}
          cy={pos.cy}
          r={smallEdgeCircleRadius}
          fill="none"
          stroke="var(--light-tan)"
          strokeWidth="0.25"
        />
      ))}
    </svg>
  );
};

export default AnimatedAQI;
