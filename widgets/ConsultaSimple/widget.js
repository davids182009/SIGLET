/**
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la funcionalidad para agregar URL o archivos externos al mapa
* @version 2.0
* @author Jonatan Velasquez Vargas<dyehuty@gmail.com>
* History
* Ajuste en ICBF - Carlos Francizco Corzo
* Ajuste en SIGLET - Juan Carlos Valderrama Gonzalez
* 
*/

/**
 * Descripción Widget
 * @module ConsultaSimple 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",    
    "dojo/text!./template.html",
    "dijit/layout/ContentPane",
    "dojo/text!./basico/templates/basico.html",
    "dojo",
    "dojo/dom",
    "dojo/on",
    'dojo/_base/lang',
    "dojo/Deferred",
    "dijit/registry",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "dojo/topic",
    "dojo/store/Memory",
    "dijit/form/FilteringSelect",
    "dijit/Dialog",
    "dojo/query",
    "widgets/TablaAtributos/widget",
    "dojo/_base/array"
],
    function (declare,
         _WidgetBase, 
         _TemplatedMixin, 
         _WidgetsInTemplateMixin,
         templateMain,
         ContentPane,
         template,
         dojo,
         dom,
         on,
         lang,
         Deferred,
         registry,
         QueryTask,
         Query,
         topic,
         Memory,
         FilteringSelect,
         Dialog,
         query,
         TablaAtributos,
         dojoArray
         ) {

        /**
         * Crea un nuevo ConsultaSimple (Constructor)
         * @class
         * @alias module:ConsultaSimple     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("ConsultaSimple", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: templateMain,
            baseClass: "widget-ConsultaSimple",
            id: '',    
            /**
             * @property {string} listadoCapas - Objeto dojo/store/Memory se almacenan el listado de la capas
             * @instance
             */
            listadoCapas: [],
            /**
             * @property {Object} dataFields - Objeto dojo/store/Memory que almacena las columnas de la tabla
             * @instance
             */
            dataFields: null,
            /**
             * @property {Object} dataFeatures - Objeto dojo/store/Memory que almacena el layer seleccionado o de consulta
             * @instance
             */
            dataFeatures: null,
            /**
             * @property {string} dataString - Variable que almacena si un campo es tipo numerico o tipo string
             * @instance
             */
            dataString: 0,
            urlCapaSeleccionada: '',      
            layerExplorer:null, 
            capaWidgetSelected:null,
            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            tablaAtributos:null,
            postCreate: function () {
                this.inherited(arguments);
                // VERIFICAR QUE LAYER EXPLORER ESTE CREADO
                this.layerExplorer = registry.byNode(query('.layerexplorer')[0]);
                this.verificarCapas().then(lang.hitch(this,function (r) {
                    if (r.length !== 0) {
                        this.listadoCapas = new Memory({ data: r });
                    }else{
                        this.listadoCapas = new Memory({ data: [] });
                    }
                }));
                //VERIFICAR LA EXISTENCIA DEL WIDGET TABLA DE ATRIBUTOS
                this.tablaAtributos = registry.byId('Widget_TablaAtributos');
                if(this.tablaAtributos == undefined)
                    this.tablaAtributos = new TablaAtributos();
                
            },
        
            /**
             * 
             * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
             * del postCreate, cuando el nodo ya esta insertado en el DOM.
             * se crea el objeto TabContainer que permite adicionar dos ContentPane
             * cada ContentPane corresponde a consulta simple y consulta avanzada
             * se ejecuta el metodo que activa los botones de la consulta simple y avanzada
             * suscribe evento que identificar una nueva capa cargada o eliminada del explorador de capas
             * @memberof module:widgets/QueryByAtrr#   
             * 
             */
            startup: function () {
                var cp1 = new ContentPane({
                    title: "Consulta Simple",
                    content: template
                }, "tabContainerQuerySimple");                
                cp1.startup();
                //configuracion botones y selects de la calculadora
                this.configurarBotones();
                topic.subscribe("identificarWidget", lang.hitch(this, this._actualizarListadoCapas));
                on(dom.byId("openTablaAtributos"),'click',lang.hitch(this,this.abrirTablaAtributos));
                on(dom.byId("closeTablaAtributos"),'click',lang.hitch(this,this.cerrarTablaAtributos));
            },   
        
            /**
             * actualiza el combobox relacionado con las capas disponibles para consultar
             * @memberof module:widgets/QueryByAtrr#
             * @param {Object} e - objeto que con id, nombre de la capa y una accion ya sea crear crear o quitar   
             */
            _actualizarListadoCapas: function (e) {
                layerCapa = this.layerExplorer.listarCapas();
                if (!e.name.startsWith("Buffer")) {
                    if (e.accion === 'CREAR') {
            
                        this.listadoCapas.put({
                        id: e.idWidget,
                        name: e.name,
                        /*          idWidget:e.idWidget,
                                    url:e.URL*/
                        });
            
                    } else {
                        this.listadoCapas.remove(e.idWidget);
                    }
                    registry.byId("calCapa").set("store", this.listadoCapas);
                }
            },
        
            /**
             * 
             * Funcion que permite verificar las capas activas en el layerExplorer
             * @memberof module:widgets/QueryByAtrr#
             * @returns {Promise} Promise object que representa la lista de capa activas.
             * 
             */
            verificarCapas: function () {
                var deferred = new Deferred();
                layerCapa = this.layerExplorer.listarCapas();
                var lista = [];
                for (i = 0; i < layerCapa.length; i++) {
                lista[i] = {
                    /*            id:layerCapa[i].infoCapa.id,*/
                    id: layerCapa[i].id,
                    name: '' + layerCapa[i].name,
                    /*            url:layerCapa[i].infoCapa.URL+'/'+layerCapa[i].infoCapa.NOMBRECAPA*/
                };
                }
                deferred.resolve(lista);
                return deferred.promise;
            },
        
            /**
             * Funcion que activa los botones de las consultas al igual que los combobox
             * @memberof module:widgets/QueryByAtrr#
             */
            configurarBotones: function () {
                var mapa = this.map;
                var url = '';
                var capaConten = '';
                -
                //on click buttom consulta simple                 
                on(dom.byId("consultaSimple"), "click", dojo.hitch(this, function (evt) {
                    let capa = registry.byId("calCapa").get('value');
                    let atrributo = registry.byId("calAtributo").get('value');
                    let valor = registry.byId("calValor").get('value');
        
                    var mensajeValidacion = " campos: ";
                    if (capa == '' || capa == undefined) {
                        mensajeValidacion += " Seleccione una capa,";
                    }
                    if (atrributo == '' || atrributo == undefined) {
                        mensajeValidacion += " Seleccione un atributo,";
                    }
                    if (valor == '' || valor == undefined) {
                        mensajeValidacion += " Seleccione un campo,";
                    }
                    if (mensajeValidacion == " campos: ") {
                        this._consultaOpcion(capa, atrributo, valor);
                    } else {
                        var msg = "Verificar " + mensajeValidacion.slice(0, -1) + " por favor.";
                        this.generarDialog(msg);
                    }
        
                }));
                //on click buttom limpiar consulta simple 
                on(dom.byId("limpiarConsultaSimple"), "click", dojo.hitch(this, function (evt) {
                    registry.byId("calCapa").reset();
                    registry.byId("calAtributo").reset();
                    registry.byId("calValor").reset();
                }));
        
                //crear select de capa en consulta simple
                var calCapa = new FilteringSelect({
                    name: "select2",
                    id: "calCapa",
                    store: this.listadoCapas,
                    searchAttr: "name",
                    style: "height: 33px; width: 100%;",
                    onChange: dojo.hitch(this, this.poblarAtributos),
                }, "divBasico").startup();
        
        
                registry.byId("calAtributo").on("change", dojo.hitch(this, this.poblarValores));
        
        
            },
           

        
            /**
             * función que permite limpiar los combobox al gual que el textArea
             * @memberof module:widgets/QueryByAtrr# 
             */
            limpiarValores: function () {
            },
        
            /**
             *
             * Responde al evento de cargar los fields o campos disponibles de una determinada capa en un combobox
             * cuando esta es seleccionada por consulta simple 
             * @memberof module:widgets/QueryByAtrr#
             * @param {Object} e - objecto que contiene la información de una determinada capa  
             *  
             */
            poblarAtributos: function (e) {        
                let fields=null;
                this.capaWidgetSelected = this.layerExplorer.getGraphicCapaWidget(e);
                switch(this.capaWidgetSelected.tipo){
                    case 'A':
                    case 'D':
                        fields = this.capaWidgetSelected.layer.fields;
                        //this.dataFeatures = this.capaWidgetSelected.layer.graphics;
                        this.urlCapaSeleccionada = this.capaWidgetSelected.infoCapa.URL + '/' + this.capaWidgetSelected.infoCapa.NOMBRECAPA;                    
                        break;
                    default:
                        switch(this.capaWidgetSelected.subTipo){
                            case 'KML':                                
                            case 'CSV':
                            case 'shapefile':
                                fields = this.capaWidgetSelected.layer[0].fields;
                                this.dataFeatures = this.capaWidgetSelected.layer[0].graphics;
                                break;
                        } 
                        break;
                }
                let array = [];
                dojoArray.forEach(fields, function(x){
                    array.push({
                        "id": x.name,
                        "name": x.name,
                        "type": x.type
                    });
                });
                array.sort(function (a, b){
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                this.dataFields = new Memory({ data: array });
                registry.byId("calAtributo").reset();
                registry.byId("calValor").reset();
                registry.byId("calAtributo").set('store', this.dataFields);               
            },
        
            /**
             *
             * Responde al evento de cargar los atributos disponibles de una determinada capa en un combobox
             * cuando esta es seleccionada por consulta simple 
             * @memberof module:widgets/QueryByAtrr#
             * @param {string} e - nombre de la capa seleccionada  
             *  
             */
            poblarValores: function (e) {
                let tipoField;
                var array = [];
                var uniqueValuesArray=[];
                for (let i = 0; i < this.dataFields.data.length; i++) {
                    if (e == this.dataFields.data[i].id) {
                        tipoField = this.dataFields.data[i];
                    }
                }
                let query = new Query();
                if (tipoField != undefined) 
                    query.outFields = [tipoField.id];
                query.where = "1=1";
                query.returnGeometry = false;
                switch(this.capaWidgetSelected.tipo){
                    case 'A':
                    case 'D': 
                        let queryTask = new QueryTask(this.urlCapaSeleccionada);        
                        queryTask.execute(query,lang.hitch(this,function(resultados){
                            this.features2values(resultados.features);
                        }));                                        
                        break;
                    case 'C':
                    case 'E':
                        this.features2values(this.dataFeatures);                    
                    break;
                }
            },
            features2values:function(features){
                let nombreAtributo = registry.byId("calAtributo").get('value');
                let array=[];
                let ListaIndicadores=[];         
                dojoArray.forEach(features, lang.hitch(this, function (feature){                                                         
                    if (feature.attributes[nombreAtributo] != undefined){
                        if(dojoArray.indexOf(ListaIndicadores, feature.attributes[nombreAtributo])  == -1){
                            let obj=null;
                            if(typeof feature.attributes[nombreAtributo] === 'string')
                                obj = {                                    
                                    "id": "'" + feature.attributes[nombreAtributo] + "'",
                                    "name": feature.attributes[nombreAtributo]                                        
                                }                            
                            else
                                obj = {                                    
                                    "id": feature.attributes[nombreAtributo],
                                    "name": feature.attributes[nombreAtributo]                                        
                                }
                            array.push(obj);
                            ListaIndicadores.push(feature.attributes[nombreAtributo]);
                        }
                    }
                                    
                }));          
                array.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                let arrayValores = new Memory({ data: array });
                registry.byId("calValor").reset();
                registry.byId("calValor").set('store', arrayValores);                
            },
            
            
                /**
             * funcion donde se genera la consulta de acuerdo a los parametros establecidos y al tipo de consulta
             * si genera resultados ejecuta la funcion para que la información sea visualizada desde el widget
             * tabla de atributos
             * @memberof module:widgets/QueryByAtrr#     
             * @param {string} consulta - Tipo de consulta
             * @param {Object} capa- capa seleccionada para los tipos de consulta
             * @param {string} atrributo - atributo seleccionado para la consulta simple
             * @param {string} valor - Valor asociado para la consulta simple
             * @param {string} especializada- caracter que indica el texto para la consulta avanzada
             * 
             */
            _consultaOpcion: function (capa,atrributo,valor){    
                //listar las capas en el visor
                //layerExplorer = registry.byId('ContenerCapas_1');            
                switch(this.capaWidgetSelected.tipo){
                    case 'A':
                    case 'D':
                        let query = new Query();                   
                        query.outFields = ['*'];     
                        if(typeof valor === 'string'){       
                            //Verificar apóstrofe (apostrophe)
                            let posicionApostrofe = valor.substring(1,valor.length-1).indexOf('\'');
                            if(posicionApostrofe >0){
                                posicionApostrofe++;
                                valor=valor.substring(0,posicionApostrofe)+'\''+valor.substring(posicionApostrofe);
                            }
                        }
                        query.where = atrributo +" = "+ valor;
                        query.returnGeometry = false;
                        let queryTask = new QueryTask(this.urlCapaSeleccionada);                    
                        queryTask.execute(query,lang.hitch(this,function(resultado){
                            this.tablaAtributos.setDataFeatures(resultado,this.capaWidgetSelected);
                            }),function(error){
                                console.log(error);
                        });
                        break;
                    default:
                        let result = {};
                        result.fields = this.capaWidgetSelected.layer[0].fields;
                        result.features = [];
                        dojoArray.forEach(this.dataFeatures,function(feature){ 
                            if(typeof feature.attributes[atrributo] === 'string'){                       
                                if("'"+feature.attributes[atrributo]+"'" == valor)
                                    result.features.push(feature);
                            }else{
                                if(feature.attributes[atrributo] == valor)
                                    result.features.push(feature);
                            }
                        });                    
                        this.tablaAtributos.setDataFeatures(result,this.capaWidgetSelected);
                        break;

                }              
            },
            /**
             * Funcion que permite ajustar el panel a unas dimennsione predefinidas.
             * @memberof module:widgets/QueryByAtrr#        
             * 
             */
            _ajustarPanel: function () {
                panel = this.getPanel();
                panel.position.width = 300;
                panel.position.height = 290;
                panel.position.left = 50;
                panel.position.top = 180;
                panel._originalBox = {
                w: panel.position.width,
                h: panel.position.height,
                l: panel.position.left,
                t: panel.position.top
                };
                panel.setPosition(panel.position);
                // panel.panelManager.normalizePanel(panel);
        
                if (window.appInfo.isRunInMobile) {
                size = {
                    w: window.innerWidth,
                    h: window.innerHeight
                };
                }
        
            },
        
            /**
             * Funcion que abre el widget de tabla de atributos y 
             * realiza un publish con la información de la consulta y de la capa
             * @memberof module:widgets/QueryByAtrr#  
             * @param {Object} response - objeto con la información de la consulta
             * @param {Object} capaSalida - objeto con la información de la capa de consulta
             * 
             */
            abrirTablaConsulta: function (response, capaSalida) {
                wm = WidgetManager.getInstance();
                MetaDatoWidget = wm.getWidgetById('widget_TablaAtributos');
                thisWidget = this;
                confWidget = wm.appConfig.getConfigElementById('widget_TablaAtributos');
                if (MetaDatoWidget == null) {
                wm.loadWidget(confWidget).then(lang.hitch(this, function () {
                    PanelManager.getInstance().showPanel(confWidget).then(lang.hitch(this, function () {
                    dojo.style("widget_TablaAtributos_panel", {
                        "display": "block"
                    });
                    wm.openWidget(confWidget.id);
                    topic.publish("tablaAtributosConsulta",
                        {
                        results: response,
                        obj: capaSalida
                        }
                    );
                    }));
                }));
                } else {
                PanelManager.getInstance().showPanel(MetaDatoWidget).then(lang.hitch(this, function () {
                    dojo.style("widget_TablaAtributos_panel", {
                    "display": "block"
                    });
                    wm.openWidget(confWidget.id);
                    topic.publish("tablaAtributosConsulta",
                    {
                        results: response,
                        obj: capaSalida
                    }
                    );
                }));
                }
            },
            /**
             * funcion para generar mensaje
             * @memberof module:widgets/QueryByAtrr#
             * @param {string} msg - texto del mensaje a visualizar
             *
             */
            generarDialog: function(msg) {
                myDialog = new Dialog({
                title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
                    ' <b>CONSULTA</b>',
                content: msg,
                style: "width: 300px"
                });
                myDialog.show();
            },
            abrirTablaAtributos:function(event){
                this.tablaAtributos.floatingPane.show();
                this.tablaAtributos.floatingPane.bringToTop();
            },
            cerrarTablaAtributos:function(event){
                this.tablaAtributos.floatingPane.hide();
            },
            onDestroy:function(){
                
            }                    
        });
    });