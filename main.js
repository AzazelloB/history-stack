let canvasWidth = 0;
let canvasHeight = 0;

let historyCursor = 0;
const history = [];
const historyLimit = 100;

const size = 25;
const position = {
  x: 0,
  y: 0,
};
const path = [];
const portals = [];

const pushToHistory = (step) => {
  if (historyCursor < history.length) {
    history.splice(historyCursor);
  }

  if (history.length >= historyLimit) {
    history.shift();
  }
  
  history.push(step);
  historyCursor = history.length;
};

const checkInBoundaries = (x, y) => {
  if (position.x + x < 0 || position.x + x >= canvasWidth) {
    return false;
  }

  if (position.y + y < 0 || position.y + y >= canvasHeight) {
    return false;
  }

  return true;
};

const move = (x, y) => {
  position.x += x;
  position.y += y;
  path.push({ x: position.x, y: position.y });
};

const maybeMove = (x, y) => {
  if (!checkInBoundaries(x, y)) {
    return;
  }

  move(x, y);
  pushToHistory({
    forwardAction: move,
    backwardAction: undoMove,
    args: [x, y],
  });
};

const undoMove = (x, y) => {
  position.x -= x;
  position.y -= y;
  path.pop();
};

const findPortal = (x, y) => {
  return portals.find(({ x1, y1, x2, y2 }) => {
    if (x === x1 && y === y1) {
      return true;
    }

    if (x === x2 && y === y2) {
      return true;
    }

    return false;
  });
};

const teleport = ({ x1, y1, x2, y2 }) => {
  if (position.x === x1 && position.y === y1) {
    move(x2 - x1, y2 - y1);
  } else {
    move(x1 - x2, y1 - y2);
  }
};

const maybeTeleport = () => {
  const portal = findPortal(position.x, position.y);

  if (!portal) {
    return;
  }

  teleport(portal);
  pushToHistory({
    forwardAction: teleport,
    backwardAction: undoTeleport,
    args: [portal],
  });
};

const undoTeleport = ({ x1, y1, x2, y2 }) => {
  if (position.x === x1 && position.y === y1) {
    undoMove(x1 - x2, y1 - y2);
  } else {
    undoMove(x2 - x1, y2 - y1);
  }
};

const handleUndo = () => {
  if (historyCursor <= 0) {
    return;
  }

  const step = history[--historyCursor];

  step.backwardAction(...step.args);
};

const handleRedo = () => {
  if (historyCursor >= history.length) {
    return;
  }

  const step = history[historyCursor++];
  
  step.forwardAction(...step.args);
};

const initLevel = () => {
  move(
    Math.floor(Math.random() * (canvasWidth / size)) * size,
    Math.floor(Math.random() * (canvasHeight / size)) * size
  );

  for (let i = 0; i < 3; i++) {
    let x1, y1, x2, y2;
    
    do {
      x1 = Math.floor(Math.random() * (canvasWidth / size)) * size;
      y1 = Math.floor(Math.random() * (canvasHeight / size)) * size;
    } while (x1 === position.x && y1 === position.y && portals.some(({ x, y }) => x === x1 && y === y1));
    
    do {
      x2 = Math.floor(Math.random() * (canvasWidth / size)) * size;
      y2 = Math.floor(Math.random() * (canvasHeight / size)) * size;
    } while (x2 === position.x && y2 === position.y && portals.some(({ x, y }) => x === x2 && y === y2));
    
    portals.push({ x1, y1, x2, y2, color: `hsl(${Math.floor(Math.random() * 360)}, 50%, 50%)` });
  }
};

const handleKeydown = (event) => {
  switch (event.code) {
    case 'ShiftLeft':
      break;

    case 'ControlLeft':
      break;

    case 'AltLeft':
      break;
    
    case 'KeyZ':
      if (event.ctrlKey) {
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      break;
      
    case 'ArrowUp':
      maybeMove(0, -size);
      break;

    case 'ArrowDown':
      maybeMove(0, size);
      break;

    case 'ArrowLeft':
      maybeMove(-size, 0)
      break;

    case 'ArrowRight':
      maybeMove(size, 0);
      break;

    case 'KeyE':
      maybeTeleport();
      break;
  
    default:
      throw new Error(`Unknown key: ${event.code}`);
  }
};

const draw = (ctx) => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  portals.forEach(({ x1, y1, x2, y2, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1, size, size);
    ctx.fillRect(x2, y2, size, size);
  });

  ctx.fillStyle = 'gray';
  path.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 4, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.fillStyle = 'white';
  ctx.fillRect(position.x, position.y, size, size);
};

const main = () => {
  document.addEventListener('keydown', handleKeydown);

  const canvas = document.getElementById('canvas');
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  const ctx = canvas.getContext('2d');

  initLevel();

  const gameLoop = () => {
    draw(ctx);
    window.requestAnimationFrame(gameLoop);
  }

  window.requestAnimationFrame(gameLoop);
};

main();
