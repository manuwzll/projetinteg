const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos de HUD
const vidasDisplay = document.getElementById('vidasDisplay');
const mortesDisplay = document.getElementById('mortesDisplay');
const nivelDisplay = document.getElementById('nivelDisplay');
const btnReiniciarNivel = document.getElementById('btnReiniciarNivel');

// Elementos de Menu
const telaInicial = document.getElementById('telaInicial');
const telaFinal = document.getElementById('telaFinal');
const btnJogar = document.getElementById('btnJogar');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');
const tituloFinal = document.getElementById('tituloFinal');
const mensagemFinal = document.getElementById('mensagemFinal');

// --- Configurações de Jogo ---
const LARGURA_BLOCO = 40;
const ALTURA_BLOCO = 40;
const MAX_VIDAS = 5;
const MAX_NIVEIS = 40;

let jogoRodando = false;
let nivelAtual = 1;
let numMortes = 0;
let vidas = MAX_VIDAS;
let mapa = [];
let chavesColetadas = 0;

// --- Configurações do Jogador (Com Pulo Duplo) ---
let jogador = {
    x: LARGURA_BLOCO * 2,
    y: canvas.height - LARGURA_BLOCO * 2,
    largura: LARGURA_BLOCO * 0.7,
    altura: LARGURA_BLOCO * 0.7,
    velocidadeX: 0,
    velocidadeY: 0,
    velocidadeMaxX: 5,
    gravidadeBase: 0.8,
    gravidade: 0.8,
    puloForca: 15,
    saltosMaximos: 2,
    saltosRestantes: 2,
    noChao: true
};

// --- Configurações de Cores ---
const CORES = {
    JOGADOR: '#00FFFF',
    BLOCO: '#ffffff',
    BLOCO_FALSO: '#333333',
    ESPINHO: '#ff4500',
    CHAVE: '#ffd700',
    PORTA_FECHADA: '#666666',
    PORTA_ABERTA: '#32cd32'
};


// --- Funções de Estado do Jogo ---

function atualizarPlacar() {
    vidasDisplay.textContent = `Vidas: ${vidas}`;
    mortesDisplay.textContent = `Mortes: ${numMortes}`;
    nivelDisplay.textContent = `Nível: ${nivelAtual}`;

    // Verifica se o botão existe no HTML antes de tentar usá-lo
    if (btnReiniciarNivel) {
        if (jogoRodando) {
            btnReiniciarNivel.classList.remove('hidden');
        } else {
            btnReiniciarNivel.classList.add('hidden');
        }
    }
}

function iniciarJogo() {
    // Esconde menus
    telaInicial.classList.add('hidden');
    telaFinal.classList.add('hidden');

    if (!jogoRodando || vidas <= 0) {
        nivelAtual = 1;
        numMortes = 0;
        vidas = MAX_VIDAS;
    }

    atualizarPlacar();
    reiniciarNivel();

    if (!jogoRodando) {
        jogoRodando = true;
        gameLoop();
    }
}

function morrer() {
    if (!jogoRodando) return;

    numMortes++;
    vidas--;
    atualizarPlacar();

    if (vidas <= 0) {
        mostrarTelaFinal('GAME OVER!', `Fim da linha, trollado com sucesso! Mortes: ${numMortes}`);
        return;
    }

    reiniciarNivel();
}

function reiniciarNivel() {
    jogador.x = LARGURA_BLOCO * 2;
    jogador.y = canvas.height - LARGURA_BLOCO * 2;
    jogador.velocidadeX = 0;
    jogador.velocidadeY = 0;
    jogador.gravidade = jogador.gravidadeBase;
    jogador.noChao = true;
    jogador.saltosRestantes = jogador.saltosMaximos;
    chavesColetadas = 0;

    mapa = criarMapa(nivelAtual);
}

function mostrarTelaFinal(titulo, mensagem) {
    jogoRodando = false;
    telaFinal.classList.remove('hidden');
    tituloFinal.textContent = titulo;
    mensagemFinal.innerHTML = `${mensagem} <br><br> Tente o modo masoquista, JOGAR DE NOVO.`;
    atualizarPlacar();
}

