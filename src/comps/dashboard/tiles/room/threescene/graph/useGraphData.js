import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../../../../context/AppContext';

const MAX_DATA_POINTS = 100;
const UPDATE_INTERVAL = 1000; // Update every second

export const useGraphData = (particleSystem) => {
  const [graphData, setGraphData] = useState([]);
  const { state } = useAppContext();
  
  const calculateMetrics = useCallback(() => {
    if (!particleSystem) return { doses: 0 };
    
    // Get current pathogen data
    const pathogenData = state.pathogens[state.currentPathogen];
    const quantaRate = pathogenData.quantaRate;
    
    // Calculate current active doses based on active particles
    const activeParticles = particleSystem.activeParticles;
    const currentDoses = (activeParticles / 100) * quantaRate;
    
    return {
      doses: currentDoses
    };
  }, [particleSystem, state.currentPathogen, state.pathogens]);

  useEffect(() => {
    const updateGraph = () => {
      const metrics = calculateMetrics();
      const timestamp = Date.now();

      setGraphData(prevData => {
        const newData = [...prevData, {
          timestamp,
          doses: metrics.doses
        }];
        if (newData.length > MAX_DATA_POINTS) {
          return newData.slice(-MAX_DATA_POINTS);
        }
        return newData;
      });
    };

    const intervalId = setInterval(updateGraph, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [calculateMetrics]);

  return graphData;
};