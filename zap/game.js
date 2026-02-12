let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let livesElement = document.getElementById('livesCount');
let scoreElement = document.getElementById('scoreCount');
let highScoreElement = document.getElementById('highScoreCount');
let gameOverElement = document.getElementById('gameOver');
let finalScoreElement = document.getElementById('finalScore');
let finalHighScoreElement = document.getElementById('finalHighScore');
let restartBtn = document.getElementById('restartBtn');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

let gameState = {
    lives: 1,
    score: 0,
    gameOver: false
};

let sessionHighScore = 0;

let protagonists = [
    { x: width * 0.3, y: height * 0.5, radius: 15 },
    { x: width * 0.7, y: height * 0.5, radius: 15 }
];

let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnInterval = 2000;
let lastTime = 0;

let electricityParticles = [];
let draggedProtagonistIndex = null;
let keys = {};
let keyboardSpeed = 3;

function getDistance(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getClosestProtagonist(x, y) {
    let minDist = Infinity;
    let closestIndex = 0;
    
    for (let i = 0; i < protagonists.length; i++) {
        let dist = getDistance(x, y, protagonists[i].x, protagonists[i].y);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }
    
    return closestIndex;
}

function spawnEnemy() {
    let side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    if (side === 0) {
        x = Math.random() * width;
        y = -20;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 2 + 1;
    } else if (side === 1) {
        x = width + 20;
        y = Math.random() * height;
        vx = -(Math.random() * 2 + 1);
        vy = (Math.random() - 0.5) * 2;
    } else if (side === 2) {
        x = Math.random() * width;
        y = height + 20;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 2 + 1);
    } else {
        x = -20;
        y = Math.random() * height;
        vx = Math.random() * 2 + 1;
        vy = (Math.random() - 0.5) * 2;
    }
    
    enemies.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: 12,
        color: `hsl(${Math.random() * 60 + 300}, 100%, 60%)`
    });
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    let A = px - x1;
    let B = py - y1;
    let C = x2 - x1;
    let D = y2 - y1;
    
    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    
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
    
    let dx = px - xx;
    let dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateElectricity() {
    electricityParticles = [];
    let p1 = protagonists[0];
    let p2 = protagonists[1];
    let segments = 30;
    
    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let baseX = p1.x + (p2.x - p1.x) * t;
        let baseY = p1.y + (p2.y - p1.y) * t;
        
        let offsetX = (Math.random() - 0.5) * 8;
        let offsetY = (Math.random() - 0.5) * 8;
        
        electricityParticles.push({
            x: baseX + offsetX,
            y: baseY + offsetY
        });
    }
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        
        for (let j = 0; j < protagonists.length; j++) {
            let protag = protagonists[j];
            let dist = getDistance(enemy.x, enemy.y, protag.x, protag.y);
            
            if (dist < enemy.radius + protag.radius) {
                gameState.lives--;
                livesElement.textContent = gameState.lives;
                enemies.splice(i, 1);
                
                if (gameState.lives <= 0) {
                    endGame();
                }
                break;
            }
        }
        
        if (i >= enemies.length) continue;
        
        let p1 = protagonists[0];
        let p2 = protagonists[1];
        let distToLine = pointToLineDistance(enemy.x, enemy.y, p1.x, p1.y, p2.x, p2.y);
        
        if (distToLine < enemy.radius + 5) {
            let lineLength = getDistance(p1.x, p1.y, p2.x, p2.y);
            let distToP1 = getDistance(enemy.x, enemy.y, p1.x, p1.y);
            let distToP2 = getDistance(enemy.x, enemy.y, p2.x, p2.y);
            
            if (distToP1 <= lineLength + enemy.radius && distToP2 <= lineLength + enemy.radius) {
                gameState.score += 10;
                scoreElement.textContent = gameState.score;
                updateHighScore();
                enemies.splice(i, 1);
            }
        }
    }
}

function updateEnemies(deltaTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        if (enemy.x < -50 || enemy.x > width + 50 || 
            enemy.y < -50 || enemy.y > height + 50) {
            enemies.splice(i, 1);
        }
    }
}

function updateHighScore() {
    if (gameState.score > sessionHighScore) {
        sessionHighScore = gameState.score;
        highScoreElement.textContent = sessionHighScore;
    }
}

function endGame() {
    updateHighScore();
    gameState.gameOver = true;
    finalScoreElement.textContent = gameState.score;
    finalHighScoreElement.textContent = sessionHighScore;
    gameOverElement.classList.remove('hidden');
}

