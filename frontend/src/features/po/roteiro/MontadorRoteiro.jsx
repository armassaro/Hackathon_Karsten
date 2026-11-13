// Montador do roteiro: arrastar da matriz MTM, reordenar, frequência, digitar códigos.
import { useMemo, useState } from 'react';
import { min4 } from '../../../lib/fmt.js';
import { Ajuda, Cartao } from '../../../components/ui/index.js';
import { AjudaRoteiro } from '../ajudas.jsx';
import { MatrizElementos } from './MatrizElementos.jsx';
import { SequenciaRoteiro } from './SequenciaRoteiro.jsx';
import { inserirCodigos, moverPasso, tempoTotalMTM } from './roteiro.js';

/** setRoteiro aceita uma lista ou uma função (roteiroAtual) => novaLista. */
export function MontadorRoteiro({ mtm, roteiro, setRoteiro }) {
  const [arrastando, setArrastando] = useState(null); // { origem: 'mtm' | 'roteiro', valor }
  const [alvo, setAlvo] = useState(null);
  const porCodigo = useMemo(() => Object.fromEntries(mtm.map((e) => [e.codigo, e])), [mtm]);

  const adicionar = (codigos, pos) => setRoteiro((r) => inserirCodigos(r, codigos, pos));
  const soltar = (pos) => {
    if (!arrastando) return;
    if (arrastando.origem === 'mtm') adicionar(arrastando.valor, pos);
    else {
      const de = roteiro.findIndex((p) => p.id === arrastando.valor);
      setRoteiro((r) => moverPasso(r, de, pos > de ? pos - 1 : pos));
    }
    setArrastando(null); setAlvo(null);
  };
  const arrastarDaMatriz = (codigos) => {
    if (codigos) setArrastando({ origem: 'mtm', valor: codigos });
    else { setArrastando(null); setAlvo(null); }
  };

  return (
    <Cartao titulo="Roteiro de operações (elementos MTM)" acao={<span className="flex items-center gap-3"><span className="num text-[13px] text-ink-3">Σ MTM {min4(tempoTotalMTM(roteiro, porCodigo))} min</span>
      <Ajuda rotulo="Ajuda: Roteiro de operações"><AjudaRoteiro /></Ajuda></span>} corpoClassName="p-0">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <MatrizElementos mtm={mtm} aoAdicionar={adicionar} aoArrastar={arrastarDaMatriz} />
        <SequenciaRoteiro roteiro={roteiro} setRoteiro={setRoteiro} porCodigo={porCodigo}
          arrastando={arrastando} setArrastando={setArrastando} alvo={alvo} setAlvo={setAlvo} aoSoltar={soltar} />
      </div>
    </Cartao>
  );
}
