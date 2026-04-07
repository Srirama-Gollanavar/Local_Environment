// Main simulation script
const { StudyProductivityEnv } = require('./env.js');
const { StudyAgent } = require('./agent.js');
const { TaskGrader } = require('./grader.js');

async function runSimulation() {
  console.log('='.repeat(70));
  console.log('Study Productivity OpenEnv - Simulation');
  console.log('='.repeat(70));

  // Initialize components
  const env = new StudyProductivityEnv(seed = 42);
  const agent = new StudyAgent('BaselineAgent');
  const grader = new TaskGrader();

  // Simulation tracking
  const history = {
    states: [],
    actions: [],
    rewards: [],
    totalReward: 0
  };

  console.log('\n[SIMULATION START]');
  console.log(`Agent: ${agent.name}`);
  console.log(`Environment: Study Productivity OpenEnv`);
  console.log('Initial Environment State:');

  // Initialize environment
  let observation = env.reset();
  console.log(`Day: ${observation.day}, Energy: ${observation.energy}/100, Tasks: ${observation.tasks_completed}, Productivity: ${observation.productivity.toFixed(2)}`);

  let done = false;
  let stepCount = 0;

  console.log('\n[SIMULATION EPISODES]');
  console.log('-'.repeat(70));

  // Main simulation loop
  while (!done && stepCount < 100) {
    // Agent chooses action based on current observation
    const action = agent.getAction(observation);

    // Execute action in environment
    const result = env.step(action);
    const newObservation = result.state;
    const reward = result.reward;
    done = result.done;

    // Record history
    history.states.push(observation);
    history.actions.push(action);
    history.rewards.push(reward);
    history.totalReward += reward;

    // Render status every few steps for readability
    if ((stepCount + 1) % 5 === 0 || done) {
      console.log(
        `Step ${stepCount + 1} | Action: ${action.padEnd(6)} | Reward: ${reward.toString().padStart(3)} | ` +
        `Energy: ${newObservation.energy.toFixed(0).padStart(3)}/100 | ` +
        `Tasks: ${newObservation.tasks_completed} | ` +
        `Productivity: ${newObservation.productivity.toFixed(2)}`
      );
    }

    observation = newObservation;
    stepCount += 1;
  }

  // Extract final state for grading
  const finalState = observation;

  console.log('-'.repeat(70));
  console.log('\n[SIMULATION SUMMARY]');
  console.log('='.repeat(70));

  // Print final state
  console.log('\nFinal Environment State:');
  console.log(`  Days Elapsed: ${finalState.day}/${30}`);
  console.log(`  Final Energy: ${finalState.energy.toFixed(1)}/100`);
  console.log(`  Tasks Completed: ${finalState.tasks_completed}`);
  console.log(`  Total Productivity: ${finalState.total_productivity.toFixed(3)}`);
  console.log(`  Average Productivity/Day: ${(finalState.total_productivity / 30).toFixed(3)}`);
  console.log(`  Total Cumulative Reward: ${history.totalReward}`);
  console.log(`  Total Steps: ${stepCount}`);

  // Grade performance against tasks
  console.log('\n[TASK EVALUATION]');
  console.log('='.repeat(70));

  const gradeResults = grader.gradeAll(finalState);
  const compositeScore = grader.getCompositeScore(gradeResults);

  // Print EASY task results
  console.log('\n📊 EASY Task: Complete at least 3 tasks');
  console.log(`  Status: ${gradeResults.easy.passed ? '✓ PASSED' : '✗ NOT PASSED'}`);
  console.log(`  Score: ${gradeResults.easy.score.toFixed(3)}/1.0`);
  console.log(`  Details: ${gradeResults.easy.details.tasksCompleted}/${gradeResults.easy.details.taskTarget} tasks`);

  // Print MEDIUM task results
  console.log('\n📊 MEDIUM Task: Maintain consistent average productivity');
  console.log(`  Status: ${gradeResults.medium.passed ? '✓ PASSED' : '✗ NOT PASSED'}`);
  console.log(`  Score: ${gradeResults.medium.score.toFixed(3)}/1.0`);
  console.log(`  Details: Avg productivity ${gradeResults.medium.details.averageProductivity.toFixed(3)}/day (threshold: ${gradeResults.medium.details.threshold})`);

  // Print HARD task results
  console.log('\n📊 HARD Task: Maximize efficiency (tasks + productivity + energy)');
  console.log(`  Status: ${gradeResults.hard.passed ? '✓ PASSED' : '✗ NOT PASSED'}`);
  console.log(`  Score: ${gradeResults.hard.score.toFixed(3)}/1.0`);
  console.log(`  Breakdown:`);
  console.log(`    - Tasks Score: ${gradeResults.hard.details.taskScore.toFixed(3)}`);
  console.log(`    - Productivity Score: ${gradeResults.hard.details.productivityScore.toFixed(3)}`);
  console.log(`    - Energy Score: ${gradeResults.hard.details.energyScore.toFixed(3)}`);

  // Print composite score
  console.log('\n' + '='.repeat(70));
  console.log('🏆 COMPOSITE SCORE');
  console.log('='.repeat(70));
  console.log(`  Avg Score (Easy + Medium + Hard) / 3: ${compositeScore.toFixed(3)}/1.0`);
  console.log('='.repeat(70));

  // Print action distribution
  const actionCounts = { study: 0, rest: 0, skip: 0 };
  history.actions.forEach(action => {
    if (actionCounts.hasOwnProperty(action)) {
      actionCounts[action]++;
    }
  });

  console.log('\n[ACTION DISTRIBUTION]');
  console.log(`  Study: ${actionCounts.study} times (${((actionCounts.study / stepCount) * 100).toFixed(1)}%)`);
  console.log(`  Rest:  ${actionCounts.rest} times (${((actionCounts.rest / stepCount) * 100).toFixed(1)}%)`);
  console.log(`  Skip:  ${actionCounts.skip} times (${((actionCounts.skip / stepCount) * 100).toFixed(1)}%)`);

  console.log('\n[SIMULATION COMPLETE]');
  console.log('='.repeat(70));
}

// Run simulation
runSimulation().catch(error => {
  console.error('Error running simulation:', error.message);
  process.exit(1);
});
