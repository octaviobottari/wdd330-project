class StorageManager {
    constructor() {
        this.FAVORITES_KEY = 'public_domain_favorites';
        this.SEARCH_HISTORY_KEY = 'search_history';
        this.SETTINGS_KEY = 'app_settings';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.FAVORITES_KEY)) {
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.SEARCH_HISTORY_KEY)) {
            localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.SETTINGS_KEY)) {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify({
                theme: 'light',
                itemsPerPage: 20,
                defaultView: 'grid',
                notifications: true
            }));
        }
    }

    getFavorites() {
        try {
            const favorites = JSON.parse(localStorage.getItem(this.FAVORITES_KEY));
            return Array.isArray(favorites) ? favorites : [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    addToFavorites(item) {
        const favorites = this.getFavorites();
        
        if (!favorites.some(fav => fav.id === item.id)) {
            favorites.unshift({
                ...item,
                addedAt: new Date().toISOString()
            });
            
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
            this.dispatchStorageEvent('favoritesUpdated', { count: favorites.length });
            return true;
        }
        return false;
    }

    removeFromFavorites(itemId) {
        const favorites = this.getFavorites();
        const newFavorites = favorites.filter(item => item.id !== itemId);
        
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(newFavorites));
        this.dispatchStorageEvent('favoritesUpdated', { count: newFavorites.length });
        return true;
    }

    isFavorite(itemId) {
        const favorites = this.getFavorites();
        return favorites.some(item => item.id === itemId);
    }

    addToSearchHistory(query) {
        if (!query || query.trim() === '') return;
        
        const history = this.getSearchHistory();
        const normalizedQuery = query.trim().toLowerCase();
        
        const existingIndex = history.findIndex(item => 
            item.query.toLowerCase() === normalizedQuery
        );
        
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        
        history.unshift({
            query: query.trim(),
            timestamp: new Date().toISOString(),
            count: 1
        });
        
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
        return history;
    }

    getSearchHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY));
            return Array.isArray(history) ? history : [];
        } catch (error) {
            console.error('Error getting search history:', error);
            return [];
        }
    }

    clearSearchHistory() {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify([]));
        return true;
    }

    getSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.SETTINGS_KEY));
            return settings || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
        this.dispatchStorageEvent('settingsUpdated', updatedSettings);
        return updatedSettings;
    }

    getRecentSearches(limit = 5) {
        const history = this.getSearchHistory();
        return history.slice(0, limit);
    }

    getFavoriteCount() {
        const favorites = this.getFavorites();
        return favorites.length;
    }

    clearAllData() {
        localStorage.removeItem(this.FAVORITES_KEY);
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
        localStorage.removeItem(this.SETTINGS_KEY);
        
        this.init();
        this.dispatchStorageEvent('dataCleared', {});
        return true;
    }

    exportData() {
        const data = {
            favorites: this.getFavorites(),
            searchHistory: this.getSearchHistory(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `public-domain-explorer-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.favorites) {
                        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(data.favorites));
                    }
                    
                    if (data.searchHistory) {
                        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(data.searchHistory));
                    }
                    
                    if (data.settings) {
                        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
                    }
                    
                    this.dispatchStorageEvent('dataImported', { success: true });
                    resolve(true);
                } catch (error) {
                    reject(new Error('Invalid backup file format'));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    dispatchStorageEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

const storageManager = new StorageManager();