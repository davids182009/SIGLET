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
 * @module identificar 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",    
    "dojo/text!./template.html",
    "dijit/form/FilteringSelect",
    "dojo/query",
    "dojo/topic",
    "dijit/registry",
    "dojo/store/Memory",
    "dojo/_base/lang",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/dijit/PopupTemplate",
    "esri/geometry/Extent",
    "dojo/_base/array",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/InfoTemplate",
    "dojo/dom-class"
],    
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        template,FilteringSelect,query,topic,registry,Memory,lang,
        IdentifyTask,IdentifyParameters,PopupTemplate,Extent,array,
        Query,FeatureLayer,InfoTemplate,domClass) {

        /**
         * Crea un nuevo identificar (Constructor)
         * @class
         * @alias module:identificar     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("identificar", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "widget-identificar",
            id: '',
            listadoCapas:null,           
            EventoIdentify:null,
            map:null,
            alias:{},
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
                this.EventoIdentify=this.map.on("click",lang.hitch(this,this._identificar));
                domClass.add(this.map.infoWindow.domNode, "SIGLETtheme");
                



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
                                    this.consultaIdentify = identifyTask.execute(identifyParams).addCallback(lang.hitch(this,function(response){
                                        console.log(response);
                                        /* let featuresList= [];
                                        for(let i=0 ; i< response.length; i++){
                                        let feature = response[i].feature;
                                        let layerName = response[i].layerName;
                                        let plantilla = new PopupTemplate();
                                        plantilla.title = 'Capa - ';
                                        let titulos= Object.keys(feature.attributes);
                                        let valores= Object.values(feature.attributes);
                                        let contenido = '<div class="WidgetIdentifyLabel">'+layerName+'</div>'
                                        contenido  += '<table class="tablePopupIdentificar">';
                                        for(i=0;i<titulos.length;i++){
                                            contenido += '<tr>';    
                                            contenido += '<th>'+titulos[i]+':</th>';    
                                            contenido += '<td>'+valores[i]+'</td>';    
                                            contenido += '</tr>';    
                                        }
                                        contenido += '<table>'
                                        plantilla.content=contenido;
                                        feature.setInfoTemplate(plantilla);
                                        featuresList.push(feature);
                                        }
                                        console.log(featuresList);
                                        return featuresList; */
                                        return array.map(response,function(result){
                                            feature = result.feature;
                                            layerName = result.layerName;

                                            //feature.attributes.layerName = layerName;
                                            //console.log(result);
                                            plantilla = new PopupTemplate();
                                            plantilla.title = 'Capa - ';
                                            titulos= Object.keys(feature.attributes);
                                            valores= Object.values(feature.attributes);
                                            contenido = '<div class="WidgetIdentifyLabel">'+layerName+'</div>'
                                            contenido  += '<table class="tablePopupIdentificar">';
                                            for(i=0;i<titulos.length;i++){
                                                contenido += '<tr>';    
                                                contenido += '<th>'+titulos[i]+':</th>';    
                                                contenido += '<td>'+valores[i]+'</td>';    
                                                contenido += '</tr>';    
                                            }
                                            contenido += '<table>'
                                            plantilla.content=contenido;
                                            feature.setInfoTemplate(plantilla);
                                            return feature;                                    
                                        });                      
                                    }));
                                    console.log(this.consultaIdentify);
                                    //this.map.infoWindow.setFeatures([this.consultaIdentify]);
                                    //console.log(event.mapPoint);                            
                                    //this.map.infoWindow.show(event.mapPoint);
                                break;
                                }
                                break;
                            case "B"://CAPA TEMATICA                
                            case "C"://CAPA ARCHIVO EXTERNO
                                query = new Query();
                                query.geometry = this.pointToExtent(this.map, event.mapPoint, 5);
                                query.outFields = [ "*" ];
                                //this.consultaIdentify = targetCapaWidget.layer.selectFeatures(query,
                                this.consultaIdentify = targetLayer.selectFeatures(query,
                                FeatureLayer.SELECTION_NEW,lang.hitch(this,function(response) {
                                    return array.map(response,lang.hitch(this,function(result){
                                    feature = result;
                                    layerName = this.selectCapas.item.name;      
                                    //feature.attributes.layerName = layerName;
                                    //plantilla = new PopupTemplate();                      
                                    plantilla = new InfoTemplate();                      
                                    plantilla.setTitle('Informacion elemento');
                                    titulos= Object.keys(feature.attributes);
                                    valores= Object.values(feature.attributes);
                                    contenido = '<div class="WidgetIdentifyLabel">'+layerName+'</div>'
                                    contenido  += '<table class="tablePopupIdentificar">';
                                    for(i=0;i<titulos.length;i++){
                                        contenido += '<tr>';    
                                        contenido += '<th>'+this.alias[titulos[i]]+':</th>';    
                                        contenido += '<td>'+valores[i]+'</td>';    
                                        contenido += '</tr>';    
                                    }
                                    contenido += '<table>'
                                    plantilla.setContent(contenido);
                                    feature.setInfoTemplate(plantilla);
                                    return feature;                                    
                                    }));
                                }));
                                //map.infoWindow.setFeatures([consulta]);
                                //console.log(event.mapPoint);                            
                                //map.infoWindow.show(event.mapPoint);
                                break;               
                    }
                    this.map.infoWindow.setFeatures([this.consultaIdentify]);
                    //console.log(event.mapPoint);                            
                    this.map.infoWindow.show(event.mapPoint);
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
            }
        });
    });