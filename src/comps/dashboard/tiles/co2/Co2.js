import React from 'react';
import BaseTile from '../Tile';
import AnimatedCO2 from './AnimatedCO2';
import styles from './Co2.module.css';
import tileStyles from '../Tile.module.css'; // Import Tile styles

class Co2 extends React.Component {
  render() {
    const { co2ppm = 420, speed = 10, size = 100, colorScheme = 'default' } = this.props;
    const helpText = "Monitor the CO₂ levels to ensure adequate ventilation and maintain optimal indoor air quality.";

    return (
      <BaseTile title="CO₂" helptxt={helpText}>
        <div className={tileStyles['tile-content']}> {/* Use tileStyles for tile-content */}
          <AnimatedCO2 rpm={speed} size={size} colorScheme={colorScheme} co2ppm={co2ppm} />
        </div>
      </BaseTile>
    );
  }
}

export default Co2;