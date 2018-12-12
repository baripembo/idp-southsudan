$( document ).ready(function() {
  $('.slideshow').slick({
    dots: true,
    lazyLoad: 'progressive',
  });

  $('.slideshow .slick-slide > img').each(function(){ 
    if ($(this).attr('title')){
      var slideCaption = $(this).attr('title');
      $(this).parent('.slick-slide').append('<div class="slide-caption">' + slideCaption + '</div>');
    }
  });

  const DATA_URL = '';//https://baripembo.github.io/idp-southsudan/';
  mapboxgl.accessToken = 'pk.eyJ1IjoiaHN3OTgiLCJhIjoiY2oyOXh2dzlxMDAwYzJ3bzcyMnRseXcxNCJ9.1h5sGCIL0Pig6OmgZdDBMg';

  let isMobile = $(window).width()<600? true : false;
  let dataUrls = ['seg1.geojson','seg2.geojson','seg3.geojson','seg4.geojson','seg5.geojson','seg6.geojson'];
  let geoDataArray = new Array(dataUrls.length);
  let tickerArray = new Array(dataUrls.length);
  let map;

  let narrative = $('#narrative'),
    sections = narrative.find('section'),
    currentSection = '';
    currentIndex = 0;

  narrative.scroll(function(e) {
    let narrativeHeight = narrative.outerHeight();
    let newSection = currentSection;
    let sectionsHeight = $('#sections').height();
    let footerPosition = sectionsHeight-$('footer').outerHeight()-$('.logos').outerHeight()-narrative.outerHeight();

    //show ticker
    if (narrative.scrollTop() >= $('.hero').outerHeight() && narrative.scrollTop() < footerPosition) {
      $('.ticker').addClass('active');
    }
    else {
      $('.ticker').removeClass('active');
    }
    
    //detect current section in view
    for (let i=sections.length-1; i>=0; i--) {
      let rect = sections[i].getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= narrativeHeight) {
        newSection = sections[i].id;
        currentIndex = i;
      }
    };

    setSection(newSection);
  });


  function updateTicker(value) {
    $('.ticker p').animate({
      opacity: 0,
      marginTop: '50px',
    }, 400, function() {
      $(this).text(value);
      $(this).css('marginTop', '-50px').animate({
        opacity: 1,
        marginTop: '0'
      }, 400);
    });
  }


  function setSection(newSection) {
    // update map if id changed
    if (newSection === currentSection) return;
    
    //update ticker
    updateTicker(tickerArray[currentIndex]);

    //show current section icons
    let layer = newSection+'Layer';
    if (map.getLayer(layer)) {
      map.setPaintProperty(layer, 'icon-opacity', 1);
      if (currentIndex===0) {
        map.setLayoutProperty(layer, 'icon-rotate', ['get', 'bearing']);
        map.setLayoutProperty(layer, 'icon-rotation-alignment', 'map');
      }
    }

    //fit map to bounds of current section
    if (geoDataArray[currentIndex]!==undefined) {
      let bearing = -21;
      switch(currentIndex) {
        case 0:
          bearing = -180;
          break;
        case 5:
          bearing = 10;
          break;
        default:
          bearing = -21;
      }
      setMapBounds(geoDataArray[currentIndex], bearing);
    }
    
    // highlight the current section
    for (var i = 0; i < sections.length; i++) {
      sections[i].className = sections[i].id === newSection ? 'active' : '';
    }
    currentSection = newSection;
  }


  function setMapBounds(points, bearing) {
    let bbox = turf.extent(points);
    if (isMobile)
      map.fitBounds(bbox, {padding: {top: 40, bottom: 40, left: 0, right: 0}, bearing: bearing});
    else
      map.fitBounds(bbox, {offset: [200,0], padding: {top: 100, bottom: 80, left: 0, right: 0}, bearing: bearing});
  }


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
          'coordinates': coordinate
        }
      })
    });
    return newArray;
  }


  function initMap() {
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/hsw98/cjjq2awnt06n12soa9ki5nlsl',
      center: [29.5, 8.0],
      maxZoom: 17,
      zoom: 8.2,
      bearing: -180
    });

    //disable scrolling map zoom
    map.scrollZoom.disable();

    //add icon images
    let iconArray = ['icon_circle','icon_foot','icon_foot_up','icon_boat','icon_clash'];
    iconArray.forEach(function(imageName) {
      map.loadImage(DATA_URL+'assets/icons/'+imageName+'.png', function(error, image) {
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

    loadData('geodata_locations.geojson', function (responseText) {
      //fit to bounds of featured locations
      setMapBounds(JSON.parse(responseText), -180);
    });
  }


  function parseData(geoData, index) {
    geoDataArray[index] = geoData;
    geoData.features.forEach(function(feature) {
      tickerArray[index] = feature.properties.ticker;
      let points = convertLineStringtoPoint(feature.geometry.coordinates, feature.properties.transport);
      let name = feature.properties.name.replace(/ /g, '').toLowerCase()
      let source = name+'Layer';
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
          'icon-padding': 4,
        },
        'paint': {
          'icon-opacity': 1,
          // 'icon-opacity-transition': {
          //   'duration': 1000
          // }
        }
      });
    });
  }

  initMap();
});