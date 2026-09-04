import PriorityQueue from "js-priority-queue";

const astar = (grid, startNode, endNode, heuristic, allowDiag) => {
  let visitedNodes = [];
  let shortestPath = [];
  //Chebyshev models a diagonal as costing the same as a straight step; every
  //other heuristic uses the true diagonal length. Dijkstra and JPS charge the
  //same Math.SQRT2 so the three algorithms stay comparable.
  let diagDist = Math.SQRT2;
  if (heuristic === "chebyshev") diagDist = 1;
  //Queue entries are immutable snapshots of {row, col, f, h}. Storing the node
  //itself and then mutating node.f would corrupt the heap, since the
  //comparator re-reads the key of entries that are already sifted into place.
  //Stale entries are discarded on dequeue via the isVisited check.
  let pq = new PriorityQueue({
    comparator: function (a, b) {
      //Tie-breaker
      if (a.f === b.f) return a.h - b.h;
      return a.f - b.f;
    },
  });
  grid.forEach((row) => {
    row.forEach((node) => {
      //g : distance
      node.g = Infinity;
      //h : heuristic
      node.h = Infinity;
      //f = g + h
      node.f = Infinity;
      node.prevNode = null;
      node.isVisited = false;
      node.isShortestPath = false;
    });
  });
  grid[startNode.row][startNode.column].g = 0;
  grid[startNode.row][startNode.column].h = 0;
  grid[startNode.row][startNode.column].f = 0;
  pq.queue({ row: startNode.row, col: startNode.column, f: 0, h: 0 });
  while (pq.length) {
    const { row, col } = pq.dequeue();
    const node = grid[row][col];
    if (node.isVisited) continue;
    node.isVisited = true;
    visitedNodes.push(node);
    //Terminate only once the end node is dequeued. Returning as soon as it is
    //seen as a neighbour is wrong with diagonals enabled: a node popped later
    //can still reach the end more cheaply over a straight edge.
    if (node.row === endNode.row && node.col === endNode.column) {
      shortestPath = getShortestPath(node);
      return { visitedNodes, shortestPath };
    }
    const n = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    //with diag
    if (allowDiag) n.push([-1, 1], [1, 1], [-1, -1], [1, -1]);
    for (let j = 0; j < n.length; j++) {
      const i = n[j];
      const r = row + i[0];
      const c = col + i[1];
      if (
        grid[r] &&
        grid[r][c] &&
        !grid[r][c].isVisited &&
        (!grid[r][c].isWall || (r === endNode.row && c === endNode.column))
      ) {
        const dist =
          Math.abs(i[0]) === 1 && Math.abs(i[1]) === 1 ? diagDist : 1;
        let gNew = node.g + dist;
        let hNew = calculateHeuristic(r, c, endNode, heuristic, diagDist);
        let fNew = gNew + hNew;
        if (grid[r][c].f > fNew) {
          grid[r][c].g = gNew;
          grid[r][c].h = hNew;
          grid[r][c].f = fNew;
          grid[r][c].prevNode = node;
          pq.queue({ row: r, col: c, f: fNew, h: hNew });
        }
      }
    }
  }

  return { visitedNodes, shortestPath };
};

const calculateHeuristic = (row, col, endNode, heuristic, diagDist) => {
  const dx = Math.abs(row - endNode.row);
  const dy = Math.abs(col - endNode.column);
  const d = 1;
  let ans;
  if (heuristic === "manhattan") {
    ans = d * (dx + dy);
  }
  if (heuristic === "euclidean") {
    ans = d * Math.sqrt(dx * dx + dy * dy);
  }
  if (heuristic === "octile" || heuristic === "chebyshev") {
    let d2 = diagDist;
    ans = d * Math.max(dx, dy) + (d2 - d) * Math.min(dx, dy);
  }
  return ans;
};

const getShortestPath = (node) => {
  let shortestPath = [];
  while (node !== null) {
    shortestPath.unshift(node);
    node = node.prevNode;
    if (node) node.isShortestPath = true;
  }
  return shortestPath;
};

export default astar;
