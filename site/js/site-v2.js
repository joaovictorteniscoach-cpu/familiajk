(function () {
  "use strict";

  var cfg = window.JV_CONFIG;
  if (!cfg) return;

  function brl(v) {
    return Number(v).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  }

  function text(sel, value) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = value;
    });
  }

  function syncPrices() {
    var p = cfg.precos;
    text("[data-preco='particular']", brl(p.particular.pacote));
    text("[data-preco='particular4']", brl(p.particular.pacote * 4));
    text("[data-preco='avulsa']", brl(p.particular.avulsa));

    ["dupla", "trio", "quarteto"].forEach(function (k) {
      text("[data-preco-novo='" + k + "']", brl(p.grupoNovo1x[k]));
      text("[data-preco-fidelidade='" + k + "']", brl(p.grupoFidelidade[k]));
    });

    text("[data-preco='familia3']", brl(p.familia.ate3));
    text("[data-preco='familia3x4']", brl(p.familia.ate3 * 4));
    text("[data-preco='familia4']", brl(p.familia.quatro));
    text("[data-preco='familia4x4']", brl(p.familia.quatro * 4));

    text("[data-regra='minimo']", cfg.creditos.minimoAulas);
    text("[data-regra='validade']", cfg.creditos.validadeMeses);
    text("[data-regra='antecedencia']", cfg.creditos.antecedenciaCancelamentoHoras);
  }

  function applyPublishedLoyaltyPrices(gp) {
    if (!gp) return;
    ["dupla", "trio", "quarteto"].forEach(function (k) {
      var n = Number(gp[k]);
      if (n > 0) cfg.precos.grupoFidelidade[k] = n;
    });
    syncPrices();
  }

  function loadPublishedPrices() {
    if (!window.fetch) return;
    fetch(cfg.urls.precosPublicos)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(applyPublishedLoyaltyPrices)
      .catch(function () {});
  }

  function setupCalculator() {
    var modalidade = document.getElementById("calc-modalidade");
    var condicao = document.getElementById("calc-condicao");
    var pessoas = document.getElementById("calc-pessoas");
    var aulas = document.getElementById("calc-aulas");
    var boxCondicao = document.getElementById("calc-condicao-wrap");
    var boxPessoas = document.getElementById("calc-pessoas-wrap");
    var resultado = document.getElementById("calc-resultado");
    var detalhe = document.getElementById("calc-detalhe");
    var total = document.getElementById("calc-total");
    var unidade = document.getElementById("calc-unidade");
    var wa = document.getElementById("calc-whatsapp");

    if (!modalidade || !aulas || !resultado) return;

    function keyGrupo(qtd) {
      return qtd === "2" ? "dupla" : qtd === "3" ? "trio" : "quarteto";
    }

    function update() {
      var mod = modalidade.value;
      var qtdAulas = Math.max(cfg.creditos.minimoAulas, parseInt(aulas.value, 10) || cfg.creditos.minimoAulas);
      aulas.value = qtdAulas;
      var valor = 0;
      var label = "";
      var unitLabel = "";
      var descricao = "";

      boxCondicao.hidden = mod !== "grupo";
      boxPessoas.hidden = !(mod === "grupo" || mod === "familia");

      if (mod === "particular") {
        valor = cfg.precos.particular.pacote;
        label = "Particular";
        unitLabel = "por aula";
        descricao = qtdAulas + " aulas particulares";
      } else if (mod === "grupo") {
        var k = keyGrupo(pessoas.value);
        var tabela = condicao.value === "fidelidade" ? cfg.precos.grupoFidelidade : cfg.precos.grupoNovo1x;
        valor = tabela[k];
        label = "Grupo · " + pessoas.value + " pessoas";
        unitLabel = "por pessoa / aula";
        descricao = qtdAulas + " aulas em grupo para " + pessoas.value + " pessoas (" +
          (condicao.value === "fidelidade" ? "aluno antigo ou 2x/semana" : "novo aluno · 1x/semana") + ")";
      } else {
        valor = pessoas.value === "4" ? cfg.precos.familia.quatro : cfg.precos.familia.ate3;
        label = pessoas.value === "4" ? "Grupo Família · 4 pessoas" : "Grupo Família · até 3 pessoas";
        unitLabel = "por hora";
        descricao = qtdAulas + " aulas de Grupo Família";
      }

      var totalCalc = valor * qtdAulas;
      detalhe.textContent = label + " · " + qtdAulas + " aulas";
      unidade.textContent = brl(valor) + " " + unitLabel;
      total.textContent = brl(totalCalc);
      resultado.hidden = false;

      var msg = "Olá João! Vi os planos no site da JV Tênis e tenho interesse em " +
        descricao + ". Valor calculado: " + brl(totalCalc) + ". Pode me passar os horários disponíveis?";
      wa.href = cfg.urls.whatsapp + "?text=" + encodeURIComponent(msg);
    }

    [modalidade, condicao, pessoas, aulas].forEach(function (el) {
      if (el) el.addEventListener("change", update);
    });
    aulas.addEventListener("input", update);
    update();
  }

  function setCourtStatus(data) {
    var el = document.querySelector("[data-court-status]");
    var stamp = document.querySelector("[data-court-status-time]");
    if (!el || !data) return;

    var raw = String(data.status || "").toLowerCase();
    var map = {
      liberada: ["🟢", "Quadra liberada"],
      aberta: ["🟢", "Quadra liberada"],
      avaliacao: ["🟡", "Quadra em avaliação"],
      "em avaliação": ["🟡", "Quadra em avaliação"],
      fechada: ["🔴", "Quadra temporariamente fechada"],
      chuva: ["🌧️", "Quadra temporariamente fechada por chuva"]
    };
    var item = map[raw];
    if (!item) return;
    el.textContent = item[0] + " " + item[1];
    el.dataset.state = raw;
    if (stamp && data.atualizado_em) stamp.textContent = "Atualizado: " + data.atualizado_em;
  }

  function loadCourtStatus() {
    if (!window.fetch) return;
    fetch(cfg.urls.statusQuadra)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(setCourtStatus)
      .catch(function () {});
  }

  syncPrices();
  loadPublishedPrices();
  setupCalculator();
  loadCourtStatus();
})();