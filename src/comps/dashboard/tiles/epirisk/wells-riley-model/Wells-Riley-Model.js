// Wells-Riley Infection Risk Calculation Function

/**
 * Calculates the probability of infection using the Wells-Riley model with time-dependent concentration.
 *
 * @param {number} infectiousIndividuals - Number of infectious individuals (persons)
 * @param {number} quantaGenerationRate - Quanta generation rate per infectious individual (quanta/hour)
 * @param {number} susceptibleBreathingRate - Breathing rate of a susceptible individual (cubic feet/hour)
 * @param {number} exposureTime - Total exposure time (hours)
 * @param {number} roomVolume - Volume of the room (cubic feet)
 * @param {number} ventilationRate - Ventilation rate (air changes per hour, ACH)
 * @param {number} pathogenDecayRate - Pathogen decay rate (per hour)
 * @returns {number} - Probability of infection (between 0 and 1)
 */
function calculateWellsRileyInfectionProbability(
    infectiousIndividuals,
    quantaGenerationRate,
    susceptibleBreathingRate,
    exposureTime,
    roomVolume,
    ventilationRate,
    pathogenDecayRate
  ) {
    // Total removal rate of infectious quanta from the air (per hour)
    const totalRemovalRate = ventilationRate + pathogenDecayRate;
  
    // Exponential decay term representing the decrease in concentration over time
    const decayFactor = Math.exp(-totalRemovalRate * exposureTime);
  
    // Steady-state concentration factor (quanta per cubic foot)
    const steadyStateConcentration =
      (infectiousIndividuals * quantaGenerationRate) /
      (roomVolume * totalRemovalRate);
  
    // Time-integrated concentration of infectious quanta over the exposure period (quanta-hour per cubic foot)
    const integratedConcentration =
      steadyStateConcentration *
      (exposureTime - (1 - decayFactor) / totalRemovalRate);
  
    // Total dose of quanta inhaled by a susceptible individual (quanta)
    const inhaledDose = susceptibleBreathingRate * integratedConcentration;
  
    // Probability of infection for the susceptible individual
    const infectionProbability = 1 - Math.exp(-inhaledDose);
  
    return infectionProbability;
  }
