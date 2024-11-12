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
    displayFavoriteStations(); // Display favorite stations first

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

    const stationsList = document.createElement('ul');
    stationsList.id = 'stations-list';

    const existingStationsList = document.getElementById('stations-list');
    if (existingStationsList) {
        existingStationsList.remove();
    }

    document.body.appendChild(stationsList);

    downloadRadiobrowserStationsByCountry(countryCode)
        .then(stations => {
            renderStations(stations);
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

        stations.forEach(station => {
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
                playStation(station.url);
            });

            stationsList.appendChild(stationItem);
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

    // Add the volume slider to the page
    const searchBar = document.getElementById('search');
    searchBar.parentNode.insertBefore(volumeControl, searchBar.nextSibling);

    volumeControl.addEventListener('input', (event) => {
        const audio = document.getElementById('audio-player');
        if (audio) {
            audio.volume = event.target.value;
        }
        // Save the current volume level to localStorage
        localStorage.setItem('audioVolume', event.target.value);
    });
});

function playStation(url, shouldHighlight = true) {
    // Remove existing audio element if it exists
    let existingAudio = document.getElementById('audio-player');
    if (existingAudio) {
        // Stop the audio and clear its source
        existingAudio.pause();
        existingAudio.src = ''; // Clear the source to release the media
        existingAudio.load(); // Reset the audio element
        existingAudio.parentNode.removeChild(existingAudio); // Remove the element from the DOM
        removeHighlightFromPlayingStation(); // Remove highlight when stopped
    }

    // Create a new audio element
    const audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.src = url + '?nocache=' + new Date().getTime(); // Add a cache-busting query parameter
    audio.autoplay = true;
    audio.controls = true; // Add controls to make the player visible

    // Style the audio element to ensure it is visible
    audio.style.position = 'fixed';
    audio.style.bottom = '10px';
    audio.style.left = '10px';
    audio.style.zIndex = '1000'; // Ensure it is on top of other elements

    // Set the audio volume to the current slider value
    const volumeControl = document.getElementById('volume-control');
    audio.volume = volumeControl.value;

    // Insert the new audio element after the search bar
    const searchBar = document.getElementById('search');
    searchBar.parentNode.insertBefore(audio, searchBar.nextSibling);

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

        // Insert the station list after the volume control and search bar
        const searchBar = document.getElementById('search');
        searchBar.parentNode.insertBefore(stationList, searchBar.nextSibling.nextSibling);
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
            displayFavoriteStations(); // Re-render the list
        });

        listItem.appendChild(favoriteButton);

        listItem.addEventListener('click', () => {
            playStation(station.url, false); // Do not highlight when called from here
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