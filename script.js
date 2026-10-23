// =====================================================
// BOLETIM DIGITAL - 8º ANO
// Dados fictícios + integração com API do Professor
// =====================================================

// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 19,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para armazenar o PIN apenas em memória durante a sessão
let pinSessao = "";

// Estado atual dos dados do aluno (em memória)
let dadosBoletim = [];

// Média mínima de referência para "Bom desempenho"
const MEDIA_MINIMA = 6.0;

// Frequência fictícia (mantida conforme demonstrativo)
const FREQUENCIA_DEMONSTRATIVA = 92;

// =====================================================
// 1) DADOS BRUTOS PADRÃO (utilizados caso a API retorne null)
// =====================================================
const dadosBrutosPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// =====================================================
// 2) FUNÇÕES DE NORMALIZAÇÃO E CÁLCULO
// =====================================================

// Normaliza notas antigas do sistema (suporta escala 0-100)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === "string") {
    valor = valor.trim().replace(",", ".");
  }
  const numero = Number(valor);
  if (isNaN(numero)) {
    return null;
  }
  if (numero >= 0 && numero <= 10) {
    return numero;
  }
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }
  return null;
}

// Valida entrada digitada no editor (aceita apenas escala 0-10 ou vazio)
function validarNotaDigitada(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return { valido: true, valor: null };
  }
  let texto = String(valor).trim().replace(",", ".");
  if (texto === "") {
    return { valido: true, valor: null };
  }
  const numero = Number(texto);
  if (isNaN(numero) || numero < 0 || numero > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: numero };
}

// Valida entrada de faltas (inteiros >= 0)
function validarFaltaDigitada(valor) {
  let texto = String(valor).trim();
  if (texto === "") {
    return { valido: false, valor: null };
  }
  const numero = Number(texto);
  if (isNaN(numero) || !Number.isInteger(numero) || numero < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: numero };
}

function calcularMedia(notas) {
  const notasValidas = notas.filter(function (n) {
    return n !== null;
  });
  if (notasValidas.length === 0) {
    return null;
  }
  let soma = 0;
  notasValidas.forEach(function (n) {
    soma += n;
  });
  return soma / notasValidas.length;
}

function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) return 0;
  let total = 0;
  faltas.forEach(function (f) {
    total += Number(f) || 0;
  });
  return total;
}

function definirSituacao(media) {
  if (media === null) {
    return "Nota ainda não disponível";
  }
  if (media >= MEDIA_MINIMA) {
    return "Bom desempenho";
  }
  return "Atenção";
}

function formatarNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

function criarEtiquetaSituacao(situacao) {
  if (situacao === "Bom desempenho") {
    return `<span class="etiqueta situacao-bom">${situacao}</span>`;
  }
  if (situacao === "Atenção") {
    return `<span class="etiqueta situacao-atencao">${situacao}</span>`;
  }
  return `<span class="etiqueta situacao-indisponivel">${situacao}</span>`;
}

