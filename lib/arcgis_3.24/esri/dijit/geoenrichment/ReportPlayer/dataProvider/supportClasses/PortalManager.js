// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/dataProvider/supportClasses/PortalManager",["dojo/when","esri/arcgis/Portal"],function(d,e){var b={_cache:{},getPortalInfo:function(a){if(!b._cache[a.portalUrl]){var c=new e.Portal(a.portalUrl);b._cache[a.portalUrl]=d(c.signIn(),function(a){return{user:a,portal:c}})}return b._cache[a.portalUrl]}};return b});