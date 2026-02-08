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

// ========== BACKGROUND VARIABLES ==========
let backgroundPlants = [];  // Деревья et cactus à l'horizon
let bgOffset = 0;           // Décalage pour parallaxe

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
function drawBackgroundPlants() {
    bgOffset -= speed * 0.5;
    
    if (backgroundPlants.length < 8 || 
        backgroundPlants[backgroundPlants.length - 1].x < canvas.width - 400) {
        
        const plantTypes = ['cactus', 'tree', 'bush'];
        const type = plantTypes[Math.floor(Math.random() * plantTypes.length)];
        
        backgroundPlants.push({
            x: canvas.width + Math.random() * 200,
            y: canvas.height - 80 - Math.random() * 30,
            width: type === 'tree' ? 40 : 20,
            height: type === 'tree' ? 60 : type === 'cactus' ? 40 : 25,
            type: type,
            color: type === 'tree' ? '#2d5c2d' : 
                   type === 'cactus' ? '#2a7d2a' : '#3a6b3a'
        });
    }
    
    for (let i = backgroundPlants.length - 1; i >= 0; i--) {
        const plant = backgroundPlants[i];
        plant.x += bgOffset * 0.3;
        
        if (plant.x < -100) {
            backgroundPlants.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = plant.color;
        
        if (plant.type === 'tree') {
            ctx.fillRect(plant.x, plant.y, plant.width, plant.height);
            ctx.fillStyle = '#1e4a1e';
            ctx.beginPath();
            ctx.arc(plant.x + plant.width/2, plant.y - 10, 25, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (plant.type === 'cactus') {
            ctx.fillRect(plant.x, plant.y, plant.width, plant.height);
            ctx.fillRect(plant.x - 8, plant.y + 10, 10, 15);
            ctx.fillRect(plant.x + plant.width - 2, plant.y + 5, 10, 12);
            
        } else {
            ctx.beginPath();
            ctx.arc(plant.x + plant.width/2, plant.y + plant.height/2, 
                   plant.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(plant.x - 5, plant.y + plant.height, 
                    plant.width + 10, 5);
    }
    
    if (bgOffset < -1000) bgOffset = 0;
}

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
            y: canvas.height - 112,
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
    
    // 1. PLANTES EN ARRIÈRE-PLAN
    drawBackgroundPlants();
    
    // 2. NUAGES
    drawClouds();
    
    // 3. SOL
    drawGround();
    
    // 4. CACTUS
    drawCactuses();
    
    // 5. JOUEUSE
    drawPlayer();
    
    // 6. INTERFACE
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
    
    // Plantes pour l'écran de démarrage
    for (let i = 0; i < 5; i++) {
        backgroundPlants.push({
            x: 150 + i * 200,
            y: canvas.height - 80 - Math.random() * 30,
            width: Math.random() > 0.5 ? 40 : 20,
            height: Math.random() > 0.5 ? 60 : 40,
            type: Math.random() > 0.5 ? 'tree' : 'cactus',
            color: Math.random() > 0.5 ? '#2d5c2d' : '#2a7d2a'
        });
    }
    
    drawBackgroundPlants();
    
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
