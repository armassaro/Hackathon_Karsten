// Matriz de elementos MTM: consulta agrupada, CRUD e importação da planilha de cadastros (admin).
import { useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useRecurso } from '../../hooks/useRecurso.js';
import { Pagina } from '../../components/layout/index.js';
import { BarraCartao, Cartao, Entrada } from '../../components/ui/index.js';
import { EstadoLista, FormRegistro, SeloSomenteLeitura, useAcaoApi } from '../cadastros/index.js';
import { AcoesAdminMtm } from './AcoesAdminMtm.jsx';
import { CAMPOS_ELEMENTO } from './campos.js';
import { agruparPorAgrupador, filtrarElementos } from './elementos.js';
import { TabelaElementos } from './TabelaElementos.jsx';

export default function Elementos({ usuario }) {
  const admin = usuario.papel === 'admin';
  const [itens, recarregar] = useRecurso('/mtm');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [importando, setImportando] = useState(false);
  const acao = useAcaoApi();

  const visiveis = useMemo(() => filtrarElementos(itens ?? [], busca), [itens, busca]);
  const grupos = useMemo(() => agruparPorAgrupador(visiveis), [visiveis]);

  const remover = (e) => acao({
    confirmar: { titulo: `Remover elemento ${e.codigo}?`, perigo: true, confirmar: 'Remover', mensagem: `"${e.descricao}" sairá da matriz MTM. Roteiros que usam ${e.codigo} passarão a acusar erro.` },
    chamar: () => api.del(`/mtm/${encodeURIComponent(e.codigo)}`), sucesso: `Elemento ${e.codigo} removido.`, depois: recarregar,
  });

  async function importarCatalogo(arquivo) {
    if (!arquivo) return;
    const fd = new FormData(); fd.append('arquivo', arquivo);
    await acao({
      confirmar: { titulo: 'Importar planilha de cadastros?', confirmar: 'Importar',
        mensagem: `"${arquivo.name}" substituirá a matriz MTM e atualizará as máquinas (as que não estiverem no arquivo serão desativadas).` },
      chamar: async () => { setImportando(true); try { return await api.post('/catalogo/importar', fd); } finally { setImportando(false); } },
      sucesso: (r) => `Importado: ${r.elementos} elementos e ${r.maquinas} máquinas.`, depois: recarregar,
    });
  }

  return (
    <Pagina titulo="Elementos MTM" sub="Matriz de elementos: código agrupador.elemento, descrição e tempo unitário em minutos."
      acao={admin && <AcoesAdminMtm importando={importando} aoImportar={importarCatalogo} aoNovo={() => setEditando({})} />}>
      <Cartao corpoClassName="p-0">
        <BarraCartao>
          <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" className="max-w-xs" />
          {!admin && <SeloSomenteLeitura />}
        </BarraCartao>
        <EstadoLista itens={itens === null ? null : visiveis} vazio="Nenhum elemento.">
          <TabelaElementos grupos={grupos} admin={admin} aoEditar={setEditando} aoRemover={remover} />
        </EstadoLista>
      </Cartao>
      <FormRegistro aberto={!!editando} aoFechar={() => setEditando(null)} aoSalvar={recarregar}
        titulo={editando?.codigo ? `Editar elemento ${editando.codigo}` : 'Novo elemento MTM'}
        rota="/mtm" chave="codigo" inicial={editando ?? {}} campos={CAMPOS_ELEMENTO} />
    </Pagina>
  );
}
