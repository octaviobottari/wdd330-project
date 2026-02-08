class APIManager {
    constructor() {
        this.WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
        this.ARCHIVE_API = 'https://archive.org/advancedsearch.php';
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000;
    }

    async search(query, filters = {}, page = 1, perPage = 20) {
        try {
            const cacheKey = JSON.stringify({ query, filters, page });
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
                console.log('Using cached data for:', query);
                return cached.data;
            }

            const [wikimediaResults, archiveResults] = await Promise.all([
                this.searchWikimedia(query, filters, page, perPage),
                this.searchArchive(query, filters, page, perPage)
            ]);

            const results = this.mergeAndFormatResults(wikimediaResults, archiveResults, filters);
            const paginatedResults = this.paginate(results, page, perPage);

            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: paginatedResults
            });

            return paginatedResults;
        } catch (error) {
            console.error('Search error:', error);
            throw new Error('Error searching content. Please try again.');
        }
    }

    async searchWikimedia(query, filters, page, perPage) {
        if (!filters.source.wikimedia) return [];

        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrsearch: query,
            gsrnamespace: '6',
            gsrlimit: perPage,
            gsroffset: (page - 1) * perPage,
            prop: 'imageinfo|pageterms',
            iiprop: 'url|size|mime|extmetadata',
            iiurlwidth: '300',
            iiextmetadatamultilang: '1',
            wbptterms: 'label',
            format: 'json',
            origin: '*'
        });

        try {
            const response = await fetch(`${this.WIKIMEDIA_API}?${params}`);
            if (!response.ok) throw new Error('Wikimedia API error');
            
            const data = await response.json();
            return this.formatWikimediaResults(data);
        } catch (error) {
            console.error('Wikimedia API error:', error);
            return [];
        }
    }

    async searchArchive(query, filters, page, perPage) {
        if (!filters.source.archive) return [];

        const params = new URLSearchParams({
            q: `(${query}) AND mediatype:(texts OR audio)`,
            fl: 'identifier,title,creator,year,date,description,subject,downloads,licenseurl,mediatype',
            rows: perPage,
            page: page,
            output: 'json',
            sort: 'downloads desc'
        });

        try {
            const response = await fetch(`${this.ARCHIVE_API}?${params}`);
            if (!response.ok) throw new Error('Archive API error');
            
            const data = await response.json();
            return this.formatArchiveResults(data);
        } catch (error) {
            console.error('Archive API error:', error);
            return [];
        }
    }

    formatWikimediaResults(data) {
        if (!data.query || !data.query.pages) return [];
        
        return Object.values(data.query.pages).map(page => {
            const imageInfo = page.imageinfo?.[0] || {};
            const extmetadata = imageInfo.extmetadata || {};
            
            return {
                id: `wiki_${page.pageid}`,
                title: page.title?.replace(/^File:/, '') || 'Untitled',
                description: extmetadata.ImageDescription?.value || 
                            extmetadata.ObjectName?.value || 
                            'No description available',
                source: 'Wikimedia Commons',
                type: 'image',
                thumbnail: imageInfo.thumburl || imageInfo.url,
                url: imageInfo.url,
                author: extmetadata.Artist?.value || 'Unknown',
                year: extmetadata.DateTimeOriginal?.value?.substring(0, 4) || 
                      extmetadata.DateTime?.value?.substring(0, 4) || 
                      'Unknown',
                license: extmetadata.LicenseShortName?.value || 
                        extmetadata.License?.value || 
                        'Public Domain',
                size: imageInfo.size ? `${Math.round(imageInfo.size / 1024)} KB` : 'Unknown',
                dimensions: imageInfo.width && imageInfo.height ? 
                           `${imageInfo.width}x${imageInfo.height}` : 'Unknown'
            };
        });
    }

    formatArchiveResults(data) {
        if (!data.response || !data.response.docs) return [];
        
        return data.response.docs.map(item => {
            const type = item.mediatype === 'audio' ? 'audio' : 'text';
            
            return {
                id: `archive_${item.identifier}`,
                title: item.title || 'Untitled',
                description: item.description?.[0] || item.subject?.[0] || 'No description available',
                source: 'Internet Archive',
                type: type,
                thumbnail: type === 'text' ? 
                          `https://archive.org/services/img/${item.identifier}` : 
                          'assets/audio-icon.png',
                url: `https://archive.org/details/${item.identifier}`,
                author: item.creator?.[0] || 'Unknown',
                year: item.year || item.date?.substring(0, 4) || 'Unknown',
                license: item.licenseurl || 'Public Domain',
                downloads: item.downloads || 0,
                identifier: item.identifier
            };
        });
    }

    mergeAndFormatResults(wikimediaResults, archiveResults, filters) {
        let allResults = [...wikimediaResults, ...archiveResults];
        
        if (filters.type !== 'all') {
            allResults = allResults.filter(item => item.type === filters.type);
        }
        
        if (filters.yearFrom) {
            allResults = allResults.filter(item => {
                const year = parseInt(item.year);
                return !isNaN(year) && year >= parseInt(filters.yearFrom);
            });
        }
        
        if (filters.yearTo) {
            allResults = allResults.filter(item => {
                const year = parseInt(item.year);
                return !isNaN(year) && year <= parseInt(filters.yearTo);
            });
        }
        
        if (filters.license !== 'all') {
            allResults = allResults.filter(item => {
                if (filters.license === 'publicdomain') {
                    return item.license.toLowerCase().includes('public domain');
                } else if (filters.license === 'cc') {
                    return item.license.toLowerCase().includes('creative commons');
                }
                return true;
            });
        }
        
        return allResults;
    }

    paginate(results, page, perPage) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginated = results.slice(start, end);
        
        return {
            items: paginated,
            total: results.length,
            page: page,
            totalPages: Math.ceil(results.length / perPage),
            hasNext: end < results.length,
            hasPrev: page > 1
        };
    }

    async getItemDetails(id) {
        if (id.startsWith('wiki_')) {
            return this.getWikimediaDetails(id);
        } else if (id.startsWith('archive_')) {
            return this.getArchiveDetails(id);
        }
        return null;
    }

    async getWikimediaDetails(id) {
        const pageId = id.replace('wiki_', '');
        const params = new URLSearchParams({
            action: 'query',
            pageids: pageId,
            prop: 'imageinfo|pageterms',
            iiprop: 'url|size|mime|extmetadata|user|parsedcomment',
            iiextmetadatamultilang: '1',
            format: 'json',
            origin: '*'
        });

        try {
            const response = await fetch(`${this.WIKIMEDIA_API}?${params}`);
            const data = await response.json();
            return data.query?.pages?.[pageId] || null;
        } catch (error) {
            console.error('Error getting Wikimedia details:', error);
            return null;
        }
    }

    async getArchiveDetails(id) {
        const identifier = id.replace('archive_', '');
        const response = await fetch(`https://archive.org/metadata/${identifier}`);
        const data = await response.json();
        return data;
    }

    clearCache() {
        this.cache.clear();
    }
}

const apiManager = new APIManager();