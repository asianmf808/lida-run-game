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

// Error checking
girlRunImg.onerror = () => console.error('❌ girl-run.png не загрузилась!');
girlJumpImg.onerror = () => console.error('❌ girl-jump.png не загрузилась!');
cactusImg.onerror = () => console.error('❌ cactus.png не загрузилась!');

let currentGirlImg = girlRunImg;

// ========== GAME VARIABLES ==========
let score = 0;
let best = localStorage.getItem('lidaBest') || 0;
let gameRunning = false;
let gamePaused = false;
let speed = 2; // ЕЩЁ МЕДЛЕННЕЕ: было 3
let gameOverFlag = false;

// ========== PLAYER ==========
let player = {
    x: 100,
    y: canvas.height - 100,
    width: 70,
    height: 90,
    jumping: false,
    vy: 0,
    jumpPower: -10 // ЕЩЁ НИЖЕ: было -12
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
function jump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.vy = player.jumpPower;
        currentGirlImg = girlJumpImg;
    }
}

function start() {
    if (!gameRunning || gameOverFlag) {
        gameRunning = true;
        gamePaused = false;
        gameOverFlag = false;
        score = 0;
        speed = 2; // Сброс к медленной скорости
        cactuses = [];
        player.y = canvas.height - 100;
        player.jumping = false;
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
            // Рисуем кактус с оригинальным размером
            ctx.drawImage(cactusImg, cactus.x, cactus.y, cactus.width, cactus.height);
            
            // ОТЛАДКА: рисуем хитбокс (можно убрать, когда настроишь)
            if (false) { // поменяй на true чтобы увидеть хитбоксы
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    cactus.x + cactus.hitboxX,
                    cactus.y + cactus.hitboxY,
                    cactus.hitboxWidth,
                    cactus.hitboxHeight
                );
            }
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
    ctx.fillRect(150 + score * 0.1, 80, 70, 25); // Очень медленное движение
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
        player.vy += 0.5; // ЕЩЁ МЕНЬШЕ ГРАВИТАЦИИ: было 0.6
        player.y += player.vy;
        
        if (player.y > canvas.height - 100) {
            player.y = canvas.height - 100;
            player.vy = 0;
            player.jumping = false;
            currentGirlImg = girlRunImg;
        }
    }
}

function updateCactuses() {
    cactusTimer++;
    
    // КАКТУСЫ ПОЯВЛЯЮТСЯ ОЧЕНЬ РЕДКО
    if (cactusTimer > 180) { // было 120
        cactuses.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 40,    // Визуальный размер
            height: 60,   // Визуальный размер
            // УМЕНЬШЕННЫЙ ХИТБОКС (поле столкновения):
            hitboxX: 8,           // отступ слева от визуального кактуса
            hitboxY: 10,          // отступ сверху
            hitboxWidth: 24,      // ширина хитбокса (40-8-8=24)
            hitboxHeight: 40,     // высота хитбокса (60-10-10=40)
            passed: false
        });
        cactusTimer = 0;
    }
    
    // Move cactuses
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
        // ИСПОЛЬЗУЕМ ХИТБОКС КАКТУСА, а не его визуальный размер
        const cactusHitbox = {
            x: cactus.x + cactus.hitboxX,
            y: cactus.y + cactus.hitboxY,
            width: cactus.hitboxWidth,
            height: cactus.hitboxHeight
        };
        
        // УМЕНЬШЕННЫЙ ХИТБОКС ИГРОКА (тоже можно настроить)
        const playerHitbox = {
            x: player.x + 10,      // отступ слева
            y: player.y + 15,      // отступ сверху
            width: player.width - 20,   // уже на 20px
            height: player.height - 25  // ниже на 25px
        };
        
        // Проверка столкновения хитбоксов
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
    
    // ОЧЕНЬ МЕДЛЕННЫЙ РОСТ СЛОЖНОСТИ
    if (score > 0 && score % 20 === 0) { // было 15
        speed = 2 + Math.floor(score / 30); // Очень медленный рост
    }
    
    requestAnimationFrame(gameLoop);
}

// ========== KEYBOARD CONTROLS ==========
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
    
    if (e.code === 'KeyP') {
        pause();
    }
    
    if (e.code === 'Enter' && !gameRunning) {
        start();
    }
});

// ========== INITIALIZE ==========
updateScore();

// Draw initial screen
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
    ctx.fillText('ПРОБЕЛ - прыжок', canvas.width / 2 - 80, 310);
    
    // Инфо о хитбоксах
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('⚡ Обновление: уменьшенные хитбоксы', canvas.width / 2 - 180, 350);
}

girlRunImg.onload = drawStartScreen;

// Also draw start screen if images are already loaded
if (girlRunImg.complete) {
    drawStartScreen();
}

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) start();
    else jump();
});

// Debug info
setTimeout(() => {
    console.log('Скорость игры:', speed);
    console.log('Хитбокс кактуса: 24x40 (вместо 40x60)');
    console.log('Хитбокс игрока: 50x65 (вместо 70x90)');
}, 1000);
