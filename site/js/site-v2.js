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
      text("[data-preco-novo='" + k + "']", brl(p.grupo[k]));
    });

    text("[data-preco='familia3']", brl(p.familia.ate3));
    text("[data-preco='familia3x4']", brl(p.familia.ate3 * 4));
    text("[data-preco='familia4']", brl(p.familia.quatro));
    text("[data-preco='familia4x4']", brl(p.familia.quatro * 4));

    text("[data-regra='minimo']", cfg.creditos.minimoAulas);
    text("[data-regra='validade']", cfg.creditos.validadeMeses);
    text("[data-regra='antecedencia']", cfg.creditos.antecedenciaCancelamentoHoras);
  }

  function setupCalculator() {
    var modalidade = document.getElementById("calc-modalidade");
    var pessoas = document.getElementById("calc-pessoas");
    var aulas = document.getElementById("calc-aulas");
    var boxPessoas = document.getElementById("calc-pessoas-wrap");
    var resultado = document.getElementById("calc-resultado");
    var detalhe = document.getElementById("calc-detalhe");
    var total = document.getElementById("calc-total");
    var unidade = document.getElementById("calc-unidade");
    var wa = document.getElementById("calc-whatsapp");

    if (![modalidade, pessoas, aulas, boxPessoas, resultado, detalhe, total, unidade, wa].every(Boolean)) return;

    function keyGrupo(qtd) {
      return qtd === "2" ? "dupla" : qtd === "3" ? "trio" : "quarteto";
    }

    function update(normalizar) {
      var mod = modalidade.value;
      var qtdAulas = Number(aulas.value);
      // Deixe o campo livre enquanto a pessoa digita. Corrija somente ao
      // concluir a edição; não envie ao WhatsApp uma cotação incompleta.
      if (normalizar) {
        qtdAulas = Number.isFinite(qtdAulas) ? Math.floor(qtdAulas) : cfg.creditos.minimoAulas;
        qtdAulas = Math.max(cfg.creditos.minimoAulas, qtdAulas);
        aulas.value = qtdAulas;
      }
      boxPessoas.hidden = !(mod === "grupo" || mod === "familia");
      if (!Number.isSafeInteger(qtdAulas) || qtdAulas < cfg.creditos.minimoAulas) {
        resultado.hidden = true;
        wa.removeAttribute("href");
        return;
      }
      var valor = 0;
      var label = "";
      var unitLabel = "";
      var descricao = "";

      if (mod === "particular") {
        valor = cfg.precos.particular.pacote;
        label = "Particular";
        unitLabel = "por aula";
        descricao = qtdAulas + " aulas particulares";
      } else if (mod === "grupo") {
        var k = keyGrupo(pessoas.value);
        valor = cfg.precos.grupo[k];
        label = "Grupo · " + pessoas.value + " pessoas";
        unitLabel = "por pessoa / aula";
        descricao = qtdAulas + " aulas em grupo para " + pessoas.value + " pessoas";
      } else {
        valor = pessoas.value === "4" ? cfg.precos.familia.quatro : cfg.precos.familia.ate3;
        label = pessoas.value === "4" ? "Grupo Família · 4 pessoas" : "Grupo Família · até 3 pessoas";
        unitLabel = "por hora";
        descricao = qtdAulas + " aulas de Grupo Família";
      }

      var totalCalc = valor * qtdAulas;
      detalhe.textContent = label + " · " + qtdAulas + " aulas";
      unidade.textContent = brl(valor) + " " + unitLabel;
      total.textContent = brl(totalCalc) + (mod === "grupo" ? " por pessoa" : "");
      resultado.hidden = false;

      var msg = "Olá João! Vi os planos no site da JV Tênis e tenho interesse em " +
        descricao + ". Valor calculado: " + brl(totalCalc) + (mod === "grupo" ? " por pessoa" : "") + ". Pode me passar os horários disponíveis?";
      wa.href = cfg.urls.whatsapp + "?text=" + encodeURIComponent(msg);
    }

    [modalidade, pessoas].forEach(function (el) {
      el.addEventListener("change", function () { update(false); });
    });
    aulas.addEventListener("input", function () { update(false); });
    aulas.addEventListener("change", function () { update(true); });
    aulas.addEventListener("blur", function () { update(true); });
    update(false);
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
    fetch(cfg.urls.statusQuadra, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(setCourtStatus)
      .catch(function () {});
  }

  syncPrices();
  setupCalculator();
  loadCourtStatus();
})();