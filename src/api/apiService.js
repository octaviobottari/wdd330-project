// API endpoints
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const INTERNET_ARCHIVE_API = 'https://archive.org/advancedsearch.php';

export async function searchMedia(query, mediaTypes = ['image', 'audio', 'text']) {
    const promises = [];
    
    if (mediaTypes.includes('image')) {
        promises.push(searchWikimedia(query));
    }
    
    if (mediaTypes.includes('audio') || mediaTypes.includes('text')) {
        promises.push(searchInternetArchive(query, mediaTypes));
    }
    
    const results = await Promise.allSettled(promises);
    
    // Combine results
    let combinedResults = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            combinedResults = combinedResults.concat(result.value);
        }
    });
    
    return combinedResults;
}

async function searchWikimedia(query) {
    const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrnamespace: '6', // File namespace
        prop: 'imageinfo|pageterms',
        iiprop: 'url|dimensions|extmetadata',
        iiextmetadatafilter: 'DateTime|Categories|LicenseShortName|Artist|ImageDescription',
        format: 'json',
        origin: '*'
    });
    
    try {
        const response = await fetch(`${WIKIMEDIA_API}?${params}`);
        const data = await response.json();
        
        return Object.values(data.query?.pages || {}).map(page => ({
            id: `wiki_${page.pageid}`,
            title: page.title?.replace('File:', ''),
            type: 'image',
            source: 'Wikimedia Commons',
            thumbnail: page.imageinfo?.[0]?.thumburl,
            url: page.imageinfo?.[0]?.url,
            metadata: page.imageinfo?.[0]?.extmetadata
        }));
    } catch (error) {
        console.error('Wikimedia API error:', error);
        return [];
    }
}

async function searchInternetArchive(query, mediaTypes) {
    const fields = 'identifier,title,creator,year,description,mediatype,downloads';
    const mediatypeFilter = mediaTypes
        .filter(type => type !== 'image')
        .map(type => `mediatype:${type}`)
        .join(' OR ');
    
    const params = new URLSearchParams({
        q: `${query} AND (${mediatypeFilter})`,
        fl: fields,
        output: 'json',
        rows: '50'
    });
    
    try {
        const response = await fetch(`${INTERNET_ARCHIVE_API}?${params}`);
        const data = await response.json();
        
        return data.response?.docs?.map(item => ({
            id: `ia_${item.identifier}`,
            title: item.title,
            type: item.mediatype,
            source: 'Internet Archive',
            creator: item.creator,
            year: item.year,
            description: item.description,
            downloads: item.downloads?.map(dl => dl.link)
        })) || [];
    } catch (error) {
        console.error('Internet Archive API error:', error);
        return [];
    }
}