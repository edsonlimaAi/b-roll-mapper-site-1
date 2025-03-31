// modules/renderer.js - Renderização de elementos da tabela

import { processedData, saveDataToStorage } from './store.js';
import { handleSourceMenuItemClick, handleSectionActionClick, handleTranslateToggleClick } from './events.js';
import { toggleSectionExpansion, showSourceMenu, handleURLInput, handleNotesInput } from './events.js';

// Cria botões de ação para uma seção
function createActionButtons(sectionIndex, hasRoteiro, items) {
    const group = document.createElement('div');
    group.className = 'copy-buttons-group';
    group.innerHTML = `
        <button class="copy-btn-small" data-section="${sectionIndex}" data-action="copyAll"><i class="fas fa-copy"></i> Copiar Tabela</button>
        <button class="copy-btn-small" data-section="${sectionIndex}" data-action="copyLinks"><i class="fas fa-link"></i> Copiar Links Pers.</button>
        <button class="copy-btn-small" data-section="${sectionIndex}" data-action="copyJson"><i class="fas fa-code"></i> Copiar JSON</button>
        <button class="copy-btn-small" data-section="${sectionIndex}" data-action="expandAll"><i class="fas fa-expand-alt"></i> Expandir Cols.</button>
        <button class="copy-btn-small" data-section="${sectionIndex}" data-action="collapseAll"><i class="fas fa-compress-alt"></i> Recolher Cols.</button>
    `;

    if (hasRoteiro) {
        const translateBtn = document.createElement('button');
        translateBtn.className = 'copy-btn-small translate-section-btn';
        translateBtn.dataset.section = sectionIndex;
        translateBtn.dataset.action = 'translateAll';
        translateBtn.innerHTML = '<i class="fas fa-language"></i> Traduzir Roteiro';
        group.appendChild(translateBtn);

        const undoTranslateBtn = document.createElement('button');
        undoTranslateBtn.className = 'copy-btn-small undo-translate-section-btn';
        undoTranslateBtn.dataset.section = sectionIndex;
        undoTranslateBtn.dataset.action = 'undoTranslateAll';
        undoTranslateBtn.innerHTML = '<i class="fas fa-undo"></i> Restaurar Original';
        // Mostrar botão de desfazer apenas se alguns itens da seção estiverem marcados como traduzidos
        undoTranslateBtn.style.display = items.some(item => item.isTranslated) ? 'inline-flex' : 'none';
        group.appendChild(undoTranslateBtn);
    }

    group.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', handleSectionActionClick);
    });
    return group;
}

