function handleClick(event) {
    const countryName = event.target.getAttribute('name');
    if(event.target.getAttribute('name') && !hasMoved){
        //alert('You clicked on: ' + countryName);
        //fetchCountryByName(countryName);
    }
    else if(event.target.getAttribute('class') && !hasMoved){
        //alert('You clicked on: ' + event.target.getAttribute('class'));
        //loadContent('html/stations.html', event.target.getAttribute('class')+'View');
        //fetchCountryByName(event.target.getAttribute('class'));
    }
}


function fetchCountryByName(name) {
    fetch(`https://restcountries.com/v3.1/name/${name}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const country = data[0];
                
                downloadRadiobrowserStationsByCountry((country.tld[0]+"").replace('.',''))
                .then(stations => {
                    fetch('html/stations.html')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('contentView').innerHTML = data;
                        closeNav();
                        renderStations(stations);
                    });
                }).catch(error => {
                    console.log(error)
                })
                //console.log('Country id:', country);
                // You can access country.id or other properties here
            } else {
                console.error('Country not found');
            }
        })
        .catch(error => {
            console.error('Error fetching country:', error);
        });
}
