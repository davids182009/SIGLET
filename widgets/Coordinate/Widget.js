
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
var select = null;
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
    "dojo/dom-construct",
    "dojo/on",
    "xstyle/css!./css/style.css",   
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
        registry,
        domConstruct,
        on
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
        map:null,  
        selectEscala:null,  
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
        startup: function () {  
        },      
        _crearEventos:function(){
            this.map = registry.byId('EsriMap').map;
            if(this.map != null) {
                this.map.on("mouse-move",lang.hitch(this,this.mostrarCoordenadas));
                this.map.on("mouse-drag",lang.hitch(this,this.mostrarCoordenadas));
                this.map.on("extent-change",lang.hitch(this,this.cambiarEscalaSelect));     
                on(this.selectEscalaNodo,'change',lang.hitch(this,this.cambiarEscalaMapa));
                this._crearSelectEscalas();
            }else{
                setTimeout(lang.hitch(this, this._crearEventos), 1000);
            }

        },
        _crearSelectEscalas:function(){    
            select=this.selectEscalaNodo;
            let nivelMax = this.map.getMaxZoom();
            let nivelMin = this.map.getMinZoom();
            let escaleMin = this.map.getMinScale();
            let escaleEstablecida = parseInt(this.map.getLevel());      
            let escalaCalculada = 0;
            for (let i = nivelMax; i >= nivelMin; i--) {
                if (i === nivelMax) {
                    escalaCalculada = parseInt(escaleMin);
                } else {
                    escalaCalculada = parseInt(escalaCalculada / 2);
                }

                let digitos = escalaCalculada.toString().length;
                let divisor = Math.pow(10, (digitos - 1));
                let escala = Math.round(escalaCalculada / divisor);
                let escalaFinal = escala * divisor;
                let formatNumber = {
                    separador: ".", // separador para los miles
                    sepDecimal: ',', // separador para los decimales
                    formatear: function (num) {
                        num += '';
                        let splitStr = num.split('.');
                        let splitLeft = splitStr[0];
                        let splitRight = splitStr.length > 1 ? this.sepDecimal + splitStr[1] : '';
                        let regx = /(\d+)(\d{3})/;
                        while (regx.test(splitLeft)) {
                            splitLeft = splitLeft.replace(regx, '$1' + this.separador + '$2');
                        }
                        return this.simbol + splitLeft + splitRight;
                    },
                    new: function (num, simbol) {
                        this.simbol = simbol || '';
                        return this.formatear(num);
                    }
                }

                let res = formatNumber.new(escalaFinal);
                let option = {};
                if (escaleEstablecida === parseInt(nivelMax - i)) {
                    option = { value: ((nivelMax - i)), innerHTML: "1:" + res,defaultSelected: false, selected: true };
                } else {
                    option = { value: ((nivelMax - i)), innerHTML: "1:" + res,defaultSelected: false, selected: false };
                }
                domConstruct.create("option",option,this.selectEscalaNodo);
                
            }          
        },
        cambiarEscalaMapa: function(evt) {                       
            if (this.map.getLevel() < this.selectEscalaNodo[this.selectEscalaNodo.selectedIndex].value) {
                let level = parseInt(this.map.getLevel());
                let value = parseInt(this.selectEscalaNodo[this.selectEscalaNodo.selectedIndex].value);
                let nuevo = value - level;
                this.map._extentUtil({ numLevels: nuevo });
            }else{
            //if (this.map.getLevel() > this.selectEscalaNodo.get('value')) {
                let level = parseInt(this.map.getLevel());
                let value = parseInt(this.selectEscalaNodo[this.selectEscalaNodo.selectedIndex].value);
                let nuevo = level - value;
                this.map._extentUtil({ numLevels: -nuevo });
            }
        },
        cambiarEscalaSelect: function(){
            //dijit.byId("scaleSelect").set("value", this.map.getLevel());   
            let nivelActual=this.map.getLevel();
            this.selectEscalaNodo[this.selectEscalaNodo.selectedIndex].selected=false;
            let opciones = this.selectEscalaNodo.getElementsByTagName('option');            
            for(let i=0; i<opciones.length;i++){
                if(opciones[i].value == nivelActual){
                    opciones[i].selected = true;
                    break;
                }
            }  

        },
        /**
         * Helper function to prettify decimal degrees into DMS (degrees-minutes-seconds).
         *
         * @param {number} decDeg The decimal degree number
         * @param {string} decDir LAT or LON
         *
         * @return {string} Human-readable representation of decDeg.
         */
        degToDMS: function(decDeg, decDir) {
            /** @type {number} */
            var d = Math.abs(decDeg);
            /** @type {number} */
            var deg = Math.floor(d);
            d = d - deg;
            /** @type {number} */
            var min = Math.floor(d * 60);
            /** @type {number} */
            var sec = Math.floor((d - min / 60) * 60 * 60);
            if (sec === 60) { // can happen due to rounding above
            min++;
            sec = 0;
            }
            if (min === 60) { // can happen due to rounding above
            deg++;
            min = 0;
            }
            /** @type {string} */
            var min_string = min < 10 ? "0" + min : min;
            /** @type {string} */
            var sec_string = sec < 10 ? "0" + sec : sec;
            /** @type {string} */
            var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (decDeg < 0 ? "W" : "E");

            return (decDir === 'LAT') ?
            deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir :
            deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir;
        },
        mostrarCoordenadas:function(evt){
            let mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
            let fuente = new Proj4js.Proj('EPSG:4326');
            let destino = new Proj4js.Proj('EPSG:4686');         
            let punto = new Proj4js.Point( mp.x, mp.y);
            Proj4js.transform(fuente, destino, punto);
            this.x_a.innerHTML = this.degToDMS(punto.y,'LAT');
            this.y_a.innerHTML = this.degToDMS(punto.x,'LON');
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