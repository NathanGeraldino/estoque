const API_URL = "http://localhost:3000";
let produtos = [];
let movimentacoes = [];
let alocacoes = [];
let historicoAlocacoes = [];
let editandoAlocacaoId = null;
let editandoId = null;
let chartCategoriasInstance = null;
let chartSaidasInstance = null;
let chartMovimentacoesInstance = null;
let editandoMovimentacaoId = null;

async function apiGet(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Erro ao buscar ${endpoint}`);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Erro ao salvar em ${endpoint}`);
  return res.json();
}

async function apiPut(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Erro ao atualizar ${endpoint}`);
  return res.json();
}

async function apiPatch(endpoint, data) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Erro ao atualizar parcialmente ${endpoint}`);
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error(`Erro ao excluir ${endpoint}`);
  return true;
}

async function carregarDados() {
  [produtos, movimentacoes, alocacoes, historicoAlocacoes] = await Promise.all([
    apiGet("/produtos"),
    apiGet("/movimentacoes"),
    apiGet("/alocacoes"),
    apiGet("/historicoAlocacoes")
  ]);
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarMenuAtivo() {
  const pagina = document.body.dataset.page;
  document.querySelectorAll(".menu a").forEach((link) => {
    if (link.dataset.menu === pagina) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function atualizarCards() {
  const totalProdutos = document.getElementById("totalProdutos");
  const totalQuantidade = document.getElementById("totalQuantidade");
  const estoqueBaixo = document.getElementById("estoqueBaixo");
  const valorTotalEstoque = document.getElementById("valorTotalEstoque");

  if (totalProdutos) totalProdutos.textContent = produtos.length;

  if (totalQuantidade) {
    totalQuantidade.textContent = produtos.reduce(
      (acc, item) => acc + Number(item.quantidade),
      0
    );
  }

  if (estoqueBaixo) {
    estoqueBaixo.textContent = produtos.filter(
      (item) => Number(item.quantidade) <= Number(item.minimo)
    ).length;
  }

  if (valorTotalEstoque) {
    const total = produtos.reduce(
      (acc, item) => acc + Number(item.quantidade) * Number(item.valor),
      0
    );
    valorTotalEstoque.textContent = formatarMoeda(total);
  }
}

function renderDashboardLowStock() {
  const container = document.getElementById("dashboardLowStock");
  if (!container) return;

  const baixos = produtos.filter(
    (item) => Number(item.quantidade) <= Number(item.minimo)
  );

  if (!baixos.length) {
    container.innerHTML = `<div class="empty">Nenhum item com estoque baixo no momento.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipamentos</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${baixos.map((item) => `
            <tr>
              <td class="produto-nome">${item.nome}</td>
              <td>${item.modelo || "-"}</td>
              <td>${item.quantidade}</td>
              <td>${item.minimo}</td>
              <td><span class="status low">Estoque baixo</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function limparFormularioProduto() {
  const form = document.getElementById("produtoForm");
  const minimo = document.getElementById("minimo");
  const formTitle = document.getElementById("formTitle");
  const btnSalvarProduto = document.getElementById("btnSalvarProduto");
  const modoEdicaoProduto = document.getElementById("modoEdicaoProduto");

  if (form) form.reset();
  if (minimo) minimo.value = 5;
  if (formTitle) formTitle.textContent = "Cadastrar Equipamento";
  if (btnSalvarProduto) btnSalvarProduto.textContent = "Salvar equipamento";
  if (modoEdicaoProduto) modoEdicaoProduto.style.display = "none";

  editandoId = null;
}

function renderTabelaProdutos() {
  const tabela = document.getElementById("tabelaProdutos");
  const busca = document.getElementById("busca");
  if (!tabela) return;

  const termo = (busca?.value || "").toLowerCase().trim();

  const lista = produtos.filter((item) => {
    const nome = String(item.nome || "").toLowerCase();
    const modelo = String(item.modelo || "").toLowerCase();
    return nome.includes(termo) || modelo.includes(termo);
  });

  if (!lista.length) {
    tabela.innerHTML = `<div class="empty">Nenhum Equipamento encontrado.</div>`;
    return;
  }

  tabela.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Modelo</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Valor unitário</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((item) => {
    const baixo = Number(item.quantidade) <= Number(item.minimo);
    const total = Number(item.quantidade) * Number(item.valor);

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
                <td>
                  <button class="btn btn-secondary" onclick="editarProduto('${item.id}')">Editar</button>
                  <button class="btn btn-secondary" onclick="excluirProduto('${item.id}')">Excluir</button>
                </td>
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function editarProduto(id) {
  const item = produtos.find((p) => String(p.id) === String(id));
  if (!item) return;

  const nome = document.getElementById("nome");
  const modelo = document.getElementById("modelo");
  const quantidade = document.getElementById("quantidade");
  const minimo = document.getElementById("minimo");
  const valor = document.getElementById("valor");
  const formTitle = document.getElementById("formTitle");
  const btnSalvarProduto = document.getElementById("btnSalvarProduto");
  const modoEdicaoProduto = document.getElementById("modoEdicaoProduto");

  if (!nome) {
    window.location.href = "produtos.html";
    return;
  }

  editandoId = item.id;
  nome.value = item.nome || "";
  modelo.value = item.modelo || "";
  quantidade.value = item.quantidade ?? "";
  minimo.value = item.minimo ?? 5;
  valor.value = item.valor ?? "";
  formTitle.textContent = "Editar equipamento";

  if (btnSalvarProduto) btnSalvarProduto.textContent = "Salvar edição";
  if (modoEdicaoProduto) modoEdicaoProduto.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirProduto(id) {
  const confirmar = confirm("Deseja realmente excluir este Equipamento?");
  if (!confirmar) return;

  try {
    const movsProduto = movimentacoes.filter((mov) => String(mov.produtoId) === String(id));

    await apiDelete(`/produtos/${id}`);

    for (const mov of movsProduto) {
      await apiDelete(`/movimentacoes/${mov.id}`);
    }

    await refreshAll();
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir Equipamento.");
  }
}

async function initProdutosPage() {
  const form = document.getElementById("produtoForm");
  const busca = document.getElementById("busca");
  const cancelarEdicao = document.getElementById("cancelarEdicao");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const modelo = document.getElementById("modelo").value.trim();
    const quantidade = Number(document.getElementById("quantidade").value);
    const minimo = Number(document.getElementById("minimo").value);
    const valor = Number(document.getElementById("valor").value);

    if (!nome) {
      alert("Informe o equipamento.");
      return;
    }

    const produto = {
      nome,
      modelo,
      quantidade,
      minimo,
      valor
    };

    try {
      if (editandoId) {
        await apiPut(`/produtos/${editandoId}`, {
          id: editandoId,
          ...produto
        });
      } else {
        await apiPost("/produtos", produto);
      }

      limparFormularioProduto();
      await refreshAll();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar Equipamento.");
    }
  });

  busca?.addEventListener("input", renderTabelaProdutos);
  cancelarEdicao?.addEventListener("click", limparFormularioProduto);

  renderTabelaProdutos();
}

function renderSelectProdutosMov() {
  const select = document.getElementById("produtoMov");
  if (!select) return;

  if (!produtos.length) {
    select.innerHTML = `<option value="">Nenhum Equipamento cadastrado</option>`;
    return;
  }

  select.innerHTML = produtos
    .map(
      (item) =>
        `<option value="${item.id}">${item.nome} (${item.quantidade} em estoque)</option>`
    )
    .join("");
}

async function registrarMovimentacao(produtoId, tipo, quantidade, observacao = "") {
  const produto = produtos.find((item) => String(item.id) === String(produtoId));
  if (!produto) return false;

  quantidade = Number(quantidade);
  if (!quantidade || quantidade <= 0) return false;

  if (tipo === "saida" && quantidade > Number(produto.quantidade)) {
    alert("A saída não pode ser maior que a quantidade em estoque.");
    return false;
  }

  const novaQuantidade =
    tipo === "entrada"
      ? Number(produto.quantidade) + quantidade
      : Number(produto.quantidade) - quantidade;

  const agora = new Date();

  try {
    await apiPatch(`/produtos/${produtoId}`, {
      quantidade: novaQuantidade
    });

    await apiPost("/movimentacoes", {
      produtoId,
      produtoNome: produto.nome || "",
      equipamento: produto.nome || produto.equipamento || "",
      modelo:
        produto.modelo ||
        produto.modeloEquipamento ||
        produto.marcaModelo ||
        produto.descricao ||
        produto.equipamento ||
        "",
      especificacoes:
        produto.especificacoes ||
        produto.especificacao ||
        produto.especificacoesTecnicas ||
        "",
      tipo,
      quantidade,
      observacao,
      data: agora.toLocaleString("pt-BR"),
      dataISO: agora.toISOString(),
      dataFiltro: agora.toISOString().split("T")[0]
    });

    return true;
  } catch (error) {
    console.error(error);
    alert("Erro ao registrar movimentação.");
    return false;
  }
}

function renderTabelaMovimentacoes() {
  const container = document.getElementById("tabelaMovimentacoes");
  if (!container) return;

  const dataInicial = document.getElementById("filtroDataInicial")?.value || "";
  const dataFinal = document.getElementById("filtroDataFinal")?.value || "";
  const produtoFiltro = document.getElementById("filtroProdutoMov")?.value || "";

  let lista = [...movimentacoes];

  lista.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));

  lista = lista.filter((mov) => {
    const dataMov = mov.dataFiltro || "";
    const atendeDataInicial = !dataInicial || dataMov >= dataInicial;
    const atendeDataFinal = !dataFinal || dataMov <= dataFinal;
    const atendeProduto = !produtoFiltro || String(mov.produtoId) === String(produtoFiltro);

    return atendeDataInicial && atendeDataFinal && atendeProduto;
  });

  if (!lista.length) {
    container.innerHTML = `<div class="empty">Nenhuma movimentação encontrada com os filtros aplicados.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Equipamento</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Observação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((mov) => `
            <tr>
              <td>${mov.data}</td>
              <td class="produto-nome">${mov.produtoNome}</td>
              <td>
                <span class="status ${mov.tipo === "entrada" ? "ok" : "low"}">
                  ${mov.tipo === "entrada" ? "Entrada" : "Saída"}
                </span>
              </td>
              <td>${mov.quantidade}</td>
              <td>${mov.observacao || "-"}</td>
              <td>
              <button class="btn btn-secondary" onclick="editarMovimentacao('${mov.id}')">
                 Editar
               </button>
               <button class="btn btn-secondary" onclick="excluirMovimentacao('${mov.id}')">
                 Excluir
               </button>
            </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderFiltroProdutosMov() {
  const select = document.getElementById("filtroProdutoMov");
  if (!select) return;

  const valorAtual = select.value;

  select.innerHTML = `
    <option value="">Todos os equipamentos</option>
    ${produtos.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")}
  `;

  select.value = valorAtual;
}

async function initMovimentacoesPage() {
  const form = document.getElementById("movimentacaoForm");
  const cancelarEdicaoMov = document.getElementById("cancelarEdicaoMov");
  cancelarEdicaoMov?.addEventListener("click", () => {
    form.reset();
    document.getElementById("quantidadeMov").value = 1;
    editandoMovimentacaoId = null;
  });
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

    // 🔥 voltar visual normal
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

  form.addEventListener("submit", async function (e) {
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
      ok = await atualizarMovimentacao(
        editandoMovimentacaoId,
        produtoId,
        tipo,
        quantidade,
        observacao
      );
    } else {
      ok = await registrarMovimentacao(produtoId, tipo, quantidade, observacao);
    }

    if (!ok) return;

    form.reset();
    document.getElementById("quantidadeMov").value = 1;
    editandoMovimentacaoId = null;

    await refreshAll();
  });
}

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

function obterDadosCategorias() {
  const agrupamentoMap = {};

  produtos.forEach((item) => {
    const equipamento = item.nome?.trim() || "Sem equipamento";
    const modelo = item.modelo?.trim() || "Sem modelo";

    const chave = `${equipamento} - ${modelo}`;

    if (!agrupamentoMap[chave]) {
      agrupamentoMap[chave] = 0;
    }

    agrupamentoMap[chave] += Number(item.quantidade);
  });

  const agrupadosOrdenados = Object.entries(agrupamentoMap).sort(
    (a, b) => b[1] - a[1]
  );

  return {
    labels: agrupadosOrdenados.map((item) => item[0]),
    valores: agrupadosOrdenados.map((item) => item[1])
  };
}

function obterDadosMaiorSaida() {
  const saidas = movimentacoes.filter((mov) => mov.tipo === "saida");
  const saidaMap = {};

  saidas.forEach((mov) => {
    if (!saidaMap[mov.produtoNome]) saidaMap[mov.produtoNome] = 0;
    saidaMap[mov.produtoNome] += Number(mov.quantidade);
  });

  const ranking = Object.entries(saidaMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return {
    labels: ranking.map((item) => item[0]),
    valores: ranking.map((item) => item[1])
  };
}

function obterDadosEntradasSaidas() {
  const totalEntradas = movimentacoes
    .filter((mov) => mov.tipo === "entrada")
    .reduce((acc, mov) => acc + Number(mov.quantidade), 0);

  const totalSaidas = movimentacoes
    .filter((mov) => mov.tipo === "saida")
    .reduce((acc, mov) => acc + Number(mov.quantidade), 0);

  return {
    labels: ["Entradas", "Saídas"],
    valores: [totalEntradas, totalSaidas]
  };
}

function renderChartCategorias() {
  const canvas = document.getElementById("chartCategorias");
  if (!canvas || typeof Chart === "undefined") return;

  const { labels, valores } = obterDadosCategorias();

  if (chartCategoriasInstance) chartCategoriasInstance.destroy();

  chartCategoriasInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["Sem dados"],
      datasets: [{ data: valores.length ? valores : [1], borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function renderChartSaidas() {
  const canvas = document.getElementById("chartSaidas");
  if (!canvas || typeof Chart === "undefined") return;

  const { labels, valores } = obterDadosMaiorSaida();

  if (chartSaidasInstance) chartSaidasInstance.destroy();

  chartSaidasInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["Sem dados"],
      datasets: [{
        label: "Saídas",
        data: valores.length ? valores : [0],
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderChartMovimentacoes() {
  const canvas = document.getElementById("chartMovimentacoes");
  if (!canvas || typeof Chart === "undefined") return;

  const { labels, valores } = obterDadosEntradasSaidas();

  if (chartMovimentacoesInstance) chartMovimentacoesInstance.destroy();

  chartMovimentacoesInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantidade",
        data: valores,
        borderWidth: 1,
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderDashboardCharts() {
  renderChartCategorias();
  renderChartSaidas();
  renderChartMovimentacoes();
}

function renderHomeUltimasMovimentacoes() {
  const container = document.getElementById("homeUltimasMovimentacoes");
  if (!container) return;

  if (!movimentacoes.length) {
    container.innerHTML = `<div class="empty">Nenhuma movimentação registrada ainda.</div>`;
    return;
  }

  const ultimas = movimentacoes.slice(0, 5);

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Equipamento</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          ${ultimas.map((mov) => `
            <tr>
              <td>${mov.data}</td>
              <td class="produto-nome">${mov.produtoNome}</td>
              <td>
                <span class="status ${mov.tipo === "entrada" ? "ok" : "low"}">
                  ${mov.tipo === "entrada" ? "Entrada" : "Saída"}
                </span>
              </td>
              <td>${mov.quantidade}</td>
              <td>${mov.observacao || "-"}</td>
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

async function refreshAll() {
  await carregarDados();
  atualizarCards();
  renderDashboardLowStock();
  renderTabelaProdutos();
  renderSelectProdutosMov();
  renderFiltroProdutosMov();
  renderTabelaMovimentacoes();
  renderTabelaRelatorios();
  renderTabelaCategorias();
  renderTabelaMaiorSaida();
  renderDashboardCharts();
  renderHomeUltimasMovimentacoes();
}

async function init() {
  try {
    atualizarMenuAtivo();
    await carregarDados();
    atualizarCards();
    renderDashboardLowStock();
    renderDashboardCharts();
    renderHomeUltimasMovimentacoes();
    await initProdutosPage();
    await initMovimentacoesPage();
    initAlocacoesPage();
    initRelatoriosPage();
  } catch (error) {
    console.error(error);
    alert("Não foi possível conectar ao backend em http://localhost:3000");
  }
}

init();
async function excluirMovimentacao(id) {
  const confirmar = confirm("Deseja excluir esta movimentação?");
  if (!confirmar) return;

  try {
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
    } else {
      alert("Tipo de movimentação inválido.");
      return;
    }

    if (novaQuantidade < 0) {
      novaQuantidade = 0;
    }

    await apiPatch(`/produtos/${produto.id}`, {
      quantidade: novaQuantidade
    });

    await apiDelete(`/movimentacoes/${id}`);

    await refreshAll();

  } catch (error) {
    console.error(error);
    alert("Erro ao excluir movimentação.");
  }
}
function editarMovimentacao(id) {
  const mov = movimentacoes.find(m => String(m.id) === String(id));
  if (!mov) return;

  document.getElementById("produtoMov").value = mov.produtoId;
  document.getElementById("tipoMov").value = String(mov.tipo).toLowerCase();
  document.getElementById("quantidadeMov").value = mov.quantidade;
  document.getElementById("obsMov").value = mov.observacao || "";

  editandoMovimentacaoId = mov.id;

  // 🔥 visual
  document.getElementById("btnSalvarMov").textContent = "Salvar";
  document.getElementById("modoEdicaoMov").style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function atualizarMovimentacao(id, novoProdutoId, novoTipo, novaQuantidade, novaObservacao = "") {
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

  try {
    if (String(produtoAntigo.id) === String(produtoNovo.id)) {
      await apiPatch(`/produtos/${produtoNovo.id}`, {
        quantidade: estoqueProdutoNovo
      });
    } else {
      await apiPatch(`/produtos/${produtoAntigo.id}`, {
        quantidade: estoqueProdutoAntigo
      });

      await apiPatch(`/produtos/${produtoNovo.id}`, {
        quantidade: estoqueProdutoNovo
      });
    }

    await apiPut(`/movimentacoes/${id}`, {
      ...movAntiga,
      produtoId: novoProdutoId,
      produtoNome: produtoNovo.nome || "",
      equipamento: produtoNovo.nome || produtoNovo.equipamento || "",
      modelo:
        produtoNovo.modelo ||
        produtoNovo.modeloEquipamento ||
        produtoNovo.marcaModelo ||
        produtoNovo.descricao ||
        produtoNovo.equipamento ||
        "",
      especificacoes:
        produtoNovo.especificacoes ||
        produtoNovo.especificacao ||
        produtoNovo.especificacoesTecnicas ||
        "",
      tipo: tipoNovo,
      quantidade: quantidadeNova,
      observacao: novaObservacao
    });

    return true;
  } catch (error) {
    console.error(error);
    alert("Erro ao atualizar movimentação.");
    return false;
  }
}
async function salvarAlocacao(dados) {
  await apiPost("/alocacoes", dados);

  await registrarHistoricoAlocacao({
    tipoAcao: "cadastro",
    ...dados
  });
}

async function initAlocacoesPage() {
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

  form.addEventListener("submit", async function (e) {
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

    try {
      if (editandoAlocacaoId) {
        await apiPut(`/alocacoes/${editandoAlocacaoId}`, {
          id: editandoAlocacaoId,
          ...dados
        });

        await registrarHistoricoAlocacao({
          tipoAcao: "edicao",
          ...dados
        });
      } else {
        await apiPost("/alocacoes", dados);

        await registrarHistoricoAlocacao({
          tipoAcao: "cadastro",
          ...dados
        });
      }

      form.reset();
      editandoAlocacaoId = null;

      if (btnSalvarAloc) btnSalvarAloc.textContent = "Salvar alocação";
      if (modoEdicaoAloc) modoEdicaoAloc.style.display = "none";

      await refreshAll();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alocação.");
    }
  });
  preencherFiltroSetores(alocacoes);
  filtroSetor?.addEventListener("change", renderTabelaAlocacoes);

  renderTabelaAlocacoes();
  renderTabelaHistoricoAlocacoes();
  iniciarMenuExportacao();
}
function renderTabelaAlocacoes() {
  const container = document.getElementById("tabelaAlocacoes");
  if (!container) return;

  if (!alocacoes.length) {
    container.innerHTML = `<div class="empty">Nenhuma alocação cadastrada.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
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
          ${alocacoes.map((item) => `
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
        </tbody>
      </table>
    </div>
  `;
}
async function registrarHistoricoAlocacao({
  tipoAcao,
  colaborador,
  setor,
  equipamento,
  modelo,
  especificacoes,
  anydesk,
  observacao
}) {
  const agora = new Date();

  await apiPost("/historicoAlocacoes", {
    tipoAcao, // cadastro, edicao, exclusao
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
}
async function excluirAlocacao(id) {
  const confirmar = confirm("Deseja excluir esta alocação?");
  if (!confirmar) return;

  try {
    const item = alocacoes.find((a) => String(a.id) === String(id));
    if (!item) return;

    await registrarHistoricoAlocacao({
      tipoAcao: "exclusao",
      colaborador: item.colaborador,
      setor: item.setor,
      equipamento: item.equipamento,
      modelo: item.modelo,
      especificacoes: item.especificacoes,
      anydesk: item.anydesk,
      observacao: item.observacao
    });

    await apiDelete(`/alocacoes/${id}`);
    await refreshAll();
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir alocação.");
  }
}
async function refreshAll() {
  await carregarDados();
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
function renderTabelaHistoricoAlocacoes() {
  const container = document.getElementById("tabelaHistoricoAlocacoes");
  if (!container) return;

  const filtroColaborador = document.getElementById("filtroColaboradorAloc")?.value.toLowerCase().trim() || "";
  const filtroSetor = document.getElementById("filtroSetorAloc")?.value.toLowerCase().trim() || "";
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
    const atendeSetor = !filtroSetor || setor.includes(filtroSetor);
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
      </table>
    </div>
  `;
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

  container.innerHTML = `
    <div class="table-wrapper">
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
        </tbody>
      </table>
    </div>
  `;
}
function iniciarMenuExportacao() {
  const btnExportarRelatorio = document.getElementById("btnExportarRelatorio");
  const menuExportacao = document.getElementById("menuExportacao");
  const btnExportarPDF = document.getElementById("btnExportarPDF");
  const btnExportarCSV = document.getElementById("btnExportarCSV");

  if (!btnExportarRelatorio || !menuExportacao || !btnExportarPDF || !btnExportarCSV) {
    console.error("Elementos do menu de exportação não encontrados.");
    return;
  }

  // abrir menu
  btnExportarRelatorio.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.toggle("hidden");
  });

  // PDF
  btnExportarPDF.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.add("hidden");
    gerarRelatorio();
  });

  // CSV
  btnExportarCSV.addEventListener("click", (e) => {
    e.stopPropagation();
    menuExportacao.classList.add("hidden");
    exportarParaCSV();
  });

  // fechar clicando fora
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
  if (!movimentacoes || movimentacoes.length === 0) {
    alert("Nenhuma movimentação encontrada para exportar.");
    return;
  }

  const dados = movimentacoes.map((item) => ({
    Data: formatarDataExcel(item.data || item.dataISO),
    Tipo: item.tipo || "",
    Equipamento: item.produtoNome || item.equipamento || "",
    Modelo:
      item.modelo ||
      item.modeloEquipamento ||
      item.marcaModelo ||
      item.descricao ||
      "",
    Especificações:
      item.especificacoes ||
      item.especificacao ||
      item.especificacoesTecnicas ||
      "",
    Quantidade: item.quantidade || "",
    Colaborador: item.colaborador || "",
    Setor: item.setor || "",
    AnyDesk: item.anydesk || "",
    Observação: item.observacao || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(dados);

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 40 }
  ];

  for (let i = 0; i < dados.length; i++) {
    const cellAddress = `A${i + 2}`;
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].t = "s";
      worksheet[cellAddress].v = dados[i].Data;
    }
  }

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

function obterValorEquipamento(item) {
  return (
    item.equipamento?.nome ||
    item.equipamento ||
    item.nomeEquipamento ||
    item.nome ||
    item.produto ||
    item.item ||
    ""
  );
}

function obterValorModelo(item) {
  return (
    item.modelo?.nome ||
    item.modelo ||
    item.modeloEquipamento ||
    ""
  );
}

function obterValorEspecificacoes(item) {
  return (
    item.especificacoes ||
    item.especificacao ||
    item.especificacoesTecnicas ||
    ""
  );
}
