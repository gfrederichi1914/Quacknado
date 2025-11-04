const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 150,
    INIMIGO_VELOCIDADE: 1.5,
};

// Controle de melhoria
let estaEmMelhoria = false; 
let inimigosDerrotadosDesdeMelhoria = 0; 
const LIMIAR_MELHORIA = 10; 

// Opções de melhorias
const CUSTO_MELHORIA = 5; 
const OPCOES_MELHORIA = [ // 
    { nome: "Ataque Rápido", descricao: "Taxa de Tiro (Cadência)", atributo: "CADENCIA_MOD", custo: CUSTO_MELHORIA },
    { nome: "Motor Potente", descricao: "Velocidade do Pato", atributo: "PATO_VELOCIDADE_MOD", custo: CUSTO_MELHORIA },
    { nome: "Semente Forte", descricao: "Velocidade do Projétil", atributo: "BALA_VELOCIDADE_MOD", custo: CUSTO_MELHORIA }
];

// ESTADO DO JOGO - Variáveis Mutáveis 
let pato_velocidade = CONFIG.PATO_VELOCIDADE_BASE; 
const pato_tamanho = 100; 
let balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE; 
let fire_rate = CONFIG.FIRE_RATE_BASE; 

// Objeto pato 
let pato = {
    x: canvas.width / 2 - pato_tamanho / 2,
    y: canvas.height / 2 - pato_tamanho / 2,
    vida: 5,
};

// Objeto Inimigos
let inimigo = []; 
const inimigo_tamanho = 40;
const spawn_rate = 2000;
let lastSpawnTime = 0;

// Variáveis de Estado de Jogo e Recompensas
let isGameOver = false; 
let peixesDeOuro = 0; 
let score = 0;

// Objeto Background
let background = {
    x: 0,
    y: 0,
    width: canvas.width, 
    height: canvas.height + 50
};

// Objeto para rastrear teclas pressionadas
let keys = {
    w: false, a: false, s: false, d: false,
    up: false, left: false, down: false, right: false
};

// Constantes para o sistema de ataque
let balas = []; 
const balas_tamanho = 5; 
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

// FUNÇÃO DE DETECÇÃO DE COLISÃO (Box-to-Box)
function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.size &&
           objA.x + objA.size > objB.x &&
           objA.y < objB.y + objB.size &&
           objA.y + objA.size > objB.y;
}

// FUNÇÃO DE CRIAÇÃO DE PROJÉTIL
function criaBala(dirX, dirY) {
    const bala = {
        x: pato.x + pato_tamanho / 2 - balas_tamanho / 2, 
        y: pato.y + pato_tamanho / 2 - balas_tamanho / 2,
        dx: dirX, 
        dy: dirY, 
        velocidade: balas_velocidade, 
        size: balas_tamanho, 
    };
    balas.push(bala);
}

// Função de Criação de Inimigo (Spawn)
function criaCaranguejo() {
    let x, y;
    const padding = 60; 
    let side = Math.floor(Math.random() * 4); 

    switch (side) {
        case 0: 
            x = Math.random() * canvas.width;
            y = -padding;
            break;
        case 1: 
            x = Math.random() * canvas.width;
            y = canvas.height + padding;
            break;
        case 2: 
            x = -padding;
            y = Math.random() * canvas.height;
            break;
        case 3: 
            x = canvas.width + padding;
            y = Math.random() * canvas.height;
            break;
    }

    const caranguejo = {
        x: x,
        y: y,
        size: inimigo_tamanho, 
        velocidade: CONFIG.INIMIGO_VELOCIDADE, 
        vida: 3, 
    };

    inimigo.push(caranguejo);
}

// Função de Controle de Estado
function gameOver() {
    isGameOver = true;
    console.log("QUACKNADO: FIM DE JOGO - Game Over Acionado.");
}

// Função de Reinício (Reset total e forçado)
function resetGame() {
    isGameOver = false; 
    pato.vida = 5;
    peixesDeOuro = 0;
    score = 0;
    
    // Resetando variáveis de velocidade para BASE (Solução para aceleração)
    pato_velocidade = CONFIG.PATO_VELOCIDADE_BASE;
    fire_rate = CONFIG.FIRE_RATE_BASE;
    balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE;

    inimigo = [];
    balas = [];
    
    pato.x = canvas.width / 2 - pato_tamanho / 2;
    pato.y = canvas.height / 2 - pato_tamanho / 2;

    // Não chamamos requestAnimationFrame aqui, o gameLoop cuidará disso
}

