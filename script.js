// CONFIGURAÇÃO E CONSTANTES INICIAIS -----------------------------------------------------------------------------------------
// Define o ambiente do jogo e parâmetros iniciais


// Inicializa o canvas e obtém o contexto
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Define as velocidades bases e a taxa de tiro (variáveis fixas)
const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 200,
    INIMIGO_VELOCIDADE: 1, // está aqui pq é um parâmetro global que rege o movimento do sistema
};

//Atributos base para definição de inimigos
const INIMIGO_TAMANHO_BASE = 80;
const INIMIGO_VELOCIDADE_BASE = CONFIG.INIMIGO_VELOCIDADE;
const INIMIGO_VIDA_BASE = 5; 

// Mapeamento de Tipos de Inimigos 
const TIPOS_INIMIGOS = {
    // Caranguejo
    NORMAL: {
        tipo: 'normal',
        tamanho: INIMIGO_TAMANHO_BASE,
        velocidade: INIMIGO_VELOCIDADE_BASE,
        vidaMaxima: INIMIGO_VIDA_BASE,
        pontuacao: 1, 
        scoreValue: 10, 
        spawnChance: 90,
        cor: '#8b4513',
        sprite: 'caranguejo', 
    },
    // Polvo 
    TANQUE: {
        tipo: 'tanque',
        tamanho: INIMIGO_TAMANHO_BASE * 2.2,
        velocidade: INIMIGO_VELOCIDADE_BASE / 2.2,
        vidaMaxima: INIMIGO_VIDA_BASE * 3.9,
        pontuacao: 5, 
        scoreValue: 50,
        spawnChance: 10,
        cor: '#4b0082',
        sprite: 'polvo',
    }
};


// VARIÁVEIS DE ESTADO GLOBAL -------------------------------------------------------------------------------------------------
// Define variáveis que controlam o estado atual do jogo

// Controle de melhoria
let estaEmMelhoria = false; // boolean que pausa o jogo quando o menu de upgrade é ativado
let inimigosDerrotadosDesdeMelhoria = 0; // contador para ativar upgrade quando =LIMIAR_MELHORIA
const LIMIAR_MELHORIA = 10; 

// Opções de melhorias
const CUSTO_MELHORIA = 5; 
const OPCOES_MELHORIA = [ 
    { nome: "Ataque Rápido", descricao: "Taxa de Tiro e Spawn", atributo: "CADENCIA_MOD", custo: CUSTO_MELHORIA },
    { nome: "Motor Potente", descricao: "Velocidade do Pato", atributo: "PATO_VELOCIDADE_MOD", custo: CUSTO_MELHORIA },
    { nome: "Semente Forte", descricao: "Velocidade do Projétil", atributo: "BALA_VELOCIDADE_MOD", custo: CUSTO_MELHORIA }
];

// Estatísticas do pato
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

// Constante piscar na invencibilidade
const TEMPO_PISCAR = 500;
const INTERVALO_PISCAR = 50;

// Objeto Inimigos 
let inimigos = []; 

// Variáveis de Estado de Jogo e Recompensas
let isGameOver = false; 
let peixesDeOuro = 0; 
let score = 0;

// CARREGAMENTO DE ASSETS -----------------------------------------------------------------------------------------------------
// Carrega todos os sprites e cria flags booleanas para indicaer se a imagem está carregada

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

// Carregamento dos Sprites dos Inimigos 
let spritesInimigo = {};
let inimigoSpritesLoaded = false;

// Imagem da Tela de Game Over
let gameOverImg = new Image();
gameOverImg.src = "assets/game_over.png";
let gameOverLoaded = false;
gameOverImg.onload = () => { gameOverLoaded = true; };

// Imagem da Tela de Upgrade
let upgradeMenuImg = new Image();
upgradeMenuImg.src = "assets/upgrade_menu.png";
let upgradeMenuLoaded = false;
upgradeMenuImg.onload = () => { upgradeMenuLoaded = true; };

// Tipos e Direções 
const inimigoTypes = ['caranguejo', 'polvo'];
const inimigoDirections = ['left', 'right'];
let loadedInimigoCount = 0;
const totalInimigoSprites = inimigoTypes.length * inimigoDirections.length;

for (const type of inimigoTypes) {
    spritesInimigo[type] = {};
    for (const direction of inimigoDirections) {
        const img = new Image();
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

// FUNÇÕES DE LÓGICA -------------------------------------------------------------------------------------------------------------
// Executam ações centrais

// Função de detecção de colisão
function checkCollision(objA, objB) {
    const sizeA = objA.size || pato_tamanho;
    const sizeB = objB.size || pato_tamanho;

    return objA.x < objB.x + sizeB &&
           objA.x + sizeA > objB.x &&
           objA.y < objB.y + sizeB &&
           objA.y + sizeA > objB.y;
}

// Função de criação de projétil com base na direção de tiro
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

// Função que decide qual inimigo será criado   
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

// Função de Criação de Inimigo 
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
        orientacao: 'right', 
        spriteKey: template.sprite 
    };

    inimigos.push(novoInimigo);
}


