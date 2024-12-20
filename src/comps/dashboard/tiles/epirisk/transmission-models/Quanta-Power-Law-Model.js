/**
 * Calculate the quanta generation rate using a Power Law model.
 * 
 * This model adjusts the quanta emission rate (infectious particle generation) based on physical 
 * aerosol generation intensity. The relationship follows a power law that reflects how aerosol generation
 * increases non-linearly with activity level. This is crucial because different activities produce
 * vastly different amounts of respiratory aerosols:

 * The activity level parameter allows dynamic adjustment of the quanta rate between these
 * states, making the model more accurate for real-world scenarios where activity levels
 * may vary (e.g., gyms, classrooms, or performance venues).
 * 
 * @see {@link https://www.medrxiv.org/content/10.1101/2020.04.12.20062828v1}
 * 
 * @param {number} maxQuantaRate - The maximum quanta generation rate (quanta/hour) for the activity type
 * @param {number} activityLevel - The activity intensity as a fraction (0.0 to 1.0)
 *                                where 0.0 = resting and 1.0 = maximum activity
 * @returns {number} Adjusted quanta generation rate for the given activity level
 * @throws {Error} If activity level is not between 0.0 and 1.0
 */
export function quantaPowerLawQuantaRate(maxQuantaRate, activityLevel) {
    if (activityLevel < 0.0 || activityLevel > 1.0) {
        throw new Error("Activity level must be between 0.0 and 1.0");
    }
    
    // Power law coefficient derived from REHVA studies on aerosol generation
    // during different physical activities
    const k = 1.76;
    
    // Apply power law relationship between activity level and quanta generation
    return maxQuantaRate * Math.pow(activityLevel, k);
}