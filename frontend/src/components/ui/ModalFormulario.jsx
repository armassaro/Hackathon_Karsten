import { useId } from 'react';
import { Botao } from './Botao.jsx';
import { Modal } from './Modal.jsx';

/**
 * Modal com um <form> e rodapé "Cancelar / {rotuloEnviar}". O botão de envio fica no rodapé,
 * ligado ao formulário pelo atributo `form`, então Enter dentro dos campos também envia.
 */
export function ModalFormulario({ aberto, titulo, aoFechar, aoEnviar, rotuloEnviar = 'Salvar', enviando = false, largura, children }) {
  const id = useId();
  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={aoFechar} largura={largura}
      rodape={<>
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao type="submit" form={id} carregando={enviando}>{rotuloEnviar}</Botao>
      </>}>
      <form id={id} onSubmit={aoEnviar} className="flex flex-col gap-4">{children}</form>
    </Modal>
  );
}
