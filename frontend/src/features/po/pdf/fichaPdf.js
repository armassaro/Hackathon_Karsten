// Desenha a Ficha PO em PDF (vetorial, texto selecionável) no layout do gabarito PO-SL-000.
// Puro: não usa DOM, então roda tanto no Web Worker quanto na thread principal.
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { dec, inteiro, min4 } from '../../../lib/fmt.js';

const LARGURAS = [19.86, 26.08, 17.97, 14.46, 22.16]; // mesmas proporções da ficha na tela
const CINZA = [217, 217, 217];
const AMARELO = [255, 255, 0];
const MARGEM = 15; // mm

/** Célula de cabeçalho (cinza, negrito). */
const h = (content, colSpan = 1) => ({ content, colSpan, styles: { fillColor: CINZA, fontStyle: 'bold' } });
const traco = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

/** Linhas da tabela (cada célula no formato do jspdf-autotable). */
function linhasDaFicha({ cabecalho: c, equipamento: eq, linhas, tp_min }) {
  return [
    [{ content: traco(c.titulo), colSpan: 4, styles: { fontStyle: 'bold', fontSize: 18, minCellHeight: 14 } },
      { content: `Rev. ${traco(c.revisao)}`, styles: { fontStyle: 'bold', fontSize: 14 } }],
    [h('Operação'), { content: traco(c.operacao), colSpan: 4 }],
    [h('Agrupamento família'), h('Tamanho'), h('Medidas da peça (em m)'), h('Pontos/cm'), h('Perímetro costura (em m)')],
    [traco(c.familia), traco(c.tamanho), traco(c.medidas), c.pontos_cm == null ? '—' : dec(c.pontos_cm), dec(c.perimetro_m)],
    [h('Cód. Eqp.'), h('Equipamento'), h('RPM - limite inferior'), h('RPM - padrão'), h('RPM - limite superior')],
    [traco(eq.codigo), traco(eq.tipo), inteiro(eq.rpm_min), inteiro(eq.rpm_padrao), inteiro(eq.rpm_max)],
    [h('Código do elemento'), h('Elementos', 2), h('Frequência'), h('Tempos (em minutos)')],
    ...linhas.map((l) => {
      const fixo = l.codigo === 'FIXO' ? { fillColor: AMARELO } : {};
      return [
        { content: l.codigo, styles: { fontStyle: 'bold', ...fixo } },
        { content: traco(l.descricao), colSpan: 2, styles: fixo },
        { content: inteiro(l.frequencia), styles: fixo },
        { content: min4(l.tempo_min), styles: fixo },
      ];
    }),
    [h('TP'), h('Tempo total da operação (FIXO + MTM)', 3), h(min4(tp_min))],
  ];
}

/** Gera o PDF (A4 retrato) e devolve os bytes (ArrayBuffer). */
export function montarPdfFicha(po, { geradoEm = new Date() } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const largura = doc.internal.pageSize.getWidth() - 2 * MARGEM;
  const soma = LARGURAS.reduce((a, b) => a + b, 0);
  doc.setProperties({ title: `Ficha PO ${po.cabecalho.titulo || ''}`.trim(), subject: po.cabecalho.operacao || '', creator: 'Auto-T&M' });

  autoTable(doc, {
    body: linhasDaFicha(po),
    theme: 'grid',
    margin: { left: MARGEM, right: MARGEM, top: MARGEM },
    columnStyles: Object.fromEntries(LARGURAS.map((w, i) => [i, { cellWidth: (w / soma) * largura }])),
    styles: {
      font: 'helvetica', fontSize: 9.5, textColor: 0, lineColor: 0, lineWidth: 0.25,
      halign: 'center', valign: 'middle', cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, fillColor: [255, 255, 255],
    },
  });

  const data = geradoEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(110);
  doc.text(`Gerado pelo Auto-T&M em ${data}`, MARGEM, doc.lastAutoTable.finalY + 6);
  return doc.output('arraybuffer');
}
