// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/infographics/simpleInfographic/DataDrillingBackgroundUtil",["dojo/dom-style","esri/dijit/geoenrichment/utils/ColorUtil","../../themes/BackgroundThemeUtil"],function(e,f,g){return{setUpDDPanelBackgroundColor:function(a){if(a.infographicJson){var c=a.viewModel.getStaticInfographicDefaultStyles(a.theme),d=a.viewModel.getDocumentDefaultStyles(a.theme);[a.infographicJson.style.backgroundColor,c&&c.backgroundColor,d.backgroundColor].some(function(b){if(b&&
!f.isTransparent(b))return e.set(a.node,"backgroundColor",b),!0})||g.applyBackgroundImageFromSettings(a.node,d.backgroundImage)}}}});