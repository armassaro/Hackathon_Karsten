import { Botao, Cartao, ListaErros, Vazio } from '../../../components/ui/index.js';
import { FichaPO } from '../FichaPO.jsx';
import { MemoriaCalculo } from './MemoriaCalculo.jsx';
import { StatusPreview, TotalTP } from './StatusPreview.jsx';

/**
 * Coluna da ficha ao vivo: status, ficha, memória de cálculo e ações (baixar, imprimir, enviar).
 * poValida = ficha calculada sem pendências (ou null). As ações recebem só callbacks prontos.
 */
export function PainelPreview({ preview, aoGerar, poValida, ocupado, aoBaixar, aoImprimir, aoEnviar, email, modo }) {
  return (
    <div className="min-w-0 xl:sticky xl:top-[76px] xl:self-start">
      <Cartao className="print-area no-print" titulo={<StatusPreview preview={preview} />} acao={<div className="flex items-center gap-3">{poValida && <TotalTP tp={poValida.tp_min} />}
          <Botao tamanho="sm" carregando={preview.estado === 'calculando'} onClick={aoGerar}>Gerar documento de ficha</Botao></div>}>
        {preview.estado === 'vazio' && <Vazio>Preencha os dados, monte o roteiro (ou clique em <b>Carregar exemplo oficial</b>) e aperte <b>Enter</b> ou <b>Gerar documento de ficha</b>.</Vazio>}
        {preview.estado === 'erro' && <ListaErros variante="destaque" erros={preview.erros} />}
        {preview.po && <FichaComMemoria po={preview.po} atualizada={preview.estado === 'ok'} />}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Botao disabled={!poValida} carregando={ocupado === 'baixar'} onClick={aoBaixar}>Baixar .xlsx</Botao>
          <Botao variante="secundario" disabled={!poValida} onClick={aoImprimir}>Imprimir / PDF</Botao>
          <Botao variante="secundario" disabled={!poValida} carregando={ocupado === 'enviar'} onClick={aoEnviar}>Enviar para meu e-mail</Botao>
        </div>
        <p className="mt-2 text-xs text-ink-3">O e-mail vai sempre para <b>{email}</b>{modo === 'local' && ' (modo local: simulado)'}.</p>
      </Cartao>
    </div>
  );
}

/** Ficha + memória; esmaecida enquanto recalcula ou se o último cálculo falhou. */
function FichaComMemoria({ po, atualizada }) {
  return (
    <div className={!atualizada ? 'opacity-40 transition-opacity' : 'transition-opacity'}>
      <div className="overflow-x-auto"><div className="min-w-[520px]"><FichaPO po={po} /></div></div>
      <MemoriaCalculo po={po} />
    </div>
  );
}
