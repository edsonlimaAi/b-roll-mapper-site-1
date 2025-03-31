// script.js - Arquivo principal que carrega os módulos

import { initApp } from './modules/app.js';
import { processedData } from './modules/store.js';

// Iniciar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('B-Roll Mapper inicializado');
    initApp();
});