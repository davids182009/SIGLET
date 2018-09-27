// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/charts/chartUtils/ChartLineStyles",[],function(){return{SOLID:"Solid",DASHED:"Dashed",DOTTED:"Dotted",toGFXValue:function(b,a){switch(b){case "Dashed":return 1>a?"LongDash":"Dash";case "Dotted":return 1>a?"Dash":"Dot";default:return"Solid"}}}});