// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/grid/coreUtils/GridFloatingTablesUtil",["dojo/_base/lang","dojo/dom-construct"],function(d,e){return{renderFloatingTables:function(a,c,f){e.empty(a.floatingTablesNode);if(!c)return null;var b={"class":"esriGEAbsoluteStretched adjustableGrid_floatingTablesSection"};b.initialWidth=a.getAllowedWidth();b.json=c;b.viewModel=a.viewModel;b.theme=a.theme;b.hasFixedLayout=!1;b.parentWidget=a;d.mixin(b,f);c=a.viewModel.layoutBuilder.createElement("section",
b,a.floatingTablesNode);c.setResizedHeight(a.getHeight());c.setViewMode(a.getViewMode(),a.getSpecificViewMode());return c}}});