// modules/ui.js - Manipulação da interface do usuário

import { DOM } from './app.js';
import { processedData } from './store.js';
import { createTableHeader, createTableBody, createActionButtons } from './renderer.js';
import { handleFormatSelection, toggleSectionExpansion, filterResults } from './events.js';

// Inicializa referências a elementos DOM
function initializeDOMReferences() {
    return {
        // Elementos principais
        headerToggle: document.getElementById('headerToggle'),
        header: document.querySelector('.header'),
        insertDataBtn: document.getElementById('insertDataBtn'),
        copyFullJsonBtn: document.getElementById('copyFullJsonBtn'),
        clearDataBtn: document.getElementById('clearDataBtn'),
        searchInput: document.getElementById('searchInput'),
        resultContainer: document.getElementById('resultContainer'),
        toast: document.getElementById('toast'),
        sourceMenu: document.getElementById('sourceMenu'),
        filterOptions: document.querySelectorAll('.filter-option'),

        // Elementos de modal
        insertDataModal: document.getElementById('insertDataModal'),
        docModal: document.getElementById('docModal'),
        modalClose: document.getElementById('modalClose'),
        docModalClose: document.getElementById('docModalClose'),
        cancelDataBtn: document.getElementById('cancelDataBtn'),
        closeDocBtn: document.getElementById('closeDocBtn'),
        processDataBtn: document.getElementById('processDataBtn'),

        // Elementos de entrada de dados
        markdownInput: document.getElementById('markdownInput'),
        jsonInput: document.getElementById('jsonInput'),
        loadExampleBtn: document.getElementById('loadExampleBtn'),
        loadExampleWithRoteiroBtn: document.getElementById('loadExampleWithRoteiroBtn'),
        loadJsonExampleBtn: document.getElementById('loadJsonExampleBtn'),
        inputFormatBtns: document.querySelectorAll('.input-format-btn'),
        markdownInputContainer: document.getElementById('markdownInputContainer'),
        jsonInputContainer: document.getElementById('jsonInputContainer'),
        docBtn: document.getElementById('docBtn'),
    };
}

// Configurar UI
function setupUI() {
    setupExampleButtons();
    setupOutsideClickListeners();
}

// Configurações para botões de exemplo
function setupExampleButtons() {
    const currentFormat = document.querySelector('.input-format-btn.selected')?.dataset.format || 'markdown';
    toggleExampleButtonsVisibility(currentFormat);
}

// Configurar listeners para cliques fora de elementos
function setupOutsideClickListeners() {
    document.addEventListener('click', (e) => {
        if (DOM.sourceMenu.style.display === 'block' &&
            !DOM.sourceMenu.contains(e.target) &&
            !e.target.closest('.source-badge-table')) {
            DOM.sourceMenu.style.display = 'none';
        }
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target === DOM.insertDataModal) closeInsertDataModal();
            if (e.target === DOM.docModal) closeDocModal();
        }
    });
}

// Manipulação de visibilidade dos botões de exemplo
function toggleExampleButtonsVisibility(format) {
    DOM.loadExampleBtn.style.display = format === 'markdown' ? 'inline-flex' : 'none';
    DOM.loadExampleWithRoteiroBtn.style.display = format === 'markdown' ? 'inline-flex' : 'none';
    DOM.loadJsonExampleBtn.style.display = format === 'json' ? 'inline-flex' : 'none';
}

// Toggle header
function toggleHeader() {
    DOM.header.classList.toggle('compact');
    DOM.headerToggle.innerHTML = DOM.header.classList.contains('compact')
        ? '<i class="fas fa-chevron-down"></i>'
        : '<i class="fas fa-chevron-up"></i>';
}

// Manipulação de modais
function openInsertDataModal() {
    DOM.insertDataModal.classList.add('active');
}

function closeInsertDataModal() {
    DOM.insertDataModal.classList.remove('active');
}

function openDocModal() {
    DOM.docModal.classList.add('active');
}

function closeDocModal() {
    DOM.docModal.classList.remove('active');
}

// Exibir mensagem toast
function showToast(message) {
    const toast = DOM.toast;
    const toastMessage = toast.querySelector('.toast-message');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('show');
    if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toast.hideTimeout = null;
    }, 3000);
}

// Manipulação de erros
function handleError(error, userMessage) {
    console.error("Erro:", error);
    showToast(userMessage || 'Ocorreu um erro inesperado.');
}

