function StageAssistant() {
	
}

StageAssistant.prototype.setup = function() {
	if (this.controller.setWindowOrientation) {
        this.controller.setWindowOrientation("free");
    }
	delete Mojo.Menu.helpItem['checkEnabled'];
	delete Mojo.Menu.prefsItem['checkEnabled'];
	this.controller.pushScene({
		name: "run",
		disableSceneScroller: true
	});
}

StageAssistant.prototype.handleCommand = function(event) {
	Mojo.Log.info('got command:',event.command);
	if(event.command === "palm-help-cmd") {
		this.controller.pushScene("help");		
	}
	if(event.command === "palm-prefs-cmd") {
		this.controller.pushScene("preferences");		
	}
}
