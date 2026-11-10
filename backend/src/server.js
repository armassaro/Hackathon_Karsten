import { config, validarConfig } from './config.js';
import { criarStore } from './store/index.js';
import { criarApp } from './app.js';

try {
  validarConfig();
} catch (e) {
  console.error(`\n${e.message}\n\nCopie backend/.env.example para backend/.env e preencha os valores.\n`);
  process.exit(1);
}

const store = criarStore();
criarApp(store).listen(config.porta, () => {
  console.log(`Auto-T&M Karsten rodando em http://localhost:${config.porta}  ·  armazenamento: ${store.nome}`);
  if (config.exibirCodigoNaTela) console.warn('ATENÇÃO: DEV_EXIBIR_CODIGO=true — o código de login aparece na tela. Use só para ensaio.');
});
