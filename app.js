console.log('Stop looking at me MEATBAG!');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                //console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                //console.error('Service Worker registration failed:', error);
            });

        // Fetch countries data
        fetchCountries();
    });
}

let countriesData = [];

function filterCountries() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filteredCountries = countriesData.filter(country =>
        country.name.common.toLowerCase().includes(searchTerm)
    );
    displayCountries(filteredCountries);
}

function fetchCountries() {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            countriesData = data;
            displayCountries(data);
        })
        .catch(error => {
            //console.error('Error fetching countries:', error);
        });
}

function displayCountries(countries) {
    //displayFavoriteStations(); // Display favorite stations first

    const renderCountries = () => {
        const countryList = document.querySelector('#country-list') || document.createElement('ul');
        countryList.id = 'country-list';
        countryList.innerHTML = ''; // Clear previous list

        // Sort countries to have favorites at the top
        countries.sort((a, b) => {
            const aFavorite = isCountryFavorite(a.cca2);
            const bFavorite = isCountryFavorite(b.cca2);
            if (aFavorite !== bFavorite) {
                return bFavorite - aFavorite;
            }
            return a.name.common.localeCompare(b.name.common); // Sort alphabetically if both are non-favorites
        });

        countries.forEach(country => {
            const listItem = document.createElement('li');
            const flag = country.flag;
            listItem.textContent = `${flag} ${country.name.common}`;

            // Add favorite button
            const favoriteButton = document.createElement('button');
            favoriteButton.textContent = '★';
            favoriteButton.style.color = isCountryFavorite(country.cca2) ? 'gold' : 'gray';
            favoriteButton.style.background = 'none';
            favoriteButton.style.border = 'none';
            favoriteButton.style.fontSize = '24px';
            favoriteButton.style.cursor = 'pointer';
            favoriteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleCountryFavorite(country.cca2);
                renderCountries(); // Re-render the list
            });

            listItem.appendChild(favoriteButton);

            listItem.addEventListener('click', () => {
                countryList.style.display = 'none';
                showRadioStations(country.cca2);
            });

            countryList.appendChild(listItem);
        });

        if (!document.querySelector('#country-list')) {
            document.body.appendChild(countryList);
        }
    };

    renderCountries();
}

