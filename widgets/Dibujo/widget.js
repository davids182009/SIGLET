define([
    'dojo/_base/declare',
    "dojo/_base/lang",
    'dojo/text!./template.html',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "dijit/registry",
    'dijit/_WidgetsInTemplateMixin',
    "dijit/Toolbar",
    "dijit/form/Button",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/WidgetSet",

    "esri/toolbars/navigation",
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    'xstyle/css!./css/style.css',

], function(declare, lang, template, _WidgetBase, _TemplatedMixin,
  registry, _WidgetsInTemplateMixin, Toolbar, Button, BorderContainer,
  ContentPane, WidgetSet, navigation, draw, graphic, SimpleMarkerSymbol,
  SimpleLineSymbol, SimpleFillSymbol) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,
    id: 'widgetDibujo',
    baseClass: "widgetDibujo",
    toolbar: null,
    postCreate: function() {
      this.inherited(arguments);
    },
    startup: function() {
      console.log('Widget Started');
    },
    _createToolbar: function(evt) {
      console.log("EN CREATE TOOLBAR...");
      let mapa = registry.byId('EsriMap').map;

      let valorBtn = evt.target.attributes[0].nodeValue;
      this.toolbar = new draw(mapa);
      this.toolbar.on("draw-end", lang.hitch(this, this._addToMap));
      this.toolbar.activate(draw[valorBtn]);
    },
    _addToMap: function(evt) {
      console.log("FUNCION ADD....");
      var symbol;
      let mapa = registry.byId('EsriMap').map;
      this.toolbar.deactivate();

      switch (evt.geometry.type) {
        case "point":
        case "multipoint":
          symbol = new SimpleMarkerSymbol();
          break;
        case "polyline":
          symbol = new SimpleLineSymbol();
          break;
        default:
          symbol = new SimpleFillSymbol();
          break;
      }
      var grafico = new graphic(evt.geometry, symbol);
      mapa.graphics.add(grafico);
    }
  });
});
