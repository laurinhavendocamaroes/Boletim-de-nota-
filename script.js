// DADOS BRUTOS DO BOLETIM (Array de Objetos)
const dadosBoletim = [
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

// FUNÇÃO PARA NORMALIZAR AS NOTAS PARA A ESCALA DE 0 A 10
function normalizarNota(valor) {
  // Trata notas ausentes, vazias ou nulas
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte vírgula para ponto se for texto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  // Se não for um número válido, descarta
  if (isNaN(num)) {
    return null;
  }

  // Ajusta valores acima de 10 (ex: 82 vira 8.2, 100 vira 10.0)
  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  // Garante que a nota esteja dentro da escala válida 0 a 10
  if (num >= 0 && num <= 10) {
    return num;
  }

  return null; // Caso esteja fora das regras
}

// RENDERIZAÇÃO E CÁLCULOS PRINCIPAIS
function construirBoletim() {
  const corpoTabela = document.getElementById("tabela-corpo");
  const containerCards = document.getElementById("cards-container");

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  corpoTabela.innerHTML = ""; // Limpa a tabela

  // Passa por cada disciplina da lista
  dadosBoletim.forEach((item) => {
    // Normaliza as notas dos três trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a soma das faltas
    const totalFaltasDisc = item.faltas.reduce((acc, f) => acc + f, 0);
    totalFaltasGeral += totalFaltasDisc;

    // Filtra apenas notas válidas para calcular a média
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    
    let mediaFormatada = "—";
    let situacao = "Nota ainda não disponível";
    let classeTag = "tag-indisponivel";

    if (notasValidas.length > 0) {
      const somaNotas = notasValidas.reduce((acc, n) => acc + n, 0);
      const media = somaNotas / notasValidas.length;
      
      mediaFormatada = media.toFixed(1).replace(".", ",");
      somaMediasGerais += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classeTag = "tag-bom";
        qtdBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeTag = "tag-atencao";
        qtdAtencao++;
      }
    }

    // Função interna auxiliar para exibir a nota formatada na tabela
    const formatarExibicao = (nota) => nota !== null ? nota.toFixed(1).replace(".", ",") : "—";

    // Cria a linha HTML da disciplina
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicao(n1)}</td>
      <td>${formatarExibicao(n2)}</td>
      <td>${formatarExibicao(n3)}</td>
      <td><strong>${mediaFormatada}</strong></td>
      <td>${totalFaltasDisc}</td>
      <td><span class="tag-situacao ${classeTag}">${situacao}</span></td>
    `;
    corpoTabela.appendChild(tr);
  });

  // Cálculo da Média Geral da turma
  const mediaGeralFinal = qtdDisciplinasComMedia > 0 
    ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

  /* 
    NOTA SOBRE FREQUÊNCIA:
    O valor abaixo de 92% e o texto "Frequência adequada" são apenas DEMONSTRATIVOS/FICTÍCIOS para esta versão do projeto e não são calculados diretamente das faltas.
  */
  
  // Preenche os Cards de Resumo
  containerCards.innerHTML = `
    <div class="card">
      <h3>Média Geral</h3>
      <div class="valor">${mediaGeralFinal}</div>
      <div class="subtexto">Média de todas as matérias</div>
    </div>
    <div class="card">
      <h3>Total de Faltas</h3>
      <div class="valor">${totalFaltasGeral}</div>
      <div class="subtexto">Acumulado no ano</div>
    </div>
    <div class="card">
      <h3>Bom Desempenho</h3>
      <div class="valor">${qtdBomDesempenho}</div>
      <div class="subtexto">Disciplinas com média ≥ 6,0</div>
    </div>
    <div class="card">
      <h3>Precisam de Atenção</h3>
      <div class="valor">${qtdAtencao}</div>
      <div class="subtexto">Disciplinas com média < 6,0</div>
    </div>
    <div class="card">
      <h3>Frequência Geral</h3>
      <div class="valor">92%</div>
      <div class="subtexto">Frequência adequada</div>
    </div>
  `;
}

// Executa a função assim que o código carrega
construirBoletim();