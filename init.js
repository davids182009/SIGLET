require([
  'dojo/_base/window',
  'themes/MenuWidget',
  'widgets/mapManager/mapManager',
  'widgets/Visualizacion/Widget',
  'widgets/Coordinate/Widget',
  'dojo/domReady!'
], function(window, MenuWidget, mapManager, VisualizacionWidget,Coordinate) {
  console.log('******** *** *** ** ** *Inicia JS ....');
  menu = new MenuWidget();
  menu.placeAt(window.body(), 'first');
  mapa = new mapManager();
  mapa.placeAt(window.body(), 'first');
  widgetV = new VisualizacionWidget();
  widgetV.placeAt(window.body(), 'first');
  coordinate = new Coordinate({});
  coordinate.placeAt(window.body(), 'first');
});
