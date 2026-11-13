import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ehDecimalParcial, ehInteiroParcial } from '../../lib/digitacao.js';
import { useAvisar } from '../../components/feedback/index.js';
import { Campo, Entrada, ListaErros, ModalFormulario } from '../../components/ui/index.js';

/** Valores iniciais (texto) dos campos; números usam vírgula decimal. */
const valoresIniciais = (campos, inicial) => Object.fromEntries(campos.map((c) => [
  c.nome,
  inicial[c.nome] === undefined ? '' : c.numero ? String(inicial[c.nome]).replace('.', ',') : String(inicial[c.nome]),
]));

/**
 * Modal genérico de criar/editar, com validação no servidor (Zod) exibida no formulário.
 * campos: [{ nome, rotulo, numero?, inteiro?, fixoAoEditar?, placeholder? }]; campos `numero` só aceitam
 * dígitos e um separador decimal (`inteiro`: só dígitos). Editando = `inicial[chave]` existe:
 * PUT {rota}/{chave}; senão POST {rota}.
 */
export function FormRegistro({ aberto, aoFechar, aoSalvar, titulo, rota, chave, inicial, campos }) {
  const editando = !!inicial[chave];
  const [valores, setValores] = useState({});
  const [erros, setErros] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const avisar = useAvisar();

  useEffect(() => {
    if (!aberto) return;
    setErros([]);
    setValores(valoresIniciais(campos, inicial));
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setErros([]);
    try {
      if (editando) await api.put(`${rota}/${encodeURIComponent(inicial[chave])}`, valores);
      else await api.post(rota, valores);
      avisar(editando ? 'Alterações salvas.' : 'Cadastro criado.');
      aoSalvar(); aoFechar();
    } catch (err) {
      setErros(err.erros?.length ? err.erros : [err.message]);
    } finally { setSalvando(false); }
  }

  return (
    <ModalFormulario aberto={aberto} titulo={titulo} aoFechar={aoFechar} aoEnviar={salvar} enviando={salvando}>
      {campos.map((c) => (
        <CampoRegistro key={c.nome} campo={c} valor={valores[c.nome] ?? ''} bloqueado={editando && c.fixoAoEditar}
          aoMudar={(v) => setValores((x) => ({ ...x, [c.nome]: v }))} />
      ))}
      <ListaErros erros={erros} />
    </ModalFormulario>
  );
}

function CampoRegistro({ campo: c, valor, bloqueado, aoMudar }) {
  const aceita = !c.numero ? null : c.inteiro ? ehInteiroParcial : ehDecimalParcial;
  return (
    <Campo rotulo={c.rotulo}>
      <Entrada value={valor} disabled={bloqueado} placeholder={c.placeholder}
        inputMode={c.numero ? (c.inteiro ? 'numeric' : 'decimal') : undefined} className={c.numero ? 'num' : undefined}
        onChange={(e) => { if (!aceita || aceita(e.target.value)) aoMudar(e.target.value); }} />
    </Campo>
  );
}
