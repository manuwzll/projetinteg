// ==== ELEMENTOS ====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const vidasDisplay = document.getElementById("vidasDisplay");
const mortesDisplay = document.getElementById("mortesDisplay");
const nivelDisplay = document.getElementById("nivelDisplay");
const btnReiniciarNivel = document.getElementById("btnReiniciarNivel"); // Botão para REINICIAR FASE
const telaInicial = document.getElementById("telaInicial");
const telaFinal = document.getElementById("telaFinal");
const btnJogar = document.getElementById("btnJogar");
const btnJogarNovamente = document.getElementById("btnJogarNovamente");
const tituloFinal = document.getElementById("tituloFinal");
const mensagemFinal = document.getElementById("mensagemFinal");

// ==== CONFIG ====
const LARGURA_BLOCO = 40;
const ALTURA_BLOCO = 40;
const MAX_VIDAS = 5;
const MAX_NIVEIS = 15;
const CHAO_Y = canvas.height - ALTURA_BLOCO;
const INVENCIBILIDADE_FRAMES = 60;

let jogoRodando = false;
let nivelAtual = 1;
let numMortes = 0;
let vidas = MAX_VIDAS;
let mapa = [];
let chavesColetadas = 0;
let framesDesdeInicio = 0;
let framesDesdeRespawn = 0;

// ==== JOGADOR ====
let jogador = {
    x: LARGURA_BLOCO * 2,
    y: CHAO_Y - LARGURA_BLOCO * 3,
    largura: LARGURA_BLOCO * 0.8,
    altura: LARGURA_BLOCO * 0.8,
    velocidadeX: 0,
    velocidadeY: 0,
    velocidadeMaxX: 5,
    gravidade: 0.8,
    puloForca: 15,
    saltosMaximos: 2,
    saltosRestantes: 2,
    noChao: false,
    pulando: false, // Adicionado para controle de pulo
};
jogador.raio = jogador.largura / 2;

const CORES = {
    JOGADOR: "#00DFFF",
    BLOCO: "#00AAAA",
    ESPINHO: "#FF4500",
    CHAVE: "#FFD700",
    PORTAL_FECHADO: "#004C6D",
    PORTAL_ABERTO: "#00FFFF",
    LUA_CLARA: "#FFFFFF",
    LUA_HALO: "rgba(255,255,255,0.15)",
    CHAO_ESCURO: "#0a1a1d",
    CHAO_CLARO: "#155a5d"
};

// ==== DECORAÇÕES ====
let estrelas = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.6,
    r: Math.random() * 1.8 + 0.5,
    brilho: Math.random(),
    velocidade: 0.05 + Math.random() * 0.05
}));

