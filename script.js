console.log("PAC-MAN INICIADO!");

// MAPA
const mapa = [
  "###############",
  "#P....#.......#",
  "#.##..#.###.#.#",
  "#.....#...#...#",
  "###.###.#.#.###",
  "#.....#.#.....#",
  "#.###...#.###.#",
  "#...#...#.....#",
  "#.............#",
  "###############",
];

// CONFIGURAÇÕES
const tamanho = 40;
const tamanhoPacman = 30;
const velocidade = 2;

const gameContainer = document.querySelector("#game-container");
const placar = document.querySelector("#score");
const vidasTexto = document.querySelector("#lives");

const overlay = document.querySelector("#game-overlay");
const mensagemFinal = document.querySelector("#game-message");
const pontuacaoFinal = document.querySelector("#final-score");
const botaoReiniciar = document.querySelector("#restart-button");

let grade;
let pontos;
let vidas;
let x;
let y;
let fantasmas;
let teclasPressionadas;
let bolinhasRestantes;
let invulneravelAte;
let jogoFinalizado;

// POSIÇÕES INICIAIS
const inicioPacman = { x: 45, y: 45 };

const inicioFantasmas = [
  { linha: 1, coluna: 13, cor: "#ff3030" },
  { linha: 8, coluna: 13, cor: "#00d9ff" },
];

// CRIAR LABIRINTO
function criarLabirinto() {
  grade = mapa.map((linha) => linha.split(""));

  bolinhasRestantes = 0;

  gameContainer.innerHTML = "";

  for (let linha = 0; linha < grade.length; linha++) {
    for (let coluna = 0; coluna < grade[linha].length; coluna++) {
      const celula = document.createElement("div");

      celula.classList.add("tile");

      if (grade[linha][coluna] === "#") {
        celula.classList.add("wall");
      }

      if (grade[linha][coluna] === ".") {
        const bolinha = document.createElement("div");

        bolinha.classList.add("dot");

        celula.appendChild(bolinha);

        bolinhasRestantes++;
      }

      gameContainer.appendChild(celula);
    }
  }
}

// CRIAR PAC-MAN
function criarPacman() {
  const personagem = document.createElement("div");

  personagem.id = "pacman";

  gameContainer.appendChild(personagem);

  return personagem;
}

// CRIAR FANTASMAS
function criarFantasmas() {
  fantasmas = [];

  inicioFantasmas.forEach((config) => {
    const elemento = document.createElement("div");

    elemento.classList.add("ghost");
    elemento.style.backgroundColor = config.cor;

    for (let i = 0; i < 2; i++) {
      const olho = document.createElement("div");

      olho.classList.add("ghost-eye");

      olho.classList.add(i === 0 ? "left" : "right");

      const pupila = document.createElement("div");

      pupila.classList.add("ghost-pupil");

      olho.appendChild(pupila);
      elemento.appendChild(olho);
    }

    gameContainer.appendChild(elemento);

    fantasmas.push({
      elemento: elemento,

      linha: config.linha,
      coluna: config.coluna,

      x: config.coluna * tamanho + 5,
      y: config.linha * tamanho + 5,

      alvo: null,
      velocidade: 1.2,
    });
  });
}

// ATUALIZAR PLACAR
function atualizarPlacar() {
  placar.textContent = pontos;
  vidasTexto.textContent = vidas;
}

// CONTROLE DO TECLADO
document.addEventListener("keydown", function (event) {
  const teclas = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  if (teclas.includes(event.key)) {
    event.preventDefault();
    teclasPressionadas.add(event.key);
  }
});

document.addEventListener("keyup", function (event) {
  teclasPressionadas.delete(event.key);
});

// VERIFICAR PAREDES
function podeMover(novoX, novoY) {
  const margem = 3;

  const esquerda = Math.floor((novoX + margem) / tamanho);
  const direita = Math.floor((novoX + tamanhoPacman - margem - 1) / tamanho);

  const cima = Math.floor((novoY + margem) / tamanho);
  const baixo = Math.floor((novoY + tamanhoPacman - margem - 1) / tamanho);

  const cantos = [
    [cima, esquerda],
    [cima, direita],
    [baixo, esquerda],
    [baixo, direita],
  ];

  for (const [linha, coluna] of cantos) {
    if (!grade[linha] || grade[linha][coluna] === "#") {
      return false;
    }
  }

  return true;
}

