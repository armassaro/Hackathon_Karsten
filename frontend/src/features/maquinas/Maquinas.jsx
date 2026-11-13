// Cadastro de máquinas (TEMPO-CM): busca com filtros avançados, tabela ordenável e CRUD (admin).
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useRecurso } from '../../hooks/useRecurso.js';
import { Pagina } from '../../components/layout/index.js';
import { Botao, Cartao } from '../../components/ui/index.js';
import { EstadoLista, FormRegistro, useAcaoApi } from '../cadastros/index.js';
import { BarraBusca } from './BarraBusca.jsx';
import { CAMPOS_MAQUINA } from './campos.js';
import { PainelFiltros } from './PainelFiltros.jsx';
import { TabelaMaquinas } from './TabelaMaquinas.jsx';
import { useConsultaMaquinas } from './useConsultaMaquinas.js';

const ID_FILTROS = 'filtros-maquinas';
const rotaMaquina = (m) => `/maquinas/${encodeURIComponent(m.codigo)}`;

export default function Maquinas({ usuario }) {
  const admin = usuario.papel === 'admin';
  // Admin sempre recebe também as desativadas; "Mostrar desativadas" vira um filtro local (sem nova requisição).
  const [itens, recarregar] = useRecurso(`/maquinas${admin ? '?inativas=1' : ''}`);
  const c = useConsultaMaquinas(itens);
  const [editando, setEditando] = useState(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const acao = useAcaoApi();

  const desativar = (m) => acao({
    confirmar: { titulo: `Desativar máquina ${m.codigo}?`, perigo: true, confirmar: 'Desativar',
      mensagem: `${m.tipo} ${m.descricao} deixará de aparecer para novas POs. É uma exclusão lógica: o registro continua no cadastro e pode ser reativado.` },
    chamar: () => api.del(rotaMaquina(m)), sucesso: `Máquina ${m.codigo} desativada.`, depois: recarregar,
  });
  const reativar = (m) => acao({
    chamar: () => api.post(`${rotaMaquina(m)}/reativar`), sucesso: `Máquina ${m.codigo} reativada.`, depois: recarregar,
  });

  return (
    <Pagina titulo="Máquinas" sub="Cadastro TEMPO-CM: o tempo/metro de cada máquina define o elemento FIXO da ficha."
      acao={admin && <Botao onClick={() => setEditando({})}>+ Nova máquina</Botao>}>
      <Cartao corpoClassName="p-0">
        <form onSubmit={c.buscar} role="search" aria-label="Buscar máquinas">
          <BarraBusca busca={c.rascunho.busca} setBusca={(busca) => c.setRascunho((r) => ({ ...r, busca }))}
            pendente={c.pendente} nAtivos={c.nAtivos} admin={admin} idFiltros={ID_FILTROS}
            filtrosAbertos={filtrosAbertos} alternarFiltros={() => setFiltrosAbertos((v) => !v)} />
          <PainelFiltros id={ID_FILTROS} aberto={filtrosAbertos} consulta={c.rascunho} setConsulta={c.setRascunho} lim={c.lim}
            admin={admin} aoLimpar={c.limparFiltros} />
        </form>
        <EstadoLista itens={itens === null ? null : c.visiveis}
          vazio={<>Nenhuma máquina encontrada.{c.nAtivos > 0 && <> <button className="text-accent hover:underline" onClick={c.limparFiltros}>Limpar filtros</button></>}</>}>
          <TabelaMaquinas maquinas={c.visiveis} ordem={c.ordem} setOrdem={c.setOrdem} admin={admin}
            aoEditar={setEditando} aoDesativar={desativar} aoReativar={reativar} />
        </EstadoLista>
      </Cartao>
      <FormRegistro aberto={!!editando} aoFechar={() => setEditando(null)} aoSalvar={recarregar}
        titulo={editando?.codigo ? `Editar máquina ${editando.codigo}` : 'Nova máquina'}
        rota="/maquinas" chave="codigo" inicial={editando ?? {}} campos={CAMPOS_MAQUINA} />
    </Pagina>
  );
}
