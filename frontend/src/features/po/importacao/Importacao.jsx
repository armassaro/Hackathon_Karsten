import { Cartao, ZonaArquivos } from '../../../components/ui/index.js';
import { baixarModelo, MODELOS } from '../modelos.js';
import { ResultadoLote } from './ResultadoLote.jsx';

const ACEITOS = '.txt,.json,.csv,.xlsx,.xls,.ods';

/**
 * Importação de 1..50 arquivos de demanda (txt, json, csv, xlsx, ods) e o resultado do lote.
 * ocupado vem de useOperacoesPO; as ações do lote chegam prontas.
 */
export function Importacao({ ocupado, importar, lote, abrir, baixarTodas, enviarTodas, imprimirTodas }) {
  return (
    <>
      <Cartao titulo="Importar demandas">
        <ZonaArquivos multiple accept={ACEITOS} aoEscolher={importar}
          titulo={ocupado === 'importar' ? 'Lendo arquivos…' : 'Arraste arquivos aqui ou clique para escolher'}
          subtitulo=".txt (formato oficial) · .json · .csv · .xlsx · .ods — vários de uma vez, várias demandas por arquivo" />
        <LinksModelos />
      </Cartao>
      {lote && <ResultadoLote lote={lote} ocupado={ocupado} abrir={abrir} baixarTodas={baixarTodas} enviarTodas={enviarTodas} imprimirTodas={imprimirTodas} />}
    </>
  );
}

function LinksModelos() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
      Modelos:
      {Object.keys(MODELOS).map((n) => <button key={n} onClick={() => baixarModelo(n)} className="num text-accent hover:underline">{n}</button>)}
    </div>
  );
}
