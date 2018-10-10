
/**
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la estructura de contenedores principales
* @version 1.0
* @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
* History
* 
*/

/**
 * Define 
 * y el Panel de capas, junto a una caja separadora (Splitter) para 
 * redimensionar los contenedores
 */

var ContentCapasDndTarget= {idTarget:'',overTarget:'',y:0,t:0};

 /**
 * Modulo que representa Explorador de capas donde se definen contenedores
 * para la tabla de contenido y el area de trabajo donde se cargan las capas.
 * @module Coordinate 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./Widget.html",
    "dojo/dom-class",
    "dojo/_base/lang",
    "esri/geometry/webMercatorUtils",      
    "dijit/registry",
    'xstyle/css!./css/style.css',   
    "libs/proj4js/lib/proj4js-combined",
    "dojo/domReady!"], 
    function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        template,
        domClass,
        lang,
        webMercatorUtils,
        registry
    ){

    /**
     * Crea un nuevo MenuWidget (Constructor)
     * @class
     * @alias module:MenuWidget     
     * @property {String} templateString - Contenido del archivo CapaWidget.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {obj} map - Objeto Map de ESRI
     * @property {obj} tree - Arbol jerarquico de capas 
     * 
     */
    return declare("ContentCapas",[_WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin], {
       
        templateString: template,       
        baseClass: "Widget-Coordinate",
        map: null,
        id:'',    
        estadoVisibilidad:true,    
        /**
        * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando 
        * todas las propiedades del widget son definidas y el fragmento
        * HTML es creado, pero este no ha sido incorporado en el DOM.
        * 
        * @memberOf ContentCapas
        */
        postCreate:function(){
            this.inherited(arguments);            
            this._crearEventos();
        },
        /**
        * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
        * del postCreate, cuando el nodo ya esta insertado en el DOM.
        * Dependiendo de la declaracion del widget este puede no dispararse.
        * Construye 2 contenedores con Sppliter y el arbol de capas en el 
        * contenedor superior y define la ventana de información/popup asociado
        * al objeto mapa global.
        * 
        * @memberOf ContentCapas
        */
        startUp: function () {  
            this._crearEventos();
        },      
        _crearEventos:function(){
            let mapa = registry.byId('EsriMap').map;
            if(mapa != null) {
                mapa.on("mouse-move",lang.hitch(this,this.mostrarCoordenadas));
                mapa.on("mouse-drag",lang.hitch(this,this.mostrarCoordenadas));                    
            }else{
                setTimeout(lang.hitch(this, this._crearEventos), 1000);
            }

        },
        mostrarCoordenadas:function(evt){
            let mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
            let fuente = new Proj4js.Proj('EPSG:4326');
            let destino = new Proj4js.Proj('EPSG:4686');         
            let punto = new Proj4js.Point( mp.x, mp.y);
            Proj4js.transform(fuente, destino, punto);
            this.x_a.innerHTML = punto.x.toFixed(2);
            this.y_a.innerHTML = punto.y.toFixed(2);
            destino = new Proj4js.Proj('EPSG:3116');         
            let puntoPlanas = new Proj4js.Point( mp.x, mp.y);
            Proj4js.transform(fuente, destino, puntoPlanas);
            this.x_b.innerHTML = puntoPlanas.x.toFixed(2);
            this.y_b.innerHTML = puntoPlanas.y.toFixed(2);
        },
        cambiarVisibilidad:function(event){
            if(this.estadoVisibilidad){
                domClass.add(this.nodoPrincipal,'hide');
                domClass.replace(this.tab,'tab_close','tab_open');
                this.estadoVisibilidad=false;                                
            }else{
                domClass.remove(this.nodoPrincipal,'hide');
                domClass.replace(this.tab,'tab_open','tab_close');
                this.estadoVisibilidad=true;
            }
        },      
        mostrarMensaje:function(mensaje){
            ventanaMensaje = new Dialog(mensaje);
            ventanaMensaje.show();
        }
    });
});