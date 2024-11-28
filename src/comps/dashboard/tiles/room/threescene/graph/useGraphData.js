import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../../../../context/AppContext';

export const useGraphData = (particleSystem, speed = 50, resetGraph = false) => {
  const [graphData, setGraphData] = useState([]);
  const [simulationTime, setSimulationTime] = useState(0);
  const { state } = useAppContext();
  
  const calculateMetrics = useCallback(() => {
    if (!particleSystem) return { doses: 0 };
    
    const pathogenData = state.pathogens[state.currentPathogen];
    const quantaRate = pathogenData.quantaRate;
    
    const activeParticles = particleSystem.activeParticles;
    const currentDoses = (activeParticles / 100) * quantaRate;
    
    return {
      doses: currentDoses
    };
  }, [particleSystem, state.currentPathogen, state.pathogens]);

  useEffect(() => {
    if (particleSystem && particleSystem.activeParticles === 0) {
      setGraphData([]);
      setSimulationTime(0);
    }
  }, [particleSystem?.activeParticles]);

  useEffect(() => {
    const baseInterval = 1000;
    const updateInterval = baseInterval / speed;

    const updateGraph = () => {
      const metrics = calculateMetrics();
      
      setSimulationTime(prev => prev + 1);
      
      setGraphData(prevData => {
        return [...prevData, {
          simulationTime,
          doses: metrics.doses
        }];
      });
    };

    const intervalId = setInterval(updateGraph, updateInterval);
    return () => clearInterval(intervalId);
  }, [calculateMetrics, speed, simulationTime]);

  useEffect(() => {
    if (resetGraph) {
      setGraphData([]);
      setSimulationTime(0);
    }
  }, [resetGraph]);

  return graphData;
};