const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Background
const bg = new Image();
bg.src = "beach.jpg";

// Path
const path = [
  { x: 0, y: 200 },    // START
  { x: 150, y: 200 },
  { x: 150, y: 350 },
  { x: 300, y: 350 },
  { x: 300, y: 250 },
  { x: 450, y: 250 },
  { x: 450, y: 400 },
  { x: 100, y: 400 },
  { x: 100, y: 475 },
  { x: 500, y: 475 },
  { x: 500, y: 225 },
  { x: 550, y: 225 },
  { x: 550, y: 525 },
  { x: 800, y: 525 }  // END
];

let lives = 20;
const livesEl = document.getElementById("lives");
let waveInProgress = false;

function updateLivesDisplay() {
  livesEl.textContent = lives;
}

updateLivesDisplay();

let isGameOver = false;

function gameOver() {
  isGameOver = true;
  alert("Game Over!");
}

const balloonImg = new Image();
balloonImg.src = "red_balloon.png";

// Balloon class
class Balloon {
  constructor(health = 1) { // default 1 HP
    this.x = path[0].x;
    this.y = path[0].y;
    this.speed = 1.5;
    this.pathIndex = 0;
    this.alive = true;
    this.maxHealth = health;
    this.health = health;
  }

update() {
    if (this.pathIndex >= path.length - 1) {
      this.alive = false;
      lives--;
      updateLivesDisplay();

      if (lives <= 0) {
        gameOver();
      }

      return;
    }

    const target = path[this.pathIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

    draw() {
        const size = 25; // adjust if needed
        ctx.drawImage(
            balloonImg,
            this.x - size / 2,
            this.y - size / 2,
            size,
            size
        );
    }
}

// Draw path overlay (optional)
function drawPath() {
  ctx.strokeStyle = "rgba(255,200,0,0.5)";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
}


// ---- Tower Assets ----
const towerImages = {
  chloe: new Image(),
  lucas: new Image()
};
towerImages.chloe.src = "chloe.png";
towerImages.lucas.src = "lucas.png";

let money = 100;
let selectedTower = null;
const TOWER_COST = 50;
const towers = [];

// Update money display
const moneyEl = document.getElementById("money");
function updateMoneyDisplay() {
  moneyEl.textContent = money;
}
updateMoneyDisplay();

// Track mouse position relative to canvas
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Handle tower selection
document.querySelectorAll(".tower-option").forEach(option => {
  option.addEventListener("mousedown", () => {
    const towerName = option.querySelector("p").textContent.toLowerCase();
    if (money >= TOWER_COST) {
      selectedTower = { name: towerName, width: 40, height: 40 }; // store image size
    } else {
      alert("Not enough money!");
    }
  });
});

// Place tower on click
canvas.addEventListener("click", () => {
  if (!selectedTower) return;

  // Check if position is on path
  let onPath = false;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dist = pointToSegmentDistance(mouseX, mouseY, a.x, a.y, b.x, b.y);
    if (dist < 25) { // minimum distance from path
      onPath = true;
      break;
    }
  }

  if (onPath) {
    alert("Cannot place tower on the path!");
    return;
  }

  // Place tower
  towers.push({
    name: selectedTower.name,
    x: mouseX - selectedTower.width / 2, // center image on click
    y: mouseY - selectedTower.height / 2,
    width: selectedTower.width,
    height: selectedTower.height,
    range: selectedTower.name === "chloe" ? 120 : 160,
    fireRate: selectedTower.name === "chloe" ? 40 : 60, // frames between shots
    cooldown: 0
  });

  money -= TOWER_COST;
  updateMoneyDisplay();
  selectedTower = null;
});

function updateTowers() {
  towers.forEach(tower => {
    if (tower.cooldown > 0) {
      tower.cooldown--;
      return;
    }

    // Find first balloon in range
    for (let balloon of balloons) {
      const centerX = tower.x + tower.width / 2;
      const centerY = tower.y + tower.height / 2;
      const dx = balloon.x - centerX;
      const dy = balloon.y - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist <= tower.range) {
        // Shoot!
        projectiles.push({
          x: centerX,
          y: centerY,
          target: balloon,
          speed: 4
        });

        tower.cooldown = tower.fireRate;
        break;
      }
    }
  });
}


