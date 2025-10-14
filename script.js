const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Estado do Jogo 
const pato_velocidade = 3.5;
const pato_tamanho = 150;

// Objeto pato 
let pato = {
    // Centraliza o pato
    x: canvas.width / 2 - pato_tamanho / 2,
    y: canvas.height / 2 - pato_tamanho / 2,
};

// Objeto para rastrear teclas pressionadas
let keys = {
    w: false, a: false, s: false, d: false,
};

// Carregamento do sprite do pato 
let patoImg = new Image();
patoImg.src = "assets/pato_atirador_2.png";
let patoLoaded = false;

patoImg.onload = () => {
    patoLoaded = true;
};

// CONTROLE DE ENTRADA
// Tecla pressionada
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
});

// Tecla não pressionada 
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
});

// LÓGICA
function update() {
    let dx = 0;
    let dy = 0;

    // Calcular direção
    if (keys.w) dy -= 1; // Cima
    if (keys.a) dx -= 1; // Esquerda
    if (keys.s) dy += 1; // Baixo
    if (keys.d) dx += 1; // Baixo 

    // 2. Normalizar o vetor de movimento
    let length = Math.sqrt(dx * dx + dy * dy);
    if (length !== 0) {
        dx /= length;
        dy /= length;
    }

    // Aplicar velocidade
    pato.x += dx * pato_velocidade;
    pato.y += dy * pato_velocidade;

    // Limitar movimento dentro do canvas
    pato.x = Math.max(0, Math.min(canvas.width - pato_tamanho, pato.x));
    pato.y = Math.max(0, Math.min(canvas.height - pato_tamanho, pato.y));

}

// RENDERIZAÇÃO
function draw() {
    // Limpa cada frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (patoLoaded) {
        // Desenhar o Pato usando a imagem carregada
        ctx.drawImage(patoImg, pato.x, pato.y, pato_tamanho, pato_tamanho);
    } else {
        // Se a imagem ainda não carregou, desenhar um placeholder (quadrado vermelho)
        ctx.fillStyle = '#ef4444'; // Vermelho
        ctx.fillRect(pato.x, pato.y, pato_tamanho, pato_tamanho);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
window.onload = gameLoop;