import { useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash';

// Move utility functions into the hook file
const calculateDimensions = (floorArea, height) => ({
  height: parseFloat(height) || 0,
  floorArea: parseFloat(floorArea) || 0,
  sideLength: Math.sqrt(parseFloat(floorArea)) || 0,
  width: Math.sqrt(parseFloat(floorArea)) || 0,
  length: Math.sqrt(parseFloat(floorArea)) || 0
});

const toMeters = {
  length: (ft) => ft * 0.3048,
  area: (sqft) => sqft * 0.092903
};

export const useRoomDimensions = (room, dispatch, buildingId) => {
  // Initialize input values state
  const [inputValues, setInputValues] = useState({
    height: room?.height || '',
    floorArea: room?.floorArea || ''
  });

  // Update input values when room changes
  useEffect(() => {
    if (room) {
      setInputValues({
        height: room.height || '',
        floorArea: room.floorArea || ''
      });
    }
  }, [room]);

  // Calculate dimensions
  const dimensions = useMemo(() => 
    calculateDimensions(room?.floorArea, room?.height),
    [room?.floorArea, room?.height]
  );

  // Calculate metric dimensions
  const dimensionsInMeters = useMemo(() => ({
    height: dimensions.height * toMeters.length(1),
    floorArea: dimensions.floorArea * toMeters.area(1),
    sideLength: dimensions.sideLength * toMeters.length(1)
  }), [dimensions]);

  // Create debounced update function
  const debouncedDimensionUpdate = useMemo(() => 
    debounce((newDimensions) => {
      dispatch({
        type: 'UPDATE_ROOM',
        payload: {
          buildingId,
          roomId: room?.id,
          roomData: newDimensions
        }
      });
    }, 100),
    [buildingId, room?.id, dispatch]
  );

  // Cleanup debounced function
  useEffect(() => {
    return () => debouncedDimensionUpdate.cancel();
  }, [debouncedDimensionUpdate]);

  // Input handlers
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    
    setInputValues(prev => ({...prev, [field]: value}));
    
    const newDimensions = calculateDimensions(
      field === 'floorArea' ? value : inputValues.floorArea,
      field === 'height' ? value : inputValues.height
    );
    
    debouncedDimensionUpdate(newDimensions);
  };

  const handleIncrement = (field) => () => {
    const step = field === 'height' ? 5 : 500;
    const currentValue = parseFloat(inputValues[field]) || 0;
    const newValue = currentValue + step;
    handleInputChange(field)({ target: { value: newValue } });
  };

  const handleDecrement = (field) => () => {
    const step = field === 'height' ? 5 : 500;
    const currentValue = parseFloat(inputValues[field]) || 0;
    const newValue = currentValue - step >= 0 ? currentValue - step : 0;
    handleInputChange(field)({ target: { value: newValue } });
  };

  return {
    dimensions,
    dimensionsInMeters,
    inputValues,
    handleInputChange,
    handleIncrement,
    handleDecrement
  };
};