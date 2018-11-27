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
    "widgets/TablaAtributos/widget"
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
         TablaAtributos
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
                if (this.listadoCapas.length === 0) {
                this.listadoCapas = new Memory({ data: [] });
                }
                //contenedor de los paneles
                // var tc = new TabContainer({
                //     style: "height: 90%; width: 95%; border-style: solid; border-width: 1px; border-color:#b5bcc7; left: 10px; top: 10px; buttom:10px",
                //     tabStrip: "true",
                // }, "tabContainerQuerySimple");
                //panel consulta simple
                var cp1 = new ContentPane({
                title: "Consulta Simple",
                //content: template
                content: template
                }, "tabContainerQuerySimple");
                // tc.addChild(cp1);
                //panel consulta avanzada
                // var cp2 = new ContentPane({
                //      title: "Avanzada",
                //      content: template_dos,
                //      selected: true
                // });
                // tc.addChild(cp2);
                cp1.startup();
                //configuracion botones y selects de la calculadora
                this.configurarBotones();
                topic.subscribe("identificarWidget", lang.hitch(this, this._actualizarListadoCapas));
                on(dom.byId("openTablaAtributos"),'click',lang.hitch(this,this.abrirTablaAtributos));
                on(dom.byId("closeTablaAtributos"),'click',lang.hitch(this,this.cerrarTablaAtributos));
            },
        
            /**
             * 
             * Funcion del ciclo de vida del Widget en Dojo,se dispara cada
             * vez que el usuario selecciona la opcion de consulta.
             * ejecuta la opcion de limpiarValores.
             * ejecuta la opcion de ajustarPanel.
             * @memberof module:widgets/QueryByAtrr#
             * 
             */
            onOpen: function () {
                //console.log('onOpen');  
                /*        this.limpiarValores();*/
                this._ajustarPanel();
                dijit.byId("calCapa").reset();
                dijit.byId("calAtributo").reset();
                dijit.byId("calValor").reset();
                //console.log(this.listadoCapas);
            },
        
            /**
             * actualiza el combobox relacionado con las capas disponibles para consultar
             * @memberof module:widgets/QueryByAtrr#
             * @param {Object} e - objeto que con id, nombre de la capa y una accion ya sea crear crear o quitar   
             */
            _actualizarListadoCapas: function (e) {
                //console.log(e);
                //let layerExplorer = registry.byNode(query('.layerexplorer')[0]);
                layerCapa = this.layerExplorer.listarCapas();
                //console.log(layerCapa);     
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
                dijit.byId("calCapa").set("store", this.listadoCapas);
                dijit.byId("calCapa").reset();
                dijit.byId("calAtributo").reset();
                dijit.byId("calValor").reset();
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
                //console.log('verificar')
                var deferred = new Deferred();
                //let layerExplorer = registry.byNode(query('.layerexplorer')[0]);
                layerCapa = this.layerExplorer.listarCapas();
                //console.log(layerCapa);
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
                    console.log('Consulta simple - Action');
                    let capa = dijit.byId("calCapa").get('value');
                    let atrributo = dijit.byId("calAtributo").get('value');
                    let valor = dijit.byId("calValor").get('value');
                    let especializada = '';
        
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
                        this._consultaOpcion('simple', capa, atrributo, valor, especializada);
                    } else {
                        var msg = "Verificar " + mensajeValidacion.slice(0, -1) + " por favor.";
                        this.generarDialog(msg);
                    }
        
                }));
                //on click buttom limpiar consulta simple 
                on(dom.byId("limpiarConsultaSimple"), "click", dojo.hitch(this, function (evt) {
                dijit.byId("calCapa").reset();
                dijit.byId("calAtributo").reset();
                dijit.byId("calValor").reset();
                }));
        
                //crear select de capa en consulta simple
                var calCapa = new FilteringSelect({
                name: "select2",
                id: "calCapa",
                store: this.listadoCapas,
                searchAttr: "name",
                style: "height: 33px; width: 100%;",
                onChange: dojo.hitch(this, this.traerCamposSimple),
                }, "divBasico").startup();
        
        
                dijit.byId("calAtributo").on("change", dojo.hitch(this, this.traerAtributosSimple));
        
        
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
            traerCamposSimple: function (e) {
        
                //layerExplorer = registry.byId('ContenerCapas_1');
                layerCapa = this.layerExplorer.listarCapas();
                //console.log(layerCapa);
        
                dojo.forEach(layerCapa, dojo.hitch(this, function (x) {
                if (x.id == e) {
                    if (x.tipo == 'A' || x.tipo == 'B') {
                    fields = x.layer.fields;
                    this.dataFeatures = x.layer.graphics;
                    this.urlCapaSeleccionada = x.infoCapa.URL + '/' + x.infoCapa.NOMBRECAPA;
                    }
                    // } else {
                    //   if (x.subTipo != "KML") {
                    //     if (x.subTipo == "GPX") {
                    //       if (x.layer[1] === undefined) {
                    //         fields = x.layer[0].fields;
                    //         this.dataFeatures = x.layer[0].graphics;
                    //       } else {
                    //         fields = x.layer[1].fields;
                    //         this.dataFeatures = x.layer[1].graphics;
                    //       }
                    //     } else {
                    //       fields = x.layer[0].fields;
                    //       this.dataFeatures = x.layer[0].graphics;
                    //     }
                    //   } else {
                    //     /*            fields = x.layer[0]._fLayers[0].fields;
                    //                 this.dataFeatures = x.layer[0]._fLayers[0].graphics;  */
        
                    //     fields = x.layer[0].fields;
                    //     this.dataFeatures = x.layer[0].graphics;
                    //   }
                    // }
                    //console.log(x.layer.graphics);
                    //console.log(fields);                 
                    //console.log(this.dataFeatures);                 
                    var array = [];
                    dojo.forEach(fields, function (x) {
                    array.push({
                        "id": x.name,
                        "name": x.name,
                        "type": x.type
                    });
                    });
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
                    this.dataFields = new Memory({ data: array });
                    dijit.byId("calAtributo").reset();
                    dijit.byId("calValor").reset();
                    dijit.byId("calAtributo").set('store', this.dataFields);
                }
                }));
            },
        
            /**
             *
             * Responde al evento de cargar los atributos disponibles de una determinada capa en un combobox
             * cuando esta es seleccionada por consulta simple 
             * @memberof module:widgets/QueryByAtrr#
             * @param {string} e - nombre de la capa seleccionada  
             *  
             */
            traerAtributosSimple: function (e) {
                //console.log(e);
                //console.log(this.dataFeatures);
                var tipoField;
                var array = [];
                for (var i = 0; i < this.dataFields.data.length; i++) {
                    if (e == this.dataFields.data[i].id) {
                        tipoField = this.dataFields.data[i];
                    }
                }
        
                var queryTask = new QueryTask(this.urlCapaSeleccionada);
                var query = new Query();
                if (tipoField != undefined) {
                query.outFields = [tipoField.id];
        
                query.where = "1=1";
                query.returnGeometry = false;
                queryTask.execute(query, monstrarConsulta);
                function monstrarConsulta(featureSet) {
                    var valoresCompleto = featureSet.features;
                    var SinDuplicados = [];
                    var SinDuplicados = valoresCompleto.filter(function (elem, pos) {
                    return valoresCompleto.indexOf(elem) == pos;
                    });
                    this.dataFeatures = SinDuplicados;
                    dojo.forEach(this.dataFeatures, dojo.hitch(this, function (x) {
                    //console.log(e); 
                    /*          console.log(array.findIndex(item => item.id == x.attributes[e]));
                                console.log(x.attributes[e]);*/
                    var num = -1;
                    if (x.attributes[e] != undefined) {
        
                        for (var i = 0; i < array.length; i++) {
                        if (x.attributes[e] == array[i].name) {
                            num = x.attributes[e];
                        }
                        }
        
                        if (num === -1) {
                        if (tipoField.type == "esriFieldTypeString") {
                            this.dataString = 1;
                            array.push({
                            "id": "'" + x.attributes[e] + "'",
                            "name": x.attributes[e]
                            });
        
                        } else {
                            array.push({
                            "id": x.attributes[e],
                            "name": x.attributes[e]
                            });
                            this.dataString = 0;
                        }
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
                    var arrayValores = new Memory({ data: array });
                    dijit.byId("calValor").reset();
                    dijit.byId("calValor").set('store', arrayValores);
                }
                }
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
            _consultaOpcion: function (consulta, capa, atrributo, valor, especializada) {
        
                //listar las capas en el visor
                //layerExplorer = registry.byId('ContenerCapas_1');
                let layerCapa=this.layerExplorer.getGraphicCapaWidget(capa);
                switch(layerCapa.tipo){
                    case 'A':
                    case 'D':
                    let queryTask = new QueryTask(this.urlCapaSeleccionada);
                    let query = new Query();                   
                    query.outFields = ['*'];     
                    if(this.dataString == 1){       
                        //Verificar apóstrofe (apostrophe)
                        let posicionApostrofe = valor.substring(1,valor.length-1).indexOf('\'');                        
                        if(posicionApostrofe >0){
                            posicionApostrofe++;
                            valor=valor.substring(0,posicionApostrofe)+'\''+valor.substring(posicionApostrofe);
                        }
                    }
                    query.where = atrributo +" = "+ valor;
                    query.returnGeometry = false;
                    queryTask.execute(query,lang.hitch(this,function(resultado){
                       resultado.tipo='A';
                       this.tablaAtributos.setData(resultado);
                    }),function(error){
                        console.log(error);
                    });

                        break;
                    default:

                        break;

                }
                return false;

                //variable local donde se almacena el Feature layer
                var capaFeature = '';
                var capaSalida = '';
        
                dojo.forEach(layerCapa, dojo.hitch(this, function (x) {
        
                //validar la capa seleccionada
                if (x.id == capa) {
                    capaSalida = x;
                    //validar el tipo de capa seleccionada
                    if (x.tipo == 'A' || x.tipo == 'B') {
                    capaFeature = x.layer;
                    }
        
                    //Instacia de los paramentros de consulta
                    var query = new Query();
                    query.outFields = ["*"];
                    query.returnGeometry = true;
        
                    //CASO 1: Capa desplagada desde una url
                    if (x.tipo == 'A') {
                    //validar el tipo de consulta
                    if (consulta == "simple") {
                        query.where = atrributo + " = " + valor;
                    } else {
                        query.where = especializada;
                    }
                    }
                    // Query for the features with the given object ID   
                    //console.log(query);
                    capaFeature.queryFeatures(query, lang.hitch(this, function (response) {
                    panel = this.getPanel();
                    //console.log(panel.id);
                    panel.panelManager.minimizePanel(panel.id);
                    //console.log(response);
                    this.abrirTablaConsulta(response, capaSalida);
                    }), lang.hitch(this, function (err) {
                    /*            myDialog = new Dialog({
                                    title: "Error de consulta",
                                    content: "La consulta no se pudo realizar verifique bien sus paramentros.",
                                    style: "width: 300px"
                                });
                                myDialog.show();  */
                    var content = "La consulta no se pudo realizar verifique bien sus parametros.";
                    this.generarDialog(content);
                    }));
                }
                }));
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
                console.log('Abrir');
                this.tablaAtributos.floatingPane.show();
                this.tablaAtributos.floatingPane.bringToTop();
            },
            cerrarTablaAtributos:function(event){
                console.log('cerrar');
                this.tablaAtributos.floatingPane.hide();
            }
                    
        });
    });