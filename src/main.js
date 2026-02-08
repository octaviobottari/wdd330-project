import { searchMedia } from './api/apiService.js';
import { renderResults, renderModal, setupEventListeners } from './ui/uiRenderer.js';
import { saveFavorite, getFavorites, removeFavorite } from '/storage/storageService.js';

class App {
    constructor() {
        this.currentResults = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFavorites();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchButton').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // View toggle
        document.getElementById('gridView').addEventListener('click', () => this.toggleView('grid'));
        document.getElementById('listView').addEventListener('click', () => this.toggleView('list'));

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        
        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        try {
            const mediaTypes = Array.from(document.querySelectorAll('input[name="mediaType"]:checked'))
                .map(cb => cb.value);
            
            const results = await searchMedia(query, mediaTypes);
            this.currentResults = results;
            this.currentPage = 1;
            this.renderPagination();
            this.renderCurrentPage();
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageResults = this.currentResults.slice(startIndex, endIndex);
        
        renderResults(pageResults, this.currentPage);
    }

    renderPagination() {
        const totalPages = Math.ceil(this.currentResults.length / this.itemsPerPage);
        if (totalPages <= 1) {
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        let html = `<div class="pagination-controls">`;
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button class="page-btn" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<span class="current-page">${i}</span>`;
            } else {
                html += `<button class="page-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            html += `<button class="page-btn" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        html += `</div>`;
        document.getElementById('pagination').innerHTML = html;
        
        // Add event listeners to page buttons
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderCurrentPage();
                this.renderPagination();
            });
        });
    }

    toggleView(viewType) {
        const container = document.getElementById('resultsContainer');
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        
        if (viewType === 'grid') {
            container.className = 'results-container grid-view';
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.className = 'results-container list-view';
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }

    showError(message) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        
        // Hide all sections
        document.querySelectorAll('main > section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        document.querySelector(target)?.classList.remove('hidden');
    }

    loadFavorites() {
        const favorites = getFavorites();
        // Render favorites if on favorites page
        if (window.location.hash === '#favorites') {
            this.renderFavorites(favorites);
        }
    }

    renderFavorites(favorites) {
        const container = document.getElementById('favoritesContainer');
        if (favorites.length === 0) {
            container.innerHTML = '<p class="empty-message">No favorites yet. Search and add some!</p>';
            return;
        }
        
        // Render favorites using the same renderResults function
        renderResults(favorites, 'favorites');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Export app instance for debugging
    window.app = app;
});