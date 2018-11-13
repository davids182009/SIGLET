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
 * @module SeleccionEspacial 
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
    "dojo/dom-class",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/symbols/SimpleFillSymbol",
    "dojo/on",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/geometry/Point",
    "esri/graphicsUtils",
    "esri/dijit/InfoWindow"
],    
    function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
        template,FilteringSelect,query,topic,registry,Memory,lang,
        IdentifyTask,IdentifyParameters,PopupTemplate,Extent,array,
        Query,FeatureLayer,InfoTemplate,domClass,Draw,Graphic,
        SimpleFillSymbol,on,SimpleLineSymbol,Color,Point,graphicsUtils,InfoWindow) {

        /**
         * Crea un nuevo SeleccionEspacial (Constructor)
         * @class
         * @alias module:SeleccionEspacial     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("SeleccionEspacial", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "widget-SeleccionEspacial",
            id: '',
            listadoCapas:null,           
            EventoIdentify:null,
            map:null,
            alias:{},
            toolbar:null,
            simbologiaSeleccionGeneral:null,
            simbologiaSeleccionEspecifica:null,
            matchGeometry:null,
            mapPoint: null,
            estaDibujando:false,
            filterGeometryType:'',
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
                //this.EventoIdentify=this.map.on("click",lang.hitch(this,this._identificar));
                domClass.add(this.map.infoWindow.domNode, "SIGLETtheme");      
                this._definirSimbologia();
                this._CreateToolbar();          
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
            _definirSimbologia:function(){
                this.simbologiaSeleccionGeneral = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                    new Color([0,99,107]), 2),new Color([0,198,255,0.25])
                );
                
            },
            /**
             * Toolbar que soporta la funcionalidad de crear nuevas 
             * geometrias dibujando sobre el mapa.
             * 
             * @function
             */
            _CreateToolbar:function(){
                this.toolbar = new Draw(this.map);
                this.toolbar.on("draw-end",lang.hitch(this,this.identificarConGeometria));
                on(this.btnPolygon,'click',lang.hitch(this,this.activarHerramientaDibujo('POLYGON')));
                on(this.btnExtent,'click',lang.hitch(this,this.activarHerramientaDibujo('EXTENT')));
                on(this.btnLimpiar,'click',lang.hitch(this,this.limpiarSeleccion));
                on(this.btnLimpiar,'animationend',lang.hitch(this,function(){
                    domClass.remove(this.btnLimpiar,'limpiando');
                }));

            },            
            /**
             *              
             * @function
             */
            activarHerramientaDibujo:function(tipofigura){
                return function(event){
                    if(!this.estaDibujando){
                        if(this.selectCapas.get('value') == 0){
                            this.mensaje.innerHTML = '<i class="icon ion-alert-circled"></i> Seleccione la capa sobre la que desea realizar la operación';
                            return false;
                        }
                        this.map.graphics.clear();
                        this.mensaje.innerHTML = '';
                        this.toolbar.activate(Draw[tipofigura]);
                        this.estaDibujando = true;
                        this.filterGeometryType = tipofigura;
                        switch(tipofigura){
                            case 'POLYGON':
                                domClass.add(this.btnPolygon,'drawing');
                                domClass.add(this.btnExtent,'inactivo');
                                break;
                            case 'EXTENT':
                                domClass.add(this.btnPolygon,'inactivo');
                                domClass.add(this.btnExtent,'drawing');
                                break;
                        }
                    }
                }
            },
            /**
             *              
             * @function
             */
            limpiarSeleccion:function(){                                
                domClass.add(this.btnLimpiar,'limpiando');
                this.map.graphics.clear();
                this.map.infoWindow.hide();
            },
            /**
             * Agrega geometrias dibujadas sobre el mapa
             * 
             * @function
             */
            identificarConGeometria:function(event){  
                this.mapPoint = this.map.extent.getCenter();    
                this.matchGeometry = [];
                let symbol = new SimpleFillSymbol();
                let graphic = new Graphic(event.geometry, symbol);
                this.toolbar.deactivate();                
                this.map.graphics.add(graphic);
                //IDENTIFY SOBRE CAPA
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
                                    identifyParams.geometry = event.geometry;
                                    identifyParams.mapExtent = this.map.extent;
                                    this.consultaIdentify = identifyTask.execute(identifyParams).addCallback(lang.hitch(this,function(response){
                                        //this.dibujarGeometria(response);    
                                        console.log(response); 
                                        //OBTENER PUNTO Y DEFINIR GEOMETRIA                                                                                
                                        this.matchGeometry = response; 
                                        let geometrias = [];
                                        for(let p=0; p< response.length ; p++)
                                            geometrias.push(response[p].feature);                                        
                                        let extent = graphicsUtils.graphicsExtent(geometrias);
                                        this.mapPoint = new Point([extent.xmax,extent.ymax],extent.spatialReference);
                                        this.map.infoWindow.show(this.mapPoint,InfoWindow.ANCHOR_UPPERRIGHT);
                                        this.dibujarGeometria('A');      
                                        /* let features = [];
                                        for(let l=0 ; l< response.length ; l++){
                                            let result = response[l];
                                            let feature = result.feature;
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
                                            features.push(feature);
                                        }                         
                                         console.log(features); */



                                        return array.map(response,lang.hitch(this,function(result){
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
                                        }));       
                                        /* this.map.infoWindow.setFeatures(features);
                                        this.map.infoWindow.show(this.mapPoint); */
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
                            query.geometry = event.geometry.getExtent();
                            //query.geometry = event.geometry;
                            //query.geometry = this.pointToExtent(this.map, event.geometry, 5);
                            query.outFields = [ "*" ];
                            //this.consultaIdentify = targetCapaWidget.layer.selectFeatures(query,
                            this.consultaIdentify = targetLayer.selectFeatures(query,
                            FeatureLayer.SELECTION_NEW,lang.hitch(this,function(response) {
                                this.matchGeometry = response;                                                                            
                                let extent = graphicsUtils.graphicsExtent(response);
                                this.mapPoint = new Point([extent.xmax,extent.ymax],extent.spatialReference);
                                this.map.infoWindow.show(this.mapPoint,InfoWindow.ANCHOR_UPPERRIGHT);
                                this.dibujarGeometria('C');
                                console.log(response);
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
                            }),function(err){
                                console.log(err);
                            });
                            //map.infoWindow.setFeatures([consulta]);
                            //console.log(event.mapPoint);                            
                            //map.infoWindow.show(event.mapPoint);
                            break;               
                    }
                    this.map.infoWindow.setFeatures([this.consultaIdentify]);
                    //console.log(event.mapPoint);                            
                    this.map.infoWindow.show(this.mapPoint,InfoWindow.ANCHOR_UPPERRIGHT);
                    //RESET FLAGS
                    this.estaDibujando = false;
                    this.filterGeometryType = '';
                    domClass.remove(this.btnExtent,'drawing');
                    domClass.remove(this.btnExtent,'inactivo');
                    domClass.remove(this.btnPolygon,'drawing');
                    domClass.remove(this.btnPolygon,'inactivo');

                }    

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
            pointToExtent:function(map, point, toleranceInPixel) {
                pixelWidth = map.extent.getWidth() / map.width;
                toleranceInMapCoords = toleranceInPixel * pixelWidth;
                return new Extent(point.x - toleranceInMapCoords,
                                  point.y - toleranceInMapCoords,
                                  point.x + toleranceInMapCoords,
                                  point.y + toleranceInMapCoords,
                                  map.spatialReference);
            },
            dibujarGeometria:function(tipo){
                this.map.graphics.clear();
                let graphic = null;    
                if(tipo == 'A')            
                    for(let i=0; i<this.matchGeometry.length ; i++){
                        graphic = new Graphic(this.matchGeometry[i].feature.geometry,this.simbologiaSeleccionGeneral);
                        this.map.graphics.add(graphic);
                    }                
                if(tipo != 'B')            
                    for(let i=0; i<this.matchGeometry.length ; i++){
                        graphic = new Graphic(this.matchGeometry[i].geometry,this.simbologiaSeleccionGeneral);
                        this.map.graphics.add(graphic);
                    }                
            }
        });
    });