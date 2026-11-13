import { useEffect, useRef } from 'react';
import { useContagemRegressiva } from '../../hooks/useContagemRegressiva.js';
import { Botao, Campo, Entrada } from '../../components/ui/index.js';
import { ErroLogin, TituloEtapa } from './TituloEtapa.jsx';

/** envio = { mensagem, codigoDev, expira } vindo da solicitação do código. */
export function EtapaCodigo({ email, codigo, setCodigo, envio, erro, carregando, aoEnviar, aoReenviar, aoTrocarEmail }) {
  const refCodigo = useRef(null);
  const { restante, mmss } = useContagemRegressiva(envio.expira, true);
  useEffect(() => { refCodigo.current?.focus(); }, []);

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5">
      <TituloEtapa titulo="Digite o código">
        <p className="mt-1 text-sm text-ink-3">{envio.mensagem}</p>
        <p className="mt-1 text-sm text-ink-2"><span className="font-medium">{email}</span> · <button type="button" className="text-accent hover:underline" onClick={aoTrocarEmail}>trocar</button></p>
      </TituloEtapa>
      {envio.codigoDev && <AvisoCodigoDev codigo={envio.codigoDev} />}
      <Campo rotulo="Código de acesso" dica={restante > 0 ? `Expira em ${mmss}` : 'Código expirado — peça outro.'}>
        <Entrada ref={refCodigo} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          className="num h-12 text-center text-2xl tracking-[0.5em]" placeholder="••••••" />
      </Campo>
      <ErroLogin erro={erro} />
      <Botao tamanho="lg" carregando={carregando} type="submit" disabled={codigo.length !== 6}>Entrar</Botao>
      <Botao type="button" variante="fantasma" onClick={aoReenviar} disabled={carregando}>Reenviar código</Botao>
    </form>
  );
}

/** Só no ensaio local (DEV_EXIBIR_CODIGO): mostra o código na tela. */
function AvisoCodigoDev({ codigo }) {
  return (
    <div className="rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-[13px] text-warn">
      Modo ensaio local: seu código é <span className="num font-semibold">{codigo}</span>
    </div>
  );
}
