import { calculateWellsRileyPostDecay } from './Wells-Riley-Post-Decay-Model';

describe('Wells-Riley Post-Decay Model', () => {
  test('Post-decay risk should follow expected concentration decay', () => {
    const baseParams = {
      totalIndividuals: 30,
      infectionRate: 10,
      quantaGenerationRate: 100,
      susceptibleBreathingRate: 8,
      initialExposureHours: 4,     // Longer initial exposure to get measurable risk
      roomVolume: 100,
      ventilationRate: 2,          // 2 ACH
      pathogenHalfLifeHours: 1.1   // 1.1 hours biological half-life
    };

    // Test different extended exposure times
    const times = [0, 0.25, 0.5, 1, 2];
    const results = times.map(extendedTime => {
      const result = calculateWellsRileyPostDecay(
        ...Object.values(baseParams),
        extendedTime
      );
      
      return {
        time: extendedTime,
        probability: result.probability
      };
    });

    console.log('Decay pattern:', results.map(r => ({
      time: r.time,
      probability: r.probability.toFixed(4)
    })));

    // Initial risk should be significant
    expect(results[0].probability).toBeGreaterThan(0.1);

    // Risk should decrease over time
    for (let i = 1; i < results.length; i++) {
      expect(results[i].probability).toBeLessThan(results[i-1].probability);
    }
  });

  test('Concentration should halve at theoretical half-life', () => {
    const params = {
      totalIndividuals: 30,
      infectionRate: 10,
      quantaGenerationRate: 100,
      susceptibleBreathingRate: 8,
      initialExposureHours: 4,
      roomVolume: 100,
      ventilationRate: 2,
      pathogenHalfLifeHours: 1.1
    };

    // Calculate theoretical half-life
    const pathogenDecayRate = Math.log(2) / params.pathogenHalfLifeHours;
    const totalRemovalRate = params.ventilationRate + pathogenDecayRate;
    const theoreticalHalfLife = Math.log(2) / totalRemovalRate;

    // Get risks at t=0 and t=halfLife
    const initial = calculateWellsRileyPostDecay(
      ...Object.values(params),
      0
    );

    const atHalfLife = calculateWellsRileyPostDecay(
      ...Object.values(params),
      theoreticalHalfLife
    );

    console.log('Half-life verification:', {
      pathogenDecayRate: pathogenDecayRate.toFixed(3),
      ventilationRate: params.ventilationRate,
      totalRemovalRate: totalRemovalRate.toFixed(3),
      theoreticalHalfLife: theoreticalHalfLife.toFixed(3),
      initialRisk: initial.probability.toFixed(4),
      riskAtHalfLife: atHalfLife.probability.toFixed(4),
      ratio: (atHalfLife.probability / initial.probability).toFixed(3)
    });

    // The risk at half-life should be ~50% of initial
    const ratio = atHalfLife.probability / initial.probability;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });

  test('Edge cases', () => {
    const baseParams = {
      totalIndividuals: 30,
      infectionRate: 10,
      quantaGenerationRate: 100,
      susceptibleBreathingRate: 8,
      initialExposureHours: 4,
      roomVolume: 100,
      ventilationRate: 2,
      pathogenHalfLifeHours: 1.1
    };

    // Test invalid half-life
    const invalidHalfLife = calculateWellsRileyPostDecay(
      ...Object.values(baseParams).slice(0, -1),
      0  // invalid half-life
    );
    expect(invalidHalfLife.probability).toBe(0);

    // Test zero extended time (should match initial exposure)
    const initialRisk = calculateWellsRileyPostDecay(
      ...Object.values(baseParams),
      0
    );
    expect(initialRisk.probability).toBeGreaterThan(0);

    // Test very long extended time (should approach zero)
    const longExtended = calculateWellsRileyPostDecay(
      ...Object.values(baseParams),
      24  // 24 hours
    );
    expect(longExtended.probability).toBeLessThan(0.01);
  });
}); 