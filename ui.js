class UIManager {
    constructor() {
        this.resultsContainer = document.getElementById('results-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.noResults = document.getElementById('no-results');
        this.pagination = document.getElementById('pagination');
        this.totalResults = document.getElementById('total-results');
        this.favoritesCount = document.getElementById('favorites-count');
        this.modal = document.getElementById('detail-modal');
        this.modalBody = document.getElementById('modal-body');
        this.currentView = 'grid';
        this.currentResults = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.init();
    }

    init() {
        this.updateFavoritesCount();
        this.setupEventListeners();
        this.loadRecentSearches();
    }

    setupEventListeners() {
        document.getElementById('grid-view').addEventListener('click', () => {
            this.switchView('grid');
        });

        document.getElementById('list-view').addEventListener('click', () => {
            this.switchView('list');
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        window.addEventListener('favoritesUpdated', () => {
            this.updateFavoritesCount();
        });
    }

    switchView(viewType) {
        this.currentView = viewType;
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');
        const resultsContainer = this.resultsContainer;

        gridBtn.classList.toggle('active', viewType === 'grid');
        listBtn.classList.toggle('active', viewType === 'list');
        resultsContainer.classList.toggle('list-view', viewType === 'list');

        this.renderResults(this.currentResults);
    }

    showLoading() {
        this.loadingIndicator.style.display = 'block';
        this.noResults.style.display = 'none';
        this.resultsContainer.innerHTML = '';
        this.pagination.style.display = 'none';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    showNoResults() {
        this.noResults.style.display = 'block';
        this.resultsContainer.innerHTML = '';
        this.pagination.style.display = 'none';
    }

    hideNoResults() {
        this.noResults.style.display = 'none';
    }

    renderResults(resultsData) {
        this.currentResults = resultsData.items || resultsData;
        this.hideLoading();
        this.hideNoResults();

        if (!this.currentResults || this.currentResults.length === 0) {
            this.showNoResults();
            this.totalResults.textContent = '0';
            return;
        }

        const total = resultsData.total || this.currentResults.length;
        this.totalResults.textContent = total.toLocaleString();

        this.resultsContainer.innerHTML = '';
        
        this.currentResults.forEach(item => {
            const resultCard = this.createResultCard(item);
            this.resultsContainer.appendChild(resultCard);
        });

        if (resultsData.totalPages > 1) {
            this.renderPagination(resultsData);
        } else {
            this.pagination.style.display = 'none';
        }
    }

    createResultCard(item) {
        const card = document.createElement('div');
        card.className = `result-card ${this.currentView}-view`;
        card.dataset.id = item.id;
        card.dataset.type = item.type;

        const isFavorite = storageManager.isFavorite(item.id);
        
        const mediaHtml = item.type === 'audio' ? 
            `<div class="result-media">
                <i class="fas fa-music fa-3x"></i>
            </div>` :
            `<div class="result-media">
                <img src="${item.thumbnail || 'assets/placeholder.jpg'}" 
                     alt="${item.title}"
                     loading="lazy"
                     onerror="this.src='assets/placeholder.jpg'">
                <span class="media-type">${item.type}</span>
            </div>`;

        card.innerHTML = `
            ${mediaHtml}
            <div class="result-content">
                <h3 class="result-title" title="${item.title}">${item.title}</h3>
                <div class="result-meta">
                    <p><i class="fas fa-user"></i> ${item.author || 'Unknown'}</p>
                    <p><i class="fas fa-calendar"></i> ${item.year || 'Unknown'}</p>
                    <p><i class="fas fa-database"></i> ${item.source}</p>
                    ${item.size ? `<p><i class="fas fa-weight"></i> ${item.size}</p>` : ''}
                </div>
                <div class="result-actions">
                    <button class="action-btn view" onclick="uiManager.showItemDetails('${item.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn favorite ${isFavorite ? 'active' : ''}" 
                            onclick="uiManager.toggleFavorite('${item.id}')">
                        <i class="fas fa-heart"></i> ${isFavorite ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    renderPagination(paginationData) {
        this.pagination.style.display = 'flex';
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        prevBtn.disabled = !paginationData.hasPrev;
        nextBtn.disabled = !paginationData.hasNext;
        
        pageInfo.textContent = `Page ${paginationData.page} of ${paginationData.totalPages}`;
        
        prevBtn.onclick = () => {
            if (paginationData.hasPrev) {
                window.dispatchEvent(new CustomEvent('pageChange', { 
                    detail: { page: paginationData.page - 1 } 
                }));
            }
        };
        
        nextBtn.onclick = () => {
            if (paginationData.hasNext) {
                window.dispatchEvent(new CustomEvent('pageChange', { 
                    detail: { page: paginationData.page + 1 } 
                }));
            }
        };
    }

    async showItemDetails(itemId) {
        try {
            this.showLoading();
            const details = await apiManager.getItemDetails(itemId);
            
            if (!details) {
                this.showToast('Error loading details', 'error');
                return;
            }

            const modalContent = this.createModalContent(itemId, details);
            this.modalBody.innerHTML = modalContent;
            this.showModal();
            
        } catch (error) {
            console.error('Error showing item details:', error);
            this.showToast('Error loading details', 'error');
        } finally {
            this.hideLoading();
        }
    }

    createModalContent(itemId, details) {
        const item = this.currentResults.find(r => r.id === itemId) || {};
        const isFavorite = storageManager.isFavorite(itemId);
        
        return `
            <div class="modal-header">
                <h2>${item.title || 'Details'}</h2>
                <button class="btn-primary" onclick="uiManager.toggleFavorite('${itemId}')">
                    <i class="fas fa-heart"></i> ${isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                </button>
            </div>
            
            <div class="modal-body">
                ${item.type === 'image' ? 
                    `<img src="${item.url || item.thumbnail}" 
                         alt="${item.title}"
                         class="modal-image"
                         onerror="this.src='assets/placeholder.jpg'">` : 
                 item.type === 'audio' ?
                    `<div class="audio-player">
                        <i class="fas fa-music fa-5x"></i>
                        <audio controls>
                            <source src="https://archive.org/download/${item.identifier}/format=MP3" type="audio/mpeg">
                            Your browser does not support audio.
                        </audio>
                    </div>` :
                    `<div class="text-preview">
                        <i class="fas fa-book fa-5x"></i>
                        <p>Text document available for download</p>
                    </div>`
                }
                
                <div class="modal-info">
                    <h3>Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong><i class="fas fa-user"></i> Author:</strong>
                            <span>${item.author || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <strong><i class="fas fa-calendar"></i> Year:</strong>
                            <span>${item.year || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <strong><i class="fas fa-database"></i> Source:</strong>
                            <span>${item.source}</span>
                        </div>
                        <div class="info-item">
                            <strong><i class="fas fa-copyright"></i> License:</strong>
                            <span>${item.license}</span>
                        </div>
                        ${item.size ? `
                        <div class="info-item">
                            <strong><i class="fas fa-weight"></i> Size:</strong>
                            <span>${item.size}</span>
                        </div>` : ''}
                        ${item.dimensions ? `
                        <div class="info-item">
                            <strong><i class="fas fa-expand"></i> Dimensions:</strong>
                            <span>${item.dimensions}</span>
                        </div>` : ''}
                        ${item.downloads ? `
                        <div class="info-item">
                            <strong><i class="fas fa-download"></i> Downloads:</strong>
                            <span>${item.downloads.toLocaleString()}</span>
                        </div>` : ''}
                    </div>
                    
                    ${item.description ? `
                    <div class="description-section">
                        <h3>Description</h3>
                        <p>${item.description}</p>
                    </div>` : ''}
                    
                    <div class="modal-actions">
                        ${item.url ? `
                        <a href="${item.url}" 
                           target="_blank" 
                           class="btn-primary"
                           download="${item.title}.${item.type === 'image' ? 'jpg' : item.type}">
                            <i class="fas fa-download"></i> Download
                        </a>` : ''}
                        
                        <button class="btn-secondary" onclick="uiManager.shareItem('${itemId}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showModal() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    toggleFavorite(itemId) {
        const item = this.currentResults.find(r => r.id === itemId);
        
        if (!item) {
            this.showToast('Item not found', 'error');
            return;
        }

        if (storageManager.isFavorite(itemId)) {
            storageManager.removeFromFavorites(itemId);
            this.showToast('Removed from favorites', 'info');
        } else {
            storageManager.addToFavorites(item);
            this.showToast('Added to favorites', 'success');
        }

        this.updateFavoriteButtons(itemId);
    }

    updateFavoriteButtons(itemId) {
        const isFavorite = storageManager.isFavorite(itemId);
        const buttons = document.querySelectorAll(`[onclick*="${itemId}"]`);
        
        buttons.forEach(button => {
            if (button.classList.contains('favorite')) {
                button.classList.toggle('active', isFavorite);
                button.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Saved' : 'Save'}`;
            }
        });
    }

    updateFavoritesCount() {
        const count = storageManager.getFavoriteCount();
        this.favoritesCount.textContent = count;
    }

    shareItem(itemId) {
        const item = this.currentResults.find(r => r.id === itemId);
        
        if (!item) {
            this.showToast('Item not found', 'error');
            return;
        }

        const shareUrl = `${window.location.origin}${window.location.pathname}?item=${itemId}`;
        const shareText = `Check out "${item.title}" on Public Domain Explorer`;

        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: shareText,
                url: shareUrl
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showToast('Link copied to clipboard', 'success');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast('Link copied to clipboard', 'success');
            });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    loadRecentSearches() {
        const recentSearches = storageManager.getRecentSearches();
        
        if (recentSearches.length > 0) {
            const searchInput = document.getElementById('search-input');
            searchInput.placeholder = `Search... (Recent: ${recentSearches[0].query})`;
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    updateStats(totalResults, favoritesCount) {
        this.totalResults.textContent = totalResults || '0';
        this.favoritesCount.textContent = favoritesCount || '0';
    }
}

const uiManager = new UIManager();