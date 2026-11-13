// Campos de texto do cartão "Produto e operação", na ordem da grade (6 colunas em telas sm+).
export const CAMPOS_PRODUTO = [
  { nome: 'titulo', rotulo: 'Título da PO', span: 'sm:col-span-4', placeholder: 'PO-SL-001' },
  { nome: 'revisao', rotulo: 'Revisão', span: 'sm:col-span-2', placeholder: '00' },
  { nome: 'operacao', rotulo: 'Operação', span: 'sm:col-span-6', placeholder: 'Bainhar no corpo do SL - 1 lado' },
  { nome: 'familia', rotulo: 'Agrupamento família', span: 'sm:col-span-2', placeholder: 'Sobre-lençol' },
  { nome: 'tamanho', rotulo: 'Tamanho', span: 'sm:col-span-2', placeholder: 'Solteiro' },
  { nome: 'medidas', rotulo: 'Medidas da peça (m)', span: 'sm:col-span-2', placeholder: '1,80 x 2,50' },
  { nome: 'pontos_cm', rotulo: 'Pontos/cm', span: 'sm:col-span-2', placeholder: '2,50', numero: true },
  { nome: 'perimetro_m', rotulo: 'Perímetro de costura (m)', span: 'sm:col-span-2', placeholder: '6,96', numero: true },
];
