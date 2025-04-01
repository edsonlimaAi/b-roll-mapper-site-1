// modules/events.js - Manipuladores de eventos

import { DOM } from './app.js';
import { processedData, saveDataToStorage, updateData, clearStorage } from './store.js';
import { parseMarkdown, parseJson } from './parser.js';
import { showToast, handleError, openInsertDataModal, closeInsertDataModal, renderResults, toggleExampleButtonsVisibility, toggleHeader, openDocModal, closeDocModal } from './ui.js';
import { copySectionData, copySectionLinks, copySectionJson, addURLToItem, updateItemNotes, translateRoteiro, translateSectionRoteiro, undoTranslateSectionRoteiro, toggleAllColumns } from './actions.js';
import { examples } from './examples.js';

// Anexar todos os manipuladores de eventos
function attachEventListeners() {
    // Elementos principais
    DOM.headerToggle.addEventListener('click', toggleHeader);
    DOM.insertDataBtn.addEventListener('click', openInsertDataModal);
    DOM.copyFullJsonBtn.addEventListener('click', handleCopyFullJson);
    DOM.clearDataBtn.addEventListener('click', clearAllData);
    DOM.searchInput.addEventListener('input', filterResults);

    // Modais
    DOM.modalClose.addEventListener('click', closeInsertDataModal);
    DOM.cancelDataBtn.addEventListener('click', closeInsertDataModal);
    DOM.processDataBtn.addEventListener('click', processInputData);

    // Exemplos
    DOM.loadExampleBtn.addEventListener('click', loadExample);
    DOM.loadExampleWithRoteiroBtn.addEventListener('click', loadExampleWithRoteiro);
    DOM.loadJsonExampleBtn.addEventListener('click', loadJsonExample);

    // Documentação
    DOM.docBtn.addEventListener('click', openDocModal);
    DOM.docModalClose.addEventListener('click', closeDocModal);
    DOM.closeDocBtn.addEventListener('click', closeDocModal);

    // Seleção de formato
    DOM.inputFormatBtns.forEach(btn => btn.addEventListener('click', handleFormatSelection));
    
    // Filtros
    DOM.filterOptions.forEach(option => option.addEventListener('click', handleFilterSelection));
    
    // Menu de fontes
    DOM.sourceMenu.querySelectorAll('.source-menu-item').forEach(item => item.addEventListener('click', handleSourceMenuItemClick));
}

// Manipulador para seleção de formato (markdown/json)
function handleFormatSelection(event) {
    const btn = event.currentTarget;
    if (btn === DOM.docBtn) return;

    const format = btn.dataset.format;
    DOM.inputFormatBtns.forEach(b => {
        if (b !== DOM.docBtn) b.classList.remove('selected');
    });
    btn.classList.add('selected');

    DOM.markdownInputContainer.classList.toggle('active', format === 'markdown');
    DOM.jsonInputContainer.classList.toggle('active', format === 'json');
    toggleExampleButtonsVisibility(format);
}

// Manipulador para toggle de seção expandida/colapsada
function toggleSectionExpansion(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const icon = header.querySelector('.section-toggle i');
    
    // Toggle expanded class
    const wasExpanded = content.classList.contains('expanded');
    content.classList.toggle('expanded');
    
    // Se estava colapsado e agora está expandido, remover completamente qualquer limite de altura
    if (!wasExpanded) {
        content.style.maxHeight = 'none';
        content.style.overflow = 'visible';
    } else {
        // Se estamos colapsando, primeiro redefine para 0
        content.style.maxHeight = '0';
    }
    
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
}