// ==== FUNÇÕES VISUAIS ====
function desenharCenario() {
    // Fundo degradê noturno aprimorado
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#010A1A"); // Azul marinho muito escuro
    grad.addColorStop(0.5, "#002040"); // Azul escuro
    grad.addColorStop(1, "#004B7D"); // Azul médio
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrelas
    for (let e of estrelas) {
        e.brilho += (Math.random() - 0.5) * 0.04;
        if (e.brilho < 0.1) e.brilho = 0.1;
        if (e.brilho > 1) e.brilho = 1;

        ctx.fillStyle = `rgba(255,255,255,${e.brilho})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();

        e.x -= e.velocidade;
        if (e.x < -5) e.x = canvas.width + 5;
    }

    // Lua
    const luaX = canvas.width - 120;
    const luaY = 100;
    const luaR = 50;
    ctx.beginPath();
    const gradHalo = ctx.createRadialGradient(luaX, luaY, 10, luaX, luaY, 100);
    gradHalo.addColorStop(0, CORES.LUA_HALO);
    gradHalo.addColorStop(1, "transparent");
    ctx.fillStyle = gradHalo;
    ctx.arc(luaX, luaY, 100, 0, Math.PI * 2);
    ctx.fill();

    const gradLua = ctx.createRadialGradient(luaX, luaY, 10, luaX, luaY, luaR);
    gradLua.addColorStop(0, CORES.LUA_CLARA);
    gradLua.addColorStop(1, "#b0b0b0");
    ctx.fillStyle = gradLua;
    ctx.beginPath();
    ctx.arc(luaX, luaY, luaR, 0, Math.PI * 2);
    ctx.fill();

    // Chão realista com textura aprimorada
    const gradChao = ctx.createLinearGradient(0, CHAO_Y, 0, canvas.height);
    gradChao.addColorStop(0, "#253D3D"); // Tom de rocha escuro
    gradChao.addColorStop(0.6, "#152525"); // Sombra profunda
    gradChao.addColorStop(1, "#0A1515"); // Quase preto
    ctx.fillStyle = gradChao;
    ctx.fillRect(0, CHAO_Y, canvas.width, canvas.height - CHAO_Y); // Preenche até o final

    // Detalhes de textura (Ruído/Cascalho)
    for (let i = 0; i < canvas.width; i += 5) {
        for (let j = CHAO_Y; j < canvas.height; j += 10) {
            if (Math.random() < 0.1) {
                ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
                ctx.fillRect(i, j + Math.random() * 5, 1, 1);
            }
        }
    }
    
    // Linhas de profundidade (Fendas)
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 70) {
        ctx.beginPath();
        ctx.moveTo(i, CHAO_Y);
        ctx.lineTo(i + 20, canvas.height);
        ctx.stroke();
    }
}

// ==== DESENHAR ====
function desenharJogador() {
    const cx = jogador.x + jogador.raio;
    const cy = jogador.y + jogador.raio;

    const gradJog = ctx.createRadialGradient(cx, cy - 5, 5, cx, cy, jogador.raio);
    gradJog.addColorStop(0, "#66FFFF");
    gradJog.addColorStop(1, CORES.JOGADOR);
    ctx.fillStyle = gradJog;
    ctx.beginPath();
    ctx.arc(cx, cy, jogador.raio, 0, Math.PI * 2);
    ctx.fill();

    // EFEITO DE PISCAR DURANTE A INVENCIBILIDADE (Remova se não quiser)
    if (framesDesdeRespawn < INVENCIBILIDADE_FRAMES && framesDesdeRespawn % 6 < 3) {
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, jogador.raio + 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function desenharMapa() {
    for (let e of mapa) {
        if (e.tipo === "bloco" || e.tipo === "movel") {
            const grad = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.altura);
            grad.addColorStop(0, "#007070");
            grad.addColorStop(1, "#004040");
            ctx.fillStyle = grad;
            ctx.fillRect(e.x, e.y, e.largura, e.altura);
        } else if (e.tipo === "espinho") {
            ctx.fillStyle = CORES.ESPINHO;
            ctx.beginPath();
            const num = Math.floor(e.largura / 10);
            for (let i = 0; i < num; i++) {
                const x = e.x + i * 10;
                ctx.moveTo(x, e.y + e.altura);
                ctx.lineTo(x + 5, e.y);
                ctx.lineTo(x + 10, e.y + e.altura);
            }
            ctx.fill();
        } else if (e.tipo === "chave") {
            // Desenho da chave mais elaborado
            ctx.fillStyle = CORES.CHAVE;
            ctx.beginPath();
            ctx.arc(e.x + e.largura / 2, e.y + e.largura / 2, e.largura / 2, 0, Math.PI * 2);
            ctx.fillRect(e.x + e.largura / 2 - 5, e.y + e.largura / 2, 10, 15);
            ctx.fillRect(e.x + e.largura / 2 + 5, e.y + e.largura / 2 + 10, 5, 5);
            ctx.fill();
        } else if (e.tipo === "porta") {
            // Porta de saída maior e mais bonita
            const portalLargura = 80;
            const portalAltura = 100;
            const portalX = e.x + (e.largura - portalLargura) / 2;
            const portalY = e.y - (portalAltura - e.altura);

            const corPortal = chavesColetadas >= e.chavesNecessarias ? CORES.PORTAL_ABERTO : CORES.PORTAL_FECHADO;
            const gradPortal = ctx.createLinearGradient(portalX, portalY, portalX + portalLargura, portalY + portalAltura);
            gradPortal.addColorStop(0, corPortal);
            gradPortal.addColorStop(1, corPortal === CORES.PORTAL_ABERTO ? "#80FFFF" : "#002030");

            ctx.fillStyle = gradPortal;
            ctx.fillRect(portalX, portalY, portalLargura, portalAltura);

            // Detalhes da porta
            ctx.strokeStyle = "#AAA";
            ctx.lineWidth = 2;
            ctx.strokeRect(portalX + 5, portalY + 5, portalLargura - 10, portalAltura - 10);

            if (chavesColetadas >= e.chavesNecessarias) {
                // Brilho e animação sutil
                ctx.shadowBlur = 20;
                ctx.shadowColor = CORES.PORTAL_ABERTO;
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.beginPath();
                ctx.arc(portalX + portalLargura / 2, portalY + portalAltura / 2, 20 + Math.sin(framesDesdeInicio * 0.1) * 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = "#444";
                ctx.font = "16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`${chavesColetadas}/${e.chavesNecessarias} chaves`, portalX + portalLargura / 2, portalY + portalAltura / 2 + 5);
            }
        }
    }
}

function desenhar() {
    desenharCenario();
    desenharMapa();
    desenharJogador();
}

// ==== ENTRADAS ====
const teclas = {};
document.addEventListener("keydown", (e) => (teclas[e.key.toLowerCase()] = true));
document.addEventListener("keyup", (e) => (teclas[e.key.toLowerCase()] = false));

// ==== COLISÃO E FÍSICA ====
function colisao(a, b) {
    return (
        a.x < b.x + b.largura &&
        a.x + a.largura > b.x &&
        a.y < b.y + b.altura &&
        a.y + a.altura > b.y
    );
}

function morrer() {
    if (framesDesdeRespawn < 10) return; // evita morte instantânea
    if (!jogoRodando) return;

    numMortes++;
    vidas--;

    if (vidas <= 0) {
        mostrarTelaFinal("GAME OVER!", `Você morreu ${numMortes} vezes!`);
        return;
    }

    reiniciarNivel();
}

// NOVO: Função para reiniciar a fase sem perder vidas
function reiniciarFaseAtual() {
    if (!jogoRodando) return;
    reiniciarNivel();
}

function checarVitoria() {
    const porta = mapa.find((e) => e.tipo === "porta");
    if (porta && colisao(jogador, { x: porta.x + (porta.largura - 80) / 2, y: porta.y - (100 - porta.altura), largura: 80, altura: 100 }) && chavesColetadas >= porta.chavesNecessarias) {
        nivelAtual++;
        if (nivelAtual > MAX_NIVEIS) {
            mostrarTelaFinal("VITÓRIA!", `Você completou ${MAX_NIVEIS} níveis!`);
        } else reiniciarNivel();
    }
}

function atualizar() {
    framesDesdeInicio++;
    framesDesdeRespawn++;

    let dir = 0;
    if (teclas["a"] || teclas["arrowleft"]) dir = -1;
    if (teclas["d"] || teclas["arrowright"]) dir = 1;
    jogador.velocidadeX = dir * jogador.velocidadeMaxX;

    if ((teclas["w"] || teclas[" "] || teclas["arrowup"]) && !jogador.pulando) {
        if (jogador.saltosRestantes > 0) {
            jogador.velocidadeY = -jogador.puloForca;
            jogador.saltosRestantes--;
            jogador.pulando = true;
        }
    }
    if (!(teclas["w"] || teclas[" "] || teclas["arrowup"])) {
        jogador.pulando = false;
    }


    jogador.velocidadeY += jogador.gravidade;
    jogador.x += jogador.velocidadeX;
    jogador.y += jogador.velocidadeY;

    for (let e of mapa) {
        if (colisao(jogador, e)) {
            if (e.tipo === "espinho" && framesDesdeRespawn >= INVENCIBILIDADE_FRAMES) morrer();
            if (["bloco", "movel"].includes(e.tipo)) {
                // Ajuste de colisão para empurrar o jogador para cima
                if (jogador.velocidadeY > 0) {
                    jogador.y = e.y - jogador.altura;
                    jogador.velocidadeY = 0;
                    jogador.saltosRestantes = jogador.saltosMaximos;
                    jogador.noChao = true;
                }
            }
            if (e.tipo === "chave") {
                chavesColetadas++;
                mapa = mapa.filter((i) => i !== e);
            }
        }
    }

    if (framesDesdeRespawn >= INVENCIBILIDADE_FRAMES) {
        if (jogador.y > canvas.height + 200) morrer();
    }

    checarVitoria();
}

// ==== MAPAS ====
const criarBloco = (x, y, w = LARGURA_BLOCO, h = ALTURA_BLOCO) => ({ tipo: "bloco", x, y, largura: w, altura: h });
// Espinho agora é criado na posição vertical correta (CHAO_Y - altura)
const criarEspinho = (x, y, w = LARGURA_BLOCO, h = 20) => ({ tipo: "espinho", x, y: y, largura: w, altura: h });
const criarChave = (x, y) => ({ tipo: "chave", x, y, largura: 20, altura: 20 });
const criarPorta = (x, y, ch = 0) => ({ tipo: "porta", x, y, largura: 70, altura: 60, chavesNecessarias: ch });

function criarMapa(nivel) {
    // A base do chão (o bloco onde os espinhos vão)
    let m = [criarBloco(0, CHAO_Y, canvas.width, ALTURA_BLOCO * 2)];
    const XPORTA = canvas.width - 120; // Posição X do centro da porta
    
    // Altura onde os espinhos devem ficar (topo do chão)
    const ESPINHO_Y = CHAO_Y - 20;

    if (nivel === 1) {
        m.push(
            criarBloco(200, CHAO_Y - 80, 100),
            // Espinho agora usa ESPINHO_Y para ficar no topo do chão
            criarEspinho(400, ESPINHO_Y, 150), 
            criarChave(230, CHAO_Y - 120),
            criarPorta(XPORTA, CHAO_Y - 60, 1)
        );
    } else {
        m.push(
            criarBloco(200, CHAO_Y - 80, 100),
            criarBloco(450, CHAO_Y - 150, 80),
            criarChave(470, CHAO_Y - 180),
            // Espinhos no chão e em outras plataformas
            criarEspinho(300, ESPINHO_Y, 50),
            criarEspinho(600, ESPINHO_Y, 80),
            criarEspinho(450, CHAO_Y - 150 - 20, 80),
            criarPorta(XPORTA, CHAO_Y - 60, 1)
        );
    }
    return m;
}

// ==== FLUXO ====
function atualizarPlacar() {
    vidasDisplay.textContent = `Vidas: ${vidas}`;
    mortesDisplay.textContent = `Mortes: ${numMortes}`;
    nivelDisplay.textContent = `Nível: ${nivelAtual}`;
}

function reiniciarNivel() {
    framesDesdeRespawn = 0;
    mapa = criarMapa(nivelAtual);
    // Posição inicial do jogador
    jogador.x = LARGURA_BLOCO * 2;
    jogador.y = CHAO_Y - LARGURA_BLOCO * 3;
    jogador.velocidadeX = 0;
    jogador.velocidadeY = 0;
    jogador.saltosRestantes = jogador.saltosMaximos;
    jogador.noChao = false;
    chavesColetadas = 0;
}

function mostrarTelaFinal(titulo, msg) {
    jogoRodando = false;
    telaFinal.classList.remove("hidden");
    tituloFinal.textContent = titulo;
    mensagemFinal.innerHTML = msg;
}

function iniciarJogo() {
    telaInicial.classList.add("hidden");
    telaFinal.classList.add("hidden");
    if (!jogoRodando || vidas <= 0) {
        nivelAtual = 1;
        numMortes = 0;
        vidas = MAX_VIDAS;
    }
    atualizarPlacar();
    reiniciarNivel();
    jogoRodando = true;
    gameLoop();
}

function gameLoop() {
    if (!jogoRodando) return;
    atualizar();
    desenhar();
    atualizarPlacar();
    requestAnimationFrame(gameLoop);
}

// ==== INÍCIO ====
btnJogar.onclick = iniciarJogo;
btnJogarNovamente.onclick = iniciarJogo;
// Botão de reiniciar fase, chama a nova função
btnReiniciarNivel.onclick = reiniciarFaseAtual; 
reiniciarNivel();
desenhar();