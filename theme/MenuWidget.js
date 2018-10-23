/**
 * Dojo AMD (Asynchronous Module Definition )
 * Widget que representa la estructura de contenedores principales
 * @version 1.0
 * @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
 * History
 *
 */

/**
 * Modulo que representa el menu de acceso a funcionalidades (Widgets) disponibles.
 * Las funcionalidades disponibles se obtiene de JSON de configuración.
 * @module MenuWidget
 */

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/request',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/dom-class',
    'dojo/dom',
    "dojo/topic",
    './MenuWidget__Btn/MenuWidget__Btn',
    'dojo/text!./template.html',
    'dojox/layout/Dock',
    'dojo/_base/window',
    'dojo/store/Memory',
    "dijit/registry",
    "dojo/dom-style",
    "dojo/on",
    'xstyle/css!./style.css'

], function(declare, _WidgetBase, _TemplatedMixin,
  _WidgetsInTemplateMixin, request, lang,
  domConstruct, array, domClass, dom, Topic,
  MenuWidget__Btn, template, Dock, win,
  Memory, registry,domStyle,on) {
  /**
   * Crea un nuevo MenuWidget (Constructor)
   * @class
   * @alias module:MenuWidget
   *
   */
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    baseClass: 'MenuWidget',
    templateString: template,
    id: 'MenuWidgetOficina205',
    config: null,
    dock: null,
    storeWidgets: null,
    visibilidadBtn:false,
    visibilidadContent:false,
    visibilidadListWidget:false,
    widgetTarget:0,
    openedWidgets:[],
    /**
     * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando
     * todas las propiedades del widget son definidas y el fragmento
     * HTML es creado, pero este no ha sido incorporado en el DOM.
     *
     * @function
     *
     */
    postCreate: function() {
      this.inherited(arguments);
      console.log('**** Widget MenuWidget');
      console.log(this);
      //SE CARGA JSON DE CONFIGURACIÓN Y CONSTRUYE MENU
      this._loadWidgetInventory();
      //SE CONSTRUYE DOCK PARA ALOJAR WIDGETS TIPO FLOATING
      /* let nodo = domConstruct.create("div", {
        id: 'dockWidgets'
      }, win.body(), 'last'); */
      /* this.dock = new Dock({
        style: 'position:absolute;bottom:0px,left:0px;background: #E74C3C;height: 40px;width: 100%;'
      }, nodo); */

    },
    /**
     * Funcion que cargar archivo config.json, que posteriormente interpreta para
     * crear los botones grupales o individuales definidos en el archivo de
     * configuración.
     *
     * @function
     *
     */
    _loadWidgetInventory: function() {
      request.post("theme/config.json", {
        handleAs: 'json'
      }).then(lang.hitch(this,
        function(widgetsData) {
          this.config = widgetsData;
          Topic.publish("configMapa", widgetsData.map);
          //CALCULAR ANCHO BOX DE BOTONES
          let listaWidgetSingle = this.config.widgetSingle;
          let listaWidgetGroup = this.config.widgetGroup;          
          let widthBox=41;
          widthBox = widthBox*(1+listaWidgetSingle.length+ listaWidgetGroup.length);
          domStyle.set(this.box_btns,'width',widthBox+'px');
          //RECORRIDO DE WIDGETS INDIVIDUALES          
          let listaWidgets = [];
          array.forEach(listaWidgetSingle, function(item) {
            new MenuWidget__Btn({
              id: 'MenuWidget_Btn_' + item.id,
              name: item.name,
              typeClass: 'boxMenu_options_btn boxMenu_options_btn_A',
              icon: item.uri + '/images/' + item.icon,
              tipo: 'A',
              config: item
            }).placeAt(this.list_btn, 'last');
            item['opened'] = false;
            listaWidgets.push(item);
          }, this);
          //RECORRIDO DE WIDGETS GRUPALES
          listaWidgetGroup = this.config.widgetGroup;
          array.forEach(listaWidgetGroup, function(item) {
            new MenuWidget__Btn({
              name: item.name,
              typeClass: 'boxMenu_options_btn boxMenu_options_btn_A',
              icon: 'theme/images/' + item.icon,
              childWidgets: item.widgets,
              tipo: 'B'
            }).placeAt(this.list_btn, 'last');
            let widgetsOnGroup = item.widgets;
            for (let i = 0; i < widgetsOnGroup.length; i++) {
              widgetsOnGroup[i]['opened'] = false;
              listaWidgets.push(widgetsOnGroup[i]);
            }
          }, this);
          //CONSTRUCCION DE STORE CON INFORMACIÓN DE LOS WIDGETS DISPONIBLES
          this.storeWidgets = new Memory({
            data: listaWidgets
          });
          //ABRIR WIDGETS POR DEFECTO
          array.forEach(this.storeWidgets.query({openOnLoad:true}),function(item){
            this._openWidget(item.id);
          },this); 
        }));
    },
    /**
     * Funcion que cierra visualmente la lista de widget de un grupo.
     * data-dojo-attach-event en HTML template
     *
     * @callback
     * @param {Object} - Objeto de evento click
     *
     */
    CloseListWidget: function(event) {      
      domClass.add(this.box_content_menu,'hide_left');
      this.visibilidadListWidget = false;
    },
    openListWidget: function(){
      domClass.remove(this.box_content_menu,'hide_left');
      this.visibilidadListWidget = true;
      if(this.visibilidadContent)
        this.closeContent(null);
    },
    /**
     * Construye lista de widgets de un boton agrupador
     *
     * @function
     * @param {array} list -Arreglo de objetos con información de widgets
     *
     */
    poblarListWidget: function(list,name) {
      console.log('Poblando lista');
      //nodoChildrenWidget = dom.byId('listWidget');
      //domClass.add(nodoChildrenWidget, 'listWidgetDeploy');
      //Destruir Widgets previos
      //Menu_deploy es un attach point en el HTML template
      let widgetPrevios = registry.findWidgets(this.Menu_deploy);
      for (let i = 0; i < widgetPrevios.length; i++) {
        widgetPrevios[i].destroy();
      }
      this.Menu_deploy.innerHTML = '';
      //VALIDAR QUE AREA DE VISUALIZACION ESTE DISPONIBLE     
      if(!this.visibilidadListWidget)
        this.openListWidget();
      this.box_content_menu_title.innerHTML = name;  
      //CREAR LOS BOTONES HIJO
      array.forEach(list, function(item) {
        new MenuWidget__Btn({
          id: 'MenuWidget_Btn_' + item.id,
          name: item.name,
          typeClass: 'boxMenu_options_btn--list',
          icon: item.uri + '/images/' + item.icon,
          childWidgets: item.widgets,
          tipo: 'C',
          config: item
        }).placeAt(this.Menu_deploy, 'last');
      }, this);
    },

    cambiarVisibilidadBtn:function(event){        
        if(this.visibilidadBtn){ //LOS BOTONES SON VISIBLES
          this.visibilidadBtn = false;
          domClass.add(this.list_btn,'hide_top');
          domClass.replace(this.btn_menu,'btn_options_close_animated','btn_options_close');
          setTimeout(function(nodo){
              domClass.replace(nodo,'btn_options_open','btn_options_close_animated');
          }, 400,this.btn_menu);
        }else{//LOS BOTONES NO ESTAN VISIBLES
          this.visibilidadBtn = true;
          domClass.remove(this.list_btn,'hide_top');
          domClass.replace(this.btn_menu,'btn_options_open_animated','btn_options_open');
          setTimeout(function(nodo){
            domClass.replace(nodo,'btn_options_close','btn_options_open_animated');
        }, 400,this.btn_menu);
        }        
    },
    _openWidget: function(id) {
      console.log('Abrir Widget');
 /*      let nodo = domConstruct.create("div", {
        id: 'Mipanel'
      }, window.body(), 'last'); */
      let MenuWidget = this;
      let configWidget_Btn = this.storeWidgets.get(id);
      if (!configWidget_Btn.opened) {
        configWidget_Btn.opened = true;
        if(!MenuWidget.visibilidadContent)
          MenuWidget.openContent();
          
        require([
                    configWidget_Btn.uri + '/widget',
                    'xstyle/css!./' + configWidget_Btn.uri + '/css/style.css'
                ], function(customWidget){
          console.log(configWidget_Btn);
          //CREAR NODO EN DOM QUE CONTIENE WIDGET          
          let nodeCustomWidget = domConstruct.toDom('<div id="widget_box_'+configWidget_Btn.id+'" class="widget_content"></div>');
          domConstruct.place(nodeCustomWidget,MenuWidget.widget_deploy,'last');
          //CREAR WIDGET E INSERTAR A NODO CONTENEDOR
          let cw = new customWidget({
            id:'customWidget_'+configWidget_Btn.id
          });
          cw.placeAt(nodeCustomWidget,'last');
          cw.startup();
          //CREAR ICONO LATERAL QUE INDICA QUE ESTA ABIERTO
          MenuWidget.addIconWidget(configWidget_Btn);                   
          console.log('widget ' + configWidget_Btn.id +' fue creado');
        });


      } else {
        console.log('El Widget ya fue creado' + this.id);
        MenuWidget.openContent();
        MenuWidget.changeWidget(configWidget_Btn);
        /* if(!MenuWidget.visibilidadContent){
          MenuWidget.visibilidadContent=true;
          domClass.remove(MenuWidget.box_content_widget,'hide_left');
        } */
      }


    },
    closeContent:function(event){
      domClass.add(this.box_content_widget,'hide_left');
      this.visibilidadContent=false;
    },

    openContent:function(){
      if(!this.visibilidadContent){
        domClass.remove(this.box_content_widget,'hide_left');
        this.visibilidadContent = true;
        if(this.visibilidadListWidget)  
          this.CloseListWidget(null);
      }
    },    
    addIconWidget:function(item){
      if(this.widgetTarget != 0){
        let targetActual = dom.byId('widget_icon_'+this.widgetTarget);
        domClass.remove(targetActual,'selected');
      }      
      let iconoLateral = domConstruct.toDom('<li class="selected" id="widget_icon_'+item.id+'" title="'+item.name+'" ><img src="'+ item.uri + '/images/' + item.icon +'"></li>');          
      domConstruct.place(iconoLateral,this.dock_widgets,'last');
      this.openedWidgets.push(item.id);
      on(iconoLateral,'click',lang.hitch(this,this.handleChangeWidget(item)));
      this.changeWidget(item);
    },
    handleChangeWidget:function(item){
      return function(event){
        this.openContent();
        this.changeWidget(item);            
      }
    },
    changeWidget: function(item){
      let id = item.id;      
      let focusWidget=null;
      if(id != this.widgetTarget){
        if(this.widgetTarget == 0) //FIRST TIME
          this.widgetTarget = id;
        let pos = -1;
        for(let i=0;i<this.openedWidgets.length;i++){
          if(this.openedWidgets[i] == id){
            pos = i;
            break;
          }
        }    
        focusWidget = this.storeWidgets.get(id);
        if(focusWidget.closable != undefined && !focusWidget.closable)
          domStyle.set(this.closeIconWidget,'display','none');
        else
          domStyle.set(this.closeIconWidget,'display','block');

        let targetActual = dom.byId('widget_icon_'+this.widgetTarget);
        domClass.remove(targetActual,'selected');
        let height = domStyle.get(widget_deploy,'height');
        pos=-height*pos;
        domStyle.set(this.widget_louver,'margin-top',''+pos+'px');
        this.widgetTarget = id;          
        let targetNuevo = dom.byId('widget_icon_'+id);
        domClass.add(targetNuevo,'selected');
        this.widget_title.innerHTML = item.name;   
        this.widget_title.title =  item.name;    
      }
    }


    
    
  });


});
