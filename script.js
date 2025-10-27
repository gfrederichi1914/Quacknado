const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Estado do Jogo 
const pato_velocidade = 3.5;
const pato_tamanho = 100; 

// Objeto pato 
let pato = {
    // Centraliza o pato
    x: canvas.width / 2 - pato_tamanho / 2,
    y: canvas.height / 2 - pato_tamanho / 2,
};

// Objeto Background
let background = {
    x: 0,
    y: 0,
    width: canvas.width, 
    height: canvas.height + 50
};

// Objeto para rastrear teclas pressionadas
let keys = {
    // Movimento
    w: false, a: false, s: false, d: false,
    // Tiro
    up: false, left: false, down: false, right: false
};

// Constantes para o sistema de ataque
let balas = []; // Array que guarda os grãos
const balas_velocidade = 7;
const balas_tamanho = 5; // Tamanho dos projéteis (Grãos de Semente)

// Timer para o tiro
const fire_rate = 150; // Usei 150ms como no seu relato, é mais responsivo para "Survivor"
let lastFireTime = 0;

// Carregamento do sprite do pato 
let patoImg = new Image();
patoImg.src = "assets/pato_atirador_2.png";
let patoLoaded = false;
patoImg.onload = () => { patoLoaded = true; };

// 2. Cenário
let bgImg = new Image();
bgImg.src = "assets/cenario.png"; 
let bgLoaded = false;
bgImg.onload = () => { bgLoaded = true; };

// CONTROLE DE ENTRADA (CORRIGIDO: O e.key é 'ArrowUp', 'ArrowLeft', etc. e não 'arrowup')
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    // Movimento
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;

    // Tiro
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowLeft') keys.left = true; 
    if (e.key === 'ArrowDown') keys.down = true; 
    if (e.key === 'ArrowRight') keys.right = true; 
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    // Movimento 
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;

    // Tiro
    if (e.key === 'ArrowUp') keys.up = false; 
    if (e.key === 'ArrowLeft') keys.left = false; 
    if (e.key === 'ArrowDown') keys.down = false; 
    if (e.key === 'ArrowRight') keys.right = false; 
});

// FUNÇÃO DE CRIAÇÃO DE PROJÉTIL (AGORA FUNCIONAL)
function criaBala(dirX, dirY) {
    const bala = {
        // Posição inicial (centro do pato)
        x: pato.x + pato_tamanho / 2 - balas_tamanho / 2, 
        y: pato.y + pato_tamanho / 2 - balas_tamanho / 2,
        dx: dirX, // Direção X do tiro (NORMALIZADA)
        dy: dirY, // Direção Y do tiro (NORMALIZADA)
        speed: balas_velocidade,
        size: balas_tamanho,
    };
    // Adiciona a bala ao array global
    balas.push(bala);
}

// LÓGICA
function update() {
    let dx = 0;
    let dy = 0;

    // 1. Lógica de Movimento do Pato (WASD)
    if (keys.w) dy -= 1;
    if (keys.a) dx -= 1;
    if (keys.s) dy += 1;
    if (keys.d) dx += 1;

    let length = Math.sqrt(dx * dx + dy * dy);
    if (length !== 0) {
        dx /= length;
        dy /= length;
    }

    pato.x += dx * pato_velocidade;
    pato.y += dy * pato_velocidade;

    pato.x = Math.max(0, Math.min(canvas.width - pato_tamanho, pato.x));
    pato.y = Math.max(0, Math.min(canvas.height - pato_tamanho, pato.y));

    // 2. Lógica de Tiro (Setas)
    let fireDx = 0;
    let fireDy = 0;

    if (keys.up) fireDy -= 1; 
    if (keys.down) fireDy += 1; 
    if (keys.left) fireDx -= 1; 
    if (keys.right) fireDx += 1; 

    // Normalização do vetor de tiro
    let fireLength = Math.sqrt(fireDx * fireDx + fireDy * fireDy); 
    
    // Verifica se alguma seta está pressionada E se o fire rate permite atirar
    const currentTime = Date.now();
    if (fireLength !== 0 && currentTime > lastFireTime + fire_rate) {
        
        // Normaliza a direção do tiro
        fireDx /= fireLength;
        fireDy /= fireLength;
        
        // Dispara o projétil usando a função corrigida
        criaBala(fireDx, fireDy);
        lastFireTime = currentTime;
    }

    // 3. Lógica de Movimento e Limpeza das Balas (Otimização de memória)
    for (let i = balas.length - 1; i >= 0; i--) {
        const bala = balas[i];
        
        // Move o projétil
        bala.x += bala.dx * bala.speed;
        bala.y += bala.dy * bala.speed;

        // Verifica se o projétil saiu dos limites do canvas para removê-lo
        if (
            bala.x < 0 || 
            bala.x > canvas.width || 
            bala.y < 0 || 
            bala.y > canvas.height
        ) {
            balas.splice(i, 1); // Remove o projétil do array
        }
    }
}

// RENDERIZAÇÃO
function draw() {
    // Limpa cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha Background
    if (bgLoaded) {
        ctx.drawImage(bgImg, 0, 0, background.width, background.height);
    }

    // Desenha o Pato
    if (patoLoaded) {
        ctx.drawImage(patoImg, pato.x, pato.y, pato_tamanho, pato_tamanho);
    } else {
        ctx.fillStyle = '#ef4444'; // Placeholder
        ctx.fillRect(pato.x, pato.y, pato_tamanho, pato_tamanho);
    }
    
    // Desenha os Projéteis (Grãos de Semente)
    ctx.fillStyle = '#fef3c7'; // Cor de grão (amarelo claro/bege)
    balas.forEach(bala => {
        ctx.beginPath();
        // Desenha um círculo para representar o grão (mais fiel ao projétil do Bullet Heaven)
        ctx.arc(bala.x + bala.size / 2, bala.y + bala.size / 2, bala.size / 2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.closePath();
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
window.onload = gameLoop;