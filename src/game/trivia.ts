export interface TriviaQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
}

export interface TriviaState {
  active: boolean;
  used: boolean;
  question: TriviaQuestion | null;
  selectedAnswer: number | null;
  result: 'correct' | 'wrong' | null;
  resultTimer: number;
}

const TRIVIA_POOL: TriviaQuestion[] = [
  { question: 'How many legs does a spider have?', answers: ['6', '8', '10', '12'], correctIndex: 1 },
  { question: 'What planet is closest to the Sun?', answers: ['Venus', 'Earth', 'Mercury', 'Mars'], correctIndex: 2 },
  { question: 'What is the largest ocean?', answers: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },
  { question: 'How many continents are there?', answers: ['5', '6', '7', '8'], correctIndex: 2 },
  { question: 'What gas do plants absorb?', answers: ['Oxygen', 'Nitrogen', 'CO2', 'Helium'], correctIndex: 2 },
  { question: 'What is the hardest natural substance?', answers: ['Gold', 'Iron', 'Diamond', 'Quartz'], correctIndex: 2 },
  { question: 'How many colors in a rainbow?', answers: ['5', '6', '7', '8'], correctIndex: 2 },
  { question: 'Which animal is the fastest?', answers: ['Lion', 'Cheetah', 'Horse', 'Eagle'], correctIndex: 1 },
  { question: 'What is H2O?', answers: ['Salt', 'Water', 'Oil', 'Acid'], correctIndex: 1 },
  { question: 'How many bones in a human body?', answers: ['106', '156', '206', '306'], correctIndex: 2 },
  { question: 'What is the largest mammal?', answers: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'], correctIndex: 1 },
  { question: 'Which planet has rings?', answers: ['Mars', 'Jupiter', 'Saturn', 'Neptune'], correctIndex: 2 },
  { question: 'What year did WW2 end?', answers: ['1943', '1944', '1945', '1946'], correctIndex: 2 },
  { question: 'How many hearts does an octopus have?', answers: ['1', '2', '3', '4'], correctIndex: 2 },
  { question: 'What is the speed of light?', answers: ['300 km/s', '3000 km/s', '300000 km/s', '3M km/s'], correctIndex: 2 },
  { question: 'What language has the most speakers?', answers: ['English', 'Spanish', 'Hindi', 'Mandarin'], correctIndex: 3 },
  { question: 'Which element has symbol Fe?', answers: ['Fluorine', 'Iron', 'Lead', 'Fermium'], correctIndex: 1 },
  { question: 'How many sides does a hexagon have?', answers: ['5', '6', '7', '8'], correctIndex: 1 },
  { question: 'What is the smallest prime number?', answers: ['0', '1', '2', '3'], correctIndex: 2 },
  { question: 'Which country has the most people?', answers: ['USA', 'India', 'China', 'Brazil'], correctIndex: 1 },
];

export const createTriviaState = (): TriviaState => ({
  active: false,
  used: false,
  question: null,
  selectedAnswer: null,
  result: null,
  resultTimer: 0,
});

export const pickTriviaQuestion = (): TriviaQuestion => {
  const index = Math.floor(Math.random() * TRIVIA_POOL.length);
  return { ...TRIVIA_POOL[index] };
};

export const checkAnswer = (question: TriviaQuestion, answerIndex: number): boolean =>
  answerIndex === question.correctIndex;

export const RESULT_DISPLAY_FRAMES = 60;

export const getTriviaQuestionCount = (): number => TRIVIA_POOL.length;

export const activateTrivia = (state: TriviaState): TriviaState => ({
  ...state,
  active: true,
  question: pickTriviaQuestion(),
  selectedAnswer: null,
  result: null,
  resultTimer: 0,
});

export const submitTriviaAnswer = (state: TriviaState, answerIndex: number): TriviaState => {
  if (!state.active || !state.question || state.selectedAnswer !== null) return state;
  const correct = checkAnswer(state.question, answerIndex);
  return {
    ...state,
    selectedAnswer: answerIndex,
    result: correct ? 'correct' : 'wrong',
    resultTimer: RESULT_DISPLAY_FRAMES,
  };
};

export const tickTriviaResult = (state: TriviaState): TriviaState => {
  if (state.resultTimer <= 0) return state;
  return { ...state, resultTimer: state.resultTimer - 1 };
};

export const isTriviaResultDone = (state: TriviaState): boolean =>
  state.result !== null && state.resultTimer <= 0;

export const finishTrivia = (state: TriviaState): TriviaState => ({
  ...state,
  active: false,
  used: true,
  question: null,
  selectedAnswer: null,
});