// --- Event Listeners ---
btnJogar.addEventListener('click', iniciarJogo);
btnJogarNovamente.addEventListener('click', iniciarJogo);
if (btnReiniciarNivel) {
    btnReiniciarNivel.addEventListener('click', () => {
        if (jogoRodando) {
            morrer();
        }
    });
}

// --- Game Loop e Desenho ---

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar o mapa (blocos, espinhos, etc.)
    mapa.forEach(elemento => {
        if (elemento.tipo === 'bloco') {
            ctx.fillStyle = elemento.troll === 'someAoTocar' ? CORES.BLOCO_FALSO : CORES.BLOCO;
        } else if (elemento.tipo === 'espinho') {
            ctx.fillStyle = CORES.ESPINHO;
        } else if (elemento.tipo === 'chave') {
            ctx.fillStyle = CORES.CHAVE;
        } else if (elemento.tipo === 'porta') {
            ctx.fillStyle = chavesColetadas >= elemento.chavesNecessarias ? CORES.PORTA_ABERTA : CORES.PORTA_FECHADA;
        } else {
            return;
        }
        ctx.fillRect(elemento.x, elemento.y, elemento.largura, elemento.altura);
    });

    // 2. Desenhar o jogador (Círculo Brilhante)
    ctx.fillStyle = CORES.JOGADOR;
    const raio = jogador.largura / 2;
    const centroX = jogador.x + raio;
    const centroY = jogador.y + raio;

    ctx.shadowColor = CORES.JOGADOR;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(centroX, centroY, raio, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

    // Reseta a sombra
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function gameLoop() {
    if (!jogoRodando) return;

    atualizar();
    desenhar();

    requestAnimationFrame(gameLoop);
}

// --- Funções de Lógica (AGORA COM MOVIMENTO SUAVE) ---

function atualizar() {
    // 1. Lógica de Movimento Contínuo: Lida com teclas pressionadas em CADA FRAME
    jogador.velocidadeX = 0;
    if (teclasPressionadas['arrowright'] || teclasPressionadas['d']) {
        jogador.velocidadeX = jogador.velocidadeMaxX;
    }
    if (teclasPressionadas['arrowleft'] || teclasPressionadas['a']) {
        jogador.velocidadeX = -jogador.velocidadeMaxX;
    }

    // 2. Aplica Gravidade
    if (!jogador.noChao) {
        jogador.velocidadeY += jogador.gravidade;
    }

    // 3. Colisão (X) 
    jogador.x += jogador.velocidadeX;
    colisaoHorizontal();

    // 4. Colisão (Y)
    jogador.y += jogador.velocidadeY;
    colisaoVertical();

    // 5. Limites e Morte
    if (jogador.y > canvas.height) {
        morrer();
        return;
    }

    checarVitoria();
}

function colisao(r1, r2) {
    return r1.x < r2.x + r2.largura &&
        r1.x + r1.largura > r2.x &&
        r1.y < r2.y + r2.altura &&
        r1.y + r1.altura > r2.y;
}

function colisaoHorizontal() {
    mapa.forEach(elemento => {
        if (colisao(jogador, elemento)) {
            if (elemento.tipo === 'bloco' || elemento.tipo === 'porta') {
                if (jogador.velocidadeX > 0) {
                    jogador.x = elemento.x - jogador.largura;
                } else if (jogador.velocidadeX < 0) {
                    jogador.x = elemento.x + elemento.largura;
                }
                jogador.velocidadeX = 0;
            } else if (elemento.tipo === 'espinho') {
                morrer();
            }
        }
    });
}

function colisaoVertical() {
    jogador.noChao = false;

    mapa.forEach(elemento => {
        if (colisao(jogador, elemento)) {

            if (elemento.tipo === 'espinho') {
                morrer();
            } else if (elemento.tipo === 'chave') {
                chavesColetadas++;
                mapa = mapa.filter(item => item !== elemento);
                atualizarPlacar();
                return;
            }

            if (elemento.tipo === 'bloco') {

                if (jogador.velocidadeY > 0) { // Caindo
                    jogador.y = elemento.y - jogador.altura;
                    jogador.noChao = true;
                    jogador.velocidadeY = 0;
                    jogador.saltosRestantes = jogador.saltosMaximos; // Reseta pulos
                } else if (jogador.velocidadeY < 0) { // Subindo
                    jogador.y = elemento.y + elemento.altura;
                    jogador.velocidadeY = 0;
                }

                if (elemento.troll === 'someAoTocar' && !elemento.sumindo) {
                    elemento.sumindo = true;
                    setTimeout(() => {
                        mapa = mapa.filter(item => item !== elemento);
                    }, 500);
                }

                if (elemento.troll === 'mudaGravidade' && elemento.status !== 'invertido') {
                    jogador.gravidade *= -1;
                    elemento.status = 'invertido';
                    // Dá um impulso inicial no pulo para cima ou para baixo
                    jogador.velocidadeY = jogador.gravidade > 0 ? -jogador.puloForca * 0.8 : jogador.puloForca * 0.8;
                }
            }
        }
    });
}

function checarVitoria() {
    const porta = mapa.find(e => e.tipo === 'porta');
    if (porta && chavesColetadas >= porta.chavesNecessarias) {
        if (colisao(jogador, porta)) {

            if (nivelAtual < MAX_NIVEIS) {
                nivelAtual++;
                reiniciarNivel();
                atualizarPlacar();
            } else {
                mostrarTelaFinal('🏆 VITORIOSO! 🏆', `Você dominou todas as ${MAX_NIVEIS} fases com um total de **${numMortes} mortes**!`);
            }
        }
    }
}


// --- Lógica de Criação de 40 Níveis TROLL ---

const criarBloco = (x, y, largura = LARGURA_BLOCO, altura = ALTURA_BLOCO, troll = null) => ({ tipo: 'bloco', x, y, largura, altura, troll, sumindo: false, status: 'normal' });
const criarEspinho = (x, y, largura = LARGURA_BLOCO, altura = LARGURA_BLOCO * 0.7) => ({ tipo: 'espinho', x, y, largura, altura });
const criarChave = (x, y) => ({ tipo: 'chave', x, y, largura: LARGURA_BLOCO * 0.5, altura: LARGURA_BLOCO * 0.5 });
const criarPorta = (x, y, chavesNecessarias) => ({ tipo: 'porta', x, y, largura: LARGURA_BLOCO * 1.2, altura: LARGURA_BLOCO * 1.5, chavesNecessarias });

const CHAO_Y = canvas.height - ALTURA_BLOCO;

function criarMapa(nivel) {
    let novoMapa = [];
    novoMapa.push(criarBloco(0, CHAO_Y, canvas.width, ALTURA_BLOCO));

    if (nivel === 1) {
        novoMapa.push(
            criarBloco(LARGURA_BLOCO * 5, CHAO_Y - ALTURA_BLOCO * 3, LARGURA_BLOCO * 3, ALTURA_BLOCO, 'someAoTocar'),
            criarBloco(LARGURA_BLOCO * 9, CHAO_Y - ALTURA_BLOCO * 5, LARGURA_BLOCO * 3, ALTURA_BLOCO),
            criarPorta(canvas.width - LARGURA_BLOCO * 2, CHAO_Y - ALTURA_BLOCO * 0.5, 1),
            criarChave(LARGURA_BLOCO * 10.5, CHAO_Y - ALTURA_BLOCO * 7)
        );

    } else if (nivel === 2) {
        // NÍVEL 2: Bloco de Inversão movido para perto da porta no topo
        const LARGURA_BLOCO_INV = LARGURA_BLOCO * 6;
        const X_PORTA = canvas.width - LARGURA_BLOCO * 2;
        const X_BLOCO_INV = X_PORTA - LARGURA_BLOCO_INV - LARGURA_BLOCO * 0.5;

        novoMapa.push(
            criarBloco(X_BLOCO_INV, CHAO_Y - ALTURA_BLOCO * 3, LARGURA_BLOCO_INV, ALTURA_BLOCO, 'mudaGravidade'),
            criarEspinho(X_BLOCO_INV + LARGURA_BLOCO * 2, 0, LARGURA_BLOCO * 2, ALTURA_BLOCO * 0.7),
            criarPorta(X_PORTA, LARGURA_BLOCO * 1.5, 0)
        );

    } else if (nivel === 3) {
        novoMapa = [criarEspinho(0, CHAO_Y - ALTURA_BLOCO * 0.7, canvas.width, ALTURA_BLOCO * 0.7)];
        novoMapa.push(
            criarBloco(LARGURA_BLOCO * 2, CHAO_Y - ALTURA_BLOCO * 3, LARGURA_BLOCO * 2, ALTURA_BLOCO),
            criarBloco(canvas.width - LARGURA_BLOCO * 4, CHAO_Y - ALTURA_BLOCO * 5, LARGURA_BLOCO * 2, ALTURA_BLOCO),
            criarPorta(canvas.width - LARGURA_BLOCO * 3, CHAO_Y - ALTURA_BLOCO * 6.5, 0)
        );

    } else if (nivel === 4) {
        novoMapa.push(
            criarBloco(LARGURA_BLOCO * 2, CHAO_Y - ALTURA_BLOCO * 3, LARGURA_BLOCO * 1, ALTURA_BLOCO),
            criarBloco(LARGURA_BLOCO * 8, CHAO_Y - ALTURA_BLOCO * 3, LARGURA_BLOCO * 1, ALTURA_BLOCO),
            criarPorta(canvas.width - LARGURA_BLOCO * 2, CHAO_Y - ALTURA_BLOCO * 0.5, 1),
            criarEspinho(LARGURA_BLOCO * 3, CHAO_Y - ALTURA_BLOCO * 8, LARGURA_BLOCO * 10, ALTURA_BLOCO * 0.7),
            criarChave(LARGURA_BLOCO * 5, CHAO_Y - ALTURA_BLOCO * 6.5)
        );

    }
    // Manteve-se o suporte para 40 níveis.
    else if (nivel >= 5 && nivel <= MAX_NIVEIS) {
        const trollType = nivel % 3 === 0 ? 'mudaGravidade' : (nivel % 2 === 0 ? 'someAoTocar' : null);
        for (let i = 1; i < 4; i++) {
            novoMapa.push(criarBloco(LARGURA_BLOCO * (i * 4), CHAO_Y - ALTURA_BLOCO * (i * 2 + 1), LARGURA_BLOCO * 2));
        }
        if (trollType) {
            const trollY = CHAO_Y - ALTURA_BLOCO * 5;
            const trollX = LARGURA_BLOCO * 8;
            novoMapa.push(criarBloco(trollX, trollY, LARGURA_BLOCO * 3, ALTURA_BLOCO, trollType));
        }
        novoMapa.push(criarEspinho(LARGURA_BLOCO * 10, CHAO_Y - ALTURA_BLOCO * 0.7));
        novoMapa.push(criarPorta(canvas.width - LARGURA_BLOCO * 2, CHAO_Y - ALTURA_BLOCO * 0.5, 1));
        novoMapa.push(criarChave(LARGURA_BLOCO * 15, CHAO_Y - ALTURA_BLOCO * 4));
    }

    return novoMapa;
}

// --- Controles de Teclado (LÓGICA APENAS PARA GRAVAR ESTADO) ---
const teclasPressionadas = {};

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Evita scroll da página ao usar setas
    if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
    }

    teclasPressionadas[key] = true;

    // PULO é acionado apenas UMA VEZ no keydown, mas verifica as condições
    if ((key === 'arrowup' || key === 'w' || key === ' ') && jogador.saltosRestantes > 0 && jogoRodando) {

        // Verifica se é o primeiro pulo (no chão) OU se ainda resta o segundo pulo
        if (jogador.noChao || jogador.saltosRestantes === jogador.saltosMaximos - 1) {
            jogador.velocidadeY = -jogador.puloForca;
            jogador.noChao = false;
            jogador.saltosRestantes--;
        }
    }
});

document.addEventListener('keyup', (e) => {
    teclasPressionadas[e.key.toLowerCase()] = false;
});

// --- Iniciar o Jogo ---
window.onload = () => {
    if (telaInicial) {
        telaInicial.classList.remove('hidden');
    }
    atualizarPlacar();
};