function restart() {
    gameState.lives = 1;
    gameState.score = 0;
    gameState.gameOver = false;
    enemies = [];
    electricityParticles = [];
    enemySpawnTimer = 0;
    
    protagonists[0].x = width * 0.3;
    protagonists[0].y = height * 0.5;
    protagonists[1].x = width * 0.7;
    protagonists[1].y = height * 0.5;
    
    livesElement.textContent = gameState.lives;
    scoreElement.textContent = gameState.score;
    gameOverElement.classList.add('hidden');
}

function updateProtagonistPosition(index, x, y) {
    if (index === null || gameState.gameOver) return;
    
    protagonists[index].x = x;
    protagonists[index].y = y;
    
    if (protagonists[index].x < protagonists[index].radius) {
        protagonists[index].x = protagonists[index].radius;
    }
    if (protagonists[index].x > width - protagonists[index].radius) {
        protagonists[index].x = width - protagonists[index].radius;
    }
    if (protagonists[index].y < protagonists[index].radius) {
        protagonists[index].y = protagonists[index].radius;
    }
    if (protagonists[index].y > height - protagonists[index].radius) {
        protagonists[index].y = height - protagonists[index].radius;
    }
}

function getCanvasCoordinates(e) {
    let rect = canvas.getBoundingClientRect();
    let clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    let clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState.gameOver) return;
    let coords = getCanvasCoordinates(e);
    draggedProtagonistIndex = getClosestProtagonist(coords.x, coords.y);
    updateProtagonistPosition(draggedProtagonistIndex, coords.x, coords.y);
});

canvas.addEventListener('mousemove', (e) => {
    if (draggedProtagonistIndex !== null) {
        let coords = getCanvasCoordinates(e);
        updateProtagonistPosition(draggedProtagonistIndex, coords.x, coords.y);
    }
});

canvas.addEventListener('mouseup', () => {
    draggedProtagonistIndex = null;
});

canvas.addEventListener('mouseleave', () => {
    draggedProtagonistIndex = null;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.gameOver) return;
    let coords = getCanvasCoordinates(e);
    draggedProtagonistIndex = getClosestProtagonist(coords.x, coords.y);
    updateProtagonistPosition(draggedProtagonistIndex, coords.x, coords.y);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (draggedProtagonistIndex !== null) {
        let coords = getCanvasCoordinates(e);
        updateProtagonistPosition(draggedProtagonistIndex, coords.x, coords.y);
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    draggedProtagonistIndex = null;
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    draggedProtagonistIndex = null;
});

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

function updateKeyboardMovement() {
    if (gameState.gameOver) return;
    
    let p0 = protagonists[0];
    let p1 = protagonists[1];
    
    if (keys['w'] || keys['KeyW']) {
        p0.y = Math.max(p0.radius, p0.y - keyboardSpeed);
    }
    if (keys['s'] || keys['KeyS']) {
        p0.y = Math.min(height - p0.radius, p0.y + keyboardSpeed);
    }
    if (keys['a'] || keys['KeyA']) {
        p0.x = Math.max(p0.radius, p0.x - keyboardSpeed);
    }
    if (keys['d'] || keys['KeyD']) {
        p0.x = Math.min(width - p0.radius, p0.x + keyboardSpeed);
    }
    
    if (keys['ArrowUp']) {
        p1.y = Math.max(p1.radius, p1.y - keyboardSpeed);
    }
    if (keys['ArrowDown']) {
        p1.y = Math.min(height - p1.radius, p1.y + keyboardSpeed);
    }
    if (keys['ArrowLeft']) {
        p1.x = Math.max(p1.radius, p1.x - keyboardSpeed);
    }
    if (keys['ArrowRight']) {
        p1.x = Math.min(width - p1.radius, p1.x + keyboardSpeed);
    }
}

restartBtn.addEventListener('click', restart);

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    if (gameState.gameOver) return;
    
    updateElectricity();
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    
    ctx.beginPath();
    ctx.moveTo(electricityParticles[0].x, electricityParticles[0].y);
    for (let i = 1; i < electricityParticles.length; i++) {
        ctx.lineTo(electricityParticles[i].x, electricityParticles[i].y);
    }
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    for (let i = 0; i < protagonists.length; i++) {
        let protag = protagonists[i];
        let gradient = ctx.createRadialGradient(
            protag.x, protag.y, 0,
            protag.x, protag.y, protag.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(protag.x, protag.y, protag.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function gameLoop(currentTime) {
    if (!gameState.gameOver) {
        let deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        updateKeyboardMovement();
        
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer >= enemySpawnInterval) {
            spawnEnemy();
            enemySpawnTimer = 0;
            enemySpawnInterval = Math.max(800, enemySpawnInterval - 20);
        }
        
        updateEnemies(deltaTime);
        checkCollisions();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
