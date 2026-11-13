// Páginas do sistema: rota (#/id), rótulo do menu, papel mínimo e componente.
import { temPapel } from '../lib/papeis.js';
import GerarPO from '../features/po/GerarPO.jsx';
import Maquinas from '../features/maquinas/Maquinas.jsx';
import Elementos from '../features/mtm/Elementos.jsx';
import Admin from '../features/admin/Admin.jsx';

export const PAGINAS = [
  { id: 'po', rotulo: 'Gerar PO', papel: 'engenheiro', Comp: GerarPO },
  { id: 'maquinas', rotulo: 'Máquinas', papel: 'leitor', Comp: Maquinas },
  { id: 'mtm', rotulo: 'Elementos MTM', papel: 'leitor', Comp: Elementos },
  { id: 'admin', rotulo: 'Administração', papel: 'admin', Comp: Admin },
];

export const PAGINA_INICIAL = 'po';

/** Páginas que o papel pode ver, na ordem do menu. */
export const paginasDoPapel = (papel) => PAGINAS.filter((p) => temPapel(papel, p.papel));
