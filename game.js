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
    y: canvas.height - 125,
    width: 70,
    height: 90,
    jumping: false,
    vy: 0,
    jumpPower: -25.5,
    gravity: 0.80
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
        speed = 2.5;
        cactuses = [];
        player.y = canvas.height - 125;
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
            // КАКТУС КАСАЕТСЯ ЗЕМЛИ - y: canvas.height - 110 (не -112)
            ctx.drawImage(cactusImg, cactus.x, cactus.y, cactus.width, cactus.height);
        } else {
            ctx.fillStyle = '#339933';
            ctx.fillRect(cactus.x, cactus.y, cactus.width, cactus.height);
        }
    }
}

function drawGround() {
    ctx.fillStyle = '#a0d56a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
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
    // Centrer le texte
    const scoreText = `Score: ${score}`;
    const bestText = `Meilleur: ${best}`;
    const scoreWidth = ctx.measureText(scoreText).width;
    const bestWidth = ctx.measureText(bestText).width;
    
    ctx.fillText(scoreText, 20, 40);
    ctx.fillText(bestText, canvas.width - bestWidth - 20, 40);
}

// ========== GAME LOGIC ==========
function updatePlayer() {
    if (player.jumping) {
        player.vy += player.gravity;
        player.y += player.vy;
        
        if (player.y > canvas.height - 125) {
            player.y = canvas.height - 125;
            player.vy = 0;
            player.jumping = false;
            currentGirlImg = girlRunImg;
        }
    }
}

function updateCactuses() {
    cactusTimer++;
    if (cactusTimer > 160) {
        cactuses.push({
            x: canvas.width,
            // ИСПРАВЛЕНО: кактус стоит на земле (высота кактуса 60px, земля 50px)
            // canvas.height - 50 (земля) - 60 (кактус) = canvas.height - 110
            y: canvas.height - 110, // БЫЛО: -112
            width: 40,
            height: 60,
            hitboxX: 5,
            hitboxY: 25,
            hitboxWidth: 30,
            hitboxHeight: 30,
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
        const cactusHitbox = {
            x: cactus.x + cactus.hitboxX,
            y: cactus.y + cactus.hitboxY,
            width: cactus.hitboxWidth,
            height: cactus.hitboxHeight
        };
        
        const playerHitbox = {
            x: player.x + 15,
            y: player.y + 50,
            width: player.width - 30,
            height: player.height - 60
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
        setTimeout(() => alert(`🎉 Nouveau record! Youpi! ${score}!`), 100);
    } else {
        setTimeout(() => alert(`La partie est finie… Miaou… Score : ${score}`), 100);
    }
}

// ========== GAME LOOP ==========
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ТОЛЬКО ОБЛАКА И ЗЕМЛЯ (без деревьев)
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

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawClouds();
    
    // TITRE CENTRÉ
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 48px Arial';
    const title = 'Je cours vers Paris';
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, canvas.width/2 - titleWidth/2, 100);
    
    if (girlRunImg.complete) {
        ctx.drawImage(girlRunImg, canvas.width/2 - 35, 150, 70, 90);
    }
    
    // INSTRUCTIONS CENTRÉES
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    
    const line1 = 'Appuie sur Entrée ou sur Démarrer';
    const line1Width = ctx.measureText(line1).width;
    ctx.fillText(line1, canvas.width/2 - line1Width/2, 280);
    
    const line2 = 'Espace pour sauter, ma petite chatte';
    const line2Width = ctx.measureText(line2).width;
    ctx.fillText(line2, canvas.width/2 - line2Width/2, 310);
}

girlRunImg.onload = drawStartScreen;
if (girlRunImg.complete) drawStartScreen();
