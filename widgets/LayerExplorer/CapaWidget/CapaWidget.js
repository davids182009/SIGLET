/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que representa una capa en el panel de Capas, el cual tiene
 * opciones que permiten quitar capa, cambiar simbologia, apagar/prender
 * capa, consultar metadato, generar transparencia y etiquetar por atributo.
 * @version 1.0
 * @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
 * History
 *
 */

/**
 * Define los contenedores principales para el Explorador de capas
 * y el Panel de capas, junto a una caja separadora (Splitter) para
 * redimensionar los contenedores
 *
 * @memberOf ContentCapas
 * @module widgets/LayerExplorer/ContentCapa
 * @argument dojo/_base/declare
 * @argument dojo/on
 * @argument dojo/dom
 * @argument dojo/query
 * @argument dojo/dom-class
 * @argument dojo/dom-style
 * @argument dojo/_base/html
 * @argument dijit/dijit/_WidgetBase
 * @argument dijit/_TemplatedMixin
 * @argument dojo/text!./templates/CapaWidget.html - Custom Widget
 * @argument esri/layers/WMSLayer
 * @argument esri/layers/WFSLayer
 * @argument esri/layers/FeatureLayer
 * @argument esri/InfoTemplate
 * @argument esri/config
 * @argument dojo/_base/array
 * @argument dojo/fx
 * @argument dojo/dom-style
 * @argument dojo/dom-geometry
 * @argument jimu/WidgetManager
 * @argument dojo/topic
 */

