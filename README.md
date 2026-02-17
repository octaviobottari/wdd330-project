Public Domain Media Explorer
A modern web application for discovering and exploring public domain media from Wikimedia Commons and Internet Archive. Search millions of free images, audio recordings, and texts - all in one place.

Features
Core Functionality
Unified Search: Single interface to search both Wikimedia Commons and Internet Archive simultaneously

Media Type Filtering: Filter results by images, audio, or text

Responsive Design: Perfectly usable on mobile, tablet, and desktop

Favorites System: Save items to localStorage for quick access later

Detail Modal: View complete metadata (author, date, source, license) in a modal window

Grid/List Views: Toggle between visual grid and detailed list views

Pagination: Navigate through large result sets efficiently

Download Links: Direct access to media files for offline use

Technical Features
Dual API Integration: Seamlessly combines results from two different APIs

LocalStorage Persistence: Favorites survive browser refreshes

Fast Performance: Lazy loading images and optimized rendering

Clean UI: Intuitive interface with smooth transitions

Error Handling: Graceful fallbacks when APIs are unavailable

Loading States: Visual feedback during searches

Technologies Used
Frontend
HTML5: Semantic markup with accessibility features

CSS3: Modern Flexbox/Grid layout with CSS variables

JavaScript ES6+: Modular classes with async/await patterns

Font Awesome: Icon library for UI elements

Google Fonts: Open Sans typography

Storage
LocalStorage: Client-side data persistence for favorites

Build Tools
Vite: Next-generation frontend tooling for fast development

NPM: Package management

APIs Used
1. Wikimedia Commons API
Provides access to millions of freely licensed images and media files.

Endpoints Used: w/api.php with action=query

Data Retrieved:

Images with thumbnails

Author information

Creation dates

License details

Description texts

2. Internet Archive API
Access to texts, audio recordings, and historical documents.

Endpoints Used: advancedsearch.php

Data Retrieved:

Texts and eBooks

Audio recordings and music

Creator information

Publication years

Download links

Project Structure
text
wdd-330-project/
├── index.html                 # Main HTML entry point
├── package.json               # NPM dependencies and scripts
├── vite.config.js             # Vite configuration
├── README.md                  # Project documentation
│
├── src/                       # Source code directory
│   ├── main.js                # Application entry point
│   ├── style.css              # Global styles
│   │
│   ├── api/                   
│   │   └── apiService.js      # API communication module
│   │
│   ├── storage/               
│   │   └── StorageService.js  # LocalStorage operations
│   │
│   └── ui/                    
│       └── uiRenderer.js       # UI rendering functions
│
└── assets/                     # Static assets
    ├── favicon.ico             # Browser icon
    ├── placeholder.jpg         # Fallback image
    └── audio-icon.png          # Audio placeholder
File-by-File Explanation
index.html
The main HTML file that structures the entire application. Contains:

Header with navigation and logo

Search section with input and media type filters

Main content area with sidebar filters and results grid

Favorites section (hidden by default)

Modal for detailed item views

Footer with attribution

Script tag pointing to src/main.js

src/main.js
The application's entry point and main controller. Contains the App class which:

Initializes the application

Manages application state (current results, pagination)

Handles user events (search, view toggle, navigation)

Coordinates between API, storage, and UI modules

Implements pagination logic

Manages error states and user messages

src/style.css
Global styles using CSS variables for theming. Features:

Responsive design with media queries

Grid and list view layouts

Modal animations

Mobile-first approach

Consistent color scheme based on project specifications

src/api/apiService.js
Handles all external API communication. Key functions:

searchMedia(): Coordinates searches across both APIs

searchWikimedia(): Queries Wikimedia Commons for images

searchInternetArchive(): Queries Internet Archive for texts and audio

Includes timeout handling and error recovery

Transforms API responses into uniform format

src/storage/StorageService.js
Manages localStorage for favorites functionality. Provides:

getFavorites(): Retrieve saved favorites

saveFavorite(): Add item to favorites with duplicate checking

removeFavorite(): Remove item from favorites

isFavorite(): Check if item is favorited

clearFavorites(): Remove all favorites

Includes error handling and size limits

src/ui/uiRenderer.js
Handles all DOM manipulation for displaying content. Features:

renderResults(): Creates HTML for search results or favorites

createMediaCard(): Generates individual result cards

renderModal(): Creates detailed modal view

Attaches event listeners to dynamically created elements

Handles favorite button toggling within results

Installation & Setup
Prerequisites
Node.js (v14 or higher)

npm (v6 or higher)

Installation Steps
Clone the repository

bash
git clone https://github.com/yourusername/wdd-330-project.git
cd wdd-330-project
Install dependencies

bash
npm install
Run development server

bash
npm run dev
Build for production

bash
npm run build
Preview production build

bash
npm run preview
Usage Guide
Searching for Media
Enter a search term in the search box

Select media types (Images, Audio, Texts)

Click Search or press Enter

Browse results in grid or list view

Click on any item to see details

Filtering Results
Use sidebar filters to narrow by source

Toggle between grid and list views

Sort results by relevance or year

Navigate through pages with pagination

Managing Favorites
Click the heart icon on any result to save

Access saved items from the Favorites link

Click heart again to remove from favorites

Favorites persist between sessions

Viewing Details
Click any result card to open detailed modal

View complete metadata and description

Access direct download links

Copy shareable links

Visit original source

Browser Support
Chrome (latest)

Firefox (latest)

Safari (latest)

Edge (latest)

Mobile browsers (iOS Safari, Android Chrome)

Performance Optimizations
Lazy Loading: Images load only when visible

Debounced Search: Prevents excessive API calls

Caching: API responses cached in memory

Pagination: Limits results per page

Error Boundaries: Graceful degradation

Timeout Handling: Prevents hanging requests

Known Limitations
API rate limits may affect search results

Some Internet Archive items may have incomplete metadata

Audio preview requires external player

Offline mode requires initial caching

Future Enhancements
Advanced search operators

User accounts with cloud favorites

More API integrations

Audio waveform previews

Text preview with search highlighting

Social sharing features

Keyboard shortcuts

Dark mode toggle

Contributing
Fork the repository

Create a feature branch

Commit your changes

Push to the branch

Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Wikimedia Commons for providing free media content

Internet Archive for preserving digital culture

Font Awesome for the beautiful icons

Google Fonts for Open Sans typography

