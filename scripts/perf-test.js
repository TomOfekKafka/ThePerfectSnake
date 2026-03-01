const TARGET_FPS = 24;
const FRAME_BUDGET_MS = 1000 / TARGET_FPS;
const GRID_SIZE = 20;
const ITERATIONS = 500;

function generateFood(snake) {
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
  return food;
}

function moveSnake(state) {
  const head = state.snake[0];
  const directions = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
  const [dx, dy] = directions[state.direction];
  const newHead = { x: head.x + dx, y: head.y + dy };

  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    return { ...state, gameOver: true };
  }

  if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    return { ...state, gameOver: true };
  }

  const newSnake = [newHead, ...state.snake];
  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    return { ...state, snake: newSnake, food: generateFood(newSnake), score: state.score + 10 };
  }
  newSnake.pop();
  return { ...state, snake: newSnake };
}

function getCellTypes(state) {
  const cells = new Array(GRID_SIZE * GRID_SIZE);
  for (let i = 0; i < cells.length; i++) {
    const x = i % GRID_SIZE;
    const y = Math.floor(i / GRID_SIZE);
    if (state.snake[0].x === x && state.snake[0].y === y) {
      cells[i] = 'snake-head';
    } else if (state.snake.slice(1).some(s => s.x === x && s.y === y)) {
      cells[i] = 'snake-body';
    } else if (state.food.x === x && state.food.y === y) {
      cells[i] = 'food';
    } else {
      cells[i] = 'empty';
    }
  }
  return cells;
}

function runPerfTest() {
  const directionCycle = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
  let state = {
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    food: { x: 5, y: 5 },
    direction: 'UP',
    score: 0,
    gameOver: false,
  };

  const times = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();

    if (state.gameOver) {
      state = {
        snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
        food: generateFood([{ x: 10, y: 10 }]),
        direction: directionCycle[i % 4],
        score: 0,
        gameOver: false,
      };
    }

    state.direction = directionCycle[i % 4];
    state = moveSnake(state);
    getCellTypes(state);

    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  const maxMs = Math.max(...times);
  const effectiveFps = 1000 / avgMs;

  console.log(`Perf test results (${ITERATIONS} iterations):`);
  console.log(`  Avg frame time: ${avgMs.toFixed(3)} ms`);
  console.log(`  Max frame time: ${maxMs.toFixed(3)} ms`);
  console.log(`  Effective FPS:  ${effectiveFps.toFixed(0)}`);
  console.log(`  Target FPS:     ${TARGET_FPS}`);

  if (avgMs > FRAME_BUDGET_MS) {
    console.error(`FAIL: Average frame time ${avgMs.toFixed(3)} ms exceeds budget ${FRAME_BUDGET_MS.toFixed(1)} ms`);
    process.exit(1);
  }

  console.log('PASS: Performance within budget');
}

runPerfTest();
