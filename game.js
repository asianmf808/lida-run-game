// Get elements
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

// Game variables
let score = 0;
let best = localStorage.getItem('lidaBest') || 0;
let gameRunning = false;
let speed = 5;

// Player
let player = {
    x: 100,
    y: canvas.height - 100,
    width: 60,
    height: 80,
    jumping: false,
    vy: 0
};

// Cactuses
let cactuses = [];
let cactusTimer = 0;

// Update display
function updateScore() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
}

// Jump function
function jump() {
    if (!player.jumping && gameRunning) {
        player.jumping = true;
        player.vy = -15;
    }
}

// Start game
function start() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        cactuses = [];
        player.y = canvas.height - 100;
        player.jumping = false;
        updateScore();
        gameLoop();
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#a0d56a';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    
    // Update player
    if (player.jumping) {
        player.vy += 0.8;
        player.y += player.vy;
        if (player.y > canvas.height - 100) {
            player.y = canvas.height - 100;
            player.jumping = false;
        }
    }
    
    // Draw player (pink box for now)
    ctx.fillStyle = '#ff66b2';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Create cactuses
    cactusTimer++;
    if (cactusTimer > 60) {
        cactuses.push({
            x: canvas.width,
            y: canvas.height - 90,
            width: 30,
            height: 50
        });
        cactusTimer = 0;
    }
    
    // Update cactuses
    for (let i = cactuses.length - 1; i >= 0; i--) {
        cactuses[i].x -= speed;
        
        // Draw cactus
        ctx.fillStyle = '#339933';
        ctx.fillRect(cactuses[i].x, cactuses[i].y, cactuses[i].width, cactuses[i].height);
        
        // Check collision
        if (
            player.x < cactuses[i].x + cactuses[i].width &&
            player.x + player.width > cactuses[i].x &&
            player.y < cactuses[i].y + cactuses[i].height &&
            player.y + player.height > cactuses[i].y
        ) {
            gameOver();
            return;
        }
        
        // Remove off-screen
        if (cactuses[i].x < -50) {
            cactuses.splice(i, 1);
            score++;
            updateScore();
        }
    }
    
    // Increase speed
    if (score > 0 && score % 10 === 0) {
        speed = 5 + Math.floor(score / 10);
    }
    
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    if (score > best) {
        best = score;
        localStorage.setItem('lidaBest', best);
        updateScore();
        alert('New record: ' + score + '!');
    } else {
        alert('Game over! Score: ' + score);
    }
}

// Keyboard control
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

// Initialize
updateScore();
