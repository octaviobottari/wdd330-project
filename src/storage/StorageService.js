const STORAGE_KEY = 'mediaExplorer_favorites';

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
        const favorites = getFavorites();
        
        // Check if item already exists
        if (!favorites.some(fav => fav.id === item.id)) {
            favorites.push(item);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving favorite:', error);
        return false;
    }
}

export function removeFavorite(itemId) {
    try {
        let favorites = getFavorites();
        favorites = favorites.filter(fav => fav.id !== itemId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
    }
}

export function clearFavorites() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing favorites:', error);
        return false;
    }
}