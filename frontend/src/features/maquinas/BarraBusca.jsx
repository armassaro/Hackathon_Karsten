import { BarraCartao, Botao, Contador, Entrada, IconeBusca, IconeFiltro, Selo, SetaExpandir } from '../../components/ui/index.js';
import { SeloSomenteLeitura } from '../cadastros/index.js';

/** Campo de texto + "Buscar máquinas" + botão que abre os filtros avançados. */
export function BarraBusca({ busca, setBusca, pendente, filtrosAbertos, alternarFiltros, idFiltros, nAtivos, admin }) {
  return (
    <BarraCartao className="flex flex-wrap items-center gap-3">
      <Entrada value={busca} onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por código, tipo ou modelo…" aria-label="Texto da busca" className="max-w-xs" />
      <Botao type="submit" tamanho="sm" variante={pendente ? 'primario' : 'secundario'}>
        <IconeBusca />
        Buscar máquinas
      </Botao>
      <Botao type="button" variante={filtrosAbertos ? 'secundario' : 'fantasma'} tamanho="sm" aria-expanded={filtrosAbertos} aria-controls={idFiltros}
        onClick={alternarFiltros}>
        <IconeFiltro />
        Filtros avançados
        {nAtivos > 0 && <Contador>{nAtivos}</Contador>}
        <SetaExpandir aberta={filtrosAbertos} />
      </Botao>
      {pendente && <Selo tom="warn">alterações não aplicadas</Selo>}
      {!admin && <SeloSomenteLeitura />}
    </BarraCartao>
  );
}