// Manipulador para seleção de filtro
function handleFilterSelection(event) {
    DOM.filterOptions.forEach(opt => opt.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    filterResults();
}

// Manipulador para ações em seções (botões de cópia, expansão, etc.)
function handleSectionActionClick(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const action = button.dataset.action;
    const sectionIndex = parseInt(button.dataset.section);

    switch(action) {
        case 'copyAll': copySectionData(sectionIndex); break;
        case 'copyLinks': copySectionLinks(sectionIndex); break;
        case 'copyJson': copySectionJson(sectionIndex); break;
        case 'expandAll': toggleAllColumns(sectionIndex, true); break;
        case 'collapseAll': toggleAllColumns(sectionIndex, false); break;
        case 'translateAll': handleTranslateSectionClick(sectionIndex, button); break;
        case 'undoTranslateAll': handleUndoTranslateSectionClick(sectionIndex, button); break;
    }
}

// Manipulador para clique no botão de tradução de célula
function handleTranslateToggleClick(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const cell = button.closest('td');
    const sectionId = parseInt(button.dataset.sectionId);
    const itemId = parseInt(button.dataset.itemId); // Index
    const state = button.dataset.state;

    if (state === 'original') {
        handleTranslateCell(button, cell, sectionId, itemId);
    } else {
        toggleCellTranslation(button, cell, sectionId, itemId);
    }
}

// Processar dados de entrada (Markdown ou JSON)
function processInputData() {
    const formatSelected = document.querySelector('.input-format-btn.selected')?.dataset.format || 'markdown';
    const inputElement = formatSelected === 'markdown' ? DOM.markdownInput : DOM.jsonInput;
    const inputData = inputElement.value.trim();

    if (!inputData) {
        showToast(`Por favor, insira dados ${formatSelected} válidos.`);
        return;
    }

    try {
        const newData = formatSelected === 'markdown' ? parseMarkdown(inputData) : parseJson(inputData);
        updateData(newData);
        renderResults(processedData);
        closeInsertDataModal();
        showToast('Dados processados com sucesso!');
    } catch (error) {
        handleError(error, `Erro ao processar ${formatSelected}. Verifique o formato.`);
    }
}

// Carregar exemplos
function loadExample() {
    DOM.markdownInput.value = examples.withoutRoteiro;
    showToast('Exemplo sem roteiro carregado!');
}

function loadExampleWithRoteiro() {
    DOM.markdownInput.value = examples.withRoteiro;
    showToast('Exemplo com roteiro carregado!');
}

function loadJsonExample() {
    DOM.jsonInput.value = JSON.stringify(examples.json, null, 2);
    showToast('Exemplo JSON carregado!');
}

// Filtrar resultados com base no texto de busca e filtro de fonte
function filterResults() {
    const searchText = DOM.searchInput.value.toLowerCase().trim();
    const selectedSource = document.querySelector('.filter-option.selected')?.dataset.source || 'all';

    document.querySelectorAll('.section-container tbody tr').forEach(row => {
        const itemIndex = parseInt(row.dataset.id);
        const sectionId = parseInt(row.closest('.section-container').id.split('-')[1]);
        const item = processedData[sectionId]?.items[itemIndex];
        if (!item) {
            row.style.display = 'none';
            return;
        }

        const sourceMatch = selectedSource === 'all' || item.source?.toLowerCase() === selectedSource;

        let textMatch = !searchText;
        if (searchText) {
            const currentRoteiro = item.isTranslated ? (item.translatedRoteiro || item.roteiro) : (item.originalRoteiro || item.roteiro);
            const searchFields = [
                item.id.toString(), item.timecode, currentRoteiro, item.element,
                item.searchTermsText, item.notes,
                ...Object.entries(item.links || {}).flatMap(([url, title]) => [url, title])
            ];
            textMatch = searchFields.some(field => field?.toLowerCase().includes(searchText));
        }

        row.style.display = (sourceMatch && textMatch) ? '' : 'none';
    });
}

// Limpar todos os dados
function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados da sessão atual? Esta ação não pode ser desfeita.')) {
        clearStorage();
        renderResults(processedData);
        DOM.searchInput.value = '';
        showToast('Todos os dados foram limpos!');
    }
}

// Exibir menu de seleção de fonte
function showSourceMenu(element, sectionId, itemId) {
    const rect = element.getBoundingClientRect();
    DOM.sourceMenu.style.left = `${rect.left + window.scrollX}px`;
    DOM.sourceMenu.style.top = `${rect.bottom + window.scrollY}px`;
    DOM.sourceMenu.style.display = 'block';
    DOM.sourceMenu.dataset.sectionId = sectionId;
    DOM.sourceMenu.dataset.itemId = itemId; // Index

    const currentSource = processedData[sectionId]?.items[itemId]?.source?.toLowerCase();
    DOM.sourceMenu.querySelectorAll('.source-menu-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.source === currentSource);
    });
}