// Safe text encoding para prevenir problemas de DOM injection
function sanitizarTexto(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

// =====================================================
// 3) AUTENTICAÇÃO E CONEXÃO COM A API
// =====================================================

async function fazerLogin() {
  const campoPin = document.getElementById("campo-pin");
  const msgStatus = document.getElementById("mensagem-status");
  const pinDigitado = campoPin.value.trim();

  if (!pinDigitado) {
    msgStatus.className = "mensagem-status erro";
    msgStatus.textContent = "Por favor, digite o PIN.";
    return;
  }

  msgStatus.className = "mensagem-status";
  msgStatus.textContent = "Conectando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgStatus.className = "mensagem-status erro";
      msgStatus.textContent = "Turma, chamada ou PIN inválidos.";
      return;
    }

    if (resposta.status === 429) {
      msgStatus.className = "mensagem-status erro";
      msgStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      return;
    }

    if (!resposta.ok) {
      throw new Error("Falha na resposta do servidor");
    }

    const resultado = await resposta.json();
    
    // Sucesso no acesso: armazena PIN na memória da sessão e limpa o campo do formulário
    pinSessao = pinDigitado;
    campoPin.value = "";
    msgStatus.textContent = "";

    // Oculta tela de login e exibe o boletim
    document.getElementById("area-acesso").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";

    // Processa os dados recebidos ou carrega os padrão
    carregarDados(resultado.dados);

  } catch (erro) {
    msgStatus.className = "mensagem-status erro";
    msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

// =====================================================
// 4) CARREGAMENTO E PROCESSAMENTO DE DADOS
// =====================================================

function carregarDados(dadosApi) {
  if (dadosApi && Array.isArray(dadosApi.disciplinas) && dadosApi.disciplinas.length > 0) {
    // Regra: DADOS DA API > DADOS LOCAIS
    dadosBoletim = dadosApi.disciplinas.map(function (item) {
      const n1 = normalizarNota(item.tri1);
      const n2 = normalizarNota(item.tri2);
      const n3 = normalizarNota(item.tri3);

      let faltasArray = [0, 0, 0];
      if (Array.isArray(item.faltas)) {
        faltasArray = item.faltas;
      } else if (typeof item.faltas === "number") {
        faltasArray = [item.faltas, 0, 0];
      }

      return {
        disciplina: item.disciplina,
        tri1: n1,
        tri2: n2,
        tri3: n3,
        faltas: faltasArray
      };
    });
  } else {
    // Quando dados for null ou novo
    dadosBoletim = dadosBrutosPadrao.map(function (item) {
      return {
        disciplina: item.disciplina,
        tri1: normalizarNota(item.tri1),
        tri2: normalizarNota(item.tri2),
        tri3: normalizarNota(item.tri3),
        faltas: [...item.faltas]
      };
    });
  }

  renderizarTabela();
  renderizarCards();
}

// =====================================================
// 5) RENDERIZAÇÃO DA TABELA E CARDS
// =====================================================

function renderizarTabela(modoEdicao = false) {
  const corpoTabela = document.getElementById("tabela-corpo");
  corpoTabela.innerHTML = ""; // Limpa a tabela para evitar duplicação

  dadosBoletim.forEach(function (d, index) {
    const media = calcularMedia([d.tri1, d.tri2, d.tri3]);
    const totalFaltas = somarFaltas(d.faltas);
    const situacao = definirSituacao(media);

    const linha = document.createElement("tr");

    if (!modoEdicao) {
      linha.innerHTML = `
        <td>${sanitizarTexto(d.disciplina)}</td>
        <td>${d.tri1 === null ? '<span class="nota-ausente">—</span>' : formatarNota(d.tri1)}</td>
        <td>${d.tri2 === null ? '<span class="nota-ausente">—</span>' : formatarNota(d.tri2)}</td>
        <td>${d.tri3 === null ? '<span class="nota-ausente">—</span>' : formatarNota(d.tri3)}</td>
        <td><strong>${media === null ? '<span class="nota-ausente">Ainda não lançada</span>' : formatarNota(media)}</strong></td>
        <td>${totalFaltas}</td>
        <td>${criarEtiquetaSituacao(situacao)}</td>
      `;
    } else {
      const val1 = d.tri1 !== null ? String(d.tri1).replace(".", ",") : "";
      const val2 = d.tri2 !== null ? String(d.tri2).replace(".", ",") : "";
      const val3 = d.tri3 !== null ? String(d.tri3).replace(".", ",") : "";

      linha.innerHTML = `
        <td>${sanitizarTexto(d.disciplina)}</td>
        <td><input type="text" class="campo-edicao-nota" id="edit-tri1-${index}" value="${val1}"></td>
        <td><input type="text" class="campo-edicao-nota" id="edit-tri2-${index}" value="${val2}"></td>
        <td><input type="text" class="campo-edicao-nota" id="edit-tri3-${index}" value="${val3}"></td>
        <td><strong>${media === null ? '—' : formatarNota(media)}</strong></td>
        <td>
          <input type="text" class="campo-edicao-falta" id="edit-f1-${index}" value="${d.faltas[0] || 0}" title="1º Tri">
          <input type="text" class="campo-edicao-falta" id="edit-f2-${index}" value="${d.faltas[1] || 0}" title="2º Tri">
          <input type="text" class="campo-edicao-falta" id="edit-f3-${index}" value="${d.faltas[2] || 0}" title="3º Tri">
        </td>
        <td>${criarEtiquetaSituacao(situacao)}</td>
      `;
    }

    corpoTabela.appendChild(linha);
  });
}

function renderizarCards() {
  const containerCards = document.getElementById("cards-container");
  containerCards.innerHTML = ""; // Limpa os cards para evitar duplicação

  const disciplinasProcessadas = dadosBoletim.map(function (d) {
    const media = calcularMedia([d.tri1, d.tri2, d.tri3]);
    const totalFaltas = somarFaltas(d.faltas);
    const situacao = definirSituacao(media);
    return { media, faltas: totalFaltas, situacao };
  });

  const mediasValidas = disciplinasProcessadas
    .map(function (d) { return d.media; })
    .filter(function (m) { return m !== null; });

  let mediaGeral = null;
  if (mediasValidas.length > 0) {
    let soma = 0;
    mediasValidas.forEach(function (m) { soma += m; });
    mediaGeral = soma / mediasValidas.length;
  }

  let totalFaltasGeral = 0;
  disciplinasProcessadas.forEach(function (d) {
    totalFaltasGeral += d.faltas;
  });

  const qtdBomDesempenho = disciplinasProcessadas.filter(function (d) {
    return d.situacao === "Bom desempenho";
  }).length;

  const qtdAtencao = disciplinasProcessadas.filter(function (d) {
    return d.situacao === "Atenção";
  }).length;

  const cards = [
    {
      titulo: "Média geral",
      valor: mediaGeral === null ? "—" : formatarNota(mediaGeral),
      extra: "Escala de 0 a 10"
    },
    {
      titulo: "Total de faltas",
      valor: totalFaltasGeral,
      extra: "Somatório de todos os trimestres"
    },
    {
      titulo: "Bom desempenho",
      valor: qtdBomDesempenho,
      extra: "disciplinas com média ≥ 6,0"
    },
    {
      titulo: "Precisam de atenção",
      valor: qtdAtencao,
      extra: "disciplinas com média < 6,0"
    },
    {
      titulo: "Frequência",
      valor: FREQUENCIA_DEMONSTRATIVA + "%",
      extra: "Frequência adequada"
    }
  ];

  cards.forEach(function (c) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p class="card-titulo">${c.titulo}</p>
      <p class="card-valor">${c.valor}</p>
      <p class="card-extra">${c.extra}</p>
    `;
    containerCards.appendChild(card);
  });
}

// =====================================================
// 6) EDIÇÃO E SALVAMENTO DE DADOS
// =====================================================

function abrirEdicao() {
  document.getElementById("btn-alterar").style.display = "none";
  document.getElementById("btn-salvar").style.display = "inline-block";
  document.getElementById("btn-cancelar").style.display = "inline-block";
  renderizarTabela(true);
}

function cancelarEdicao() {
  document.getElementById("btn-alterar").style.display = "inline-block";
  document.getElementById("btn-salvar").style.display = "none";
  document.getElementById("btn-cancelar").style.display = "none";
  renderizarTabela(false);
}

async function salvarAlteracoes() {
  let errosEncontrados = false;
  const novosDados = [];

  // Limpa marcações prévias de erro nos campos
  document.querySelectorAll(".campo-invalido").forEach(el => el.classList.remove("campo-invalido"));

  dadosBoletim.forEach(function (d, index) {
    const elT1 = document.getElementById(`edit-tri1-${index}`);
    const elT2 = document.getElementById(`edit-tri2-${index}`);
    const elT3 = document.getElementById(`edit-tri3-${index}`);

    const elF1 = document.getElementById(`edit-f1-${index}`);
    const elF2 = document.getElementById(`edit-f2-${index}`);
    const elF3 = document.getElementById(`edit-f3-${index}`);

    const vT1 = validarNotaDigitada(elT1.value);
    const vT2 = validarNotaDigitada(elT2.value);
    const vT3 = validarNotaDigitada(elT3.value);

    const vF1 = validarFaltaDigitada(elF1.value);
    const vF2 = validarFaltaDigitada(elF2.value);
    const vF3 = validarFaltaDigitada(elF3.value);

    if (!vT1.valido) { elT1.classList.add("campo-invalido"); errosEncontrados = true; }
    if (!vT2.valido) { elT2.classList.add("campo-invalido"); errosEncontrados = true; }
    if (!vT3.valido) { elT3.classList.add("campo-invalido"); errosEncontrados = true; }

    if (!vF1.valido) { elF1.classList.add("campo-invalido"); errosEncontrados = true; }
    if (!vF2.valido) { elF2.classList.add("campo-invalido"); errosEncontrados = true; }
    if (!vF3.valido) { elF3.classList.add("campo-invalido"); errosEncontrados = true; }

    if (!errosEncontrados) {
      novosDados.push({
        disciplina: d.disciplina,
        tri1: vT1.valor,
        tri2: vT2.valor,
        tri3: vT3.valor,
        faltas: [vF1.valor, vF2.valor, vF3.valor]
      });
    }
  });

  if (errosEncontrados) {
    alert("Existem valores inválidos destacados em vermelho. Por favor, corrija-os antes de salvar.");
    return;
  }

  const btnSalvar = document.getElementById("btn-salvar");
  const textoOriginalBtn = btnSalvar.textContent;
  btnSalvar.textContent = "Salvando...";
  btnSalvar.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novosDados
        }
      })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao salvar alterações no servidor");
    }

    alert("Dados salvos com sucesso.");
    
    // Atualiza estado local
    dadosBoletim = novosDados;

    // Conclui modo de edição e atualiza interface
    document.getElementById("btn-alterar").style.display = "inline-block";
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-cancelar").style.display = "none";

    renderizarTabela(false);
    renderizarCards();

  } catch (erro) {
    alert("Não foi possível salvar as alterações. Tente novamente.");
  } finally {
    btnSalvar.textContent = textoOriginalBtn;
    btnSalvar.disabled = false;
  }
}