// ========== GET ELEMENTS ==========
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

// ========== LOAD IMAGES ==========
// Your images from /images folder
const girlRunImg = new Image();
const girlJumpImg = new Image();
const cactusImg = new Image();

// Fix for GitHub Pages paths
girlRunImg.src = './images/girl-run.png';
girlJumpImg.src = './images/girl-jump.png';
cactusImg.src = './images/cactus.png';

// Error checking
girlRunImg.onerror = () => console.error('❌ girl-run.png не загрузилась!');
girlJumpImg.onerror = () => console.error('❌ girl-jump.png не загрузилась!');
cactusImg.onerror = () => console.error('❌ cactus.png не загрузилась!');

// Current player image
let currentGirlImg = girlRunImg;

// ========== GAME VARIABLES ==========
let score = 0;
let best = localStorage.getItem('lidaBest') || 0;
let gameRunning = false;
let gamePaused = false;
let speed = 3; // ЗАМЕДЛЕНО: было 5
let gameOverFlag = false;

// ========== PLAYER ==========
let player = {
    x: 100,
    y: canvas.height - 100,
    width: 70,
    height: 90,
    jumping: false,
    vy: 0,
    jumpPower: -12 // ЗАМЕДЛЕНО: было -16
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
        currentGirlImg = girlJumpImg; // Switch to jump image
    }
}

function start() {
    if (!gameRunning || gameOverFlag) {
        gameRunning = true;
        gamePaused = false;
        gameOverFlag = false;
        score = 0;
        speed = 3; // Сброс к медленной скорости
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
        // Fallback if image not loaded
        ctx.fillStyle = '#ff66b2';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = 'white';
        ctx.fillText('LIDA', player.x + 10, player.y + 50);
    }
}

function drawCactuses() {
    for (let cactus of cactuses) {
        if (cactusImg.complete) {
            ctx.drawImage(cactusImg, cactus.x, cactus.y, cactus.width, cactus.height);
        } else {
            // Fallback if cactus image not loaded
            ctx.fillStyle = '#339933';
            ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        }
    }
}

function drawGround() {
    ctx.fillStyle = '#a0d56a';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    
    // Ground details
    ctx.fillStyle = '#8cc152';
    for (let i = 0; i < canvas.width; i += 40) { // Реже детали
        ctx.fillRect(i, canvas.height - 40, 20, 5);
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    // Медленное движение облаков
    ctx.fillRect(150 + score * 0.2, 80, 70, 25);
    ctx.fillRect(400 + score * 0.15, 60, 90, 30);
    ctx.fillRect(600 + score * 0.1, 90, 60, 20);
}

function drawUI() {
    // Score shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`SCORE: ${score}`, 22, 42);
    ctx.fillText(`BEST: ${best}`, canvas.width - 152, 42);
    
    // Score text
    ctx.fillStyle = '#ff3366';
    ctx.fillText(`SCORE: ${score}`, 20, 40);
    ctx.fillText(`BEST: ${best}`, canvas.width - 150, 40);
    
    // Speed indicator
    if (speed > 3) {
        ctx.fillStyle = '#ff9900';
        ctx.font = '16px Arial';
        ctx.fillText(`Speed: ${speed}`, canvas.width / 2 - 40, 30);
    }
}

// ========== GAME LOGIC ==========
function updatePlayer() {
    if (player.jumping) {
        player.vy += 0.6; // ЗАМЕДЛЕНО: было 0.8 (меньше гравитация)
        player.y += player.vy;
        
        // Hit ground
        if (player.y > canvas.height - 100) {
            player.y = canvas.height - 100;
            player.vy = 0;
            player.jumping = false;
            currentGirlImg = girlRunImg; // Back to run image
        }
    }
}

function updateCactuses() {
    cactusTimer++;
    
    // Create new cactus - РЕЖЕ: было 80 - speed * 3
    if (cactusTimer > 120 - speed * 2) {
        cactuses.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 40,
            height: 60,
            passed: false
        });
        cactusTimer = 0;
    }
    
    // Move cactuses
    for (let i = cactuses.length - 1; i >= 0; i--) {
        cactuses[i].x -= speed;
        
        // Remove if off screen
        if (cactuses[i].x < -50) {
            cactuses.splice(i, 1);
        }
        
        // Score point when passing cactus
        if (!cactuses[i].passed && cactuses[i].x < player.x) {
            cactuses[i].passed = true;
            score++;
            updateScore();
        }
    }
}

function checkCollisions() {
    for (let cactus of cactuses) {
        // Simple collision detection
        if (
            player.x < cactus.x + cactus.width &&
            player.x + player.width > cactus.x &&
            player.y < cactus.y + cactus.height &&
            player.y + player.height > cactus.y
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawClouds();
    drawGround();
    drawCactuses();
    drawPlayer();
    drawUI();
    
    // Update game state
    updatePlayer();
    updateCactuses();
    
    // Check collision
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Increase difficulty - МЕДЛЕННЕЕ: было каждые 10 очков
    if (score > 0 && score % 15 === 0) {
        speed = 3 + Math.floor(score / 20); // Медленнее рост
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
    
    // Title
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('LIDA RUN', canvas.width / 2 - 120, 100);
    
    // Player preview
    if (girlRunImg.complete) {
        ctx.drawImage(girlRunImg, canvas.width / 2 - 35, 150, 70, 90);
    }
    
    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('Нажми ENTER или кнопку START', canvas.width / 2 - 160, 280);
    ctx.fillText('ПРОБЕЛ - прыжок • P - пауза', canvas.width / 2 - 140, 310);
    
    // Speed info
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('⚡ Версия с комфортной скоростью', canvas.width / 2 - 150, 350);
}

// Draw start screen when images load
girlRunImg.onload = drawStartScreen;
girlJumpImg.onload = function() {
    console.log('✅ Jump image loaded');
};
cactusImg.onload = function() {
    console.log('✅ Cactus image loaded');
};

// Debug info after 3 seconds
setTimeout(() => {
    console.log('Картинки загружены:');
    console.log('Бег:', girlRunImg.complete);
    console.log('Прыжок:', girlJumpImg.complete);
    console.log('Кактус:', cactusImg.complete);
    console.log('Текущая скорость:', speed);
}, 3000);

// Also draw start screen if images are already loaded
if (girlRunImg.complete) {
    drawStartScreen();
} else {
    girlRunImg.onload = drawStartScreen;
}

// Add pause button functionality to HTML buttons
document.addEventListener('DOMContentLoaded', function() {
    // If you have a pause button in HTML
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent.includes('PAUSE') || btn.textContent.includes('Пауза')) {
            btn.onclick = pause;
        }
    });
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) start();
    else jump();
});
