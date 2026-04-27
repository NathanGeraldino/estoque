// ============================================
// SISTEMA DE ESTOQUE TI - VERSÃO GITHUB PAGES
// Usando localStorage para persistência de dados
// ============================================

// Variáveis globais
let produtos = [];
let movimentacoes = [];
let editandoMovimentacaoId = null;

// ============================================
// FUNÇÕES DE ARMAZENAMENTO LOCAL (localStorage)
// ============================================

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function salvarNoLocalStorage(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarDoLocalStorage(chave) {
  const dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

function carregarDados() {
  produtos = carregarDoLocalStorage("produtos");
  movimentacoes = carregarDoLocalStorage("movimentacoes");
  alocacoes = carregarDoLocalStorage("alocacoes");
  historicoAlocacoes = carregarDoLocalStorage("historicoAlocacoes");
}

function salvarProdutos() {
  salvarNoLocalStorage("produtos", produtos);
}

function salvarMovimentacoes() {
  salvarNoLocalStorage("movimentacoes", movimentacoes);
}

function salvarAlocacoes() {
  salvarNoLocalStorage("alocacoes", alocacoes);
}

function salvarHistoricoAlocacoes() {
  salvarNoLocalStorage("historicoAlocacoes", historicoAlocacoes);
}

// ============================================
  });
}

// ============================================
// DASHBOARD - CARDS E GRÁFICOS
// ============================================
  const modoEdicaoProduto = document.getElementById("modoEdicaoProduto");

  if (!nome) {
    window.location.href = "produtos.html";
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirProduto(id) {
  const confirmar = confirm("Deseja realmente excluir este Equipamento?");
  if (!confirmar) return;

  // Remove movimentações relacionadas
  movimentacoes = movimentacoes.filter((mov) => String(mov.produtoId) !== String(id));
  salvarMovimentacoes();

  // Remove o produto
  produtos = produtos.filter((p) => String(p.id) !== String(id));
  salvarProdutos();

  refreshAll();
}

function initProdutosPage() {

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
      return;
    }

    if (editandoId) {
      // Atualizar produto existente
      const index = produtos.findIndex((p) => String(p.id) === String(editandoId));
      if (index !== -1) {
        produtos[index] = {
          ...produtos[index],
          nome,
          modelo,
          quantidade,
          minimo,
          valor
        };
      }
    } else {
      // Criar novo produto
      produtos.push({
        id: gerarId(),
        nome,
        modelo,
        quantidade,
        minimo,
        valor
      });
    }

    salvarProdutos();
    limparFormularioProduto();
    refreshAll();
  });

  busca?.addEventListener("input", renderTabelaProdutos);
    .join("");
}

function registrarMovimentacao(produtoId, tipo, quantidade, observacao = "") {
  const produto = produtos.find((item) => String(item.id) === String(produtoId));
  if (!produto) return false;


  const agora = new Date();

  // Atualiza quantidade do produto
  const index = produtos.findIndex((p) => String(p.id) === String(produtoId));
  if (index !== -1) {
    produtos[index].quantidade = novaQuantidade;
  }
  salvarProdutos();

  // Registra movimentação
  movimentacoes.push({
    id: gerarId(),
    produtoId,
    produtoNome: produto.nome || "",
    equipamento: produto.nome || "",
    modelo: produto.modelo || "",
    tipo,
    quantidade,
    observacao,
    data: agora.toLocaleString("pt-BR"),
    dataISO: agora.toISOString(),
    dataFiltro: agora.toISOString().split("T")[0]
  });
  salvarMovimentacoes();

  return true;
}

function renderTabelaMovimentacoes() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirMovimentacao(id) {
  const confirmar = confirm("Deseja excluir esta movimentação?");
  if (!confirmar) return;

  const mov = movimentacoes.find(m => String(m.id) === String(id));
  if (!mov) {
    alert("Movimentação não encontrada.");
    return;
  }

  const produto = produtos.find(p => String(p.id) === String(mov.produtoId));
  if (!produto) {
    alert("Produto da movimentação não encontrado.");
    return;
  }

  const tipo = String(mov.tipo).trim().toLowerCase();
  const quantidadeMov = Number(mov.quantidade);
  let novaQuantidade = Number(produto.quantidade);

  if (tipo === "entrada") {
    novaQuantidade -= quantidadeMov;
  } else if (tipo === "saida") {
    novaQuantidade += quantidadeMov;
  }

  if (novaQuantidade < 0) {
    novaQuantidade = 0;
  }

  // Atualiza produto
  const indexProduto = produtos.findIndex(p => String(p.id) === String(produto.id));
  if (indexProduto !== -1) {
    produtos[indexProduto].quantidade = novaQuantidade;
  }
  salvarProdutos();

  // Remove movimentação
  movimentacoes = movimentacoes.filter(m => String(m.id) !== String(id));
  salvarMovimentacoes();

  refreshAll();
}

function atualizarMovimentacao(id, novoProdutoId, novoTipo, novaQuantidade, novaObservacao = "") {
  const movAntiga = movimentacoes.find(m => String(m.id) === String(id));
  if (!movAntiga) return false;

  const produtoAntigo = produtos.find(p => String(p.id) === String(movAntiga.produtoId));
  const produtoNovo = produtos.find(p => String(p.id) === String(novoProdutoId));

  if (!produtoAntigo || !produtoNovo) {
    alert("Equipamento da movimentação não encontrado.");
    return false;
  }

  const tipoAntigo = String(movAntiga.tipo).trim().toLowerCase();
  const tipoNovo = String(novoTipo).trim().toLowerCase();
  const quantidadeAntiga = Number(movAntiga.quantidade);
  const quantidadeNova = Number(novaQuantidade);

  if (!quantidadeNova || quantidadeNova <= 0) {
    alert("Informe uma quantidade válida.");
    return false;
  }

  let estoqueProdutoAntigo = Number(produtoAntigo.quantidade);
  let estoqueProdutoNovo = Number(produtoNovo.quantidade);

  // Desfaz a movimentação antiga
  if (tipoAntigo === "entrada") {
    estoqueProdutoAntigo -= quantidadeAntiga;
  } else if (tipoAntigo === "saida") {
    estoqueProdutoAntigo += quantidadeAntiga;
  }

  // Aplica a movimentação nova
  if (String(produtoAntigo.id) === String(produtoNovo.id)) {
    estoqueProdutoNovo = estoqueProdutoAntigo;

    if (tipoNovo === "entrada") {
      estoqueProdutoNovo += quantidadeNova;
    } else if (tipoNovo === "saida") {
      if (quantidadeNova > estoqueProdutoNovo) {
        alert("A saída não pode ser maior que a quantidade em estoque.");
        return false;
      }
      estoqueProdutoNovo -= quantidadeNova;
    }
  } else {
    if (tipoNovo === "entrada") {
      estoqueProdutoNovo += quantidadeNova;
    } else if (tipoNovo === "saida") {
      if (quantidadeNova > estoqueProdutoNovo) {
        alert("A saída não pode ser maior que a quantidade em estoque.");
        return false;
      }
      estoqueProdutoNovo -= quantidadeNova;
    }
  }

  if (estoqueProdutoAntigo < 0 || estoqueProdutoNovo < 0) {
    alert("Operação inválida: estoque ficaria negativo.");
    return false;
  }

  // Atualiza estoques dos produtos
  if (String(produtoAntigo.id) === String(produtoNovo.id)) {
    const index = produtos.findIndex(p => String(p.id) === String(produtoNovo.id));
    if (index !== -1) {
      produtos[index].quantidade = estoqueProdutoNovo;
    }
  } else {
    const indexAntigo = produtos.findIndex(p => String(p.id) === String(produtoAntigo.id));
    const indexNovo = produtos.findIndex(p => String(p.id) === String(produtoNovo.id));
    
    if (indexAntigo !== -1) {
      produtos[indexAntigo].quantidade = estoqueProdutoAntigo;
    }
    if (indexNovo !== -1) {
      produtos[indexNovo].quantidade = estoqueProdutoNovo;
    }
  }
  salvarProdutos();

  // Atualiza movimentação
  const indexMov = movimentacoes.findIndex(m => String(m.id) === String(id));
  if (indexMov !== -1) {
    movimentacoes[indexMov] = {
      ...movimentacoes[indexMov],
      produtoId: novoProdutoId,
      produtoNome: produtoNovo.nome || "",
      equipamento: produtoNovo.nome || "",
      modelo: produtoNovo.modelo || "",
      tipo: tipoNovo,
      quantidade: quantidadeNova,
      observacao: novaObservacao
    };
  }
  salvarMovimentacoes();

  return true;
}

