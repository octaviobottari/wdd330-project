class App {
    constructor() {
        this.currentPage = 1;
        this.currentQuery = '';
        this.currentFilters = {
            type: 'all',
            source: {
                wikimedia: true,
                archive: true
            },
            yearFrom: '',
            yearTo: '',
            license: 'all'
        };
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadInitialData();
        this.checkURLParams();
    }

    cacheElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        this.resetFiltersBtn = document.getElementById('reset-filters');
        this.filterWikimedia = document.getElementById('filter-wikimedia');
        this.filterArchive = document.getElementById('filter-archive');
        this.yearFrom = document.getElementById('year-from');
        this.yearTo = document.getElementById('year-to');
        this.licenseFilter = document.getElementById('license-filter');
        this.sortBy = document.getElementById('sort-by');
        this.showFavorites = document.getElementById('show-favorites');
        this.clearStorage = document.getElementById('clear-storage');
        this.prevPage = document.getElementById('prev-page');
        this.nextPage = document.getElementById('next-page');
        this.navToggle = document.querySelector('.nav-toggle');
        this.navLinks = document.querySelector('.nav-links');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.type = e.target.dataset.type;
                if (this.currentQuery) this.performSearch();
            });
        });

        this.applyFiltersBtn.addEventListener('click', () => {
            this.updateFilters();
            if (this.currentQuery) this.performSearch();
        });

        this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());

        this.sortBy.addEventListener('change', () => {
            if (this.currentResults) this.sortResults();
        });

        this.showFavorites.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFavoritesView();
        });

        this.clearStorage.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Clear all saved data (favorites, history, settings)?')) {
                storageManager.clearAllData();
                uiManager.showToast('All data cleared', 'info');
            }
        });

        this.navToggle.addEventListener('click', () => {
            this.navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    this.navLinks.classList.remove('active');
                }
            });
        });

        window.addEventListener('pageChange', (e) => {
            this.currentPage = e.detail.page;
            this.performSearch();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && window.innerWidth <= 768) {
                this.navLinks.classList.remove('active');
            }
        });
    }

    loadInitialData() {
        const settings = storageManager.getSettings();
        
        if (settings.defaultView) {
            uiManager.switchView(settings.defaultView);
        }
        
        if (settings.itemsPerPage) {
            this.itemsPerPage = settings.itemsPerPage;
        }
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item');
        const query = urlParams.get('q');
        
        if (query) {
            this.searchInput.value = query;
            this.currentQuery = query;
            this.performSearch();
        } else if (itemId) {
            uiManager.showItemDetails(itemId);
        }
    }

    updateFilters() {
        this.currentFilters.source = {
            wikimedia: this.filterWikimedia.checked,
            archive: this.filterArchive.checked
        };
        
        this.currentFilters.yearFrom = this.yearFrom.value;
        this.currentFilters.yearTo = this.yearTo.value;
        this.currentFilters.license = this.licenseFilter.value;
    }

    resetFilters() {
        this.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'all') btn.classList.add('active');
        });
        
        this.filterWikimedia.checked = true;
        this.filterArchive.checked = true;
        this.yearFrom.value = '';
        this.yearTo.value = '';
        this.licenseFilter.value = 'all';
        this.sortBy.value = 'relevance';
        
        this.currentFilters = {
            type: 'all',
            source: {
                wikimedia: true,
                archive: true
            },
            yearFrom: '',
            yearTo: '',
            license: 'all'
        };
        
        if (this.currentQuery) this.performSearch();
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            uiManager.showToast('Please enter a search term', 'error');
            return;
        }
        
        this.currentQuery = query;
        this.currentPage = 1;
        
        storageManager.addToSearchHistory(query);
        uiManager.showLoading();
        
        try {
            const results = await apiManager.search(
                query, 
                this.currentFilters, 
                this.currentPage, 
                this.itemsPerPage
            );
            
            this.currentResults = results;
            
            if (results.items.length === 0) {
                uiManager.showNoResults();
            } else {
                uiManager.renderResults(results);
            }
            
            this.updateURL();
            
        } catch (error) {
            console.error('Search failed:', error);
            uiManager.showError('Search failed. Please try again.');
            uiManager.showNoResults();
        }
    }

    sortResults() {
        const sortBy = this.sortBy.value;
        
        if (!this.currentResults || !this.currentResults.items) return;
        
        const sortedItems = [...this.currentResults.items];
        
        switch (sortBy) {
            case 'newest':
                sortedItems.sort((a, b) => {
                    const yearA = parseInt(a.year) || 0;
                    const yearB = parseInt(b.year) || 0;
                    return yearB - yearA;
                });
                break;
                
            case 'oldest':
                sortedItems.sort((a, b) => {
                    const yearA = parseInt(a.year) || 9999;
                    const yearB = parseInt(b.year) || 9999;
                    return yearA - yearB;
                });
                break;
                
            case 'title':
                sortedItems.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                break;
                
            case 'relevance':
            default:
                break;
        }
        
        uiManager.renderResults({
            ...this.currentResults,
            items: sortedItems
        });
    }

    showFavoritesView() {
        const favorites = storageManager.getFavorites();
        
        if (favorites.length === 0) {
            uiManager.showToast('No favorites saved yet', 'info');
            return;
        }
        
        uiManager.renderResults({
            items: favorites,
            total: favorites.length,
            page: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
        });
        
        uiManager.showSuccess(`Showing ${favorites.length} favorites`);
    }

    updateURL() {
        const url = new URL(window.location);
        
        if (this.currentQuery) {
            url.searchParams.set('q', this.currentQuery);
        } else {
            url.searchParams.delete('q');
        }
        
        url.searchParams.set('page', this.currentPage);
        
        window.history.pushState({}, '', url);
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered:', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }

    initOfflineSupport() {
        if (!navigator.onLine) {
            uiManager.showToast('You are offline. Some features may be limited.', 'info');
        }
        
        window.addEventListener('online', () => {
            uiManager.showToast('You are back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            uiManager.showToast('You are offline. Some features may be limited.', 'info');
        });
    }

    setupErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            uiManager.showError('An unexpected error occurred');
        });
        
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            uiManager.showError('An unexpected error occurred');
        });
    }

    setupAnalytics() {
        const trackEvent = (category, action, label) => {
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    'event_category': category,
                    'event_label': label
                });
            }
        };
        
        this.searchBtn.addEventListener('click', () => {
            trackEvent('search', 'perform', this.searchInput.value);
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn.favorite')) {
                trackEvent('favorites', 'toggle', 'favorite_button');
            }
            
            if (e.target.closest('.action-btn.view')) {
                trackEvent('engagement', 'view_details', 'view_button');
            }
        });
    }

    start() {
        this.setupServiceWorker();
        this.initOfflineSupport();
        this.setupErrorHandling();
        this.setupAnalytics();
        
        console.log('Public Domain Explorer started successfully');
        
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 18 || hour < 6) {
            document.body.classList.add('dark-mode');
        }
    }
}

const app = new App();
window.addEventListener('DOMContentLoaded', () => app.start());