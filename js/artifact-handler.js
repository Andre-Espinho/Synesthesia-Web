//Contains navigation artifact controlls

const links = document.querySelectorAll('.sidebar-link');

function loadContent(url, viewId) {
    fetch(url)
        .then(response => response.text())
        .then(data => {

            links.forEach(link => {
                link.addEventListener('click', function() {
                    links.forEach(l => l.classList.remove('active'));
                });
            });

            document.getElementById(viewId).classList.add('active')

            document.getElementById('contentView').innerHTML = data;
            closeNav();

            window.removeEventListener('wheel', wheelHandler);

            switch (viewId) {
                case 'places':
                    fetchCountriesForPlaces();
                    break;
                case 'favourites':
                    loadFavourites();
                    break;
                case 'discover':
                    discoverTooltip();
                    setupSvgDragging();
                    viewBox = { x: 0, y: 0, width: 2000, height: 857 };
                    isDragging = false;
                    startX, startY;
                    hasMoved = false;

                    window.addEventListener('wheel', wheelHandler);
                    break;
            
                default:
                    break;
            }
            
            const savedAudioSrc = localStorage.getItem('audio-src');
            if (savedAudioSrc) {
                playStation(savedAudioSrc, false);
            }
        })
        .catch(error => console.error('Error loading content:', error));
}

const wheelHandler = function(event) {
    if (event.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
};

function fetchCountriesForPlaces() {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            displayCountriesByContinent(data);
        })
        .catch(error => {
            console.error('Error fetching countries:', error);
        });
}

function displayCountriesByContinent(countries) {
    // Sort countries alphabetically by their common name
    countries.sort((a, b) => {
        const nameA = a.name.common.toUpperCase(); // Ignore upper and lowercase
        const nameB = b.name.common.toUpperCase(); // Ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });

    countries.forEach(country => {
        const continentCode = country.region;
        const continentDiv = document.getElementById(continentCode.replace(' ', ''));

        if (continentDiv) {
            // Create a country div
            const countryDiv = document.createElement('button');
            countryDiv.classList.add('grid-button')
            countryDiv.textContent = `${country.flag} ${country.name.common}`;

            // Append the grid container to the continent div
            continentDiv.appendChild(countryDiv);
        }
    });
}

function loadFavourites(){
    const favorites = JSON.parse(localStorage.getItem('favoriteStations'))
    //console.log(favorites.length)
    if(favorites.length > 0){

        const favouriteStationControlls = document.getElementById('favouriteStationControlls');
        favouriteStationControlls.classList.toggle('hidden')

        var favouriteStations = document.getElementById('stations-list')
        //favouriteStations.innerHTML="Favourite Stations";

        var favouriteStationsList = document.createElement('ul');
        favouriteStationsList.id = 'stations-list-list';

        favorites.forEach(element => {
            //console.log(element)

            const stationItem = document.createElement('li');
            stationItem.innerHTML = `<strong>${element.name}</strong>`;
            stationItem.setAttribute('data-url', element.url);

            stationItem.addEventListener('click', () => {
                playStation(element.url, true, element.name);
            });

            favouriteStationsList.appendChild(stationItem);
        });
        favouriteStations.appendChild(favouriteStationsList);
        

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
    }
    else{
        const favouriteStationControlls = document.getElementById('contentView');
        favouriteStationControlls.innerHTML = "Your favourite stations will show here."
    }
}

let tooltipList = [];

function discoverTooltip(){
    const tooltip = document.getElementById('tooltip');
    const svgPaths = document.querySelectorAll('svg path');

    downloadRadiobrowserNumberStationsPercountry()
    .then(result => {

        svgPaths.forEach(path => {
            path.addEventListener('mouseover', (event) => {
                const className = path.getAttribute('class');
                const name = path.getAttribute('name');
                
                countryName = className || name;
                
                if(tooltipList.find(element => element.name == countryName) == undefined){

                    tooltip.textContent = countryName;

                    fetch(`https://restcountries.com/v3.1/name/${countryName}`).then(response => response.json()).then(data => {
                        if (data && data.length > 0) {
                            const country = data[0];
                            
                            let stations = result.find(location => location.iso_3166_1 === (country.tld[0]+"").replace('.','').toLocaleUpperCase());
                            if(stations == undefined){
                                stations = 0;
                            }else{
                                stations =  stations.stationcount;
                            }

                            tooltipList.push({name: countryName, stations: stations});
                            
                            tooltip.textContent += ' Stations: ' + stations;
                            tooltip.style.display = 'block';
                        } else {
                            console.error('Country not found');
                        }
                    });
                }else{
                    let stations = tooltipList.find(element => element.name == countryName).stations;
                    tooltip.textContent = countryName + ' Stations: ' + stations;
                    tooltip.style.display = 'block';
                }
            });

            path.addEventListener('mousemove', (event) => {
                tooltip.style.left = event.pageX + 10 + 'px';
                tooltip.style.top = event.pageY + 10 + 'px';
            });

            path.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
            });
        });
    }).catch(error => {
        console.error(error);
    });
}

let viewBox = { x: 0, y: 0, width: 2000, height: 857 };
const zoomFactor = 1.2;
let isDragging = false;
let startX, startY;
let hasMoved = false;

function zoomIn() {
    viewBox.width /= zoomFactor;
    viewBox.height /= zoomFactor;
    updateViewBox();
}

function zoomOut() {
    viewBox.width *= zoomFactor;
    viewBox.height *= zoomFactor;
    updateViewBox();
}

function setupSvgDragging() {
    const svg = document.getElementById('worldSvg');
    let dragThreshold = 1; // Minimum movement to consider as dragging
    svg.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
    });

    svg.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = (startX - e.clientX) * (viewBox.width / svg.clientWidth);
            const dy = (startY - e.clientY) * (viewBox.height / svg.clientHeight);
            if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
                hasMoved = true;
            }
            viewBox.x += dx;
            viewBox.y += dy;
            updateViewBox();
            startX = e.clientX;
            startY = e.clientY;
        }
    });

    svg.addEventListener('mouseup', (e) => {
        isDragging = false;
        if (!hasMoved) {
            handleClick(e);
        }
    });

    svg.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    function handleClick(e) {
        // Your onclick logic here
        //console.log('SVG clicked at', e.clientX, e.clientY);
        countryName = document.getElementById("tooltip").innerHTML.split(" Stations")[0].trim();
        window.removeEventListener('wheel', wheelHandler);
        if(countryName!=""){
            fetchCountryByName(countryName);
        }
    }
}

function updateViewBox() {
    const svg = document.getElementById('worldSvg');
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}