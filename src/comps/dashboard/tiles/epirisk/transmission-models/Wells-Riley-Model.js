// Wells-Riley Infection Risk Calculation Function

/**
 * Calculates the probability of infection using the Wells-Riley model with time-dependent concentration.
 *
 * @param {number} totalIndividuals - Total number of individuals in the room
 * @param {number} infectionRate - Percentage of population that is infectious (0-100)
 * @param {number} quantaGenerationRate - Quanta generation rate per infectious individual (quanta/hour)
 * @param {number} susceptibleBreathingRate - Breathing rate of a susceptible individual (cubic feet/hour)
 * @param {number} exposureTime - Total exposure time (hours)
 * @param {number} roomVolume - Volume of the room (cubic feet)
 * @param {number} ventilationRate - Ventilation rate (air changes per hour, ACH)
 * @param {number} pathogenHalfLifeHours - Time in hours for 50% of pathogens to decay (e.g., 0.5 = 30 minutes)
 * @returns {Object} - Object containing probability of infection and number of infectious individuals
 */
export function calculateWellsRiley(
    totalIndividuals,
    infectionRate,
    quantaGenerationRate,
    susceptibleBreathingRate,
    exposureTime,
    roomVolume,
    ventilationRate,
    pathogenHalfLifeHours
  ) {
    // Calculate number of infectious individuals based on infection rate
    const infectiousIndividuals = Math.round((infectionRate / 100) * totalIndividuals);
    
    // Calculate number of susceptible individuals
    const susceptibleIndividuals = totalIndividuals - infectiousIndividuals;

    // Convert half-life hours to decay rate (per hour)
    const pathogenDecayRate = Math.log(2) / pathogenHalfLifeHours;
  
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
  
    return {
      probability: infectionProbability,
      infectiousCount: infectiousIndividuals,
      susceptibleCount: susceptibleIndividuals
    };
  }
