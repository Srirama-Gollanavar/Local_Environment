---
title: Open Environment WorkSpace
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
---

# Study Productivity OpenEnv

A real-world OpenEnv simulation environment that models a student managing daily study tasks, energy levels, and productivity over a 30-day period.

## Overview

This project implements a reinforcement learning environment following the standard API pattern:
- **reset()** - Initialize environment state
- **step(action)** - Execute action and get feedback
- **state()** - Observe current environment state

The environment simulates the challenges of task management, resource conservation (energy), and sustainable productivity.

## Features

✅ **Complete RL Environment API** - Full implementation of reset(), step(), and state()  
✅ **Deterministic Randomness** - Seeded RNG for reproducibility (seed=42)  
✅ **Baseline Agent** - Simple rule-based agent for reference  
✅ **Three Evaluation Tasks** - Easy, Medium, and Hard grading schemes  
✅ **Comprehensive Simulation** - Complete 30-day episode loop  
✅ **Docker Support** - Containerized for easy deployment  

## Environment Specification

### State Space

The observation includes 5 dimensions:

```python
{
  "day": int,              # Current day (1-30)
  "energy": float,         # Energy level (0-100)
  "tasks_completed": int,  # Number of completed tasks
  "productivity": float,   # Current productivity (0-1)
  "total_productivity": float  # Cumulative productivity
}
```

### Action Space

Three discrete actions:

| Action | Description | Cost | Benefit |
|--------|-------------|------|---------|
| `study` | Complete a task | 20 energy | +1 task, +0.1 productivity |
| `rest` | Restore energy | — | +30 energy (max 100) |
| `skip` | Do nothing | — | No change |

### Reward Function

**Studying:** +10 points  
**Resting:** +2 points  
**Skipping:** -3 points  
**Burnout (study with <20 energy):** -5 points  

### Environment Rules

1. **Energy Management**
   - Studying requires ≥20 energy
   - Resting restores 30 energy (capped at 100)
   - Natural energy decay of 2 per day when not resting

2. **Productivity Accumulation**
   - Successfully studying adds 0.1 to productivity
   - Productivity normalized to [0, 1] range
   - Total productivity tracks cumulative gains

3. **Episode Termination**
   - Episode ends after 30 days
   - No other termination conditions

## Task Grading System

### EASY Task: Task Completion
- **Objective:** Complete at least 3 tasks
- **Score:** 0.0 → 1.0 (linear scaling)
- **Threshold:** ≥3 tasks = PASSED

**Formula:**
```
score = min(tasks_completed / 3.0, 1.0)
```

### MEDIUM Task: Consistent Productivity
- **Objective:** Maintain average productivity across 30 days
- **Score:** Based on average daily productivity
- **Threshold:** avg_productivity ≥ 0.03 per day = PASSED

**Formula:**
```
avg_productivity = total_productivity / 30
score = min(avg_productivity / 0.1, 1.0)
```

### HARD Task: Balanced Efficiency
- **Objective:** Maximize efficiency across tasks, productivity, and energy
- **Score:** Weighted combination of three metrics
- **Threshold:** score ≥ 0.6 = PASSED

**Formula:**
```
task_score = min(tasks / 5.0, 1.0)
productivity_score = min(total_productivity / 3.0, 1.0)
energy_score = final_energy / 100.0

score = (task_score × 0.6) + (productivity_score × 0.3) + (energy_score × 0.1)
score = min(score, 1.0)
```

## Baseline Agent

The included `StudyAgent` uses simple heuristics:

```javascript
if (energy <= 30) {
  // Low energy: must rest
  return 'rest';
} else if (energy > 50) {
  // High energy: prioritize studying
  return 'study';
} else {
  // Medium energy: study if fewer tasks completed
  return tasksCompleted < 2 ? 'study' : 'rest';
}
```

Expected performance:
- **Easy Score:** ~0.9-1.0 (consistently completes 3+ tasks)
- **Medium Score:** ~0.5-0.7 (moderate productivity)
- **Hard Score:** ~0.6-0.8 (balanced performance)

## Project Structure

```
project/
├── env.js                 # Core environment implementation
├── agent.js               # Baseline agent
├── grader.js              # Task evaluation and grading
├── main.js                # Simulation loop and orchestration
├── openenv.yaml           # Environment configuration
├── package.json           # Node.js dependencies
├── Dockerfile             # Container configuration
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

```bash
# Clone or navigate to project directory
cd study-productivity-openenv

# Install dependencies
npm install
```

### Running the Simulation

```bash
# Run the simulation with baseline agent
npm start

# Or directly:
node main.js
```

## Expected Output

When running the simulation, you'll see:

1. **Simulation Progress** - Step-by-step actions, rewards, and state updates
2. **Final Summary** - Days elapsed, final energy, tasks completed, total productivity
3. **Task Evaluation** - Scores for EASY, MEDIUM, and HARD tasks
4. **Composite Score** - Average of all three task scores
5. **Action Distribution** - Percentage breakdown of study/rest/skip actions

Example output:
```
Study Productivity OpenEnv - Simulation
======================================================================

