// ========== GET ELEMENTS ==========
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

// ========== LOAD IMAGES ==========
const girlRunImg = new Image();
const girlJumpImg = new Image();
const cactusImg = new Image();

girlRunImg.src = './images/girl-run.png';
girlJumpImg.src = './images/girl-jump.png';
cactusImg.src = './images/cactus.png';

let currentGirlImg = girlRunImg;

// ========== GAME VARIABLES ==========
let score = 0;
let best = localStorage.getItem('lidaBest') || 0;
let gameRunning = false;
let gamePaused = false;
let speed = 2.5;
let gameOverFlag = false;

// ========== PLAYER ==========
let player = {
    x: 100,
    y: canvas.height - 100,
    width: 70,
    height: 90,
    jumping: false,
    vy: 0,
    jumpStartTime: 0,
    jumpHoldPower: 0,
    maxJumpHold: 400,
    baseJumpPower: -15,
    maxJumpPower: -28
};

// ========== CACTUSES ==========
let cactuses = [];
let cactusTimer = 0;

// ========== UPDATE DISPLAY ==========
function updateScore() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
}

// ========== GAME CONTROLS ==========
let spacePressed = false;

function startJump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.jumpStartTime = Date.now();
        player.jumpHoldPower = player.baseJumpPower;
        player.vy = player.baseJumpPower;
        currentGirlImg = girlJumpImg;
        spacePressed = true;
    }
}

function continueJump() {
    if (player.jumping && spacePressed) {
        const holdTime = Date.now() - player.jumpStartTime;
        const holdPercent = Math.min(holdTime / player.maxJumpHold, 1);
        player.jumpHoldPower = player.baseJumpPower + 
            (player.maxJumpPower - player.baseJumpPower) * Math.pow(holdPercent, 0.7);
        player.vy = player.jumpHoldPower;
    }
}

function endJump() {
    spacePressed = false;
}

function start() {
    if (!gameRunning || gameOverFlag) {
        gameRunning = true;
        gamePaused = false;
        gameOverFlag = false;
        score = 0;
        speed = 2.5;
        cactuses = [];
        player.y = canvas.height - 100;
        player.jumping = false;
        spacePressed = false;
        currentGirlImg = girlRunImg;
        updateScore();
        gameLoop();
    }
}

function pause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        if (!gamePaused) gameLoop();
    }
}

