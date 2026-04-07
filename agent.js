// Simple rule-based baseline agent
class StudyAgent {
  constructor(name = 'BaselineAgent') {
    this.name = name;
  }

  getAction(observation) {
    const energy = observation.energy;
    const day = observation.day;
    const tasksCompleted = observation.tasks_completed;

    // Simple decision logic
    // If energy is low, rest to recover
    if (energy <= 30) {
      return 'rest';
    }

    // If we have decent energy, study
    if (energy > 50) {
      return 'study';
    }

    // Medium energy: balance between study and rest
    // Study if we haven't done many tasks yet, otherwise rest
    if (tasksCompleted < 2) {
      return 'study';
    } else {
      return 'rest';
    }
  }

  reset() {
    // Reset any agent state if needed
  }
}

module.exports = { StudyAgent };