// ADICIONADO: Função para Aplicar as Melhorias
function aplicarMelhoria(atributoMelhoria, custo) { // (em vez de applyUpgrade)
    if (peixesDeOuro >= custo) {
        peixesDeOuro -= custo;
        
        // Aplica a melhoria no atributo mutável (let)
        if (atributoMelhoria === "CADENCIA_MOD") {
            // Aumentar a cadência significa DIMINUIR o tempo (fire_rate)
            fire_rate = Math.max(50, fire_rate - 20); 
            
        } else if (atributoMelhoria === "PATO_VELOCIDADE_MOD") {
            pato_velocidade += 0.5;
            
        } else if (atributoMelhoria === "BALA_VELOCIDADE_MOD") {
            balas_velocidade += 1.0;
        }
        
        // Sai do menu e volta ao jogo
        estaEmMelhoria = false; // (em vez de isUpgrading)
    } 
}

// Função para Desenhar o Menu de Melhoria
function desenharMenuMelhoria() { 
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'yellow';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nível Atingido! Escolha Sua Melhoria', canvas.width / 2, 100);

    ctx.font = '24px Arial';
    ctx.fillText(`Ouro Atual: ${peixesDeOuro}`, canvas.width / 2, 150);

    ctx.textAlign = 'left';
    let inicioY = 250; 
    
    OPCOES_MELHORIA.forEach((opcao, indice) => { 
        ctx.fillStyle = (peixesDeOuro >= opcao.custo) ? 'lime' : 'red'; 
        
        ctx.font = '22px Arial';
        ctx.fillText(`[${indice + 1}] ${opcao.nome}`, 150, inicioY + indice * 60);
        
        ctx.font = '16px Arial';
        ctx.fillText(`Custo: ${opcao.custo} Ouro. Melhora: ${opcao.descricao}`, 150, inicioY + 25 + indice * 60);
    });
    
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText('Pressione o número correspondente para selecionar.', 150, canvas.height - 50);
}

// LÓGICA PRINCIPAL
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

    let fireLength = Math.sqrt(fireDx * fireDx + fireDy * fireDy); 
    
    const currentTime = Date.now();
    if (fireLength !== 0 && currentTime > lastFireTime + fire_rate) {
        
        fireDx /= fireLength;
        fireDy /= fireLength;
        
        criaBala(fireDx, fireDy);
        lastFireTime = currentTime;
    }

    // 3. Lógica de Movimento e Limpeza das Balas
    for (let i = balas.length - 1; i >= 0; i--) {
        const bala = balas[i];
        
        bala.x += bala.dx * bala.velocidade;
        bala.y += bala.dy * bala.velocidade;

        if (
            bala.x < 0 || 
            bala.x > canvas.width || 
            bala.y < 0 || 
            bala.y > canvas.height
        ) {
            balas.splice(i, 1); 
        }
    }

    // 4. Lógica de Spawn de Inimigos (Timer)
    if (currentTime > lastSpawnTime + spawn_rate) {
        criaCaranguejo();
        lastSpawnTime = currentTime;
    }

    // 5. Lógica de Movimento e Colisão dos Inimigos
    for (let i = inimigo.length - 1; i >= 0; i--) {
        const caranguejo = inimigo[i];

        // IA de Perseguição 
        let dx_inimigo = pato.x - caranguejo.x;
        let dy_inimigo = pato.y - caranguejo.y;
        
        let magnitude = Math.sqrt(dx_inimigo * dx_inimigo + dy_inimigo * dy_inimigo);

        if (magnitude > 0) {
            let normalizedDx = dx_inimigo / magnitude;
            let normalizedDy = dy_inimigo / magnitude;

            caranguejo.x += normalizedDx * caranguejo.velocidade;
            caranguejo.y += normalizedDy * caranguejo.velocidade;
        }
        
        // Colisão (Tiro vs. Inimigo)
        for (let j = balas.length - 1; j >= 0; j--) {
            const bala = balas[j];
            
            if (checkCollision(bala, caranguejo)) {
                
                caranguejo.vida -= 1;
                balas.splice(j, 1);
                
                if (caranguejo.vida <= 0) {
                    inimigo.splice(i, 1);
                    peixesDeOuro += 1;
                    score += 10;
                    
                    // Lógica do Gatilho de Melhoria
                    inimigosDerrotadosDesdeMelhoria++;
                    if (inimigosDerrotadosDesdeMelhoria >= LIMIAR_MELHORIA) {
                        inimigosDerrotadosDesdeMelhoria = 0; 
                        estaEmMelhoria = true; // PAUSA O JOGO
                    }
                    
                    break; 
                }
            }
        }

        // Colisão (Inimigo vs. Pato)
        if (checkCollision(caranguejo, {x: pato.x, y: pato.y, size: pato_tamanho})) {
            
            pato.vida -= 1;
            inimigo.splice(i, 1); 

            if (pato.vida <= 0) {
                gameOver(); 
                return; 
            }
        }
    }
}