// ========== DRAW FUNCTIONS ==========
function drawPlayer() {
    if (currentGirlImg.complete) {
        ctx.drawImage(currentGirlImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#ff66b2';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function drawCactuses() {
    for (let cactus of cactuses) {
        if (cactusImg.complete) {
            ctx.drawImage(cactusImg, cactus.x, cactus.y, cactus.width, cactus.height);
        } else {
            ctx.fillStyle = '#339933';
            ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        }
    }
}

function drawGround() {
    ctx.fillStyle = '#a0d56a';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(150 + score * 0.1, 80, 70, 25);
    ctx.fillRect(400 + score * 0.08, 60, 90, 30);
    ctx.fillRect(600 + score * 0.06, 90, 60, 20);
}

function drawUI() {
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Счёт: ${score}`, 20, 40);
    ctx.fillText(`Рекорд: ${best}`, canvas.width - 170, 40);
}

// ========== GAME LOGIC ==========
function updatePlayer() {
    if (player.jumping) {
        if (spacePressed) {
            continueJump();
        }
        player.vy += 0.35;
        player.y += player.vy;
        if (player.y > canvas.height - 100) {
            player.y = canvas.height - 100;
            player.vy = 0;
            player.jumping = false;
            currentGirlImg = girlRunImg;
            spacePressed = false;
        }
    }
}

function updateCactuses() {
    cactusTimer++;
    if (cactusTimer > 160) {
        cactuses.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 40,
            height: 60,
            // УЗКИЙ И НИЗКИЙ ХИТБОКС
            hitboxX: 15,           // Отступ слева
            hitboxY: 40,           // Отступ сверху (только нижняя часть кактуса)
            hitboxWidth: 10,       // Очень узкий (10px)
            hitboxHeight: 10,      // Очень низкий (10px)
            passed: false
        });
        cactusTimer = 0;
    }
    for (let i = cactuses.length - 1; i >= 0; i--) {
        cactuses[i].x -= speed;
        if (cactuses[i].x < -50) {
            cactuses.splice(i, 1);
        }
        if (!cactuses[i].passed && cactuses[i].x < player.x) {
            cactuses[i].passed = true;
            score++;
            updateScore();
        }
    }
}

function checkCollisions() {
    // ВРЕМЕННО ОТКЛЮЧАЕМ ДЛЯ ТЕСТА - УДАЛИ ЭТУ СТРОКУ!
    return false;
    
    for (let cactus of cactuses) {
        // ХИТБОКС КАКТУСА - только нижний центр
        const cactusHitbox = {
            x: cactus.x + cactus.hitboxX,
            y: cactus.y + cactus.hitboxY,
            width: cactus.hitboxWidth,
            height: cactus.hitboxHeight
        };
        
        // ХИТБОКС ИГРОКА - только нижний центр
        const playerHitbox = {
            x: player.x + 30,      // Большой отступ по ширине
            y: player.y + 70,      // Только нижняя часть игрока
            width: player.width - 60,   // Очень узкий (10px)
            height: player.height - 75  // Очень низкий (15px)
        };
        
        // Визуализация для отладки
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(playerHitbox.x, playerHitbox.y, playerHitbox.width, playerHitbox.height);
        
        ctx.strokeStyle = 'blue';
        ctx.strokeRect(cactusHitbox.x, cactusHitbox.y, cactusHitbox.width, cactusHitbox.height);
        
        if (
            playerHitbox.x < cactusHitbox.x + cactusHitbox.width &&
            playerHitbox.x + playerHitbox.width > cactusHitbox.x &&
            playerHitbox.y < cactusHitbox.y + cactusHitbox.height &&
            playerHitbox.y + playerHitbox.height > cactusHitbox.y
        ) {
            console.log('СТОЛКНОВЕНИЕ!');
            console.log('Игрок:', playerHitbox);
            console.log('Кактус:', cactusHitbox);
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameRunning = false;
    gameOverFlag = true;
    if (score > best) {
        best = score;
        localStorage.setItem('lidaBest', best);
        updateScore();
        setTimeout(() => alert(`🎉 НОВЫЙ РЕКОРД: ${score}!`), 100);
    } else {
        setTimeout(() => alert(`Игра окончена! Счёт: ${score}`), 100);
    }
}

// ========== GAME LOOP ==========
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawClouds();
    drawGround();
    drawCactuses();
    drawPlayer();
    drawUI();
    updatePlayer();
    updateCactuses();
    if (checkCollisions()) {
        gameOver();
        return;
    }
    if (score > 0 && score % 15 === 0) {
        speed = 2.5 + Math.floor(score / 25);
    }
    requestAnimationFrame(gameLoop);
}

// ========== KEYBOARD CONTROLS ==========
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!player.jumping && gameRunning && !gamePaused) {
            startJump();
        }
    }
    if (e.code === 'KeyP') {
        pause();
    }
    if (e.code === 'Enter' && !gameRunning) {
        start();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        endJump();
    }
});

// ========== INITIALIZE ==========
updateScore();

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawClouds();
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('LIDA RUN', canvas.width / 2 - 120, 100);
    if (girlRunImg.complete) {
        ctx.drawImage(girlRunImg, canvas.width / 2 - 35, 150, 70, 90);
    }
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('Нажми ENTER или кнопку START', canvas.width / 2 - 160, 280);
    ctx.fillText('ПРОБЕЛ - прыжок (держи для высокого прыжка)', canvas.width / 2 - 220, 310);
}

girlRunImg.onload = drawStartScreen;
if (girlRunImg.complete) drawStartScreen();
