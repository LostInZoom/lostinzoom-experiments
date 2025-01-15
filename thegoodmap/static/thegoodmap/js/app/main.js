var defaultZoom = 10;

var extent = ol.proj.transformExtent(
    [-1.25, 43, 0.9, 43.9], // Coordonnées en EPSG:4326 (lon/lat)
    'EPSG:4326', 
    'EPSG:3857' // Transformation vers la projection utilisée
);

var mapView = new ol.View({
    center: ol.proj.fromLonLat([0, 43.5]),
    zoom: defaultZoom,
    minZoom: 9.5,  // Zoom minimum
    maxZoom: 17,  // Zoom maximum
    extent: extent // Limitation du pan
});

var map = new ol.Map ({
    target: 'map',
    view: mapView
});

// map.addLayer(bddenjeux);

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_10 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z10', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_10 = new ol.layer.Tile({ source: sourceWMS_10 });
couche_10.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_11 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z11', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_11 = new ol.layer.Tile({ source: sourceWMS_11 });
couche_11.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_12 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z12', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_12 = new ol.layer.Tile({ source: sourceWMS_12 });
couche_12.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_13 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z13', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_13 = new ol.layer.Tile({ source: sourceWMS_13 });
couche_13.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_14 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z14', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_14 = new ol.layer.Tile({ source: sourceWMS_14 });
couche_14.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_15 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z15', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_15 = new ol.layer.Tile({ source: sourceWMS_15 });
couche_15.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_16 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z16', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_16 = new ol.layer.Tile({ source: sourceWMS_16 });
couche_16.setZIndex(1)

/* Déclaration de la source de la couche en format WMS */
var sourceWMS_17 = new ol.source.TileWMS({
    /* Chargement du lien WMS */
    url: 'https://lostinzoom.huma-num.fr/geoserver/wms',
    /* Chargement de l'espace de travail : couche */
    params: {'LAYERS': 'la_bonne_carte:LBC_Z17', 'TILED': false},
    serverType: 'geoserver'
})
/* Déclaration de la couche WMS */
var couche_17 = new ol.layer.Tile({ source: sourceWMS_17 });
couche_17.setZIndex(1)


//Charger la première couche
map.addLayer(couche_10);

var zoomDiv = document.getElementById('zoom');
zoomDiv.innerHTML = 'Zoom : ' + defaultZoom;

map.on("moveend",  function () {
    zoomDiv.innerHTML = 'Zoom : ' + map.getView().getZoom().toFixed(2);
    
    if(mapView !=parseInt(map.getView().getZoom()) ){
        mapView =parseInt(map.getView().getZoom());
        
    if(parseFloat(map.getView().getZoom()) <= 10)  {
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_10);

    }else if(parseFloat(map.getView().getZoom()) <= 11 && parseFloat(map.getView().getZoom()) > 10) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_11);

    }else if(parseFloat(map.getView().getZoom()) <= 12 && parseFloat(map.getView().getZoom()) > 11) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_12);

    }else if(parseFloat(map.getView().getZoom()) <= 13 && parseFloat(map.getView().getZoom()) > 12) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_13);

    }else if(parseFloat(map.getView().getZoom()) <= 14 && parseFloat(map.getView().getZoom()) > 13) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_14);

    }else if(parseFloat(map.getView().getZoom()) <= 15 && parseFloat(map.getView().getZoom()) > 14) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_16);
        map.removeLayer(couche_17);
        map.addLayer(couche_15);

    }else if(parseFloat(map.getView().getZoom()) <= 16 && parseFloat(map.getView().getZoom()) > 15) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_17);
        map.addLayer(couche_16);

    }else if(parseFloat(map.getView().getZoom()) > 17) {
        map.removeLayer(couche_10);
        map.removeLayer(couche_11);
        map.removeLayer(couche_12);
        map.removeLayer(couche_13);
        map.removeLayer(couche_14);
        map.removeLayer(couche_15);
        map.removeLayer(couche_16);
        map.addLayer(couche_17);
        }
    }

    layerSwitcher.renderPanel();
})

var layerSwitcher = new ol.control.LayerSwitcher({
    activationMode: 'click',
    startActive: true,
    groupSelectStyle: 'children'
    
});

map.addControl(layerSwitcher);

// function toggleLayer(eve) {
//     var lyrname = eve.target.value;
//     var checkedStatus = eve.target.checked;
//     var lyrList = map.getLayers();

//     lyrList.forEach(function(element){
//         if (lyrname == element.get('title')){
//             element.setVisible(checkedStatus);
//         }
//     })
// };

var mousePosition = new ol.control.MousePosition({
    className: 'mousePosition',
    projection: 'EPSG:4326',
    coordinateFormat: function(coordinate){return ol.coordinate.format(coordinate,'{y} , {x}', 6);}
});

map.addControl(mousePosition);

var scaleControl = new ol.control.ScaleLine({
    bar: true,
    text: true,

});

