// modules/actions.js - Ações do usuário (copiar, exportar, etc.)

import { processedData, saveDataToStorage } from './store.js';
import { toggleAllColumns, showToast } from './ui.js';
import { serializeDataToJson } from './parser.js';

// Copia dados de uma seção para a área de transferência no formato markdown
function copySectionData(sectionId) {
    const section = processedData[sectionId];
    if (!section) return;

    const hasRoteiro = section.hasRoteiroColumn;
    let text = `# ${section.title}\n\n`;
    let headers = ['ID', 'TIMECODE'];
    if (hasRoteiro) headers.push('ROTEIRO');
    headers = headers.concat(['O QUE BUSCAR', 'FONTE', 'TERMOS DE BUSCA', 'LINKS', 'NOTAS']);
    text += `| ${headers.join(' | ')} |\n`;
    text += `| ${headers.map(() => '---').join(' | ')} |\n`;

    section.items.forEach(item => {
        let rowData = [];
        rowData.push(item.id);
        rowData.push(item.timecode);
        if (hasRoteiro) {
            const roteiroText = item.isTranslated ? (item.translatedRoteiro || item.roteiro) : (item.originalRoteiro || item.roteiro);
            rowData.push(roteiroText || '-');
        }
        rowData.push(item.element);
        rowData.push(item.source || '?');
        rowData.push(item.searchTermsText || '-');
        const linksText = Object.entries(item.links || {})
            .map(([url, title]) => `[${title}](${url})`)
            .join(' ');
        rowData.push(linksText || '-');
        rowData.push(item.notes || '-');
        text += `| ${rowData.map(d => (d ?? '').toString().replace(/\|/g, '\\|')).join(' | ')} |\n`;
    });

    copyToClipboard(text);
    showToast('Tabela da seção copiada como Markdown!');
}

// Copia links personalizados de uma seção para a área de transferência
function copySectionLinks(sectionId) {
    const section = processedData[sectionId];
    if (!section) return;
    let linksList = [];
    section.items.forEach((item) => {
        const customLinks = Object.entries(item.links || {});
        if (customLinks.length > 0) {
            customLinks.forEach(([url, title], linkIndex) => {
                const linkId = customLinks.length > 1 ? `${item.id}.${linkIndex + 1}` : item.id;
                linksList.push(`${linkId} | ${item.timecode} | ${url}`);
            });
        }
    });

    if (linksList.length === 0) {
        showToast('Nenhum link personalizado encontrado nesta seção.');
        return;
    }
    copyToClipboard(linksList.join('\n'));
    showToast(`${linksList.length} link(s) personalizado(s) copiado(s)!`);
}

// Copia um JSON representando toda a seção para a área de transferência
function copySectionJson(sectionId) {
    const section = processedData[sectionId];
    if (!section) return;
    
    // Criar cópia específica da seção
    const sectionJson = serializeDataToJson([section]);
    
    copyToClipboard(sectionJson);
    showToast('JSON da seção copiado para a área de transferência!');
}

// Copia todo o conjunto de dados como JSON
function copyFullJson() {
    if (!processedData || processedData.length === 0) {
        showToast('Nenhum dado para exportar. Insira dados primeiro.');
        return;
    }
    
    const fullJson = serializeDataToJson(processedData);
    copyToClipboard(fullJson);
    showToast('JSON completo copiado para a área de transferência!');
    
    // Adicionar informação complementar para projetos grandes
    const dataSize = new Blob([fullJson]).size;
    if (dataSize > 500000) { // Mais de 500KB
        setTimeout(() => {
            showToast('Atenção: JSON grande! Certifique-se de salvá-lo em um local seguro.');
        }, 3500);
    }
}

// Função de apoio para copiar para a área de transferência
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Toast mostrado pelo chamador
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showToast('Falha ao copiar. Tente manualmente.');
    });
}

// Adiciona uma URL personalizada a um item
function addURLToItem(sectionId, itemId, url, title) {
    if (!processedData[sectionId]?.items[itemId]) return false;
    
    const item = processedData[sectionId].items[itemId];
    item.links = item.links || {};
    
    // Se URL já existe, adiciona com um sufixo único para permitir múltiplos links
    // para a mesma URL (útil quando o usuário quer adicionar diferentes referências para o mesmo site)
    if (item.links[url]) {
        // Gerar um identificador único para esta URL
        const timestamp = new Date().getTime();
        const uniqueUrl = `${url}#${timestamp}`;
        item.links[uniqueUrl] = title;
    } else {
        item.links[url] = title;
    }
    
    saveDataToStorage();
    return true;
}

// Remove uma URL personalizada de um item
function removeURLFromItem(sectionId, itemId, url) {
    if (!processedData[sectionId]?.items[itemId]?.links) return false;
    
    delete processedData[sectionId].items[itemId].links[url];
    saveDataToStorage();
    return true;
}

// Atualiza as notas de um item
function updateItemNotes(sectionId, itemId, notes) {
    if (!processedData[sectionId]?.items[itemId]) return false;
    
    processedData[sectionId].items[itemId].notes = notes;
    saveDataToStorage();
    return true;
}

// Tradução de roteiro
async function translateRoteiro(text, targetLang = 'pt') {
    if (!text) return '';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data[0]?.map(segment => segment[0]).join('') || text;
    } catch (error) {
        console.error('Translation failed:', error);
        return text;
    }
}

// Traduzir todos os roteiros de uma seção
async function translateSectionRoteiro(sectionId) {
    const section = processedData[sectionId];
    if (!section) return false;
    
    const itemsToTranslate = section.items.filter(item => item.roteiro && !item.isTranslated);
    if (itemsToTranslate.length === 0) {
        section.items.forEach(item => { if (item.roteiro) item.isTranslated = true; });
        saveDataToStorage();
        return true;
    }

    try {
        await Promise.all(itemsToTranslate.map(async (item) => {
            if (!item.originalRoteiro) item.originalRoteiro = item.roteiro;
            item.translatedRoteiro = await translateRoteiro(item.originalRoteiro);
            item.isTranslated = true;
        }));
        
        section.items.forEach(item => { if (item.roteiro) item.isTranslated = true; });
        saveDataToStorage();
        return true;
    } catch (error) {
        console.error('Error translating section:', error);
        return false;
    }
}

// Desfazer tradução de roteiro em uma seção
function undoTranslateSectionRoteiro(sectionId) {
    const section = processedData[sectionId];
    if (!section) return false;
    
    let restored = false;
    section.items.forEach(item => {
        if (item.isTranslated) {
            item.isTranslated = false;
            restored = true;
        }
    });
    
    if (restored) {
        saveDataToStorage();
        return true;
    }
    return false;
}

export {
    copySectionData,
    copySectionLinks,
    copySectionJson,
    copyFullJson,
    copyToClipboard,
    addURLToItem,
    removeURLFromItem,
    updateItemNotes,
    translateRoteiro,
    translateSectionRoteiro,
    undoTranslateSectionRoteiro,
    toggleAllColumns
};