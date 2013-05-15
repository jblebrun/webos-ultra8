


function RunAssistant(){
    this.keys = [Mojo.Char.zero, Mojo.Char.w, Mojo.Char.e, Mojo.Char.r, Mojo.Char.s, Mojo.Char.d, Mojo.Char.f, Mojo.Char.z, Mojo.Char.x, Mojo.Char.c, Mojo.Char.shift, Mojo.Char.spaceBar, Mojo.Char.t, Mojo.Char.g, Mojo.Char.v, Mojo.Char.period];
    this.keysByCode = {};
    
    for (var k=0; k< this.keys.length; k++) {
        this.keysByCode[this.keys[k]] = k;
        this.keys[k] = false;
    }
	
	
	Mojo.Log.info('getting prefs');
    this.prefcookie = new Mojo.Model.Cookie('preferences');
	this.preferences = this.prefcookie.get() || {};
	
}

RunAssistant.prototype.showCycleTime = function(n) {
	$('state').innerHTML = n;
}

RunAssistant.prototype.beepOn = function() {
	this.controller.serviceRequest('palm://com.palm.audio/systemsounds', {
    method:"playFeedback",   parameters:{ name: 'error_02' }
 });

}
RunAssistant.prototype.beepOff = function() {
	
}

RunAssistant.prototype.downHandler = function(event){
	//Mojo.Log.info('keydown:',event.keyCode);
    
	var index = this.keysByCode[event.keyCode];
	//Mojo.Log.info('index is ',index);
    if (index !== undefined) {
        this.keys[index] = true;
    }
	this.chip48.check_keys();
}
RunAssistant.prototype.upHandler = function(event){
	//Mojo.Log.info('keyup:',event.keyCode);
    var index = this.keysByCode[event.keyCode];
	//Mojo.Log.info('index is ',index);
    if (index !== undefined) {
        this.keys[index] = false;
    }
}

RunAssistant.prototype.setup = function(){

	/*if (this.controller.stageController.setWindowOrientation) {
        this.controller.stageController.setWindowOrientation("free");
    }*/
	
	/* Scroll test */
	GAMES.scrolltest = [
		0xF0, 0x29,
		0xD1, 0x25,
		0x00, 0xC1,
		0x00, 0xC1,
		0x00, 0xC1
	];
    /* Font test
	 * ;V1 - X coord
	 * ;V2 - Y coord
	 * ;V3 - font characters
	 * 6100 LD V1, 00
	 * 6200 LD V2, 00
	 * 6300 LD V3, 00
	 * F329 LD F, V3 ;(I = F+V3)
	 * D125 DRW V1, V2, 5
	 * 6108 LD V1, 08
	 * 6301 LD V3, 01
	 * F329 LD F, V3 ;(I = F+V3)
	 * D125 DRW V1, V2, 5
	 * etc etc
	 */
	GAMES.fonttest = [0x62,0x00,
	0x61,0x00,0x63,0x01,0xF3,0x29,0xD1,0x25,
	0x61,0x08,0x63,0x03,0xF3,0x29,0xD1,0x25,
	0x61,0x10,0x63,0x05,0xF3,0x29,0xD1,0x25,
	0x61,0x18,0x63,0x07,0xF3,0x29,0xD1,0x25,
	0x61,0x20,0x63,0x09,0xF3,0x29,0xD1,0x25,
	0x61,0x28,0x63,0x0B,0xF3,0x29,0xD1,0x25,
	0x61,0x30,0x63,0x0D,0xF3,0x29,0xD1,0x25,
	0x61,0x38,0x63,0x0F,0xF3,0x29,0xD1,0x25,
	0x62,0x10,
	0x61,0x00,0x63,0x02,0xF3,0x29,0xD1,0x25,
	0x61,0x08,0x63,0x04,0xF3,0x29,0xD1,0x25,
	0x61,0x10,0x63,0x06,0xF3,0x29,0xD1,0x25,
	0x61,0x18,0x63,0x08,0xF3,0x29,0xD1,0x25,
	0x61,0x20,0x63,0x0A,0xF3,0x29,0xD1,0x25,
	0x61,0x28,0x63,0x0C,0xF3,0x29,0xD1,0x25,
	0x61,0x30,0x63,0x0E,0xF3,0x29,0xD1,0x25,
	
	0x00,0x00
	];
    
	this.sound = this;
	var list_choices = [{label: "Load File...", value:""}];
	for(g in GAMES) {
		list_choices.push({
			label: g,
			value: g
		});
	}
	for(g in SGAMES) {
		list_choices.push({
			label: "Super:"+g,
			value: "@"+g
		});
	}
	var startbutton = document.getElementById('stopStartButton');
	var resetbutton = document.getElementById('resetButton');
	var gamesmenu = document.getElementById('gamesChoice');
	var stepbutton = document.getElementById('stepButton');
	this.startbutton = startbutton;
	this.startButtonModel = {label: "Start"};
	this.controller.setupWidget('stopStartButton', {}, this.startButtonModel);
	this.controller.setupWidget('resetButton', {label:"Reset"}, {});
	this.controller.setupWidget('stepButton', {label:"Step"}, {});
	
	
	this.output = new HtmlDivOutput(this.controller.get('output_spot'));
	this.output.erase_delay = this.preferences.erase_delay || 1;
	this.chip48 = new SChip48(this);
    
	this.controller.setupWidget('gamesChoice', {label: "Choose Game", choices:list_choices}, {});
	var chip48 = this.chip48;
	
	Mojo.Log.info('gamesChoice is set up');
	
	startbutton.addEventListener(Mojo.Event.tap, this.handleStopStart.bind(this),false);
    resetbutton.addEventListener(Mojo.Event.tap, this.handleReset.bind(this),false);
    stepbutton.addEventListener(Mojo.Event.tap, this.handleStep.bind(this),false);
    gamesmenu.addEventListener(Mojo.Event.propertyChange, this.handleGameChange.bind(this),false);
    
	
    document.addEventListener('keydown', this.downHandler.bind(this), false);
    document.addEventListener('keyup', this.upHandler.bind(this), false);
    //document.addEventListener('orientationchange', this.handleOrientation.bindAsEventListener(this), false);
    
}

