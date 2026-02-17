// src/ui/uiRenderer.js
import { saveFavorite, getFavorites, removeFavorite } from '../storage/StorageService.js';

export function renderResults(results, context = 'search') {
    const containerId = context === 'favorites' ? 'favoritesContainer' : 'resultsContainer';
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results" style="text-align: center; padding: 2rem; color: #666;">No results found. Try a different search.</p>';
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
            const card = e.target.closest('.media-card');
            if (!card) return;
            
            const itemId = card.dataset.id;
            const item = results.find(r => r.id === itemId);
            
            if (!item) return;
            
            const isFavorite = favoriteIds.includes(itemId);
            
            if (isFavorite) {
                removeFavorite(itemId);
                btn.classList.remove('favorited');
                btn.innerHTML = '<i class="far fa-heart"></i>';
                // Update favoriteIds array
                const index = favoriteIds.indexOf(itemId);
                if (index > -1) favoriteIds.splice(index, 1);
            } else {
                saveFavorite(item);
                btn.classList.add('favorited');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                favoriteIds.push(itemId);
            }
        });
    });
    
    // Add event listeners to media cards for modal
    container.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn') && !e.target.closest('.download-btn')) {
                const itemId = card.dataset.id;
                const item = results.find(r => r.id === itemId);
                if (item) {
                    renderModal(item);
                }
            }
        });
    });
}

function createMediaCard(item, isFavorite = false) {
    const favoriteClass = isFavorite ? 'favorited' : '';
    const favoriteIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    
    // Truncate title if too long
    const title = item.title || 'Untitled';
    const shortTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    
    // Determinar ícono según tipo
    let icon = 'file-alt';
    if (item.type === 'audio') icon = 'music';
    else if (item.type === 'image') icon = 'image';
    else if (item.type === 'text') icon = 'book';
    
    return `
        <div class="media-card" data-id="${item.id}" style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer;">
            <div class="media-preview" style="height: 160px; overflow: hidden; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                ${item.type === 'image' && item.thumbnail ? 
                    `<img src="${item.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" 
                        onerror="this.src='https://via.placeholder.com/300x160?text=No+Image'">` :
                    `<div class="media-icon" style="text-align: center;">
                        <i class="fas fa-${icon}" style="font-size: 3rem; color: #3498db;"></i>
                        <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem; text-transform: capitalize;">${item.type}</p>
                    </div>`
                }
            </div>
            <div class="media-info" style="padding: 1rem;">
                <h3 class="media-title" style="font-size: 1rem; margin-bottom: 0.5rem; color: #2C3E50; font-weight: 600;" title="${title}">${shortTitle}</h3>
                <p class="media-source" style="font-size: 0.8rem; color: #7f8c8d; margin-bottom: 0.5rem;">
                    <i class="fas fa-database"></i> ${item.source || 'Unknown'}
                </p>
                <div class="media-actions" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="favorite-btn ${favoriteClass}" style="flex: 1; padding: 0.5rem; border: none; border-radius: 4px; background: ${isFavorite ? '#e74c3c' : '#ecf0f1'}; color: ${isFavorite ? 'white' : '#2C3E50'}; cursor: pointer; transition: background 0.3s; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <i class="${favoriteIcon}"></i>
                    </button>
                    ${item.downloads && item.downloads.length > 0 ? 
                        `<a href="${item.downloads[0]}" class="download-btn" target="_blank" style="padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #3498db; color: white; text-decoration: none; display: inline-flex; align-items: center;" onclick="event.stopPropagation()">
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
    
    if (!modalBody || !modal) return;
    
    // Determinar ícono
    let icon = 'file-alt';
    if (item.type === 'audio') icon = 'music';
    else if (item.type === 'image') icon = 'image';
    else if (item.type === 'text') icon = 'book';
    
    let html = `
        <div style="padding: 1rem;">
            <h2 style="margin-bottom: 1.5rem; color: #2C3E50; font-size: 1.5rem;">${item.title || 'Untitled'}</h2>
    `;
    
    // Imagen o ícono
    if (item.type === 'image') {
        if (item.url) {
            html += `
                <div style="margin-bottom: 1.5rem; text-align: center;">
                    <img src="${item.url}" alt="${item.title}" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" 
                        onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Image+Not+Available';">
                </div>
            `;
        } else if (item.thumbnail) {
            html += `
                <div style="margin-bottom: 1.5rem; text-align: center;">
                    <img src="${item.thumbnail}" alt="${item.title}" style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
                        onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Image+Not+Available';">
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 1.5rem; text-align: center; padding: 3rem; background: #f0f0f0; border-radius: 8px;">
                    <i class="fas fa-image" style="font-size: 4rem; color: #3498db;"></i>
                    <p style="margin-top: 1rem; color: #666;">Image preview not available</p>
                </div>
            `;
        }
    } else {
        html += `
            <div style="margin-bottom: 1.5rem; text-align: center; padding: 3rem; background: #f0f0f0; border-radius: 8px;">
                <i class="fas fa-${icon}" style="font-size: 4rem; color: #3498db;"></i>
                <p style="margin-top: 1rem; color: #666; text-transform: capitalize;">${item.type} preview</p>
            </div>
        `;
    }
    
    // Metadatos
    html += `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
            <div>
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.25rem;">Type:</strong>
                <span style="color: #666; text-transform: capitalize;">${item.type || 'Unknown'}</span>
            </div>
            <div>
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.25rem;">Source:</strong>
                <span style="color: #666;">${item.source || 'Unknown'}</span>
            </div>
    `;
    
    if (item.author || item.creator) {
        html += `
            <div>
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.25rem;">Author/Creator:</strong>
                <span style="color: #666;">${item.author || item.creator}</span>
            </div>
        `;
    }
    
    if (item.year) {
        html += `
            <div>
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.25rem;">Year:</strong>
                <span style="color: #666;">${item.year}</span>
            </div>
        `;
    }
    
    if (item.license) {
        html += `
            <div>
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.25rem;">License:</strong>
                <span style="color: #666;">${item.license}</span>
            </div>
        `;
    }
    
    html += `</div>`;
    
    // Descripción
    if (item.description) {
        html += `
            <div style="margin-bottom: 2rem;">
                <strong style="color: #2C3E50; display: block; margin-bottom: 0.5rem;">Description:</strong>
                <p style="color: #666; line-height: 1.6;">${item.description}</p>
            </div>
        `;
    }
    
    // Botones de acción
    html += `
        <div style="display: flex; gap: 1rem; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 1.5rem;">
    `;
    
    if (item.url) {
        html += `
            <a href="${item.url}" target="_blank" style="padding: 0.75rem 1.5rem; background: #3498db; color: white; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-external-link-alt"></i> View Source
            </a>
        `;
    }
    
    if (item.downloads && item.downloads.length > 0) {
        html += `
            <a href="${item.downloads[0]}" target="_blank" style="padding: 0.75rem 1.5rem; background: #27ae60; color: white; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-download"></i> Download
            </a>
        `;
    }
    
    html += `
        </div>
    </div>
    `;
    
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
}

export function setupEventListeners() {
    console.log('Event listeners setup in main.js');
}