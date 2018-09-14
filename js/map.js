$( document ).ready(function() {
  let dataUrls = ['geodata_segment1.geojson','geodata_segment2.geojson','geodata_segment3.geojson','geodata_segment4.geojson','geodata_segment6.geojson','geodata_segment5.geojson'];
  let layerArray = new Array(dataUrls.length);
  let map;
  const DATA_URL = 'https://baripembo.github.io/idp-southsudan/';
  mapboxgl.accessToken = 'pk.eyJ1IjoiaHN3OTgiLCJhIjoiY2oyOXh2dzlxMDAwYzJ3bzcyMnRseXcxNCJ9.1h5sGCIL0Pig6OmgZdDBMg';


  $('.main-content').height($('#map').height());

  let mapPositions = [0,1050,1550,2110,2550,3150];
  let mainHeaderPos = $('.main-header').position().top;
  let footerPos = $('.footer').position().top;
  $(window).scroll(function (event) {
      let scrollPos = $(window).scrollTop();
      //control sticky header
      if (scrollPos > mainHeaderPos && (scrollPos+$(window).height()+50) < footerPos) {
        $('.main-header').addClass('sticky');
        $('.story').addClass('sticky');
        let stickyPos = $('.story.sticky').css('top').replace(/[^-\d\.]/g, '');
        $('.story').css('height', $(window).height()-stickyPos);
      }
      else {
        $('.main-header').removeClass('sticky');
        $('.story').removeClass('sticky');
      }

      //change text content based on position of scroll
      for (var i=1; i<=mapPositions.length; i++) {
        if (scrollPos>mapPositions[i-1] && scrollPos<=mapPositions[i]) {
          $('.segment').hide();
          $('.segment:nth-child('+i+')').show();

          //show segment map icons
          if (map.getLayer(layerArray[i]) && map.getPaintProperty(layerArray[i], 'icon-opacity') < 1) {
            map.setPaintProperty(layerArray[i], 'icon-opacity', 1);
          }
        }
      }
  });

  function getData() {
    dataUrls.forEach(function (url, index) {
      loadData(url, function (responseText) {
        parseData(JSON.parse(responseText), index);
      })
    })
  }

  function loadData(dataPath, done) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () { return done(this.responseText) }
      xhr.open('GET', DATA_URL+'data/'+dataPath, true);
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
      bearing: -21,
      interactive: false
    });

    //add map zoom control
    //map.addControl(new mapboxgl.NavigationControl());

    //disable scrolling map zoom
    map.scrollZoom.disable();

    //add icon images
    let iconArray = ['icon_circle','icon_foot','icon_boat','icon_clash'];
    iconArray.forEach(function(imageName) {
      map.loadImage(DATA_URL+'assets/icons/'+imageName+'.png', function(error, image) {
        map.addImage(imageName, image);
      });
    });

    //get data
    map.on('load', function() {
      locationData();
      conflictData();
      getData();
    });
  }

  function locationData() {
    map.addSource('locationSource', {
      type: 'geojson',
      data: DATA_URL+'data/geodata_locations.geojson'
    });

    map.addLayer({
      'id': 'locationPoints',
      'type': 'symbol',
      'source': 'locationSource',
      'layout': {
        'icon-image': 'icon_circle',
        'icon-offset': { 'type': 'identity', 'property': 'iconOffset' },
        'text-field': '{name}',
        'text-font': ['PT Sans Bold Italic', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-offset': { 'type': 'identity', 'property': 'textOffset' },
        'text-anchor': { 'type': 'identity', 'property': 'textAnchor' },
        'icon-allow-overlap': true,
        'text-allow-overlap': true
      }
    });
  }

  function conflictData() {
    map.addSource('clashSource', {
      type: 'geojson',
      data: DATA_URL+'data/conflict_sample.geojson'
    });

    map.addLayer({
      'id': 'clashPoints',
      'type': 'symbol',
      'source': 'clashSource',
      'layout': {
        'icon-image': 'icon_clash',
        'icon-offset': { 'type': 'identity', 'property': 'iconOffset' },
        // 'text-field': '{event_type}',
        // 'text-font': ['PT Sans Bold Italic', 'Arial Unicode MS Bold'],
        // 'text-size': 11,
        // 'text-offset': { 'type': 'identity', 'property': 'textOffset' },
        // 'text-anchor': { 'type': 'identity', 'property': 'textAnchor' },
        'icon-allow-overlap': true,
        'text-allow-overlap': true
      }
    });
  }

  function parseData(geoData, index) {
    geoData.features.forEach(function(feature) {
      let points = convertLineStringtoPoint(feature.geometry.coordinates, feature.properties.transport);
      let name = feature.properties.name.replace(/ /g, '').toLowerCase()
      let source = name+'Layer';
      layerArray[index] = source;
      let iconOpacity = index===0? 1 : 0;
      map.addSource(source, {
        type: 'geojson',
        data: {
          'type': 'FeatureCollection',
          'features': points
        }
      });
      map.addLayer({
        'id': source,
        'type': 'symbol',
        'source': source,
        'layout': {
          'icon-image': 'icon_{transport}',
          'icon-padding': 6
        },
        'paint': {
          'icon-opacity': iconOpacity,
          'icon-opacity-transition': {
            'duration': 1000
          }
        }
      });
    });
  }

  initMap();

});