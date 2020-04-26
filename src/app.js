/**
 * Kamigen Browser Application
 */

// External libs
import $ from 'jQuery';

// Internal libs
import Scenograph from './app/scenograph.js';

// Setup the main App class.
export default class App {
  constructor() {
    this.scenograph = new Scenograph(this);
  }
}

// Run App using jQuery.ready()
$(() => {
  var app = new App();

  // Run all the ready functions
  for (var classInstance in app) {
    if (app[classInstance].ready) {
      app[classInstance].ready();
    }
  }
});
