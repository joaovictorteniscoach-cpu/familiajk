/* ===== JV Modelo aprovado 2026-09-26-11 · Gestão, Aluno e Agenda =====
   Refaz as três telas da imagem modelo dos três celulares (guardada em
   ferramentas/originais/modelo-apps-jv.png), medida a medida: topo com o
   logo de traço, "Olá, João Victor!", o mês como "Setembro 2026 ˅" e
   "Salvo na nuvem"; cartões com ícone dourado em círculo escuro e números
   grandes; comparativo e "Atenção hoje" em tamanho de leitura; barra de baixo
   com ícones de traço; Agenda com a grade clara (Livre · Aula · Chuva · Prof.).
   Carregado por último: vale por cima de todas as camadas anteriores. Só
   visual — nenhuma função muda. */
:root{--m-bg:#02160F;--m-card1:#15402F;--m-card2:#0C2E22;--m-borda:rgba(170,210,185,.17);--m-ouro:#EBC35E;--m-ouro2:#E3B64B;
  --m-creme:#F4EFE4;--m-sub:#E2DED4;--m-verde:#6ED291;--m-laranja:#E0703F;--m-icone:#0E4431}
html,body{background:var(--m-bg)!important}
body,button,input,select,textarea{font-family:'DM Sans',system-ui,-apple-system,sans-serif}

/* ---------------------------------------------------------------- topo */
HERO{display:grid!important;grid-template-columns:minmax(0,1fr) 44px!important;
  grid-template-areas:"brand avatar" "greet greet" "title title" "motiv motiv" "month month" "agt agt" "ags ags"!important;
  gap:0 10px!important;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 8px!important;min-height:0!important;border:0!important;
  background:linear-gradient(180deg,rgba(2,22,15,0) 58%,rgba(2,22,15,.6) 86%,var(--m-bg) 100%),url('ASSETS/jv-topo-quadra.webp') right center/cover no-repeat,#07241A!important}
HERO::before,HERO::after{display:none!important}
HERO .top-actions,HERO .jv-hero-question,HERO .jv-hero-motto,HERO #hello-prof:empty{display:none!important}
HERO .jv-gestao-brand,HERO .jv-aluno-brand,HERO>div:first-child{grid-area:brand!important;display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;max-width:none!important;margin:0!important}
HERO .marca-linha{display:block!important;width:38px!important;height:38px!important;flex:0 0 38px!important;color:#E7BC4E!important}
HERO .marca-linha svg{width:38px!important;height:38px!important}
HERO .jv-gestao-brand span:not(.marca-linha),HERO>div:first-child>span:not(.marca-linha){display:flex!important;flex-direction:column!important;
  font-size:9.5px!important;line-height:1.15!important;letter-spacing:3.2px!important;text-transform:uppercase!important;font-weight:500!important;color:#EDE6D2!important;-webkit-text-fill-color:#EDE6D2!important}
HERO .jv-gestao-brand span b,HERO>div:first-child>span b{display:block!important;font-size:17px!important;letter-spacing:.6px!important;font-weight:500!important;margin-top:3px!important;color:var(--m-creme)!important;-webkit-text-fill-color:var(--m-creme)!important;white-space:nowrap!important}
HERO .jv-avatar-btn{grid-area:avatar!important;align-self:center!important;justify-self:end!important;width:42px!important;height:42px!important;min-height:42px!important;padding:0!important;border-radius:50%!important;
  background:#0D3A2A!important;border:1.5px solid rgba(165,215,185,.6)!important;box-shadow:none!important;overflow:hidden!important}
HERO .jv-avatar-fallback{width:100%!important;height:100%!important;background:transparent!important;color:var(--m-creme)!important;-webkit-text-fill-color:var(--m-creme)!important;font-size:15px!important;font-weight:600!important;display:flex!important;align-items:center!important;justify-content:center!important}
HERO .jv-avatar-camera{display:none!important}
HERO .jv-hero-greet{grid-area:greet!important;margin:16px 0 0!important;font-size:29px!important;line-height:1.12!important;font-weight:700!important;letter-spacing:-.2px!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-family:'DM Sans',sans-serif!important}
HERO h1{grid-area:title!important;margin:3px 0 0!important;font-family:'DM Sans',sans-serif!important;font-size:19.5px!important;line-height:1.2!important;font-weight:400!important;letter-spacing:0!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}
HERO h1 em{font-style:normal!important;color:inherit!important;-webkit-text-fill-color:inherit!important;font-family:inherit!important}
HERO .jv-hero-motiv{grid-area:motiv!important;margin:7px 0 0!important;font-size:15px!important;line-height:1.3!important;font-weight:400!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important;font-style:normal!important}
HERO .jv-ag-titulo,HERO .jv-ag-sub{display:none!important}
/* mês: "Setembro 2026 ˅" abre o seletor do celular; à direita, a nuvem */
HERO .top-month.jv-mes{grid-area:month!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;
  margin:14px 0 0!important;padding:0!important;min-height:36px!important;background:transparent!important;border:0!important;box-shadow:none!important;position:static!important;grid-template-columns:none!important}
HERO .jv-mes-sel{position:relative!important;display:flex!important;align-items:center!important;gap:10px!important;min-height:40px!important;cursor:pointer;color:#fff!important}
HERO .jv-mes-sel .jv-mes-cal svg{width:21px!important;height:21px!important;display:block}
HERO .jv-mes-sel .jv-mes-seta svg{width:17px!important;height:17px!important;display:block;margin-left:-2px}
HERO .jv-mes .month-label{font-family:'DM Sans',sans-serif!important;font-size:16.5px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;min-width:0!important;padding:0!important}
HERO #jv-mes-input{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;border:0!important;margin:0!important;padding:0!important;font-size:16px!important;cursor:pointer}
HERO .jv-mes .save-state{position:static!important;transform:none!important;width:auto!important;max-width:none!important;overflow:visible!important;
  display:flex!important;align-items:center!important;gap:6px!important;font-size:13px!important;font-weight:500!important;line-height:1!important;letter-spacing:0!important;white-space:nowrap!important;
  color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;background:transparent!important;border:0!important;padding:0!important}
HERO .jv-mes .save-state::before{content:""!important;display:inline-block!important;width:17px!important;height:17px!important;font-size:0!important;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='1.7' stroke-linejoin='round'%3E%3Cpath d='M7 18.5h10.2a4 4 0 0 0 .5-8A5.6 5.6 0 0 0 6.9 9.3 4.6 4.6 0 0 0 7 18.5z'/%3E%3C/svg%3E") center/contain no-repeat!important}
HERO .jv-mes .save-state.err{color:#FFB19A!important;-webkit-text-fill-color:#FFB19A!important}
/* na Agenda o topo vira "Minha agenda" */
AGENDA HERO .jv-hero-greet,AGENDA HERO h1,AGENDA HERO .jv-hero-motiv,AGENDA HERO .top-month,AGENDA HERO #hello-prof{display:none!important}
AGENDA HERO .jv-ag-titulo{display:block!important;grid-area:agt!important;margin:16px 0 0!important;font-size:29px!important;line-height:1.12!important;font-weight:700!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
AGENDA HERO .jv-ag-sub{display:block!important;grid-area:ags!important;margin:4px 0 2px!important;font-size:16px!important;line-height:1.3!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}

/* ------------------------------------------------------ cartões (base) */
.m-card{}
html body .jv-ref-kpi,html body .jv-home-card,html body .jv-ref-comparativo,html body .jv-pay-card,html body .jv-ref-attention .acao-item{
  background:linear-gradient(165deg,var(--m-card1) 0%,var(--m-card2) 100%)!important;border:1px solid var(--m-borda)!important;border-radius:14px!important;
  box-shadow:0 6px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05)!important;color:var(--m-creme)!important}
html body .jv-ref-kpi::before,html body .jv-ref-kpi::after,html body .jv-home-card::before,html body .jv-home-card::after,html body .jv-pay-card::before,html body .jv-pay-card::after{display:none!important}

/* ------------------------------------------------------ Início · Gestão */
html body #pg-dash{padding:10px 12px 18px!important}
html body .jv-ref-kpis{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 12px!important}
html body .jv-ref-kpi{min-height:100px!important;padding:11px 13px 10px!important;text-align:left!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important}
html body .jv-ref-kpi-title{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important}
html body .jv-ref-kpi-title b{font-size:15px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:var(--m-creme)!important;-webkit-text-fill-color:var(--m-creme)!important}
html body .jv-ref-round-icon{width:36px!important;height:36px!important;flex:0 0 36px!important;border-radius:50%!important;background:var(--m-icone)!important;border:0!important;
  display:flex!important;align-items:center!important;justify-content:center!important;color:var(--m-ouro)!important;box-shadow:none!important}
html body .jv-ref-round-icon svg{width:21px!important;height:21px!important}
html body .jv-ref-kpi strong{display:block!important;margin:7px 0 0!important;font-size:25px!important;line-height:1.05!important;font-weight:700!important;letter-spacing:-.2px!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-family:'DM Sans',sans-serif!important}
html body .jv-ref-kpi small{display:flex!important;align-items:center!important;gap:5px!important;margin:6px 0 0!important;font-size:12.5px!important;line-height:1.2!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important;font-weight:500!important}
html body .jv-ref-kpi.receber small{color:var(--m-ouro)!important;-webkit-text-fill-color:var(--m-ouro)!important}
html body .jv-ref-kpi.meta small,html body .jv-ref-kpi.despesas small{display:none!important}
html body .jv-ref-kpi .jv-sobe svg{width:14px!important;height:14px!important;color:var(--m-verde)!important;display:block}
html body .jv-ref-comparativo{padding:14px 15px 12px!important;margin:0 0 14px!important;background:linear-gradient(165deg,#1C4736 0%,#123729 100%)!important}
html body .jv-ref-comparativo h3{font-family:'DM Sans',sans-serif!important;font-size:17px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;margin:0 0 10px!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-ref-bar-row{display:grid!important;grid-template-columns:76px minmax(0,1fr) 88px!important;align-items:center!important;gap:10px!important;min-height:29px!important;margin:0!important}
html body .jv-ref-bar-row span{font-size:14.5px!important;font-weight:400!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}
html body .jv-ref-bar-row i{display:block!important;height:12px!important;border-radius:7px!important;background:#0E2A20!important;overflow:hidden!important}
html body .jv-ref-bar-row i b{display:block!important;height:100%!important;border-radius:7px!important}
html body .jv-ref-bar-row.meta i b{background:#EBBF58!important}
html body .jv-ref-bar-row.recebido i b{background:#5BA276!important}
html body .jv-ref-bar-row.receber i b{background:#EDC35E!important;min-width:12px}
html body .jv-ref-bar-row.despesa i b{background:#D27244!important}
html body .jv-ref-bar-row strong{text-align:right!important;font-size:14.5px!important;font-weight:500!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-ref-attention{margin:0 0 12px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
html body .jv-ref-section-head{display:flex!important;align-items:center!important;justify-content:space-between!important;margin:0 3px 9px!important}
html body .jv-ref-section-head b{font-size:17px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:var(--m-ouro)!important;-webkit-text-fill-color:var(--m-ouro)!important}
html body .jv-ref-section-head button{background:transparent!important;border:0!important;padding:4px 0 4px 10px!important;min-height:32px!important;font-size:15px!important;font-weight:500!important;color:var(--m-ouro)!important;-webkit-text-fill-color:var(--m-ouro)!important}
html body .jv-ref-attention .acao-list{display:grid!important;gap:8px!important}
html body .jv-ref-attention .acao-item{display:flex!important;align-items:center!important;gap:13px!important;min-height:64px!important;padding:11px 14px!important;text-align:left!important;background:linear-gradient(165deg,#1B4535,#133A2C)!important}
html body .jv-ref-attention .acao-item .ai-ico{width:38px!important;height:38px!important;flex:0 0 38px!important;border-radius:50%!important;background:var(--m-laranja)!important;font-size:0!important;display:flex!important;align-items:center!important;justify-content:center!important}
html body .jv-ref-attention .acao-item .ai-ico::before{content:"!";font-size:21px;font-weight:800;color:#fff;line-height:1}
html body .jv-ref-attention .acao-item .ai-txt{flex:1!important;min-width:0!important}
html body .jv-ref-attention .acao-item b{display:block!important;font-size:16px!important;font-weight:600!important;line-height:1.25!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-ref-attention .acao-item small{display:block!important;margin-top:3px!important;font-size:14px!important;line-height:1.3!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}
html body .jv-ref-attention .acao-item .ai-n{display:none!important}
html body .jv-ref-attention .acao-item::after{content:""!important;display:block!important;position:static!important;width:10px!important;height:10px!important;flex:0 0 10px!important;border:solid #fff!important;border-width:2px 2px 0 0!important;transform:rotate(45deg)!important;margin-right:4px!important;background:none!important}
html body .jv-ref-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:4px 0 16px!important}
html body .jv-ref-actions button{display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;height:48px!important;min-height:48px!important;border-radius:12px!important;
  font-family:'DM Sans',sans-serif!important;font-size:16.5px!important;font-weight:600!important;letter-spacing:0!important;box-shadow:none!important;
  background:rgba(8,38,28,.72)!important;border:1px solid rgba(205,225,205,.34)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-ref-actions button.primary{background:linear-gradient(180deg,#F0CD62,#E5B94D)!important;border:0!important;color:#15130B!important;-webkit-text-fill-color:#15130B!important}
html body .jv-ref-actions button span{display:flex!important;width:auto!important;height:auto!important;background:none!important;border:0!important;font-size:0!important}
html body .jv-ref-actions button span svg{width:21px!important;height:21px!important}

/* ------------------------------------------------------ Início · Aluno */
html body #app .wrap{padding-left:12px!important;padding-right:12px!important;padding-top:10px!important}
html body .jv-home-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 12px!important}
html body .jv-home-card{min-height:142px!important;padding:12px 13px 13px!important;text-align:left!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important}
html body .jv-home-card .hc-top{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;margin:0!important}
html body .jv-home-card .hc-top span:last-child{font-size:15px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-home-card .hc-icon{width:36px!important;height:36px!important;flex:0 0 36px!important;border-radius:50%!important;background:var(--m-icone)!important;border:0!important;
  display:flex!important;align-items:center!important;justify-content:center!important;color:var(--m-ouro)!important;box-shadow:none!important}
html body .jv-home-card .hc-icon svg{width:21px!important;height:21px!important}
html body .jv-home-card .hc-main{margin:10px 0 0!important;font-family:'DM Sans',sans-serif!important;font-size:22px!important;line-height:1.12!important;font-weight:700!important;letter-spacing:-.2px!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-home-card .hc-sub{margin:6px 0 0!important;font-size:14px!important;line-height:1.28!important;font-weight:400!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}
html body .jv-home-card .hc-sub::first-letter{text-transform:uppercase}
html body .jv-home-card .jv-progress{height:9px!important;border-radius:6px!important;background:rgba(215,228,218,.72)!important;margin:auto 0 2px!important;overflow:hidden}
html body .jv-home-card .jv-progress i{background:var(--m-ouro)!important;border-radius:6px!important}
html body .jv-pay-card{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;padding:13px 15px 14px!important;margin:0 0 14px!important;background:linear-gradient(165deg,#1C4736 0%,#123729 100%)!important}
html body .jv-pay-card .jv-pay-head{grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:space-between!important;margin:0 0 6px!important}
html body .jv-pay-card .jv-pay-head b{font-size:17px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-pay-card .jv-pay-status{padding:5px 16px!important;border-radius:20px!important;background:var(--m-verde)!important;color:#0A2A1B!important;-webkit-text-fill-color:#0A2A1B!important;font-size:14px!important;font-weight:600!important;border:0!important;text-transform:none!important;letter-spacing:0!important}
html body .jv-pay-card>div:nth-child(3){border-left:1px solid rgba(230,225,210,.3)!important;padding-left:16px!important}
html body .jv-pay-card .jv-pay-lbl{font-size:13.5px!important;font-weight:400!important;letter-spacing:0!important;text-transform:none!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important;margin:0!important}
html body .jv-pay-card .jv-pay-value{margin:2px 0 0!important;font-family:'DM Sans',sans-serif!important;font-size:22px!important;font-weight:700!important;letter-spacing:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body .jv-pay-card .jv-pix-btn{grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;height:52px!important;min-height:52px!important;margin:12px 0 0!important;padding:0 14px!important;border-radius:12px!important;border:0!important;
  background:linear-gradient(180deg,#F2D068,#E5B94D)!important;box-shadow:0 4px 12px rgba(0,0,0,.25)!important}
html body .jv-pix-btn .jv-pix-logo svg{width:92px!important;height:31px!important;display:block}
html body .jv-pix-btn .jv-pix-sep{display:block!important;width:1.5px!important;height:26px!important;background:#3B3522!important}
html body .jv-pix-btn b{font-size:17px!important;font-weight:700!important;color:#16140C!important;-webkit-text-fill-color:#16140C!important;letter-spacing:0!important}
html body #apg-inicio .jv-quick-title{font-size:17px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:var(--m-ouro)!important;-webkit-text-fill-color:var(--m-ouro)!important;margin:4px 2px 10px!important}
html body #apg-inicio .jv-quick{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important}
html body #apg-inicio .jv-quick button{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;height:50px!important;min-height:50px!important;padding:0 8px!important;border-radius:12px!important;
  background:rgba(8,38,28,.72)!important;border:1px solid rgba(205,225,205,.34)!important;box-shadow:none!important;font-size:15px!important;font-weight:600!important;color:#fff!important;-webkit-text-fill-color:#fff!important;white-space:nowrap!important}
html body #apg-inicio .jv-quick button span{display:flex!important;background:none!important;border:0!important;width:auto!important;height:auto!important;color:var(--m-ouro)!important}
html body #apg-inicio .jv-quick button span svg{width:22px!important;height:22px!important}

/* ------------------------------------------------------ barra de baixo */
html body nav.nav.jv-nav-linha{height:auto!important;min-height:0!important;padding:8px 4px calc(8px + env(safe-area-inset-bottom,0px))!important;
  background:#03170F!important;border-top:1px solid rgba(232,190,90,.2)!important;box-shadow:0 -6px 18px rgba(0,0,0,.35)!important;display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:0!important}
html body nav.nav.jv-nav-linha button{position:relative!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:5px!important;
  min-height:58px!important;padding:6px 0 9px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;
  font-family:'DM Sans',sans-serif!important;font-size:13px!important;font-weight:500!important;letter-spacing:0!important;color:#E7E2D7!important;-webkit-text-fill-color:#E7E2D7!important}
html body nav.nav.jv-nav-linha button::before{display:none!important}
html body nav.nav.jv-nav-linha button .ico{display:flex!important;width:26px!important;height:26px!important;background:none!important;border:0!important;box-shadow:none!important;filter:none!important;color:#E7E2D7!important;transform:none!important}
html body nav.nav.jv-nav-linha button .ico svg{width:26px!important;height:26px!important}
html body nav.nav.jv-nav-linha button.on{color:var(--m-ouro)!important;-webkit-text-fill-color:var(--m-ouro)!important;font-weight:600!important;background:transparent!important}
html body nav.nav.jv-nav-linha button.on .ico{color:var(--m-ouro)!important}
html body nav.nav.jv-nav-linha button.on::after{content:""!important;display:block!important;position:absolute!important;left:50%!important;bottom:1px!important;top:auto!important;width:34px!important;height:3px!important;border-radius:2px!important;background:var(--m-ouro)!important;transform:translateX(-50%)!important;box-shadow:none!important}

/* ---------------------------------------------------------------- Agenda */
html body #pg-agenda,html body #apg-agenda{padding-top:12px!important}
html body #pg-agenda>.sec-eyebrow,html body #pg-agenda>.sec-title,html body #apg-agenda>.sec-eyebrow,html body #apg-agenda>.jv-subhero{display:none!important}
html body :is(#pg-agenda,#apg-agenda) .seg.jv-ref-ag-tabs{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:4px!important;padding:3px!important;margin:0 0 14px!important;border-radius:12px!important;background:#0A2C20!important;border:1px solid rgba(205,225,205,.22)!important;box-shadow:none!important}
html body :is(#pg-agenda,#apg-agenda) .seg.jv-ref-ag-tabs button{height:42px!important;min-height:42px!important;border-radius:10px!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:16px!important;font-weight:500!important;color:#EFEBE1!important;-webkit-text-fill-color:#EFEBE1!important;letter-spacing:0!important;text-transform:none!important}
html body :is(#pg-agenda,#apg-agenda) .seg.jv-ref-ag-tabs button.on{background:linear-gradient(180deg,#F1CF63,#E6BB4D)!important;color:#15130B!important;-webkit-text-fill-color:#15130B!important;font-weight:600!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav{display:grid!important;grid-template-columns:40px minmax(0,1fr) 40px!important;align-items:center!important;gap:8px!important;min-height:0!important;margin:0 0 12px!important;padding:0 0 12px!important;
  background:transparent!important;border:0!important;border-bottom:1px solid rgba(230,225,210,.14)!important;border-radius:0!important;box-shadow:none!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav .month-btn{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;padding:0!important;border-radius:9px!important;background:transparent!important;border:1px solid rgba(205,225,205,.36)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav .month-btn svg{width:20px!important;height:20px!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav-label{text-align:center!important;font-family:'DM Sans',sans-serif!important;font-size:18px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav-label small{display:none!important}
html body :is(#pg-agenda,#apg-agenda) :is(.wk-zoom,.wk-tools){display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin:0 0 12px!important;padding:0!important;background:transparent!important;border:0!important}
html body :is(#pg-agenda,#apg-agenda) .jv-zoom{display:grid!important;grid-template-columns:42px 1fr 42px!important;align-items:center!important;width:152px!important;height:42px!important;border:1px solid rgba(232,200,120,.5)!important;border-radius:10px!important;overflow:hidden!important;background:transparent!important}
html body :is(#pg-agenda,#apg-agenda) .jv-zoom :is(.wz,.wk-zbtn){width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;font-size:24px!important;font-weight:400!important;color:#fff!important;-webkit-text-fill-color:#fff!important;line-height:1!important}
html body :is(#pg-agenda,#apg-agenda) .jv-zoom :is(.wz,.wk-zbtn):first-child{border-right:1px solid rgba(232,200,120,.45)!important}
html body :is(#pg-agenda,#apg-agenda) .jv-zoom :is(.wz,.wk-zbtn):last-child{border-left:1px solid rgba(232,200,120,.45)!important}
html body :is(#pg-agenda,#apg-agenda) .jv-zoom :is(.wz-lbl,.wk-zlbl){text-align:center!important;font-size:16px!important;font-weight:600!important;color:#fff!important;-webkit-text-fill-color:#fff!important;background:transparent!important;border:0!important;padding:0!important;min-width:0!important}
html body :is(#pg-agenda,#apg-agenda) :is(.wz-fit,.wk-fit){display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;height:42px!important;min-height:42px!important;width:auto!important;flex:0 1 auto!important;padding:0 16px!important;border-radius:10px!important;
  border:1px solid rgba(232,200,120,.55)!important;background:transparent!important;box-shadow:none!important;font-size:16px!important;font-weight:600!important;color:#fff!important;-webkit-text-fill-color:#fff!important;letter-spacing:0!important;text-transform:none!important;white-space:nowrap!important}
html body :is(#pg-agenda,#apg-agenda) :is(.wz-fit,.wk-fit) span{display:flex!important}
html body :is(#pg-agenda,#apg-agenda) :is(.wz-fit,.wk-fit) svg{width:20px!important;height:20px!important}
html body :is(#pg-agenda,#apg-agenda) .wk-scroll{background:#E3EED6!important;border:0!important;border-radius:12px 12px 0 0!important;box-shadow:none!important;padding:0!important;margin:0!important}
html body :is(#pg-agenda,#apg-agenda) table.wk{border-collapse:collapse!important;border-spacing:0!important;background:#E3EED6!important}
html body :is(#pg-agenda,#apg-agenda) table.wk th{background:#E3EED6!important;color:#1B2A20!important;-webkit-text-fill-color:#1B2A20!important;font-size:13px!important;font-weight:700!important;text-transform:none!important;letter-spacing:0!important;line-height:1.15!important;padding:7px 2px!important;border:1px solid #C9D8BF!important;border-top:0!important;box-shadow:none!important;position:sticky;top:0}
html body :is(#pg-agenda,#apg-agenda) table.wk th small{display:block!important;font-size:13px!important;font-weight:700!important;color:#1B2A20!important;-webkit-text-fill-color:#1B2A20!important;background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;margin:1px 0 0!important}
html body :is(#pg-agenda,#apg-agenda) table.wk th.jv-th-hr{font-size:12.5px!important;border-left:0!important}
html body :is(#pg-agenda,#apg-agenda) table.wk td{padding:0!important;border:1px solid #C9D8BF!important;background:#E3EED6!important}
html body :is(#pg-agenda,#apg-agenda) table.wk td.hr{font-size:13.5px!important;font-weight:700!important;color:#1B2A20!important;-webkit-text-fill-color:#1B2A20!important;background:#E3EED6!important;text-align:center!important;border-left:0!important;min-width:54px}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell,.wc){width:100%!important;min-height:38px!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:3px 2px!important;
  height:max(38px,calc(var(--wk-h,44px)*.86))!important;font-size:13px!important;font-weight:500!important;letter-spacing:0!important;text-transform:none!important;background:#D9E9CC!important;color:#2A4530!important;-webkit-text-fill-color:#2A4530!important;opacity:1!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell.t-aula,.wk-cell.t-grupo,.wk-cell.t-personal,.wk-cell.multi,.wc.meu){background:#145238!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:600!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell.t-chuva,.wc.chuva){background:#BCD4EA!important;color:#1F3448!important;-webkit-text-fill-color:#1F3448!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell.t-liberado,.wk-cell.t-outro,.wk-cell.t-bloqueio,.wk-cell.t-pess,.wc.ocup,.wc.bloq,.wc.fechado){background:#C9CCC5!important;color:#2B2F2A!important;-webkit-text-fill-color:#2B2F2A!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell.t-loc,.wk-cell.t-locacao,.wc.loc){background:#E9DDAF!important;color:#3E3417!important;-webkit-text-fill-color:#3E3417!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(.wk-cell.t-nliberado,.wc.passou){background:#E3EED6!important;color:#8B9A88!important;-webkit-text-fill-color:#8B9A88!important}
html body :is(#pg-agenda,#apg-agenda) table.wk .wc.pend{background:#F2DC96!important;color:#3E3417!important;-webkit-text-fill-color:#3E3417!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:10px 22px!important;margin:0!important;padding:14px 10px 6px!important;background:#143A2B!important;border:0!important;border-radius:0!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg span{display:flex!important;align-items:center!important;gap:8px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;font-size:14px!important;font-weight:400!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important;box-shadow:none!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg span::before{content:""!important;display:block!important;width:15px!important;height:15px!important;border-radius:50%!important;margin:0!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg .lg-livre::before{background:#D9E9CC!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg .lg-aula::before{background:transparent!important;border:1.5px solid #E6E2D8!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg .lg-chuva::before{background:#BCD4EA!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg .lg-prof::before{background:#C9CCC5!important}
html body :is(#pg-agenda,#apg-agenda) .jv-ag-info{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin:0 0 14px!important;padding:6px 10px 15px!important;background:#143A2B!important;border-radius:0 0 12px 12px!important;font-size:14px!important;color:var(--m-sub)!important;-webkit-text-fill-color:var(--m-sub)!important}
html body :is(#pg-agenda,#apg-agenda) .jv-ag-info span{display:flex;color:#fff}
html body :is(#pg-agenda,#apg-agenda) .jv-ag-info svg{width:19px!important;height:19px!important}
/* dia e mês continuam funcionando; ganham só o cartão claro da semana */
html body :is(#pg-agenda,#apg-agenda) #ag-view>:is(.cal,.slot:first-child){margin-top:0}

@media (max-width:360px){
  HERO .jv-hero-greet,AGENDA HERO .jv-ag-titulo{font-size:26px!important}
  HERO .jv-gestao-brand span b,HERO>div:first-child>span b{font-size:15.5px!important}
  html body .jv-ref-kpi strong{font-size:22px!important}
  html body :is(#pg-agenda,#apg-agenda) :is(.wz-fit,.wk-fit){padding:0 10px!important;font-size:14.5px!important}
  html body #apg-inicio .jv-quick button{font-size:13.5px!important;gap:5px!important}
}

/* avatar do aluno: o boneco de traço do modelo, até ele pôr uma foto */
html body #app>.top.jv-premium-hero #avatar-aluno-fallback{font-size:0!important;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F4EFE4' stroke-width='1.7' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.8'/%3E%3Cpath d='M4.5 20.5c.8-4 3.7-6.3 7.5-6.3s6.7 2.3 7.5 6.3'/%3E%3C/svg%3E") center/24px no-repeat!important}

/* ajustes finos depois da comparação lado a lado */
html body .jv-home-card .hc-top span:last-child{flex:0 1 auto!important;margin:0!important;text-align:left!important}
html body .jv-home-card{min-height:138px!important}
html body .jv-home-card .hc-main{margin-top:8px!important}
html body .jv-home-card .hc-sub{margin-top:5px!important}
html body .jv-home-card .jv-progress{margin-top:12px!important}
html body .jv-pay-card{padding:12px 15px 13px!important}
html body .jv-pay-card .jv-pix-btn{margin-top:10px!important;height:50px!important;min-height:50px!important}
html body :is(#pg-agenda,#apg-agenda) .ag-nav .month-btn,html body :is(#pg-agenda,#apg-agenda) .ag-nav .month-btn :is(span,svg){color:#fff!important;-webkit-text-fill-color:#fff!important;stroke:currentColor}
html body :is(#pg-agenda,#apg-agenda) :is(.wz-fit,.wk-fit) :is(span,svg){color:#fff!important}
html body :is(#pg-agenda,#apg-agenda) table.wk tr{height:auto!important}
html body :is(#pg-agenda,#apg-agenda) table.wk td,html body :is(#pg-agenda,#apg-agenda) table.wk td.hr{height:38px!important;line-height:1.1!important}
html body #apg-agenda{padding-left:0!important;padding-right:0!important}
html body :is(#pg-agenda,#apg-agenda) table.wk :is(td.hr,th.jv-th-hr){min-width:58px!important;width:58px!important;white-space:nowrap!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg{gap:8px 18px!important}
html body :is(#pg-agenda,#apg-agenda) .legend.jv-leg span{font-size:13.5px!important}
