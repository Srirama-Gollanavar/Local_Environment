// Seeded random number generator for reproducibility
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Core environment class - Study Productivity OpenEnv
class StudyProductivityEnv {
  constructor(seed = 42) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    
    // Environment constants
    this.MAX_DAYS = 30;
    this.MAX_ENERGY = 100;
    this.STUDY_ENERGY_COST = 20;
    this.STUDY_PRODUCTIVITY_GAIN = 0.1; // per task
    this.REST_ENERGY_RESTORE = 30;
    
    // Initialize state
    this.reset();
  }

  reset() {
    this.state_ = {
      day: 1,
      energy: 80,
      tasks_completed: 0,
      productivity: 0.0,
      total_productivity: 0.0
    };
    return this.getObservation();
  }

  getObservation() {
    return {
      day: this.state_.day,
      energy: this.state_.energy,
      tasks_completed: this.state_.tasks_completed,
      productivity: this.state_.productivity,
      total_productivity: this.state_.total_productivity
    };
  }

  state() {
    return this.getObservation();
  }

  step(action) {
    let reward = 0;
    let done = false;

    // Validate action
    const validActions = ['study', 'rest', 'skip'];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }

    // Process action
    if (action === 'study') {
      // Check if burnout condition
      if (this.state_.energy < this.STUDY_ENERGY_COST) {
        // Attempted to study with insufficient energy - burnout penalty
        reward = -5;
      } else {
        // Successfully study
        this.state_.energy -= this.STUDY_ENERGY_COST;
        this.state_.tasks_completed += 1;
        this.state_.productivity += this.STUDY_PRODUCTIVITY_GAIN;
        this.state_.total_productivity += this.STUDY_PRODUCTIVITY_GAIN;
        reward = 10;
      }
    } else if (action === 'rest') {
      // Resting restores energy
      this.state_.energy = Math.min(
        this.state_.energy + this.REST_ENERGY_RESTORE,
        this.MAX_ENERGY
      );
      reward = 2;
    } else if (action === 'skip') {
      // Skipping has no benefit but slight penalty
      reward = -3;
    }

    // Increment day
    this.state_.day += 1;

    // Normalize productivity to [0, 1]
    this.state_.productivity = Math.min(
      this.state_.productivity,
      1.0
    );

    // Energy decay over time (optional, adds realism)
    if (action !== 'rest') {
      this.state_.energy -= 2; // Natural energy decline
      this.state_.energy = Math.max(this.state_.energy, 0);
    }

    // Episode ends after MAX_DAYS
    if (this.state_.day > this.MAX_DAYS) {
      done = true;
    }

    return {
      state: this.getObservation(),
      reward: reward,
      done: done,
      info: {
        action: action,
        energy: this.state_.energy,
        tasks: this.state_.tasks_completed
      }
    };
  }

  render() {
    const obs = this.getObservation();
    console.log(`Day ${obs.day}/${this.MAX_DAYS} | Energy: ${obs.energy.toFixed(1)}/100 | Tasks: ${obs.tasks_completed} | Productivity: ${obs.productivity.toFixed(2)}`);
  }
}

module.exports = { StudyProductivityEnv, SeededRandom };
