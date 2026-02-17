// src/storage/StorageService.js
const STORAGE_KEY = 'mediaExplorer_favorites';
const MAX_FAVORITES = 50;

export function getFavorites() {
    try {
        const favorites = localStorage.getItem(STORAGE_KEY);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        console.error('Error reading favorites:', error);
        return [];
    }
}

export function saveFavorite(item) {
    try {
        if (!item || !item.id) {
            console.error('Invalid item to save');
            return false;
        }
        
        const favorites = getFavorites();
        
        // Check if already exists
        if (favorites.some(fav => fav.id === item.id)) {
            console.log('Item already in favorites');
            return false;
        }
        
        // Check max limit
        if (favorites.length >= MAX_FAVORITES) {
            console.warn('Maximum favorites reached');
            return false;
        }
        
        // Add timestamp
        const itemWithTimestamp = {
            ...item,
            savedAt: new Date().toISOString()
        };
        
        favorites.push(itemWithTimestamp);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        
        // Dispatch event for other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(favorites)
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving favorite:', error);
        return false;
    }
}

export function removeFavorite(itemId) {
    try {
        if (!itemId) return false;
        
        let favorites = getFavorites();
        const initialLength = favorites.length;
        favorites = favorites.filter(fav => fav.id !== itemId);
        
        if (favorites.length === initialLength) {
            return false; // No item removed
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        
        // Dispatch event
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(favorites)
        }));
        
        return true;
    } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
    }
}

export function isFavorite(itemId) {
    try {
        const favorites = getFavorites();
        return favorites.some(fav => fav.id === itemId);
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

export function clearFavorites() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        
        // Dispatch event
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: null
        }));
        
        return true;
    } catch (error) {
        console.error('Error clearing favorites:', error);
        return false;
    }
}

export function getFavoritesCount() {
    try {
        const favorites = getFavorites();
        return favorites.length;
    } catch (error) {
        console.error('Error getting favorites count:', error);
        return 0;
    }
}