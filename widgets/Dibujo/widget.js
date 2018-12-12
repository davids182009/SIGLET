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
    "esri/layers/GraphicsLayer",

    'xstyle/css!./css/style.css',

], function(declare, lang, template, _WidgetBase, _TemplatedMixin,
  registry, _WidgetsInTemplateMixin, Toolbar, Button, BorderContainer,
  ContentPane, WidgetSet, navigation, draw, graphic, SimpleMarkerSymbol,
  SimpleLineSymbol, SimpleFillSymbol, GraphicsLayer) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,
    id: 'widgetDibujo',
    baseClass: "widgetDibujo",
    toolbar: null,
    layer: null,
    arregloEliminados: [],
    incremento: null,
    postCreate: function() {
      let mapa = registry.byId('EsriMap').map;
      this.inherited(arguments);
      this.layer = new GraphicsLayer({
        id: 'capaDibujo'
      });
      mapa.addLayer(this.layer);
    },
    startup: function() {
      console.log('Widget Started');
    },
    _createToolbar: function(evt) {
      console.log("EN CREATE TOOLBAR...");
      let mapa = registry.byId('EsriMap').map;

      let valorBtn = evt.target.value;
      this.toolbar = new draw(mapa);
      this.toolbar.on("draw-end", lang.hitch(this, this._addToMap));
      this.toolbar.activate(draw[valorBtn]);

    },
    _addToMap: function(evt) {
      let symbol;
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
      this.layer.add(grafico);
    },
    limpiarCapas: function() {

      this.layer.clear();
    },
    deshacerDibujo: function() {
      let graficos = this.layer.graphics;
      let tamanoGraficos = this.layer.graphics.length;

      this.arregloEliminados.push(graficos[tamanoGraficos - 1]);
      this.layer.remove(graficos[tamanoGraficos - 1]);
    },
    rehacerDibujo: function() {
      let tamanoEliminados = this.arregloEliminados.length;
      this.incremento = tamanoEliminados;

      if (tamanoEliminados > 0) {
        this.layer.add(this.arregloEliminados[tamanoEliminados - 1]);
        this.arregloEliminados.splice(tamanoEliminados - 1, 1);
      }
    }
  });
});
