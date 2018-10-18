
/**
* Dojo AMD (Asynchronous Module Definition ) 
* Widget que representa la estructura de contenedores principales
* @version 1.0
* @author Juan Carlos Valderrama Gonzalez<dyehuty@gmail.com>
* History
* 
*/

/**
 * Define 
 * y el Panel de capas, junto a una caja separadora (Splitter) para 
 * redimensionar los contenedores
 */

var ContentCapasDndTarget= {idTarget:'',overTarget:'',y:0,t:0};

 /**
 * Modulo que representa Explorador de capas donde se definen contenedores
 * para la tabla de contenido y el area de trabajo donde se cargan las capas.
 * @module LayerExplorer 
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./template.html",
    "dojo/dom-geometry",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dojo/request",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/store/Memory",	
	"dijit/Tree",
    "dijit/tree/ObjectStoreModel",
    "dijit/form/CheckBox",
    "dijit/registry",
    "dojo/Deferred", 
    "dojo/dom-class",
    "dojo/request/script",    
    "dojo/request/xhr",
    "esri/request",
    "dijit/Dialog",
    "./CapaWidget/CapaWidget",  
    'xstyle/css!./css/style.css',   
    "dojo/domReady!"], 
    function(declare,_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin,
            template,domGeom,ContentPane,BorderContainer,TabContainer,
            request,dom,domStyle,domAttr,query,domConstruct,on,lang,
            array,Memory,Tree,ObjectStoreModel,checkBox,registry,
            Deferred,domClass,Script,xhr,esriRequest,Dialog,CapaWidget){

    /**
     * Crea un nuevo MenuWidget (Constructor)
     * @class
     * @alias module:MenuWidget     
     * @property {String} templateString - Contenido del archivo CapaWidget.html
     * @property {String} baseClass - valor del atributo class del nodo traido en el template
     * @property {obj} map - Objeto Map de ESRI
     * @property {obj} tree - Arbol jerarquico de capas 
     * 
     */
    return declare("ContentCapas",[_WidgetBase, _TemplatedMixin,_WidgetsInTemplateMixin], {
       
        templateString: template,       
        baseClass: "layerexplorer",
        map: null,
        id:'',
        capasStore:null,
        capasStoreTematico:null,
        tree: null,
        treeTematico:null,
        treeTabs:null,
        idExternos:99000,        
        ContentCapasDndTarget : {idTarget:'',overTarget:'',y:0,t:0},
        /**
        * Funcion del ciclo de vida del Widget en Dojo, se dispara cuando 
        * todas las propiedades del widget son definidas y el fragmento
        * HTML es creado, pero este no ha sido incorporado en el DOM.
        * 
        * @memberOf ContentCapas
        */
        postCreate:function(){
            this.inherited(arguments);
            domGeom.boxModel = "border-box";
                            
        },
        /**
        * Funcion del ciclo de vida del Widget en Dojo,se dispara despues
        * del postCreate, cuando el nodo ya esta insertado en el DOM.
        * Dependiendo de la declaracion del widget este puede no dispararse.
        * Construye 2 contenedores con Sppliter y el arbol de capas en el 
        * contenedor superior y define la ventana de información/popup asociado
        * al objeto mapa global.
        * 
        * @memberOf ContentCapas
        */
        startup: function () {  
            this.__setupPanelLayout();  
            this._setupTreeLayers();  
            on(dom.byId('Lastcapa'),'dragover',function(event){
                nodoId = dom.byId('Lastcapa');
                setTimeout(function(){
                    domConstruct.place(dom.byId('capaSpot'),nodoId,'before');
                },10);                
            });        
            this.nodoInputBuscar = query('input[type=text]',dom.byId('formFiltrarCapa'))[0];    
            on(dom.byId('formFiltrarCapa'),'submit',lang.hitch(this,this.filtrarCapas));
        },
        /**
        * Funcion que crea e inserta los contenedores al attach-point 
        * ContentLayerExplorer definido en la plantilla
        * @memberOf ContentCapas
        * @instance
        */
        __setupPanelLayout: function () {  
            this.bc = new BorderContainer({ liveSplitters: true },this.ContentLayerExplorer);    
            explorador = new ContentPane({  
                region: 'center',  
                //content: '<div id="tree"></div>',
                content: '<div id="tree" class="nodoOculto"></div>'
                        +'<div id="LayerExplorerMask1" class="mask">'
                            +'<img src="images/loading-1.gif"><br>'
                            +'Cargando listado de capas espaciales …'
                        +'</div>',
                minSize:200                
            });    
            panel = new ContentPane({  
                region: 'bottom',  
                content: '<ul id="tituloAreadeTrabajo">'
                            +'<li><b>ÁREA DE TRABAJO</b></li>'
                            +'<li class="opciones prenderCapas">'
                                +'<span>'
                                    +'<i class="icon ion-eye"></i>'
                                +'</span>'
                            +'</li>'
                            +'<li class="opciones apagarCapas">'
                                +'<span>'
                                    +'<i class="icon ion-eye-disabled"></i>'
                                +'</span>'
                            +'</li>'
                        +'</ul>'
                        +'<div id="workspace">'
                            +'<div id="graphicLayer">'
                                +'<div id="Lastcapa" draggable="true"></div>'
                            +'</div>'
                            +'<div id="layerSplitter">'
                            +'</div>'
                            +'<div id="imageLayer">'
                            +'</div>'
                        +'</div>',  
                style: 'height: 300px;',  
                splitter: true,
                minSize:300
            });    
            this.bc.addChild(explorador);  
            this.bc.addChild(panel);  
            this.bc.startup();  
            this.bc.resize(); 
            tituloAreadeTrabajo = dom.byId('tituloAreadeTrabajo');            
            icono=query('.prenderCapas',tituloAreadeTrabajo)[0];
            on(icono,'click',this.prenderCapas);
            icono=query('.apagarCapas',tituloAreadeTrabajo)[0];
            on(icono,'click',this.apagarCapas);
            //CREACIÓN DE PESTAÑAS
            /* this.treeTabs = new TabContainer({
                style:'height:100%; width:100%'
            },'TabCapas');
            cp1 = new ContentPane({
                id: 'TabEspaciales',
                title: 'ESPACIALES',
                content: '<div id="tree" class="nodoOculto"></div>'
                        +'<div id="LayerExplorerMask1" class="mask">'
                            +'<img src="images/loading-1.gif"><br>'
                            +'Cargando listado de capas espaciales …'
                            +'</div>'
            });
            this.treeTabs.addChild(cp1);
            

            cp2 = new ContentPane({
                id: 'TabTematicas',
                title: 'TEMÁTICAS',
                content: '<div id="treeTematicas" class="nodoOculto"></div>'
                            +'<div id="LayerExplorerMask2" class="mask">'
                                +'<img src="images/loading-1.gif"><br>'
                                +'Cargando listado de capas temáticas…'
                            +'</div>'
            });
            this.treeTabs.addChild(cp2);
            this.treeTabs.startup();
            this.treeTabs.resize(); */
        },
        /**
        * Realiza la consulta al administrador de capas para obtener
        * la tabla de contenido, con la cual se crea el arbol de nodos
        * @memberOf ContentCapas
        * @instance
        */
        _setupTreeLayers:function(){
            /**
             * 1. Obtener JSON tabla de contenido en variable global TemporalTablaCapas
             */
            //request.get('http://172.17.3.50:8080/adminalfa/AdminGeoApplication/AdminGeoWebServices/getTablaContenido/',{
            request.get('http://132.255.20.151:91/ADMINSERV/AdminGeoApplication/AdminGeoWebServices/getTablaContenido/',{
                handleAs: 'json'            
            }).then(lang.hitch(this,function(tablaAdmonServ){
                /**
                 * 2. Reoganizar JSON a la estructura que requiere dojo/Tree
                 */
                let jsonAjustado = [];
                jsonAjustado.push({
                    'name': 'root',
                    'id': '0',
                    "children":true                
                });
                for(let i=0; i < tablaAdmonServ.length ; i++){
                    jsonAjustado = this._OrganizarJSON(tablaAdmonServ[i],'0',jsonAjustado);
                }             
                //jsonAjustado = this._OrganizarJSON(tablaAdmonServ);
                console.log(jsonAjustado);
                /** 
                 * 3. Crear un repositorio de datos para el arbol y el metodo para 
                 * obtener los hijos
                 */
                this.capasStore = new Memory({
                    data: jsonAjustado,
                    getChildren: function(object){
                        return this.query({parent: object.id});
                    }
                });
                /**
                 * 4. Crear el modelo para vincular el repositorio al arbol
                 */
                model = new ObjectStoreModel({
                    store: this.capasStore,        
                    // query para obtener el nodo RAIZ
                    query: {id: "0"},
                    mayHaveChildren: function(object){
                        return "children" in object;
                    }
                });            
                domClass.add(dom.byId('LayerExplorerMask1'),'nodoOculto');
                domClass.remove(dom.byId('tree'),'nodoOculto');
                /**
                 * 5. Construccion del arbol
                 */         
                this.tree = new Tree({
                    model: model,
                    showRoot: false,		
                    persist: false,
                    getIconClass: function(/*dojo.store.Item*/ item, /*Boolean*/ opened){
                        //dijitFolderOpened dijitFolderClosed
                        if(item.hasOwnProperty('children'))
                            return (opened ? "sigotOpenFolder" : "sigotClosedFolder");
                        else
                            return "ion-image";              
                    },
                    _createTreeNode: function(args) {
                        var tnode = new dijit._TreeNode(args);
                        tnode.labelNode.innerHTML = args.label;
                        /**
                         * Verificar que es un nodo final para adicionar INPUT checkbox
                         */
                        if (typeof args.item.children === 'undefined'){
                            var cb = new dijit.form.CheckBox({id:'capa_'+args.item.id,value:args.item.name});
                            cb.on("change",function(isChecked){
                                if(isChecked){
                                    var cp={
                                        id:'panel_capa_'+args.item.id,
                                        name:args.item.name,
                                        IDCAPA:args.item.id,
                                        infoCapa:args.item               
                                    };       

                                    let capaWidget=new CapaWidget(cp);
                                    if(args.item.TIPO == 'REST')
                                        capaWidget.placeAt(dom.byId("graphicLayer"),"first");
                                    else{
                                        capaWidget.placeAt(dom.byId("imageLayer"),"first");
                                        domAttr.set(capaWidget.id,{'draggable':false});
                                    }
                                }else{
                                    obj=dijit.byId('panel_'+this.id);
                                    if(obj != undefined )
                                        obj.quitarCapa();
                                    //console.log(dijit.byId('panel_'+this.id));
                                }
                            },true);
                            cb.placeAt(tnode.labelNode, "first");
                            tnode.checkBox = cb;
                        }                    
                        return tnode;
                    }
                },"tree");
                this.tree.startup();                            

            }));             
        },       
       
        /**
        * Realiza la consulta al administrador de capas para obtener
        * la tabla de contenido, con la cual se crea el arbol de nodos
        * @memberOf ContentCapas
        * @instance
        */
        /* _getListaCapas: function(url){

            jsonConsulta=null;
            request.post(url,{
                handleAs: 'json',
                sync:true
            }).then(lang.hitch(this,function(tabla){
                console.log(jsonConsulta);
                jsonConsulta=tabla;     
            }));         
           return jsonConsulta;
        } , */
        /**
        * Reorganiza el objeto obtenido para que pueda ser usado por 
        * el objeto Tree de DOJO
        * @param {object} tabla tabla de contendido de capas
        * @returns {object} objeto JSON reorganizado
        * @memberOf ContentCapas
        * @instance
        */
        _OrganizarJSON:function (datos,padre,jsonAjustado){
            //CREAR NODO TEMATICA
            let idNodoTematica = padre+'T'+datos.idTematica;
            let nodoObj ={
                'name': datos.nombreTematica,
                'id':idNodoTematica,
                "children":true,
                "parent": padre          
            };
            jsonAjustado.push(nodoObj);
            let tematicas = datos.tematicas;
            //RECORRER TEMATICAS
            for(let i=0; i<tematicas.length ; i++){
                jsonAjustado = this._OrganizarJSON(tematicas[i],idNodoTematica,jsonAjustado);
            }
            //RECORRER CAPAS
            let capas = datos.capas
            for(let i=0; i<capas.length; i++){
                if(capas[i].tipoServicio == 'REST' || capas[i].tipoServicio == 'WMS'){
                    nodoObj = {
                        'name': capas[i].tituloCapa,
                        'id': idNodoTematica+'C'+capas[i].idCapa,
                        "parent": idNodoTematica,
                        "descripcionServicio": capas[i].descripcionServicio,
                        "estadoServicio": capas[i].estadoServicio,
                        "visible": capas[i].visible,
                        "TIPO": capas[i].tipoServicio,
                        "NOMBRECAPA":capas[i].nombreCapa,
                        "URL":capas[i].urlServicio
                    }
                    if(typeof capas[i].urlMetadatoCapa != 'undefined')
                        nodoObj['urlMetadatoCapa'] = capas[i].urlMetadatoCapa;
                    jsonAjustado.push(nodoObj);
                    if(capas[i].visible)
                        this.iniCapasVisibles.push(capas[i]);
                }                
            }
            return jsonAjustado;
        },
        /* _OrganizarJSON:function (listaTabla){
            listaTablaAjustado = [];
            parents = [];
            identificadorDom=1;
            for(i=0;i<listaTabla.length;i++){
                //console.log(i);
                var filteredArr = array.filter(parents, function(item){
                    return item.name == listaTabla[i].NOMBRETEMATICA;
                });  
                //PADRE ESTA CREADO ?
                if(filteredArr.length===0){
                    if(listaTabla[i].IDTEMATICAPADRE===0)
                        obj = {
                            'name': listaTabla[i].NOMBRETEMATICA,
                            'id': listaTabla[i].IDTEMATICA,
                            "children":true,
                            "parent": 0          
                        };
                    else{
                        obj = {
                            'name': listaTabla[i].NOMBRETEMATICA,
                            'id': listaTabla[i].IDTEMATICA,
                            "children":true,
                            "parent": listaTabla[i].IDTEMATICAPADRE        
                        };
                    }
                    parents.push(obj);
                }

                obj={
                    'name': listaTabla[i].TITULOCAPA,
                    'id': listaTabla[i].IDCAPA,
                    "parent": listaTabla[i].IDTEMATICA,
                    "URL":listaTabla[i].URL,
                    "NOMBRECAPA":listaTabla[i].NOMBRECAPA,
                    "VISIBLE":listaTabla[i].VISIBLE,
                    "CAPADOMID":identificadorDom ,
                    "TIPO":listaTabla[i].TIPO 
                };
                identificadorDom++;
                listaTablaAjustado.push(obj);
            }
            obj = {
                'name': 'EXPLORADOR DE CAPAS',
                'id': 0,
                "children":true                
            };
            parents.push(obj);
            for(i=0;i<listaTablaAjustado.length;i++){
                parents.push(listaTablaAjustado[i]);
            }
            listaTablaAjustado=parents;
            return listaTablaAjustado;
        }, */
        resize:function(){
            this.bc.resize();
        },
        /**
        * Oculta todas las capas cargadas en el area de trabajo
        * 
        * @memberOf ContentCapas
        * @instance
        */
        apagarCapas: function(){
            let listCapaWidget=registry.findWidgets(dom.byId('graphicLayer'));            
            for(let i =0; i <listCapaWidget.length; i++){
                if(listCapaWidget[i].visible)
                    listCapaWidget[i].cambiarVisibilidad();
            }
            listCapaWidget=registry.findWidgets(dom.byId('imageLayer'));            
            for(let i =0; i <listCapaWidget.length; i++){
                if(listCapaWidget[i].visible)
                    listCapaWidget[i].cambiarVisibilidad();
            }             
        },
        /**
        *  Hace visible todas las capas cargadas en el area de trabajo
        * 
        * @memberOf ContentCapas
        * @instance
        */
        prenderCapas: function(){
            let listCapaWidget=registry.findWidgets(dom.byId('graphicLayer'));            
            for(let i =0; i <listCapaWidget.length; i++){
                if(!listCapaWidget[i].visible)
                    listCapaWidget[i].cambiarVisibilidad();
                    
            } 
            listCapaWidget=registry.findWidgets(dom.byId('imageLayer'));            
            for(let i =0; i <listCapaWidget.length; i++){
                if(!listCapaWidget[i].visible)
                    listCapaWidget[i].cambiarVisibilidad();
                    
            } 
        },
        /**
        *  Obtiene la lista de todos los widgets CapaWidget creados
        *  
        * @memberOf ContentCapas
        * @instance
        * @returns {array} - Retorna un arreglo de widgets tipo CapaWidget
        */
        listarCapas:function(){
            return registry.findWidgets(dom.byId('graphicLayer'));
        },
        /**
        * Filtra las capas visible en el arbol de capas, conforme
        * a los parametros colocados en el input[type=text]; si esta vacio
        * se hace visible todas las capas del arbol
        *  
        * @memberOf ContentCapas
        * @instance
        */
        filtrarCapas:function(event){
            //console.log(this.treeTabs.selectedChildWidget.id);
            event.preventDefault();                        
            if(this.tree != null){
                //LIMPIAR NODOS SELECCIONADOS EN BUSQUEDAS ANTERIORES
                let listaNodos=query('.nodoResaltado',dom.byId('tree'));
                for(let a=0; a<listaNodos.length ; a++){
                    domClass.remove(listaNodos[a],'nodoResaltado');
                }
                this.tree.collapseAll();
                //OBTENER VALOR DEL INPUT             
                let parametro = this.nodoInputBuscar.value;
                if(parametro.length == 0 || parametro == ' ')   
                    return false;
                this.nodoInputBuscar.disabled = true;
                //BUSCAR EN EL STORE LOS NODOS QUE COINCIDEN 
                let listaResultado = this.capasStore.query(function(nodo){
                    let re = new RegExp('[a-z0-9]*('+parametro.toUpperCase()+')[a-z0-9]*');
                    return re.test(nodo.name.toUpperCase());
                });
                //VERIFICAR SI LA BUSQUEDA NO ARROJO RESULTADOS
                if(listaResultado.length == 0){
                    this.mostrarMensaje({
                        title:  '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>'+                        
                                ' <b>BUSQUEDA CAPA ESPACIAL</b>',
                        content: 'Parámetro de búsqueda “'+parametro+'” no arrojo resultados.',
                        style: "width: 400px"
                    });
                }
                //RECORRER EL RESULTADO DEL STORE PARA MOSTRAR Y RESALTAR RESULTADOS EN ARBOL
                for(let i=0; i<listaResultado.length; i++){
                    //iteracion++;
                    let nodes2expand = [listaResultado[i]];
                    let nodoTargetBusqueda = listaResultado[i];
                    //EXTRAER PADRES DE LOS NODOS RESULTADOS EN EL STORE
                    let parametroBusqueda = '';
                    while(parametroBusqueda != '0'){
                        parametroBusqueda = nodoTargetBusqueda.parent;
                        if(parametroBusqueda != '0'){
                            nodoTargetBusqueda = this.capasStore.query({id:parametroBusqueda})[0];
                            nodes2expand.push(nodoTargetBusqueda);
                        }                          
                    }    
                    for (let k=(nodes2expand.length-1); k > 0 ;k--){
                        let nodes =this.tree.getNodesByItem(nodes2expand[k].id);
                        if(!nodes[0].isExpanded)                                                                 
                                this.tree._expandNode(nodes[0]);
                    }
                    //RESALTAR NODO DATO QUE COINCIDIO CON LA BUSQUEDA
                    let nodes = this.tree.getNodesByItem(nodes2expand[0].id);
                    domClass.add(nodes[0].domNode,'nodoResaltado');
                    //let listNodes = this.treeTematico.getNodesByItem(listaResultado[i].id);
                }
                this.nodoInputBuscar.disabled = false;

            }else
                this.mostrarMensaje({
                    title:  '<i style="font-size:1.3em" class="icon ion-alert-circled"></i>'+                        
                            ' <b>BUSQUEDA CAPA ESPACIAL</b>',
                    content: 'La búsqueda no puede ser realizada, aún se están cargando las capas.',
                    style: "width: 400px"
                });
                        
                   
            
            
        },
        /**
        * Adiciona un layer construido a partir de un archivo externo
        * @param {object} layer Feature Layer resultado de procesar archivo externo 
        * @param {object} job Descripción del archivo externo procesado 
        * @memberOf ContentCapas
        * @instance
        */
        addFromFilePane:function(layer,job){
            console.log('[/*/* addFromFilePane */*/]');
            console.log(job);
            this.idExternos++;
            job['TIPO']='N/A';
            let cp={
                id:'panel_capa_'+this.idExternos,
                name:job.baseFileName,               
                map:this.map,
                layer:layer,
                tipo:'C',
                subTipo:job.fileType,
                infoCapa:job                                       
            };        
            widget=new CapaWidget(cp).placeAt(dom.byId("graphicLayer"),"first");  
            
        },
        /**
        * Adiciona un layer a partir de una URL de un servicio externo
        * @param {object} layer Objeto Layer resultado de procesar archivo externo 
        * @param {object} job Descripción del archivo externo procesado 
        * @memberOf ContentCapas
        * @instance
        */
       addFromUrlPane:function(layer,job){
            this.idExternos++;
            job['TIPO']=job.type;
            let cp = null;
            let widget = null; 
            if(job.type == 'WMS'){
                cp={
                    id:'panel_capa_'+this.idExternos,
                    name:job.name,               
                    map:this.map,
                    layer:layer,
                    tipo:'D',
                    subTipo:job.type,
                    infoCapa:job                                  
                };  
                widget=new CapaWidget(cp).placeAt(dom.byId("imageLayer"),"first"); 
            }              
            else{
                job['idLayer']=layer.id;
                cp={
                    id:'panel_capa_'+this.idExternos,
                    name:'URL Externa Arcgis ('+this.idExternos+')',               
                    map:this.map,
                    layer:layer,
                    tipo:'D',
                    subTipo:job.type,
                    infoCapa:job                                  
                };  
                widget=new CapaWidget(cp).placeAt(dom.byId("graphicLayer"),"first");
            }              
            
        },
        addResultadoGeoProceso:function(layer,job){
            console.log('[/*/* addFromFilePane */*/]');
            console.log(job);
            this.idExternos++;
            var cp={
                id:'panel_capa_'+this.idExternos,
                name:job.name,               
                map:this.map,
                layer:layer,
                tipo:'E',
                subTipo:job.subTipo                                       
            };        
            widget=new CapaWidget(cp).placeAt(dom.byId("graphicLayer"),"first");  
            
        },        
        /**
        * Muestra mensaje en ventana flotante
        * 
        * @memberf ComparacionTemporal
        * @private
        * @instance
        * @param {string}      - mensaje: mensaje a imprimir
        * 
        */
        mostrarMensaje:function(mensaje){
            ventanaMensaje = new Dialog(mensaje);
            ventanaMensaje.show();
        }
    });
});