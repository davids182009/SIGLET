// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/layers/vectorTiles/views/2d/engine/webgl/util/Reader",["require","exports"],function(c,a){Object.defineProperty(a,"__esModule",{value:!0});var b=function(){function a(a){this._pos=0;this._buffer=a;this._view=new Int32Array(this._buffer)}a.prototype.readInt32=function(){return this._view[this._pos++]};return a}();a.default=b});