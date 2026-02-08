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
    // ОЧЕНЬ МЕДЛЕННОЕ движение фона
    bgOffset -= speed * 0.1; // В 5 раз медленнее!
    
    // Создаём новые растения если нужно
    if (backgroundPlants.length < 6 || // Меньше растений
        backgroundPlants[backgroundPlants.length - 1].x < canvas.width - 600) { // Реже
        
        const plantTypes = ['cactus', 'tree', 'bush'];
        const type = plantTypes[Math.floor(Math.random() * plantTypes.length)];
        
        backgroundPlants.push({
            x: canvas.width + Math.random() * 300, // Дальше
            y: canvas.height - 100 - Math.random() * 40, // Ниже
            width: type === 'tree' ? 60 : 25, // Больше
            height: type === 'tree' ? 80 : type === 'cactus' ? 50 : 35,
            type: type,
            color: type === 'tree' ? '#3d6c3d' : // Темнее
                   type === 'cactus' ? '#3a8d3a' : '#4a7b4a'
        });
    }
    
    // Рисуем все растения
    for (let i = backgroundPlants.length - 1; i >= 0; i--) {
        const plant = backgroundPlants[i];
        
        // ОЧЕНЬ МЕДЛЕННЫЙ параллакс-эффект
        plant.x += bgOffset * 0.1; // Было 0.3!
        
        // Удаляем если ушли за экран
        if (plant.x < -150) { // Дальше уходят
            backgroundPlants.splice(i, 1);
            continue;
        }
        
        // Рисуем растение
        ctx.fillStyle = plant.color;
        
        if (plant.type === 'tree') {
            // Дерево (ствол + крона)
            ctx.fillRect(plant.x, plant.y, plant.width, plant.height);
            
            // Крона
            ctx.fillStyle = '#2e5a2e';
            ctx.beginPath();
            ctx.arc(plant.x + plant.width/2, plant.y - 15, 30, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (plant.type === 'cactus') {
            // Кактус на заднем плане
            ctx.fillRect(plant.x, plant.y, plant.width, plant.height);
            
            // "Рука" кактуса
            ctx.fillRect(plant.x - 10, plant.y + 15, 12, 18);
            ctx.fillRect(plant.x + plant.width - 2, plant.y + 10, 12, 15);
            
        } else {
            // Куст
            ctx.beginPath();
            ctx.arc(plant.x + plant.width/2, plant.y + plant.height/2, 
                   plant.width/1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Тень под растением (слабее)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(plant.x - 8, plant.y + plant.height, 
                    plant.width + 16, 8);
    }
    
    // Сбрасываем смещение чтобы не уходить в минус
    if (bgOffset < -2000) bgOffset = 0;
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
    
    // 1. PLANTES EN ARRIÈRE-PLAN (ОЧЕНЬ МЕДЛЕННО)
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
    
    // Plantes pour l'écran de démarrage (БОЛЬШЕ И ВЫШЕ)
    for (let i = 0; i < 4; i++) { // Меньше растений
        backgroundPlants.push({
            x: 200 + i * 250, // Реже
            y: canvas.height - 120 - Math.random() * 50, // Ниже
            width: Math.random() > 0.5 ? 70 : 30, // Больше
            height: Math.random() > 0.5 ? 90 : 60,
            type: Math.random() > 0.5 ? 'tree' : 'cactus',
            color: Math.random() > 0.5 ? '#3d6c3d' : '#3a8d3a'
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