// Função de Controle de Estado
function gameOver() {
    isGameOver = true;
}

// Função de Reinício
function resetGame() {
    isGameOver = false; 
    pato.vida = 5;
    peixesDeOuro = 0;
    score = 0;

    inimigosDerrotadosDesdeMelhoria = 0; 
    estaEmMelhoria = false; 
    
    // Resetando variáveis de velocidade/frequência/dificuldade 
    pato_velocidade = CONFIG.PATO_VELOCIDADE_BASE;
    fire_rate = CONFIG.FIRE_RATE_BASE;
    balas_velocidade = CONFIG.BALAS_VELOCIDADE_BASE;
    spawn_rate = spawn_rate_base; 
    tanque_chance_mod = 0;
    pato.orientacao = 'down'; 
    pato.estaMachucado = false; 
    pato.tempoInvencibilidade = 0;
    
    inimigos = []; 
    balas = [];
    
    pato.x = canvas.width / 2 - pato_tamanho / 2;
    pato.y = canvas.height / 2 - pato_tamanho / 2;
}

// Função para Aplicar as Melhorias
function aplicarMelhoria(atributoMelhoria, custo) { 
    if (peixesDeOuro >= custo) {
        peixesDeOuro -= custo;
        
        // 1. CHANCE DO TANQUE
        tanque_chance_mod += 7;
        
        if (atributoMelhoria === "CADENCIA_MOD") {
            fire_rate = Math.max(50, fire_rate - 20); 
            
            // 2. REDUÇÃO DO TEMPO DE SPAWN
            spawn_rate = Math.max(500, spawn_rate - 100); 
            
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
    
    // Desenha o fundo preto semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    // Desenha a imagem de fundo
    if (upgradeMenuLoaded) {
        ctx.drawImage(upgradeMenuImg, 0, 0, canvas.width, canvas.height);
    } 

    const TEXT_START_Y = 150; 
    const OPTIONS_START_Y = 250;
    
    // Ouro Atual 
    ctx.fillStyle = 'white';
    ctx.font = '35px Pixel'; 
    ctx.fillText(`Ouro Atual: ${peixesDeOuro}`, canvas.width - 100, TEXT_START_Y + 50);

    ctx.textAlign = 'left';
    let inicioY = OPTIONS_START_Y; 
    
   
}

// LÓGICA PRINCIPAL --------------------------------------------------------------------------------------------------------------

// Atualiza a posição e estado de todos os objetos a cada frame
function update() {
    let dx = 0;
    let dy = 0;
    const currentTime = Date.now();

    // Lógica de Movimento do Pato 
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

    // Lógica de Tiro 
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


    // Lógica de Movimento e Limpeza das Balas
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

    // Lógica de Spawn de Inimigos 
    if (currentTime > lastSpawnTime + spawn_rate) {
        criaInimigo();
        lastSpawnTime = currentTime;
    }

    // Lógica de Movimento e Colisão dos Inimigos
    for (let i = inimigos.length - 1; i >= 0; i--) {
        const inimigoObj = inimigos[i];

        // IA de Perseguição
        let dx_inimigo = pato.x - inimigoObj.x;
        let dy_inimigo = pato.y - inimigoObj.y;
        
        // Atualiza a orientação do sprite do inimigo
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
            
            if (!pato.estaMachucado) {
                pato.vida -= 1;
                
                // Ativa o estado de invencibilidade
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
    
    // Lógica para desativar o estado machucado e gerenciar o tempo
    if (pato.estaMachucado && currentTime > pato.tempoInvencibilidade) {
        pato.estaMachucado = false;
    }
}

// CONTROLE DE ENTRADA -----------------------------------------------------------------------------------------------------------

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    

    if (estaEmMelhoria) {
        const indiceSelecionado = parseInt(e.key) - 1; 
        
        if (indiceSelecionado >= 0 && indiceSelecionado < OPCOES_MELHORIA.length) {
            const opcaoSelecionada = OPCOES_MELHORIA[indiceSelecionado];
            
            // Tenta aplicar a melhoria
            aplicarMelhoria(opcaoSelecionada.atributo, opcaoSelecionada.custo);
        }
        return; 
    }

    // Controle de Reinício
    if (isGameOver && key === ' ') { 
        resetGame();
    }

    // Movimento
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;

    // Tiro 
    if (key === 'arrowup') keys.up = true;
    if (key === 'arrowleft') keys.left = true; 
    if (key === 'arrowdown') keys.down = true; 
    if (key === 'arrowright') keys.right = true; 
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    
    // Movimento 
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;

    // Tiro
    if (key === 'arrowup') keys.up = false; 
    if (key === 'arrowleft') keys.left = false; 
    if (key === 'arrowdown') keys.down = false; 
    if (key === 'arrowright') keys.right = false; 
});

// FUNÇÕES DE RENDERIZAÇÃO -------------------------------------------------------------------------------------------------------

// Função Tela Game Over
function drawGameOverScreen() {
    
    // 1. Desenha o fundo da tela de Game Over
    if (gameOverLoaded) {
        // Desenha a imagem de Game Over
        ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QUACKNADO: FIM DE JOGO', canvas.width / 2, canvas.height / 2 - 100);
    }
    
    // 2. Desenha o Score e a Mensagem de Reinício
    ctx.textAlign = 'center';
    
    // Usa fonte pixelada para o Score
    ctx.fillStyle = 'yellow';
    ctx.font = '36px Pixel'; 
    ctx.fillText(`Score Final: ${score}`, canvas.width / 2, 160);
    
    // Mensagem de Reinício
    ctx.fillStyle = 'white';
    ctx.font = '24px Pixel'; 
    ctx.fillText('Pressione ESPACO para Recomecar', canvas.width / 2, canvas.height );
}

// Função para Desenhar o HUD 
function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    // Lógica de Desenho dos Corações
    const HEART_SIZE = 30;
    const START_X = 10;
    const START_Y = 10;
    const SPACING = 5;

    if (heartLoaded) {
        for (let i = 0; i < pato.vida; i++) {
            const x = START_X + i * (HEART_SIZE + SPACING);
            ctx.drawImage(heartImg, x, START_Y, HEART_SIZE, HEART_SIZE);
        }
        
        ctx.font = '40px Pixel'; 
        
        // Posicionamento do ouro
        ctx.fillText(`Ouro: ${peixesDeOuro}`, 15, START_Y + HEART_SIZE + 30); 

    } else {
        ctx.fillText(`Vida: ${pato.vida}`, 10, 40); 
        ctx.fillText(`Ouro: ${peixesDeOuro}`, 10, 65);
    }
 
    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = '40px Pixel'; 
    ctx.fillText(`Score: ${score}`, canvas.width - 15, 40);
}

// Renderização
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha Background
    if (bgLoaded) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height + 51); 
    }

    // Desenha o Pato
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
 
        ctx.fillStyle = '#ef4444'; 
        ctx.fillRect(pato.x, pato.y, pato_tamanho, pato_tamanho);
    }

    // Desenha os Projéteis
    ctx.fillStyle = '#fef3c7'; 
    balas.forEach(bala => {
        ctx.beginPath();
        ctx.arc(bala.x + bala.size / 2, bala.y + bala.size / 2, bala.size / 2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.closePath();
    });

    // Desenha os Inimigos
    inimigos.forEach(inimigoObj => { 
        
        // Tenta desenhar o sprite
        if (inimigoSpritesLoaded) {
            const spriteKey = inimigoObj.spriteKey; 
            const orientacao = inimigoObj.orientacao; 
            
            // Busca a imagem correta no mapa
            const spriteAtual = spritesInimigo[spriteKey][orientacao];
            
            if (spriteAtual) {
                ctx.drawImage(spriteAtual, inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
            } else {
           
                ctx.fillStyle = inimigoObj.cor; 
                ctx.fillRect(inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
            }
        } else {
            
            ctx.fillStyle = inimigoObj.cor; 
            ctx.fillRect(inimigoObj.x, inimigoObj.y, inimigoObj.size, inimigoObj.size);
        }
        
        // Desenha barra de vida
        if (inimigoObj.vidaMaxima > 1) { 
            const healthBarWidth = inimigoObj.size * (inimigoObj.vida / inimigoObj.vidaMaxima); 
            const maxBarWidth = inimigoObj.size;

            // Fundo da barra 
            ctx.fillStyle = 'black';
            ctx.fillRect(inimigoObj.x, inimigoObj.y - 10, maxBarWidth, 5); 

            // Vida atual 
            ctx.fillStyle = 'lime';
            ctx.fillRect(inimigoObj.x, inimigoObj.y - 10, healthBarWidth, 5); 
        }
    });
    
    // Desenha o HUD
    drawHUD();
}

// GAME LOOP ---------------------------------------------------------------------------------------------------------------------

function gameLoop() {
    // Estado: Fim de Jogo
    if (isGameOver) { 
        drawGameOverScreen(); 
    } 
    // Estado: Pausa para Melhoria
    else if (estaEmMelhoria) { 

        draw(); 
        desenharMenuMelhoria(); 
    } 
    // Estado: Jogo Rodando
    else if (patoLoaded && bgLoaded && heartLoaded && inimigoSpritesLoaded && gameOverLoaded && upgradeMenuLoaded) { 
        update();
        draw();
    } 
    // Estado: Carregando
    else { 
    
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
function startGame() {
    // Esconde o menu principal
    const menu = document.getElementById('main-menu');
    if (menu) {
        menu.style.display = 'none';
    }

    // Inicia o Game Loop
    requestAnimationFrame(gameLoop);
}

// Quando a janela carrega, configura o botão
window.onload = () => {
    const startButton = document.getElementById('startButton');
    
    if (startButton) {
        // Adiciona o listener para iniciar o jogo ao clique
        startButton.addEventListener('click', startGame);
    } else {
        
        console.warn("Botão 'startButton' não encontrado. Iniciando jogo automaticamente.");
        startGame();
    }
    
};