function showRadioStations(countryCode) {
    // Create and style the back button
    const backButton = document.createElement('button');
    backButton.textContent = '←'; // Unicode for left arrow
    backButton.style.position = 'fixed';
    backButton.style.left = '10px';
    backButton.style.top = '10px';
    backButton.style.fontSize = '32px'; // Increase font size
    backButton.style.cursor = 'pointer';
    backButton.style.color = 'white'; // Set arrow color to white
    backButton.style.background = 'none'; // Remove background
    backButton.style.border = 'none'; // Remove border
    backButton.style.boxShadow = 'none'; // Remove shadow

    // Add event listener to reload the page
    backButton.addEventListener('click', () => {
        location.reload(); // Reload the page to reset to initial state
    });

    // Append the back button to the body
    document.body.appendChild(backButton);

    // Use the existing search bar
    const searchBar = document.getElementById('search');
    searchBar.placeholder = 'Search stations...';

    const stationsList =  document.querySelector('#stations-list') || document.createElement('ul');
    stationsList.id = 'stations-list';

    const existingStationsList = document.getElementById('stations-list');
    if (existingStationsList) {
        existingStationsListL = '';
    }

    if (!document.querySelector('#stations-list')) {
        document.body.appendChild(stationsList);
    }

    downloadRadiobrowserStationsByCountry(countryCode)
        .then(stations => {
            renderStations(stations);

            // Add search functionality to the existing search bar
            searchBar.addEventListener('input', () => {
                const query = searchBar.value.toLowerCase();
                const filteredStations = stations.filter(station =>
                    station.name.toLowerCase().includes(query)
                );
                renderStations(filteredStations);
            });
        })
        .catch(error => {
            const favoriteStations = getCookie('favoriteStations') || [];
            if (favoriteStations.length > 0) {
                const stations = favoriteStations.map(url => ({ name: 'Favorite Station', url }));
                renderStations(stations);
            }
        });

        function renderStations(stations) {
            stationsList.innerHTML = ''; // Clear previous list
        
            // Sort stations to have favorites at the top
            stations.sort((a, b) => {
                const aFavorite = isStationFavorite(a.url);
                const bFavorite = isStationFavorite(b.url);
                if (aFavorite !== bFavorite) {
                    return bFavorite - aFavorite;
                }
                return a.name.localeCompare(b.name); // Sort alphabetically if both are non-favorites
            });
        
            const seenStationNames = new Set(); // Track seen station names
        
            stations.forEach(station => {
                const stationNameLower = station.name.toLowerCase(); // Convert to lowercase for comparison
                if (!seenStationNames.has(stationNameLower)) {
                    seenStationNames.add(stationNameLower); // Add lowercase station name to the set
        
                    const stationItem = document.createElement('li');
                    stationItem.innerHTML = `<strong>${station.name}</strong>`;
                    stationItem.setAttribute('data-url', station.url);
        
                    // Add favorite button
                    const favoriteButton = document.createElement('button');
                    favoriteButton.textContent = '★';
                    favoriteButton.style.color = isStationFavorite(station.url) ? 'gold' : 'gray';
                    favoriteButton.style.background = 'none'; // Remove background
                    favoriteButton.style.border = 'none'; // Remove border
                    favoriteButton.style.fontSize = '24px'; // Increase font size
                    favoriteButton.style.cursor = 'pointer'; // Change cursor to pointer
                    favoriteButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent triggering station play
                        toggleStationFavorite(station.url, station.name);
                        renderStations(stations); // Re-render the list
                    });
        
                    stationItem.appendChild(favoriteButton);
        
                    stationItem.addEventListener('click', () => {
                        playStation(station.url, true, station.name);
                    });
        
                    stationsList.appendChild(stationItem);
                }
            });
        }
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a persistent volume slider
    const volumeControl = document.createElement('input');
    volumeControl.type = 'range';
    volumeControl.id = 'volume-control';
    volumeControl.min = 0;
    volumeControl.max = 1;
    volumeControl.step = 0.01;

    // Retrieve the saved volume level from localStorage
    const savedVolume = localStorage.getItem('audioVolume');
    volumeControl.value = savedVolume !== null ? savedVolume : 0.5; // Default to 0.5 if no saved volume

    // Create a play/pause button with SVG icons
    const playPauseButton = document.createElement('button');
    playPauseButton.id = 'play-pause-button';
    playPauseButton.style.display = 'none'; // Initially hide the button
    playPauseButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#000000" d="M6 19h4V5H6v14zM14 5v14h4V5h-4z"/>
        </svg>
    `; // Default to pause icon

    // Add the volume slider and play/pause button to the page
    const searchBar = document.getElementById('stationControlls');
    searchBar.parentNode.insertBefore(volumeControl, searchBar.nextSibling);
    searchBar.parentNode.insertBefore(playPauseButton, volumeControl.nextSibling);

    volumeControl.addEventListener('input', (event) => {
        const audio = document.getElementById('audio-player');
        if (audio) {
            audio.volume = event.target.value;
        }
        // Save the current volume level to localStorage
        localStorage.setItem('audioVolume', event.target.value);
    });

    playPauseButton.addEventListener('click', () => {
        const audio = document.getElementById('audio-player');
        if (audio) {
            if (audio.paused) {
                let existingAudio = document.getElementById('audio-player');
                if (existingAudio) {
                    existingAudio.pause();
                    existingAudio.src = '';
                    existingAudio.load();
                    existingAudio.parentNode.removeChild(existingAudio);
                    removeHighlightFromPlayingStation();
                }
                playStation(localStorage.getItem('audio-src'));
                
                playPauseButton.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M6 19h4V5H6v14zM14 5v14h4V5h-4z"/>
                    </svg>
                `; // Pause icon
            } else {
                let existingAudio = document.getElementById('audio-player');
                audio.pause()
                playPauseButton.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M8 5v14l11-7L8 5z"/>
                    </svg>
                `; // Play icon
            }
        }
    });
});

let fetchSongInterval; // Declare a variable to store the interval ID

function playStation(url, shouldHighlight = true, name) {
    // Remove existing audio element if it exists
    let existingAudio = document.getElementById('audio-player');
    if (existingAudio) {
        existingAudio.pause();
        existingAudio.src = '';
        existingAudio.load();
        existingAudio.parentNode.removeChild(existingAudio);
        removeHighlightFromPlayingStation();
        clearInterval(fetchSongInterval); // Clear the interval if it exists
    }

    // Create a new audio element
    const audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.controls = true;
    audio.crossOrigin = 'anonymous'; // Add crossorigin attribute

    // Style the audio element
    audio.style.position = 'fixed';
    audio.style.bottom = '10px';
    audio.style.left = '10px';
    audio.style.zIndex = '1000';

    // Set the audio volume to the current slider value
    const volumeControl = document.getElementById('volume-control');
    audio.volume = volumeControl.value;

    // Insert the new audio element after the search bar
    const searchBar = document.getElementById('search');
    searchBar.parentNode.insertBefore(audio, searchBar.nextSibling);

    // Check if the URL is an HLS stream
    if (url.endsWith('.m3u8')) {
        // Use Hls.js for HLS streams
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                audio.play();
            });
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            // For browsers that support HLS natively
            audio.src = url;
            audio.play();
        } else {
            console.error('HLS is not supported in this browser.');
        }
    } else {
        // Use existing functionality for non-HLS streams
        audio.src = url + '?nocache=' + new Date().getTime();
        audio.autoplay = true;
    }

    localStorage.setItem('audio-src', url);

    // Show the play/pause button when a station is playing
    const playPauseButton = document.getElementById('play-pause-button');
    playPauseButton.style.display = 'inline-block';

    // Update the play/pause icon based on the audio state
    audio.addEventListener('play', () => {
        playPauseButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#000000" d="M6 19h4V5H6v14zM14 5v14h4V5h-4z"/>
            </svg>
        `; // Pause icon

        // Fetch the current song title immediately
        fetchCurrentSong(url).then(songTitle => {
            const currentSongElement = document.getElementById('current-song');
            currentSongElement.textContent = `${name} playing: ${songTitle}`;
            currentSongElement.style.display = 'block';
        });

        // Start fetching the current song title every 15 seconds
        fetchSongInterval = setInterval(() => {
            fetchCurrentSong(url).then(songTitle => {
                const currentSongElement = document.getElementById('current-song');
                currentSongElement.textContent = `${name} playing: ${songTitle}`;
                currentSongElement.style.display = 'block';
            });
        }, 15000); // 15000 milliseconds = 15 seconds
    });

    audio.addEventListener('pause', () => {
        playPauseButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#000000" d="M8 5v14l11-7L8 5z"/>
            </svg>
        `; // Play icon

        clearInterval(fetchSongInterval); // Clear the interval when paused
    });

    // Highlight the station if required
    if (shouldHighlight) {
        highlightPlayingStation(url);
    }
}

function highlightPlayingStation(url) {
    // Remove highlight from any previously playing station
    removeHighlightFromPlayingStation();

    // Highlight the current station using data attribute
    const stationsList = document.getElementById('stations-list');
    const stationItems = stationsList.querySelectorAll('li');
    stationItems.forEach(item => {
        if (item.getAttribute('data-url') === url) {
            item.classList.add('playing');
        }
    });
}

function removeHighlightFromPlayingStation() {
    const previousPlaying = document.querySelector('.playing');
    if (previousPlaying) {
        previousPlaying.classList.remove('playing');
    }
}

function toggleCountryFavorite(countryCode) {
    let favorites = JSON.parse(localStorage.getItem('favoriteCountries')) || [];
    if (favorites.includes(countryCode)) {
        favorites = favorites.filter(code => code !== countryCode);
    } else {
        favorites.push(countryCode);
    }
    localStorage.setItem('favoriteCountries', JSON.stringify(favorites));
}

function isCountryFavorite(countryCode) {
    const favorites = JSON.parse(localStorage.getItem('favoriteCountries')) || [];
    return favorites.includes(countryCode);
}

function toggleStationFavorite(stationUrl, stationName) {
    let favorites = JSON.parse(localStorage.getItem('favoriteStations')) || [];
    const existingIndex = favorites.findIndex(station => station.url === stationUrl);

    if (existingIndex !== -1) {
        favorites.splice(existingIndex, 1); // Remove if already a favorite
    } else {
        favorites.push({ url: stationUrl, name: stationName || 'Unknown Station' }); // Add new favorite with a default name if undefined
    }

    localStorage.setItem('favoriteStations', JSON.stringify(favorites));
    setCookie('favoriteStations', JSON.stringify(favorites), 365); // Save to cookie for 1 year
}

function isStationFavorite(stationUrl) {
    const favorites = JSON.parse(localStorage.getItem('favoriteStations')) || [];
    return favorites.some(station => station.url === stationUrl);
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    // Add SameSite and Secure attributes
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/;SameSite=None;Secure";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return JSON.parse(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function displayFavoriteStations() {
    const favoriteStations = JSON.parse(getCookie('favoriteStations')) || [];
    let stationList = document.querySelector('#favorite-stations');

    // Create the list if it doesn't exist
    if (!stationList) {
        stationList = document.createElement('ul');
        stationList.id = 'favorite-stations';

        // Insert the station list after the play/pause button
        const playPauseButton = document.getElementById('play-pause-button');
        playPauseButton.parentNode.insertBefore(stationList, playPauseButton.nextSibling);
    }

    stationList.innerHTML = ''; // Clear previous list

    favoriteStations.forEach(station => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${station.name || 'Unknown Station'}</strong>`;
        listItem.setAttribute('data-url', station.url);

        // Add favorite button
        const favoriteButton = document.createElement('button');
        favoriteButton.textContent = '★';
        favoriteButton.style.color = isStationFavorite(station.url) ? 'gold' : 'gray';
        favoriteButton.style.background = 'none';
        favoriteButton.style.border = 'none';
        favoriteButton.style.fontSize = '24px';
        favoriteButton.style.cursor = 'pointer';
        favoriteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering station play
            toggleStationFavorite(station.url, station.name);
            //displayFavoriteStations(); // Re-render the list
        });

        listItem.appendChild(favoriteButton);

        listItem.addEventListener('click', () => {
            playStation(station.url, false, station.name); // Do not highlight when called from here
            highlightFavouritePlayingStation(listItem); // Highlight the favorite station
        });

        stationList.appendChild(listItem);
    });

    // Add a horizontal separator below the favorite stations
    let separator = document.querySelector('#favorite-stations-separator');
    if (!separator) {
        separator = document.createElement('hr');
        separator.id = 'favorite-stations-separator';
        stationList.parentNode.insertBefore(separator, stationList.nextSibling);
    }
}