function initMovimentacoesPage() {
  const form = document.getElementById("movimentacaoForm");
  const cancelarEdicaoMov = document.getElementById("cancelarEdicaoMov");
  
  if (!form) return;

  const filtroDataInicial = document.getElementById("filtroDataInicial");
  const filtroDataFinal = document.getElementById("filtroDataFinal");
  const filtroProdutoMov = document.getElementById("filtroProdutoMov");
  const limparFiltrosMov = document.getElementById("limparFiltrosMov");
  const btnSalvarMov = document.getElementById("btnSalvarMov");
  const modoEdicaoMov = document.getElementById("modoEdicaoMov");

  cancelarEdicaoMov?.addEventListener("click", () => {
    form.reset();
    document.getElementById("quantidadeMov").value = 1;
    editandoMovimentacaoId = null;
    btnSalvarMov.textContent = "Registrar";
    modoEdicaoMov.style.display = "none";
  });

  renderSelectProdutosMov();
  renderFiltroProdutosMov();
  renderTabelaMovimentacoes();

  filtroDataInicial?.addEventListener("input", renderTabelaMovimentacoes);
  filtroDataFinal?.addEventListener("input", renderTabelaMovimentacoes);
  filtroProdutoMov?.addEventListener("change", renderTabelaMovimentacoes);

  limparFiltrosMov?.addEventListener("click", () => {
    if (filtroDataInicial) filtroDataInicial.value = "";
    if (filtroDataFinal) filtroDataFinal.value = "";
    if (filtroProdutoMov) filtroProdutoMov.value = "";
    renderTabelaMovimentacoes();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const produtoId = document.getElementById("produtoMov").value;
    const tipo = document.getElementById("tipoMov").value;
    const quantidade = Number(document.getElementById("quantidadeMov").value);
    const observacao = document.getElementById("obsMov").value.trim();

    if (!produtoId) {
      alert("Cadastre um Equipamento antes de registrar movimentações.");
      return;
    }

    let ok = false;

    if (editandoMovimentacaoId) {
      ok = atualizarMovimentacao(
        editandoMovimentacaoId,
        produtoId,
        tipo,
        quantidade,
        observacao
      );
    } else {
      ok = registrarMovimentacao(produtoId, tipo, quantidade, observacao);
    }

    if (!ok) return;

    form.reset();
    document.getElementById("quantidadeMov").value = 1;
    editandoMovimentacaoId = null;

    if (btnSalvarMov) btnSalvarMov.textContent = "Registrar";
    if (modoEdicaoMov) modoEdicaoMov.style.display = "none";

    refreshAll();
  });
}

// ============================================
// ALOCAÇÕES
// ============================================

const filtroSetor = document.getElementById("filtroSetor");

function preencherFiltroSetores(lista) {
  if (!filtroSetor) return;

  const setoresUnicos = [...new Set(
    lista.map(item => (item.setor || "").trim()).filter(Boolean)
  )];

  filtroSetor.innerHTML = '<option value="todos">Todos os setores</option>';

  setoresUnicos.forEach((setor) => {
    const option = document.createElement("option");
    option.value = setor;
    option.textContent = setor;
    filtroSetor.appendChild(option);
  });
}

