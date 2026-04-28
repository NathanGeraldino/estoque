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
let alocacoes = [];
let historicoAlocacoes = [];
let editandoAlocacaoId = null;
let editandoId = null;
let chartCategoriasInstance = null;
let chartSaidasInstance = null;
let chartMovimentacoesInstance = null;
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
    
    function ativarRealtime() {
  if (!supabaseClient) return;

  console.log("🔄 Ativando Realtime...");

  supabaseClient
    .channel("estoque-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "equipamentos" },
      async (payload) => {
        console.log("📡 Mudança em equipamentos:", payload);
        await carregarDados();
        refreshAll();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "movimentacoes" },
      async (payload) => {
        console.log("📡 Mudança em movimentações:", payload);
        await carregarDados();
        refreshAll();
      }
    )
    .subscribe((status) => {
      console.log("Status Realtime:", status);
    });
}

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
// FUNÇÕES UTILITÁRIAS
// ============================================

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

function renderHomeUltimasMovimentacoes() {
  const container = document.getElementById("homeUltimasMovimentacoes");
  if (!container) return;

  if (!movimentacoes.length) {
    container.innerHTML = `<div class="empty">Nenhuma movimentação registrada ainda.</div>`;
    return;
  }

  const ultimas = [...movimentacoes]
    .sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO))
    .slice(0, 5);

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

// ============================================
// GRÁFICOS (CHARTS)
// ============================================

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

// ============================================
// PRODUTOS (EQUIPAMENTOS)
// ============================================

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
    window.location.href = "equipamentos.html";
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
  cancelarEdicao?.addEventListener("click", limparFormularioProduto);

  renderTabelaProdutos();
}

// ============================================
// MOVIMENTAÇÕES
// ============================================

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
  console.log("💾 Resultado insert:", resultado);
  return resultado !== null;
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

function editarMovimentacao(id) {
  const mov = movimentacoes.find(m => String(m.id) === String(id));
  if (!mov) return;

  document.getElementById("produtoMov").value = mov.produtoId;
  document.getElementById("tipoMov").value = String(mov.tipo).toLowerCase();
  document.getElementById("quantidadeMov").value = mov.quantidade;
  document.getElementById("obsMov").value = mov.observacao || "";

  editandoMovimentacaoId = mov.id;

  document.getElementById("btnSalvarMov").textContent = "Salvar";
  document.getElementById("modoEdicaoMov").style.display = "block";

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
    console.log("🔥 Submit movimentação disparado");
    
    e.preventDefault();

    const produtoId = document.getElementById("produtoMov").value;
    const tipo = document.getElementById("tipoMov").value;
    const quantidade = Number(document.getElementById("quantidadeMov").value);
    const observacao = document.getElementById("obsMov").value;

    console.log("📦 Dados:", { produtoId, tipo, quantidade, observacao });

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

  container.innerHTML = `
    <div class="table-wrapper">
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
        </tbody>
      </table>
    </div>
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
      </table>
    </div>
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

  document.getElementById("exportarCsv")?.addEventListener("click", exportarCSV);
  document.getElementById("imprimirPdf")?.addEventListener("click", exportarPDF);
}

function renderRelatorioResumo() {
  const container = document.getElementById("relatorioResumo");
  if (!container) return;

  if (!produtos.length) {
    container.innerHTML = `<div class="empty">Nenhum equipamento cadastrado.</div>`;
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
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
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
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Total de Itens</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(([cat, qtd]) => `
            <tr>
              <td>${cat}</td>
              <td>${qtd}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
function renderRelatorioMaiorSaida() {
  const container = document.getElementById("relatorioMaiorSaida");
  if (!container) return;

  const saidas = movimentacoes.filter((mov) => mov.tipo === "saida");
  const mapa = {};

  saidas.forEach((mov) => {
    if (!mapa[mov.produtoNome]) {
      mapa[mov.produtoNome] = 0;
    }
    mapa[mov.produtoNome] += Number(mov.quantidade);
  });

  const ranking = Object.entries(mapa)
    .sort((a, b) => b[1] - a[1]);

  if (!ranking.length) {
    container.innerHTML = `<div class="empty">Nenhuma saída registrada.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Equipamento</th>
            <th>Total de Saídas</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.map(([nome, qtd], i) => `
            <tr>
              <td>${i + 1}</td>
              <td class="produto-nome">${nome}</td>
              <td>${qtd}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
// ============================================
// EXPORTAÇÃO
// ============================================

function exportarCSV() {
  if (!produtos.length) {
    mostrarMensagem("Nenhum equipamento para exportar", "warning");
    return;
  }

  const dados = produtos.map((item) => {
    const baixo = Number(item.quantidade) <= Number(item.minimo);
    const total = Number(item.quantidade) * Number(item.valor);

    return {
      "Equipamento": item.nome,
      "Categoria": item.modelo || "-",
      "Quantidade": item.quantidade,
      "Mínimo": item.minimo,
      "Valor unitário": Number(item.valor),
      "Total": total,
      "Status": baixo ? "Estoque baixo" : "Normal"
    };
  });

  const ws = XLSX.utils.json_to_sheet(dados);

  ws["!cols"] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório Estoque");

  XLSX.writeFile(
    wb,
    `relatorio_estoque_${new Date().toISOString().split("T")[0]}.xlsx`
  );

  mostrarMensagem("Relatório exportado com sucesso!");
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
// REFRESH E INICIALIZAÇÃO
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

  ativarRealtime();
});

// ============================================
// EXPORTAÇÃO MOVIMENTAÇÕES
// ============================================

function exportarMovimentacoesExcel() {
  if (!movimentacoes.length) {
    mostrarMensagem("Nenhuma movimentação para exportar", "warning");
    return;
  }

  const dados = movimentacoes.map(mov => ({
    Data: mov.data,
    Equipamento: mov.produtoNome,
    Tipo: mov.tipo === "entrada" ? "Entrada" : "Saída",
    Quantidade: mov.quantidade,
    Observação: mov.observacao || "-"
  }));

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
  XLSX.writeFile(wb, `movimentacoes_${new Date().toISOString().split("T")[0]}.xlsx`);

  mostrarMensagem("Movimentações exportadas com sucesso!");
}
