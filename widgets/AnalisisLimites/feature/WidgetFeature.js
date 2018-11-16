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
 * @module WidgetFeature 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin", 
    "dojo/text!./template.html",
    "dojo/dom-class",
    "dojo/topic"
],
    function (
        declare,
        _WidgetBase,
        _TemplatedMixin,
        template,
        domClass,
        topic        
    ) {

        /**
         * Crea un nuevo WidgetFeature (Constructor)
         * @class
         * @alias module:WidgetFeature     
         * @property {String} templateString - Contenido del archivo template.html
         * @property {String} baseClass - valor del atributo class del nodo traido en el template
         * @property {String} id - identificador del widget
         * 
         */
        return declare("WidgetFeature", [_WidgetBase, _TemplatedMixin], {

            templateString: template,
            baseClass: "widget-WidgetFeature",
            id: '',   
            position:0,
            graphic:null,
            /**
             * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
             * todas las propiedades del widget son definidas y el fragmento
             * HTML es creado, pero este no ha sido incorporado en el DOM.
             * 
             * @function         
             */
            postCreate: function () {
                this.inherited(arguments);
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
            interact:function(event){
                console.log('Interactuar');
                if(domClass.contains(this.domNode,'target')){
                    topic.publish("RemoveWidgetFeature",this.id);                   
                }else{
                    let titulos= Object.keys(this.graphic.attributes);
                    let valores= Object.values(this.graphic.attributes);
                    let contenido = '';
                    contenido  += '<table>';
                    contenido  += '<caption>Atributos Elemento '+this.position+'</caption>';
                    for(i=0;i<titulos.length;i++){
                        contenido += '<tr>';    
                        contenido += '<th>'+titulos[i]+':</th>';    
                        contenido += '<td>'+valores[i]+'</td>';    
                        contenido += '</tr>';    
                    }
                    contenido += '</table>';
                    topic.publish("identificarWidgetFeature",{
                        widgetFeatureId:this.id,
                        AttributesContent:contenido
                    });
                }
            }
            
        });
    });