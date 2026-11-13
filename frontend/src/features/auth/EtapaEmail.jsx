import { Botao, Campo, Entrada } from '../../components/ui/index.js';
import { ErroLogin, TituloEtapa } from './TituloEtapa.jsx';

export function EtapaEmail({ email, setEmail, erro, carregando, aoEnviar }) {
  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5">
      <TituloEtapa titulo="Entrar">
        <p className="mt-1 text-sm text-ink-3">Sem senha: enviamos um código de 6 dígitos para o seu e-mail corporativo.</p>
      </TituloEtapa>
      <Campo rotulo="E-mail corporativo">
        <Entrada type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com.br" />
      </Campo>
      <ErroLogin erro={erro} />
      <Botao tamanho="lg" carregando={carregando} type="submit">Enviar código</Botao>
    </form>
  );
}