// Cria cabeçalho da tabela
function createTableHeader(hasRoteiro) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    let headersConfig = [
        { text: 'ID', column: 'ID'},
        { text: 'TIMECODE', column: 'TIMECODE' }
    ];
    // Adicionar cabeçalho de Roteiro condicionalmente
    if (hasRoteiro) {
        headersConfig.push({ text: 'ROTEIRO', column: 'ROTEIRO', expandable: true });
    }
    headersConfig = headersConfig.concat([
        { text: 'O QUE BUSCAR', column: 'O QUE BUSCAR' },
        { text: 'FONTE', column: 'FONTE' },
        { text: 'TERMOS DE BUSCA', column: 'TERMOS DE BUSCA', expandable: true },
        { text: 'LINKS', column: 'LINKS', expandable: true },
        { text: 'NOTAS', column: 'NOTAS', expandable: true }
    ]);

    headersConfig.forEach(headerConf => {
        const th = document.createElement('th');
        th.dataset.column = headerConf.column;
        th.textContent = headerConf.text;
        if (headerConf.expandable) {
            // Iniciar com ícone de expandido (comprimir)
            th.innerHTML += ` <i class="fas fa-compress column-expander" data-column="${headerConf.column}"></i>`;
        }
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        th.appendChild(resizeHandle);
        resizeHandle.addEventListener('mousedown', (e) => initResize(th, e));
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    return thead;
}

// Iniciar redimensionamento de coluna
let isResizing = false;
let currentColumn = null;
let startX, startWidth;

function initResize(th, e) {
    isResizing = true;
    currentColumn = th;
    startX = e.pageX;
    startWidth = th.offsetWidth;
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
    th.classList.add('resizing');
    e.preventDefault();
}

function doResize(e) {
    if (!isResizing) return;
    const width = Math.max(50, startWidth + (e.pageX - startX));
    currentColumn.style.width = `${width}px`;
    currentColumn.style.minWidth = `${width}px`;

    const columnIndex = Array.from(currentColumn.parentNode.children).indexOf(currentColumn);
    const table = currentColumn.closest('table');
    table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`).forEach(cell => {
        cell.style.width = `${width}px`;
        cell.style.minWidth = `${width}px`;
    });
}

function stopResize() {
    if (!isResizing) return;
    isResizing = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    if (currentColumn) {
        currentColumn.classList.remove('resizing');
    }
    currentColumn = null;
}

// Criar corpo da tabela
function createTableBody(items, sectionIndex, hasRoteiro) {
    const tbody = document.createElement('tbody');
    items.forEach((item, itemIndex) => {
        const row = document.createElement('tr');
        row.className = `${item.source?.toLowerCase() || 'unknown'}-row`;
        row.dataset.id = itemIndex; // Index within the section's items array
        row.dataset.itemId = item.id; // Original ID from input

        row.appendChild(createCell(item.id)); // ID
        row.appendChild(createCell(item.timecode)); // Timecode
        // Adicionar célula de Roteiro condicionalmente com base na flag da seção
        if (hasRoteiro) {
            row.appendChild(createRoteiroCell(item, sectionIndex, itemIndex));
        }
        row.appendChild(createCell(item.element, 'element-cell')); // Element
        row.appendChild(createSourceCell(item, sectionIndex, itemIndex)); // Source
        // Ajustar classe com base no estado expandido do item
        row.appendChild(createCell(item.searchTermsText || '-', `search-terms-cell ${item.expanded ? 'expanded-column' : 'collapsed-column'}`));
        row.appendChild(createLinksCell(item, sectionIndex, itemIndex)); // Links cell also needs expanded state
        row.appendChild(createNotesCell(item, sectionIndex, itemIndex)); // Notes cell also needs expanded state

        tbody.appendChild(row);
    });
    return tbody;
}

// Helper para criar células simples de texto
function createCell(content, className = '') {
    const cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = content ?? '-';
    return cell;
}

// Criar célula para o roteiro
function createRoteiroCell(item, sectionIndex, itemIndex) {
    const cell = document.createElement('td');
    // Aplicar classe de estado expandido
    cell.className = `roteiro-cell ${item.expanded ? 'expanded-column' : 'collapsed-column'}`;
    const textContent = item.isTranslated ? (item.translatedRoteiro || item.roteiro) : (item.originalRoteiro || item.roteiro);
    // Garantir que o nó de texto existe mesmo se o conteúdo estiver inicialmente vazio
    const textNode = document.createTextNode(textContent || '-');
    cell.appendChild(textNode);

    // Adicionar botão de tradução apenas se houver conteúdo real de roteiro
    if (item.roteiro && item.roteiro.trim() !== '') {
        const button = document.createElement('button');
        button.className = 'translate-btn';
        button.dataset.sectionId = sectionIndex;
        button.dataset.itemId = itemIndex;
        if (item.isTranslated) {
            button.innerHTML = '<i class="fas fa-sync-alt"></i> Original';
            button.dataset.state = 'translated';
        } else {
            button.innerHTML = '<i class="fas fa-language"></i> Traduzir';
            button.dataset.state = 'original';
        }
        button.addEventListener('click', handleTranslateToggleClick);
        // Anexar botão após o nó de texto
        cell.appendChild(button);
    }
    return cell;
}

// Criar célula de fonte
function createSourceCell(item, sectionIndex, itemIndex) {
    const cell = document.createElement('td');
    cell.className = 'source-cell';
    const badge = document.createElement('span');
    badge.className = `source-badge-table ${item.source?.toLowerCase() || 'unknown'}`;
    badge.textContent = item.source || '?';
    badge.dataset.sectionId = sectionIndex;
    badge.dataset.itemId = itemIndex;
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        showSourceMenu(badge, sectionIndex, itemIndex);
    });
    cell.appendChild(badge);
    return cell;
}

// Gerar links de busca baseados na fonte e termo
function generateSearchLinks(source, term) {
    if (!term || term === '-') return '-';
    
    // Garantir que o termo está limpo e bem formatado
    const cleanTerm = term.trim();
    // Sem termos vazios
    if (!cleanTerm) return '';
    
    const encodedTerm = encodeURIComponent(cleanTerm);
    const spaceReplaced = cleanTerm.replace(/ /g, "+");
    const dashReplaced = cleanTerm.replace(/ /g, "-");

    const linksBySource = {
        'BV': { Storyblocks: `https://www.storyblocks.com/video/search/${dashReplaced}`, Envato: `https://elements.envato.com/stock-video/${spaceReplaced}`, Pexels: `https://www.pexels.com/search/videos/${encodedTerm}/?orientation=landscape`, Pixabay: `https://pixabay.com/videos/search/${encodedTerm}/?orientation=horizontal` },
        'YT': { YouTube: `https://www.youtube.com/results?search_query=${spaceReplaced}`, Vimeo: `https://vimeo.com/search?q=${spaceReplaced}` },
        'GI': { Google: `https://www.google.com/search?q=${spaceReplaced}&tbm=isch`, Unsplash: `https://unsplash.com/s/photos/${dashReplaced}`, FlickrCC: `https://flickr.com/search/?text=${spaceReplaced}&license=2%2C3%2C4%2C5%2C6%2C9`, Wikimedia: `https://commons.wikimedia.org/w/index.php?search=${spaceReplaced}` },
        'MOT': { Google: `https://www.google.com/search?q=${spaceReplaced}`, Statista: `https://www.statista.com/search/?q=${spaceReplaced}`, Infogram: `https://infogram.com/search/${spaceReplaced}` }
    };
    const links = linksBySource[source] || { Google: `https://www.google.com/search?q=${spaceReplaced}`, YouTube: `https://www.youtube.com/results?search_query=${spaceReplaced}` };

    return Object.entries(links)
        .map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Buscar '${cleanTerm}' em ${name}">${name}</a>`)
        .join(' ');
}

