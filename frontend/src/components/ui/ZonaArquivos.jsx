import { useRef, useState } from 'react';
import { IconeEnviarArquivo } from './Icones.jsx';

/**
 * Área de "arraste arquivos aqui ou clique". aoEscolher recebe um FileList.
 * titulo/subtitulo descrevem a área; accept e multiple vão para o <input type="file">.
 */
export function ZonaArquivos({ aoEscolher, titulo, subtitulo, accept, multiple = false }) {
  const [sobre, setSobre] = useState(false);
  const ref = useRef(null);
  const abrir = () => ref.current?.click();
  return (
    <div onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
      onDrop={(e) => { e.preventDefault(); setSobre(false); aoEscolher(e.dataTransfer.files); }}
      onClick={abrir} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && abrir()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${sobre ? 'border-accent bg-accent-soft' : 'border-line-2 hover:border-accent/50 hover:bg-paper'}`}>
      <IconeEnviarArquivo />
      <p className="font-medium">{titulo}</p>
      {subtitulo && <p className="text-[13px] text-ink-3">{subtitulo}</p>}
      <SeletorArquivo ref={ref} multiple={multiple} accept={accept} aoEscolher={aoEscolher} />
    </div>
  );
}

/** <input type="file"> oculto que limpa o valor após escolher (permite escolher o mesmo arquivo de novo). */
export function SeletorArquivo({ ref, accept, multiple = false, aoEscolher }) {
  return <input ref={ref} type="file" multiple={multiple} hidden accept={accept} onChange={(e) => { aoEscolher(e.target.files); e.target.value = ''; }} />;
}
