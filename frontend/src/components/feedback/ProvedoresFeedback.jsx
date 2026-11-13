import { ProvedorAvisos } from './Avisos.jsx';
import { ProvedorConfirmacao } from './Confirmacao.jsx';

export function ProvedoresFeedback({ children }) {
  return (
    <ProvedorAvisos>
      <ProvedorConfirmacao>{children}</ProvedorConfirmacao>
    </ProvedorAvisos>
  );
}
