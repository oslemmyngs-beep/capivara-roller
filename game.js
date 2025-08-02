// Configuração do canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações do jogo
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Carregamento de imagens
const images = {};
const imageFiles = [
    'scenario_california_games.png',
    'public/image/capivara.png' // sprite da capivara
];

let imagesLoaded = 0;

// Função para carregar imagens
function loadImages() {
    imageFiles.forEach(filename => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            console.log(`Imagem carregada: ${filename}`);
            if (imagesLoaded === imageFiles.length) {
                startGame();
            }
        };
        img.onerror = () => {
            console.error(`Erro ao carregar imagem: ${filename}`);
            imagesLoaded++;
            if (imagesLoaded === imageFiles.length) {
                startGame();
            }
        };
        img.src = filename;
        images[filename] = img;
    });
}

// Classe do jogador (Capivara)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 5;
        this.velocityX = 0;
        this.velocityY = 0;
        this.spriteFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        // Atualizar posição
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Limites da tela
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > GAME_HEIGHT) this.y = GAME_HEIGHT - this.height;

        // Animação do sprite
        this.animationTimer++;
        if (this.animationTimer > 10) {
            this.spriteFrame = (this.spriteFrame + 1) % 4;
            this.animationTimer = 0;
        }

        // Aplicar atrito
        this.velocityX *= 0.9;
        this.velocityY *= 0.9;
    }

    draw() {
        // Desenhar sprite da capivara
        const spriteX = this.spriteFrame * 64;
        const spriteY = 0;
        
        if (images['public/image/capivara.png']) {
            ctx.drawImage(
                images['public/image/capivara.png'],
                spriteX, spriteY, 64, 64,
                this.x, this.y, this.width, this.height
            );
        } else {
            // Fallback se a imagem não carregar
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Classe dos inimigos
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 2 + Math.random() * 3;
        this.type = type; // 0: tartaruga, 1: humano, 2: elefante
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.spriteFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        // Movimento automático
        this.x += this.speed * this.direction;

        // Inverter direção nas bordas
        if (this.x < 0 || this.x + this.width > GAME_WIDTH) {
            this.direction *= -1;
        }

        // Animação
        this.animationTimer++;
        if (this.animationTimer > 15) {
            this.spriteFrame = (this.spriteFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }

    draw() {
        // Desenhar sprite do inimigo baseado no tipo
        const spriteX = this.spriteFrame * 64;
        const spriteY = (this.type + 1) * 64; // +1 porque a capivara está na linha 0
        
        if (images['public/image/capivara.png']) {
            ctx.drawImage(
                images['public/image/capivara.png'],
                spriteX, spriteY, 64, 64,
                this.x, this.y, this.width, this.height
            );
        } else {
            // Fallback
            const colors = ['#228B22', '#FF6347', '#4682B4'];
            ctx.fillStyle = colors[this.type];
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Variáveis do jogo
let player;
let enemies = [];
let keys = {};
let gameRunning = false;

// Controles
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Função para processar entrada
function handleInput() {
    if (keys['ArrowLeft']) {
        player.velocityX -= 0.5;
    }
    if (keys['ArrowRight']) {
        player.velocityX += 0.5;
    }
    if (keys['ArrowUp']) {
        player.velocityY -= 0.5;
    }
    if (keys['ArrowDown']) {
        player.velocityY += 0.5;
    }
    if (keys['Space']) {
        // Acelerar
        const boost = 0.3;
        if (keys['ArrowLeft']) player.velocityX -= boost;
        if (keys['ArrowRight']) player.velocityX += boost;
        if (keys['ArrowUp']) player.velocityY -= boost;
        if (keys['ArrowDown']) player.velocityY += boost;
    }
}

// Função para detectar colisões
function checkCollisions() {
    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            // Colisão detectada - remover inimigo
            enemies.splice(index, 1);
            
            // Adicionar novo inimigo
            setTimeout(() => {
                enemies.push(new Enemy(
                    Math.random() * (GAME_WIDTH - 64),
                    Math.random() * (GAME_HEIGHT - 64),
                    Math.floor(Math.random() * 3)
                ));
            }, 2000);
        }
    });
}

// Loop principal do jogo
function gameLoop() {
    if (!gameRunning) return;

    // Limpar completamente o canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Garantir que o fundo seja completamente limpo
    ctx.globalCompositeOperation = 'source-over';

    // Desenhar cenário
    if (images['scenario_california_games.png']) {
        ctx.drawImage(images['scenario_california_games.png'], 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        // Fundo gradiente como fallback
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#F0E68C');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Processar entrada
    handleInput();

    // Atualizar jogador
    player.update();

    // Inimigos removidos temporariamente
    // enemies.forEach(enemy => enemy.update());

    // Verificar colisões
    // checkCollisions();

    // Desenhar jogador
    player.draw();

    // Inimigos removidos temporariamente
    // enemies.forEach(enemy => enemy.draw());

    // Continuar o loop
    requestAnimationFrame(gameLoop);
}

// Função para iniciar o jogo
function startGame() {
    // Criar jogador
    player = new Player(GAME_WIDTH / 2 - 32, GAME_HEIGHT / 2 - 32);

    // Inimigos removidos temporariamente
    enemies = [];

    gameRunning = true;
    gameLoop();
}

// Inicializar o jogo
loadImages();

