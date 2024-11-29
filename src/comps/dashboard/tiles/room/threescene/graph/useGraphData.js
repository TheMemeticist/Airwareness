import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../../../../context/AppContext';
import { calculateWellsRiley } from '../../../epirisk/transmission-models/Wells-Riley-Model';

export const useGraphData = (particleSystem, speed = 50, isMinimized = false) => {
  const [graphData, setGraphData] = useState([]);
  const { state } = useAppContext();
  
  const calculateMetrics = useCallback(() => {
    if (!particleSystem) return { doses: 0 };
    
    // Get room data
    const activeBuilding = state.buildings.find(b => b.rooms.length > 0);
    const activeRoom = activeBuilding?.rooms[0];
    
    if (!activeRoom) return { doses: 0 };

    const roomVolume = parseFloat(activeRoom.height) * parseFloat(activeRoom.floorArea);
    const pathogenData = state.pathogens[state.currentPathogen];
    const ventilationRate = state.ventilationRate || 1; // ACH from central ventilation
    
    // Calculate clean air volume per hour (cubic feet/hour)
    const cleanAirPerHour = roomVolume * ventilationRate;
    
    // Calculate clean air volume per second
    const cleanAirPerSecond = cleanAirPerHour / 3600;
    
    // Get current active infectious particles
    const activeParticles = particleSystem.activeParticles;
    
    // Calculate doses per cubic foot of clean air
    // If cleanAirPerSecond is 0, default to a very small number to avoid division by zero
    const dosesPerCubicFoot = activeParticles / cleanAirPerHour;
    const currentDoses = dosesPerCubicFoot * 100;
    
    return {
      doses: currentDoses
    };
  }, [
    particleSystem,
    state.currentPathogen,
    state.pathogens,
    state.ventilationRate,
    state.buildings
  ]);

  useEffect(() => {
    const baseInterval = 1000;
    const updateInterval = baseInterval / speed;

    const updateGraph = () => {
      const metrics = calculateMetrics();
      
      setGraphData(prevData => {
        const lastPoint = prevData[prevData.length - 1];
        // Increment by 1 second per update, matching Timer's logic
        const newSimTime = lastPoint ? lastPoint.simulationTime + 1 : 0;
        
        return [...prevData, {
          simulationTime: newSimTime,
          doses: metrics.doses
        }];
      });
    };

    const intervalId = setInterval(updateGraph, updateInterval);
    return () => clearInterval(intervalId);
  }, [calculateMetrics, speed]);

  // Reset data when particles are cleared
  useEffect(() => {
    if (particleSystem && particleSystem.activeParticles === 0) {
      setGraphData([]);
    }
  }, [particleSystem?.activeParticles]);

  return isMinimized 
    ? graphData.filter((_, i) => i % Math.max(1, Math.floor(graphData.length / 100)) === 0)
    : graphData;
};