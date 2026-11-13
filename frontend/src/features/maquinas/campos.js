// Campos do formulário de cadastro/edição de máquina (FormRegistro).
export const CAMPOS_MAQUINA = [
  { nome: 'codigo', rotulo: 'Código', fixoAoEditar: true, placeholder: '4' },
  { nome: 'tipo', rotulo: 'Tipo / equipamento', placeholder: 'Interlock' },
  { nome: 'descricao', rotulo: 'Descrição / modelo', placeholder: 'Jack C4' },
  { nome: 'rpm', rotulo: 'RPM padrão', numero: true, placeholder: '5000' },
  { nome: 'tempo_por_metro', rotulo: 'Tempo por metro (min/m)', numero: true, placeholder: '0,0964' },
];
