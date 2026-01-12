# Quacknado - Top-Down Arena Shooter 🦆🌪️

O **Quacknado** é um jogo de ação no estilo *Arena Shooter* desenvolvido inteiramente em **JavaScript puro**, utilizando a API **HTML5 Canvas** para renderização gráfica. O projeto simula um ecossistema sob ataque de poluentes mutantes, desafiando o jogador a gerenciar recursos e upgrades em um ambiente de dificuldade progressiva.

Este projeto demonstra competências em **Game Design**, **Lógica de Colisão**, **Sistemas de Partículas** e **Manipulação de DOM**, reforçando minha base em desenvolvimento web e performance de front-end.

## 🕹️ O Jogo
A harmonia do pântano foi interrompida pelo "Quacknado", um turbilhão que trouxe aberrações marinhas. No papel do Capitão Quack Norris, o jogador deve utilizar um estilingue de sementes para eliminar ameaças como caranguejos mutantes e o Polvo Tanque.

### Mecânicas Principais
- **Twin-Stick Input:** Sistema de controle independente para movimentação (WASD) e mira/tiro (Setas).
- **Economia e Estratégia:** Coleta de ouro para aquisição de upgrades a cada 10 inimigos derrotados.
- **Dificuldade Progressiva:** Algoritmo de escalonamento que ajusta parâmetros de *spawn* e velocidade conforme o score.

## 🛠️ Tecnologias e Arquitetura
O desenvolvimento focou em performance e modularidade, garantindo que o *Game Loop* rode de forma fluida no navegador.

- **Linguagem:** JavaScript (ES6+).
- **Renderização:** HTML5 Canvas API (Gráficos 2D).
- **Interface:** CSS3 para UI, animações de menu e responsividade.
- **Engine de Configuração:** Uso de constantes mapeadas para facilitar o balanceamento do jogo sem alteração da lógica principal.

```javascript
const CONFIG = {
    PATO_VELOCIDADE_BASE: 3.5,
    BALAS_VELOCIDADE_BASE: 7,
    FIRE_RATE_BASE: 200,
    INIMIGO_VELOCIDADE: 1 // Escalonamento global do sistema
};