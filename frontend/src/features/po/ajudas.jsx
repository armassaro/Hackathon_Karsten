// Textos das caixas de ajuda ("?") dos cartões da página Gerar PO.
import { CAMPOS_PRODUTO } from './camposProduto.js';

const Titulo = ({ children }) => <p className="mb-1.5 font-semibold text-ink">{children}</p>;
const Lista = ({ children }) => <ul className="mt-2 flex list-disc flex-col gap-1 pl-4">{children}</ul>;
const Tecla = ({ children }) => <kbd className="rounded border border-line-2 bg-paper px-1 font-mono text-[11.5px]">{children}</kbd>;

const DESCRICAO_CAMPO = {
  titulo: 'identificação da ficha (ex.: PO-SL-001).',
  revisao: 'número da revisão da ficha (ex.: 00).',
  operacao: 'descrição da operação de costura.',
  familia: 'família do produto (ex.: Sobre-lençol).',
  tamanho: 'tamanho da peça (ex.: Solteiro).',
  medidas: 'largura x comprimento em metros (ex.: 1,80 x 2,50).',
  pontos_cm: 'densidade de pontos por centímetro (apenas números).',
  perimetro_m: 'comprimento total costurado em metros (apenas números); usado no tempo FIXO.',
};

export function AjudaProduto() {
  return (
    <>
      <Titulo>Produto e operação</Titulo>
      <p>Dados de cabeçalho da Ficha PO e a máquina usada na operação.</p>
      <Lista>
        {CAMPOS_PRODUTO.map((c) => <li key={c.nome}><b>{c.rotulo}:</b> {DESCRICAO_CAMPO[c.nome]}</li>)}
        <li><b>Máquina:</b> equipamento do cadastro TEMPO-CM; define o tempo por metro e os limites de RPM.</li>
      </Lista>
      <p className="mt-3 rounded-md bg-accent-soft px-2.5 py-2 text-accent">
        Dica: aperte <Tecla>Enter</Tecla> em qualquer lugar da página para gerar a Ficha PO com os dados do formulário.
      </p>
    </>
  );
}

export function AjudaRoteiro() {
  return (
    <>
      <Titulo>Roteiro de operações</Titulo>
      <p>Sequência de elementos MTM que compõem a operação. A soma dos tempos (Σ MTM) entra no tempo padrão da ficha.</p>
      <Lista>
        <li>Clique em <b>＋</b> ou arraste um elemento da matriz para a sequência.</li>
        <li><Tecla>Ctrl</Tecla> + clique seleciona vários elementos.</li>
        <li><Tecla>Shift</Tecla> + clique seleciona um intervalo.</li>
        <li><Tecla>Ctrl</Tecla> + <Tecla>A</Tecla> seleciona todos os elementos visíveis; <Tecla>Esc</Tecla> limpa a seleção.</li>
        <li>Arraste a seleção para a sequência para incluir todos de uma vez.</li>
        <li>Na sequência, arraste ou use ↑ ↓ para reordenar e ajuste a frequência de cada elemento.</li>
      </Lista>
    </>
  );
}
