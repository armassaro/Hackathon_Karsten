import { ehDecimalParcial } from '../../lib/digitacao.js';
import { dec } from '../../lib/fmt.js';
import { Ajuda, Campo, Cartao, Entrada, Selecao } from '../../components/ui/index.js';
import { AjudaProduto } from './ajudas.jsx';
import { CAMPOS_PRODUTO } from './camposProduto.js';

/** Cartão "Produto e operação": cabeçalho da ficha e máquina. set(campo) devolve o onChange do campo. */
export function FormProduto({ form, set, maquinas }) {
  return (
    <Cartao titulo="Produto e operação" acao={<Ajuda rotulo="Ajuda: Produto e operação"><AjudaProduto /></Ajuda>}>
      <div className="grid gap-4 sm:grid-cols-6">
        {CAMPOS_PRODUTO.map((c) => (
          <Campo key={c.nome} rotulo={c.rotulo} className={c.span}>
            <Entrada inputMode={c.numero ? 'decimal' : undefined} className={c.numero ? 'num' : undefined}
              value={form[c.nome]} onChange={c.numero ? soNumeros(set(c.nome)) : set(c.nome)} placeholder={c.placeholder} />
          </Campo>
        ))}
        <SeletorMaquina maquinas={maquinas} valor={form.cod_eqp} onChange={set('cod_eqp')} />
      </div>
    </Cartao>
  );
}

/** Select de máquina; a dica mostra modelo, tempo/metro e RPM da escolhida. */
function SeletorMaquina({ maquinas, valor, onChange }) {
  const sel = maquinas.find((m) => m.codigo === valor);
  return (
    <Campo rotulo="Máquina" className="sm:col-span-2"
      dica={sel ? `${sel.descricao} · ${dec(sel.tempo_por_metro, 4)} min/m · ${sel.rpm} RPM` : 'Cadastro TEMPO-CM'}>
      <Selecao value={valor} onChange={onChange}>
        <option value="">Selecione…</option>
        {maquinas.map((m) => <option key={m.codigo} value={m.codigo}>{m.codigo} · {m.tipo} {m.descricao && `(${m.descricao})`}</option>)}
      </Selecao>
    </Campo>
  );
}

/** Aceita só dígitos e um separador decimal (vírgula ou ponto); outras teclas são ignoradas. */
const soNumeros = (onChange) => (e) => {
  if (ehDecimalParcial(e.target.value)) onChange(e);
};
