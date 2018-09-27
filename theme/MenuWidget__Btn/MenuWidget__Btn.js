define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./template.html',
    'dojo/dom-class',
    "dojo/dom-construct",
    'dojo/dom',
    "dojo/query",
    "dijit/registry",
    "dojox/layout/FloatingPane",
    'dojo/_base/window',
    "dojo/_base/lang",
    'xstyle/css!./style.css'
], function(declare, _WidgetBase, _TemplatedMixin, template,
  domClass, domConstruct, dom, query, registry, FloatingPane,
  window, lang) {
  return declare("", [_WidgetBase, _TemplatedMixin], {
    typeClass: '',
    name: '',
    icon: '',
    templateString: template,
    childWidgets: null,
    tipo: '',
    postCreate: function() {
      console.log('-- PostCreate single widget');
      this.inherited(arguments);
      if (this.tipo === 'C')
        this.labelWidgetOnList.innerHTML = this.name;
    },
    startup: function() {
      console.log('-- Startup single widget');
    },
    activar: function() {
      console.log('Activar Boton');
      //MenuWidget__Btn  MenuWidget__Btn--red
      //nl = query(".MenuWidget__Btn--Single",dom.byId(this.id));
      //console.log(this.id);
      //console.log(nl);
      switch (this.tipo) {
        case 'A':
        case 'C':
          this._openWidget();
          break;
        case 'B':
          this._poblar();
          break;
      }
    },
    _openWidget: function() {
      console.log('Abrir Widget');
      let nodo = domConstruct.create("div", {
        id: 'Mipanel'
      }, window.body(), 'last');
      let MenuWidget = registry.byId('MenuWidgetOficina205');
      let configWidget_Btn = MenuWidget.storeWidgets.get(this.config.id);
      if (!configWidget_Btn.opened) {
        configWidget_Btn.opened = true;
        require([
                    configWidget_Btn.uri + '/widget',
                    'xstyle/css!./' + configWidget_Btn.uri + '/css/style.css'
                ], function(customWidget) {
          console.log(configWidget_Btn);
          let estilo = "";
          if (configWidget_Btn.top != undefined &&
            configWidget_Btn.left != undefined) {
            estilo = 'position:absolute;top:' + configWidget_Btn.top +
              ';left:' + configWidget_Btn.left +
              ';width:400px;height:550px;';
          } else {
            estilo =
              'position:absolute;top:80px;left:80px;width:400px;height:550px;';
          }

          let panelFlotante = new FloatingPane({
            title: configWidget_Btn.name,
            closable: false,
            resizable: true,
            dockable: true,
            content: new customWidget({
              id: 'ContenerCapas_1'
            }),
            dockTo: MenuWidget.dock,
            style: estilo,
            id: 'panelFlotante_' + configWidget_Btn.id
          }, nodo);
          //panelFlotante.placeAt(window.body(),'last');
          panelFlotante.startup();
          console.log('widget ' + configWidget_Btn.id +
            ' fue creado');
        });


      } else {
        console.log('El Widget ya fue creado' + this.id);
      }


    },
    _poblar: function() {
      let MenuWidget = registry.byId('MenuWidgetOficina205');
      MenuWidget.poblarListWidget(this.childWidgets);
    }
  });

});
