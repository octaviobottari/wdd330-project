// src/main.js
import { searchMedia } from './api/apiService.js';
import { renderResults, renderModal, setupEventListeners } from './ui/uiRenderer.js';
import { saveFavorite, getFavorites, removeFavorite } from './storage/StorageService.js';

class App {
    constructor() {
        this.currentResults = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
    }

    init() {
        console.log('🚀 App iniciada correctamente');
        this.setupEventListeners();
        this.loadFavorites();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Search
        const searchBtn = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // View toggle
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        
        if (gridView) {
            gridView.addEventListener('click', () => this.toggleView('grid'));
        }
        
        if (listView) {
            listView.addEventListener('click', () => this.toggleView('list'));
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Click outside modal to close
        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortResults(e.target.value);
            });
        }
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        if (menuToggle && mobileNav) {
            menuToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('hidden');
            });

            // Close mobile nav when clicking a link
            mobileNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.add('hidden');
                });
            });
        }
    }

    async handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        if (!query) {
            this.showMessage('Please enter a search term', 'warning');
            return;
        }

        // Show loading
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading-spinner" style="text-align: center; padding: 3rem;">
                    <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 1rem;">Searching archives...</p>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
        }

        try {
            const mediaTypes = Array.from(document.querySelectorAll('input[name="mediaType"]:checked'))
                .map(cb => cb.value);
            
            if (mediaTypes.length === 0) {
                this.showMessage('Please select at least one media type', 'warning');
                return;
            }
            
            console.log('🔍 Searching for:', query, 'Types:', mediaTypes);
            
            const results = await searchMedia(query, mediaTypes);
            console.log('📦 Results:', results.length);
            
            this.currentResults = results;
            this.currentPage = 1;
            
            // Update results count
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.textContent = `${results.length} results`;
            }
            
            // Render results
            this.renderCurrentPage();
            this.renderPagination();
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showMessage('Search failed. Please try again.', 'error');
        }
    }

    renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageResults = this.currentResults.slice(startIndex, endIndex);
        
        renderResults(pageResults);
        
        // Update results count if needed
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `${this.currentResults.length} results`;
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);
        const paginationDiv = document.getElementById('pagination');
        
        if (!paginationDiv) return;
        
        if (totalPages <= 1) {
            paginationDiv.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls" style="display: flex; justify-content: center; gap: 0.5rem; margin: 2rem 0;">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="page-btn" data-page="${this.currentPage - 1}" style="padding: 0.5rem 1rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Previous</button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1" style="padding: 0.5rem 1rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">1</button>`;
            if (startPage > 2) {
                html += `<span style="padding: 0.5rem 1rem;">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                html += `<span class="current-page" style="padding: 0.5rem 1rem; background: #3498db; color: white; border: 1px solid #3498db; border-radius: 4px;">${i}</span>`;
            } else {
                html += `<button class="page-btn" data-page="${i}" style="padding: 0.5rem 1rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">${i}</button>`;
            }
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span style="padding: 0.5rem 1rem;">...</span>`;
            }
            html += `<button class="page-btn" data-page="${totalPages}" style="padding: 0.5rem 1rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">${totalPages}</button>`;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            html += `<button class="page-btn" data-page="${this.currentPage + 1}" style="padding: 0.5rem 1rem; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Next</button>`;
        }
        
        html += '</div>';
        paginationDiv.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderCurrentPage();
                this.renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    toggleView(viewType) {
        const container = document.getElementById('resultsContainer');
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        
        if (!container) return;
        
        if (viewType === 'grid') {
            container.className = 'results-container grid-view';
            if (gridBtn) {
                gridBtn.classList.add('active');
                gridBtn.style.background = '#3498db';
                gridBtn.style.color = 'white';
            }
            if (listBtn) {
                listBtn.classList.remove('active');
                listBtn.style.background = 'white';
                listBtn.style.color = '#333';
            }
        } else {
            container.className = 'results-container list-view';
            if (listBtn) {
                listBtn.classList.add('active');
                listBtn.style.background = '#3498db';
                listBtn.style.color = 'white';
            }
            if (gridBtn) {
                gridBtn.classList.remove('active');
                gridBtn.style.background = 'white';
                gridBtn.style.color = '#333';
            }
        }
    }

    sortResults(sortBy) {
        if (!this.currentResults.length) return;
        
        switch(sortBy) {
            case 'newest':
                this.currentResults.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'oldest':
                this.currentResults.sort((a, b) => (a.year || 0) - (b.year || 0));
                break;
            default: // relevance - keep original order
                break;
        }
        
        this.renderCurrentPage();
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('resultsContainer');
        if (!container) return;
        
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        
        container.innerHTML = `
            <div class="message-box" style="text-align: center; padding: 3rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}" style="font-size: 3rem; color: ${colors[type]};"></i>
                <p style="margin-top: 1rem; color: #666;">${message}</p>
            </div>
        `;
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        
        if (!target) return;
        
        // Hide all sections
        document.querySelectorAll('main > section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.querySelector(target);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // If favorites section, load favorites
        if (target === '#favorites') {
            this.loadAndShowFavorites();
        }
        
        // Close mobile menu
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav) {
            mobileNav.classList.add('hidden');
        }
    }

    loadFavorites() {
        const favorites = getFavorites();
        console.log('⭐ Favorites loaded:', favorites.length);
    }

    loadAndShowFavorites() {
        const favorites = getFavorites();
        const container = document.getElementById('favoritesContainer');
        
        if (!container) return;
        
        if (favorites.length === 0) {
            container.innerHTML = '<p class="empty-message" style="text-align: center; padding: 2rem; color: #666;">No favorites yet. Search and add some!</p>';
            return;
        }
        
        // Use the same render function but with favorites context
        renderResults(favorites, 'favorites');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    
    // For debugging
    window.app = app;
});