define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/on",
    "dojo/mouse",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/_base/html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/CapaWidget.html",
    "esri/layers/WMSLayer",
    "esri/layers/WFSLayer",
    "esri/layers/FeatureLayer",
    "esri/InfoTemplate",
    "esri/config",
    "dojo/_base/array",
    "dojo/_base/fx",
    "dojo/dom-geometry",
    "dojo/dom-construct",
    "dojo/Deferred",
    "dojo/topic",
    "dijit/registry",
    "dijit/Dialog",
    "dijit/form/Select",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/layers/LabelClass",
    "esri/Color",
    "esri/renderers/ClassBreaksRenderer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/request",
    "dojo/_base/lang",
    "esri/layers/LayerDrawingOptions",
    "esri/renderers/SimpleRenderer",
    "dojo/request/script",
    "esri/SpatialReference",
    "dijit/focus",
    "dojo/NodeList-traverse"
], function(declare, dom, on, mouse, query, domClass, domStyle,
  domAttr, html, _WidgetBase, _TemplatedMixin, template,
  WMSLayer, WFSLayer, FeatureLayer, InfoTemplate,
  esriConfig, array, fx, domGeom, domConstruct,
  Deferred, topic, registry, Dialog, Select, SimpleLineSymbol,
  SimpleFillSymbol, TextSymbol, SimpleRenderer,
  LabelClass, Color, ClassBreaksRenderer, ArcGISDynamicMapServiceLayer,
  esriRequest, lang, LayerDrawingOptions, SimpleRenderer,
  Script, SpatialReference, focusUtil) {

  /**
   * Clase para crear y manejar capas en el Panel de Capas
   * @class CapaWidget
   * @property {String} templateString - Contenido del archivo CapaWidget.html
   * @property {String} name - (Variable Substitution) Variable dentro del template
   * @property {String} baseClass - valor del atributo class del nodo traido en el template
   * @property {String} IDCAPA - identificador de la capa dentro del repositorio capasStore
   * @property {object} map - objeto mapa de ESRI
   * @property {boolean} visible - Indicador de la visibilidad de la capa
   * @property {fx.fadeOut} popUpTransparenciaOn - animacion del objeto Popup para transparencia - Mostrar
   * @property {fx.fadeOut} popUpTransparenciaOff - animacion del objeto Popup para transparencia - Ocultar
   * @property {function} dndmove - Evento para movimiento de mouse
   *
   * dijit._WidgetBase is the base class for all widgets in dijit, and in general
   * is the base class for all dojo based widgets.     *
   * It provide life cycle method which get called at diffrent stages
   */
  return declare("CapaWidget", [_WidgetBase, _TemplatedMixin], {

    templateString: template,
    name: "no name",
    baseClass: "capa",
    IDCAPA: "",
    map: null,
    visible: true,
    popUpTransparenciaOn: null,
    popUpTransparenciaOff: null,
    popUpEtiquetaOn: null,
    popUpEtiquetaOff: null,
    loadErrorEvent: null,
    positionTop: 0,
    positionLeft: 0,
    dndmove: null,
    estiloEtiqueta: null,
    layer: null,
    infoCapa: null,
    tipo: 'A',
    subTipo: '',
    feature: null,
    rangos: null,
    TEST: '',

    /**
     * Funcion del ciclo de vida del Widget en Dojo
     * @return {*}
     * @private         *
     */
    postCreate: function() {
      this.inherited(arguments);
      this.imgURL = '';
      this.map = registry.byId('EsriMap').map;
    },
    /**
     * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
     * del postCreate, cuando el nodo ya esta insertado en el DOM.
     * Ejecuta la funcion principal para mostrar el layer en el mapa e
     * inicializa las variables
     *
     * @memberOf CapaWidget
     */
    startup: function() {
      this._mostrarCapa();
      let nodoPopUpTransparencia = query('.popupCapaWidget', this.id)[
        0];
      let nodoPopUpEtiqueta = query('.popupCapaWidgetLabel', this.id)[
        0];
      //ANIMACION POPUP TRANSPARENCIA
      this.popUpTransparenciaOff = new fx.fadeOut({
        node: nodoPopUpTransparencia,
        duration: 700,
        widgetId: this.id,
        onEnd: function() {
          domStyle.set(this.node, "display", "none");
          domAttr.set(this.widgetId, {
            'draggable': true
          });
        }
      });
      this.popUpTransparenciaOn = new fx.fadeIn({
        node: nodoPopUpTransparencia,
        duration: 700,
        widgetId: this.id,
        beforeBegin: function() {
          domStyle.set(this.node, "display", "block");
          domAttr.set(this.widgetId, {
            'draggable': false
          });
        }
      });
      //ANIMACION POPUP ETIQUETAR POR ATRIBUTO
      this.popUpEtiquetaOff = new fx.fadeOut({
        node: nodoPopUpEtiqueta,
        duration: 700,
        onEnd: function() {
          domStyle.set(this.node, "display", "none");
        }
      });
      this.popUpEtiquetaOn = new fx.fadeIn({
        node: nodoPopUpEtiqueta,
        duration: 700,
        beforeBegin: function() {
          domStyle.set(this.node, "display", "block");
        }
      });
      //EVENTOS PARA DESHABILITAR DRAG AND DROP CUANDO SE ABRE POPUP DE TRANSPARENCIA
      /* on(nodoPopUpTransparencia,mouse.enter,lang.hitch(function(event){
          console.log('[****] Entro al Popup');
          domAttr.set(this.id,{'draggable':false});
      });
      on(nodoPopUpTransparencia,mouse.leave,function(event){
          console.log('[---------] Salio del Popup');
          domAttr.set(this.id,{'draggable':true});
      }); */


      if ((this.tipo == 'A' || this.tipo == 'D') && this.infoCapa.TIPO ==
        'WMS')
        return false;
      //EVENTOS DRAG AND DROP
      on(dom.byId(this.id), 'dragstart', this._handleDragStart);
      //on(dom.byId(this.id),'drag',this._handleDragMove);
      //on(dom.byId(this.id),'dragenter',this._handleDragEnter);
      on(dom.byId(this.id), 'dragover', this._handleDragOver);
      //on(dom.byId(this.id),'dragleave',this._handleDragLeave);
      //on(dom.byId(this.id),'drop',this._handleDrop);
      on(dom.byId(this.id), 'dragend', this._handleDragEnd);
      //INFORMAR A IDENTIFICAR DE LA CREACION DE UN LAYER
      if (this.tipo == 'A' || this.tipo == 'B')
        topic.publish("identificarWidget", {
          accion: 'CREAR',
          name: this.name,
          //id:''+this.infoCapa.infoCapa.IDDATO+''+this.infoCapa.IDUNIDADESPACIAL+''+this.infoCapa.name,
          idWidget: '' + this.id,
          URL: '' + this.infoCapa.URL + '/' + this.infoCapa.NOMBRECAPA
        });
      else
        topic.publish("identificarWidget", {
          accion: 'CREAR',
          name: this.name,
          //id:''+this.infoCapa.id,
          idWidget: '' + this.id
        });
      //INFORMAR A COMPARACION TEMPORAL
      if (this.tipo == 'B') {
        if (this.infoCapa.IDUNIDADESPACIAL == 1)
          sobreNombre = this.infoCapa.DATO + ' [MUNICIPAL]';
        else
          sobreNombre = this.infoCapa.DATO + ' [DEPARTAMENTAL]';
        topic.publish("identificarCapasTematicas", {
          accion: 'CREAR',
          name: sobreNombre,
          IDDATO: this.infoCapa.IDDATO,
          id: this.infoCapa.IDDATO,
          idWidget: '' + this.id,
          IDUNIDADESPACIAL: this.infoCapa.IDUNIDADESPACIAL,
          idNodoPadre: this.infoCapa.parent
        });
      }

    },
    /**
     * Extrae del repositorio de datos el objeto con las propiedades de la capa
     * para realizar la creacion del layer y posterior adición al mapa.
     *
     * @memberOf CapaWidget
     * @private
     * @instance
     *
     */
    _mostrarCapa: function() {
      //esriConfig.defaults.io.corsDetection = false;

      switch (this.tipo) {
        case 'A': //CAPAS ESPACIALES
          if (typeof this.infoCapa.urlMetadatoCapa === 'undefined') {
            domClass.add(this.opcionMetadato, 'nodoDeshabilitado');
            this.opcionMetadato.title =
              'Consultar Metadato (No disponible)';
          }
          this.imageIdWidgetCapa.src = require.toUrl(
            'widgets/LayerExplorer/CapaWidget/images/ot.png');
          this.imageIdWidgetCapa.title = "CAPA ESPACIAL - SIGOT";
          if (this.infoCapa === null)
            this.infoCapa = capasStore.get(this.IDCAPA);
          console.log('InfoCapa:');
          console.log(this.infoCapa);
          //esriConfig.defaults.io.alwaysUseProxy = true;
          //this._addCORSDomain(this.infoCapa.URL);
          switch (this.infoCapa.TIPO) {
            case "WMS":
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/wms.png');
              domClass.add(this.opcionSimbologia, 'nodoOculto');
              domClass.add(this.opcionMetadato, 'nodoOculto');
              domClass.add(this.opcionTabla, 'nodoOculto');
              this.layer = new WMSLayer(this.infoCapa.URL, {
                id: '' + this.infoCapa.id,
                format: "png",       
                visibleLayers: [this.infoCapa.NOMBRECAPA]
              });
              console.log(this.layer);
              this.map.addLayer(this.layer);
              break;
            case "REST":
              url = this.infoCapa.URL + '/' + this.infoCapa.NOMBRECAPA;
              console.log(url);
              this.layer = new FeatureLayer(url, {
                id: '' + this.infoCapa.id,
                outFields: ['*'],
                //infoTemplate : new (InfoTemplate),
                mode: FeatureLayer.MODE_ONDEMAND
              });
              this.map.addLayer(this.layer);
              this.layer.on("error", lang.hitch(this, function(event) {
                console.log('On Error!');
                console.log(event);
                if (typeof event.error.status != 'undefined') {
                  console.log('ERROR!!!');
                  console.log(event);
                  //this.infoCapa = capasStore.get(event.target.id);
                  console.log(this.infoCapa);
                  widget = registry.byId('panel_capa_' + this.infoCapa.CAPADOMID);
                  console.log(widget);
                  widget.mostrarMensaje({
                    title: '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>' +
                      ' <b>FALLO CARGA DE CAPA</b>',
                    content: '<table>' +
                      '<tr>' +
                      '<th><b>NOMBRE CAPA:</b></th>' +
                      '<td>' + this.infoCapa.name + '</td>' +
                      '</tr>' +
                      '<tr>' +
                      '<th><b>STATUS:</b></th>' +
                      '<td>' + event.error.status + '</td>' +
                      '</tr>' +
                      '</table>',
                    style: "width: 400px"
                  });
                  widget.quitarCapa();
                }
              }));     
          }
          break;
        default:
          console.log('TIPO DE SERVICIO NO SOPORTADO');
          this.quitarCapa();
          break;
        case 'C': //ARCHIVO EXTERNO EXTERNAS
          domClass.add(dom.byId(this.id), 'capaExterna');
          console.log('/*/*/*/**/*/*/*/*/*/*/*/ FILE');
          console.log(this.layer);
          console.log(this.subTipo);
          switch (this.subTipo) {
            case 'Shapefile':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/shp.png');
              this.imageIdWidgetCapa.title = "Shapefile";
              //DEFINIR RENDERER
              /* let symbolShp = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                  new Color([255,83,13]), 1.4),new Color([255,13,255,0])
              ); */
              //this.layer[0].setRenderer(symbolShp);
              break;
            case 'GPX':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/gpx.png');
              this.imageIdWidgetCapa.title =
                "GPX - Formato de intercambio GPS";
              break;
            case 'CSV':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/csv.png');
              this.imageIdWidgetCapa.title =
                "CSV - Valores separados por comas";
              break;
            case 'KML':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/kml.png');
              this.imageIdWidgetCapa.title =
                "KML - Keyhole Markup Language";
              this.layer = this.layer[0].getLayers();
              break;
            case 'GeoJSON':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/gj.png');
              this.imageIdWidgetCapa.title = "GeoJSON";
              break;
          }
          domClass.add(this.opcionSimbologia, 'nodoOculto');
          domClass.add(this.opcionMetadato, 'nodoOculto');
          console.log('*** Pre problar atributos archivo externo');
          console.log(this.layer);
          this.poblarAtributos(this.layer[0].fields, true);
          this.map.addLayers(this.layer);
          //this.layer[0].on("load",lang.hitch(this,function(event){
          this.checkSimbologia();
          console.log(this.layer);
          //}));
          break;
        case 'D': //URL EXTERNAS
          domClass.add(dom.byId(this.id), 'capaExterna');
          switch (this.subTipo) {
            case 'WMS':
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/wms.png');
              this.imageIdWidgetCapa.title = "WMS - Web Map Service";
              domClass.add(this.opcionSimbologia, 'nodoOculto');
              domClass.add(this.opcionMetadato, 'nodoOculto');
              domClass.add(this.opcionEtiquetar, 'nodoOculto');
              domClass.add(this.opcionTabla, 'nodoOculto');
              this.map.addLayer(this.layer);
              break;
            default:
              this.imageIdWidgetCapa.src = require.toUrl(
                'widgets/LayerExplorer/CapaWidget/images/AC.png');
              this.imageIdWidgetCapa.title = "ArcGIS for Server";
              domClass.add(this.opcionMetadato, 'nodoOculto');
              domClass.add(this.opcionEtiquetar, 'nodoOculto');
              domClass.add(this.opcionTabla, 'nodoOculto');
              //this.map.addLayer(this.layer);
              //this.poblarAtributos(this.layer.fields,true);
              //this.checkSimbologia();
              console.log(this.layer);
              break;
          }
          break;
        case 'E': //RESULTADO GEOPROCESO
          this.imageIdWidgetCapa.src = require.toUrl(
            'widgets/LayerExplorer/CapaWidget/images/gp.png');
          this.imageIdWidgetCapa.title = "Geo-Proceso";
          domClass.add(this.opcionMetadato, 'nodoOculto');
          domClass.add(this.opcionEtiquetar, 'nodoOculto');
          //this.poblarAtributos(this.layer.fields,true);
          this.map.addLayer(this.layer);
          break;
      }



      /*    if(this.tipo=='A'){

         }     */
      /* if( this.layer != null){
          switch(this.tipo){
              case 'A':
              case 'B':

                  this.map.addLayer(this.layer);
                  this.layer.on("load",lang.hitch(this,function(event){
                      console.log('Layer Cargado Construir combobox de atributos');
                      //console.log(event);
                      console.log(this.infoCapa);
                      //this.infoCapa = capasStore.get(event.target.id);
                      if(this.infoCapa.TIPO ==='REST'){
                          callback = lang.hitch(this,function(response){
                              //this.infoCapa = capasStore.get(this.id);
                              widget=registry.byId('panel_capa_'+this.infoCapa.CAPADOMID);
                              widget.poblarAtributos(response.fields,true);
                          });
                          esriRequest({
                              url:this.infoCapa.URL+'/'+this.infoCapa.NOMBRECAPA,
                              content: { f: "json" },
                              handleAs: 'json'
                          }).then(callback,function(){
                              //this.infoCapa = capasStore.get(this.id);
                              widget=registry.byId('panel_capa_'+this.infoCapa.CAPADOMID);
                              widget.poblarAtributos([],false);
                          });
                      }else{
                          widget=registry.byId('panel_capa_'+this.infoCapa.CAPADOMID);
                          campos=this.map.getLayer(event.layer.id).fields;
                          widget.poblarAtributos(campos,true);
                      } */
      /* nodoCapaWidget= dom.byId('panel_capa_'+this.infoCapa.CAPADOMID);
      nodo=query('.SelectAtributos',nodoCapaWidget)[0];
      if (typeof campos != 'undefined'){
          widget=registry.byId('panel_capa_'+this.infoCapa.CAPADOMID);
          opciones=[];
          opciones.push({label:'--Seleccione Atributo',value:''});
          for(var i=0;i<campos.length;i++){
              opciones.push({label:campos[i].alias,value:campos[i].name});
          }
          //console.log(opciones);
          select=new Select({
              name: 'AtributosCapa_'+this.infoCapa.CAPADOMID,
              style: { width: '94%',
                      margin: '2%',
                      height: '30px',
                      'box-shadow':'none'
                   },
              options: opciones
          });
          select.placeAt(nodo);
          select.startup();
          select.on('change',function(event){
              console.log('Cambio Select');
              //console.log(event);
              idCapaWidget=this.name.split('_')[1];
              idCapaWidget='panel_capa_'+idCapaWidget;
              widget=registry.byId(idCapaWidget);
              widget.mostrarEtiqueta(event);
              //console.log(idCapaWidget);
          });
          //DEFINIR ESTILO DE ETIQUETA
          colorTexto = new Color("#000");
          this.estiloEtiqueta = new TextSymbol().setColor(colorTexto);
          this.estiloEtiqueta.font.setSize("12pt");
          this.estiloEtiqueta.font.setFamily("arial");
      }else
          nodo.innerHTML='<label style="margin-left:4px">Sin Atributos</label>';   */
      /*     }));
                        this.layer.on("error",lang.hitch(this,function(event){
                            console.log('On Error!');
                            console.log(event);
                            if (typeof event.error.status != 'undefined'){
                                console.log('ERROR!!!');
                                console.log(event);
                                //this.infoCapa = capasStore.get(event.target.id);
                                console.log(this.infoCapa);
                                widget=registry.byId('panel_capa_'+this.infoCapa.CAPADOMID);
                                console.log(widget);
                                widget.mostrarMensaje({
                                    title:  '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>'+
                                            ' <b>FALLO CARGA DE CAPA</b>',
                                    content: '<table>'+
                                                '<tr>'+
                                                    '<th><b>NOMBRE CAPA:</b></th>'+
                                                    '<td>'+this.infoCapa.name+'</td>'+
                                                '</tr>'+
                                                '<tr>'+
                                                    '<th><b>STATUS:</b></th>'+
                                                    '<td>'+event.error.status+'</td>'+
                                                '</tr>'+
                                            '</table>',
                                    style: "width: 400px"
                                });
                                widget.quitarCapa();
                            }
                        }));
                        break;
                    case 'C':

                        break;
                }
            }                 */
      //esriConfig.defaults.io.alwaysUseProxy = false;


    },
    poblarAtributos: function(campos, estado) {
      console.log(campos);
      //this.infoCapa = capasStore.get(this.IDCAPA);
      nodoCapaWidget = dom.byId(this.id);
      nodo = query('.SelectAtributos', nodoCapaWidget)[0];
      if (typeof campos === 'undefined')
        campos = [];
      if (estado)
        if (campos.length > 0) {
          //CONSTRUIR ARREGLO CON LAS OPCIONES DEL SELECT
          opciones = [];
          opciones.push({
            label: '--Seleccione Atributo',
            value: ''
          });
          for (var i = 0; i < campos.length; i++) {
            if (typeof campos[i].alias != 'undefined')
              opciones.push({
                label: campos[i].alias,
                value: campos[i].name
              });
            else
              opciones.push({
                label: campos[i].name,
                value: campos[i].name
              });
          }
          //CREAR OBJETO SELECT, INYECTAR OPCIONES y COLOCAR EN EL DOM
          select = new Select({
            name: 'AtributosCapa_' + this.id,
            style: {
              width: '94%',
              margin: '2%',
              height: '30px',
              'box-shadow': 'none'
            },
            options: opciones
          });
          select.placeAt(nodo);
          select.startup();
          select.on('change', lang.hitch(this, function(event) {
            //console.log(event);
            //idCapaWidget=this.name.split('_')[1];
            //idCapaWidget='panel_capa_'+idCapaWidget;
            //widget=registry.byId(idCapaWidget);
            //widget.mostrarEtiqueta(event);
            this.mostrarEtiqueta(event);
            //console.log(idCapaWidget);
          }));
          //DEFINIR ESTILO DE ETIQUETA
          colorTexto = new Color("#000");
          this.estiloEtiqueta = new TextSymbol().setColor(colorTexto);
          this.estiloEtiqueta.font.setSize("12pt");
          this.estiloEtiqueta.font.setFamily("arial");
        } else {
          nodo.innerHTML =
            '<label style="margin-left:4px">Sin Atributos</label>';
        } else
        nodo.innerHTML =
        '<label style="margin-left:4px">Fallo Consulta.</label>';

    },
    checkSimbologia: function() {
      switch (this.tipo) {
        case 'A': //CAPAS ESPACIALES SIGOT
          if (this.infoCapa.TIPO == 'REST')
            if (this.layer.geometryType == 'esriGeometryPolygon')
              domClass.remove(this.opcionSimbologia, 'nodoOculto');
          break;
        case 'B': //CAPAS TEMÁTICAS SIGOT
          if (this.layer.geometryType == 'esriGeometryPolygon')
            domClass.remove(this.opcionSimbologia, 'nodoOculto');
          break;
        case 'C': //ARCHIVOS EXTERNOS
          /* switch(this.subTipo){
              case 'Shapefile':
                  if(this.layer[0].geometryType == 'esriGeometryPolygon')
                      domClass.remove(this.opcionSimbologia,'nodoOculto');
                  break;
          }  */
          break;
        case 'D':
          break;
        case 'E':
          break;
      }

      console.log('[---]Layer cargado con geometria:' + this.layer.geometryType);

    },
    /**
     * Extrae el dominio de una URL
     * @private
     * @param {String} url - URL del servicio espacial
     * @returns {String} hostname - Dominio de la URL ingresada
     */
    _extractHostname: function(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
      } else {
        hostname = url.split('/')[0];
      }

      //find & remove port number
      //hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];

      return hostname;
    },
    /**
     * Extrae el dominio de una URL
     * @private
     * @param {String} url - Dominio
     */
    _addCORSDomain(url) {
      filteredArr = array.filter(parents, function(item) {
        return item.name == url;
      });
      if (filteredArr.length === 0)
        esriConfig.defaults.io.corsEnabledServers.push(this._extractHostname(
          this.infoCapa.URL));
    },
    /**
     * Elimina el widget del Panel de Capas (DOM)
     * @public
     * @event click
     * @fires quitarCapa sobre icono de eliminación en la capa
     */
    quitarCapa: function() {
      //console.log(this.layer);
      //QUITAR DEL MAPA
      if (this.tipo == 'A' || this.tipo == 'B' || this.tipo == 'E' ||
        this.tipo == 'D') {
        //layer = this.map.getLayer(this.IDCAPA);
        this.map.removeLayer(this.layer);
      } else if (this.tipo == 'C') {
        array.forEach(this.layer, function(item) {
          this.map.removeLayer(item);
        }, this);
      }

      //ELIMINAR DE PUBLICACION Y CAMBIAR CHECKBOX DE ARBOL
      if (this.tipo === 'A' || this.tipo === 'B') {
        //console.log(this.id.substring(6));

        obj = dijit.byId(this.id.substring(6));
        obj.set("checked", false);
        //VERIFICAR SI NO HAY TEMATICAS REPETIDAS EN AREA DE TRABAJO
        //contenedorCapasWidget = registry.byId('ContenerCapas_1');
        contenedorCapasWidget = registry.byNode(query('.layerexplorer')[0]);
        listaCapas = contenedorCapasWidget.listarCapas();
        contadorTematicas = 0;
        for (var i = 0; i < listaCapas.length; i++) {
          if (listaCapas[i].infoCapa.IDDATO == this.infoCapa.IDDATO &&
            listaCapas[i].infoCapa.IDUNIDADESPACIAL == this.infoCapa.IDUNIDADESPACIAL
          )
            contadorTematicas++;
        }
        //INFORMAR A COMPARACION TEMPORAL
        if (this.tipo == 'B' && contadorTematicas == 1) {
          if (this.infoCapa.IDUNIDADESPACIAL == 1)
            sobreNombre = this.infoCapa.DATO + ' [MUNICIPAL]';
          else
            sobreNombre = this.infoCapa.DATO + ' [DEPARTAMENTAL]';
          topic.publish("identificarCapasTematicas", {
            accion: 'ELIMINAR',
            name: sobreNombre,
            IDDATO: this.infoCapa.IDDATO,
            id: this.infoCapa.IDDATO,
            idWidget: '' + this.id,
            IDUNIDADESPACIAL: this.infoCapa.IDUNIDADESPACIAL,
            idNodoPadre: this.infoCapa.parent
          });
        }

      }
      //INFORMAR DESTRUCCION A WIDGET Identificar
      topic.publish("identificarWidget", {
        accion: 'ELIMINAR',
        name: this.name,
        //id:''+this.infoCapa.id,
        idWidget: '' + this.id
      });

      this.destroy();
    },
    /**
     * Acciona una ventana flotante con una IU para
     * modificar la simbologia de la capa
     * @public
     * @event click
     * @fires cambiarSimbologia sobre icono de simbologia en la capa
     */
    cambiarSimbologia: function() {
      console.log('Cambiar Simbologia: ' + this.id.substring(6));
      wm = WidgetManager.getInstance();
      simbologiaWidget = wm.getWidgetById('Widget_CIAF_9');
      thisWidget = this;
      if (simbologiaWidget == null) {
        confWidget = wm.appConfig.getConfigElementById(
          'Widget_CIAF_9');
        wm.loadWidget(confWidget).then(function() {
          PanelManager.getInstance().showPanel(confWidget).then(
            function() {
              wm.openWidget(confWidget.id);
              thisWidget._publicarDatos('C');
            });
        });
      } else {
        PanelManager.getInstance().showPanel(simbologiaWidget).then(
          function() {
            wm.openWidget(simbologiaWidget);
            thisWidget._publicarDatos('C');
          });
      }
    },
    /**
     * Cambia la visibilidad de la capa de visible a no visible
     * y viceversa
     * @public
     * @event click sobre icono de visibilidad
     * @fires cambiarVisibilidad
     */
    cambiarVisibilidad: function() {
      console.log('Cambiar Visibilidad: ' + this.id.substring(6));
      if (this.visible) {
        if (this.tipo === 'A' || this.tipo === 'B' || this.tipo ===
          'D' || this.tipo === 'E') {
          this.layer.hide();
        } else if (this.tipo === 'C') {
          array.forEach(this.layer, function(item) {
            item.hide();
          }, this);
        }
        this.visible = false;
        nodo = query('.ion-eye', this.id)[0];
        domClass.replace(nodo, "ion-eye-disabled", "ion-eye");
      } else {
        if (this.tipo === 'A' || this.tipo === 'B' || this.tipo ===
          'D' || this.tipo === 'E') {
          this.layer.show();
        } else if (this.tipo === 'C') {
          array.forEach(this.layer, function(item) {
            item.show();
          }, this);
        }
        this.visible = true;
        nodo = query('.ion-eye-disabled', this.id)[0];
        domClass.replace(nodo, "ion-eye", "ion-eye-disabled");

      }
    },
    /**
     * Link que redirecciona al metadato
     * @public
     * @event click Sobre el icono de metadato
     * @fires consultarMetadato
     */
    consultarMetadato: function() {
      let urlMD = '';
      //EVALUAR SI EL METADATO ESTA DISPONIBLE
      switch (this.tipo) {
        case 'A':
          if (typeof this.infoCapa.urlMetadatoCapa === 'undefined')
            return false;
          urlMD = this.infoCapa.urlMetadatoCapa;
          break;
        case 'B':
          if (this.infoCapa.URLMETADATO === 'null')
            return false;
          urlMD = this.infoCapa.URLMETADATO;
          break;
      }

      wm = WidgetManager.getInstance();
      MetaDatoWidget = wm.getWidgetById('Widget_CIAF_2');
      thisWidget = this;
      if (MetaDatoWidget == null) {
        confWidget = wm.appConfig.getConfigElementById(
          'Widget_CIAF_2');
        wm.loadWidget(confWidget).then(function() {
          PanelManager.getInstance().showPanel(confWidget).then(
            function() {
              wm.openWidget(confWidget.id);
              topic.publish("metadato", {
                name: thisWidget.name,
                url: urlMD,
                idCapa: thisWidget.IDCAPA
              });
              //def.resolve();
            });
        });
      } else {
        PanelManager.getInstance().showPanel(MetaDatoWidget).then(
          function() {
            wm.openWidget(MetaDatoWidget);
            topic.publish("metadato", {
              name: thisWidget.name,
              url: urlMD,
              idCapa: thisWidget.IDCAPA
            });
            //def.resolve();
          });
      }
    },
    /**
     * Modifica la propiedad CSS de opacity, accionando la animacion
     * definidad en la clase
     * @public
     * @event click sobre el icono de Generar Transparencia
     * @fires cambiarTransparencia
     */
    cambiarTransparencia: function() {
      this.popUpTransparenciaOn.play();
    },
    /**
     * Muestra una ventana para definir los atributos a mostrar
     * sobre la capa
     * @public
     * @event click sobre el icono de etiquetar Atributo
     * @fires etiquetarAtributo
     */
    etiquetarAtributo: function() {
      console.log('Etiquetar por Atributo: ' + this.id.substring(6));
      this.popUpEtiquetaOn.play();
    },
    closePopupEtiqueta: function() {
      //console.log('Cerrar Etiqueta');
      //console.log(this.popUpEtiquetaOff);
      this.popUpEtiquetaOff.play();
    },
    mostrarEtiqueta: function(campo) {
      console.log(this.layer);
      //DEFINIR ESTILOS
      /*  entidadColor = new Color("#666");
       entidadLine = new SimpleLineSymbol("solid", entidadColor, 1.5);
       entidadSymbol = new SimpleFillSymbol("solid", entidadLine, null);
       entidadRenderer = new SimpleRenderer(entidadSymbol);
       switch(this.tipo){
           case 'A':
           case 'B':
               this.layer.setRenderer(entidadRenderer);
               break;
           case 'C'://EXTERNOS
               array.forEach(this.layer,function(item){
                   item.setRenderer(entidadRenderer);
               },this);
               break;
       } */
      //if(this.tipo==='A'){
      //}
      //this.infoCapa = capasStore.get(this.IDCAPA);
      console.log(this.infoCapa);
      console.log(campo);
      nodo = query('.etiquetarAtributo span i', this.id)[0];
      if (campo.length > 0) {
        //this.infoCapa = capasStore.get(this.IDCAPA);
        domClass.add(nodo, 'CapaOpcionActiva');
        json = {
          "labelExpression": "[" + campo + "]",
          "labelPlacement": "esriServerPolygonPlacementAlwaysHorizontal"
        };
        labelClass = new LabelClass(json);
        console.log(this.estiloEtiqueta);
        labelClass.symbol = this.estiloEtiqueta; // symbol also can be set in LabelClass' json
        switch (this.tipo) {
          case 'A':
          case 'B':
            this.layer.setLabelingInfo([labelClass]);
            break;
          case 'C': //EXTERNOS
            array.forEach(this.layer, function(item) {
              item.setLabelingInfo([labelClass]);
            }, this);
            break;
          case 'D': //URL EXTERNA
            if (this.subTipo != 'WMS')
              this.layer.setLabelingInfo([labelClass]);
            break;
        }



        /* if(this.tipo != 'C')
            this.layer.setLabelingInfo([labelClass]);
        else
            array.forEach(this.layer,function(item){
                item.setLabelingInfo([labelClass]);
            },this); */
        /* layerDrawingOption = new LayerDrawingOptions({
            labelingInfo: [labelClass],
            showLabels: true
        });
        optionsArray = [];
        optionsArray[this.infoCapa.NOMBRECAPA] = layerDrawingOption;
        //layerDrawingOption.renderer=SimpleRenderer(this.estiloEtiqueta);
        this.layer.setLayerDrawingOptions(optionsArray);
        this.layer.show(); */
        console.log("mensaje  finalizacion ");
      } else {
        //this.layer.setLayerDrawingOptions([ ]);
        switch (this.tipo) {
          case 'A':
          case 'B':
            this.layer.setLabelingInfo([]);
            break;
          case 'C': //EXTERNOS
            array.forEach(this.layer, function(item) {
              item.setLabelingInfo([]);
            }, this);
            break;
          case 'D': //URL EXTERNA
            if (this.subTipo != 'WMS')
              this.layer.setLabelingInfo([]);
            break;
        }
        //this.layer.setLabelingInfo([]);
        domClass.remove(nodo, 'CapaOpcionActiva');
      }


    },
    /**
     * Modifica la propiedad CSS de opacity del layer
     * @public
     * @event onchange sobre el rango de visibilidad en popup
     * @fires changeTransparencia
     */
    changeTransparencia: function(obj) {
      nodo = query('.popupCapaWidget label', this.id)[0];
      nodo.innerHTML = obj.target.value;
      if (this.tipo === 'A' || this.tipo === 'B' || this.tipo === 'D' ||
        this.tipo === 'E') {
        this.layer.setOpacity((100 - obj.target.value) / 100);
      } else if (this.tipo === 'C') {
        array.forEach(this.layer, function(item) {
          item.setOpacity((100 - obj.target.value) / 100);
        }, this);
      }
    },
    /**
     * Modifica la propiedad CSS de opacity del popup de transparencia
     * @public
     * @event onclick sobre el icono cierre dentro del popup
     * @fires closePopup
     */
    closePopupTransparencia: function(obj) {
      this.popUpTransparenciaOff.play();

    },
    mostrarMensaje: function(mensaje) {
      ventanaMensaje = new Dialog(mensaje);
      ventanaMensaje.show();
    },
    mostrarTablaAtributos: function() {
      console.log('Mostrar Tabla Atributos');
      wm = WidgetManager.getInstance();
      MetaDatoWidget = wm.getWidgetById('Widget_CIAF_6');
      thisWidget = this;
      confWidget = wm.appConfig.getConfigElementById('Widget_CIAF_6');
      if (MetaDatoWidget == null) {
        wm.loadWidget(confWidget).then(lang.hitch(this, function() {
          PanelManager.getInstance().showPanel(confWidget).then(
            lang.hitch(this, function() {
              dojo.style("Widget_CIAF_6_panel", {
                "display": "block"
              });
              wm.openWidget(confWidget.id);
              setTimeout(function() {
                focusUtil.focus(dom.byId(
                  "Widget_CIAF_6_panel"));
                focusUtil.focus(dom.byId(
                  "Widget_CIAF_6_panel"));
                nodo = dom.byId("Widget_CIAF_6_panel");
                event = document.createEvent(
                  "HTMLEvents");
                event.initEvent("click", false, true);
                console.debug(event);
                nodo.dispatchEvent(event);
              }, 800);
              topic.publish("tablaAtributosExplorer", {
                layer: this.layer,
                tipo: this.tipo,
                subTipo: this.subTipo,
                nombre: this.name,
                rangos: this.rangos
              });
            }));
        }));
      } else {
        PanelManager.getInstance().showPanel(MetaDatoWidget).then(
          lang.hitch(this, function() {
            dojo.style("Widget_CIAF_6_panel", {
              "display": "block"
            });
            wm.openWidget(confWidget.id);
            setTimeout(function() {
              focusUtil.focus(dom.byId("Widget_CIAF_6_panel"));
              nodo = dom.byId("Widget_CIAF_6_panel");
              event = document.createEvent("HTMLEvents");
              event.initEvent("click", false, true);
              console.debug(event);
              nodo.dispatchEvent(event);
              console.log('FOCUS');


            }, 800);
            topic.publish("tablaAtributosExplorer", {
              layer: this.layer,
              tipo: this.tipo,
              subTipo: this.subTipo,
              nombre: this.name,
              rangos: this.rangos
            });
          }));
      }
    },
    _handleDragStart: function(event) {
      //console.log('Drag en '+event.target.id);
      //AJUSTE PARA GOOGLE CHROME
      if (!event.currentTarget.draggable) {
        event.preventDefault();
        return false;
      }
      event.dataTransfer.setData('Text', this.id);
      event.dataTransfer.dropEffect = "move";
      nodo = dom.byId(event.target.id);
      this.positionTop = html.coords(nodo).t;
      this.positionLeft = html.coords(nodo).l;
      ContentCapasDndTarget.idTarget = this.id;
      ContentCapasDndTarget.y = event.clientY;
      ContentCapasDndTarget.t = html.coords(nodo).t;
      //console.log('left:'+this.positionLeft+'-Top:'+this.positionTop);
      //console.log('width:'+html.coords(nodo).w);
      //console.log('Y:'+event.clientY);
      //console.log(this);
      setTimeout(lang.hitch(this, function() {
        //console.log('Add class capaDrag');
        //console.log(this);
        nodo = this;
        domClass.add(nodo, 'capaDrag');
        domStyle.set(nodo, 'top', this.positionTop) + 'px';
        domStyle.set(nodo, 'left', this.positionLeft + 'px');
        domStyle.set(nodo, 'width', html.coords(nodo).w + 'px');
        domStyle.set(nodo, 'z-index', '3');
        domStyle.set(nodo, 'position', 'absolute');
        domConstruct.place('<div id="capaSpot"></div>',
          ContentCapasDndTarget.idTarget, 'before');

      }), 10);
      /* this.dndmove= on(dom.byId('ContentCapas_0'),'dragover',function(event){
          nodo=dom.byId(ContentCapasDndTarget.idTarget);
          positionTop=ContentCapasDndTarget.t+(event.clientY-ContentCapasDndTarget.y)+20;
          domStyle.set(nodo,'top',positionTop+'px');
          console.log('movimiento mouse:'+event.clientY);
      }); */

    },
    _handleDragEnter: function(event) {
      nodo = event.target || event.srcElement;
      nodoId = query(nodo).closest('.capa')[0].id;
      //console.log('Origen'+this.id);
      //console.log('Entro a :'+nodoId);
      //console.log(event);
      /* if(nodoId!=ContentCapasDndTarget.idTarget)
          domConstruct.place(dom.byId('capaSpot'),nodoId,'after'); */

      //console.log('Drag entro a '+this.id);
      //console.log(this);
      //console.log(event);
    },
    _handleDragOver: function(event) {
      nodo = event.target || event.srcElement;
      nodoId = query(nodo).closest('.capa')[0].id;
      if (ContentCapasDndTarget.overTarget != nodoId)
        ContentCapasDndTarget.overTarget = nodoId;
      else
        return false;
      if (nodoId != ContentCapasDndTarget.idTarget)
        setTimeout(function() {
          //console.log('*'+nodoId);

          domConstruct.place(dom.byId('capaSpot'), nodoId, 'before');
        }, 10);

      //console.log('*Origen '+this.id);
      //console.log(event);
      //console.log(nodoId);
      //console.log(this);
      //console.log(event);
      /* if(event.preventDefault)
          event.preventDefault(); */
      //event.dataTransfer.dropEffect = 'move';
    },
    _handleDragLeave: function(event) {
      //console.log('Drag salio de '+event.target.id);
    },
    _handleDrop: function(event) {
      console.log('*Origen drop' + this.id);
      console.log('Drop en ' + event.target.id);
      data = event.dataTransfer.getData("text");
    },
    _handleDragEnd: function(event) {
      capas = registry.findWidgets(dom.byId('graphicLayer'));
      console.log(capas);
      console.log('*Origen' + this.id);
      console.log('Drag finalizo en ' + event.target.id);
      data = event.dataTransfer.getData("text");
      //this.dndmove.remove();
      nodoOrigen = dom.byId(event.target.id);
      nodoDestino = dom.byId('capaSpot');
      setTimeout(lang.hitch(this, function() {
        console.log(this);
        console.log(event)
        domConstruct.place(nodoOrigen, nodoDestino, 'before');
        domConstruct.destroy("capaSpot");
        domStyle.set(nodoOrigen, 'z-index', '2');
        domStyle.set(nodoOrigen, 'position', 'static');
        domStyle.set(nodoOrigen, 'width', '100%');
        domClass.remove(nodoOrigen, 'capaDrag');
        capas = registry.findWidgets(dom.byId('graphicLayer'));
        console.log(capas);
        posicion = 0;
        while (capas[posicion].id != event.target.id) {
          posicion++;
        }
        widgetDraged = capas[posicion];
        nuevaPosicionCapa = (capas.length + 1) - posicion;
        console.log(nuevaPosicionCapa);
        console.log(widgetDraged);
        this.map.reorderLayer(this.map.getLayer(widgetDraged.IDCAPA),
          nuevaPosicionCapa);
        //this.map.reorderLayer(widgetDraged.layer,nuevaPosicionCapa);
      }), 10);

      ContentCapasDndTarget.idTarget = '';
      ContentCapasDndTarget.overTarget = '';
      ContentCapasDndTarget.y = 0;
      ContentCapasDndTarget.t = 0;

    },
    _publicarDatos: function(tipo) {
      switch (tipo) {
        case 'A': //IDENTIFICAR WIDGET - CREAR
          topic.publish("identificarWidget", {
            accion: 'CREAR',
            name: this.name,
            idWidget: '' + this.id
          });
          break;
        case 'B':
          break;
        case 'C': //CAMBIAR SIMBOLOGIA
          topic.publish("cambiarSimbologiaWidget", {
            name: this.name,
            idWidget: '' + this.id,
            tipo: this.tipo
          });
          break;
      }
    }
  });
});
