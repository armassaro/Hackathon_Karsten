// Ficha PO na tela, no mesmo layout do gabarito PO-SL-000 (cinza D9D9D9, FIXO em amarelo, Arial).
import { dec, inteiro, min4 } from '../../lib/fmt.js';

const LARGURAS = [19.86, 26.08, 17.97, 14.46, 22.16];
const total = LARGURAS.reduce((a, b) => a + b, 0);

export function FichaPO({ po }) {
  const { cabecalho: c, equipamento: eq, linhas, tp_min } = po;
  return (
    <table className="ficha" aria-label={`Ficha PO ${c.titulo}`}>
      <colgroup>{LARGURAS.map((w, i) => <col key={i} style={{ width: `${(w / total) * 100}%` }} />)}</colgroup>
      <tbody>
        <tr style={{ height: 52 }}>
          <td colSpan={4} className="b" style={{ fontSize: 22 }}>{c.titulo || '—'}</td>
          <td className="b" style={{ fontSize: 18 }}>Rev. {c.revisao}</td>
        </tr>
        <tr>
          <td className="h">Operação</td>
          <td colSpan={4}>{c.operacao || '—'}</td>
        </tr>
        <tr className="h">
          <td className="h">Agrupamento família</td><td className="h">Tamanho</td><td className="h">Medidas da peça (em m)</td>
          <td className="h">Pontos/cm</td><td className="h">Perímetro costura (em m)</td>
        </tr>
        <tr>
          <td>{c.familia || '—'}</td><td>{c.tamanho || '—'}</td><td>{c.medidas || '—'}</td>
          <td>{c.pontos_cm == null ? '—' : dec(c.pontos_cm)}</td><td>{dec(c.perimetro_m)}</td>
        </tr>
        <tr>
          <td className="h">Cód. Eqp.</td><td className="h">Equipamento</td><td className="h">RPM - limite inferior</td>
          <td className="h">RPM - padrão</td><td className="h">RPM - limite superior</td>
        </tr>
        <tr>
          <td>{eq.codigo}</td><td>{eq.tipo}</td><td>{inteiro(eq.rpm_min)}</td><td>{inteiro(eq.rpm_padrao)}</td><td>{inteiro(eq.rpm_max)}</td>
        </tr>
        <tr>
          <td className="h">Código do elemento</td><td className="h" colSpan={2}>Elementos</td>
          <td className="h">Frequência</td><td className="h">Tempos (em minutos)</td>
        </tr>
        {linhas.map((l, i) => (
          <tr key={`${l.codigo}-${i}`} className={l.codigo === 'FIXO' ? 'fixo' : undefined}>
            <td className="b">{l.codigo}</td>
            <td colSpan={2}>{l.descricao}</td>
            <td>{inteiro(l.frequencia)}</td>
            <td>{min4(l.tempo_min)}</td>
          </tr>
        ))}
        <tr className="tp">
          <td>TP</td>
          <td colSpan={3}>Tempo total da operação (FIXO + MTM)</td>
          <td>{min4(tp_min)}</td>
        </tr>
      </tbody>
    </table>
  );
}
