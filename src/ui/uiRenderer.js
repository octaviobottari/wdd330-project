import { saveFavorite, getFavorites, removeFavorite } from '/storage/storageService.js';

export function renderResults(results, context = 'search') {
    const container = document.getElementById(
        context === 'favorites' ? 'favoritesContainer' : 'resultsContainer'
    );
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results">No results found. Try a different search.</p>';
        return;
    }
    
    const favorites = getFavorites();
    const favoriteIds = favorites.map(fav => fav.id);
    
    const html = results.map(item => createMediaCard(item, favoriteIds.includes(item.id))).join('');
    container.innerHTML = html;
    
    // Add event listeners to favorite buttons
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = e.target.closest('.media-card').dataset.id;
            const item = results.find(r => r.id === itemId);
            
            if (favoriteIds.includes(itemId)) {
                removeFavorite(itemId);
                e.target.classList.remove('favorited');
                e.target.innerHTML = '<i class="far fa-heart"></i>';
            } else {
                saveFavorite(item);
                e.target.classList.add('favorited');
                e.target.innerHTML = '<i class="fas fa-heart"></i>';
            }
        });
    });
    
    // Add event listeners to media cards for modal
    container.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                const itemId = card.dataset.id;
                const item = results.find(r => r.id === itemId);
                renderModal(item);
            }
        });
    });
}

function createMediaCard(item, isFavorite = false) {
    const favoriteClass = isFavorite ? 'favorited' : '';
    const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    
    return `
        <div class="media-card" data-id="${item.id}">
            <div class="media-preview">
                ${item.type === 'image' ? 
                    `<img src="${item.thumbnail || 'placeholder.jpg'}" alt="${item.title}" loading="lazy">` :
                    `<div class="media-icon">
                        <i class="fas fa-${item.type === 'audio' ? 'music' : 'file-alt'}"></i>
                    </div>`
                }
            </div>
            <div class="media-info">
                <h3 class="media-title">${item.title || 'Untitled'}</h3>
                <p class="media-source">${item.source}</p>
                <div class="media-actions">
                    <button class="favorite-btn ${favoriteClass}">
                        <i class="${favoriteIcon}"></i>
                    </button>
                    ${item.downloads ? 
                        `<a href="${item.downloads[0]}" class="download-btn" target="_blank">
                            <i class="fas fa-download"></i>
                        </a>` : ''
                    }
                </div>
            </div>
        </div>
    `;
}

export function renderModal(item) {
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('modal');
    
    let html = `
        <h2>${item.title}</h2>
        <div class="modal-details">
            <p><strong>Type:</strong> ${item.type}</p>
            <p><strong>Source:</strong> ${item.source}</p>
            ${item.creator ? `<p><strong>Creator:</strong> ${item.creator}</p>` : ''}
            ${item.year ? `<p><strong>Year:</strong> ${item.year}</p>` : ''}
        </div>
    `;
    
    if (item.type === 'image' && item.url) {
        html += `<img src="${item.url}" alt="${item.title}" class="modal-image">`;
    }
    
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
}

export function setupEventListeners() {
    // Modal close on outside click
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('modal').classList.add('hidden');
        }
    });
    
    // Mobile menu toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('mobileNav').classList.toggle('hidden');
    });
}