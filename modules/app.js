// modules/app.js - Inicialização da aplicação

import { initStorage, processedData } from './store.js';
import { initializeDOMReferences, setupUI, renderResults, showToast } from './ui.js';
import { attachEventListeners } from './events.js';

// Variáveis globais para elementos do DOM
export let DOM = {};

// Inicializa a aplicação
function initApp() {
    // Inicializar referências DOM
    DOM = initializeDOMReferences();
    
    // Inicializar sistema de armazenamento
    const dataLoaded = initStorage();
    
    // Configurar interface do usuário
    setupUI();
    
    // Anexar manipuladores de eventos
    attachEventListeners();
    
    // Renderizar resultados
    renderResults(processedData);
    
    // Mostrar notificação se dados foram carregados
    if (dataLoaded) {
        showToast('Dados carregados do armazenamento local!');
    }
}

export { initApp };