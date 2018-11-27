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
    "dojo/text!./template.html",
    "dojo/_base/window",
    "dojox/layout/FloatingPane",
    "dojox/layout/Dock",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dgrid/OnDemandGrid",
    "dgrid/Keyboard",
    "dgrid/Selection",
    "dgrid/extensions/Pagination",
    "dojo/store/Memory",
    "xstyle/css!./css/style.css"
],
    function (declare,
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        template,
        win,
        FloatingPane,
        Dock,
        domConstruct,
        domStyle,
        OnDemandGrid,
        Keyboard,
        Selection,
        Pagination,
        Memory        
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
        return declare("TablaAtributos", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            baseClass: "widget-TablaAtributos",
            id: 'Widget_TablaAtributos',
            dock:null,
            floatingPane:null, 
            columns:null,
            dataStore:null,
            grid:null,
            CustomGrid:null,
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
                this.floatingPane = new FloatingPane({
                    id: 'FP_TablaAtributos',
                    title: 'Tabla de Atributos',
                    minSize:300,
                    //href: 'html/options.html',
                    //preload: true, //if you want to load content on app load set preload to true
                    resizable: true, //allow resizing
                    closable: false, //we never want to close a floating pane - this method destroys the dijit
                    dockable: true, // yes we want to dock it
                    dockTo: this.dock, //if you create the floating pane outside of the same function as the dock, you'll need to set as dijit.byId('dock')
                    style: 'position:absolute;top:130px;left:202px;width:600px;height:300px;z-index:999 !important',
                    content:this                   
                    //you must set position:absolute; and provide a top and left value (right and bottom DO NOT WORK and will cause the floating pane to appear in strange places depending on browser, for example 125684 pixels right)
                    //Why top and left? The position of a floating pane is a relationship between the top-left corner of dojo.window and the top-left corner of the dijit
                    //you must also set a height and width
                    //z-index is mainly irrelavant as the dijit will control its own z-index, but I always set it to 999 !important to avoid the occasional and mysterious problem of the title and content panes of the floating pane appearing at different z-indexes
                }, domConstruct.create('div', null , win.body()));
                this.floatingPane.startup();
                //CONSTRUCCION DE TABLA                
                this.CustomGrid = declare([OnDemandGrid,Pagination,Keyboard,Selection]);                
                let someData = [
                    { first: 'Bob', last: 'Barker', age: 89 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Vanna', last: 'White', age: 55 },
                    { first: 'Pat', last: 'Sajak', age: 65 }
                ];
                this.columns = {
                    first: 'First Name',
                    last: 'Last Name',
                    age: 'Age'
                };
                this.dataStore = new Memory({data:someData});
                this.grid = new this.CustomGrid({                    
                    store: this.dataStore,
                    columns: this.columns,
                    selectionMode: 'single',
                    cellNavigation: false,
                    className:'gridTablaAtributos',
                    rowsPerPage: 10,                    
                },'dataGrid');              
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
            setData:function(datos){ 
                this.grid.destroy();   
                domConstruct.create('div', {id:'dataGrid'} ,this.tablaNode );
                switch(datos.tipo){
                    case 'A':
                        //TITULOS
                        this.columns = {};
                        datos.fields.forEach(field => {
                            this.columns[field.name] = field.alias; 
                        });
                        //ATRIBUTOS                        
                        let attributes = [];
                        datos.features.forEach(feature => {
                            attributes.push(feature.attributes);
                        });
                        this.dataStore = new Memory({data:attributes});                        
                        break;
                    default:
                        break;
                }
                this.grid = new this.CustomGrid({                    
                    store: this.dataStore,
                    columns: this.columns,
                    selectionMode: 'single',
                    cellNavigation: false,
                    className:'gridTablaAtributos',
                    rowsPerPage: 10,                    
                },'dataGrid'); 
                this.grid.refresh();
                this.floatingPane.show();
                this.floatingPane.bringToTop();
                console.log('Tabla de atributos');
                console.log(datos);
                
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
            }                
        });
    });