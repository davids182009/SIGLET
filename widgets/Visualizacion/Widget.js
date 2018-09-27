var mapas = null;

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./template.html',
    'esri/dijit/HomeButton',
    "dijit/registry",
    "dojo/_base/lang",
    'dijit/_WidgetsInTemplateMixin',
    "dijit/Toolbar",
    "dijit/form/Button",
    "esri/toolbars/navigation",
    'xstyle/css!./css/style.css'
], function(declare, _WidgetBase, _TemplatedMixin,
  template, HomeButton, registry, lang, _WidgetsInTemplateMixin,
  Toolbar, Button, Navigation) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    templateString: template,
    id: 'widgetVisualizacion',
    baseClass: "barNav",
    postCreate: function() {
      this.inherited(arguments);
      this._initVisualizacion();
    },
    startup: function() {
      console.log('Widget Started');
    },
    _initVisualizacion: function() {
      let mapa = registry.byId('EsriMap').map;
      if (mapa != null) {
        this.map = mapa;
        let home = new HomeButton({
          map: mapa
        }, this.btnVistaInicial);
        home.startup();
        this.navToolbar = new Navigation(mapa);
      } else {
        setTimeout(lang.hitch(this, this._initVisualizacion), 1000);
      }
    },
    _zoomIn: function(e) {
      let lvlZoom = this.map.getLevel();

      if (lvlZoom < 19) {
        this.map._extentUtil({
          numLevels: 1
        });
      }

      console.log("in:" + lvlZoom);
      console.log(e);
    },
    _zoomOut: function(e) {
      let lvlZoom = this.map.getLevel();
      if (lvlZoom > 5) {
        this.map._extentUtil({
          numLevels: -1
        });
      }
    },
    _zoomPrev: function(e) {
      this.navToolbar.zoomToPrevExtent();
    },
    _zoomPost: function() {
      this.navToolbar.zoomToNextExtent();
    }
  });
});
