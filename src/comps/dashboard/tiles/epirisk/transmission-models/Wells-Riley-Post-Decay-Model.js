import { calculateWellsRiley } from './Wells-Riley-Model';

/**
 * Calculates infection risk in two phases:
 * 1. Occupied Phase: normal Wells-Riley with active quanta generation over initialExposureHours
 * 2. Vacant Phase: no new quanta generation; the existing room concentration decays
 *
 * Because no new particles are generated after occupants leave,
 * we simply decay the final “occupied” concentration and see how much risk a new occupant might face afterward.
 *
 * @param {number} totalIndividuals    - total number of occupants (for the initial exposure)
 * @param {number} infectionRate       - infectious proportion (e.g., 10 means 10%)
 * @param {number} quantaGenerationRate - quanta per hour per infected person
 * @param {number} susceptibleBreathingRate - volume inhaled by susceptible persons, ft^3/hr
 * @param {number} initialExposureHours - time with occupants in the space (they generate new particles)
 * @param {number} extendedExposureHours - time after occupants leave (no new quanta)
 * @param {number} roomVolume          - volume of the space (ft^3)
 * @param {number} ventilationRate     - ventilation (ACH, air changes/hour)
 * @param {number} pathogenHalfLifeHours - half-life (hours) for pathogen decay
 * @returns {{ probability: number, infectiousCount: number }}
 */
export const calculateWellsRileyPostDecay = (
  totalIndividuals,
  infectionRate,
  quantaGenerationRate,
  susceptibleBreathingRate,
  initialExposureHours,
  extendedExposureHours,
  roomVolume,
  ventilationRate,
  pathogenHalfLifeHours
) => {
  // 1. Validate inputs
  if (!pathogenHalfLifeHours || pathogenHalfLifeHours <= 0) {
    console.warn('Invalid pathogen half-life:', pathogenHalfLifeHours);
    return { probability: 0, infectiousCount: 0 };
  }
  if (!extendedExposureHours || extendedExposureHours < 0) {
    extendedExposureHours = 0;
  }

  // 2. Calculate initial phase using normal Wells-Riley
  const initialResult = calculateWellsRiley(
    totalIndividuals,
    infectionRate,
    quantaGenerationRate,
    susceptibleBreathingRate,
    initialExposureHours,
    roomVolume,
    ventilationRate,
    pathogenHalfLifeHours
  );

  // If there's no vacant phase, return initial result
  if (extendedExposureHours === 0) {
    return initialResult;
  }

  // 3. Calculate the steady-state quanta concentration at the end of occupied phase
  const pathogenDecayRate = Math.log(2) / pathogenHalfLifeHours;
  const effectiveVentRate = Math.max(0.001, ventilationRate);
  const totalRemovalRate = effectiveVentRate + pathogenDecayRate;

  // Calculate steady-state concentration (quanta/ft³)
  const steadyStateConc = (initialResult.infectiousCount * quantaGenerationRate) / 
                         (roomVolume * totalRemovalRate);

  // Calculate concentration at the end of occupied phase
  const occupiedDecayFactor = Math.exp(-totalRemovalRate * initialExposureHours);
  const finalConc = steadyStateConc * (1 - occupiedDecayFactor);

  // 4. Calculate post-vacancy decay
  const vacantDecayFactor = Math.exp(-totalRemovalRate * extendedExposureHours);
  const postVacancyConc = finalConc * vacantDecayFactor;

  // 5. Calculate infection probability from this reduced concentration
  // Using simplified Wells-Riley for just the exposure to this decayed concentration
  const inhaledDose = susceptibleBreathingRate * postVacancyConc;
  const finalProbability = Math.min(0.999, 1 - Math.exp(-inhaledDose));

  console.log('Post-decay calculation details:', {
    initialRisk: initialResult.probability,
    steadyStateConcentration: steadyStateConc,
    finalOccupiedConcentration: finalConc,
    postVacancyConcentration: postVacancyConc,
    decayFactors: {
      occupied: occupiedDecayFactor,
      vacant: vacantDecayFactor
    },
    rates: {
      pathogenDecay: pathogenDecayRate,
      ventilation: effectiveVentRate,
      totalRemoval: totalRemovalRate
    },
    theoreticalHalfLife: Math.log(2) / totalRemovalRate,
    params: {
      initialExposureHours,
      extendedExposureHours,
      ventilationRate,
      pathogenHalfLifeHours
    }
  });

  return {
    probability: finalProbability,
    infectiousCount: initialResult.infectiousCount
  };
}; 