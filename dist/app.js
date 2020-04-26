var ManifoldApplication = (function ($, THREE) {
  'use strict';

  $ = $ && Object.prototype.hasOwnProperty.call($, 'default') ? $['default'] : $;
  THREE = THREE && Object.prototype.hasOwnProperty.call(THREE, 'default') ? THREE['default'] : THREE;

  /**
    * Scenograph.
    *
    * Manages scenes and has the following properties,
    * - Director, class containing scene configuration and helpers
    * - Objects, HashArray, 
    * - Scenes, Array, contains Director configs, Object layouts and helper functions to draw a scene.
    * -- Scripts, class within each Scene, extensible way to activate a scene - i.e. interactive/play mode or flyby demo mode.
    */


  var Scenograph = function Scenograph(options) {
  };

  /**
   * Kamigen Browser Application
   */

  // Setup the main App class.
  var App = function App() {
    this.scenograph = new Scenograph(this);
  };

  // Run App using jQuery.ready()
  $(function () {
    var app = new App();

    // Run all the ready functions
    for (var classInstance in app) {
      if (app[classInstance].ready) {
        app[classInstance].ready();
      }
    }
  });

  return App;

}(jQuery, THREE));
//# sourceMappingURL=app.js.map