// Manipulador para clique em item do menu de fonte
function handleSourceMenuItemClick(event) {
    const newSource = event.currentTarget.dataset.source.toUpperCase();
    const sectionId = parseInt(DOM.sourceMenu.dataset.sectionId);
    const itemId = parseInt(DOM.sourceMenu.dataset.itemId); // Index

    if (processedData[sectionId]?.items[itemId]) {
        const item = processedData[sectionId].items[itemId];
        item.source = newSource;
        
        // Atualizar UI
        const row = document.querySelector(`#section-${sectionId} tbody tr[data-id="${itemId}"]`);
        if (row) {
            row.className = `${newSource.toLowerCase()}-row`;
            const badge = row.querySelector('.source-badge-table');
            if (badge) {
                badge.className = `source-badge-table ${newSource.toLowerCase()}`;
                badge.textContent = newSource;
            }
            
            // Atualizar links
            const linksCell = row.querySelector('.links-cell');
            if (linksCell) {
                const linksWrapper = linksCell.querySelector('.links-wrapper');
                linksWrapper.querySelectorAll('.term-links').forEach(div => div.remove());
                const urlInputWrapper = linksWrapper.querySelector('.url-input-wrapper');
                
                // Importar dinamicamente para evitar dependência circular
                import('./renderer.js').then(module => {
                    (item.searchTerms || []).forEach(term => {
                        const termDiv = document.createElement('div');
                        termDiv.className = 'term-links';
                        termDiv.innerHTML = module.generateSearchLinks(newSource, term);
                        linksWrapper.insertBefore(termDiv, urlInputWrapper);
                    });
                });
            }
        }
        
        // Salvar mudanças
        saveDataToStorage();
    }
    DOM.sourceMenu.style.display = 'none';
}

// Manipulador para entrada de URL
function handleURLInput(input) {
    let url = input.value.trim();
    if (!url) return;
    const sectionId = parseInt(input.dataset.sectionId);
    const itemId = parseInt(input.dataset.itemId); // Index

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        new URL(url); // Validar formato da URL
        const domain = new URL(url).hostname.replace(/^www\./, '');
        // Podemos gerar um título mais descritivo baseado no domínio
        let title = domain;
        
        // Simplificar domínio para título - exemplo: youtube.com -> YouTube
        if (domain.includes('youtube')) title = 'YouTube';
        else if (domain.includes('vimeo')) title = 'Vimeo';
        else if (domain.includes('unsplash')) title = 'Unsplash';
        else if (domain.includes('flickr')) title = 'Flickr';
        else if (domain.includes('pexels')) title = 'Pexels';
        else if (domain.includes('pixabay')) title = 'Pixabay';
        else if (domain.includes('envato')) title = 'Envato';
        else if (domain.includes('storyblocks')) title = 'Storyblocks';
        
        if (processedData[sectionId]?.items[itemId]) {
            // Adicionar URL e salvar
            if (addURLToItem(sectionId, itemId, url, title)) {
                const urlInputWrapper = input.parentElement;
                
                // Importar dinamicamente para evitar dependência circular
                import('./renderer.js').then(module => {
                    const preview = module.createURLPreview(url, title, sectionId, itemId);
                    urlInputWrapper.insertBefore(preview, input);
                    input.value = '';
                });
            }
        }
    } catch (_) {
        showToast('URL inválida. Verifique o formato.');
    }
}

// Manipulador para entrada de notas
function handleNotesInput(event) {
    const input = event.currentTarget;
    const sectionId = parseInt(input.dataset.sectionId);
    const itemId = parseInt(input.dataset.itemId); // Index
    updateItemNotes(sectionId, itemId, input.value);
}

// Manipuladores de tradução
async function handleTranslateCell(button, cell, sectionId, itemId) {
    const item = processedData[sectionId]?.items[itemId];
    if (!item || !item.roteiro) return;
    if (!item.originalRoteiro) item.originalRoteiro = item.roteiro;

    button.classList.add('translating');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        item.translatedRoteiro = item.translatedRoteiro || await translateRoteiro(item.originalRoteiro);
        item.isTranslated = true;

        // Atualizar UI
        const textNode = cell.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            textNode.nodeValue = item.translatedRoteiro + ' ';
        } else {
            cell.textContent = item.translatedRoteiro + ' ';
            cell.appendChild(button);
        }
        button.innerHTML = '<i class="fas fa-sync-alt"></i> Original';
        button.dataset.state = 'translated';

        const sectionUndoBtn = button.closest('.section-content').querySelector('.undo-translate-section-btn');
        if (sectionUndoBtn) sectionUndoBtn.style.display = 'inline-flex';

        // Salvar mudanças
        saveDataToStorage();
    } catch (error) {
        handleError(error, 'Erro ao traduzir.');
        button.innerHTML = '<i class="fas fa-language"></i> Traduzir';
    } finally {
        button.classList.remove('translating');
    }
}

