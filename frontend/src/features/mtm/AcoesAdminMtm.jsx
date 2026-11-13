import { useRef } from 'react';
import { Botao, SeletorArquivo } from '../../components/ui/index.js';

/** Botões do cabeçalho (admin): importar planilha de cadastros e criar elemento. */
export function AcoesAdminMtm({ importando, aoImportar, aoNovo }) {
  const refArquivo = useRef(null);
  return (
    <div className="flex gap-2">
      <Botao variante="secundario" carregando={importando} onClick={() => refArquivo.current?.click()}>Importar Entradas (.ods/.xlsx)</Botao>
      <Botao onClick={aoNovo}>+ Novo elemento</Botao>
      <SeletorArquivo ref={refArquivo} accept=".ods,.xlsx,.xls" aoEscolher={(arquivos) => aoImportar(arquivos[0])} />
    </div>
  );
}
