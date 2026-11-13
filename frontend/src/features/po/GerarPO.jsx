// Geração da Ficha PO: formulário + roteiro (ou importação de arquivos) à esquerda, ficha ao vivo à direita.
import { useState } from 'react';
import { CabecalhoPagina } from '../../components/layout/index.js';
import { Abas, Botao } from '../../components/ui/index.js';
import { AreaImpressao } from './AreaImpressao.jsx';
import { demandaParaForm, EXEMPLO_OFICIAL, FORM_VAZIO, formParaDemanda } from './demanda.js';
import { FormProduto } from './FormProduto.jsx';
import { Importacao } from './importacao/Importacao.jsx';
import { PainelPreview } from './preview/PainelPreview.jsx';
import { MontadorRoteiro } from './roteiro/MontadorRoteiro.jsx';
import { useCatalogoPO } from './useCatalogoPO.js';
import { useOperacoesPO } from './useOperacoesPO.js';
import { usePreviewPO } from './usePreviewPO.js';

export default function GerarPO({ usuario, modo }) {
  const { mtm, maquinas } = useCatalogoPO();
  const [form, setForm] = useState(FORM_VAZIO);
  const [aba, setAba] = useState('form');
  const preview = usePreviewPO(form);

  const abrirNoFormulario = (demanda) => { setForm(demandaParaForm(demanda)); setAba('form'); };
  const ops = useOperacoesPO({ aoCarregarUnica: abrirNoFormulario });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const setRoteiro = (r) => setForm((f) => ({ ...f, roteiro: typeof r === 'function' ? r(f.roteiro) : r }));
  const demandaAtual = formParaDemanda(form);
  const poValida = preview.estado === 'ok' ? preview.po : null;
  const abas = [['form', 'Formulário'], ['arquivo', `Importar arquivos${ops.lote ? ` (${ops.lote.length})` : ''}`]];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      {/* ================= ENTRADA ================= */}
      <div className="no-print flex min-w-0 flex-col gap-5">
        <CabecalhoPagina titulo="Gerar Ficha PO" sub="Preencha, monte o roteiro ou importe arquivos. A ficha recalcula enquanto você digita."
          acao={<div className="flex gap-2">
            <Botao variante="secundario" tamanho="sm" onClick={() => { setForm(EXEMPLO_OFICIAL); setAba('form'); }}>Carregar exemplo oficial</Botao>
            <Botao variante="fantasma" tamanho="sm" onClick={() => setForm(FORM_VAZIO)}>Limpar</Botao>
          </div>} />

        <Abas abas={abas} valor={aba} aoMudar={setAba} rotulo="Forma de entrada" />

        {aba === 'form' ? (
          <>
            <FormProduto form={form} set={set} maquinas={maquinas} />
            <MontadorRoteiro mtm={mtm} roteiro={form.roteiro} setRoteiro={setRoteiro} />
          </>
        ) : (
          <Importacao ocupado={ops.ocupado} importar={ops.importar} lote={ops.lote} abrir={abrirNoFormulario}
            baixarTodas={ops.baixarLote} enviarTodas={ops.enviarLote} imprimirTodas={ops.imprimirLote} />
        )}
      </div>

      {/* ================= PRÉ-VISUALIZAÇÃO ================= */}
      <PainelPreview preview={preview} poValida={poValida} ocupado={ops.ocupado} email={usuario.email} modo={modo}
        aoBaixar={() => ops.baixar([demandaAtual])} aoImprimir={() => ops.imprimirPOs([poValida])} aoEnviar={() => ops.enviar([demandaAtual])} />

      <AreaImpressao pos={ops.imprimir || (poValida ? [poValida] : [])} />
    </div>
  );
}
