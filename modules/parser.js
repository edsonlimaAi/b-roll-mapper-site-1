// modules/parser.js - Funções de parseamento

// Analisa texto markdown para estrutura de dados
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const sections = [];
    let currentSectionTitle = 'Seção Inicial'; // Default title
    let currentItems = [];
    let inTable = false;
    let tableHeaders = []; // Headers for the current table being processed
    let tableHasRoteiro = false; // Flag for the current table
    let headerMap = {}; // { 'HEADER_NAME': index } for the current table

    function finalizeSection() {
        if (currentItems.length > 0) {
            // Determine if the section *overall* should display the Roteiro column
            const sectionHasRoteiro = currentItems.some(item => item.roteiro && item.roteiro.trim() !== '');
            sections.push({
                title: currentSectionTitle,
                items: [...currentItems],
                // This flag determines rendering for the entire section's table
                hasRoteiroColumn: sectionHasRoteiro
            });
        }
        // Reset for next section
        currentItems = [];
        inTable = false;
        tableHeaders = [];
        tableHasRoteiro = false;
        headerMap = {};
    }

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('#')) {
            finalizeSection(); // Finalize previous section/table
            currentSectionTitle = trimmedLine.replace(/^#+\s+/, '').trim() || 'Seção Sem Título';
            // Reset table state explicitly for the new section
            inTable = false;
            tableHeaders = [];
            tableHasRoteiro = false;
            headerMap = {};
            continue;
        }

        // Process table lines
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            const cells = trimmedLine.split('|').map(cell => cell.trim()).slice(1, -1); // Get content cells

            if (!inTable && cells.length > 0 && !cells.some(cell => cell.startsWith('---'))) {
                // --- Potential Header Row ---
                // Reset state for THIS specific table
                tableHeaders = cells.map(h => h.toUpperCase().replace(/\*+/g, '')); // Remove markdown emphasis
                headerMap = {};
                tableHeaders.forEach((h, index) => { headerMap[h] = index; });

                // Check for essential columns in THIS table's header
                const hasTimecode = 'TIMECODE' in headerMap;
                const hasElement = ['O QUE BUSCAR', 'ELEMENTO', 'VISUAL'].some(key => key in headerMap);
                const hasSource = 'FONTE' in headerMap;
                const hasTerms = 'TERMOS DE BUSCA' in headerMap;

                if (!(hasTimecode && hasElement && hasSource && hasTerms)) {
                    console.warn("Cabeçalho de tabela inválido ou incompleto, ignorando tabela:", tableHeaders.join(', '));
                    // Do not set inTable = true, skip this potential table
                    continue;
                }

                // Determine if THIS table has Roteiro
                tableHasRoteiro = 'ROTEIRO' in headerMap || 'SCRIPT' in headerMap;
                inTable = true; // We are now officially in a valid table

            } else if (inTable && cells.some(cell => cell.startsWith('---'))) {
                // --- Separator Row ---
                if (cells.length !== tableHeaders.length) {
                    console.warn("Separador de tabela com número incorreto de colunas, parando processamento da tabela:", trimmedLine);
                    inTable = false; // Table structure is broken
                }
                // Valid separator, just continue

            } else if (inTable && cells.length === tableHeaders.length) {
                // --- Data Row ---
                const timecode = cells[headerMap['TIMECODE']] || '';
                const elementKey = ['O QUE BUSCAR', 'ELEMENTO', 'VISUAL'].find(key => key in headerMap);
                const element = elementKey ? (cells[headerMap[elementKey]] || '') : '';
                const source = (cells[headerMap['FONTE']] || '').toUpperCase();
                const termsText = cells[headerMap['TERMOS DE BUSCA']] || '';

                // Get Roteiro ONLY if the current table structure has it
                let roteiro = '';
                if (tableHasRoteiro) {
                    const roteiroKey = 'ROTEIRO' in headerMap ? 'ROTEIRO' : 'SCRIPT';
                    roteiro = cells[headerMap[roteiroKey]] || '';
                }

                currentItems.push({
                    id: currentItems.length + 1,
                    timecode: timecode,
                    roteiro: roteiro, // Will be empty if tableHasRoteiro is false
                    element: element,
                    source: source,
                    searchTermsText: termsText,
                    searchTerms: extractSearchTerms(termsText),
                    links: {}, notes: '', expanded: true, // Default to expanded
                    isTranslated: false, originalRoteiro: null, translatedRoteiro: null
                });

            } else if (inTable) {
                // Data row with incorrect column count
                console.warn(`Linha da tabela ignorada - número de células (${cells.length}) não corresponde aos cabeçalhos (${tableHeaders.length}):`, trimmedLine);
            }
            // Ignore lines that are not section headers or valid table parts
        }
    }
    finalizeSection(); // Finalize the last section

    return sections;
}

// Analisa JSON para estrutura de dados
function parseJson(jsonText) {
    const jsonData = JSON.parse(jsonText);
    if (!jsonData.sections || !Array.isArray(jsonData.sections)) {
        throw new Error('Formato JSON inválido. Deve conter um array "sections".');
    }

    return jsonData.sections.map((section, sectionIndex) => {
         const items = (section.items || []).map((item, itemIndex) => {
            const termsText = item.searchTermsText || (Array.isArray(item.searchTerms) ? item.searchTerms.join(', ') : '');
            return {
                id: item.id || (itemIndex + 1),
                timecode: item.timecode || '',
                roteiro: item.roteiro || '',
                element: item.element || '',
                source: (item.source || '').toUpperCase(),
                searchTermsText: termsText,
                searchTerms: item.searchTerms || extractSearchTerms(termsText),
                links: item.links || {},
                notes: item.notes || '',
                expanded: item.expanded !== false, // Default true
                isTranslated: item.isTranslated === true,
                originalRoteiro: item.originalRoteiro || null,
                translatedRoteiro: item.translatedRoteiro || null
            };
        });
        // Determine if this section should display the Roteiro column
        const sectionHasRoteiro = items.some(item => item.roteiro && item.roteiro.trim() !== '');
        return {
            title: section.title || `Seção ${sectionIndex + 1}`,
            items: items,
            hasRoteiroColumn: sectionHasRoteiro
        };
    });
}

// Extrai termos de busca de um texto
function extractSearchTerms(text) {
    if (!text) return [];
    // Regex to capture terms within double quotes, single quotes, or separated by commas
    const matches = text.match(/("[^"]+"|'[^']+'|[^,]+)/g) || [];
    // Clean up quotes and trim whitespace
    return matches.map(term => term.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
}

// Serializa dados para JSON formatado
function serializeDataToJson(data) {
    return JSON.stringify({ sections: data }, null, 2);
}

export {
    parseMarkdown,
    parseJson,
    extractSearchTerms,
    serializeDataToJson
};