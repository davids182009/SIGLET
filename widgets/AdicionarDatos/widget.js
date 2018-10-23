/**
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
* @version 1.0
* @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
* History
* 
*/

/**
 * Modulo para incorporar url de servicios y archivos externos al mapa y
 * area de trabajo del explorador de capas.
 * @module AdicionarDatos 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dojo/dom-class",
    "dojo/on",    
    "dojo/_base/lang",
    "esri/geometry/scaleUtils",
    "esri/request",
    "dijit/registry",
    "dojo/dom",
    "dojo/query",
    "esri/layers/FeatureLayer",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojox/encoding/base64",
    "dojox/data/CsvStore",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",
    "esri/layers/KMLLayer",
    "dojo/sniff",
    "dojo/text!./template.html"],
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        TabContainer, ContentPane, domClass, on, lang, scaleUtils,
        request,registry,dom,query,FeatureLayer,domStyle,arrayUtils,
        base64,CsvStore,webMercatorUtils,Point,KMLLayer,has,template) {

        /**
         * Crea un nuevo AdicionarDatos (Constructor)
         * @class
         * @alias module:AdicionarDatos     
         * @property {String} templateString - Contenido del archivo CapaWidget.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("AdicionarDatos", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "AdicionarDatos",
            id: '',
            map:null,
            isAdvancedUpload: false,
            job:{
                baseFileName:'',
                fileType:''
            },
            urlServiceShp: 'https://www.arcgis.com/sharing/rest/content/features/generate',
            urlServiceKml: 'http://utility.arcgis.com/sharing/kml',
            latFieldStrings : ["lat", "latitude", "y", "ycenter"],
            longFieldStrings : ["lon", "long", "longitude", "x", "xcenter"],

            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            postCreate: function () {
                this.inherited(arguments);
                this.map = registry.byId('EsriMap').map;
                this.isAdvancedUpload = function () {
                    let div = document.createElement('div');
                    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
                }();
                this.shp_icon.src = require.toUrl('widgets/AdicionarDatos/images/filetypes/zip.svg');
                this.csv_icon.src = require.toUrl('widgets/AdicionarDatos/images/filetypes/csv.svg');
                this.kml_icon.src = require.toUrl('widgets/AdicionarDatos/images/filetypes/kml.svg');
                if (this.isAdvancedUpload) {
                    domClass.add(this.formulario, 'has-advanced-upload');

                    /* on(this.formulario,
                        'drag,dragstart,dragend,dragover,dragenter,dragleave',
                    lang.hitch(this,function(event){                    
                        event.preventDefault();
                        event.stopPropagation();
                    }));
    
                    on(this.formulario,
                        'dragover,dragenter',
                    lang.hitch(this,function(event){
                        domClass.add(this.formulario,'is-dragover');
                    }));
    
                    on(this.formulario,
                        'dragleave,dragend',
                    lang.hitch(this,function(event){
                        domClass.remove(this.formulario,'is-dragover');
                    }));
    
                    on(this.formulario,
                        'drop',
                    lang.hitch(this,function(event){
                        event.preventDefault();
                        event.stopPropagation();
                        domClass.remove(this.formulario,'is-dragover');
                        console.log(event);
                        let droppedFiles = event.originalEvent.dataTransfer.files;
                        console.log(droppedFiles);
                    })); */

                    on(this.formulario,
                        'dragover,dragenter',
                        lang.hitch(this, function (event) {
                            event.preventDefault();                            
                            domClass.add(this.formulario, 'is-dragover');
                        }));

                    on(this.formulario,
                        'dragleave,dragend',
                        lang.hitch(this, function (event) {
                            domClass.remove(this.formulario, 'is-dragover');
                        }));

                    on(this.formulario,
                        'drop',
                        lang.hitch(this, function (event) {
                            event.preventDefault();
                            domClass.remove(this.formulario, 'is-dragover');
                            let file = null;
                            if (event.dataTransfer.items) {
                                file = event.dataTransfer.items[0].getAsFile();                                
                                // Use DataTransferItemList interface to access the file(s)
                                /* for (var i = 0; i < event.dataTransfer.items.length; i++) {
                                    // If dropped items aren't files, reject them
                                    if (event.dataTransfer.items[i].kind === 'file') {
                                    var file = event.dataTransfer.items[i].getAsFile();
                                    console.log('... file[' + i + '].name = ' + file.name);
                                    }
                                } */
                            } else {
                                file = event.dataTransfer.files[0];
                                // Use DataTransfer interface to access the file(s)
                                /* for (var i = 0; i < event.dataTransfer.files.length; i++){
                                    console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
                                } */
                            }
                            if(this.checkFile(file.name)){
                                switch(this.job.fileType){
                                    case 'shapefile':
                                        this.procesarShapefile(file,'drop');   
                                        break;
                                    case 'CSV':
                                        this.procesarCsv(file,'drop');   
                                        break;
                                    case 'KML':
                                        this.procesarKml(file,'drop');   
                                        break;
                                }                            
                            }else{
                                //INFORMAR QUE NO SE SOPORTA EXTENSION
                                alert('Extension no valida!');
                            }
                        }));

                }

            },
            /**
            * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
            * del postCreate, cuando el nodo ya esta insertado en el DOM.  
            * 
            * @function
            */
            startup: function () {
                this.inherited(arguments);
            },
            procesarInput:function(event){
                console.log(event);
                if(this.checkFile(event.target.value)){        
                    switch(this.job.fileType){
                        case 'shapefile':
                            this.procesarShapefile(null,'input');
                            break;
                        case 'CSV':
                            this.procesarCsv(event.target.files[0],'input');   
                            break;
                        case 'KML':
                            //this.procesarCsv(file,'drop');
                            this.procesarKml(event.target.files[0],'input')   
                            break;
                    }                                
                }else{
                    //INFORMAR QUE NO SE SOPORTA EXTENSION
                    alert('Extension no valida!');
                }                
            },
            procesarShapefile: function (file,origen) {                
                /* let ajaxData = new FormData(this.formulario);
                ajaxData.append(this.formularioInput, file); */
                /* this.job.baseFileName = file.name;
                this.job.fileType = type; */
                let ajaxData = null;
                if(origen == 'input'){
                    ajaxData = this.formulario;
                }else{
                    ajaxData = new FormData();
                    ajaxData.append('file', file);      
                }
                //Define the input params for generate see the rest doc for details
                //http://www.arcgis.com/apidocs/rest/index.html?generate.html
                params = {
                    'name': this.job.baseFileName,
                    'targetSR': this.map.spatialReference,
                    'maxRecordCount': 1000,
                    'enforceInputFileSizeLimit': true,
                    'enforceOutputJsonSizeLimit': true
                };
                //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
                //This should work well when using web mercator.
                let extent = scaleUtils.getExtentForScale(this.map, 40000);
                let resolution = extent.getWidth() / this.map.width;
                params.generalize = true;
                params.maxAllowableOffset = resolution;
                params.reducePrecision = true;
                params.numberOfDigitsAfterDecimal = 0;

                let myContent = {
                    'filetype': this.job.fileType,
                    'publishParameters': JSON.stringify(params),
                    'f': 'json'
                    //'callback.html': 'textarea'
                };
                //use the rest generate operation to generate a feature collection from the zipped shapefile
                request({
                    url: this.urlServiceShp,
                    content: myContent,
                    //form: this.formulario,
                    //form: dom.byId('uploadForm'),
                    form: ajaxData,
                    handleAs: 'json',
                    load: lang.hitch(this, function (response) {
                        if (response.error) {
                            //errorHandler(response.error);
                            console.log('ERROR!!!!!!!!!');
                            console.log(response);
                            return;
                        }
                        console.log('EXITO!!!!!!');
                        console.log(response);                        
                        let ResultLayers = response.featureCollection.layers;
                        let layers = [];
                        for(let i=0; i< ResultLayers.length ; i++){
                            let featureLayer = new FeatureLayer(ResultLayers[i],{                                
                                id: this._generateRandomId(),
                                outFields: ["*"]
                            });
                            featureLayer.xtnAddData = true;
                            featureLayer.name = this.job.baseFileName;
                         /*    if (featureLayer.fullExtent) {
                                if (!fullExtent) {
                                    fullExtent = featureLayer.fullExtent;
                                } else {
                                    fullExtent = fullExtent.union(featureLayer.fullExtent);
                                }
                            } */
                            layers.push(featureLayer);  
                        }                      
                        this.cargarEnLayerExplorer(layers);                       
                        /* var layerName = response.featureCollection.layers[0].layerDefinition.name;
                        dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                        addShapefileToMap(response.featureCollection); */
                    }),
                    error: lang.hitch(this, function(response){console.log('ERROROROROROROROR!!!!!'); return;})
                });
            },
            procesarCsv:function(file,origen){
                if (file.data) {
                    var decoded = this._bytesToString(base64.decode(file.data));
                    this.processCSVData(decoded);
                  }
                  else {
                    var reader = new FileReader();
                    reader.onload = lang.hitch(this,function () {
                      console.log("Finished reading CSV data");
                      this.processCSVData(reader.result);
                    });
                    reader.readAsText(file);
                  }            
            },
            processCSVData: function(data) {
                var newLineIndex = data.indexOf("\n");
                var firstLine = lang.trim(data.substr(0, newLineIndex)); //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
                var separator = this._getSeparator(firstLine);
                var csvStore = new CsvStore({
                  data: data,
                  separator: separator
                });
          
                csvStore.fetch({
                  onComplete: lang.hitch(this,function (items) {
                    var objectId = 0;
                    var featureCollection = this.generateFeatureCollectionTemplateCSV(csvStore, items);
                   // var popupInfo = generateDefaultPopupInfo(featureCollection);
                    //var infoTemplate = new InfoTemplate(buildInfoTemplate(popupInfo));
                    var latField, longField;
                    var fieldNames = csvStore.getAttributes(items[0]);
                    //arrayUtils.forEach(fieldNames, function (fieldName) {
                    for(let w=0; w< fieldNames.length ; w++){
                        let fieldName = fieldNames[w];
                        var matchId;
                        matchId = arrayUtils.indexOf(this.latFieldStrings,fieldName.toLowerCase());
                        if (matchId !== -1) {
                            latField = fieldName;
                        }                
                        matchId = arrayUtils.indexOf(this.longFieldStrings,fieldName.toLowerCase());
                        if (matchId !== -1) {
                            longField = fieldName;
                        }
                    }  
                      
                   // });
          
                    // Add records in this CSV store as graphics
                    for(let z=0;z < items.length ; z++){
                        let item = items[z];
                        var attrs = csvStore.getAttributes(item),
                        attributes = {};
                        // Read all the attributes for  this record/item
                        for(let y=0 ; y < attrs.length; y++){
                            let attr = attrs[y];
                            var value = Number(csvStore.getValue(item, attr));
                            attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
                        }
/* 
                        arrayUtils.forEach(attrs, function (attr) {
                            var value = Number(csvStore.getValue(item, attr));
                            attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
                        }); */
            
                        attributes["__OBJECTID"] = objectId;
                        objectId++;
            
                        var latitude = parseFloat(attributes[latField]);
                        var longitude = parseFloat(attributes[longField]);
            
                        if (isNaN(latitude) || isNaN(longitude)) {
                            return;
                        }
            
                        var geometry = webMercatorUtils
                            .geographicToWebMercator(new Point(longitude, latitude));
                        var feature = {
                            "geometry": geometry.toJson(),
                            "attributes": attributes
                        };
                        featureCollection.featureSet.features.push(feature);
                    }

                    /* arrayUtils.forEach(items, function (item) {
                      var attrs = csvStore.getAttributes(item),
                        attributes = {};
                      // Read all the attributes for  this record/item
                      arrayUtils.forEach(attrs, function (attr) {
                        var value = Number(csvStore.getValue(item, attr));
                        attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
                      });
          
                      attributes["__OBJECTID"] = objectId;
                      objectId++;
          
                      var latitude = parseFloat(attributes[latField]);
                      var longitude = parseFloat(attributes[longField]);
          
                      if (isNaN(latitude) || isNaN(longitude)) {
                        return;
                      }
          
                      var geometry = webMercatorUtils
                        .geographicToWebMercator(new Point(longitude, latitude));
                      var feature = {
                        "geometry": geometry.toJson(),
                        "attributes": attributes
                      };
                      featureCollection.featureSet.features.push(feature); 
                    });*/
                    let layers = [];
                    let featureLayer = new FeatureLayer(featureCollection, {
                      id: 'csvLayer'+this._generateRandomId,
                      name:this.job.baseFileName
                    });
                    layers.push(featureLayer);  
                    this.cargarEnLayerExplorer(layers);

                    /* featureLayer.__popupInfo = popupInfo;
                    map.addLayer(featureLayer);
                    zoomToData(featureLayer);  */
                  }),
                  onError: function (error) {
                    console.error("Error fetching items from CSV store: ", error);
                  }
                });
            },        
            procesarKml:function(file,origen){
                if (file.data) {
                    var decoded = this._bytesToString(base64.decode(file.data));
                    this.processKMLData(decoded);
                  }
                  else {
                    var reader = new FileReader();
                    reader.onload = lang.hitch(this,function () {
                      console.log("Finished reading KML data");
                      this.processKMLData(reader.result);
                    });
                    reader.readAsText(file);
                  }            
            },             
            processKMLData:function(data){
                //console.log(data);
                var kmldata = data;
                var urlServiceKml = this.urlServiceKml;
                var widget = this;    
                var map = this.map;                     
                var layer = new KMLLayer("",{
                    id:'KmlLayer'+this._generateRandomId(),
                    name: this.job.baseFileName,
                    linkInfo: {
                        visibility: false
                    }               
                });
                layer._parseKml = function(){
                    var self = this;
                    this._fireUpdateStart();
                    // Send viewFormat as necessary if this kml layer represents a
                    // network link i.e., in the constructor options.linkInfo is
                    // available and linkInfo has viewFormat property
                    this._io = request({
                        url: urlServiceKml,
                        content: {
                            /*url: this._url.path + this._getQueryParameters(map),*/
                            kmlString: encodeURIComponent(kmldata),
                            model: "simple",
                            folders: "",
                            refresh: this.loaded ? true : undefined,
                            //outSR: dojoJson.toJson(this._outSR.toJson())
                            outSR: JSON.stringify(map.spatialReference)
                        },
                        timeout: 70000,
                        callbackParamName: "callback",
                        load: function(response) {
                            console.warn("response",response);
                            self._io = null;
                            self._initLayer(response);
                            widget.cargarEnLayerExplorer([layer]);


                            /*loader._waitForLayer(layer).then(function(lyr) {
                            var num = 0;
                            lyr.name = fileInfo.fileName;
                            lyr.xtnAddData = true;
                            array.forEach(lyr.getLayers(),function(l) {
                                if (l && l.graphics && l.graphics.length > 0 ) {
                                num += l.graphics.length;
                                }
                            });                 
            
                            _self._setBusy(false);
                            _self._setStatus(i18n.addFromFile.featureCountPattern
                                .replace("{filename}",fileInfo.fileName)
                                .replace("{count}",num)
                            );
                            }).otherwise(function(err) {
                            handleError("kml-_waitForLayer.error",err);
                            }); */
                        },
                        error: function(err) {
                            console.error(err);
                        }
                        },{usePost:true});                       
                };              
                layer._parseKml();

            },
            openFileWindow:function(event){
                this.formularioInput.click();
            },
            _generateRandomId: function() {
                var t = null;
                if (typeof Date.now === "function") {
                  t = Date.now();
                } else {
                  t = (new Date()).getTime();
                }
                var r = ("" + Math.random()).replace("0.", "r");
                return (t + "" + r).replace(/-/g, "");
            },
            checkFile:function(fileName){                
                this.job.fileType = '';
                fileName = fileName.toLowerCase();
                if(fileName.indexOf(".zip") !== -1){
                    this.job.fileType = 'shapefile';
                    domStyle.set(this.shp_icon,'display','inline');
                }
                if(fileName.indexOf(".csv") !== -1){
                    this.job.fileType = 'CSV';
                    domStyle.set(this.csv_icon,'display','inline');
                }
                if(fileName.indexOf(".kml") !== -1){
                    this.job.fileType = 'KML';
                    domStyle.set(this.kml_icon,'display','inline');
                }
                if(this.job.fileType == '')
                    return false;
                domClass.add(this.formularioCampos,'inProcess');
                fileName = fileName.substring(0,fileName.lastIndexOf('.'));
                fileName = fileName.replace("c:\\fakepath\\", "");
                this.job.baseFileName = fileName;
                return true;
            },
            _bytesToString : function (b) {
                console.log("bytes to string");
                var s = [];
                arrayUtils.forEach(b, function (c) {
                  s.push(String.fromCharCode(c));
                });
                return s.join("");
            },
            _getSeparator : function(string) {
                var separators = [",", "      ", ";", "|"];
                var maxSeparatorLength = 0;
                var maxSeparatorValue = "";
                arrayUtils.forEach(separators, function (separator) {
                  var length = string.split(separator).length;
                  if (length > maxSeparatorLength) {
                    maxSeparatorLength = length;
                    maxSeparatorValue = separator;
                  }
                });
                return maxSeparatorValue;
            },
            generateFeatureCollectionTemplateCSV:function (store, items) {
                //create a feature collection for the input csv file
                var featureCollection = {
                  "layerDefinition": null,
                  "featureSet": {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                  }
                };
                featureCollection.layerDefinition = {
                  "geometryType": "esriGeometryPoint",
                  "objectIdField": "__OBJECTID",
                  "type": "Feature Layer",
                  "typeIdField": "",
                  "drawingInfo": {
                    "renderer": {
                      "type": "simple",
                      "symbol": {
                        "type": "esriPMS",
                        "url": "https://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
                        "imageData": "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",
                        "contentType": "image/png",
                        "width": 15,
                        "height": 15
                      }
                    }
                  },
                  "fields": [
                    {
                      "name": "__OBJECTID",
                      "alias": "__OBJECTID",
                      "type": "esriFieldTypeOID",
                      "editable": false,
                      "domain": null
                    }
                  ],
                  "types": [],
                  "capabilities": "Query"
                };
          
                var fields = store.getAttributes(items[0]);
                arrayUtils.forEach(fields, function (field) {
                  var value = store.getValue(items[0], field);
                  var parsedValue = Number(value);
                  if (isNaN(parsedValue)) { //check first value and see if it is a number
                    featureCollection.layerDefinition.fields.push({
                      "name": field,
                      "alias": field,
                      "type": "esriFieldTypeString",
                      "editable": true,
                      "domain": null
                    });
                  }
                  else {
                    featureCollection.layerDefinition.fields.push({
                      "name": field,
                      "alias": field,
                      "type": "esriFieldTypeDouble",
                      "editable": true,
                      "domain": null
                    });
                  }
                });
                return featureCollection;
            },
            cargarEnLayerExplorer: function (layers){
                let contenedorCapasWidget = registry.byNode(query('.layerexplorer')[0]);
                contenedorCapasWidget.addFromFilePane(layers,this.job);
                domStyle.set(this.shp_icon,'display','none');
                domStyle.set(this.csv_icon,'display','none');
                domStyle.set(this.kml_icon,'display','none');
                domClass.remove(this.formularioCampos,'inProcess');
                
            }            
        });
    });