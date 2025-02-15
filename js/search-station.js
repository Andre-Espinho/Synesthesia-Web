/*function updateStationList(filteredStations) {
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
}*/

var queryDataStorage; 

async function queryEndpoint() {
    try {
        query = document.getElementById('search').value;
        const queryUrl = `http://andreespinho.pythonanywhere.com/search?term=${encodeURIComponent(query)}`;
        
        const response = await fetch(queryUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            console.error('Network response was not ok:', response.statusText);
            //throw new Error(`Network response was not ok: ${response.statusText}`);
        } else {
            const data = await response.json();
            console.log(data);
            
            const seenStationNames = new Set();
            const uniqueStations = data.stations.filter(station => {
                if (seenStationNames.has(station.name)) {
                    return false;
                } else {
                    seenStationNames.add(station.name);
                    return true;
                }
            });
            
            queryDataStorage = { ...data, stations: uniqueStations };
            console.log(queryDataStorage.stations);
            setupStationControls();
            updateStationList(queryDataStorage.stations.slice(0, 10));
        }

    } catch (e) {
        console.error('Error processing query result:', e);
    }
}