// Draw tower being dragged
function drawSelectedTower() {
  if (!selectedTower) return;
  const img = towerImages[selectedTower.name];
  const w = selectedTower.width;
  const h = selectedTower.height;
  ctx.drawImage(img, mouseX - w / 2, mouseY - h / 2, w, h);
}

function drawPlacedTowers() {
  towers.forEach(t => {
    const img = towerImages[t.name];
    // Draw the tower image
    ctx.drawImage(img, t.x, t.y, t.width, t.height);

    // Check if mouse is over this tower
    const centerX = t.x + t.width / 2;
    const centerY = t.y + t.height / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const dist = Math.hypot(dx, dy);

    // If hovering, draw filled transparent range circle
    if (dist <= t.width / 2) {
      ctx.fillStyle = "rgba(255,255,0,0.2)"; // yellow transparent
      ctx.beginPath();
      ctx.arc(centerX, centerY, t.range, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}


// Utility: distance from point to line segment
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.hypot(dx, dy);
}



// WAVES 
const totalWaves = 5;
let currentWave = 1;

const waveConfigs = [
  { count: 12, speed: 1.2, health: 1, spawnInterval: 800 },  // Wave 1 – easy
  { count: 18, speed: 1.3, health: 3, spawnInterval: 700 },  // Wave 2 – slightly faster
  { count: 20, speed: 1.4, health: 4, spawnInterval: 600 },  // Wave 3 – more HP
  { count: 25, speed: 1.5, health: 5, spawnInterval: 500 },  // Wave 4 – faster + more balloons
  { count: 30, speed: 1.6, health: 6, spawnInterval: 450 }   // Wave 5 – final boss-ish wave
];


const waveEl = document.getElementById("wave");
function updateWaveDisplay() {
    waveEl.textContent = `${currentWave} / ${totalWaves}`;
}
updateWaveDisplay();

// Wave system
let balloons = [];
const startBtn = document.getElementById("startWave");


function startWave() {
  if (isGameOver || waveInProgress) return;
  if (currentWave > totalWaves) return;

  startBtn.disabled = true;
  waveInProgress = true;

  const config = waveConfigs[currentWave - 1];

  for (let i = 0; i < config.count; i++) {
    setTimeout(() => {
      const b = new Balloon(config.health);
      b.speed = config.speed;
      balloons.push(b);
    }, i * config.spawnInterval);
  }
}




// Projectiles and Collision
const projectiles = [];
const POP_REWARD = 10;

function updateProjectiles() {
  projectiles.forEach((p, pIndex) => {
    if (!p.target.alive) {
      projectiles.splice(pIndex, 1);
      return;
    }

    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) {
      // Hit!
      p.target.health -= 1; // Each projectile deals 1 damage
      if (p.target.health <= 0) {
        p.target.alive = false;
        money += POP_REWARD;
        updateMoneyDisplay();
      }
      projectiles.splice(pIndex, 1);
      return;
    }

    p.x += (dx / dist) * p.speed;
    p.y += (dy / dist) * p.speed;
  });
}


function drawProjectiles() {
  ctx.fillStyle = "black";
  projectiles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}


function showVictoryScreen() {
  isGameOver = true;

  // Create pink → blue gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ff69b4");  // hot pink
  gradient.addColorStop(1, "#4da6ff");  // soft blue

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add semi-transparent overlay for readability
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Main message
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "bold 42px sans-serif";
  ctx.fillText("Happy Valentines Day Chlo,", canvas.width / 2, canvas.height / 2 - 30);

  ctx.font = "bold 48px sans-serif";
  ctx.fillText("I love you! 💖", canvas.width / 2, canvas.height / 2 + 30);
}



// Game loop
function loop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    drawPath();

    balloons.forEach((b, i) => {
        b.update();
        b.draw();
        if (!b.alive) balloons.splice(i, 1);
    });

    if (waveInProgress && balloons.length === 0) {
        waveInProgress = false;

        currentWave++;

        if (currentWave > totalWaves) {
            showVictoryScreen();
            return;
        }

        updateWaveDisplay();
        startBtn.disabled = false;
    }




    updateTowers();
    updateProjectiles();
    drawProjectiles();

    drawPlacedTowers();
    drawSelectedTower();

    requestAnimationFrame(loop);
}


bg.onload = () => loop();

// Hook up button
document.getElementById("startWave").addEventListener("click", startWave);
