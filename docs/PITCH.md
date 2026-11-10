# Roteiro do pitch (5 min + 3 min de arguição)

Critérios: Aderência e precisão **35** · Arquitetura e código **20** · Ingestão e criatividade **20** · Pitch **25**.

## Antes de entrar na sala (checklist)

- [ ] `npm test` verde (39 testes); deixar o terminal aberto com o resultado.
- [ ] Servidor no ar **no modo Google**, logado como engenheiro em uma aba e como **leitor em uma janela anônima**.
- [ ] Caixa de e-mail aberta em outra aba (a PO vai chegar ali).
- [ ] Na área de trabalho: `demanda_000.txt`, `lote_exemplo.csv` (baixe pela tela) e o gabarito `PO-SL-000.ods` aberto no LibreOffice.
- [ ] **Plano B**: um segundo `.env` com `STORE=local` e `DEV_EXIBIR_CODIGO=true`. Se a rede cair, troque e reinicie (10 s).
- [ ] Zoom do navegador em 110–125% para a banca enxergar.

## Roteiro

**0:00–0:30 · O problema.** "Hoje a ficha PO é montada à mão: consultar o tempo/metro da máquina, multiplicar pelo perímetro, procurar cada código MTM, somar. É lento e sujeito a erro de digitação. O Auto-T&M faz isso em segundos, a partir de qualquer arquivo."

**0:30–1:45 · Precisão (35 pts).** Faça upload do **`demanda_000.txt` oficial**, sem editar nada.
- Mostre a ficha: FIXO **0,6709**, TP **0,9409**, RPM 4500/5000/5500.
- Abra a **memória de cálculo**: 6,96 × 0,0964 = 0,6709.
- Clique em **Baixar .xlsx** e abra lado a lado com o gabarito: "Mesmo layout, mesmas células. Temos um teste automatizado que compara célula a célula com o gabarito oficial." No LibreOffice, mude o perímetro: o FIXO e o TP recalculam (fórmulas vivas).

**1:45–2:45 · Ingestão e criatividade (20 pts).**
- Arraste o `lote_exemplo.csv` junto com um arquivo com erro: "Cinquenta arquivos de uma vez, txt, json, csv, xlsx, ods. Cada linha é validada sozinha; a inválida mostra exatamente o problema e não derruba o lote."
- Clique em **Baixar 3 POs .xlsx**: uma aba por PO.
- No formulário: arraste um elemento da matriz para o roteiro, mude a **frequência** para 3 e mostre a ficha recalculando ao vivo. Digite `9.9` e mostre o erro claro.

**2:45–3:45 · Segurança e arquitetura (20 pts).**
- Login sem senha: o código chega no e-mail.
- Na janela do **leitor**, tente excluir uma máquina: botão ausente. Na API, `403`. Em Administração → Auditoria, o `ACESSO_NEGADO` aparece registrado.
- **Enviar para meu e-mail**: a PO chega na caixa com o anexo. "O destinatário vem da sessão assinada, nunca do navegador: não dá para mandar a ficha para fora da empresa."
- Mostre o diagrama do README: frontend → backend (JWT, papéis, motor) → Apps Script (HMAC + anti-replay).

**3:45–4:30 · Engenharia.** Mostre o terminal com os 39 testes: "o motor é uma função pura; rodamos a mesma suíte da API contra o armazenamento local e contra o Apps Script real executado em simulador". Mencione o token de API e o `curl` para automação em lote.

**4:30–5:00 · Fechamento.** "Precisão idêntica ao gabarito, qualquer formato de entrada, seguro para a intranet e pronto para piloto: basta uma planilha Google e um servidor Node."

## Perguntas prováveis

- **"E se o Google cair?"** O armazenamento é uma interface com duas implementações. `STORE=local` mantém tudo funcionando sem internet; leituras têm cache de 30 s.
- **"Por que não gerar a planilha no Apps Script?"** Para ter uma única fonte da verdade, testável, para o layout. O Apps Script só anexa o arquivo.
- **"Como garantem que o cálculo está certo?"** Teste que lê o gabarito oficial e compara as células A1:E11 com a ficha gerada, além de casos com frequência, lote e erros.
- **"E a densidade de pontos (pontos/cm)?"** Vai para o cabeçalho, como no gabarito. Ela não entra na fórmula do regulamento: o tempo/metro cadastrado já incorpora a máquina. Uma evolução possível é usá-la com o RPM para validar se o tempo/metro cadastrado é coerente.
- **"Por que um código por e-mail e não senha?"** Não há senha para vazar ou esquecer, e o e-mail corporativo já é o canal de confiança. Os códigos ficam guardados como hash, valem 10 min e aceitam 5 tentativas.
- **"Quem é demitido perde o acesso quando?"** Em até 30 s: o papel é lido do cadastro a cada requisição, não do token.
- **"Escala?"** O MailApp tem cota diária (~100 e-mails em contas comuns, mais no Workspace). Para produção, trocar o store por um banco relacional exige só implementar a mesma interface.
