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
    // УВЕЛИЧЕННЫЙ В 3 РАЗА ПРЫЖОК
    jumpStartTime: 0,
    jumpHoldPower: 0,
    maxJumpHold: 800,       // В 2 раза дольше удержание (было 400)
    baseJumpPower: -25,     // В ~2 раза выше базовый прыжок (было -15)
    maxJumpPower: -45,      // В ~2.5 раза выше максимальный (было -28)
    gravity: 0.25           // В 3 раза меньше гравитация (было 0.35)
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
        
        // Мощный рост силы прыжка
        player.jumpHoldPower = player.baseJumpPower + 
            (player.maxJumpPower - player.baseJumpPower) * Math.pow(holdPercent, 0.5);
        
        player.vy = player.jumpHoldPower;
        
        // Индикатор в консоли
        if (holdTime % 100 < 16) { // Каждые 100мс
            console.log(`Прыжок: ${Math.round(-player.vy)} силы, удержание: ${Math.round(holdPercent*100)}%`);
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
    
    // Индикатор высоты прыжка
    if (player.jumping) {
        const jumpHeight = Math.max(0, (canvas.height - 100) - player.y);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.round(jumpHeight)}px`, player.x - 20, player.y - 10);
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
    
    // Индикатор прыжка
    if (player.jumping && spacePressed) {
        const holdTime = Date.now() - player.jumpStartTime;
        const holdPercent = Math.min(holdTime / player.maxJumpHold, 1);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(player.x - 15, player.y - 40, 100, 12);
        
        ctx.fillStyle = holdPercent > 0.7 ? '#ff0000' : 
                       holdPercent > 0.4 ? '#ffff00' : '#00ff00';
        ctx.fillRect(player.x - 15, player.y - 40, 100 * holdPercent, 12);
        
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(`Сила: ${Math.round(holdPercent*100)}%`, player.x - 10, player.y - 30);
    }
}

// ========== GAME LOGIC ==========
function updatePlayer() {
    if (player.jumping) {
        if (spacePressed) {
            continueJump();
        }
        
        // ОЧЕНЬ МАЛЕНЬКАЯ ГРАВИТАЦИЯ
        player.vy += player.gravity;
        player.y += player.vy;
        
        // Максимальная высота прыжка (почти до верха экрана)
        if (player.y < 50) {
            player.y = 50;
            player.vy = 0;
        }
        
        // Земля
        if (player.y > canvas.height - 100) {
            player.y = canvas.height - 100;
            player.vy = 0;
            player.jumping = false;
            currentGirlImg = girlRunImg;
            spacePressed = false;
            console.log('Прыжок завершён');
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
            // СУПЕР МАЛЕНЬКИЙ ХИТБОКС
            hitboxX: 18,
            hitboxY: 50,           // Только самый низ кактуса
            hitboxWidth: 4,
            hitboxHeight: 5,
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
    // ВРЕМЕННО ОТКЛЮЧЕНО - УДАЛИ ЭТУ СТРОКУ ПОСЛЕ ТЕСТА
    return false;
    
    for (let cactus of cactuses) {
        const cactusHitbox = {
            x: cactus.x + cactus.hitboxX,
            y: cactus.y + cactus.hitboxY,
            width: cactus.hitboxWidth,
            height: cactus.hitboxHeight
        };
        
        const playerHitbox = {
            x: player.x + 35,
            y: player.y + 85,      // Только самые ноги
            width: player.width - 70,
            height: player.height - 85
        };
        
        // Визуализация хитбоксов
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
    ctx.fillText('LIDA RUN - МЕГА ПРЫЖКИ', canvas.width / 2 - 240, 100);
    if (girlRunImg.complete) {
        ctx.drawImage(girlRunImg, canvas.width / 2 - 35, 150, 70, 90);
    }
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('Нажми ENTER или кнопку START', canvas.width / 2 - 160, 280);
    ctx.fillText('ПРОБЕЛ - прыжок (ДЕРЖИ для супер-высоты!)', canvas.width / 2 - 230, 310);
    ctx.fillText('Прыжок в 3 раза выше и дольше!', canvas.width / 2 - 160, 340);
}

girlRunImg.onload = drawStartScreen;
if (girlRunImg.complete) drawStartScreen();
