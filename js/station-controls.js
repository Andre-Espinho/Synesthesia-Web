
function renderStations(stations) {

    // Volume Controll
    const volumeControl = document.getElementById('volume-control');
    // Retrieve the saved volume level from localStorage
    const savedVolume = localStorage.getItem('audioVolume');
    volumeControl.value = savedVolume !== null ? savedVolume : 0.5; // Default to 0.5 if no saved volume
    volumeControl.addEventListener('input', (event) => {
        const audio = document.getElementById('audio-player');
        if (audio) {
            audio.volume = event.target.value;
        }
        // Save the current volume level to localStorage
        localStorage.setItem('audioVolume', event.target.value);
    });

    // Pause-Play Button
    const playPauseButton = document.getElementById('play-pause-button');
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
                //let existingAudio = document.getElementById('audio-player');
                audio.pause()
                playPauseButton.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#000000" d="M8 5v14l11-7L8 5z"/>
                    </svg>
                `; // Play icon
            }
        }
    });

    const stationsList =  document.getElementById('stations-list');
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

            stationItem.addEventListener('click', () => {
                playStation(station.url, true, station.name);
            });

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

            stationsList.appendChild(stationItem);
        }
    });

    const searchBar = document.getElementById('search');
    
    const debounceDelay = 300;
    let debounceTimeout;
    searchBar.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const query = searchBar.value.toLowerCase();
            const filteredStations = stations.filter(station => station.name.toLowerCase().includes(query));
    
            // Prioritize favorites
            const favoriteStations = filteredStations.filter(station => isStationFavorite(station.url));
            const nonFavoriteStations = filteredStations.filter(station => !isStationFavorite(station.url));
    
            // Create a set to track seen station names
            const seenStationNames = new Set();
    
            // Combine favorites and non-favorites, ensuring no duplicates
            const prioritizedStations = [...favoriteStations, ...nonFavoriteStations].filter(station => {
                const stationNameLower = station.name.toLowerCase();
                if (!seenStationNames.has(stationNameLower)) {
                    seenStationNames.add(stationNameLower);
                    return true;
                }
                return false;
            });
    
            stationsList.innerHTML = ''; // Clear previous list
    
            if (prioritizedStations.length === 0) {
                stationsList.innerHTML = '<li>No stations found</li>';
            } else {
                updateStationList(prioritizedStations);
            }
        }, debounceDelay);
    });
}

function updateStationList(filteredStations) {
    const stationsList =  document.getElementById('stations-list');
    stationsList.innerHTML = '';
    filteredStations.forEach(station => {
        const stationItem = document.createElement('li');
        stationItem.innerHTML = `<strong>${station.name}</strong>`;
        stationItem.setAttribute('data-url', station.url);

        stationItem.addEventListener('click', () => {
            playStation(station.url, true, station.name);
        });

        const favoriteButton = document.createElement('button');
        favoriteButton.textContent = '★';
        favoriteButton.style.color = isStationFavorite(station.url) ? 'gold' : 'gray';
        favoriteButton.style.background = 'none';
        favoriteButton.style.border = 'none';
        favoriteButton.style.fontSize = '24px';
        favoriteButton.style.cursor = 'pointer';
        favoriteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleStationFavorite(station.url, station.name);
            updateStationList(filteredStations);
        });

        stationItem.appendChild(favoriteButton);
        stationsList.appendChild(stationItem);
    });
}


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

    // Web Audio API setup for frequency graph
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = document.getElementById('frequency-graph');
    const canvasCtx = canvas.getContext('2d');
    
    // Adjust canvas resolution for sharper visuals
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    canvasCtx.scale(devicePixelRatio, devicePixelRatio);
    
    function draw() {
        requestAnimationFrame(draw);
    
        analyser.getByteFrequencyData(dataArray);
    
        canvasCtx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
    
        const barWidth = (canvas.width / bufferLength) * 2.5 / devicePixelRatio;
        let barHeight;
        let x = 0;

        // Calculate the current time in quarters of a day past midnight
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        const quartersPastMidnight = Math.floor(totalMinutes / (24 * 60 / 4));
    
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
    
            // Calculate the hue for the rainbow effect
            const hue = ((i / bufferLength) * 360 - 90 * quartersPastMidnight + 360) % 360;
            canvasCtx.fillStyle = 'hsla(' + hue + ', 100%, 50%, 0.7)'; // 0.7 for 70% transparency
            canvasCtx.fillRect(x, canvas.height / devicePixelRatio - barHeight / 2, barWidth, barHeight / 2);
    
            x += barWidth + 1;
        }
    }
    
    draw();
}


function isStationFavorite(stationUrl) {
    const favorites = JSON.parse(localStorage.getItem('favoriteStations')) || [];
    return favorites.some(station => station.url === stationUrl);
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


