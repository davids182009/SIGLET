// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/infographics/dynamic/_Tapestry",["dojo/_base/declare","dojo/dom-class","esri/dijit/geoenrichment/Tapestry"],function(a,b,c){return a(c,{_toDetailView:function(a){this.inherited(arguments);this.onExpandedStateChanged()},collapseContent:function(){this._mainTable&&b.remove(this._mainTable,"clicked");this._toMainView();this.onExpandedStateChanged()},onExpandedStateChanged:function(){}})});