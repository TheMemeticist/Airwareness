import React, { useState, useEffect } from 'react';
import styles from './AnimatedPM.module.css';

const ParticleInstance = ({ rpm, size, colorScheme, pmValue, label }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const getParticleSize = () => {
      switch (label) {
        case 'PM1': return 8 + Math.random() * 2;
        case 'PM2.5': return 10 + Math.random() * 10;
        case 'PM10': return 12 + Math.random() * 20;
        default: return 10 + Math.random() * 2;
      }
    };

    const getRandomColor = () => {
      const colors = [
        'var(--light-blue)',
        'var(--royal-blue)',
        'var(--bright-teal)',
        'var(--bright-yellow)',
        'var(--light-tan)',
        'var(--dark-tan)',
        'var(--off-white)',
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    setParticles(
      Array(8).fill().map(() => ({
        x: Math.random() * size,
        y: Math.random() * size,
        radius: getParticleSize(),
        speed: 0.5 + Math.random() * 1,
        direction: Math.random() * 7 * Math.PI,
        color: getRandomColor(),
      }))
    );
  }, [size, label]);

  const getBackgroundCircleSize = () => {
    switch (label) {
      case 'PM1': return size * 0.4;
      case 'PM2.5': return size * 0.5;
      case 'PM10': return size * 0.6;
      default: return size * 0.45;
    }
  };

  return (
    <svg className={styles.animatedPM} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        className={styles.backgroundCircle}
        cx={size / 2}
        cy={size / 2}
        r={getBackgroundCircleSize()}
      />

      {particles.map((particle, index) => (
        <circle
          key={index}
          className={`${styles.particle} ${styles[`particle${index + 1}`]}`}
          cx={particle.x}
          cy={particle.y}
          r={particle.radius}
          style={{
            '--rpm': rpm,
            '--speed': particle.speed,
            fill: particle.color,
          }}
        />
      ))}

      <text
        className={styles.pmValue}
        x={size / 2}
        y={size / 2 - size * 0.05}
        style={{ '--size': size }}
      >
        {pmValue}
      </text>
      <text
        className={styles.pmLabel}
        x={size / 2}
        y={size / 2 + size * 0.08}
        style={{ '--size': size }}
      >
        {label}
      </text>
    </svg>
  );
};

// ... rest of the code remains unchanged

const AnimatedPM = ({ rpm = 1, size = 4, colorScheme = 'default', pm1, pm25, pm10 }) => {
  const instanceSize = size / 3;

  return (
    <div className={styles.animatedPMContainer}>
      <ParticleInstance rpm={rpm} size={instanceSize} colorScheme={colorScheme} pmValue={pm1} label="PM1" />
      <ParticleInstance rpm={rpm} size={instanceSize} colorScheme={colorScheme} pmValue={pm25} label="PM2.5" />
      <ParticleInstance rpm={rpm} size={instanceSize} colorScheme={colorScheme} pmValue={pm10} label="PM10" />
    </div>
  );
};

export default AnimatedPM;
