// Task grading and evaluation functions
class TaskGrader {
  constructor() {
    this.MAX_DAYS = 30;
  }

  /**
   * EASY Task: Complete at least 3 tasks
   * Score ranges from 0.0 to 1.0
   */
  gradeEasy(finalState) {
    const tasksRequired = 3;
    const tasksCompleted = finalState.tasks_completed;
    
    // Score: 0.0 if less than 3, up to 1.0 for many tasks
    const score = Math.min(tasksCompleted / tasksRequired, 1.0);
    
    return {
      task: 'EASY',
      description: 'Complete at least 3 tasks',
      passed: tasksCompleted >= tasksRequired,
      score: parseFloat(score.toFixed(3)),
      details: {
        taskTarget: tasksRequired,
        tasksCompleted: tasksCompleted
      }
    };
  }

  /**
   * MEDIUM Task: Maintain average productivity
   * Score based on average productivity across all days (normalized to [0,1])
   */
  grademedium(finalState) {
    const totalProductivity = finalState.total_productivity;
    const daysActive = this.MAX_DAYS;
    const averageProductivity = totalProductivity / daysActive;
    
    // score normalized to [0, 1]
    // Assuming max productivity per day is 0.1, so max total is 3.0
    const maxPossibleAverage = 0.1; // per day
    const score = Math.min(averageProductivity / maxPossibleAverage, 1.0);
    
    return {
      task: 'MEDIUM',
      description: 'Maintain consistent average productivity',
      passed: averageProductivity >= 0.03, // at least 3% average
      score: parseFloat(score.toFixed(3)),
      details: {
        totalProductivity: parseFloat(totalProductivity.toFixed(3)),
        averageProductivity: parseFloat(averageProductivity.toFixed(3)),
        threshold: 0.03
      }
    };
  }

  /**
   * HARD Task: Maximize efficiency (task completion + energy balance)
   * Balances productivity with sustainable energy levels
   * Score normalized
   */
  gradeHard(finalState) {
    const tasksCompleted = finalState.tasks_completed;
    const totalProductivity = finalState.total_productivity;
    const finalEnergy = finalState.energy;
    
    // Efficiency score combines:
    // - Task completion (weight: 0.6)
    // - Productivity (weight: 0.3)
    // - Final energy sustainability (weight: 0.1)
    
    const taskScore = Math.min(tasksCompleted / 5, 1.0); // 5+ tasks = perfect
    const productivityScore = Math.min(totalProductivity / 3, 1.0); // 3.0+ productivity = perfect
    const energyScore = finalEnergy / 100; // Energy should be > 0
    
    const efficiencyScore = (
      taskScore * 0.6 +
      productivityScore * 0.3 +
      energyScore * 0.1
    );
    
    const score = Math.min(efficiencyScore, 1.0);
    
    return {
      task: 'HARD',
      description: 'Maximize efficiency (tasks + productivity + energy balance)',
      passed: score >= 0.6,
      score: parseFloat(score.toFixed(3)),
      details: {
        tasksCompleted: tasksCompleted,
        totalProductivity: parseFloat(totalProductivity.toFixed(3)),
        finalEnergy: finalEnergy,
        taskScore: parseFloat(taskScore.toFixed(3)),
        productivityScore: parseFloat(productivityScore.toFixed(3)),
        energyScore: parseFloat(energyScore.toFixed(3))
      }
    };
  }

  // Grade all tasks
  gradeAll(finalState) {
    return {
      easy: this.gradeEasy(finalState),
      medium: this.grademedium(finalState),
      hard: this.gradeHard(finalState),
      timestamp: new Date().toISOString()
    };
  }

  // Calculate composite score (average of all three tasks)
  getCompositeScore(gradeResults) {
    const easy = gradeResults.easy.score;
    const medium = gradeResults.medium.score;
    const hard = gradeResults.hard.score;
    
    const composite = (easy + medium + hard) / 3;
    return parseFloat(composite.toFixed(3));
  }
}

module.exports = { TaskGrader };
