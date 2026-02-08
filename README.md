# Public Domain Explorer

A modern web application for discovering and exploring public domain media from Wikimedia Commons and Internet Archive.

## Features

- **Dual API Integration**: Search both Wikimedia Commons and Internet Archive simultaneously
- **Advanced Filtering**: Filter by media type, source, year range, and license
- **Responsive Design**: Works on all devices from mobile to desktop
- **Favorites System**: Save items to localStorage for later access
- **Detailed Views**: Modal popups with complete metadata and download options
- **Pagination**: Navigate through large result sets efficiently
- **Dark/Light Mode**: Automatic theme switching based on time of day
- **Offline Support**: Basic functionality works without internet connection

## Technologies Used

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern Flexbox/Grid layout with CSS variables
- **JavaScript ES6+**: Modular classes with async/await
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Open Sans typography
- **LocalStorage**: Client-side data persistence
- **Service Workers**: Offline functionality and caching

## APIs Used

1. **Wikimedia Commons API**
   - Images and media files
   - Rich metadata including author, date, license
   - High-quality thumbnails and downloads

2. **Internet Archive API**
   - Texts and audio files
   - Historical documents and recordings
   - Multiple format downloads

## Project Structure
wdd-330-project/
├── index.html # Main HTML file
├── style.css # All styles
├── app.js # Main application logic
├── api.js # API communication
├── ui.js # User interface management
├── storage.js # LocalStorage operations
├── README.md # This file
└── assets/
├── favicon.ico # Browser icon
├── logo.svg # Application logo
├── placeholder.jpg # Fallback image
└── audio-icon.png # Audio placeholder