// Confirmação (substitui window.confirm): await confirmar({ titulo, mensagem, confirmar?, perigo? }) -> boolean.
import { createContext, useCallback, useContext, useState } from 'react';
import { Botao } from '../ui/Botao.jsx';
import { Modal } from '../ui/Modal.jsx';

const ConfirmCtx = createContext(null);

export function ProvedorConfirmacao({ children }) {
  const [estado, setEstado] = useState(null);
  const confirmar = useCallback((opcoes) => new Promise((resolve) => setEstado({ ...opcoes, resolve })), []);
  const fechar = (v) => { estado?.resolve(v); setEstado(null); };
  return (
    <ConfirmCtx.Provider value={confirmar}>
      {children}
      <Modal aberto={!!estado} titulo={estado?.titulo} aoFechar={() => fechar(false)}
        rodape={<>
          <Botao variante="secundario" onClick={() => fechar(false)}>Cancelar</Botao>
          <Botao variante={estado?.perigo ? 'perigo' : 'primario'} onClick={() => fechar(true)}>{estado?.confirmar || 'Confirmar'}</Botao>
        </>}>
        <p className="text-sm text-ink-2">{estado?.mensagem}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export const useConfirmar = () => useContext(ConfirmCtx);
