// Regras puras da demanda de PO: estado do formulário (texto) <-> demanda da API (números).
import { novoId } from '../../lib/id.js';
import { numeroDe, textoDe } from '../../lib/fmt.js';

/** Um passo do roteiro no estado do formulário (id local só para o React). */
export const novoPasso = (codigo, frequencia = 1) => ({ id: novoId(), codigo, frequencia });

export const FORM_VAZIO = { titulo: '', revisao: '00', operacao: '', familia: '', tamanho: '', medidas: '', pontos_cm: '', perimetro_m: '', cod_eqp: '', roteiro: [] };

export const EXEMPLO_OFICIAL = {
  titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar no corpo do SL - 1 lado', familia: 'Sobre-lençol', tamanho: 'Solteiro',
  medidas: '1,80 x 2,50', pontos_cm: '2,50', perimetro_m: '6,96', cod_eqp: '1',
  roteiro: ['2.1', '1.1', '3.1'].map((codigo) => novoPasso(codigo)),
};

/** O formulário ainda não tem nada que permita calcular uma ficha? */
export const formEstaVazio = (f) => !f.perimetro_m && !f.cod_eqp && f.roteiro.length === 0;

/** Converte a demanda vinda da API (números) para o estado do formulário (texto). */
export function demandaParaForm(d) {
  return {
    ...FORM_VAZIO, ...d,
    pontos_cm: textoDe(d.pontos_cm), perimetro_m: textoDe(d.perimetro_m), cod_eqp: d.cod_eqp ?? '',
    roteiro: (d.roteiro || []).map((p) => novoPasso(p.codigo, p.frequencia ?? 1)),
  };
}

/** Converte o estado do formulário (texto) para a demanda aceita pela API. */
export function formParaDemanda(f) {
  return {
    titulo: f.titulo.trim(), revisao: f.revisao.trim() || '00', operacao: f.operacao.trim(), familia: f.familia.trim(),
    tamanho: f.tamanho.trim(), medidas: f.medidas.trim(),
    pontos_cm: f.pontos_cm === '' ? undefined : numeroDe(f.pontos_cm),
    perimetro_m: numeroDe(f.perimetro_m), cod_eqp: f.cod_eqp,
    roteiro: f.roteiro.map((p) => ({ codigo: p.codigo, frequencia: numeroDe(p.frequencia) || 1 })),
  };
}