function renderTabelaAlocacoes() {
  const container = document.getElementById("tabelaAlocacoes");
  if (!container) return;

  const setorSelecionado = filtroSetor?.value || "todos";

  let lista = [...alocacoes];

  if (setorSelecionado !== "todos") {
    lista = lista.filter(item => item.setor === setorSelecionado);
  }

  if (!lista.length) {
    container.innerHTML = `<div class="empty">Nenhuma alocação encontrada.</div>`;
    return;
  }

      <table>
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Setor</th>
            <th>Equipamento</th>
            <th>Modelo</th>
            <th>Especificações</th>
            <th>AnyDesk</th>
            <th>Observação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((item) => `
            <tr>
              <td>${item.colaborador || "-"}</td>
              <td>${item.setor || "-"}</td>
              <td>${item.equipamento || "-"}</td>
              <td>${item.modelo || "-"}</td>
              <td>${item.especificacoes || "-"}</td>
              <td>${item.anydesk || "-"}</td>
              <td>${item.observacao || "-"}</td>
              <td>
                <button class="btn btn-secondary" onclick="editarAlocacao('${item.id}')">Editar</button>
                <button class="btn btn-secondary" onclick="excluirAlocacao('${item.id}')">Excluir</button>
              </td>
            </tr>
          `).join("")}
  `;
}

function registrarHistoricoAlocacao({ tipoAcao, colaborador, setor, equipamento, modelo, especificacoes, anydesk, observacao }) {
  const agora = new Date();

  historicoAlocacoes.push({
    id: gerarId(),
    tipoAcao,
    colaborador,
    setor,
    equipamento,
    modelo,
    especificacoes,
    anydesk,
    observacao,
    data: agora.toLocaleString("pt-BR"),
    dataISO: agora.toISOString(),
    dataFiltro: agora.toISOString().split("T")[0]
  });
  salvarHistoricoAlocacoes();
}

function editarAlocacao(id) {
  const item = alocacoes.find((a) => String(a.id) === String(id));
  if (!item) return;

  document.getElementById("colaborador").value = item.colaborador || "";
  document.getElementById("setor").value = item.setor || "";
  document.getElementById("equipamento").value = item.equipamento || "";
  document.getElementById("modeloAloc").value = item.modelo || "";
  document.getElementById("especificacoes").value = item.especificacoes || "";
  document.getElementById("anydesk").value = item.anydesk || "";
  document.getElementById("observacao").value = item.observacao || "";

  editandoAlocacaoId = item.id;

  const btnSalvarAloc = document.getElementById("btnSalvarAloc");
  const modoEdicaoAloc = document.getElementById("modoEdicaoAloc");

  if (btnSalvarAloc) btnSalvarAloc.textContent = "Salvar edição";
  if (modoEdicaoAloc) modoEdicaoAloc.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirAlocacao(id) {
  const confirmar = confirm("Deseja excluir esta alocação?");
  if (!confirmar) return;

  const item = alocacoes.find((a) => String(a.id) === String(id));
  if (!item) return;

  registrarHistoricoAlocacao({
    tipoAcao: "exclusao",
    colaborador: item.colaborador,
    setor: item.setor,
    equipamento: item.equipamento,
    modelo: item.modelo,
    especificacoes: item.especificacoes,
    anydesk: item.anydesk,
    observacao: item.observacao
  });

  alocacoes = alocacoes.filter((a) => String(a.id) !== String(id));
  salvarAlocacoes();

  refreshAll();
}

function renderTabelaHistoricoAlocacoes() {
  const container = document.getElementById("tabelaHistoricoAlocacoes");
  if (!container) return;

  const filtroColaborador = document.getElementById("filtroColaboradorAloc")?.value.toLowerCase().trim() || "";
  const filtroSetorVal = document.getElementById("filtroSetorAloc")?.value.toLowerCase().trim() || "";
  const filtroEquipamento = document.getElementById("filtroEquipamentoAloc")?.value.toLowerCase().trim() || "";
  const filtroData = document.getElementById("filtroDataAloc")?.value || "";

  let lista = [...historicoAlocacoes];

  lista.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));

  lista = lista.filter((item) => {
    const colaborador = (item.colaborador || "").toLowerCase();
    const setor = (item.setor || "").toLowerCase();
    const equipamento = (item.equipamento || "").toLowerCase();
    const data = item.dataFiltro || "";

    const atendeColaborador = !filtroColaborador || colaborador.includes(filtroColaborador);
    const atendeSetor = !filtroSetorVal || setor.includes(filtroSetorVal);
    const atendeEquipamento = !filtroEquipamento || equipamento.includes(filtroEquipamento);
    const atendeData = !filtroData || data === filtroData;

    return atendeColaborador && atendeSetor && atendeEquipamento && atendeData;
  });

  if (!lista.length) {
    container.innerHTML = `<div class="empty">Nenhum histórico encontrado.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Ação</th>
            <th>Colaborador</th>
            <th>Setor</th>
            <th>Equipamento</th>
            <th>Modelo</th>
            <th>AnyDesk</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((item) => `
            <tr>
              <td>${item.data}</td>
              <td>
                <span class="status ${item.tipoAcao === "cadastro"
                  ? "ok"
                  : item.tipoAcao === "edicao"
                    ? "low"
                    : "danger"
                }">
                  ${item.tipoAcao === "cadastro"
                    ? "Cadastro"
                    : item.tipoAcao === "edicao"
                      ? "Edição"
                      : "Exclusão"
                  }
                </span>
              </td>
              <td>${item.colaborador || "-"}</td>
              <td>${item.setor || "-"}</td>
              <td>${item.equipamento || "-"}</td>
              <td>${item.modelo || "-"}</td>
              <td>${item.anydesk || "-"}</td>
              <td>${item.observacao || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
  `;
}

function initAlocacoesPage() {
  const form = document.getElementById("alocacaoForm");
  if (!form) return;

  const filtroColaboradorAloc = document.getElementById("filtroColaboradorAloc");
  const filtroSetorAloc = document.getElementById("filtroSetorAloc");
  const filtroEquipamentoAloc = document.getElementById("filtroEquipamentoAloc");
  const filtroDataAloc = document.getElementById("filtroDataAloc");
  const limparFiltrosAloc = document.getElementById("limparFiltrosAloc");

  const cancelarEdicaoAloc = document.getElementById("cancelarEdicaoAloc");
  const btnSalvarAloc = document.getElementById("btnSalvarAloc");
  const modoEdicaoAloc = document.getElementById("modoEdicaoAloc");

  filtroColaboradorAloc?.addEventListener("input", renderTabelaHistoricoAlocacoes);
  filtroSetorAloc?.addEventListener("input", renderTabelaHistoricoAlocacoes);
  filtroEquipamentoAloc?.addEventListener("input", renderTabelaHistoricoAlocacoes);
  filtroDataAloc?.addEventListener("input", renderTabelaHistoricoAlocacoes);

  limparFiltrosAloc?.addEventListener("click", () => {
    if (filtroColaboradorAloc) filtroColaboradorAloc.value = "";
    if (filtroSetorAloc) filtroSetorAloc.value = "";
    if (filtroEquipamentoAloc) filtroEquipamentoAloc.value = "";
    if (filtroDataAloc) filtroDataAloc.value = "";

    preencherFiltroSetores(alocacoes);
    filtroSetor?.addEventListener("change", renderTabelaAlocacoes);

    renderTabelaHistoricoAlocacoes();
  });

  cancelarEdicaoAloc?.addEventListener("click", () => {
    form.reset();
    editandoAlocacaoId = null;

    if (btnSalvarAloc) btnSalvarAloc.textContent = "Salvar alocação";
    if (modoEdicaoAloc) modoEdicaoAloc.style.display = "none";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const dados = {
      colaborador: document.getElementById("colaborador").value.trim(),
      setor: document.getElementById("setor").value.trim(),
      equipamento: document.getElementById("equipamento").value.trim(),
      modelo: document.getElementById("modeloAloc").value.trim(),
      especificacoes: document.getElementById("especificacoes").value.trim(),
      anydesk: document.getElementById("anydesk").value.trim(),
      observacao: document.getElementById("observacao").value.trim()
    };

    if (editandoAlocacaoId) {
      // Atualizar alocação existente
      const index = alocacoes.findIndex((a) => String(a.id) === String(editandoAlocacaoId));
      if (index !== -1) {
        alocacoes[index] = {
          ...alocacoes[index],
          ...dados
        };
      }

      registrarHistoricoAlocacao({
        tipoAcao: "edicao",
        ...dados
      });
    } else {
      // Criar nova alocação
      alocacoes.push({
        id: gerarId(),
        ...dados
      });

      registrarHistoricoAlocacao({
        tipoAcao: "cadastro",
        ...dados
      });
    }

    salvarAlocacoes();

    form.reset();
    editandoAlocacaoId = null;

    if (btnSalvarAloc) btnSalvarAloc.textContent = "Salvar alocação";
    if (modoEdicaoAloc) modoEdicaoAloc.style.display = "none";

    refreshAll();
  });

  preencherFiltroSetores(alocacoes);
  filtroSetor?.addEventListener("change", renderTabelaAlocacoes);

  renderTabelaAlocacoes();
  renderTabelaHistoricoAlocacoes();
  iniciarMenuExportacao();
}

// ============================================
// RELATÓRIOS
// ============================================