// COMER BOLINHAS
function comerBolinha() {
  const coluna = Math.floor((x + tamanhoPacman / 2) / tamanho);

  const linha = Math.floor((y + tamanhoPacman / 2) / tamanho);

  if (grade[linha][coluna] === ".") {
    grade[linha][coluna] = " ";

    const celulas = gameContainer.querySelectorAll(".tile");

    const indice = linha * grade[0].length + coluna;

    const bolinha = celulas[indice].querySelector(".dot");

    if (bolinha) {
      bolinha.remove();
    }

    pontos += 10;
    bolinhasRestantes--;

    atualizarPlacar();

    if (bolinhasRestantes === 0) {
      finalizarJogo("VITÓRIA!");
    }
  }
}

// MOVIMENTAR PAC-MAN
function movimentarPacman() {
  let novoX = x;
  let novoY = y;

  if (teclasPressionadas.has("ArrowRight")) {
    novoX += velocidade;
  } else if (teclasPressionadas.has("ArrowLeft")) {
    novoX -= velocidade;
  } else if (teclasPressionadas.has("ArrowUp")) {
    novoY -= velocidade;
  } else if (teclasPressionadas.has("ArrowDown")) {
    novoY += velocidade;
  }

  if (podeMover(novoX, novoY)) {
    x = novoX;
    y = novoY;
  }

  pacman.style.left = x + "px";
  pacman.style.top = y + "px";

  comerBolinha();
}

// BUSCA DE CAMINHO BFS
function encontrarCaminho(
  inicioLinha,
  inicioColuna,
  destinoLinha,
  destinoColuna,
) {
  const fila = [{ linha: inicioLinha, coluna: inicioColuna }];

  const visitados = new Set();
  const anteriores = new Map();

  const chave = (linha, coluna) => `${linha},${coluna}`;

  visitados.add(chave(inicioLinha, inicioColuna));

  const direcoes = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (fila.length > 0) {
    const atual = fila.shift();

    if (atual.linha === destinoLinha && atual.coluna === destinoColuna) {
      break;
    }

    for (const [dl, dc] of direcoes) {
      const novaLinha = atual.linha + dl;
      const novaColuna = atual.coluna + dc;

      const novaChave = chave(novaLinha, novaColuna);

      if (
        grade[novaLinha] &&
        grade[novaLinha][novaColuna] !== "#" &&
        !visitados.has(novaChave)
      ) {
        visitados.add(novaChave);

        anteriores.set(novaChave, chave(atual.linha, atual.coluna));

        fila.push({
          linha: novaLinha,
          coluna: novaColuna,
        });
      }
    }
  }

  const destino = chave(destinoLinha, destinoColuna);

  if (!visitados.has(destino)) {
    return null;
  }

  const caminho = [];

  let atual = destino;

  while (atual) {
    const [linha, coluna] = atual.split(",").map(Number);

    caminho.unshift({ linha, coluna });

    if (atual === chave(inicioLinha, inicioColuna)) {
      break;
    }

    atual = anteriores.get(atual);
  }

  return caminho.length > 1 ? caminho[1] : null;
}

// MOVIMENTAR FANTASMAS
function movimentarFantasma(ghost) {
  if (ghost.alvo === null) {
    const linhaPacman = Math.floor((y + tamanhoPacman / 2) / tamanho);

    const colunaPacman = Math.floor((x + tamanhoPacman / 2) / tamanho);

    const proximoPasso = encontrarCaminho(
      ghost.linha,
      ghost.coluna,
      linhaPacman,
      colunaPacman,
    );

    if (!proximoPasso) {
      return;
    }

    ghost.alvo = {
      linha: proximoPasso.linha,
      coluna: proximoPasso.coluna,
      x: proximoPasso.coluna * tamanho + 5,
      y: proximoPasso.linha * tamanho + 5,
    };
  }

  const dx = ghost.alvo.x - ghost.x;
  const dy = ghost.alvo.y - ghost.y;

  const distancia = Math.sqrt(dx * dx + dy * dy);

  if (distancia <= ghost.velocidade) {
    ghost.x = ghost.alvo.x;
    ghost.y = ghost.alvo.y;

    ghost.linha = ghost.alvo.linha;
    ghost.coluna = ghost.alvo.coluna;

    ghost.alvo = null;
  } else {
    ghost.x += (dx / distancia) * ghost.velocidade;
    ghost.y += (dy / distancia) * ghost.velocidade;
  }

  ghost.elemento.style.left = ghost.x + "px";
  ghost.elemento.style.top = ghost.y + "px";
}

