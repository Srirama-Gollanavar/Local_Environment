const { StudyProductivityEnv } = require('./env.js');
const { StudyAgent } = require('./agent.js');
const { TaskGrader } = require('./grader.js');

function createLogger(lines) {
  return (line = '') => {
    lines.push(line);
  };
}

async function runSimulation() {
  const lines = [];
  const log = createLogger(lines);

  log('='.repeat(70));
  log('Study Productivity OpenEnv - Simulation');
  log('='.repeat(70));

  const env = new StudyProductivityEnv(42);
  const agent = new StudyAgent('BaselineAgent');
  const grader = new TaskGrader();

  const history = {
    states: [],
    actions: [],
    rewards: [],
    totalReward: 0
  };

  log('\n[SIMULATION START]');
  log(`Agent: ${agent.name}`);
  log('Environment: Study Productivity OpenEnv');
  log('Initial Environment State:');

  let observation = env.reset();
  log(`Day: ${observation.day}, Energy: ${observation.energy}/100, Tasks: ${observation.tasks_completed}, Productivity: ${observation.productivity.toFixed(2)}`);

  let done = false;
  let stepCount = 0;

  log('\n[SIMULATION EPISODES]');
  log('-'.repeat(70));

  while (!done && stepCount < 100) {
    const action = agent.getAction(observation);
    const result = env.step(action);
    const newObservation = result.state;
    const reward = result.reward;
    done = result.done;

    history.states.push(observation);
    history.actions.push(action);
    history.rewards.push(reward);
    history.totalReward += reward;

    if ((stepCount + 1) % 5 === 0 || done) {
      log(
        `Step ${stepCount + 1} | Action: ${action.padEnd(6)} | Reward: ${reward.toString().padStart(3)} | ` +
        `Energy: ${newObservation.energy.toFixed(0).padStart(3)}/100 | ` +
        `Tasks: ${newObservation.tasks_completed} | ` +
        `Productivity: ${newObservation.productivity.toFixed(2)}`
      );
    }

    observation = newObservation;
    stepCount += 1;
  }

  const finalState = observation;
  log('-'.repeat(70));
  log('\n[SIMULATION SUMMARY]');
  log('='.repeat(70));
  log('\nFinal Environment State:');
  log(`  Days Elapsed: ${finalState.day}/30`);
  log(`  Final Energy: ${finalState.energy.toFixed(1)}/100`);
  log(`  Tasks Completed: ${finalState.tasks_completed}`);
  log(`  Total Productivity: ${finalState.total_productivity.toFixed(3)}`);
  log(`  Average Productivity/Day: ${(finalState.total_productivity / 30).toFixed(3)}`);
  log(`  Total Cumulative Reward: ${history.totalReward}`);
  log(`  Total Steps: ${stepCount}`);

  log('\n[TASK EVALUATION]');
  log('='.repeat(70));

  const gradeResults = grader.gradeAll(finalState);
  const compositeScore = grader.getCompositeScore(gradeResults);

  log('\nEASY Task: Complete at least 3 tasks');
  log(`  Status: ${gradeResults.easy.passed ? 'PASSED' : 'NOT PASSED'}`);
  log(`  Score: ${gradeResults.easy.score.toFixed(3)}/1.0`);
  log(`  Details: ${gradeResults.easy.details.tasksCompleted}/${gradeResults.easy.details.taskTarget} tasks`);

  log('\nMEDIUM Task: Maintain consistent average productivity');
  log(`  Status: ${gradeResults.medium.passed ? 'PASSED' : 'NOT PASSED'}`);
  log(`  Score: ${gradeResults.medium.score.toFixed(3)}/1.0`);
  log(`  Details: Avg productivity ${gradeResults.medium.details.averageProductivity.toFixed(3)}/day (threshold: ${gradeResults.medium.details.threshold})`);

  log('\nHARD Task: Maximize efficiency (tasks + productivity + energy)');
  log(`  Status: ${gradeResults.hard.passed ? 'PASSED' : 'NOT PASSED'}`);
  log(`  Score: ${gradeResults.hard.score.toFixed(3)}/1.0`);
  log('  Breakdown:');
  log(`    - Tasks Score: ${gradeResults.hard.details.taskScore.toFixed(3)}`);
  log(`    - Productivity Score: ${gradeResults.hard.details.productivityScore.toFixed(3)}`);
  log(`    - Energy Score: ${gradeResults.hard.details.energyScore.toFixed(3)}`);

  log('\n' + '='.repeat(70));
  log('COMPOSITE SCORE');
  log('='.repeat(70));
  log(`  Avg Score (Easy + Medium + Hard) / 3: ${compositeScore.toFixed(3)}/1.0`);
  log('='.repeat(70));

  const actionCounts = { study: 0, rest: 0, skip: 0 };
  history.actions.forEach((action) => {
    if (Object.prototype.hasOwnProperty.call(actionCounts, action)) {
      actionCounts[action] += 1;
    }
  });

  log('\n[ACTION DISTRIBUTION]');
  log(`  Study: ${actionCounts.study} times (${((actionCounts.study / stepCount) * 100).toFixed(1)}%)`);
  log(`  Rest:  ${actionCounts.rest} times (${((actionCounts.rest / stepCount) * 100).toFixed(1)}%)`);
  log(`  Skip:  ${actionCounts.skip} times (${((actionCounts.skip / stepCount) * 100).toFixed(1)}%)`);

  log('\n[SIMULATION COMPLETE]');
  log('='.repeat(70));

  return {
    text: lines.join('\n'),
    finalState,
    gradeResults,
    compositeScore
  };
}

module.exports = { runSimulation };
