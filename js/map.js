let dataUrls = ['geodata_segment1.geojson','geodata_segment2.geojson','geodata_segment3.geojson','geodata_segment4.geojson','geodata_segment5.geojson'];
let map;
mapboxgl.accessToken = 'pk.eyJ1IjoiaHN3OTgiLCJhIjoiY2oyOXh2dzlxMDAwYzJ3bzcyMnRseXcxNCJ9.1h5sGCIL0Pig6OmgZdDBMg';


function getData() {
  dataUrls.forEach(function (url) {
    loadData(url, function (responseText) {
      parseData(JSON.parse(responseText));
    })
  })
}

function loadData(dataPath, done) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () { return done(this.responseText) }
    xhr.open('GET', 'https://baripembo.github.io/data/'+dataPath, true);
    xhr.send();
}

function convertLineStringtoPoint(array, type) {
  let newArray = [];
  array.forEach(function(coordinate) {
    newArray.push({
      'type': 'Feature',
      'properties': {
        'transport': type 
      },
      'geometry': {
        'type': 'Point',
        'coordinates':coordinate
      }
    })
  });
  return newArray;
}

function initMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hsw98/cjjq2awnt06n12soa9ki5nlsl',
    center: [31.1169, 6.1008],
    maxZoom: 24,
    zoom: 8.2,
    bearing: -21
  });

  //add map zoom control
  map.addControl(new mapboxgl.NavigationControl());

  //disable scrolling map zoom
  map.scrollZoom.disable();

  //add icon images
  let iconArray = ['icon_circle','icon_foot','icon_boat'];
  iconArray.forEach(function(imageName) {
    map.loadImage('assets/icons/'+imageName+'.png', function(error, image) {
      map.addImage(imageName, image);
    });
  });

  //get data
  map.on('load', function() {
    locationData();
    getData();
  });
}

function locationData() {
  map.addSource('segment1', {
    type: 'geojson',
    data: 'https://baripembo.github.io/data/geodata_locations.geojson'
  });

  map.addLayer({
    'id': 'points',
    'type': 'symbol',
    'source': 'segment1',
    'layout': {
      'icon-image': 'icon_circle',
      'icon-offset': { "type": "identity", "property": "iconOffset" },
      'text-field': '{name}',
      'text-font': ['PT Sans Bold Italic', 'Arial Unicode MS Bold'],
      'text-size': 11,
      'text-offset': { "type": "identity", "property": "textOffset" },
      'text-anchor': { "type": "identity", "property": "textAnchor" },
      'icon-allow-overlap': true,
      'text-allow-overlap': true
    }
  });
}

function parseData(geoData) {
  geoData.features.forEach(function(feature) {
    let points = convertLineStringtoPoint(feature.geometry.coordinates, feature.properties.transport);
    let source = feature.properties.name.replace(/ /g, '').toLowerCase()+'Layer';
    map.addSource(source, {
      type: 'geojson',
      data: {
        'type': 'FeatureCollection',
        'features': points
      }
    });
    map.addLayer({
      'id': source+'Layer',
      'type': 'symbol',
      'source': source,
      'layout': {
        'icon-image': 'icon_{transport}',
        'icon-padding': 6
        // 'icon-allow-overlap': true,
        // 'text-allow-overlap': true
      }
    });
  });
}

initMap();