// Criar célula de links
function createLinksCell(item, sectionIndex, itemIndex) {
    const cell = document.createElement('td');
    // Aplicar classe de estado expandido
    cell.className = `links-cell ${item.expanded ? 'expanded-column' : 'collapsed-column'}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'links-wrapper';

    (item.searchTerms || []).forEach(term => {
        const termDiv = document.createElement('div');
        termDiv.className = 'term-links';
        termDiv.innerHTML = generateSearchLinks(item.source, term);
        wrapper.appendChild(termDiv);
    });

    const urlInputWrapper = document.createElement('div');
    urlInputWrapper.className = 'url-input-wrapper';
    if (item.links && typeof item.links === 'object') {
        Object.entries(item.links).forEach(([url, title]) => {
            urlInputWrapper.appendChild(createURLPreview(url, title, sectionIndex, itemIndex));
        });
    }
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'url-input';
    urlInput.placeholder = 'Cole URL personalizada aqui';
    urlInput.dataset.sectionId = sectionIndex;
    urlInput.dataset.itemId = itemIndex;
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleURLInput(urlInput); });
    urlInput.addEventListener('paste', () => setTimeout(() => handleURLInput(urlInput), 50));
    urlInputWrapper.appendChild(urlInput);

    wrapper.appendChild(urlInputWrapper);
    cell.appendChild(wrapper);
    return cell;
}

// Criar preview de URL
function createURLPreview(url, title, sectionId, itemId) {
    const preview = document.createElement('a');
    preview.href = url;
    preview.target = "_blank";
    preview.rel = "noopener noreferrer";
    preview.className = 'url-preview';
    preview.dataset.url = url;

    try {
        const domain = new URL(url).hostname;
        
        // Use favicon de tamanho 64 para melhor qualidade
        preview.innerHTML = `
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" class="url-favicon" alt="" loading="lazy">
            <span class="url-title">${title || domain}</span>
            <span class="url-remove"><i class="fas fa-times"></i></span>
        `;
    } catch {
        preview.innerHTML = `
            <span class="url-title">${title || 'Link Inválido'}</span>
            <span class="url-remove"><i class="fas fa-times"></i></span>
        `;
    }

    preview.querySelector('.url-remove').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeURLPreview(preview, sectionId, itemId, url);
    });
    return preview;
}

// Remover URL preview
function removeURLPreview(preview, sectionId, itemId, url) {
    if (processedData[sectionId]?.items[itemId]?.links) {
        delete processedData[sectionId].items[itemId].links[url];
        // Salvar alterações no localStorage
        saveDataToStorage();
    }
    preview.remove();
}

// Criar célula de notas
function createNotesCell(item, sectionIndex, itemIndex) {
    const cell = document.createElement('td');
    // Aplicar classe de estado expandido
    cell.className = `notes-cell ${item.expanded ? 'expanded-column' : 'collapsed-column'}`;
    const input = document.createElement('textarea');
    input.className = 'notes-input';
    input.placeholder = 'Clique para adicionar notas...';
    input.value = item.notes || '';
    input.dataset.sectionId = sectionIndex;
    input.dataset.itemId = itemIndex;
    input.addEventListener('input', handleNotesInput);
    cell.appendChild(input);
    return cell;
}

export {
    createActionButtons,
    createTableHeader,
    createTableBody,
    createCell,
    createRoteiroCell,
    createSourceCell,
    createLinksCell,
    createNotesCell,
    createURLPreview,
    removeURLPreview,
    generateSearchLinks
};