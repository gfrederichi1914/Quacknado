🦆 Quacknado
Quacknado é um jogo do gênero Top-Down Arena Shooter desenvolvido inteiramente em JavaScript puro e renderizado via HTML5 Canvas. O projeto simula um ecossistema sob ataque de poluentes mutantes, onde o jogador deve gerenciar recursos (Ouro) e upgrades para sobreviver à dificuldade progressiva.

🕹️ O Jogo
A vida no Pântano da Harmonia foi interrompida pelo "Quacknado", um turbilhão maligno que trouxe aberrações marinhas. O Capitão Quack Norris deve utilizar seu estilingue de sementes para eliminar caranguejos mutantes e o temível Polvo Tanque, limpando o ecossistema.

Mecânicas Principais:
Twin-Stick Input: Movimentação via WASD e controle de mira/tiro independente via Setas.

Sistema de Economia: Coleta de Ouro ao derrotar inimigos.

Progressão Estratégica: Upgrades de combate e mobilidade a cada 10 adversários eliminados.

Dificuldade Dinâmica: Ajuste de parâmetros de spawn e velocidade conforme o score aumenta.

🛠️ Tecnologias e Arquitetura
O projeto foi construído focando em performance de renderização no navegador e código modular.

Linguagem: JavaScript (ES6+).

Renderização: HTML5 Canvas API.

Estilo: CSS3 para interface de UI e animações de menu.

Estrutura de Dados: Mapeamento de objetos para configurações de inimigos, permitindo fácil expansão do catálogo de entidades.

Trecho de Configuração Técnica:

const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 200,
    INIMIGO_VELOCIDADE: 1 // Parâmetro global de escalonamento do sistema
};

📂 Estrutura de Arquivos
index.html: Menu principal e lore do jogo.

game.html: Ambiente de execução do Canvas.

dev.html: Seção de créditos e informações do desenvolvedor.

script.js: Engine do jogo (Game Loop, Detecção de Colisão e IA básica de perseguição).

style.css: Estilização visual e responsividade.

🚀 Como Executar
Clone este repositório.

Abra o arquivo index.html em qualquer navegador moderno.

Não são necessárias dependências externas ou servidores para rodar.

✍️ Autor
Gabriel Chicole – Estudante de Ciência da Computação na FEI. Focado em produtividade, automação e desenvolvimento de sistemas eficientes.