/*RunAssistant.prototype.handleOrientation = function(o){

	var els = document.getElementsByClassName('rotatable');
	if(!els) {
		return;
	}
	if (o.position === 4 || o.position === 5) {	
		
		this.o_scale = 1.5;
		for(var i = 0; i<els.length; i++) {
			els[i].addClassName('horizontal');
		}       
    } else if(o.position === 2 || o.position ===3) {   
	 	this.o_scale=1;
		for(var i = 0; i<els.length; i++) {
			els[i].removeClassName('horizontal');
		}
    }
	var scale = this.canvas_scale*this.o_scale
	//this.context.restore();
	//this.context.scale(scale, scale);
	//this.screenClear();
	//this.drawBuffer();
}*/

RunAssistant.prototype.showState = function(state) {
	$('state').innerHTML = state;
}
RunAssistant.prototype.handleStep = function(event) {
	Mojo.Log.info('stepping');
	this.chip48.step();
}
RunAssistant.prototype.handleReset = function(event) {
	this.chip48.reset();
	this.startButtonModel.label = "Start";	
	this.controller.modelChanged(this.startButtonModel);
}

RunAssistant.prototype.handleStopStart = function(event) {
	
	var running = this.chip48.stopstart();
	if(!running) {
		this.startButtonModel.label = "Continue";
	} else {
		this.startButtonModel.label = "Pause";
	}
	this.controller.modelChanged(this.startButtonModel);
}
RunAssistant.prototype.handleGameChange = function(event){
    this.chip48.reset(true);
	
	if (event.value === "") {
		Mojo.FilePicker.pickFile({
			onSelect: function(f) {
				Mojo.Log.info('got file',f);
				Ajax.Request(f, {
					onSuccess: function(t) {
						Mojo.Log.info("opened file",Object.toJSON(t));
					}
				});
			}
		});
	}
	else if (event.value[0] !== "@") {
        Mojo.Log.info("loading GAMES", event.value);
        this.chip48.load(GAMES[event.value]);
        Mojo.Log.info('loaded');
    } else {
        Mojo.Log.info("loading SGAMES", event.value.slice(1));
        this.chip48.load(SGAMES[event.value.slice(1)]);
        Mojo.Log.info('loaded');
        
    }
    this.startButtonModel.label = "Pause";
    this.controller.modelChanged(this.startButtonModel);
    this.chip48.run();
    
}

RunAssistant.prototype.activate = function(arg) {
	Mojo.Log.info('activating with',arg);
	Mojo.Log.info("this.prefcookie",this.prefcookie);
	this.preferences = this.prefcookie.get() || {};
	this.chip48.preferences_updated();
	this.chip48.cont();
}
RunAssistant.prototype.deactivate = function() {
	this.chip48.pause();
}

