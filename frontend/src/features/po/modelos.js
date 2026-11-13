// Arquivos-modelo de demanda oferecidos para download na importação.
import { salvarArquivo } from '../../lib/api.js';

export const MODELOS = {
  'demanda_exemplo.txt': ['text/plain', 'Título: PO-SL-001\nREV: 00\nOperação: "Bainhar no corpo do SL - 1 lado"\nAgrupamento família: Sobre-lençol\nTamanho: Solteiro\nMedidas da peça (em m): 1,80 x 2,50\nPontos/cm: 2,50\nPerímetro costura (em m): 6,96\nCód. Eqp: 1\nElementos: 2.1, 1.1, 3.1\n'],
  'demanda_exemplo.json': ['application/json', JSON.stringify({ titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar no corpo do SL - 1 lado', familia: 'Sobre-lençol', tamanho: 'Solteiro', medidas: '1,80 x 2,50', pontos_cm: 2.5, perimetro_m: 6.96, cod_eqp: 1, roteiro: ['2.1', '1.1', '3.1'] }, null, 2)],
  'lote_exemplo.csv': ['text/csv', 'titulo;revisao;operacao;familia;tamanho;medidas;pontos_cm;perimetro_m;cod_eqp;elementos\nPO-SL-001;00;Bainhar no corpo do SL - 1 lado;Sobre-lençol;Solteiro;1,80 x 2,50;2,50;6,96;1;2.1, 1.1, 3.1\nPO-SL-002;00;Bainhar no corpo do SL - 1 lado;Sobre-lençol;Casal;2,30 x 2,50;2,50;7,96;1;2.1, 1.1, 3.1\nPO-SL-003;00;Costurar elástico;Sobre-lençol;Queen;2,40 x 2,60;2,50;8,20;2;2.1, 5.2x4, 1.1, 3.1\n'],
};

export function baixarModelo(nome) {
  const [tipo, conteudo] = MODELOS[nome];
  salvarArquivo({ blob: new Blob([conteudo], { type: tipo }), nome });
}
