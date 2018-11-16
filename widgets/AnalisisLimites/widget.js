/**
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
* @version 1.0
* @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
* History
* 
*/

/**
 * Descripción Widget
 * @module AnalisisLimites 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",    
    "dojo/text!./template.html",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/form/Select",
    "dijit/form/NumberTextBox",
    "dijit/form/FilteringSelect",
    "dojo/query",
    "dijit/registry",
    "dojo/store/Memory",
    "dojo/topic",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/graphic",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "dojo/_base/array",
    "./feature/WidgetFeature",  
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/geometry/Extent",
    "esri/geometry/geometryEngine",
    "dojo/dom-class"
],
    function (declare,
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        template,
        TabContainer,
        ContentPane,
        Select,
        NumberTextBox,
        FilteringSelect,
        query,
        registry,
        Memory,
        topic,
        lang,
        GraphicsLayer,
        SimpleFillSymbol,
        SimpleLineSymbol,
        Color,
        Graphic,
        IdentifyTask,
        IdentifyParameters,
        array,
        WidgetFeature,
        Query,
        FeatureLayer,
        Extent,
        geometryEngine,
        domClass

        ) {

        /**
         * Crea un nuevo AnalisisLimites (Constructor)
         * @class
         * @alias module:AnalisisLimites     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("AnalisisLimites", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "widget-AnalisisLimites",
            id: '',    
            map:null,       
            EventoIdentify:null,
            layer:null,
            simbologiaPolygon:null,
            countFeatures:0,
            features:[],
            limitFeatures:4,
            ids:0,
            WidgetFeatureTarget:'0',
            estaEliminando:false,
            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            postCreate: function () {
                this.inherited(arguments);
                //OBTENER CAPAS DE EXPLORADOR DE CAPAS
                this.map = registry.byId('EsriMap').map;
                let layerExplorer = registry.byNode(query('.layerexplorer')[0]);
                let lista = new Array();
                listCapaWidget=layerExplorer.listarCapas();
                console.log(listCapaWidget);
                for(i=0;i<listCapaWidget.length;i++){
                    lista[i]={
                        name:''+listCapaWidget[i].name,
                        idWidget:listCapaWidget[i].id
                    };            
                }
                this.listadoCapas= new Memory({
                    idProperty:'idWidget',
                    data:lista
                });
                this.selectCapas.set('store',this.listadoCapas);
                topic.subscribe("identificarWidget",lang.hitch(this,this._actualizarListadoCapas));
                topic.subscribe("identificarWidgetFeature",lang.hitch(this,this._setAttributes));
                topic.subscribe("RemoveWidgetFeature",lang.hitch(this,this.removeFeature));
                //CREAR EVENTO Y GRAPHIC LAYER EN EL MAPA
                this.EventoIdentify=this.map.on("click",lang.hitch(this,this._identificar));
                this.layer = new GraphicsLayer('widget_analisis_limites');
                this.simbologiaPolygon = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                    new Color([0,99,107]), 2),new Color([0,198,255,0.25])
                );
                this.map.addLayer(this.layer);
            },
            /**
            * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
            * del postCreate, cuando el nodo ya esta insertado en el DOM.  
            * 
            * @function
            */
            startup: function(){
                this.inherited(arguments);
            },
            /**
             * Responde a la publicacion de informacion del widget 
             * LayerExplorer - Alimenta store de capas
             * 
             * @function
             */
            _actualizarListadoCapas:function(e){
                if(e.accion === 'CREAR')
                this.listadoCapas.put({
                    //id:parseInt(e.id),
                    name:e.name,
                    idWidget:e.idWidget});
                else
                this.listadoCapas.remove(e.idWidget);
            },
            /**
             * Responde a la publicacion de informacion de 
             * WidgetFeature - Atributos de la geometria
             * 
             * @function
             */
            _setAttributes:function(data){
                
                if(data.widgetFeatureId != this.WidgetFeatureTarget){
                    if(this.WidgetFeatureTarget != '0'){
                        let oldFeature = registry.byId(this.WidgetFeatureTarget);
                        domClass.remove(oldFeature.domNode,'focus');                                                
                    }
                    this.WidgetFeatureTarget = data.widgetFeatureId;
                    let newFeature = registry.byId(this.WidgetFeatureTarget);
                    domClass.add(newFeature.domNode,'focus');
                    this.indetifyCanvas.innerHTML = data.AttributesContent;    
                    
                }
            },
            /**
             * Responde para el evento click sobre el mapa, ejecuta la 
             * tarea de identificar.
             * 
             * @memberOf Identificar
             * @private
             * @instance
             * @callback
             * 
             */
            _identificar:function(event){
                //console.log('Identificar trabajando..');
                if(this.estaEliminando)
                    return false;
                let targetLayer = null;
                let fields = [];
                capaSelecionada=this.selectCapas.get('value');
                if(capaSelecionada.length>0){
                    targetCapaWidget = registry.byId(this.listadoCapas.get(capaSelecionada).idWidget);
                    //OBTENER ALIAS DE CAMPOS                    
                    switch(targetCapaWidget.tipo){
                        case 'A'://ESPACIAL
                        case 'B'://TEMATICA
                        fields= targetCapaWidget.layer.fields;
                        targetLayer = targetCapaWidget.layer;
                        break;
                        case 'C'://ARCHIVO EXTERNO
                        fields= targetCapaWidget.layer[0].fields;
                        targetLayer = targetCapaWidget.layer[0];
                        break;
                    }                    
                    //console.log(fields);
                    json = '{';
                    for(var i=0;i<fields.length;i++){
                        if(typeof fields[i].alias != 'undefined')
                            json += '"'+fields[i].name+'":"'+fields[i].alias+'",';  
                        else  
                            json += '"'+fields[i].name+'":"'+fields[i].name+'",';
                    }
                    json = json.substring(0,(json.length-1));
                    json += '}';
                    this.alias = JSON.parse(json);
                    console.log(this.alias);

                    switch(targetCapaWidget.tipo){
                        case "A"://CAPA ESPACIAL
                            switch(targetCapaWidget.infoCapa.TIPO){
                                case "REST":
                                    identifyTask = new IdentifyTask(targetCapaWidget.infoCapa.URL);
                                    identifyParams = new IdentifyParameters();
                                    identifyParams.tolerance = 3;
                                    identifyParams.returnGeometry = true;
                                    identifyParams.layerIds = [parseInt(targetCapaWidget.infoCapa.NOMBRECAPA)];
                                    identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
                                    identifyParams.width = this.map.width;
                                    identifyParams.height = this.map.height;
                                    identifyParams.geometry = event.mapPoint;
                                    identifyParams.mapExtent = this.map.extent;
                                    identifyTask.execute(identifyParams).addCallback(lang.hitch(this,function(response){
                                        array.map(response,lang.hitch(this,function(result){
                                            this.addFeature(result.feature);
                                        }));                      
                                    }));
                                break;
                                }
                                break;
                            case "B"://CAPA TEMATICA                
                            case "C"://CAPA ARCHIVO EXTERNO
                                query = new Query();
                                query.geometry = this.pointToExtent(this.map, event.mapPoint, 1);
                                //query.geometry = event.mapPoint;
                                query.outFields = [ "*" ];
                                //this.consultaIdentify = targetCapaWidget.layer.selectFeatures(query,
                                this.consultaIdentify = targetLayer.selectFeatures(query,
                                FeatureLayer.SELECTION_NEW,lang.hitch(this,function(response) {
                                    array.map(response,lang.hitch(this,function(result){
                                        this.addFeature(result);
                                    }));
                                }));
                                break;               
                    }                  
                }        
            },
            pointToExtent:function(map, point, toleranceInPixel) {
                pixelWidth = map.extent.getWidth() / map.width;
                toleranceInMapCoords = toleranceInPixel * pixelWidth;
                return new Extent(point.x - toleranceInMapCoords,
                                  point.y - toleranceInMapCoords,
                                  point.x + toleranceInMapCoords,
                                  point.y + toleranceInMapCoords,
                                  map.spatialReference);
            },
            addFeature:function(feature){
                if(this.countFeatures == this.limitFeatures)
                    return false;
                if(typeof feature.symbol == 'undefined')
                    feature = new Graphic(feature);
                let features = registry.findWidgets(this.canvasList);
                for(let j=0; j < features.length ; j ++){
                    if(geometryEngine.equals(features[j].graphic.geometry,feature.geometry))
                        return false;
                }                        
                
                feature.setSymbol(this.simbologiaPolygon);
                this.layer.add(feature);
                this.ids++;
                this.countFeatures++;
                let element=new WidgetFeature({
                    id:'Analisis_limite_elemento_'+this.ids,
                    graphic:feature,
                    position:this.countFeatures
                });
                element.placeAt(this.canvasList,"last");   
                //this.features.push(element);                                                     
            },
            ActivateRemoveFeature:function(event){
                let features = [];
                features = query(".widget-WidgetFeature", this.canvasList);
                if(this.estaEliminando){
                    this.estaEliminando = false;
                    domClass.remove(this.btnRemove,'active');
                    for(let q=0; q < features.length ; q++){
                        domClass.remove(features[q],'target');
                    }
                }else{
                    this.estaEliminando = true;  
                    domClass.add(this.btnRemove,'active');
                    for(let q=0; q < features.length ; q++){
                        domClass.add(features[q],'target');
                    }
                }
            },
            removeFeature:function(idFeature){
                let feature2remove = registry.byId(idFeature);
                this.layer.remove(feature2remove.graphic);
                feature2remove.destroy();
                let features = registry.findWidgets(this.canvasList);
                let q=0;
                for(q=0; q < features.length ; q++){
                    features[q].position = q+1;   
                    features[q].domNode.innerHTML = features[q].position;
                }
                this.countFeatures = q;
                if(this.WidgetFeatureTarget == idFeature){
                    this.WidgetFeatureTarget = '0';
                }
            }                   
        });
    });