function toggleCellTranslation(button, cell, sectionId, itemId) {
    const item = processedData[sectionId]?.items[itemId];
    if (!item || !item.originalRoteiro) return;

    const state = button.dataset.state;
    let newText, newState, newButtonText, isNowTranslated;

    if (state === 'translated') { // Mudar para Original
        newText = item.originalRoteiro;
        newState = 'original';
        newButtonText = '<i class="fas fa-language"></i> Traduzido';
        isNowTranslated = false;
    } else { // Mudar para Traduzido
        if (!item.translatedRoteiro) {
            handleTranslateCell(button, cell, sectionId, itemId);
            return;
        }
        newText = item.translatedRoteiro;
        newState = 'translated';
        newButtonText = '<i class="fas fa-sync-alt"></i> Original';
        isNowTranslated = true;
    }
    item.isTranslated = isNowTranslated;

    // Atualizar UI
    const textNode = cell.childNodes[0];
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.nodeValue = newText + ' ';
    } else {
        cell.textContent = newText + ' ';
        cell.appendChild(button);
    }
    button.innerHTML = newButtonText;
    button.dataset.state = newState;

    // Atualizar botão de desfazer da seção
    const sectionContent = button.closest('.section-content');
    const sectionHasTranslatedItems = processedData[sectionId].items.some(it => it.isTranslated);
    const sectionUndoBtn = sectionContent.querySelector('.undo-translate-section-btn');
    if (sectionUndoBtn) {
        sectionUndoBtn.style.display = sectionHasTranslatedItems ? 'inline-flex' : 'none';
    }

    // Salvar mudanças
    saveDataToStorage();
}

async function handleTranslateSectionClick(sectionId, button) {
    button.classList.add('translating');
    button.innerHTML = '<i class="fas fa-language"></i> Traduzindo... <span class="spinner"></span>';

    try {
        const success = await translateSectionRoteiro(sectionId);
        
        if (success) {
            renderResults(processedData);
            showToast('Roteiros da seção traduzidos!');
        } else {
            showToast('Não há roteiros novos para traduzir nesta seção.');
        }
    } catch (error) {
        handleError(error, 'Erro ao traduzir roteiros da seção.');
    } finally {
        button.classList.remove('translating');
        button.innerHTML = '<i class="fas fa-language"></i> Traduzir Roteiro';
        
        const sectionElement = document.getElementById(`section-${sectionId}`);
        if (sectionElement) {
            const content = sectionElement.querySelector('.section-content');
            if (content && !content.classList.contains('expanded')) {
                toggleSectionExpansion({ currentTarget: sectionElement.querySelector('.section-header') });
            }
            const undoButton = sectionElement.querySelector('.undo-translate-section-btn');
            if (undoButton) {
                undoButton.style.display = processedData[sectionId].items.some(i => i.isTranslated) ? 'inline-flex' : 'none';
            }
        }
    }
}

function handleUndoTranslateSectionClick(sectionId, button) {
    const success = undoTranslateSectionRoteiro(sectionId);
    
    if (success) {
        renderResults(processedData);
        showToast('Traduções da seção restauradas!');
    } else {
        showToast('Não há traduções para restaurar.');
    }
    button.style.display = 'none';

    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
        const content = sectionElement.querySelector('.section-content');
        if (content && !content.classList.contains('expanded')) {
            toggleSectionExpansion({ currentTarget: sectionElement.querySelector('.section-header') });
        }
    }
}

// Manipulador para copiar todo o JSON do projeto
function handleCopyFullJson() {
    import('./actions.js').then(module => {
        module.copyFullJson();
    });
}

export {
    attachEventListeners,
    handleFormatSelection,
    toggleSectionExpansion,
    handleFilterSelection,
    handleSectionActionClick,
    handleTranslateToggleClick,
    processInputData,
    loadExample,
    loadExampleWithRoteiro,
    loadJsonExample,
    filterResults,
    clearAllData,
    showSourceMenu,
    handleSourceMenuItemClick,
    handleURLInput,
    handleNotesInput,
    handleCopyFullJson
};