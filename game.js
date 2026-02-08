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
    // БАЛАНСИРОВАННЫЙ ПРЫЖОК
    jumpStartTime: 0,
    maxJumpHold: 300,
    baseJumpPower: -14,
    maxJumpPower: -19,
    gravity: 0.6
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
        player.vy = player.baseJumpPower;
        currentGirlImg = girlJumpImg;
        spacePressed = true;
    }
}

function continueJump() {
    if (player.jumping && spacePressed) {
        const holdTime = Date.now() - player.jumpStartTime;
        const holdPercent = Math.min(holdTime / player.maxJumpHold, 1);
        
        // Плавное усиление
        if (holdPercent < 0.5) {
            player.vy = player.baseJumpPower + (player.maxJumpPower - player.baseJumpPower) * (holdPercent * 2);
        }
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
        
        player.vy += player.gravity;
        player.y += player.vy;
        
        // Максимальная высота - не выше 150px от земли
        if (player.y < canvas.height - 250) {
            player.y = canvas.height - 250;
            player.vy = 0;
        }
        
        // Земля
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
            // МИНИМАЛЬНЫЙ НО РАБОЧИЙ ХИТБОКС
            hitboxX: 10,
            hitboxY: 40,           // Только нижняя треть кактуса
            hitboxWidth: 20,       // Уже видимого
            hitboxHeight: 15,      // Только самый низ
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
    for (let cactus of cactuses) {
        // ХИТБОКС КАКТУСА (маленький, но есть)
        const cactusHitbox = {
            x: cactus.x + cactus.hitboxX,
            y: cactus.y + cactus.hitboxY,
            width: cactus.hitboxWidth,
            height: cactus.hitboxHeight
        };
        
        // ХИТБОКС ИГРОКА (только ноги)
        const playerHitbox = {
            x: player.x + 25,
            y: player.y + 75,      // Только нижняя часть
            width: player.width - 50,
            height: player.height - 80
        };
        
        if (
            playerHitbox.x < cactusHitbox.x + cactusHitbox.width &&
            playerHitbox.x + playerHitbox.width > cactusHitbox.x &&
            playerHitbox.y < cactusHitbox.y + cactusHitbox.height &&
            playerHitbox.y + playerHitbox.height > cactusHitbox.y
        ) {
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
    ctx.fillText('ПРОБЕЛ - прыжок (держи для чуть выше)', canvas.width / 2 - 200, 310);
}

girlRunImg.onload = drawStartScreen;
if (girlRunImg.complete) drawStartScreen();
