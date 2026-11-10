// Gera a Ficha PO em .xlsx reproduzindo o gabarito PO-SL-000 célula a célula
// (mesmas mesclagens, larguras, cores e formatos numéricos), com fórmulas vivas:
// se o engenheiro alterar o perímetro ou uma frequência na planilha, os tempos recalculam.
import ExcelJS from 'exceljs';

const CINZA = 'FFD9D9D9';
const AMARELO = 'FFFFFF00';
const FONTE = { name: 'Arial', size: 10 };
const BORDA = { style: 'hair', color: { argb: 'FF000000' } };
const BORDAS = { top: BORDA, left: BORDA, bottom: BORDA, right: BORDA };

function estilo(cel, { negrito = false, fundo, quebra = false, tamanho = 10, formato } = {}) {
  cel.font = { ...FONTE, size: tamanho, bold: negrito };
  cel.alignment = { horizontal: 'center', vertical: 'middle', wrapText: quebra };
  cel.border = BORDAS;
  if (fundo) cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fundo } };
  if (formato) cel.numFmt = formato;
}

function rotulos(ws, linha, textos) {
  textos.forEach((t, i) => {
    if (t === null) return; // célula coberta por mesclagem: escrever nela apagaria a principal
    const c = ws.getRow(linha).getCell(i + 1);
    c.value = t;
    estilo(c, { negrito: true, fundo: CINZA, quebra: true });
  });
}

/** Nome de aba válido no Excel (máx. 31 caracteres, sem []:*?/\) e único no arquivo. */
function nomeAba(wb, base) {
  const limpo = (base || 'PO').replace(/[[\]:*?/\\]/g, '-').slice(0, 28);
  let nome = limpo, n = 2;
  while (wb.getWorksheet(nome)) nome = `${limpo}-${n++}`;
  return nome;
}

export function adicionarAbaPO(wb, po, nome) {
  const { cabecalho: c, equipamento: eq, linhas, tp_min } = po;
  const ws = wb.addWorksheet(nomeAba(wb, nome), {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true },
  });
  ws.columns = [{ width: 19.86 }, { width: 26.08 }, { width: 17.97 }, { width: 14.46 }, { width: 22.16 }];

  // Linha 1 — título e revisão
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = c.titulo;
  estilo(ws.getCell('A1'), { negrito: true, tamanho: 16 });
  ws.getCell('E1').value = `Rev. ${c.revisao}`;
  estilo(ws.getCell('E1'), { negrito: true, tamanho: 16 });
  ws.getRow(1).height = 39;

  // Linha 2 — operação
  ws.getCell('A2').value = 'Operação';
  estilo(ws.getCell('A2'), { negrito: true, fundo: CINZA });
  ws.mergeCells('B2:E2');
  ws.getCell('B2').value = c.operacao;
  estilo(ws.getCell('B2'), { fundo: 'FFFFFFFF' });

  // Linhas 3-4 — produto
  rotulos(ws, 3, ['Agrupamento família', 'Tamanho', 'Medidas da peça (em m)', 'Pontos/cm', 'Perímetro costura\n(em m)']);
  ws.getRow(3).height = 23.85;
  const r4 = ws.getRow(4);
  [c.familia, c.tamanho, c.medidas, c.pontos_cm, c.perimetro_m].forEach((v, i) => { r4.getCell(i + 1).value = v ?? ''; });
  ['A4', 'B4', 'C4'].forEach((k) => estilo(ws.getCell(k)));
  estilo(ws.getCell('D4'), { formato: '0.00' });
  estilo(ws.getCell('E4'), { formato: '0.00' });

  // Linhas 5-6 — equipamento (limites de RPM como fórmula, igual ao gabarito)
  rotulos(ws, 5, ['Cód. Eqp.', 'Equipamento', 'RPM - limite inferior', 'RPM - padrão', 'RPM - limite superior']);
  ws.getCell('A6').value = Number.isFinite(Number(eq.codigo)) ? Number(eq.codigo) : eq.codigo;
  ws.getCell('B6').value = eq.tipo;
  ws.getCell('C6').value = { formula: 'D6*0.9', result: eq.rpm_min };
  ws.getCell('D6').value = eq.rpm_padrao;
  ws.getCell('E6').value = { formula: 'D6*1.1', result: eq.rpm_max };
  ['A6', 'B6', 'C6', 'D6', 'E6'].forEach((k) => estilo(ws.getCell(k)));

  // Linha 7 — cabeçalho dos elementos
  ws.mergeCells('B7:C7');
  rotulos(ws, 7, ['Código do elemento', 'Elementos', null, 'Frequência', 'Tempos (em minutos)']);

  // Linhas 8+ — FIXO e elementos MTM
  let r = 8;
  for (const l of linhas) {
    const fixo = l.codigo === 'FIXO';
    ws.mergeCells(`B${r}:C${r}`);
    ws.getCell(`A${r}`).value = l.codigo;
    ws.getCell(`B${r}`).value = l.descricao;
    ws.getCell(`D${r}`).value = l.frequencia;
    ws.getCell(`E${r}`).value = fixo
      ? { formula: `ROUND(E4*${eq.tempo_por_metro},4)`, result: l.tempo_min }
      : l.tempo_min;
    const fundo = fixo ? AMARELO : undefined;
    estilo(ws.getCell(`A${r}`), { negrito: true, fundo });
    estilo(ws.getCell(`B${r}`), { fundo });
    estilo(ws.getCell(`D${r}`), { fundo });
    estilo(ws.getCell(`E${r}`), { fundo, formato: '0.0000' });
    r++;
  }

  // Linha final — Tempo Total da Operação (TP), exigido pelo regulamento (item 3.3)
  ws.mergeCells(`B${r}:D${r}`);
  ws.getCell(`A${r}`).value = 'TP';
  ws.getCell(`B${r}`).value = 'Tempo total da operação (FIXO + MTM)';
  ws.getCell(`E${r}`).value = { formula: `ROUND(SUMPRODUCT(D8:D${r - 1},E8:E${r - 1}),4)`, result: tp_min };
  estilo(ws.getCell(`A${r}`), { negrito: true, fundo: CINZA });
  estilo(ws.getCell(`B${r}`), { negrito: true, fundo: CINZA });
  estilo(ws.getCell(`E${r}`), { negrito: true, fundo: CINZA, formato: '0.0000' });

  ws.pageSetup.printArea = `A1:E${r}`;
  return ws;
}

/** Gera um arquivo .xlsx com uma aba por PO (um único PO ou um lote). */
export async function gerarXlsx(pos) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Auto-T&M Karsten';
  wb.created = new Date();
  const lista = Array.isArray(pos) ? pos : [pos];
  lista.forEach((po) => adicionarAbaPO(wb, po, lista.length === 1 ? 'PO' : po.cabecalho.titulo));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
