// modules/store.js - Gerencia o estado global e a persistência

// Chave para armazenamento no localStorage
const STORAGE_KEY = 'broll_mapper_data';

// Estado global da aplicação
let processedData = [];

// Inicializa o sistema de armazenamento
function initStorage() {
    try {
        // Verificar se o localStorage está disponível
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        
        // Carregar dados existentes
        const savedData = loadDataFromStorage();
        if (savedData && Array.isArray(savedData) && savedData.length > 0) {
            processedData = savedData;
            return true;
        }
        return false;
    } catch (e) {
        console.error('LocalStorage não está disponível:', e);
        return false;
    }
}

// Salvar dados no localStorage
function saveDataToStorage() {
    try {
        const jsonData = JSON.stringify(processedData);
        localStorage.setItem(STORAGE_KEY, jsonData);
        return true;
    } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
        // Se o erro for devido a exceder o limite de armazenamento
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('Limite de armazenamento excedido. Alguns dados podem não ser salvos.');
        }
        return false;
    }
}

// Carregar dados do localStorage
function loadDataFromStorage() {
    try {
        const jsonData = localStorage.getItem(STORAGE_KEY);
        if (!jsonData) return null;
        
        const parsedData = JSON.parse(jsonData);
        return parsedData;
    } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
        // Se os dados estiverem corrompidos, limpar o armazenamento
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

// Limpar dados do localStorage
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        processedData = [];
        return true;
    } catch (e) {
        console.error('Erro ao limpar localStorage:', e);
        return false;
    }
}

// Atualiza os dados processados e salva no localStorage
function updateData(newData) {
    processedData = newData;
    saveDataToStorage();
}

export {
    processedData,
    initStorage,
    saveDataToStorage,
    loadDataFromStorage,
    clearStorage,
    updateData
};