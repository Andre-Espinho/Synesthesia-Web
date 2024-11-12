function getRadiobrowserBaseUrls() {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', 'http://all.api.radio-browser.info/json/servers', true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                const items = JSON.parse(request.responseText).map(x => "https://" + x.name);
                resolve(items);
            } else {
                reject(request.statusText);
            }
        };
        request.onerror = function() {
            reject('Network error');
        };
        request.send();
    });
}

function downloadUri(uri, param) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(param ? 'POST' : 'GET', uri, true);
        request.setRequestHeader('User-Agent', 'SynesthesiaWeb/0.0.1');
        request.setRequestHeader('Content-Type', 'application/json');

        request.onload = function() {
            if (request.status >= 200 && request.status < 300) {
                resolve(request.responseText);
            } else {
                reject(request.statusText);
            }
        };

        request.onerror = function() {
            reject('Network error');
        };

        request.send(param ? JSON.stringify(param) : null);
    });
}

function downloadRadiobrowser(path, param) {
    return getRadiobrowserBaseUrls().then(servers => {
        servers.sort(() => Math.random() - 0.5); // Shuffle servers
        let i = 0;

        function tryDownload() {
            if (i >= servers.length) {
                return Promise.reject('All servers failed');
            }

            const serverBase = servers[i];
            const uri = serverBase + path;
            //console.log('Random server:', serverBase, 'Try:', i);

            return downloadUri(uri, param)
                .then(data => JSON.parse(data))
                .catch(err => {
                    console.error('Unable to download from API URL:', uri, err);
                    i++;
                    return tryDownload();
                });
        }

        return tryDownload();
    });
}

function downloadRadiobrowserStats() {
    return downloadRadiobrowser('/json/stats', null);
}

function downloadRadiobrowserStationsByCountry(countryCode) {
    return downloadRadiobrowser(`/json/stations/bycountrycodeexact/${countryCode}`, null);
}

function downloadRadiobrowserStationsByName(name) {
    return downloadRadiobrowser('/json/stations/search', { name: name });
}

// Example usage
//console.log('All available URLs');
//console.log('------------------');
/*getRadiobrowserBaseUrls().then(urls => {
    //urls.forEach(url => console.log(url));
    //console.log('');

    //console.log('Stats');
    //console.log('------------');
    return downloadRadiobrowserStats();
}).then(stats => {
    //console.log(JSON.stringify(stats, null, 4));
}).catch(err => {
    console.error('Error:', err);
});*/