// VERIFICAR COLISÕES
function verificarColisoes() {
  if (performance.now() < invulneravelAte) {
    return;
  }

  const centroPacmanX = x + tamanhoPacman / 2;
  const centroPacmanY = y + tamanhoPacman / 2;

  for (const ghost of fantasmas) {
    const centroGhostX = ghost.x + 15;
    const centroGhostY = ghost.y + 15;

    const dx = centroPacmanX - centroGhostX;
    const dy = centroPacmanY - centroGhostY;

    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 23) {
      perderVida();

      break;
    }
  }
}

// PERDER VIDA
function perderVida() {
  vidas--;

  atualizarPlacar();

  teclasPressionadas.clear();

  if (vidas <= 0) {
    finalizarJogo("GAME OVER!");

    return;
  }

  // Reposicionar Pac-Man
  x = inicioPacman.x;
  y = inicioPacman.y;

  pacman.style.left = x + "px";
  pacman.style.top = y + "px";

  // Reposicionar fantasmas
  fantasmas.forEach((ghost, indice) => {
    const inicio = inicioFantasmas[indice];

    ghost.linha = inicio.linha;
    ghost.coluna = inicio.coluna;

    ghost.x = inicio.coluna * tamanho + 5;
    ghost.y = inicio.linha * tamanho + 5;

    ghost.alvo = null;

    ghost.elemento.style.left = ghost.x + "px";
    ghost.elemento.style.top = ghost.y + "px";
  });

  // Proteção temporária contra novas colisões
  invulneravelAte = performance.now() + 1500;
}

// FINALIZAR PARTIDA
function finalizarJogo(mensagem) {
  jogoFinalizado = true;

  teclasPressionadas.clear();

  mensagemFinal.textContent = mensagem;

  pontuacaoFinal.textContent = "Pontuação final: " + pontos;

  overlay.classList.remove("hidden");
}

// REINICIAR PARTIDA
function reiniciarJogo() {
  pontos = 0;
  vidas = 3;

  x = inicioPacman.x;
  y = inicioPacman.y;

  invulneravelAte = 0;
  jogoFinalizado = false;

  teclasPressionadas.clear();

  overlay.classList.add("hidden");

  criarLabirinto();

  pacman = criarPacman();

  criarFantasmas();

  atualizarPlacar();

  pacman.style.left = x + "px";
  pacman.style.top = y + "px";
}

// CICLO PRINCIPAL
function atualizarJogo() {
  if (jogoFinalizado) {
    return;
  }

  movimentarPacman();

  if (jogoFinalizado) {
    return;
  }

  fantasmas.forEach(movimentarFantasma);

  verificarColisoes();

  requestAnimationFrame(atualizarJogo);
}

// BOTÃO DE REINICIAR
botaoReiniciar.addEventListener("click", function () {
  reiniciarJogo();

  requestAnimationFrame(atualizarJogo);
});

// INICIAR PARTIDA
let pacman;

function iniciarJogo() {
  pontos = 0;
  vidas = 3;

  x = inicioPacman.x;
  y = inicioPacman.y;

  invulneravelAte = 0;
  jogoFinalizado = false;

  teclasPressionadas = new Set();

  criarLabirinto();

  pacman = criarPacman();

  criarFantasmas();

  atualizarPlacar();

  pacman.style.left = x + "px";
  pacman.style.top = y + "px";

  atualizarJogo();
}

iniciarJogo();

console.log("Sistema de vidas iniciado!");
