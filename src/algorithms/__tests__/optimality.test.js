import dijkstra from "../dijkstra";
import astar from "../astar";
import jumpPointSearch from "../jumpPointSearch";

//Differential test: every algorithm must return a path whose cost equals the
//true optimum under its OWN cost model, computed by a deliberately naive
//reference Dijkstra (linear scan for the minimum, so no heap is involved and
//the heap-invariant bug being tested for cannot affect the reference).

const STRAIGHT = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
const DIAGONAL = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

const makeGrid = (rows, cols, isWall = () => false) => {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isStart: false,
        isEnd: false,
        isVisited: false,
        isShortestPath: false,
        isWall: isWall(r, c),
      });
    }
    grid.push(row);
  }
  return grid;
};

//Mirrors the passability rule the algorithms use: walls block, except that the
//end node is always enterable (the user may drop the target onto a wall).
const passable = (grid, r, c, endNode) =>
  grid[r] &&
  grid[r][c] &&
  (!grid[r][c].isWall || (r === endNode.row && c === endNode.column));

const referenceCost = (grid, startNode, endNode, allowDiag, diagCost) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist = grid.map((row) => row.map(() => Infinity));
  const done = grid.map((row) => row.map(() => false));
  dist[startNode.row][startNode.column] = 0;
  const dirs = allowDiag ? [...STRAIGHT, ...DIAGONAL] : STRAIGHT;

  for (;;) {
    let br = -1;
    let bc = -1;
    let best = Infinity;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!done[r][c] && dist[r][c] < best) {
          best = dist[r][c];
          br = r;
          bc = c;
        }
    if (br === -1) return Infinity;
    if (br === endNode.row && bc === endNode.column) return best;
    done[br][bc] = true;
    for (const [dr, dc] of dirs) {
      const r = br + dr;
      const c = bc + dc;
      if (!passable(grid, r, c, endNode) || done[r][c]) continue;
      const step = dr !== 0 && dc !== 0 ? diagCost : 1;
      if (best + step < dist[r][c]) dist[r][c] = best + step;
    }
  }
};

const pathCost = (path, diagCost) => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dr = Math.abs(path[i].row - path[i - 1].row);
    const dc = Math.abs(path[i].col - path[i - 1].col);
    total += dr === 1 && dc === 1 ? diagCost : 1;
  }
  return total;
};

const expectWellFormed = (path, grid, startNode, endNode) => {
  expect(path.length).toBeGreaterThan(0);
  expect([path[0].row, path[0].col]).toEqual([startNode.row, startNode.column]);
  const last = path[path.length - 1];
  expect([last.row, last.col]).toEqual([endNode.row, endNode.column]);
  for (let i = 1; i < path.length; i++) {
    const dr = Math.abs(path[i].row - path[i - 1].row);
    const dc = Math.abs(path[i].col - path[i - 1].col);
    //consecutive path nodes must actually be adjacent
    expect(Math.max(dr, dc)).toBe(1);
    expect(dr + dc).toBeGreaterThan(0);
    //no walking through walls (the end node is the sanctioned exception)
    const onEnd = path[i].row === endNode.row && path[i].col === endNode.column;
    if (!onEnd) expect(path[i].isWall).toBe(false);
  }
};

//mulberry32 - deterministic, so a failure is always reproducible.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ROWS = 12;
const COLS = 12;
const CASES = 300;

//Endpoints are randomised rather than pinned to opposite corners. With a corner
//goal the diagonal approach is essentially always optimal, which hides the
//"return as soon as the end is seen as a neighbour" bug entirely - that bug
//only shows up when a node reached slightly later can still enter the goal more
//cheaply over a straight edge.
const sweep = (solve, allowDiag, diagCost, seed) => {
  const random = rng(seed);
  const pick = (n) => Math.floor(random() * n);
  let solved = 0;
  for (let n = 0; n < CASES; n++) {
    const start = { row: pick(ROWS), column: pick(COLS) };
    const end = { row: pick(ROWS), column: pick(COLS) };
    if (start.row === end.row && start.column === end.column) continue;
    const grid = makeGrid(ROWS, COLS, (r, c) => {
      if (r === start.row && c === start.column) return false;
      if (r === end.row && c === end.column) return false;
      return random() < 0.25;
    });
    const optimal = referenceCost(grid, start, end, allowDiag, diagCost);
    //Grids with no path are skipped so that the unrelated "phantom path when
    //unreachable" bug in JPS does not contaminate this assertion.
    if (optimal === Infinity) continue;
    const { shortestPath } = solve(grid, start, end);
    expectWellFormed(shortestPath, grid, start, end);
    expect(pathCost(shortestPath, diagCost)).toBeCloseTo(optimal, 6);
    solved++;
  }
  //guard against a sweep that silently asserted almost nothing
  expect(solved).toBeGreaterThan(CASES / 2);
};

const DIAG = Math.SQRT2;

describe("dijkstra", () => {
  it("finds the optimal path without diagonals", () => {
    sweep((grid, s, e) => dijkstra(grid, s, e, false), false, DIAG, 1);
  });

  it("finds the optimal path with diagonals", () => {
    sweep((grid, s, e) => dijkstra(grid, s, e, true), true, DIAG, 2);
  });
});

describe("astar", () => {
  //Without diagonals every heuristic here is admissible.
  for (const h of ["manhattan", "euclidean", "octile", "chebyshev"]) {
    it(`finds the optimal path without diagonals (${h})`, () => {
      sweep((grid, s, e) => astar(grid, s, e, h, false), false, DIAG, 3);
    });
  }

  //With diagonals, octile is exact and euclidean is a lower bound - both
  //admissible now that the diagonal costs exactly Math.SQRT2. Manhattan is
  //still inadmissible there, which is a UI concern rather than an algorithm
  //one, so it is deliberately not asserted.
  for (const h of ["octile", "euclidean"]) {
    it(`finds the optimal path with diagonals (${h})`, () => {
      sweep((grid, s, e) => astar(grid, s, e, h, true), true, DIAG, 4);
    });
  }

  //Chebyshev deliberately models a diagonal as costing 1.
  it("finds the optimal path with diagonals (chebyshev)", () => {
    sweep((grid, s, e) => astar(grid, s, e, "chebyshev", true), true, 1, 5);
  });
});

describe("jumpPointSearch", () => {
  it("finds the optimal path", () => {
    sweep((grid, s, e) => jumpPointSearch(grid, s, e), true, DIAG, 6);
  });
});
