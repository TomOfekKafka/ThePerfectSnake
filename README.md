# The Perfect Snake

A classic Snake game built with React + TypeScript + Vite.

This is the standalone game component that can be embedded via iframe or deployed independently.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The game will open in your browser at `http://localhost:5173`

3. Build for production:
```bash
npm run build
```

## How to Play

**Desktop:**
- Press **SPACE** to start the game
- Use **Arrow Keys** to control the snake

**Mobile:**
- Tap **Start Game** button
- Swipe in any direction OR use on-screen arrow buttons to control the snake

**Goal:**
- Eat the red food to grow and score points
- Avoid hitting walls or your own tail

## Features

- Fully responsive design (works on desktop and mobile)
- Touch/swipe controls for mobile devices
- On-screen control buttons
- Real-time snake movement
- Score tracking
- Collision detection
- Embeddable via iframe

## Tech Stack

- React 18
- TypeScript
- Vite
- CSS3

## Embedding

This game can be embedded in other applications using an iframe:

```html
<iframe
  src="https://your-game-url.vercel.app"
  width="600"
  height="700"
  allow="accelerometer; autoplay"
  sandbox="allow-scripts allow-same-origin"
/>
```

## Architecture

This repository contains only the pure game code. The payment and AI improvement platform is maintained separately in a private repository.

Enjoy the game!
