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
    //EVENTO QUE RESPONDE AL EVENTO CLICK EN EL BOTON
    activar: function() {
      console.log('Activar Boton');
      //MenuWidget__Btn  MenuWidget__Btn--red
      //nl = query(".MenuWidget__Btn--Single",dom.byId(this.id));
      //console.log(this.id);
      //console.log(nl);
      let MenuWidget = registry.byId('MenuWidgetOficina205');
      switch (this.tipo) {
        case 'A':
        case 'C':
          MenuWidget._openWidget(this.config.id);
          break;
        case 'B':
          this._poblar();
          break;
      }
    },    
    _poblar: function() {
      let MenuWidget = registry.byId('MenuWidgetOficina205');
      MenuWidget.poblarListWidget(this.childWidgets,this.name);
    }
  });

});