function highlightFavouritePlayingStation(stationElement) {
    // Remove highlight from any previously playing station
    //removeHighlightFromPlayingStation();

    // Add the 'playing' class to the clicked element
    stationElement.classList.add('playing');
}

async function fetchCurrentSong(url) {
    //console.log(`Fetching current song from URL: ${url}`);
    try {
        // Validate the URL
        if (!isValidUrl(url)) {
            return 'Unknown Song';
        }

        // Use the CORS proxy to fetch the song metadata
        const proxyUrl = `https://synesthesia-cors-proxy.andre-espinho-work.workers.dev/?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            return 'Unknown Song';
            //throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Read the entire response body as a Uint8Array
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Decode the response body using ISO-8859-1
        const decoder = new TextDecoder('iso-8859-1');
        const responseBody = decoder.decode(uint8Array);

        // Search for the <DB_DALET_ARTIST_NAME> tag in the response body
        const artistStart = responseBody.indexOf('<DB_DALET_ARTIST_NAME>') + '<DB_DALET_ARTIST_NAME>'.length;
        const artistEnd = responseBody.indexOf('</DB_DALET_ARTIST_NAME>', artistStart);

        // Search for the <DB_DALET_TITLE_NAME> tag in the response body
        const titleStart = responseBody.indexOf('<DB_DALET_TITLE_NAME>') + '<DB_DALET_TITLE_NAME>'.length;
        const titleEnd = responseBody.indexOf('</DB_DALET_TITLE_NAME>', titleStart);

        let nowPlayingStr = "";
        
        if (artistStart > '<DB_DALET_ARTIST_NAME>'.length && artistEnd > artistStart) {
            nowPlayingStr += responseBody.substring(artistStart, artistEnd) + " - ";
        }

        if (titleStart > '<DB_DALET_TITLE_NAME>'.length && titleEnd > titleStart) {
            nowPlayingStr += responseBody.substring(titleStart, titleEnd);
        }
        else{
            nowPlayingStr += 'Unknown Song';
        }

        return nowPlayingStr;
    } catch (e) {
        //console.error('Error fetching song metadata:', e);
        return 'Unknown Song';
    }

    return 'Unknown Song';
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        // Check if the URL contains "stream-icy"
        return url.href.includes('stream-icy');
    } catch (_) {
        return false;  
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const adjustLayoutForMobile = () => {
        const isMobile = window.innerWidth <= 600;
        const backButton = document.querySelector('button');
        const audioPlayer = document.getElementById('audio-player');

        if (isMobile) {
            backButton.style.fontSize = '24px';
            audioPlayer.style.width = '100%';
        } else {
            backButton.style.fontSize = '32px';
            audioPlayer.style.width = 'auto';
        }
    };

    window.addEventListener('resize', adjustLayoutForMobile);
    adjustLayoutForMobile(); // Initial adjustment
});


function openTab(event, tabName) {
        const tabContents = document.querySelectorAll('.tab-content');
        const tabButtons = document.querySelectorAll('.tab-button');

        // Hide all tab contents
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        // Remove active class from all tab buttons
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show the current tab content and add active class to the button
        document.getElementById(tabName).style.display = 'block';
        event.currentTarget.classList.add('active');

        // If the map tab is opened, adjust the map size
        if (tabName === 'Map') {
            adjustMapSize();
        }
}

function adjustMapSize() {
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Fetch countries data and display on map
    fetch('https://restcountries.com/v3.1/all')
    .then(response => response.json())
    .then(data => {
        displayCountriesOnMap(data);
    })
    .catch(error => {
        console.error('Error fetching countries:', error);
    });
}

// Initialize the first tab as active
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.tab-button').click();
});

// Initialize the map
const map = L.map('map', {
    center: [20, 0], // Centered at the equator
    zoom: 2, // Initial zoom level
    minZoom: 2, // Set the minimum zoom level to prevent zooming out too far
    maxBounds: [
        [-90, -180], // Southwest corner
        [90, 180]    // Northeast corner
    ],
    maxBoundsViscosity: 1.0 // Ensures the map bounces back when panned outside the bounds
});

// Add a tile layer (OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Maximum zoom-in level
    attribution: '© OpenStreetMap'
}).addTo(map);
// Set to keep track of added countries by country code
const loadedCountries = new Set();

// Function to display countries on the map
function displayCountriesOnMap(countries) {
    countries.forEach(country => {
        if (country.latlng && country.latlng.length === 2) {
            const [lat, lng] = country.latlng;
            const countryCode = country.cca2;

            // Check if the country has already been loaded
            if (!loadedCountries.has(countryCode)) {
                const marker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(`<b>${country.name.common}</b><br>${country.flag}`);

                // Store the country code in the loadedCountries set
                loadedCountries.add(countryCode);

                // Add an onclick event to the marker
                marker.on('click', () => {
                    addStationsToMap(countryCode, marker);
                });
            }
        }
    });
}

function addStationsToMap(countryCode, triggeringMarker) {
    // Remove the triggering marker
    if (triggeringMarker) {
        map.removeLayer(triggeringMarker);
    }

    downloadRadiobrowserStationsByCountry(countryCode)
    .then(stations => {
        stations.forEach(station => {
            if (station.geo_lat && station.geo_long) {
                //console.log(station.name 
                    + " , " + station.url
                    + " , " + station.favicon
                    //+ " , " + station.tags);
                //console.log(station.geo_lat + " | " + station.geo_long);

                let lat = station.geo_lat;
                let lng = station.geo_long;

                // Default icon options
                let iconOptions = {
                    iconUrl: 'portable-radio.png', // Default icon
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                };

                // Create the marker with the default icon
                const marker = L.marker([lat, lng], { icon: L.icon(iconOptions) })
                    .addTo(map)
                    .bindPopup(`<b>${station.name}</b><br>${station.tags}`);

                marker.on('click', () => {
                    playStation(station.url, false, station.name);
                });

                // Preload the favicon
                if (station.favicon) {
                    const img = new Image();
                    img.onload = function() {
                        // If the favicon loads successfully, update the icon
                        iconOptions.iconUrl = station.favicon;
                        const newIcon = L.icon(iconOptions);

                        // Update the existing marker's icon without removing it
                        marker.setIcon(newIcon);
                    };
                    /*img.onerror = function() {
                        console.warn(`Failed to load favicon for ${station.name}, using default icon.`);
                    };*/
                    img.src = station.favicon;
                }
            }
        });
    });
}