function renderTabelaRelatorios() {
  const container = document.getElementById("tabelaRelatorios");
  if (!container) return;

  if (!produtos.length) {
    container.innerHTML = `<div class="empty">Nenhum Equipamento cadastrado.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Valor unitário</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${produtos.map((item) => {
            const total = Number(item.quantidade) * Number(item.valor);
            const baixo = Number(item.quantidade) <= Number(item.minimo);

            return `
              <tr>
                <td class="produto-nome">${item.nome}</td>
                <td>${item.modelo || "-"}</td>
                <td>${item.quantidade}</td>
                <td>${item.minimo}</td>
                <td>${formatarMoeda(item.valor)}</td>
                <td>${formatarMoeda(total)}</td>
                <td>
                  <span class="status ${baixo ? "low" : "ok"}">
                    ${baixo ? "Estoque baixo" : "Normal"}
                  </span>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTabelaCategorias() {
  const container = document.getElementById("tabelaCategorias");
  if (!container) return;

  if (!produtos.length) {
    container.innerHTML = `<div class="empty">Nenhum equipamento cadastrado.</div>`;
    return;
  }

  const agrupamentoMap = {};

  produtos.forEach((item) => {
    const equipamento = item.nome?.trim() || "Sem equipamento";
    const modelo = item.modelo?.trim() || "Sem modelo";
    const chave = `${equipamento}__${modelo}`;

    if (!agrupamentoMap[chave]) {
      agrupamentoMap[chave] = {
        equipamento,
        modelo,
        quantidade: 0,
        valorTotal: 0
      };
    }

    agrupamentoMap[chave].quantidade += Number(item.quantidade);
    agrupamentoMap[chave].valorTotal += Number(item.quantidade) * Number(item.valor);
  });

  const agrupados = Object.values(agrupamentoMap).sort(
    (a, b) => b.quantidade - a.quantidade
  );

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Modelo</th>
            <th>Quantidade total</th>
            <th>Valor total</th>
          </tr>
        </thead>
        <tbody>
          ${agrupados.map((item) => `
            <tr>
              <td class="produto-nome">${item.equipamento}</td>
              <td>${item.modelo}</td>
              <td>${item.quantidade}</td>
              <td>${formatarMoeda(item.valorTotal)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTabelaMaiorSaida() {
  const container = document.getElementById("tabelaMaiorSaida");
  if (!container) return;

  const saidas = movimentacoes.filter((mov) => mov.tipo === "saida");

  if (!saidas.length) {
    container.innerHTML = `<div class="empty">Ainda não há movimentações de saída registradas.</div>`;
    return;
  }

  const saidaMap = {};

  saidas.forEach((mov) => {
    if (!saidaMap[mov.produtoId]) {
      saidaMap[mov.produtoId] = {
        produtoId: mov.produtoId,
        produtoNome: mov.produtoNome,
        quantidadeSaida: 0
      };
    }

    saidaMap[mov.produtoId].quantidadeSaida += Number(mov.quantidade);
  });

  const ranking = Object.values(saidaMap).sort(
    (a, b) => b.quantidadeSaida - a.quantidadeSaida
  );

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Equipamento</th>
            <th>Total de saída</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td class="produto-nome">${item.produtoNome}</td>
              <td>${item.quantidadeSaida}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function exportarParaCSV() {
  if (!produtos.length) {
    alert("Não há equipamentos para exportar.");
    return;
  }

  const cabecalho = [
    "Equipamento",
    "Modelo",
    "Quantidade",
    "Estoque Mínimo",
    "Valor Unitário",
    "Valor Total"
  ];

  const linhas = produtos.map((item) => [
    item.nome || "",
    item.modelo || "",
    item.quantidade || 0,
    item.minimo || 0,
    item.valor || 0,
    (Number(item.quantidade || 0) * Number(item.valor || 0)).toFixed(2)
  ]);

  const csv = [cabecalho, ...linhas]
    .map((linha) =>
      linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "estoque.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function initRelatoriosPage() {
  const exportarCsv = document.getElementById("exportarCsv");
  const imprimirPdf = document.getElementById("imprimirPdf");

  renderTabelaRelatorios();
  renderTabelaCategorias();
  renderTabelaMaiorSaida();

  exportarCsv?.addEventListener("click", exportarParaCSV);
  imprimirPdf?.addEventListener("click", () => window.print());
}

// ============================================
// EXPORTAÇÃO (PDF E EXCEL)
// ============================================

function iniciarMenuExportacao() {
  const btnExportarRelatorio = document.getElementById("btnExportarRelatorio");
  const menuExportacao = document.getElementById("menuExportacao");
  const btnExportarPDF = document.getElementById("btnExportarPDF");
  const btnExportarCSV = document.getElementById("btnExportarCSV");

  if (!btnExportarRelatorio || !menuExportacao || !btnExportarPDF || !btnExportarCSV) {
    return;
  }

  btnExportarRelatorio.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.toggle("hidden");
  });

  btnExportarPDF.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.add("hidden");
    gerarRelatorio();
  });

  btnExportarCSV.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.add("hidden");
    exportarParaCSV();
  });

  document.addEventListener("click", (e) => {
    const clicouFora =
      !btnExportarRelatorio.contains(e.target) &&
      !menuExportacao.contains(e.target);

    if (clicouFora) {
      menuExportacao.classList.add("hidden");
    }
  });
}

function gerarRelatorio() {
  if (typeof window.jspdf === "undefined") {
    alert("Biblioteca jsPDF não carregada.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  doc.setFontSize(16);
  doc.text("Relatório de Equipamentos", 10, y);
  y += 10;

  let lista = [...alocacoes];

  const setorSelecionado = document.getElementById("filtroSetor")?.value || "todos";

  if (setorSelecionado !== "todos") {
    lista = lista.filter(item => item.setor === setorSelecionado);
  }

  if (!lista.length) {
    doc.setFontSize(11);
    doc.text("Nenhum registro encontrado para exportação.", 10, y);
    doc.save("relatorio.pdf");
    return;
  }

  doc.setFontSize(10);

  lista.forEach((item) => {
    const linhas = [
      `Colaborador: ${item.colaborador || "-"}`,
      `Setor: ${item.setor || "-"}`,
      `Equipamento: ${item.equipamento || "-"}`,
      `Modelo: ${item.modelo || "-"}`,
      `Especificações: ${item.especificacoes || "-"}`,
      `AnyDesk: ${item.anydesk || "-"}`,
      `Observação: ${item.observacao || "-"}`
    ];

    linhas.forEach((linha) => {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }

      doc.text(linha, 10, y);
      y += 6;
    });

    y += 4;
  });

  doc.save("relatorio.pdf");
}

function exportarMovimentacoesExcel() {
  if (typeof XLSX === "undefined") {
    alert("Biblioteca XLSX não carregada.");
    return;
  }

  if (!movimentacoes || movimentacoes.length === 0) {
    alert("Nenhuma movimentação encontrada para exportar.");
    return;
  }

  const dados = movimentacoes.map((item) => ({
    Data: formatarDataExcel(item.data || item.dataISO),
    Tipo: item.tipo || "",
    Equipamento: item.produtoNome || item.equipamento || "",
    Modelo: item.modelo || "",
    Quantidade: item.quantidade || "",
    Observação: item.observacao || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(dados);

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 22 },
    { wch: 12 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimentações");
  XLSX.writeFile(workbook, "movimentacoes_estoque.xlsx");
}

function formatarDataExcel(data) {
  if (!data) return "";

  let d;

  if (typeof data === "number") {
    d = new Date(data);
  } else if (typeof data === "string") {
    if (!isNaN(data.trim())) {
      d = new Date(Number(data));
    } else {
      const match = data.match(
        /^(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})(?::(\d{2}))?$/
      );

      if (match) {
        const [, dia, mes, ano, hora, minuto, segundo = "00"] = match;
        d = new Date(
          Number(ano),
          Number(mes) - 1,
          Number(dia),
          Number(hora),
          Number(minuto),
          Number(segundo)
        );
      } else {
        d = new Date(data);
      }
    }
  }

  if (!d || isNaN(d.getTime())) return "";

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const minuto = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

// ============================================
// ============================================

function refreshAll() {
  carregarDados();
  atualizarCards();
  renderDashboardLowStock();
  renderTabelaProdutos();
  renderSelectProdutosMov();
  renderFiltroProdutosMov();
  renderTabelaMovimentacoes();
  renderTabelaAlocacoes();
  renderTabelaHistoricoAlocacoes();
  renderTabelaRelatorios();
  renderTabelaCategorias();
  renderTabelaMaiorSaida();
  renderDashboardCharts();
  renderHomeUltimasMovimentacoes();
}

function init() {
  atualizarMenuAtivo();
  carregarDados();
  atualizarCards();
  renderDashboardLowStock();
  renderDashboardCharts();
  renderHomeUltimasMovimentacoes();
  initProdutosPage();
  initMovimentacoesPage();
  initAlocacoesPage();
  initRelatoriosPage();
}

// Inicia o sistema quando a página carregar
document.addEventListener("DOMContentLoaded", init);
// ============================================
// SISTEMA DE ESTOQUE TI - COM SUPABASE
// ============================================

// Configuração do Supabase
const SUPABASE_URL = 'https://iutunkefrzmyqzmrcbwa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Qe_echN1xLvD3sAWbBt1_Q_TpspdlX4';

// Cliente Supabase
let supabaseClient = null;

// Variáveis globais
let produtos = [];
let movimentacoes = [];
let editandoMovimentacaoId = null;

// ============================================
// INICIALIZAÇÃO DO SUPABASE
// ============================================

function initSupabase() {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  console.error('Biblioteca Supabase não carregada!');
  return false;
}

// ============================================
// FUNÇÕES DO BANCO DE DADOS (SUPABASE)
// ============================================

async function carregarDados() {
  if (!supabaseClient) return;

  try {
    // Carrega produtos/equipamentos
    const { data: produtosData, error: produtosError } = await supabaseClient
      .from('equipamentos')
      .select('*')
      .order('id', { ascending: true });

    if (produtosError) throw produtosError;
    produtos = (produtosData || []).map(p => ({
      id: p.id,
      nome: p.nome,
      modelo: p.categoria,
      quantidade: p.quantidade,
      minimo: p.quantidade_minima,
      valor: p.preco,
      localizacao: p.localizacao,
      descricao: p.descricao
    }));

    // Carrega movimentações
    const { data: movData, error: movError } = await supabaseClient
      .from('movimentacoes')
      .select('*, equipamentos(nome, categoria)')
      .order('data', { ascending: false });

    if (movError) throw movError;
    movimentacoes = (movData || []).map(m => ({
      id: m.id,
      produtoId: m.equipamento_id,
      produtoNome: m.equipamentos?.nome || '',
      equipamento: m.equipamentos?.nome || '',
      modelo: m.equipamentos?.categoria || '',
      tipo: m.tipo,
      quantidade: m.quantidade,
      observacao: m.motivo,
      responsavel: m.responsavel,
      data: new Date(m.data).toLocaleString('pt-BR'),
      dataISO: m.data,
      dataFiltro: m.data.split('T')[0]
    }));

    // Carrega alocações
    const { data: alocData, error: alocError } = await supabaseClient
      .from('alocacoes')
      .select('*, equipamentos(nome, categoria)')
      .order('data_alocacao', { ascending: false });

    if (alocError) throw alocError;
    alocacoes = (alocData || []).map(a => ({
      id: a.id,
      produtoId: a.equipamento_id,
      produtoNome: a.equipamentos?.nome || '',
      equipamento: a.equipamentos?.nome || '',
      modelo: a.equipamentos?.categoria || '',
      responsavel: a.responsavel,
      setor: a.setor,
      quantidade: a.quantidade,
      status: a.status,
      observacoes: a.observacoes,
      dataAlocacao: a.data_alocacao,
      dataDevolucao: a.data_devolucao,
      data: new Date(a.data_alocacao).toLocaleString('pt-BR')
    }));

    // Carrega histórico de alocações
    const { data: histData, error: histError } = await supabaseClient
      .from('historico_alocacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (histError) throw histError;
    historicoAlocacoes = histData || [];

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

async function salvarProduto(produto) {
  if (!supabaseClient) return null;

  const dadosSupabase = {
    nome: produto.nome,
    categoria: produto.modelo,
    quantidade: produto.quantidade,
    quantidade_minima: produto.minimo,
    preco: produto.valor,
    localizacao: produto.localizacao || '',
    descricao: produto.descricao || ''
  };

  try {
    if (produto.id && !String(produto.id).includes('-')) {
      // Atualizar existente
      const { data, error } = await supabaseClient
        .from('equipamentos')
        .update({ ...dadosSupabase, updated_at: new Date().toISOString() })
        .eq('id', produto.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo
      const { data, error } = await supabaseClient
        .from('equipamentos')
        .insert([dadosSupabase])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    return null;
  }
}

async function excluirProdutoDB(id) {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient
      .from('equipamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return false;
  }
}

async function salvarMovimentacaoDB(movimentacao) {
  if (!supabaseClient) return null;

  const dadosSupabase = {
    equipamento_id: movimentacao.produtoId,
    tipo: movimentacao.tipo,
    quantidade: movimentacao.quantidade,
    motivo: movimentacao.observacao || '',
    responsavel: movimentacao.responsavel || '',
    data: movimentacao.dataISO || new Date().toISOString()
  };

  try {
    const { data, error } = await supabaseClient
      .from('movimentacoes')
      .insert([dadosSupabase])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar movimentação:', error);
    return null;
  }
}

async function atualizarMovimentacaoDB(id, movimentacao) {
  if (!supabaseClient) return null;

  const dadosSupabase = {
    equipamento_id: movimentacao.produtoId,
    tipo: movimentacao.tipo,
    quantidade: movimentacao.quantidade,
    motivo: movimentacao.observacao || '',
    responsavel: movimentacao.responsavel || ''
  };

  try {
    const { data, error } = await supabaseClient
      .from('movimentacoes')
      .update(dadosSupabase)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar movimentação:', error);
    return null;
  }
}

async function excluirMovimentacaoDB(id) {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient
      .from('movimentacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error);
    return false;
  }
}

async function atualizarQuantidadeProduto(produtoId, novaQuantidade) {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient
      .from('equipamentos')
      .update({ quantidade: novaQuantidade, updated_at: new Date().toISOString() })
      .eq('id', produtoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    return false;
  }
}

async function salvarAlocacaoDB(alocacao) {
  if (!supabaseClient) return null;

  const dadosSupabase = {
    equipamento_id: alocacao.produtoId,
    responsavel: alocacao.responsavel,
    setor: alocacao.setor || '',
    quantidade: alocacao.quantidade || 1,
    data_alocacao: alocacao.dataAlocacao || new Date().toISOString(),
    status: 'ativo',
    observacoes: alocacao.observacoes || ''
  };

  try {
    const { data, error } = await supabaseClient
      .from('alocacoes')
      .insert([dadosSupabase])
      .select()
      .single();

    if (error) throw error;

    // Registra no histórico
    await registrarHistoricoAlocacao({
      alocacao_id: data.id,
      equipamento_id: alocacao.produtoId,
      equipamento_nome: alocacao.produtoNome || '',
      responsavel: alocacao.responsavel,
      setor: alocacao.setor,
      quantidade: alocacao.quantidade,
      data_alocacao: dadosSupabase.data_alocacao,
      acao: 'alocado'
    });

    return data;
  } catch (error) {
    console.error('Erro ao salvar alocação:', error);
    return null;
  }
}

async function atualizarAlocacaoDB(id, alocacao) {
  if (!supabaseClient) return null;

  const dadosSupabase = {
    equipamento_id: alocacao.produtoId,
    responsavel: alocacao.responsavel,
    setor: alocacao.setor || '',
    quantidade: alocacao.quantidade || 1,
    observacoes: alocacao.observacoes || ''
  };

  try {
    const { data, error } = await supabaseClient
      .from('alocacoes')
      .update(dadosSupabase)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error);
    return null;
  }
}

async function devolverAlocacaoDB(id) {
  if (!supabaseClient) return false;

  try {
    // Busca a alocação atual
    const alocacao = alocacoes.find(a => a.id === id);

    const { error } = await supabaseClient
      .from('alocacoes')
      .update({
        status: 'devolvido',
        data_devolucao: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Registra no histórico
    if (alocacao) {
      await registrarHistoricoAlocacao({
        alocacao_id: id,
        equipamento_id: alocacao.produtoId,
        equipamento_nome: alocacao.produtoNome || '',
        responsavel: alocacao.responsavel,
        setor: alocacao.setor,
        quantidade: alocacao.quantidade,
        data_alocacao: alocacao.dataAlocacao,
        data_devolucao: new Date().toISOString(),
        acao: 'devolvido'
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao devolver alocação:', error);
    return false;
  }
}

async function excluirAlocacaoDB(id) {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient
      .from('alocacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir alocação:', error);
    return false;
  }
}

async function registrarHistoricoAlocacao(historico) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from('historico_alocacoes')
      .insert([historico])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao registrar histórico:', error);
    return null;
  }
}

// ============================================
  });
}

function mostrarLoading(mostrar = true) {
  let loader = document.getElementById('loading-overlay');
  
  if (mostrar) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'loading-overlay';
      loader.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        ">
          <div style="
            background: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
          ">Carregando...</div>
        </div>
      `;
      document.body.appendChild(loader);
    }
  } else {
    if (loader) loader.remove();
  }
}

function mostrarMensagem(texto, tipo = 'success') {
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    background-color: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#f59e0b'};
  `;
  msg.textContent = texto;
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.style.opacity = '0';
    setTimeout(() => msg.remove(), 300);
  }, 3000);
}

// ============================================
// DASHBOARD - CARDS E GRÁFICOS
// ============================================
  const modoEdicaoProduto = document.getElementById("modoEdicaoProduto");

  if (!nome) {
    window.location.href = "equipamentos.html";
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirProduto(id) {
  const confirmar = confirm("Deseja realmente excluir este Equipamento?");
  if (!confirmar) return;

  mostrarLoading(true);
  
  const sucesso = await excluirProdutoDB(id);
  
  if (sucesso) {
    mostrarMensagem('Equipamento excluído com sucesso!');
    await carregarDados();
    refreshAll();
  } else {
    mostrarMensagem('Erro ao excluir equipamento', 'error');
  }
  
  mostrarLoading(false);
}

function initProdutosPage() {

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
      return;
    }

    mostrarLoading(true);

    const produto = {
      id: editandoId || null,
      nome,
      modelo,
      quantidade,
      minimo,
      valor
    };

    const resultado = await salvarProduto(produto);

    if (resultado) {
      mostrarMensagem(editandoId ? 'Equipamento atualizado!' : 'Equipamento cadastrado!');
      limparFormularioProduto();
      await carregarDados();
      refreshAll();
    } else {
      mostrarMensagem('Erro ao salvar equipamento', 'error');
    }

    mostrarLoading(false);
  });

  busca?.addEventListener("input", renderTabelaProdutos);
    .join("");
}

async function registrarMovimentacao(produtoId, tipo, quantidade, observacao = "") {
  const produto = produtos.find((item) => String(item.id) === String(produtoId));
  if (!produto) return false;


  const agora = new Date();

  // Atualiza quantidade do produto no banco
  await atualizarQuantidadeProduto(produtoId, novaQuantidade);

  // Registra movimentação no banco
  const movimentacao = {
    produtoId,
    produtoNome: produto.nome || "",
    tipo,
    quantidade,
    observacao,
    dataISO: agora.toISOString()
  };

  const resultado = await salvarMovimentacaoDB(movimentacao);
  return resultado !== null;
}

function renderTabelaMovimentacoes() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicaoMovimentacao() {
  editandoMovimentacaoId = null;
  document.getElementById("movForm").reset();
  document.getElementById("btnSalvarMov").textContent = "Registrar movimentação";
  document.getElementById("modoEdicaoMov").style.display = "none";
}

async function excluirMovimentacao(id) {
  if (!confirm("Deseja realmente excluir esta movimentação?")) return;

  mostrarLoading(true);
  
  const sucesso = await excluirMovimentacaoDB(id);
  
  if (sucesso) {
    mostrarMensagem('Movimentação excluída!');
    await carregarDados();
    refreshAll();
  } else {
    mostrarMensagem('Erro ao excluir movimentação', 'error');
  }
  
  mostrarLoading(false);
}

function initMovimentacoesPage() {
  const form = document.getElementById("movForm");
  const filtroDataInicial = document.getElementById("filtroDataInicial");
  const filtroDataFinal = document.getElementById("filtroDataFinal");
  const filtroProdutoMov = document.getElementById("filtroProdutoMov");
  const cancelarEdicaoBtn = document.getElementById("cancelarEdicaoMov");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const produtoId = document.getElementById("produtoMov").value;
    const tipo = document.getElementById("tipoMov").value;
    const quantidade = Number(document.getElementById("quantidadeMov").value);
    const observacao = document.getElementById("obsMov").value;

    if (!produtoId || !tipo || !quantidade) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    mostrarLoading(true);

    let sucesso = false;

    if (editandoMovimentacaoId) {
      // Atualizar movimentação existente
      const resultado = await atualizarMovimentacaoDB(editandoMovimentacaoId, {
        produtoId,
        tipo,
        quantidade,
        observacao
      });
      sucesso = resultado !== null;
    } else {
      // Nova movimentação
      sucesso = await registrarMovimentacao(produtoId, tipo, quantidade, observacao);
    }

    if (sucesso) {
      mostrarMensagem(editandoMovimentacaoId ? 'Movimentação atualizada!' : 'Movimentação registrada!');
      cancelarEdicaoMovimentacao();
      await carregarDados();
      refreshAll();
    } else {
      mostrarMensagem('Erro ao salvar movimentação', 'error');
    }

    mostrarLoading(false);
  });

  filtroDataInicial?.addEventListener("change", renderTabelaMovimentacoes);
  filtroDataFinal?.addEventListener("change", renderTabelaMovimentacoes);
  filtroProdutoMov?.addEventListener("change", renderTabelaMovimentacoes);
  cancelarEdicaoBtn?.addEventListener("click", cancelarEdicaoMovimentacao);

  renderSelectProdutosMov();
  renderFiltroProdutosMov();
  renderTabelaMovimentacoes();
}

// ============================================
// ALOCAÇÕES
// ============================================

function renderSelectProdutosAlocacao() {
  const select = document.getElementById("produtoAlocacao");
  if (!select) return;

  const disponiveis = produtos.filter((item) => Number(item.quantidade) > 0);

  if (!disponiveis.length) {
    select.innerHTML = `<option value="">Nenhum equipamento disponível</option>`;
    return;
  }

  select.innerHTML = disponiveis
    .map(
      (item) =>
        `<option value="${item.id}">${item.nome} (${item.quantidade} disponíveis)</option>`
    )
    .join("");
}

function limparFormularioAlocacao() {
  const form = document.getElementById("alocacaoForm");
  const formTitle = document.getElementById("formTitleAlocacao");
  const btnSalvar = document.getElementById("btnSalvarAlocacao");
  const modoEdicao = document.getElementById("modoEdicaoAlocacao");

  if (form) form.reset();
  if (formTitle) formTitle.textContent = "Nova Alocação";
  if (btnSalvar) btnSalvar.textContent = "Registrar Alocação";
  if (modoEdicao) modoEdicao.style.display = "none";

  editandoAlocacaoId = null;
}

function renderTabelaAlocacoes() {
  const container = document.getElementById("tabelaAlocacoes");
  if (!container) return;

  const ativas = alocacoes.filter((a) => a.status === "ativo");

  if (!ativas.length) {
    container.innerHTML = `<div class="empty">Nenhuma alocação ativa no momento.</div>`;
    return;
  }

      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Responsável</th>
            <th>Setor</th>
            <th>Quantidade</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${ativas.map((aloc) => `
            <tr>
              <td class="produto-nome">${aloc.produtoNome || aloc.equipamento}</td>
              <td>${aloc.responsavel}</td>
              <td>${aloc.setor || "-"}</td>
              <td>${aloc.quantidade || 1}</td>
              <td>${aloc.data}</td>
              <td>
                <button class="btn btn-secondary" onclick="editarAlocacao('${aloc.id}')">Editar</button>
                <button class="btn btn-primary" onclick="devolverAlocacao('${aloc.id}')">Devolver</button>
                <button class="btn btn-secondary" onclick="excluirAlocacao('${aloc.id}')">Excluir</button>
              </td>
            </tr>
          `).join("")}
  `;
}

function renderHistoricoAlocacoes() {
  const container = document.getElementById("historicoAlocacoes");
  if (!container) return;

  if (!historicoAlocacoes.length) {
    container.innerHTML = `<div class="empty">Nenhum histórico de alocações.</div>`;
    return;
  }

  const ultimos = [...historicoAlocacoes].slice(0, 20);

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Responsável</th>
            <th>Setor</th>
            <th>Ação</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${ultimos.map((hist) => `
            <tr>
              <td class="produto-nome">${hist.equipamento_nome}</td>
              <td>${hist.responsavel}</td>
              <td>${hist.setor || "-"}</td>
              <td>
                <span class="status ${hist.acao === 'alocado' ? 'low' : 'ok'}">
                  ${hist.acao === 'alocado' ? 'Alocado' : 'Devolvido'}
                </span>
              </td>
              <td>${new Date(hist.created_at).toLocaleString('pt-BR')}</td>
            </tr>
          `).join("")}
        </tbody>
  `;
}

function editarAlocacao(id) {
  const aloc = alocacoes.find((a) => String(a.id) === String(id));
  if (!aloc) return;

  const produtoAlocacao = document.getElementById("produtoAlocacao");
  const responsavelAlocacao = document.getElementById("responsavelAlocacao");
  const setorAlocacao = document.getElementById("setorAlocacao");
  const quantidadeAlocacao = document.getElementById("quantidadeAlocacao");
  const observacoesAlocacao = document.getElementById("observacoesAlocacao");
  const formTitle = document.getElementById("formTitleAlocacao");
  const btnSalvar = document.getElementById("btnSalvarAlocacao");
  const modoEdicao = document.getElementById("modoEdicaoAlocacao");

  if (produtoAlocacao) produtoAlocacao.value = aloc.produtoId;
  if (responsavelAlocacao) responsavelAlocacao.value = aloc.responsavel;
  if (setorAlocacao) setorAlocacao.value = aloc.setor || "";
  if (quantidadeAlocacao) quantidadeAlocacao.value = aloc.quantidade || 1;
  if (observacoesAlocacao) observacoesAlocacao.value = aloc.observacoes || "";
  if (formTitle) formTitle.textContent = "Editar Alocação";
  if (btnSalvar) btnSalvar.textContent = "Salvar Alterações";
  if (modoEdicao) modoEdicao.style.display = "block";

  editandoAlocacaoId = aloc.id;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function devolverAlocacao(id) {
  if (!confirm("Confirma a devolução deste equipamento?")) return;

  mostrarLoading(true);
  
  const sucesso = await devolverAlocacaoDB(id);
  
  if (sucesso) {
    mostrarMensagem('Equipamento devolvido!');
    await carregarDados();
    refreshAll();
  } else {
    mostrarMensagem('Erro ao devolver equipamento', 'error');
  }
  
  mostrarLoading(false);
}

async function excluirAlocacao(id) {
  if (!confirm("Deseja realmente excluir esta alocação?")) return;

  mostrarLoading(true);
  
  const sucesso = await excluirAlocacaoDB(id);
  
  if (sucesso) {
    mostrarMensagem('Alocação excluída!');
    await carregarDados();
    refreshAll();
  } else {
    mostrarMensagem('Erro ao excluir alocação', 'error');
  }
  
  mostrarLoading(false);
}

function initAlocacoesPage() {
  const form = document.getElementById("alocacaoForm");
  const cancelarEdicaoBtn = document.getElementById("cancelarEdicaoAlocacao");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const produtoId = document.getElementById("produtoAlocacao").value;
    const responsavel = document.getElementById("responsavelAlocacao").value.trim();
    const setor = document.getElementById("setorAlocacao")?.value.trim() || "";
    const quantidade = Number(document.getElementById("quantidadeAlocacao")?.value) || 1;
    const observacoes = document.getElementById("observacoesAlocacao")?.value || "";

    if (!produtoId || !responsavel) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const produto = produtos.find((p) => String(p.id) === String(produtoId));

    mostrarLoading(true);

    let sucesso = false;

    if (editandoAlocacaoId) {
      const resultado = await atualizarAlocacaoDB(editandoAlocacaoId, {
        produtoId,
        responsavel,
        setor,
        quantidade,
        observacoes
      });
      sucesso = resultado !== null;
    } else {
      const resultado = await salvarAlocacaoDB({
        produtoId,
        produtoNome: produto?.nome || '',
        responsavel,
        setor,
        quantidade,
        observacoes
      });
      sucesso = resultado !== null;
    }

    if (sucesso) {
      mostrarMensagem(editandoAlocacaoId ? 'Alocação atualizada!' : 'Alocação registrada!');
      limparFormularioAlocacao();
      await carregarDados();
      refreshAll();
    } else {
      mostrarMensagem('Erro ao salvar alocação', 'error');
    }

    mostrarLoading(false);
  });

  cancelarEdicaoBtn?.addEventListener("click", limparFormularioAlocacao);

  renderSelectProdutosAlocacao();
  renderTabelaAlocacoes();
  renderHistoricoAlocacoes();
}

// ============================================
// RELATÓRIOS
// ============================================

function initRelatoriosPage() {
  renderRelatorioResumo();
  renderRelatorioCategorias();
  renderRelatorioMaiorSaida();
}

function renderRelatorioResumo() {
  const container = document.getElementById("relatorioResumo");
  if (!container) return;

  const totalItens = produtos.reduce((acc, p) => acc + Number(p.quantidade), 0);
  const valorTotal = produtos.reduce(
    (acc, p) => acc + Number(p.quantidade) * Number(p.valor),
    0
  );
  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === "entrada")
    .reduce((acc, m) => acc + Number(m.quantidade), 0);
  const totalSaidas = movimentacoes
    .filter((m) => m.tipo === "saida")
    .reduce((acc, m) => acc + Number(m.quantidade), 0);

  container.innerHTML = `
    <div class="resumo-grid">
      <div class="resumo-item">
        <span class="resumo-label">Total de Tipos:</span>
        <span class="resumo-valor">${produtos.length}</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-label">Total de Itens:</span>
        <span class="resumo-valor">${totalItens}</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-label">Valor Total:</span>
        <span class="resumo-valor">${formatarMoeda(valorTotal)}</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-label">Total Entradas:</span>
        <span class="resumo-valor">${totalEntradas}</span>
      </div>
      <div class="resumo-item">
        <span class="resumo-label">Total Saídas:</span>
        <span class="resumo-valor">${totalSaidas}</span>
      </div>
    </div>
  `;
}

function renderRelatorioCategorias() {
  const container = document.getElementById("relatorioCategorias");
  if (!container) return;

  const categorias = {};
  produtos.forEach((p) => {
    const cat = p.modelo || "Sem categoria";
    categorias[cat] = (categorias[cat] || 0) + Number(p.quantidade);
  });

  const lista = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

  if (!lista.length) {
    container.innerHTML = `<div class="empty">Nenhuma categoria encontrada.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="categorias-lista">
      ${lista.map(([cat, qtd]) => `
        <div class="categoria-item">
          <span class="categoria-nome">${cat}</span>
          <span class="categoria-quantidade">${qtd} itens</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRelatorioMaiorSaida() {
  const container = document.getElementById("relatorioMaiorSaida");
  if (!container) return;

  const { labels, valores } = obterDadosMaiorSaida();

  if (!labels.length) {
    container.innerHTML = `<div class="empty">Nenhuma saída registrada.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="ranking-lista">
      ${labels.map((nome, i) => `
        <div class="ranking-item">
          <span class="ranking-posicao">${i + 1}°</span>
          <span class="ranking-nome">${nome}</span>
          <span class="ranking-quantidade">${valores[i]} unidades</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================
// EXPORTAÇÃO
// ============================================

function exportarCSV() {
  const headers = ['ID', 'Nome', 'Categoria', 'Quantidade', 'Mínimo', 'Valor Unitário'];
  const rows = produtos.map(p => [
    p.id,
    p.nome,
    p.modelo || '',
    p.quantidade,
    p.minimo,
    p.valor
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  mostrarMensagem('CSV exportado com sucesso!');
}

function exportarPDF() {
  if (!window.jspdf) {
    mostrarMensagem('Biblioteca jsPDF não carregada', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Relatório de Estoque', 14, 22);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

  let y = 40;
  doc.setFontSize(12);

  produtos.forEach(p => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(`${p.nome} - ${p.modelo || 'Sem categoria'}`, 14, y);
    doc.text(`Qtd: ${p.quantidade} | Preço: ${formatarMoeda(p.valor)}`, 14, y + 6);
    y += 16;
  });

  doc.save(`estoque_${new Date().toISOString().split('T')[0]}.pdf`);

  mostrarMensagem('PDF exportado com sucesso!');
}

// ============================================
// ============================================

function refreshAll() {
  atualizarCards();
  atualizarMenuAtivo();
  renderDashboardLowStock();
  renderHomeUltimasMovimentacoes();
  renderDashboardCharts();
  renderTabelaProdutos();
  renderSelectProdutosMov();
  renderFiltroProdutosMov();
  renderTabelaMovimentacoes();
  renderSelectProdutosAlocacao();
  renderTabelaAlocacoes();
  renderHistoricoAlocacoes();
  renderRelatorioResumo();
  renderRelatorioCategorias();
  renderRelatorioMaiorSaida();
}

// Inicialização
document.addEventListener("DOMContentLoaded", async function () {
  // Inicializa Supabase
  if (!initSupabase()) {
    alert('Erro ao conectar com o banco de dados. Verifique se a biblioteca Supabase está carregada.');
    return;
  }

  // Carrega dados do banco
  mostrarLoading(true);
  await carregarDados();
  mostrarLoading(false);

  // Atualiza interface
  atualizarMenuAtivo();
  refreshAll();

  // Inicializa páginas específicas
  const pagina = document.body.dataset.page;

  if (pagina === "dashboard" || !pagina) {
    atualizarCards();
    renderDashboardLowStock();
    renderHomeUltimasMovimentacoes();
    renderDashboardCharts();
  }

  if (pagina === "equipamentos") {
    initProdutosPage();
  }

  if (pagina === "movimentacoes") {
    initMovimentacoesPage();
  }

  if (pagina === "alocacoes") {
    initAlocacoesPage();
  }

  if (pagina === "relatorios") {
    initRelatoriosPage();
  }
});
