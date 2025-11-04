const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 200,
    INIMIGO_VELOCIDADE: 1.5,
};

// --- NOVAS CONSTANTES DE INIMIGOS (TEMPLATES) ---
const INIMIGO_TAMANHO_BASE = 40;
const INIMIGO_VELOCIDADE_BASE = CONFIG.INIMIGO_VELOCIDADE;
const INIMIGO_VIDA_BASE = 4; 

// Mapeamento de Tipos de Inimigos (Templates)
const TIPOS_INIMIGOS = {
    // Caranguejo Padrão
    NORMAL: {
        tipo: 'normal',
        tamanho: INIMIGO_TAMANHO_BASE,
        velocidade: INIMIGO_VELOCIDADE_BASE,
        vidaMaxima: INIMIGO_VIDA_BASE,
        pontuacao: 1, 
        scoreValue: 10, 
        spawnChance: 90,
        cor: '#8b4513' 
    },
    // Caranguejo Tanque (Roxo)
    TANQUE: {
        tipo: 'tanque',
        tamanho: INIMIGO_TAMANHO_BASE * 2,
        velocidade: INIMIGO_VELOCIDADE_BASE / 2,
        vidaMaxima: INIMIGO_VIDA_BASE * 4, // 9 hits
        pontuacao: 5, 
        scoreValue: 50,
        spawnChance: 10,
        cor: '#4b0082' // Roxo Escuro
    }
};

const tiposInimigoArray = Object.values(TIPOS_INIMIGOS);
// ----------------------------------------------------


// Controle de melhoria
let estaEmMelhoria = false; 
let inimigosDerrotadosDesdeMelhoria = 0; 
const LIMIAR_MELHORIA = 10; 

// Opções de melhorias
const CUSTO_MELHORIA = 5; 
const OPCOES_MELHORIA = [ 
    { nome: "Ataque Rápido", descricao: "Taxa de Tiro e Spawn", atributo: "CADENCIA_MOD", custo: CUSTO_MELHORIA },
    { nome: "Motor Potente", descricao: "Velocidade do Pato", atributo: "PATO_VELOCIDADE_MOD", custo: CUSTO_MELHORIA },
    { nome: "Semente Forte", descricao: "Velocidade do Projétil", atributo: "BALA_VELOCIDADE_MOD", custo: CUSTO_MELHORIA }
];

// ESTADO DO JOGO - Variáveis Mutáveis 
let pato_velocidade = CONFIG.PATO_VELOCIDADE_BASE; 
const pato_tamanho = 100; 
let balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE; 
let fire_rate = CONFIG.FIRE_RATE_BASE; 

// Variáveis de dificuldade
let spawn_rate_base = 2000;
let spawn_rate = 2000; // Será reduzido a cada upgrade de cadência
let tanque_chance_mod = 0; // Será aumentado a cada upgrade
let lastSpawnTime = 0;


// Objeto pato 
let pato = {
    x: canvas.width / 2 - pato_tamanho / 2,
    y: canvas.height / 2 - pato_tamanho / 2,
    vida: 5,
};

// Objeto Inimigos (Array)
let inimigos = []; 


// Variáveis de Estado de Jogo e Recompensas
let isGameOver = false; 
let peixesDeOuro = 0; 
let score = 0;

// Objeto Background
let background = {
    x: 0, y: 0, width: canvas.width, height: canvas.height + 50
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
    const sizeA = objA.size || pato_tamanho;
    const sizeB = objB.size || pato_tamanho;

    return objA.x < objB.x + sizeB &&
           objA.x + sizeA > objB.x &&
           objA.y < objB.y + sizeB &&
           objA.y + sizeA > objB.y;
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

// Função auxiliar para selecionar o template do inimigo (AGORA DINÂMICA)
function selecionaTipoInimigo() {
    const rand = Math.random() * 100;
    
    // Calcula a chance real do Tanque (base 10% + modificador, limitando a 70%)
    let chanceTanqueAtual = TIPOS_INIMIGOS.TANQUE.spawnChance + tanque_chance_mod;
    chanceTanqueAtual = Math.min(chanceTanqueAtual, 70); 
    
    
    if (rand < chanceTanqueAtual) {
        return TIPOS_INIMIGOS.TANQUE;
    } else {
        return TIPOS_INIMIGOS.NORMAL;
    }
}

// Função de Criação de Inimigo (Spawn)
function criaInimigo() {
    const template = selecionaTipoInimigo(); 
    
    let x, y;
    const padding = 60; 
    let side = Math.floor(Math.random() * 4); 

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -padding; break;
        case 1: x = Math.random() * canvas.width; y = canvas.height + padding; break;
        case 2: x = -padding; y = Math.random() * canvas.height; break;
        case 3: x = canvas.width + padding; y = Math.random() * canvas.height; break;
    }

    const novoInimigo = {
        x: x,
        y: y,
        tipo: template.tipo,
        size: template.tamanho, 
        velocidade: template.velocidade, 
        vida: template.vidaMaxima, 
        vidaMaxima: template.vidaMaxima, 
        pontuacao: template.pontuacao,
        scoreValue: template.scoreValue,
        cor: template.cor,
    };

    inimigos.push(novoInimigo);
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
    
    // Resetando variáveis de velocidade/frequência/dificuldade para BASE
    pato_velocidade = CONFIG.PATO_VELOCIDADE_BASE;
    fire_rate = CONFIG.FIRE_RATE_BASE;
    balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE;
    spawn_rate = spawn_rate_base; // RESET DE SPAWN RATE
    tanque_chance_mod = 0; // RESET DE CHANCE DO TANQUE

    inimigos = []; 
    balas = [];
    
    pato.x = canvas.width / 2 - pato_tamanho / 2;
    pato.y = canvas.height / 2 - pato_tamanho / 2;
}

