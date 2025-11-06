const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 200,
    INIMIGO_VELOCIDADE: 1,
};

// --- NOVAS CONSTANTES DE INIMIGOS (TEMPLATES) COM REFERÊNCIA A SPRITES ---
const INIMIGO_TAMANHO_BASE = 80;
const INIMIGO_VELOCIDADE_BASE = CONFIG.INIMIGO_VELOCIDADE;
const INIMIGO_VIDA_BASE = 5; 

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
        cor: '#8b4513',
        sprite: 'caranguejo', // Chave única para o Caranguejo
    },
    // Polvo Tanque 
    TANQUE: {
        tipo: 'tanque',
        tamanho: INIMIGO_TAMANHO_BASE * 2.2,
        velocidade: INIMIGO_VELOCIDADE_BASE / 2.2,
        vidaMaxima: INIMIGO_VIDA_BASE * 3.9,
        pontuacao: 5, 
        scoreValue: 50,
        spawnChance: 10,
        cor: '#4b0082',
        sprite: 'polvo', // Chave única para o Polvo
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
const pato_tamanho = 80; 
let balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE; 
let fire_rate = CONFIG.FIRE_RATE_BASE; 

// Variáveis de dificuldade
let spawn_rate_base = 2000;
let spawn_rate = 2000; 
let tanque_chance_mod = 0; 
let lastSpawnTime = 0;


// Objeto pato 
let pato = {
    x: canvas.width / 2 - pato_tamanho / 2,
    y: canvas.height / 2 - pato_tamanho / 2,
    vida: 5,
    orientacao: 'down',
    estaMachucado: false, 
    tempoInvencibilidade: 0, 
};

const TEMPO_PISCAR = 500;
const INTERVALO_PISCAR = 50;

// Objeto Inimigos (Array)
let inimigos = []; 


// Variáveis de Estado de Jogo e Recompensas
let isGameOver = false; 
let peixesDeOuro = 0; 
let score = 0;

// --- Carregamento de Assets ---

// Coração
let heartImg = new Image();
heartImg.src = "assets/heart.png";
let heartLoaded = false;
heartImg.onload = () => { heartLoaded = true; };

// Background
let bgImg = new Image();
bgImg.src = "assets/cenario.png"; 
let bgLoaded = false;
bgImg.onload = () => { bgLoaded = true; };

// Pato
let spritesPato = {
    'up': new Image(), 'down': new Image(), 'left': new Image(), 'right': new Image(),
};

spritesPato.up.src = "assets/pato_up.png"; 
spritesPato.down.src = "assets/pato_down.png"; 
spritesPato.left.src = "assets/pato_left.png";
spritesPato.right.src = "assets/pato_right.png";

let patoLoaded = false;
let loadedCount = 0;
const totalSprites = Object.keys(spritesPato).length;

for (const key in spritesPato) {
    spritesPato[key].onload = () => {
        loadedCount++;
        if (loadedCount === totalSprites) {
            patoLoaded = true;
        }
    };
}

// NOVO: Carregamento dos Sprites dos Inimigos (Caranguejo e Polvo)
let spritesInimigo = {};
let inimigoSpritesLoaded = false;

// NOVO: Imagem da Tela de Game Over
let gameOverImg = new Image();
gameOverImg.src = "assets/game_over.png";
let gameOverLoaded = false;
gameOverImg.onload = () => { gameOverLoaded = true; };

// NOVO: Imagem da Tela de Upgrade
let upgradeMenuImg = new Image();
upgradeMenuImg.src = "assets/upgrade_menu.png";
let upgradeMenuLoaded = false;
upgradeMenuImg.onload = () => { upgradeMenuLoaded = true; };

// CORRIGIDO: Tipos e Direções com base nos nomes dos arquivos fornecidos
const inimigoTypes = ['caranguejo', 'polvo'];
const inimigoDirections = ['left', 'right'];
let loadedInimigoCount = 0;
const totalInimigoSprites = inimigoTypes.length * inimigoDirections.length;

for (const type of inimigoTypes) {
    spritesInimigo[type] = {};
    for (const direction of inimigoDirections) {
        const img = new Image();
        // CORRIGIDO: Usa o nome do arquivo, ex: assets/polvo_right.png
        img.src = `assets/${type}_${direction}.png`; 
        img.onload = () => {
            loadedInimigoCount++;
            if (loadedInimigoCount === totalInimigoSprites) {
                inimigoSpritesLoaded = true;
            }
        };
        spritesInimigo[type][direction] = img;
    }
}


// Objeto para rastrear teclas pressionadas
let keys = {
    w: false, a: false, s: false, d: false,
    up: false, left: false, down: false, right: false
};

// Constantes para o sistema de ataque
let balas = []; 
const balas_tamanho = 5; 
let lastFireTime = 0;

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

// Função auxiliar para selecionar o template do inimigo
function selecionaTipoInimigo() {
    const rand = Math.random() * 100;
    
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
        orientacao: 'right', // NOVO: Orientação inicial
        spriteKey: template.sprite // NOVO: Chave para buscar o sprite (ex: 'caranguejo' ou 'polvo')
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
    pato.orientacao = 'down'; // RESET DE ORIENTAÇÃO
    pato.estaMachucado = false; 
    pato.tempoInvencibilidade = 0;
    
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

// Função para Desenhar o Menu de Melhoria - USANDO IMAGEM
// Função para Desenhar o Menu de Melhoria - COM FUNDO E FONTE PIXEL
function desenharMenuMelhoria() { 
    
    // NOVO: 1. Desenha o FUNDO PRETO SEMI-TRANSPARENTE (Prioritário)
    // Isso garante que todo o jogo fique escuro, independentemente da imagem de fundo do menu.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // 0.7 de opacidade
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    // 2. Desenha a IMAGEM DE FUNDO (por cima do fundo preto)
    if (upgradeMenuLoaded) {
        // Desenha a imagem ocupando todo o canvas (800x600)
        ctx.drawImage(upgradeMenuImg, 0, 0, canvas.width, canvas.height);
    } 
    // Nota: O fallback (fundo preto) não é mais necessário aqui, pois já desenhamos ele na linha 4.

    // --- COORDENADAS PARA POSICIONAMENTO DO TEXTO ---
    const TEXT_START_Y = 150; 
    const OPTIONS_START_Y = 250;
    

    // 4. Ouro Atual (MODIFICADO: Fonte Pixelada)
    ctx.fillStyle = 'white';
    ctx.font = '35px Pixel'; // Aplicando a fonte pixelada!
    ctx.fillText(`Ouro Atual: ${peixesDeOuro}`, canvas.width - 100, TEXT_START_Y + 50);

    ctx.textAlign = 'left';
    let inicioY = OPTIONS_START_Y; 
    
   
}

// LÓGICA PRINCIPAL
function update() {
    let dx = 0;
    let dy = 0;
    const currentTime = Date.now();

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
    
    // Atualiza a Orientação se uma Seta estiver Pressionada
    if (fireLength !== 0) {
        if (Math.abs(fireDx) > Math.abs(fireDy)) {
            pato.orientacao = (fireDx > 0) ? 'right' : 'left';
        } else {
            pato.orientacao = (fireDy > 0) ? 'down' : 'up';
        }
        
        // Lógica de tiro
        if (currentTime > lastFireTime + fire_rate) {
            
            fireDx /= fireLength;
            fireDy /= fireLength;
            
            criaBala(fireDx, fireDy);
            lastFireTime = currentTime;
        }
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
        criaInimigo();
        lastSpawnTime = currentTime;
    }

    // 5. Lógica de Movimento e Colisão dos Inimigos
    for (let i = inimigos.length - 1; i >= 0; i--) {
        const inimigoObj = inimigos[i];

        // IA de Perseguição - USA inimigoObj.velocidade
        let dx_inimigo = pato.x - inimigoObj.x;
        let dy_inimigo = pato.y - inimigoObj.y;
        
        // NOVO: Atualiza a orientação do sprite do inimigo
        if (dx_inimigo > 0) {
            inimigoObj.orientacao = 'right';
        } else if (dx_inimigo < 0) {
            inimigoObj.orientacao = 'left';
        }

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
            
            // Verifica se o pato JÁ está machucado/invencível
            if (!pato.estaMachucado) {
                pato.vida -= 1;
                
                // Ativa o estado de machucado/invencibilidade
                pato.estaMachucado = true;
                pato.tempoInvencibilidade = currentTime + TEMPO_PISCAR;
            }

            // Remove o inimigo sempre que a colisão acontecer
            inimigos.splice(i, 1); 

            if (pato.vida <= 0) {
                gameOver(); 
                return; 
            }
        }
    }
    
    // NOVO: Lógica para desativar o estado machucado e gerenciar o tempo
    if (pato.estaMachucado && currentTime > pato.tempoInvencibilidade) {
        pato.estaMachucado = false;
    }
}

// CONTROLE DE ENTRADA (Listeners)
document.addEventListener('keydown', (e) => {
    // PADRONIZA A CHAVE (Key) PARA MINÚSCULAS para facilitar a comparação
    const key = e.key.toLowerCase();
    
    // -----------------------------------------------------------
    // TRATAMENTO PRIORITÁRIO DO MENU DE MELHORIA
    // -----------------------------------------------------------
    if (estaEmMelhoria) {
        // e.key retorna '1', '2', '3', etc. (parseInt funciona)
        const indiceSelecionado = parseInt(e.key) - 1; 
        
        if (indiceSelecionado >= 0 && indiceSelecionado < OPCOES_MELHORIA.length) {
            const opcaoSelecionada = OPCOES_MELHORIA[indiceSelecionado];
            
            // Tenta aplicar a melhoria
            aplicarMelhoria(opcaoSelecionada.atributo, opcaoSelecionada.custo);
        }
        // Enquanto estiver em melhoria, consuma o evento
        return; 
    }
    // -----------------------------------------------------------


    // Controle de Reinício
    if (isGameOver && key === ' ') { // Use 'key' (espaço em minúsculo é ' ')
        resetGame();
    }

    // Movimento
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;

    // Tiro (AGORA USANDO 'key' E OS NOMES MINÚSCULOS)
    if (key === 'arrowup') keys.up = true;
    if (key === 'arrowleft') keys.left = true; 
    if (key === 'arrowdown') keys.down = true; 
    if (key === 'arrowright') keys.right = true; 
});

// E, para garantir, o keyup também deve usar a mesma padronização:
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    
    // Movimento 
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;

    // Tiro (AGORA USANDO 'key' E OS NOMES MINÚSCULOS)
    if (key === 'arrowup') keys.up = false; 
    if (key === 'arrowleft') keys.left = false; 
    if (key === 'arrowdown') keys.down = false; 
    if (key === 'arrowright') keys.right = false; 
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
// Função Tela Game Over - MODIFICADA
function drawGameOverScreen() {
    
    // 1. Desenha o fundo da tela de Game Over
    if (gameOverLoaded) {
        // Desenha a imagem de Game Over ocupando todo o canvas
        ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Usa o fundo preto semi-transparente tradicional se a imagem não carregar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QUACKNADO: FIM DE JOGO', canvas.width / 2, canvas.height / 2 - 100);
    }
    
    // 2. Desenha o Score e a Mensagem de Reinício
    ctx.textAlign = 'center';
    
    // Usa fonte pixelada para o Score (assumindo que 'Pixel' está carregada via CSS)
    ctx.fillStyle = 'yellow'; // Cor de destaque
    ctx.font = '36px Pixel'; 
    ctx.fillText(`Score Final: ${score}`, canvas.width / 2, 160);
    
    // Mensagem de Reinício
    ctx.fillStyle = 'white';
    ctx.font = '24px Pixel'; 
    ctx.fillText('Pressione ESPACO para Recomecar', canvas.width / 2, canvas.height );
}

// Função para Desenhar o HUD 
function drawHUD() {
    // PADRÃO: Fonte Padrão para itens não-pixel
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    // --- Lógica de Desenho dos Corações ---
    const HEART_SIZE = 30;
    const START_X = 10;
    const START_Y = 10;
    const SPACING = 5;

    if (heartLoaded) {
        for (let i = 0; i < pato.vida; i++) {
            const x = START_X + i * (HEART_SIZE + SPACING);
            ctx.drawImage(heartImg, x, START_Y, HEART_SIZE, HEART_SIZE);
        }
        
        // MODIFICADO: Aplica a fonte pixel para o Ouro e o Score
        ctx.font = '40px Pixel'; // Usando 'Pixel' e um tamanho maior para destaque
        
        // POSICIONAMENTO DO OURO: Abaixado um pouco (agora 10px abaixo dos corações)
        ctx.fillText(`Ouro: ${peixesDeOuro}`, 15, START_Y + HEART_SIZE + 30); 

    } else {
        // Fallback (se o coração não carregar)
        ctx.fillText(`Vida: ${pato.vida}`, 10, 40); 
        ctx.fillText(`Ouro: ${peixesDeOuro}`, 10, 65);
    }
    // ----------------------------------------
    
    
    // REMOVIDO: HUD DE DEBUG (Spawn Rate e Chance Tanque)
    // As linhas do HUD de DEBUG foram excluídas, pois você quer removê-las.
    
    
    // SCORE (NOVA FONTE)
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = '40px Pixel'; // Aplicando a fonte pixel
    ctx.fillText(`Score: ${score}`, canvas.width - 15, 40);
}

// RENDERIZAÇÃO
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha Background
    if (bgLoaded) {
        // CORRIGIDO: Usa canvas.width e canvas.height no lugar de background.width/height
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height + 51); 
    }

    // Desenha o Pato (Lógica de Piscar)
    if (patoLoaded) {
        let deveDesenhar = true;
    
        // Lógica do piscar
        if (pato.estaMachucado) {
            if ((Date.now() % (2 * INTERVALO_PISCAR)) < INTERVALO_PISCAR) {
                deveDesenhar = false; 
            }
        }
        
        if (deveDesenhar) {
            const spriteAtual = spritesPato[pato.orientacao] || spritesPato.down; 
            ctx.drawImage(spriteAtual, pato.x, pato.y, pato_tamanho, pato_tamanho);
        }
        
    } else {
        // Fallback: Quadrado vermelho 
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
        
        // NOVO: Tenta desenhar o sprite
        if (inimigoSpritesLoaded) {
            const spriteKey = inimigoObj.spriteKey; // Ex: 'caranguejo' ou 'polvo'
            const orientacao = inimigoObj.orientacao; // 'left' ou 'right'
            
            // Busca a imagem correta no mapa
            const spriteAtual = spritesInimigo[spriteKey][orientacao];
            
            if (spriteAtual) {
                ctx.drawImage(spriteAtual, inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
            } else {
                // Fallback: Desenha o quadrado colorido se o sprite não for encontrado
                ctx.fillStyle = inimigoObj.cor; 
                ctx.fillRect(inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
            }
        } else {
            // Fallback: Desenha o quadrado colorido enquanto carrega
            ctx.fillStyle = inimigoObj.cor; 
            ctx.fillRect(inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
        }
        
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
    // 1. ESTADO: FIM DE JOGO
    if (isGameOver) { 
        drawGameOverScreen(); 
    } 
    // 2. ESTADO: PAUSA PARA MELHORIA (UPGRADE)
    else if (estaEmMelhoria) { 
        // Apenas desenha o cenário atual (draw) e o menu por cima (desenharMenuMelhoria)
        draw(); 
        desenharMenuMelhoria(); 
    } 
    // 3. ESTADO: JOGO RODANDO (Verifica se todos os assets carregaram)
    else if (patoLoaded && bgLoaded && heartLoaded && inimigoSpritesLoaded && gameOverLoaded && upgradeMenuLoaded) { 
        update();
        draw();
    } 
    // 4. ESTADO: CARREGAMENTO
    else { 
        // Mostra a tela de carregamento enquanto os assets não estão prontos
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Carregando Assets do Quacknado...', canvas.width / 2, canvas.height / 2);
    }
    
    // Continua chamando o loop
    requestAnimationFrame(gameLoop);
}

// Inicia o loop
window.onload = () => {
    requestAnimationFrame(gameLoop);
};

// Inicia o loop
window.onload = () => {
    requestAnimationFrame(gameLoop);
};