// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/charts/chartUtils/ChartLineMarkers",["dojox/charting/SimpleTheme"],function(d){var a={NONE:"None",CIRCLE:"Circle",SQUARE:"Square",DIAMOND:"Diamond",CROSS:"Cross",X:"X",TRIANGLE:"Triangle",TRIANGLE_INVERTED:"TriangleInverted"},c={},b;for(b in a)c[a[b]]=b;a.getMarkerPath=function(a){return d.defaultMarkers[c[a]]||""};return a});