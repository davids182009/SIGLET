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
 * @module TablaAtributos 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/registry",    
    "dojo/text!./template.html",
    "dojo/_base/window",
    "dojox/layout/FloatingPane",
    "dojox/layout/Dock",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dnd/move",
    "dojo/_base/window",
    "dojo/_base/html",
    "dgrid/Grid",
    "dgrid/Keyboard",
    "dgrid/Selection",
    "dgrid/extensions/Pagination",
    "dojo/store/Memory",
    "dojo/_base/array",
    'dojo/_base/lang',
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/graphicsUtils",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "xstyle/css!./css/style.css"
],
    function (declare,
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        registry,
        template,
        win,
        FloatingPane,
        Dock,
        domConstruct,
        domStyle,
        Move,
        win,
        html,
        GridDefinition,
        Keyboard,
        Selection,
        Pagination,
        Memory,
        dojoArray,
        lang,
        Query,
        FeatureLayer,
        graphicsUtils,
        SimpleFillSymbol,
        SimpleLineSymbol,
        Color      
    ){

        /**
         * Crea un nuevo TablaAtributos (Constructor)
         * @class
         * @alias module:TablaAtributos     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("TablaAtributos",[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],{
            templateString: template,
            baseClass: "widget-TablaAtributos",
            id: 'Widget_TablaAtributos',
            dock:null,
            floatingPane:null, 
            columns:null,
            dataStore:null,
            grid:null,
            CustomGrid:null,
            fieldOID:null,
            map:null,
            simbologiaPunto:null,
            simbologiaLinea:null,
            simbologiaPoligono:null,
            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            postCreate: function () {
                this.inherited(arguments);                
                this.dock = new Dock({
                    id: 'dock',
                    style: 'position:absolute; bottom:0; right:0; height:0px; width:0px; display:none; z-index:0;' //tuck the dock into the the bottom-right corner of the app
                }, domConstruct.create('div', null, win.body()));
                let fixFloatingPane = declare(FloatingPane,{
                    postCreate:function(){
                        this.inherited(arguments);
                        this.moveable = Move.constrainedMoveable(this.domNode,{
                            handle: this.focusNode,
                            constraints:function() {
                                var coordsBody = html.coords(dojo.body());
                                // or
                                var coordsWindow = {
                                    l: 0,
                                    t: 0,
                                    w: window.innerWidth,
                                    h: window.innerHeight                            
                                };                                
                                return coordsWindow;
                            },
                            within: true
                        })
                    }
                });

                        
                this.floatingPane = new fixFloatingPane({
                    id: 'FP_TablaAtributos',
                    title: 'Tabla de Atributos',
                    minSize:300,
                    //href: 'html/options.html',
                    //preload: true, //if you want to load content on app load set preload to true
                    resizable: true, //allow resizing
                    closable: false, //we never want to close a floating pane - this method destroys the dijit
                    dockable: true, // yes we want to dock it
                    dockTo: this.dock, //if you create the floating pane outside of the same function as the dock, you'll need to set as dijit.byId('dock')
                    style: 'position:absolute;top:130px;left:202px;width:500px;height:300px;z-index:999 !important',
                    content:this                   
                    //you must set position:absolute; and provide a top and left value (right and bottom DO NOT WORK and will cause the floating pane to appear in strange places depending on browser, for example 125684 pixels right)
                    //Why top and left? The position of a floating pane is a relationship between the top-left corner of dojo.window and the top-left corner of the dijit
                    //you must also set a height and width
                    //z-index is mainly irrelavant as the dijit will control its own z-index, but I always set it to 999 !important to avoid the occasional and mysterious problem of the title and content panes of the floating pane appearing at different z-indexes
                }, domConstruct.create('div', null , win.body()));
                this.floatingPane.startup();
                //CONSTRUCCION DE TABLA                
                this.CustomGrid = declare([GridDefinition,Pagination,Keyboard,Selection]);
                this.map = registry.byId('EsriMap').map;
                //DEFINICION ESTILOS QUE RESTALTAN FEATURES
                this.simbologiaLinea = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH,new Color([0,99,107]),1);
                this.simbologiaPoligono = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    this.simbologiaLinea,
                    new Color([48,144,172,0.7])                    
                );                      
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
            setDataFeatures:function(datos,capaWidgetSelected){ 
                if(this.grid != null){
                    this.grid.destroy();   
                    this.clearSelection();
                }
                this.capaWidgetSelected = capaWidgetSelected;
                domConstruct.create('div', {id:'dataGrid'} ,this.tablaNode );                
                //TITULOS
                this.columns = {};
                datos.fields.forEach(field => {
                    if(typeof field.alias != undefined)
                        this.columns[field.name] = field.name; 
                    else
                        this.columns[field.name] = field.alias;
                    if(field.type == 'esriFieldTypeOID')
                        this.fieldOID = field.name;
                    
                });
                //ATRIBUTOS                       
                let attributes = [];
                datos.features.forEach(feature => {
                    attributes.push(feature.attributes);
                });
                this.dataStore = new Memory({idProperty:this.fieldOID,data:attributes});                                            
                this.grid = new this.CustomGrid({                    
                    store: this.dataStore,
                    columns: this.columns,
                    selectionMode: 'extended',
                    cellNavigation: false,
                    className:'gridTablaAtributos',
                    rowsPerPage: 10,                    
                },'dataGrid');
                this.grid.on("dgrid-select", lang.hitch(this,this.resaltarFeatures));                
                this.grid.refresh();
                this.floatingPane.show();
                this.floatingPane.bringToTop();
                
            },
             /**
             * Responde a evento
             * 
             * @memberof module:widgets/TablaAtributos#
             * @param {object} event - objeto del evento clic disparado 
             * 
             */
            closePopupNote:function(event){
                domStyle.set(this.PopupNote,'display','none');
            },
            buscar:function(event){
                if(this.grid == null)
                    return false;
                this.filterEstore = [];
                let keys=Object.keys(this.columns);
                this.grid.set("query",lang.hitch(this,function(fila){
                    let resultadoComparacion=false;
                    let expresionRegular = new RegExp(this.inputParametroBusqueda.value,'i');
                    for(let j=0;j<keys.length; j++){
                        if(expresionRegular.test(fila[keys[j]])){
                            resultadoComparacion = true;
                        }               
                    }
                    return resultadoComparacion;
                }));
            },
            limpiar:function(event){
                this.inputParametroBusqueda.value = "";
                this.filterEstore = [];
                this.grid.set("query", {});
            },
            resaltarFeatures:function(objRow){                
                let objectIds = [];
                objRow.rows.forEach(row => {
                    objectIds.push(row.data[this.fieldOID]);
                });
                let query = new Query();
                query.objectIds = objectIds;
                switch(this.capaWidgetSelected.tipo){
                    case 'A':
                    case 'D':
                        this.capaWidgetSelected.layer.clearSelection();
                        this.capaWidgetSelected.layer.setSelectionSymbol(this.simbologiaPoligono);
                        this.capaWidgetSelected.layer.selectFeatures(query,
                            FeatureLayer.SELECTION_NEW,lang.hitch(this,function(features){
                            selectExtent = graphicsUtils.graphicsExtent(features);
                            this.map.setExtent(selectExtent);
                        }));
                        break;
                    case 'C':
                    case 'E':
                        this.capaWidgetSelected.layer[0].clearSelection();
                        this.capaWidgetSelected.layer[0].setSelectionSymbol(this.simbologiaPoligono);
                        this.capaWidgetSelected.layer[0].selectFeatures(query,
                            FeatureLayer.SELECTION_NEW,lang.hitch(this,function(features){
                            selectExtent = graphicsUtils.graphicsExtent(features);
                            this.map.setExtent(selectExtent);
                        }));
                        break;

                }
                
            },
            clearSelection:function(event){
                if(this.grid == null)
                    return false;
                this.grid.refresh();
                switch(this.capaWidgetSelected.tipo){
                    case 'A':
                    case 'D':
                        this.capaWidgetSelected.layer.clearSelection();
                        break;
                    case 'C':
                    case 'E':
                        this.capaWidgetSelected.layer[0].clearSelection();
                        break;

                }
                
            },
            export2shp:function(event){
                alert('exportar!');
            }
        });
    });