// CONTROLE DE ENTRADA (Listeners)
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Controle de Reinício
    if (isGameOver && e.key === ' ') { 
        resetGame();
    }

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

    // Lógica de Seleção de Melhoria
    if (estaEmMelhoria) { // Verifica se o jogo está em pausa
        const indiceSelecionado = parseInt(e.key) - 1; 
        
        if (indiceSelecionado >= 0 && indiceSelecionado < OPCOES_MELHORIA.length) {
            const opcaoSelecionada = OPCOES_MELHORIA[indiceSelecionado];
            aplicarMelhoria(opcaoSelecionada.atributo, opcaoSelecionada.custo);
        }
        return; 
    }
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


// Função Tela Game Over
function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QUACKNADO: FIM DE JOGO', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Score Final: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Pressione ESPAÇO para Recomeçar', canvas.width / 2, canvas.height / 2 + 80);
}

// Função para Desenhar o HUD 
function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Vida: ${pato.vida}`, 10, 25); 
    ctx.fillText(`Ouro: ${peixesDeOuro}`, 10, 50);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, canvas.width - 10, 25);
}

// RENDERIZAÇÃO
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha Background
    if (bgLoaded) {
        ctx.drawImage(bgImg, 0, 0, background.width, background.height);
    }

    // Desenha o Pato
    if (patoLoaded) {
        ctx.drawImage(patoImg, pato.x, pato.y, pato_tamanho, pato_tamanho);
    } else {
        ctx.fillStyle = '#ef4444'; 
        ctx.fillRect(pato.x, pato.y, pato_tamanho, pato_tamanho);
    }
    
    // Desenha os Projéteis (Grãos de Semente)
    ctx.fillStyle = '#fef3c7'; 
    balas.forEach(bala => {
        ctx.beginPath();
        ctx.arc(bala.x + bala.size / 2, bala.y + bala.size / 2, bala.size / 2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.closePath();
    });

    // Desenha os Inimigos 
    inimigo.forEach(caranguejo => {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(caranguejo.x, caranguejo.y, caranguejo.size, caranguejo.size);
        
        // Desenha barra de vida
        ctx.fillStyle = 'lime';
        const healthBarWidth = caranguejo.size * (caranguejo.vida / 3); 
        ctx.fillRect(caranguejo.x, caranguejo.y - 10, healthBarWidth, 5); 
    });
    
    // Desenha o HUD
    drawHUD();
}

// GAME LOOP
function gameLoop() {
    if (isGameOver) { 
        drawGameOverScreen(); 
    } else if (estaEmMelhoria) { // ADICIONADO: Estado de Pausa/Melhoria
        // Se estiver melhorando, desenha o cenário estático e o menu por cima.
        draw(); 
        desenharMenuMelhoria(); 
    } else if (patoLoaded && bgLoaded) { // Estado normal de Jogo Rodando
        update();
        draw();
    } else {
        // Estado de Carregamento de Assets
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Carregando...', canvas.width / 2, canvas.height / 2);
    }
    requestAnimationFrame(gameLoop);
}

// Inicia o loop
window.onload = () => {
    // Inicia o loop para que ele possa carregar os assets
    requestAnimationFrame(gameLoop);
};