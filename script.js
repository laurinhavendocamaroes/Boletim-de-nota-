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
  const corpo