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
    "dojo/text!./template.html"],
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        TabContainer, ContentPane, domClass, on, lang, scaleUtils,
        request,registry,dom,query,FeatureLayer,template) {

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
            urlService: 'https://www.arcgis.com/sharing/rest/content/features/generate',
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
                            if (event.dataTransfer.items) {
                                this.procesarArchivo(event.dataTransfer.items[0].getAsFile(),'shapefile');
                                
                                // Use DataTransferItemList interface to access the file(s)
                                /* for (var i = 0; i < event.dataTransfer.items.length; i++) {
                                    // If dropped items aren't files, reject them
                                    if (event.dataTransfer.items[i].kind === 'file') {
                                    var file = event.dataTransfer.items[i].getAsFile();
                                    console.log('... file[' + i + '].name = ' + file.name);
                                    }
                                } */
                            } else {
                                this.procesarArchivo(event.dataTransfer.files[0],'shapefile');
                                // Use DataTransfer interface to access the file(s)
                                /* for (var i = 0; i < event.dataTransfer.files.length; i++){
                                    console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
                                } */
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
            procesarArchivo: function (file,type) {
                /* let ajaxData = new FormData(this.formulario);
                ajaxData.append(this.formularioInput, file); */
                this.job.baseFileName = file.name;
                this.job.fileType = type;
                let ajaxData = new FormData();
                ajaxData.append('file', file);
                //Define the input params for generate see the rest doc for details
                //http://www.arcgis.com/apidocs/rest/index.html?generate.html
                params = {
                    'name': file.name,
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
                    'filetype': 'shapefile',
                    'publishParameters': JSON.stringify(params),
                    'f': 'json'
                    //'callback.html': 'textarea'
                };
                //use the rest generate operation to generate a feature collection from the zipped shapefile
                request({
                    url: this.urlService,
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



                        let contenedorCapasWidget = registry.byNode(query('.layerexplorer')[0]);
                        console.log(contenedorCapasWidget);
                        contenedorCapasWidget.addFromFilePane(layers,this.job);
                        /* var layerName = response.featureCollection.layers[0].layerDefinition.name;
                        dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
                        addShapefileToMap(response.featureCollection); */
                    }),
                    error: lang.hitch(this, function(response){console.log('ERROROROROROROROR!!!!!'); return;})
                });
            },
            openFileWindow:function(event){
                console.log('Click');
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
        });
    });