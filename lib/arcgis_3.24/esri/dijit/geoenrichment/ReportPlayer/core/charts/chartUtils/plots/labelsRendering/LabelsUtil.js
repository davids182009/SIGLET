// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/charts/chartUtils/plots/labelsRendering/LabelsUtil",["dojox/gfx","dojox/charting/plot2d/common"],function(c,d){return{getLabelInfo:function(a,b,e){a=a.opt.labelFunc?a.opt.labelFunc.apply(a,[b,a.opt.fixed,a.opt.precision]):b.text||d.getLabel(b[b.valueProp],a.opt.fixed,a.opt.precision)||"";b=-1!==a.indexOf("two-row-label\x3d'true'")?2:1;a=a.replace(" two-row-label\x3d'true'","");a=a.replace(" two-row-label\x3d'false'","");return{text:a,numRows:b,box:c._base._getTextBox(a,
{font:e.series.font})}}}});