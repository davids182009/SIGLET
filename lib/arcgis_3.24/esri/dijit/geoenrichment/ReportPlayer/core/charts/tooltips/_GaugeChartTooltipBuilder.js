// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/charts/tooltips/_GaugeChartTooltipBuilder",["dojo/dom-construct","dojo/string","./_BuilderUtil","dojo/i18n!../../../../../../nls/jsapi"],function(f,g,b,c){c=c.geoenrichment.dijit.ReportPlayer.ChartTooltip;return{buildGaugeChartTooltip:function(a,e){b.addTitle(e,a.label,a.color);var d=f.create("div",{"class":"chartTooltip_row esriGERowHigh"},e);b.addRowOffset(d);a.isUnavailableData?b.addLabel(c.unavailableData,d):b.addLabel(g.substitute(c.gaugeChartTooltip_label,
{value:a.valueLabel,total:a.sumValueLabel}),d)}}});