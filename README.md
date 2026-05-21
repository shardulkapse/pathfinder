# Pathfinder

An interactive React visualiser for pathfinding and maze-generation algorithms.

**Live demo:** [pathfinder-pink.vercel.app](https://pathfinder-pink.vercel.app)

## What it does

Pathfinder lets you draw a grid, place start and end nodes, optionally fill the grid with a generated maze, and watch a pathfinding algorithm explore the grid step-by-step before tracing the shortest path it found. It's built as a playground for comparing how different algorithms and heuristics behave on the same grid.

## Features

- **Three pathfinding algorithms:** Dijkstra, A\*, and Jump Point Search
- **Four A\* heuristics:** Euclidean, Manhattan, Chebyshev, and Octile — switchable at runtime to compare behaviour
- **Diagonal movement toggle** for algorithms that support it
- **Three maze generators:** Kruskal's, Prim's, and Recursive Division
- **Animated maze building** (optional) so you can see how each generator constructs the maze
- **Interactive grid:** click to move start/end nodes, click-and-drag to draw or erase walls
- **Responsive grid** that adapts to the viewport — roughly 41×61 cells on extra-large screens down to 43×31 on mobile
- **Clear grid** to reset walls and the previous run

## Animation

Visited nodes are animated as the algorithm explores the grid, and the shortest path is then animated on top once the search completes.

## Running locally

```bash
git clone https://github.com/shardulkapse/pathfinder.git
cd pathfinder
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

