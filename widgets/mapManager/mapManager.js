var maxExtent = null;
var mapa = null;

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "esri/map",
    "dojo/topic",
    'dojo/_base/lang',
    "esri/config",
    'dojo/text!./template.html',
    'esri/dijit/HomeButton',
    "esri/dijit/Scalebar",
    "esri/dijit/OverviewMap",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    'xstyle/css!./style.css'
], function(
    declare,
    _WidgetBase,
    _TemplatedMixin,
    Map,
    Topic,
    lang,
    esriConfig,
    template,
    HomeButton,
    Scalebar,
    OverviewMap,
    Extent,
    SpatialReference
  ){

  return declare([_WidgetBase, _TemplatedMixin], {

    templateString: template,
    id: 'EsriMap',
    config: null,
    map: null,
    masExt: null,
    postCreate: function() {
      this.inherited(arguments);
      console.log('**** Widget Mapa Manager');
      Topic.subscribe("configMapa", lang.hitch(this, this._initMapa));
    },
    startup: function() {
      //this.inherited(arguments);
      console.log('Widget Started');
    },
    _initMapa: function(e) {

      esriConfig.defaults.map.panDuration = 1; // time in milliseconds, default panDuration: 350
      esriConfig.defaults.map.panRate = 1; // default panRate: 25
      esriConfig.defaults.map.zoomDuration = 100; // default zoomDuration: 500
      esriConfig.defaults.map.zoomRate = 1; // default zoomRate: 25

      this.config = e;
      //Definicion de extent y sistema de coordenadas
      //customExtentAndSR = new Extent(-84.77,-4.23,-66.87,15.51,new SpatialReference({"wkid":4686}));
      //customExtentAndSR = new Extent({"xmin":-3805207,"ymin":-3763687,"xmax":3692296,"ymax":1775125,"spatialReference":{"wkid":102003}});
      //this.config.extent = customExtentAndSR;
      this.map = new Map(this.mapNode, this.config);

      this.map.on("load", lang.hitch(this, function(m) {
        _setearExtent(m.map.extent);
        // this.masExt = m.map.extent;
      }));

      /* this.map.on("extent-change", lang.hitch(this, function(ext) {
        if (maxExtent != null) {
          if ((ext.extent.xmin < maxExtent.xmin) ||
            (ext.extent.ymin < maxExtent.ymin) ||
            (ext.extent.xmax > maxExtent.xmax) ||
            (ext.extent.ymax > maxExtent.ymax)) {
            this.map.setExtent(maxExtent);
          }
        }
      })); */
      esriConfig.defaults.io.proxyUrl =
        "http://172.28.9.212:8090/proxy/proxy.jsp"
      esriConfig.defaults.io.alwaysUseProxy = false;

      this.scalebar = new Scalebar({
        map: this.map,
        scalebarUnit: "metric"
          // scaleStyle: "line"
      });

      this.overviewMapDijit = new OverviewMap({
        map: this.map,
        visible: false,
        attachTo: "bottom-right"
      });
      this.overviewMapDijit.startup();
      mapa = this.map;
    }
  });
});

function _setearExtent(ext) {
  maxExtent = ext;
}
