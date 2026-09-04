import PriorityQueue from "js-priority-queue";

const dijkstra = (grid, startNode, endNode, allowDiag) => {
  let visitedNodes = [];
  let shortestPath = [];
  //Queue entries are immutable snapshots of {row, col, distance}. Storing the
  //node itself and then mutating node.distance would corrupt the heap, since
  //the comparator re-reads the key of entries that are already sifted into
  //place. Stale entries are discarded on dequeue via the isVisited check.
  let pq = new PriorityQueue({
    comparator: function(a, b) {
      return a.distance - b.distance;
    }
  });
  grid.forEach(row =>
    row.forEach(node => {
      if (node.row === startNode.row && node.col === startNode.column) {
        node.distance = 0;
      } else node.distance = Infinity;
      node.prevNode = null;
      node.isVisited = false;
      node.isShortestPath = false;
    })
  );
  pq.queue({ row: startNode.row, col: startNode.column, distance: 0 });
  while (pq.length) {
    const { row, col } = pq.dequeue();
    const node = grid[row][col];
    if (node.isVisited) continue;
    node.isVisited = true;
    visitedNodes.push(node);
    //Terminate only once the end node is dequeued. Returning as soon as it is
    //seen as a neighbour is wrong with diagonals enabled: a node popped later
    //can still reach the end more cheaply over a straight edge.
    if (row === endNode.row && col === endNode.column) {
      shortestPath = getShortestPath(node);
      return { visitedNodes, shortestPath };
    }
    const n = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1]
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
          Math.abs(i[0]) === 1 && Math.abs(i[1]) === 1 ? Math.SQRT2 : 1;
        if (node.distance + dist < grid[r][c].distance) {
          grid[r][c].prevNode = node;
          grid[r][c].distance = node.distance + dist;
          pq.queue({ row: r, col: c, distance: grid[r][c].distance });
        }
      }
    }
  }
  return { visitedNodes, shortestPath };
};

const getShortestPath = node => {
  let shortestPath = [];
  while (node !== null) {
    shortestPath.unshift(node);
    node = node.prevNode;
    if (node) node.isShortestPath = true;
  }
  return shortestPath;
};

export default dijkstra;
