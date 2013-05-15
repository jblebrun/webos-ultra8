function CanvasOutput(output_el) {
	Mojo.Log.info('setting up canvas');
	this.screenBuffer = []; //array of arrays. rows.
	this.screenMode = 2; /* 2 - loRes, 1 - hiRes */
    this.xsize = 64;
	this.ysize = 32;
	this.canvas_scale = 4;
	this.o_scale = 1;
	this.erasing = {};
	
	this.context = [];
	output_el.innerHTML = "";
	
	for(var c = 0; c < 64; c++) {
		var can = document.createElement('canvas');
		can.style = {
			width: "256px",
			height: "4px"
		}
		var con = can.getContext('2d');
		con.save();
		output_el.appendChild(can);
		this.context.push(con);
	}
	Mojo.Log.info('created canvas, appending to',output_el);
	Mojo.Log.info('appended canvas');
	this.erase_delay = 0;
	this.screenClear();
	Mojo.Log.info('canvas set up');
}
CanvasOutput.prototype.screenBufferToggle = function(x, y, inbit){
	x %= this.xsize;
    y %= this.ysize;
    var key = x.toString() + y.toString();
    
    var position = y * this.xsize + x;
    
	var bit = inbit;
	if (bit === undefined) {
		bit = this.screenBuffer[y][x] ? 0 : 1;
	}
    this.screenBuffer[y][x] = bit;
    this.erasing[key] = 0;
    
    if (!bit) {
        this.erasing[key] = 1;
		if (this.erase_delay) {
            erasetimer = setTimeout((function(){
                if (this.erasing[key]) {
                    this.erasing[key] = 1;
                    this.context.fillStyle = "#FFF";
                    this.context.fillRect(x, y, 1, 1);
                }
                
            }).bind(this), this.erase_delay);
        } else {
            this.context.fillStyle = "#FFF";
            this.context.fillRect(x, y, 1, 1);
        }
        
    } else {
        //Mojo.Log.info('drawing',x,y,new Date().getTime());
        this.context.fillStyle = "#000";
        this.context.fillRect(x, y, 1, 1);
        
    }
    return (bit);
}

CanvasOutput.prototype.screenClear = function(){
	this.context.fillStyle = "#FFF";
    this.context.fillRect(0,0,320,480);
	for(var y=0; y<64; y++) {
		this.screenBuffer[y] = [];
		for (var x = 0; x < 128; x++) {
			this.screenBuffer[y][x] = 0;
		}
	}
	
	
}


CanvasOutput.prototype.putSprite = function(x, y, sprite_bytes){

	
	var unset = 0;
    var context = this.context;
    //Mojo.Log.info('scale:',scale);
    //Mojo.Log.info('drawing sprite at',x,y);
    for (var row = 0; row < sprite_bytes.length; row++) {
        var sprite_byte = sprite_bytes[row];
        //Mojo.Log.info("putting row",x,y+row,sprite_byte);
        
        for (var i = 7; i >= 0; i--) {
			var bit = sprite_byte & 1;
			sprite_byte >>= 1;
			
			if (bit) {
				var result = this.screenBufferToggle(x + i, y + row);
				if (result === 0) {
					unset = 1;
				}
			}
			
			
		//Mojo.Log.info('fillRect',x,i,xmod,scale,((x+i)%xmod)*scale,y+row*scale);
		
		}
    }
    
    
    return unset;
}


CanvasOutput.prototype.drawBuffer = function() {
	
	var ctx = this.context;
    for (var y = 0; y < this.ysize; y++) {
        for (var x = 0; x < this.xsize; x++) {
			var bit = this.screenBuffer[y][x];
            ctx.fillStyle = bit ? "#000" : "#FFF";
            ctx.fillRect(x,y,1,1);
        }
    }
	
	
}

CanvasOutput.prototype.scrollDown = function(n){
	var start = new Date().getTime();
    for (var y = this.ysize - 1 - n; y >= 0; y--) {
        for (var x = 0; x < this.xsize; x++) {
            var bit = this.screenBuffer[y][x];
			if (y < n) {
				this.screenBufferToggle(x, y, 0);
			}
			this.screenBufferToggle(x, y + n, bit);   
        }
    }
	$('state').innerHTML = new Date().getTime() - start+'ms';
}


CanvasOutput.prototype.scrollLeft = function(n){

}
CanvasOutput.prototype.scrollRight = function(n){

}
CanvasOutput.prototype.loRes = function(n){
	this.screenMode = 2; /* 2 - loRes, 1 - hiRes */
    this.xsize = 64;
	this.ysize = 32;
	this.canvas_scale = 4;
	$('chip48screen').remove();
	this.canvas = document.createElement('canvas');
	this.canvas.id = "chip48screen";
	$('canvas_spot').appendChild(this.canvas);
	this.context = this.canvas.getContext('2d');
	this.context.scale(4,4);
	
}

CanvasOutput.prototype.hiRes = function(n){
	Mojo.Log.info('setting hires');
	this.screenMode = 1;
	this.xsize = 128;
	this.ysize = 64;
	this.canvas_scale = 2;
	$('chip48screen').remove();
	this.canvas = document.createElement('canvas');
	this.canvas.id = "chip48screen";
	$('canvas_spot').appendChild(this.canvas);
	this.context = this.canvas.getContext('2d');
	this.context.scale(2,2);
	
	
}