// Renderização de resultados
function renderResults(sections) {
    DOM.resultContainer.innerHTML = ''; // Limpa container

    if (!sections || sections.length === 0) {
        DOM.resultContainer.innerHTML = '<p style="text-align: center; opacity: 0.7; margin-top: 2rem;">Nenhum dado para exibir. Use "Inserir Dados" para começar.</p>';
        return;
    }

    sections.forEach((section, i) => {
        const sectionId = `section-${i}`;
        const hasRoteiroColumn = section.hasRoteiroColumn;

        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'section-container';
        sectionContainer.id = sectionId;
        sectionContainer.dataset.hasRoteiro = hasRoteiroColumn;

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <div class="section-title">${section.title}</div>
            <div class="section-toggle"><i class="fas fa-chevron-up"></i></div>
        `;
        sectionHeader.addEventListener('click', toggleSectionExpansion);

        const sectionContent = document.createElement('div');
        sectionContent.className = 'section-content expanded'; // Start expanded

        const actionButtonsGroup = createActionButtons(i, hasRoteiroColumn, section.items);
        sectionContent.appendChild(actionButtonsGroup);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        const table = document.createElement('table');
        
        const thead = createTableHeader(hasRoteiroColumn);
        const tbody = createTableBody(section.items, i, hasRoteiroColumn);

        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        sectionContent.appendChild(tableWrapper);

        // Adicionar listeners para expansores de coluna
        thead.querySelectorAll('.column-expander').forEach(expander => {
            expander.addEventListener('click', handleColumnExpanderClick);
        });

        sectionContainer.appendChild(sectionHeader);
        sectionContainer.appendChild(sectionContent);
        DOM.resultContainer.appendChild(sectionContainer);

        // Expandir colunas por padrão
        toggleAllColumns(i, true, false);
    });

    filterResults(); // Aplicar filtro inicial se houver
}

// Expansão/colapso de colunas
function toggleAllColumns(sectionId, expand, updateData = true) {
    const section = document.getElementById(`section-${sectionId}`);
    if (!section) return;
    const table = section.querySelector('table');
    if (!table) return;

    const expandableColumns = ['ROTEIRO', 'TERMOS DE BUSCA', 'LINKS', 'NOTAS'];
    expandableColumns.forEach(columnName => {
        const header = table.querySelector(`thead th[data-column="${columnName}"]`);
        if (!header) return;

        const expanderIcon = header.querySelector('.column-expander i');
        const columnIndex = Array.from(header.parentNode.children).indexOf(header);
        const cells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);

        cells.forEach((cell, rowIndex) => {
            cell.classList.toggle('expanded-column', expand);
            cell.classList.toggle('collapsed-column', !expand);
            // Atualizar modelo de dados APENAS se updateData for true
            if (updateData && processedData[sectionId]?.items[rowIndex]) {
                processedData[sectionId].items[rowIndex].expanded = expand;
            }
        });
        if (expanderIcon) {
            expanderIcon.classList.toggle('fa-compress', expand);
            expanderIcon.classList.toggle('fa-expand', !expand);
        }
    });
}

// Manipulador para clique no expansor de coluna
function handleColumnExpanderClick(event) {
    event.stopPropagation();
    const expander = event.currentTarget;
    const column = expander.dataset.column;
    const table = expander.closest('table');
    const sectionContainer = table.closest('.section-container');
    const sectionId = parseInt(sectionContainer.id.split('-')[1]);

    const headers = Array.from(table.querySelectorAll('thead th'));
    const columnIndex = headers.findIndex(th => th.dataset.column === column);
    if (columnIndex === -1) return;

    const cells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);
    const isCurrentlyExpanded = expander.classList.contains('fa-compress');
    const shouldExpand = !isCurrentlyExpanded;

    cells.forEach((cell, rowIndex) => {
        cell.classList.toggle('expanded-column', shouldExpand);
        cell.classList.toggle('collapsed-column', !shouldExpand);
        if (processedData[sectionId]?.items[rowIndex]) {
            processedData[sectionId].items[rowIndex].expanded = shouldExpand;
        }
    });

    // Salvar mudanças
    import('./store.js').then(module => module.saveDataToStorage());

    expander.classList.toggle('fa-expand', !shouldExpand);
    expander.classList.toggle('fa-compress', shouldExpand);
}

export {
    initializeDOMReferences,
    setupUI,
    toggleExampleButtonsVisibility,
    toggleHeader,
    openInsertDataModal,
    closeInsertDataModal,
    openDocModal,
    closeDocModal,
    showToast,
    handleError,
    renderResults,
    toggleAllColumns,
    handleColumnExpanderClick
};