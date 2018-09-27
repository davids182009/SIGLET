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
    'xstyle/css!./style.css'

],function(declare,_WidgetBase,_TemplatedMixin,
    _WidgetsInTemplateMixin,request,lang,
    domConstruct,array,domClass,dom,Topic,
    MenuWidget__Btn,template){
        
        return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin],{
            baseClass: 'MenuWidget', 
            templateString: template,
            id:'MenuWidgetOficina205',
            config:null,
            postCreate: function(){
                this.inherited(arguments); 
                console.log('**** Widget MenuWidget');
                //console.log(location.pathname.replace(/\/[^/]+$/, ""));
                //console.log(location.pathname);
                this._loadWidgetInventory();

            },
            startup: function() {
                //this.inherited(arguments); 
                console.log('Widget Started');
                
                
                
            },
            _loadWidgetInventory:function(){
                request.post("theme/config.json",{
                    handleAs: 'json'
                }).then(lang.hitch(this,
                function(widgetsData){
                    this.config=widgetsData;
                    Topic.publish("configMapa",widgetsData.map);
                    listaWidgetSingle=this.config.widgetSingle;
                    array.forEach(listaWidgetSingle,function(item){
                        new MenuWidget__Btn({
                            name:item.name,
                            typeClass:'MenuWidget__Btn MenuWidget__Btn--Single MenuWidget__Btn--red',
                            icon:item.uri+'/img/'+item.icon,
                            tipo:'A'
                        }).placeAt(this.singleWidgets,'last');
                    },this);
                    
                    listaWidgetGroup=this.config.widgetGroup;
                    array.forEach(listaWidgetGroup,function(item){
                        new MenuWidget__Btn({
                            name:item.name,
                            typeClass:'MenuWidget__Btn MenuWidget__Btn--Group MenuWidget__Btn--red',
                            icon:'theme/img/'+item.icon,
                            childWidgets:item.widgets,
                            tipo:'B'
                        }).placeAt(this.WidgetsOnGroup,'last');
                    },this);

                })); 
            },
            CloseListWidget:function(event){
                nodoChildrenWidget=dom.byId('listWidget');
                domClass.remove(nodoChildrenWidget,'listWidgetDeploy');
            },
            poblarListWidget:function(list){
                console.log('Poblando lista');
                nodoChildrenWidget=dom.byId('listWidget');
                domClass.add(nodoChildrenWidget,'listWidgetDeploy');
                this.WidgetsOnGroupList.innerHTML='';
                array.forEach(list,function(item){
                    new MenuWidget__Btn({
                        name:item.name,
                        typeClass:'MenuWidget__Btn--list',
                        icon:item.uri+'/img/'+item.icon,
                        childWidgets:item.widgets,
                        tipo:'C'
                    }).placeAt(this.WidgetsOnGroupList,'last');
                },this);
            }
        });


    });