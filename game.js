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
    'public/image/capivara.png', // sprite da capivara
    'public/image/elephant.png' // sprite do elefante
];

let imagesLoaded = 0;

// Função para carregar imagens
function loadImages() {
    imageFiles.forEach(filename => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            console.log(`Imagem carregada: ${filename}`);
            if (imagesLoaded === imageFiles.length && !gameInitialized) {
                gameInitialized = true;
                startGame();
            }
        };
        img.onerror = () => {
            console.error(`Erro ao carregar imagem: ${filename}`);
            imagesLoaded++;
            if (imagesLoaded === imageFiles.length && !gameInitialized) {
                gameInitialized = true;
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
        // Ajustar tamanho para sprite pequeno do elefante
        this.width = 48;  // tamanho menor para sprite pequeno
        this.height = 48;
        this.speed = 2 + Math.random() * 3;
        this.type = type; // 0: elefante
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
        // Sprite sheet 8x2 - cálculo manual preciso das posições dos frames
        if (images['public/image/elephant.png']) {
            const img = images['public/image/elephant.png'];
            
            // Calcular posições exatas de cada frame manualmente
            const totalWidth = img.width;
            const totalHeight = img.height;
            const frameWidth = totalWidth / 8;
            const frameHeight = totalHeight / 2;
            
            // Mapear as posições exatas dos frames do meio (2, 3, 4, 5)
            const framePositions = {
                2: { x: frameWidth * 2, y: 0 },  // terceiro frame
                3: { x: frameWidth * 3, y: 0 },  // quarto frame
                4: { x: frameWidth * 4, y: 0 },  // quinto frame
                5: { x: frameWidth * 5, y: 0 }   // sexto frame
            };
            
            // Escolher frame baseado na animação
            const middleFrames = [2, 3, 4, 5];
            const currentFrameIndex = middleFrames[this.spriteFrame % middleFrames.length];
            const framePos = framePositions[currentFrameIndex];
            
            // Usar posições exatas sem arredondamento
            const spriteX = framePos.x;
            const spriteY = framePos.y;
            
            // Salvar contexto para espelhamento
            ctx.save();
            
            // Se está se movendo para a esquerda, espelhar
            if (this.direction < 0) {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    img,
                    spriteX, spriteY, frameWidth, frameHeight,
                    -(this.x + this.width), this.y, this.width, this.height
                );
            } else {
                // Movimento normal (direita)
                ctx.drawImage(
                    img,
                    spriteX, spriteY, frameWidth, frameHeight,
                    this.x, this.y, this.width, this.height
                );
            }
            
            // Restaurar contexto
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = '#4682B4';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Variáveis do jogo
let player;
let enemies = [];
let keys = {};
let gameRunning = false;
let gameInitialized = false; // Nova variável para controlar inicialização

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
            
            // Adicionar novo elefante após colisão
            setTimeout(() => {
                enemies.push(new Enemy(
                    Math.random() * (GAME_WIDTH - 48), // ajustar para o novo tamanho menor
                    Math.random() * (GAME_HEIGHT - 48),
                    0 // sempre criar elefante (tipo 0)
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

    // Atualizar inimigos
    enemies.forEach(enemy => enemy.update());

    // Verificar colisões
    checkCollisions();

    // Desenhar jogador
    player.draw();

    // Desenhar inimigos
    enemies.forEach(enemy => enemy.draw());

    // Continuar o loop
    requestAnimationFrame(gameLoop);
}

// Função para iniciar o jogo
function startGame() {
    // Evitar múltiplas inicializações
    if (gameRunning) return;
    
    console.log('Iniciando jogo...');
    
    // Criar jogador
    player = new Player(GAME_WIDTH / 2 - 32, GAME_HEIGHT / 2 - 32);

    // Limpar completamente e criar o primeiro adversário: Elefante
    enemies.length = 0; // Limpar array completamente
    console.log('Array de inimigos limpo. Criando apenas 1 elefante...');
    enemies.push(new Enemy(
        Math.random() * (GAME_WIDTH - 48), // ajustar para o novo tamanho menor
        Math.random() * (GAME_HEIGHT - 48),
        0 // tipo 0 para o elefante
    ));
    console.log('Total de inimigos criados:', enemies.length);

    gameRunning = true;
    gameLoop();
}

// Inicializar o jogo
loadImages();