// ADICIONADO: Função para Aplicar as Melhorias
function aplicarMelhoria(atributoMelhoria, custo) { 
    if (peixesDeOuro >= custo) {
        peixesDeOuro -= custo;
        
        // 1. AUMENTO MAIS AGRESSIVO DA CHANCE DO TANQUE
        tanque_chance_mod += 7; // Aumenta 7% a cada upgrade
        
        if (atributoMelhoria === "CADENCIA_MOD") {
            // Aumentar a cadência significa DIMINUIR o tempo (fire_rate)
            fire_rate = Math.max(50, fire_rate - 20); 
            
            // 2. REDUÇÃO MAIS AGRESSIVA DO TEMPO DE SPAWN
            spawn_rate = Math.max(500, spawn_rate - 100); // Reduz 100ms a cada upgrade de cadência
            
        } else if (atributoMelhoria === "PATO_VELOCIDADE_MOD") {
            pato_velocidade += 0.5;
            
        } else if (atributoMelhoria === "BALA_VELOCIDADE_MOD") {
            balas_velocidade += 1.0;
        }
        
        estaEmMelhoria = false; 
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
    
    // Mostra a dificuldade que virá
    const chanceTanqueAtual = Math.min(TIPOS_INIMIGOS.TANQUE.spawnChance + tanque_chance_mod, 70);
    const proximaChanceTanque = Math.min(chanceTanqueAtual + 4, 70);
    const proximoSpawnRate = Math.max(500, spawn_rate - 100);

    ctx.fillStyle = 'cyan';
    ctx.font = '18px Arial';
    ctx.fillText(`PRÓXIMA DIFICULDADE: Chance Tanque ~${proximaChanceTanque}% | Spawn Rate ~${proximoSpawnRate}ms`, 150, canvas.height - 100);
    
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

    // 4. Lógica de Spawn de Inimigos (Timer) - USANDO spawn_rate MUTÁVEL
    if (currentTime > lastSpawnTime + spawn_rate) {
        criaInimigo();
        lastSpawnTime = currentTime;
    }

    // 5. Lógica de Movimento e Colisão dos Inimigos
    for (let i = inimigos.length - 1; i >= 0; i--) {
        const inimigoObj = inimigos[i];

        // IA de Perseguição - USA inimigoObj.velocidade
        let dx_inimigo = pato.x - inimigoObj.x;
        let dy_inimigo = pato.y - inimigoObj.y;
        
        let magnitude = Math.sqrt(dx_inimigo * dx_inimigo + dy_inimigo * dy_inimigo);

        if (magnitude > 0) {
            let normalizedDx = dx_inimigo / magnitude;
            let normalizedDy = dy_inimigo / magnitude;

            inimigoObj.x += normalizedDx * inimigoObj.velocidade;
            inimigoObj.y += normalizedDy * inimigoObj.velocidade;
        }
        
        // Colisão (Tiro vs. Inimigo)
        for (let j = balas.length - 1; j >= 0; j--) {
            const bala = balas[j];
            
            if (checkCollision(bala, inimigoObj)) { 
                
                inimigoObj.vida -= 1;
                balas.splice(j, 1);
                
                if (inimigoObj.vida <= 0) {
                    peixesDeOuro += inimigoObj.pontuacao;
                    score += inimigoObj.scoreValue;
                    
                    inimigos.splice(i, 1);
                    
                    // Lógica do Gatilho de Melhoria
                    inimigosDerrotadosDesdeMelhoria++;
                    if (inimigosDerrotadosDesdeMelhoria >= LIMIAR_MELHORIA) {
                        inimigosDerrotadosDesdeMelhoria = 0; 
                        estaEmMelhoria = true; 
                    }
                    
                    break; 
                }
            }
        }

        // Colisão (Inimigo vs. Pato)
        if (checkCollision(inimigoObj, {x: pato.x, y: pato.y, size: pato_tamanho})) {
            
            pato.vida -= 1;
            inimigos.splice(i, 1); 

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
    if (estaEmMelhoria) { 
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
    
    // HUD DE DEBUG
    ctx.fillStyle = 'yellow';
    ctx.font = '16px Arial';
    const chanceTanqueAtual = Math.min(TIPOS_INIMIGOS.TANQUE.spawnChance + tanque_chance_mod, 70);

    ctx.fillText(`Spawn Rate: ${spawn_rate.toFixed(0)} ms`, 10, 80);
    ctx.fillText(`Chance Tanque: ${chanceTanqueAtual.toFixed(0)} %`, 10, 100);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
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
    inimigos.forEach(inimigoObj => { 
        ctx.fillStyle = inimigoObj.cor; 
        ctx.fillRect(inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
        
        // Desenha barra de vida
        if (inimigoObj.vidaMaxima > 1) { 
            const healthBarWidth = inimigoObj.size * (inimigoObj.vida / inimigoObj.vidaMaxima); 
            const maxBarWidth = inimigoObj.size;

            // Fundo da barra (preto)
            ctx.fillStyle = 'black';
            ctx.fillRect(inimigoObj.x, inimigoObj.y - 10, maxBarWidth, 5); 

            // Vida atual (verde)
            ctx.fillStyle = 'lime';
            ctx.fillRect(inimigoObj.x, inimigoObj.y - 10, healthBarWidth, 5); 
        }
    });
    
    // Desenha o HUD
    drawHUD();
}

// GAME LOOP
function gameLoop() {
    if (isGameOver) { 
        drawGameOverScreen(); 
    } else if (estaEmMelhoria) { 
        draw(); 
        desenharMenuMelhoria(); 
    } else if (patoLoaded && bgLoaded) { 
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
    requestAnimationFrame(gameLoop);
};