[SIMULATION START]
Agent: BaselineAgent
Environment: Study Productivity OpenEnv
Initial Environment State:
Day: 1, Energy: 80/100, Tasks: 0, Productivity: 0.00

[SIMULATION EPISODES]
----------------------------------------------------------------------
Step 5  | Action: study | Reward: 10  | Energy: 60/100 | Tasks: 1 | Productivity: 0.10
Step 10 | Action: rest  | Reward:  2  | Energy: 100/100| Tasks: 3 | Productivity: 0.30
...

[TASK EVALUATION]
======================================================================

📊 EASY Task: Complete at least 3 tasks
  Status: ✓ PASSED
  Score: 1.0/1.0
  Details: 8/3 tasks

📊 MEDIUM Task: Maintain consistent average productivity
  Status: ✓ PASSED
  Score: 0.667/1.0
  Details: Avg productivity 0.067/day

📊 HARD Task: Maximize efficiency
  Status: ✓ PASSED
  Score: 0.734/1.0
  
🏆 COMPOSITE SCORE
======================================================================
  Avg Score: 0.800/1.0
```

## Docker Usage

Build and run the project in a container:

```bash
# Build image
docker build -t study-productivity-openenv .

# Run simulation
docker run study-productivity-openenv
```

## API Reference

### StudyProductivityEnv

```javascript
const { StudyProductivityEnv } = require('./env.js');

// Create environment with seed for reproducibility
const env = new StudyProductivityEnv(42);

// Reset environment to initial state
const initialObs = env.reset();

// Get current observation
const obs = env.state();

// Execute action and get feedback
const { state, reward, done, info } = env.step('study');

// Render current state (optional)
env.render();
```

### StudyAgent

```javascript
const { StudyAgent } = require('./agent.js');

const agent = new StudyAgent('MyAgent');

// Get action based on observation
const action = agent.getAction(observation);
// Returns: 'study', 'rest', or 'skip'

// Reset agent state (if any)
agent.reset();
```

### TaskGrader

```javascript
const { TaskGrader } = require('./grader.js');

const grader = new TaskGrader();

// Grade individual tasks
const easyResult = grader.gradeEasy(finalState);
const mediumResult = grader.grademedium(finalState);
const hardResult = grader.gradeHard(finalState);

// Grade all tasks
const results = grader.gradeAll(finalState);

// Get composite score
const composite = grader.getCompositeScore(results);
```

## Extending the Project

### Creating a Custom Agent

```javascript
class SmartAgent {
  getAction(observation) {
    // Your custom logic here
    return 'study'; // or 'rest', 'skip'
  }
}
```

### Implementing DQN or Policy Gradient

The environment is fully compatible with RL algorithms:

```javascript
const env = new StudyProductivityEnv();
let obs = env.reset();

for (let episode = 0; episode < numEpisodes; episode++) {
  obs = env.reset();
  let done = false;
  
  while (!done) {
    const action = agent.selectAction(obs);
    const { state, reward, done } = env.step(action);
    agent.updateWeights(obs, action, reward, state);
    obs = state;
  }
}
```

## Parameters and Tuning

Modify environment constants in `env.js`:

```javascript
this.MAX_DAYS = 30;                  // Episode length
this.MAX_ENERGY = 100;               // Maximum energy
this.STUDY_ENERGY_COST = 20;         // Energy required for study
this.STUDY_PRODUCTIVITY_GAIN = 0.1;  // Productivity per task
this.REST_ENERGY_RESTORE = 30;       // Energy restored per rest
```

## Performance Analysis

### Theoretical Optimal Performance

With perfect decision-making:
- Complete all 30 days: Day 30
- Study every other day: 15 tasks
- Rest every other day: Energy ~70-80
- **Optimal Easy Score:** 1.0 (need only 3 tasks)
- **Optimal Medium Score:** 1.0 (need 0.1 avg productivity)
- **Optimal Hard Score:** 1.0 (maximum efficiency)

### Random Agent Baseline

Expected performance with random actions:
- **Easy Score:** 0.3-0.5 (low task completion)
- **Medium Score:** 0.2-0.4 (inconsistent productivity)
- **Hard Score:** 0.3-0.5 (unbalanced performance)

## Future Enhancements

- [ ] Variable episode lengths
- [ ] Stochastic environment dynamics
- [ ] Multiple agents (collaborative learning)
- [ ] Curriculum learning support
- [ ] Web-based visualization
- [ ] PyTorch/TensorFlow integrations

## License

MIT License

## Contributing

Contributions welcome! Please submit issues and pull requests.

## Contact

For questions or feedback, contact the OpenEnv team.
