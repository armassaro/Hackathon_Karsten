import { useAvisar } from '../../../components/feedback/index.js';
import { Botao, Modal } from '../../../components/ui/index.js';

/** Exemplo de chamada da API com o token (para copiar e colar). */
const exemploCurl = (token) => `curl -H "Authorization: Bearer ${token}" \\\n     -F "arquivos=@demanda_000.txt" \\\n     "${location.origin}/api/po/importar?saida=xlsx" -o PO.xlsx`;

/** Mostra o token recém-criado uma única vez, com botão de copiar e exemplo de uso. */
export function ModalTokenCriado({ token, aoFechar }) {
  const avisar = useAvisar();
  const copiar = () => { navigator.clipboard?.writeText(token.token); avisar('Copiado.'); };
  return (
    <Modal aberto={!!token} titulo="Token criado: copie agora" aoFechar={aoFechar} largura="max-w-2xl"
      rodape={<Botao onClick={aoFechar}>Já copiei</Botao>}>
      {token && <div className="flex flex-col gap-3">
        <p className="text-sm text-warn">Este valor não será exibido de novo.</p>
        <div className="flex gap-2">
          <code className="num flex-1 overflow-x-auto rounded-md border border-line bg-paper px-3 py-2 text-[13px]">{token.token}</code>
          <Botao variante="secundario" onClick={copiar}>Copiar</Botao>
        </div>
        <p className="text-[13px] text-ink-3">Exemplo de uso:</p>
        <pre className="num overflow-x-auto rounded-md bg-ink px-3 py-2 text-[12px] text-white">{exemploCurl(token.token)}</pre>
      </div>}
    </Modal>
  );
}
