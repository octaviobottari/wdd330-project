import ApiService from './storage/ApiService.js';
import StorageService from './storage/StorageService.js';

class App {
    constructor() {
        this.api = new ApiService();
        this.storage = new StorageService();
        this.state = {
            query: '',
            filters: {
                type: 'all',
                sources: { wikimedia: true, archive: true },
                yearFrom: '',
                yearTo: '',
                license: 'all'
            },
            results: [],
            loading: false,
            currentPage: 1,
            viewMode: 'grid'
        };
    }

    async init() {
        this.renderApp();
        this.bindEvents();
        this.loadFavorites();
    }

    renderApp() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header class="header">
                <nav class="nav-container">
                    <div class="logo">
                        <i class="fas fa-book-open"></i>
                        <h1>Public Domain <span>Explorer</span></h1>
                    </div>
                    <ul class="nav-links">
                        <li><a href="#"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="#search"><i class="fas fa-search"></i> Search</a></li>
                        <li><a href="#favorites"><i class="fas fa-heart"></i> Favorites</a></li>
                    </ul>
                </nav>
            </header>

            <section class="hero">
                <div class="hero-content">
                    <h1>Discover Public Domain Treasures</h1>
                    <p>Search millions of free images, texts, and audio from Wikimedia Commons and Internet Archive</p>
                    
                    <div class="search-container" id="search">
                        <div class="search-box">
                            <input type="text" 
                                   class="search-input" 
                                   placeholder="Search for images, texts, or audio..." 
                                   value="${this.state.query}">
                            <button class="search-btn">
                                <i class="fas fa-search"></i> Search
                            </button>
                        </div>
                        <div class="quick-filters">
                            <button class="filter-btn ${this.state.filters.type === 'all' ? 'active' : ''}" data-type="all">All</button>
                            <button class="filter-btn ${this.state.filters.type === 'image' ? 'active' : ''}" data-type="image">Images</button>
                            <button class="filter-btn ${this.state.filters.type === 'text' ? 'active' : ''}" data-type="text">Texts</button>
                            <button class="filter-btn ${this.state.filters.type === 'audio' ? 'active' : ''}" data-type="audio">Audio</button>
                        </div>
                    </div>
                </div>
            </section>

            <main class="main-container">
                <div class="content-wrapper">
                    <aside class="filters">
                        <h2><i class="fas fa-filter"></i> Filters</h2>
                        
                        <div class="filter-group">
                            <h3>Source</h3>
                            <label class="checkbox-label">
                                <input type="checkbox" class="source-filter" data-source="wikimedia" ${this.state.filters.sources.wikimedia ? 'checked' : ''}>
                                Wikimedia Commons
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" class="source-filter" data-source="archive" ${this.state.filters.sources.archive ? 'checked' : ''}>
                                Internet Archive
                            </label>
                        </div>

                        <div class="filter-group">
                            <h3>Year Range</h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="number" class="year-input" data-type="from" placeholder="From" value="${this.state.filters.yearFrom}" min="1500" max="2024">
                                <span>to</span>
                                <input type="number" class="year-input" data-type="to" placeholder="To" value="${this.state.filters.yearTo}" min="1500" max="2024">
                            </div>
                        </div>

                        <div class="filter-group">
                            <h3>License</h3>
                            <select class="license-select">
                                <option value="all" ${this.state.filters.license === 'all' ? 'selected' : ''}>All Licenses</option>
                                <option value="publicdomain" ${this.state.filters.license === 'publicdomain' ? 'selected' : ''}>Public Domain</option>
                                <option value="cc" ${this.state.filters.license === 'cc' ? 'selected' : ''}>Creative Commons</option>
                            </select>
                        </div>

                        <button class="btn btn-primary apply-filters" style="width: 100%; margin-top: 20px;">
                            <i class="fas fa-check"></i> Apply Filters
                        </button>
                    </aside>

                    <section class="results-section">
                        <div class="results-header">
                            <div class="view-toggle">
                                <button class="view-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" data-view="grid">
                                    <i class="fas fa-th"></i> Grid
                                </button>
                                <button class="view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" data-view="list">
                                    <i class="fas fa-list"></i> List
                                </button>
                            </div>
                            <div class="results-count">
                                <span id="total-results">${this.state.results.length} results</span>
                            </div>
                        </div>

                        <div class="results-container">
                            <div class="loading" style="display: none;">
                                <div class="spinner"></div>
                                <p>Searching archives...</p>
                            </div>

                            <div class="no-results" style="display: none;">
                                <i class="fas fa-search fa-3x"></i>
                                <h3>No results found</h3>
                                <p>Try different search terms</p>
                            </div>

                            <div class="results-grid ${this.state.viewMode}-view" id="results-grid">
                                ${this.renderResults()}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>Public Domain Explorer</h3>
                        <p>WDD 330 Final Project</p>
                    </div>
                    <div class="footer-section">
                        <h3>Data Sources</h3>
                        <p>Wikimedia Commons & Internet Archive</p>
                    </div>
                </div>
            </footer>

