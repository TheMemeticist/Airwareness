import React, { useState, useEffect } from 'react';
import styles from './AnimatedCO2.module.css';

const AnimatedCO2 = ({ rpm = 1, size = 4, colorScheme = 'default', co2ppm }) => {
  const [randomOffsets, setRandomOffsets] = useState([]);

  useEffect(() => {
    setRandomOffsets(
      Array(2).fill().map(() => ({
        radius: 0.9 + Math.random() * 0.2,
        speed: 0.8 + Math.random() * 0.4,
        flux: () => 0.95 + Math.random() * 0.1,
        orbitRadius: 0.3 + Math.random() * 0.2,
        startAngle: Math.random() * 360 // Add random start angle
      }))
    );
  }, []);

  const centerX = size / 2;
  const centerY = size / 2;
  const largeCircleRadius = size * 0.16;
  const smallCircleRadius = size * 0.08;
  const orbitRadius = size * 0.45; // Increased orbit radius
  const edgeCircleRadius = size * 0.48; // Radius for the big edge circle
  const crossLength = size * 0.9; // Length of cross lines
  const smallEdgeCircleRadius = size * 0.025; // Radius for small edge circles

  const calculateAnimationDuration = (baseSpeed) => {
    if (rpm === 0) return 'none';
    return `${60 / (rpm * baseSpeed)}s`;
  };

  const edgeCirclePositions = [
    { cx: centerX, cy: 5 }, // North
    { cx: size-5, cy: centerY }, // East
    { cx: centerX, cy: size-5 }, // South
    { cx: 5, cy: centerY } // West
  ];

  return (
    <svg className={styles.animatedCO2} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Big edge circle with cross */}
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

      {/* Orbit path */}
      <circle
        cx={centerX}
        cy={centerY}
        r={orbitRadius}
        fill="none"
        stroke="var(--off-white)"
        strokeWidth="0.5"
        opacity="0.5"
      />

      {/* Central carbon atom */}
      <circle cx={centerX} cy={centerY} r={largeCircleRadius} fill="var(--light-blue)" />

      {/* CO2 ppm text */}
      <text
        x={centerX}
        y={centerY - largeCircleRadius * 0.2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--off-white)"
        fontSize={`${largeCircleRadius * 0.9}px`}
        fontWeight="bold"
      >
        {co2ppm}
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
        ppm
      </text>

      {/* Oxygen atoms */}
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

      {/* Small edge circles */}
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

export default AnimatedCO2;