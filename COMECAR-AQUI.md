# Começar aqui

Checklist do que falta fazer. Marque conforme for. O detalhe de cada assunto
está em [`PUBLICAR.md`](PUBLICAR.md) (endereços) e
[`ferramentas/FIREBASE.md`](ferramentas/FIREBASE.md) (banco de dados).

---

## 1 · Endereço novo — urgente, 5 minutos

- [ ] Abrir no celular e confirmar que carrega:
      - Gestão: `https://joaovictorteniscoach-cpu.github.io/familiajk/app-gestao/`
      - Aluno: `https://joaovictorteniscoach-cpu.github.io/familiajk/app-aluno/`
      - Site: `https://joaovictorteniscoach-cpu.github.io/familiajk/site/`
- [ ] Instalar Gestão e Aluno na tela de início (Safari → compartilhar →
      **Adicionar à Tela de Início**)
- [ ] Conferir julho no Financeiro (seta `‹`)

**Deu certo se:** a Gestão abre com os alunos e o rodapé diz `✓ salvo na nuvem`.

**Se abrir vazio, não mexa em nada.** Vazio quer dizer que ele não conseguiu ler
o Firebase. Existe uma trava (`CARREGADO`) que impede o app de gravar por cima
do dado bom nessa situação — mas não force.

---

## 1b · Netlify congelado — importante

Com o deploy automático desligado, o Netlify **parou na versão que tinha**. A
correção da perda de dados entrou hoje às 15:40, bem no meio do período em que a
cota estourou — é provável que o Netlify não a tenha recebido.

Como os dois endereços gravam no **mesmo banco**, abrir a Gestão pelo endereço
antigo numa rede ruim ainda pode apagar tudo, e o estrago aparece nos dois.

- [ ] **Até resolver, usar só o endereço do Pages**
- [ ] Um deploy manual em cada projeto: *Deploys → Trigger deploy → Deploy site*
      (só `app-gestao` e `app-aluno` — o resto pode esperar)
- [ ] Depois disso, pode deixar o automático desligado

Os apps agora avisam sozinhos: se você abrir um endereço desatualizado, aparece
uma **barra vermelha no topo** com o endereço certo. A versão de cada endereço
também aparece em *Financeiro → Segurança*.

---

## 2 · Fechar a raiz do banco — hoje, 2 minutos

- [ ] Console do Firebase → *Realtime Database* → **Regras**
- [ ] Apagar tudo e colar `ferramentas/firebase-regras-etapa1.json`
- [ ] **Publicar**
- [ ] Abrir a Gestão, mexer em algo, confirmar `✓ salvo na nuvem`

**Para desfazer:** cole de volta o que estava lá e publique. Leva 10 segundos e
nenhum dado se perde nesse meio-tempo — o app trabalha local e sobe depois.

---

## 3 · A tranca — quando puder

- [ ] Console → **Authentication** → *Sign-in method* → ativar
      **E-mail/senha** e **Anônimo**
- [ ] *Users* → **Add user** → criar a conta → **copiar o UID**
- [ ] Gestão → *Financeiro → Segurança → Sua conta* → entrar →
      confirmar **✅ Conectado**
- [ ] Mandar o UID para o Claude, que devolve as regras da etapa 2 preenchidas
- [ ] Colar `firebase-regras-etapa2.json` e publicar
- [ ] Conferir: Gestão salva, app do aluno carrega e manda pedido

Sem o **Anônimo** ativado, o app do aluno para de mandar pedidos depois que as
regras fecharem.

Ordem importa: **só troque as regras depois do ✅ Conectado.**

---

## 4 · Netlify — sem pressa

- [ ] Painel → **Usage** → ver qual limite estourou (tráfego ou minutos)
- [ ] Se for minutos: pausar os projetos que viraram reserva em
      *Site configuration → General → Danger zone → Stop builds*

Pausar não apaga nada: o endereço continua servindo a última versão, só para de
reconstruir.

---

## 5 · Avisar os alunos

- [ ] Mandar o link novo: `https://joaovictorteniscoach-cpu.github.io/familiajk/app-aluno/`
- [ ] Pedir para **adicionar à tela de início**

Site aberto só pelo navegador no Safari tem os dados locais apagados pelo
sistema depois de semanas sem uso. Instalado, não.

---

## Se alguma coisa parecer errada

1. **Não force nem repita a ação.** O app guarda versões — dá para voltar.
2. *Financeiro → **🔎 Conferir números*** aponta o que não fecha, sem corrigir
   nada sozinho.
3. *Financeiro → **🕘 Ver versões salvas*** volta para uma versão anterior; a
   atual é guardada antes, então dá para desfazer a volta.
4. *Financeiro → **⬇ Exportar backup*** tira uma cópia que não depende de
   nuvem nenhuma. Vale fazer uma agora e guardar.