            <div class="modal" id="detail-modal">
                <div class="modal-content">
                    <button class="close-modal">&times;</button>
                    <div id="modal-body"></div>
                </div>
            </div>
        `;
    }

    renderResults() {
        if (!this.state.results.length) {
            return '<div class="no-results">Enter a search term to begin</div>';
        }

        return this.state.results.map(item => `
            <div class="result-card" data-id="${item.id}">
                <div class="result-image">
                    ${item.thumbnail ? 
                        `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">` :
                        `<div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                            <i class="fas fa-${item.type === 'audio' ? 'music' : 'file'} fa-3x"></i>
                        </div>`
                    }
                </div>
                <div class="result-content">
                    <h3 class="result-title">${this.escapeHtml(item.title)}</h3>
                    <div class="result-meta">
                        <p><i class="fas fa-user"></i> ${item.author || 'Unknown'}</p>
                        <p><i class="fas fa-calendar"></i> ${item.year || 'Unknown'}</p>
                        <p><i class="fas fa-database"></i> ${item.source}</p>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-primary view-detail" data-id="${item.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary favorite-btn ${this.storage.isFavorite(item.id) ? 'active' : ''}" data-id="${item.id}">
                            <i class="fas fa-heart"></i> ${this.storage.isFavorite(item.id) ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    bindEvents() {
        // Search
        document.querySelector('.search-btn').addEventListener('click', () => this.handleSearch());
        document.querySelector('.search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Quick filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.filters.type = e.target.dataset.type;
                if (this.state.query) this.handleSearch();
            });
        });

        // Source filters
        document.querySelectorAll('.source-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.state.filters.sources[e.target.dataset.source] = e.target.checked;
            });
        });

        // Year filters
        document.querySelectorAll('.year-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.state.filters[e.target.dataset.type === 'from' ? 'yearFrom' : 'yearTo'] = e.target.value;
            });
        });

        // License filter
        document.querySelector('.license-select').addEventListener('change', (e) => {
            this.state.filters.license = e.target.value;
        });

        // Apply filters
        document.querySelector('.apply-filters').addEventListener('click', () => {
            if (this.state.query) this.handleSearch();
        });

        // View mode
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.viewMode = e.target.dataset.view;
                document.getElementById('results-grid').className = `results-grid ${this.state.viewMode}-view`;
            });
        });

        // Result actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-detail')) {
                const itemId = e.target.closest('.view-detail').dataset.id;
                this.showItemDetails(itemId);
            }
            
            if (e.target.closest('.favorite-btn')) {
                const itemId = e.target.closest('.favorite-btn').dataset.id;
                this.toggleFavorite(itemId);
            }
        });

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('detail-modal').classList.remove('active');
        });

        document.getElementById('detail-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('detail-modal')) {
                document.getElementById('detail-modal').classList.remove('active');
            }
        });
    }

    async handleSearch() {
        const query = document.querySelector('.search-input').value.trim();
        if (!query) {
            this.showToast('Please enter a search term', 'error');
            return;
        }

        this.state.query = query;
        this.state.loading = true;
        this.showLoading();

        try {
            const results = await this.api.search(query, this.state.filters);
            this.state.results = results;
            this.updateResults();
            this.storage.saveSearch(query);
            
        } catch (error) {
            this.showToast('Search failed. Please try again.', 'error');
            console.error('Search error:', error);
            
        } finally {
            this.state.loading = false;
            this.hideLoading();
        }
    }

    updateResults() {
        const resultsGrid = document.getElementById('results-grid');
        const totalResults = document.getElementById('total-results');
        
        if (resultsGrid) {
            resultsGrid.innerHTML = this.renderResults();
            totalResults.textContent = `${this.state.results.length} results`;
        }
    }

    showLoading() {
        const loading = document.querySelector('.loading');
        const noResults = document.querySelector('.no-results');
        if (loading) loading.style.display = 'block';
        if (noResults) noResults.style.display = 'none';
    }

    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.style.display = 'none';
    }

    async showItemDetails(itemId) {
        const item = this.state.results.find(r => r.id === itemId);
        if (!item) return;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div style="padding: 2rem;">
                <h2 style="margin-bottom: 1rem;">${this.escapeHtml(item.title)}</h2>
                
                ${item.thumbnail ? 
                    `<img src="${item.thumbnail}" alt="${item.title}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;">` :
                    `<div style="text-align: center; padding: 2rem; background: #f0f0f0; border-radius: 8px; margin-bottom: 1rem;">
                        <i class="fas fa-${item.type === 'audio' ? 'music' : 'file'} fa-4x"></i>
                    </div>`
                }
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div>
                        <strong><i class="fas fa-user"></i> Author:</strong>
                        <p>${item.author || 'Unknown'}</p>
                    </div>
                    <div>
                        <strong><i class="fas fa-calendar"></i> Year:</strong>
                        <p>${item.year || 'Unknown'}</p>
                    </div>
                    <div>
                        <strong><i class="fas fa-database"></i> Source:</strong>
                        <p>${item.source}</p>
                    </div>
                    <div>
                        <strong><i class="fas fa-copyright"></i> License:</strong>
                        <p>${item.license || 'Public Domain'}</p>
                    </div>
                </div>
                
                ${item.description ? `
                    <div style="margin-bottom: 2rem;">
                        <h3>Description</h3>
                        <p>${item.description}</p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem;">
                    <a href="${item.url}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> View Source
                    </a>
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${item.url}')">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                </div>
            </div>
        `;

        document.getElementById('detail-modal').classList.add('active');
    }

    toggleFavorite(itemId) {
        const item = this.state.results.find(r => r.id === itemId);
        if (!item) return;

        if (this.storage.isFavorite(itemId)) {
            this.storage.removeFavorite(itemId);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.storage.addFavorite(item);
            this.showToast('Added to favorites', 'success');
        }

        this.updateFavoriteButton(itemId);
    }

    updateFavoriteButton(itemId) {
        const isFavorite = this.storage.isFavorite(itemId);
        const button = document.querySelector(`.favorite-btn[data-id="${itemId}"]`);
        if (button) {
            button.classList.toggle('active', isFavorite);
            button.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite ? 'Saved' : 'Save'}`;
        }
    }

    loadFavorites() {
        const favorites = this.storage.getFavorites();
        console.log('Loaded favorites:', favorites.length);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#E74C3C' : '#3498DB'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default App;