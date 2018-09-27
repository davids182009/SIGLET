require([
  'dojo/_base/window',
  'themes/MenuWidget',
  'widgets/mapManager/mapManager',
  'widgets/Visualizacion/Widget',
  'dojo/domReady!'
], function(window, MenuWidget, mapManager, VisualizacionWidget) {
  console.log('******** *** *** ** ** *Inicia JS ....');
  menu = new MenuWidget();
  menu.placeAt(window.body(), 'first');
  mapa = new mapManager();
  mapa.placeAt(window.body(), 'first');
  widgetV = new VisualizacionWidget();
  widgetV.placeAt(window.body(), 'first');

});
