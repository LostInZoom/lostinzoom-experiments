/**
 * @navigation
 * Defines the navigation tools.
 */

function navigationMode(param) {
    let container = document.getElementById('container');

    let html = `
        <div id="startbutton" class="mode-button active" @click="start"><img src='../static/zoomtracker/img/play.svg' /></div>
        <div id="downloadCSV">
            <div id="allEvents"></div>
            <div id="mouseMoveEvents"></div>
        </div>
    `

    let recordingcontainer = makeElement('mode-container drawing-mode-container', html, 'tracker');
    container.appendChild(recordingcontainer);

    let selection = document.getElementById('basemap-selection');
    let geoinfos = document.getElementById('geo-infos');

    let zoom = param.cartography.olmap.getView().getZoom();
    let center = param.cartography.olmap.getView().getCenter();

    let track = Vue.createApp({
        data() {
          return {
            nom:"session0",
            lstEvents: [],
            nbEvents: 0,
      
            dataEvents: [],
            dataMouseEvents:[],
      
            starttime: 0,
            time: {
              minutes: 0,
              secondes: 0,
              milisec: 0
            },
            etat: {
              run: true,
              stop: false
            },
          };
        },
        methods: {
          start () {
            this.startTime = Date.now();
            let listener = param.cartography.olmap.on(['dblclick', 'singleclick', 'pointermove', 'movestart', 'moveend', 'pointerdrag'], onMapClick);
            document.getElementById("ol-map").addEventListener("wheel", detectTrackPad, true);
      
            if (this.etat.run){
                chronoStart();
                this.etat.run = false;
                document.getElementById('startbutton').innerHTML = `<img src='../static/zoomtracker/img/pause.svg' />`;
                removeClass(geoinfos, 'active');
                addClass(selection, 'collapse');
            }
            else {
                chronoStop();
                if (this.dataEvents.length > 0) {
                    document.getElementById('allEvents').innerHTML = '';
                    let csvContent = dicoToFormatCSV(this.dataEvents);
                    dataToCSV(csvContent, "allEvents");
                }
                if (this.dataMouseEvents.length > 0) {
                    document.getElementById('mouseMoveEvents').innerHTML = '';
                    let csvContentMouse = dicoToFormatCSV(this.dataMouseEvents);
                    dataToCSV(csvContentMouse, "mouseMoveEvents");
                }
                
                ol.Observable.unByKey(listener);
                document.getElementById("ol-map").removeEventListener("wheel", detectTrackPad, false);
                
                this.dataEvents = [];
                this.dataMouseEvents = [];
                this.nbEvents = 0;
                this.lstEvents = [];
                document.getElementById('startbutton').innerHTML = `<img src='../static/zoomtracker/img/play.svg' />`;
                addClass(geoinfos, 'active');
                removeClass(selection, 'collapse');
            }
          },
      
        },
    }).mount('#tracker');
      
      
    /**************** chrono  **************** */
    
    function onMapClick(e) {
        let etype = e.type;
        if(etype == 'moveend') {
            let newZoom = e.target.getView().getZoom();
            if (zoom !== newZoom) {
                if (zoom > newZoom) { etype = 'zoomout' }
                else { etype = 'zoomin' }
            }
            zoom = e.target.getView().getZoom();
            center = e.target.getView().getCenter();
        }

        //console.log(e.type)
        let ev = ['dblclick', 'singleclick', 'zoomin', 'zoomout', 'pointerdrag'];
        let dicoTemps = { min:track.time.minutes, sec:track.time.secondes, mili:track.time.milisec };
        let temps = JSON.stringify(dicoTemps);
        
        if (ev.includes(etype)){
            track.nbEvents++;
            track.lstEvents.push(e);
            return track.dataEvents.push(createDicoEvent(e, temps, etype));
        }
        
        if (e.type == 'pointermove') {
            return track.dataMouseEvents.push(createDicoEvent(e, temps, etype));
        }
    }
    
    function createDicoEvent(e, temps, etype){
        let dico = {};
        // let NOcorner = L.point(0,0);
        // let center = L.point(250,250);
        // let trans = e.target._mapPane._leaflet_pos
        dico['type'] = etype;
        dico['temps'] = temps;
        dico['time_computer'] = Date.now()+"";
        dico['posLatLon'] = 'null';
        dico['posPix'] = 'null';
        dico['extent'] = 'null';
        dico['no_corner_x'] = 'null';
        dico['no_corner_y'] = 'null';
        dico['center'] = 'null';
        dico['center_x'] = 'null';
        dico['center_y'] = 'null';
        dico['nivZoom'] = param.cartography.olmap.getView().getZoom();
        dico['trans'] = 'null';

        if (etype == 'pointermove'){
            dico['posLatLon'] = e.latlng;
            dico['posPix'] = e.containerPoint;
        }
        else{
            dico['extent'] =  param.cartography.olmap.getView().calculateExtent(param.cartography.olmap.getSize());
            dico['no_corner_x'] =  param.cartography.olmap.getView().calculateExtent(param.cartography.olmap.getSize())[2];
            dico['no_corner_y'] =  param.cartography.olmap.getView().calculateExtent(param.cartography.olmap.getSize())[1];

            dico['center'] = param.cartography.olmap.getView().getCenter();
            dico['center_x'] = param.cartography.olmap.getView().getCenter()[0];
            dico['center_y'] = param.cartography.olmap.getView().getCenter()[1];

            // dico['trans'] = trans;
        }
        return dico;
    }
    
    /**************** chrono  **************** */
    let timer;
    
    chronoStart = function() {
        timer = setInterval(function() {
            let now = Date.now();
            let diff = new Date(now-track.startTime)
            track.time.minutes = diff.getMinutes();
            track.time.secondes = diff.getSeconds();
            track.time.milisec = diff.getMilliseconds();
        }, 100);
            setEtat(false, true);
    };
    
    chronoStop = function() {
        clearInterval(timer);
        setEtat(true, false);
    };
    
    setEtat = function(run, stop) {
        track.etat.run = run;
        track.etat.stop = stop;     
    };
      
      /**************** detect trackpad **************** */
    let oldTime = 0;
    let newTime = 0;
    let isTrackPad;
    let eventCount = 0;
    let eventCountStart;
      
    function detectTrackPad(e) {
        let isTrackPadDefined = isTrackPad || typeof isTrackPad !== "undefined";
        
        if (isTrackPadDefined) return;
        
        if (eventCount === 0) {
          eventCountStart = performance.now();
        }
      
        eventCount++;
      
        if (performance.now() - eventCountStart > 66) {
          if (eventCount > 6) {
            isTrackPad = true;
            
            track.dataEvents.push(["Using trackpad"]);
          } else {
            isTrackPad = false;
            
            track.dataEvents.push(["Using mouse"]);
          }
          isTrackPadDefined = true;
        }
      };

    function dicoToFormatCSV(dico){

        const titleKeys = Object.keys(dico[0])
      
        const refinedData = []
        refinedData.push(titleKeys)
    
        dico.forEach(item => {
            refinedData.push(Object.values(item))  
        })
    
        let csvContent = ''
    
        refinedData.forEach(row => {
        csvContent += row.join(';') + '\n'
        })
        return csvContent;
    }
    
    function dataToCSV(csvContent, nomDiv){
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
        const objUrl = URL.createObjectURL(blob)
        
        const link = document.createElement('a');
        link.setAttribute('href', objUrl);
    
        if (nomDiv == "allEvents"){
          link.setAttribute('download', 'zoomtracker-allEvents.csv')
        }
        if (nomDiv == "mouseMoveEvents"){
          link.setAttribute('download', 'zoomtracker-mouseMoveEvents.csv')
        }
        document.getElementById(nomDiv).append(link);
        link.click();
    }

    // function play(event) {
    //     recordingbutton.removeEventListener('click', play);
    //     recordingbutton.innerHTML = `<img src='../static/zoomtracker/img/pause.svg' />`;
    //     removeClass(geoinfos, 'active');
    //     addClass(selection, 'collapse');
    //     recordingbutton.addEventListener('click', pause);
    //     track.start();
    // }

    // function pause(event) {
    //     recordingbutton.removeEventListener('click', pause);
    //     recordingbutton.innerHTML = `<img src='../static/zoomtracker/img/play.svg' />`;

    //     recordingbutton.addEventListener('click', play);
    // }
}