function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  this.prefcookie = new Mojo.Model.Cookie("preferences");
	  this.preferences = this.prefcookie.get() || {};
	  Mojo.Log.info("prefs:",typeof this.preferences);
}

PreferencesAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	this.controller.setupWidget('cycles_per_interval',
		 this.cpi_attributes = {
             label: 'Speed',
             modelProperty: 'value',
             min: 1,
             max: 30

         },
         this.cpi_model = {
             value: this.preferences.cycles_per_interval || 10
         }
	);
	Mojo.Log.info('setup cpi');
	this.controller.setupWidget('erase_delay', 
	this.ed_attributes = {
             label: 'Flicker Filter',
             modelProperty: 'value',
             min: 1,
             max: 100

         },
         this.ed_model = {
             value: this.preferences.erase_delay || 10
         }
		 );
	
	this.controller.setupWidget('debugging_toggle', {}, {});
	
	/* add event handlers to listen to events from widgets */
	this.controller.listen('cycles_per_interval', Mojo.Event.propertyChanged, this.handleCyclesChanged.bind(this));
	this.controller.listen('erase_delay', Mojo.Event.propertyChanged, this.handleEraseDelayChanged.bind(this));

}

PreferencesAssistant.prototype.handleCyclesChanged = function(event) {
	Mojo.Log.info("updating cpi to",event.value);
	this.preferences.cycles_per_interval = event.value;
	this.prefcookie.put(this.preferences);
	
	this.controller.stageController.popScene('foo');
}
PreferencesAssistant.prototype.handleEraseDelayChanged = function(event) {
	Mojo.Log.info("updating ed to",event.value);
	this.preferences.erase_delay = event.value;
	this.prefcookie.put(this.preferences);
}

PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
