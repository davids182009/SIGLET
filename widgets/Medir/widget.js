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
 * @module Medir
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template.html",
    "dojo/dom",
    "esri/dijit/Measurement",
    "dijit/registry",
    "dijit/layout/BorderContainer",
    "dijit/TitlePane"
  ],

  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    template, dom, Measurement, registry, BorderContainer, TitlePane) {

    /**
     * Crea un nuevo Medir (Constructor)
     * @class
     * @alias module:Medir
     * @property {String} templateString - Contenido del archivo template.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {String} id - identificador del widget
     *
     */
    return declare("Medir", [_WidgetBase, _TemplatedMixin,
      _WidgetsInTemplateMixin], {

      templateString: template,
      baseClass: "widget-Medir",
      id: '',
      /**
       * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
       * todas las propiedades del widget son definidas y el fragmento
       * HTML es creado, pero este no ha sido incorporado en el DOM.
       *
       * @function
       */
      postCreate: function() {
        this.inherited(arguments);
      },
      /**
       * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
       * del postCreate, cuando el nodo ya esta insertado en el DOM.
       *
       * @function
       */
      startup: function() {
        this.inherited(arguments);

        let mapaW = registry.byId('EsriMap').map;
        let measurement = new Measurement({
          map: mapaW
        }, dom.byId("measurementDiv"));
        measurement.startup();
        console.log(measurement);
        measurement._distanceUnitStrings = ["Millas", "Kilometros",
          "Metros"];
        measurement._distanceUnitStringsLong = ["esriMiles",
          "esriKilometers", "esriMeters"];

        measurement._areaUnitStrings = ["Kilómetros cuadrados",
          "Hectáreas",
          "Metros cuadrados"];
        measurement._areaUnitStringsLong = ["esriSquareKilometers",
          "esriHectares", "esriSquareMeters"];
        console.log(measurement);

        measurement._defaultAreaUnit = "esriSquareKilometers";
        measurement._defaultDistanceUnit = "esriMeters";
      }
    });
  });
