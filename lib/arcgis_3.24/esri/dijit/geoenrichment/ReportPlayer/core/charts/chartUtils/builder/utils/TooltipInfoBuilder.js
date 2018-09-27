// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/core/charts/chartUtils/builder/utils/TooltipInfoBuilder",["./ChartDataUtil"],function(d){return{getTooltipInfo:function(b,e,f,g,h,k,c,l,m,n,p,q,r,t){function a(a,b){return d.formatNumber(a||0,void 0!==b?{dataLabelsDecimals:b}:m,void 0,n)}return{value:b,label:e,color:p,seriesLabel:f,valueLabel:a(b),sumValueLabel:a(k),minValueLabel:a(g),maxValueLabel:a(h),avgValueLabel:a(l),weightValueLabel:c?a(Math.abs(b)/c*100,2)+"%":"",formatFunc:a,isUnavailableData:isNaN(b),
conditionalStyling:q,fieldInfo:r,isPrimarySeries:t,getGroup:null}}}});