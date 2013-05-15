function HtmlDivOutput(output_el) {
	Mojo.Log.info('setting up HtmlDiv');
	
	this.screenMode = 2; /* 2 - loRes, 1 - hiRes */
    this.xsize = 64;
	this.ysize = 32;
	this.erasing = {};
	
	this.container = output_el;
	var base_d = document.createElement('div');
	output_el.style.width = "256px";
	output_el.style.height= "128px";
	output_el.style.border = "1px solid #AAA";
	for(var y = 0; y<64; y++) {
		for (var x = 0; x < 128; x++) {
			var d = base_d.cloneNode(false);
			d.className = true;
			output_el.appendChild(d);
		}
	}
	Mojo.Log.info('created HtmlDiv, appending to',output_el);
	this.pixels = this.container.childNodes;
	this.erase_delay = 0;
	this.loRes();
	//this.drawBuffer();

	Mojo.Log.info('HtmlDiv set up');
	Mojo.Log.info(this.pixels.length);
}
HtmlDivOutput.prototype.screenBufferToggle = function(x, y, inbit){
	//var undefined;
	x %= this.xsize;
    y %= this.ysize;
	//var key = [x,y];
	
    var pixel = this.pixels[y*this.xsize + x];
	//var erasing = this.erasing;
	
	inbit = (inbit == undefined) ? !pixel.set : inbit;
	pixel.set = inbit;
    pixel.className = pixel.set;
	
    //this.erasing[key] = 0;
    
    
    return (pixel.set);
}

HtmlDivOutput.prototype.screenClear = function(){
	var cn = this.container.childNodes;
	var l = this.xsize*this.ysize;
    
	Mojo.Log.info('clearing',cn);
	Mojo.Log.info('length',cn.length);
	Mojo.Log.info('l', l)
	for(var i = 0; i<l; i++) {
		var cni = cn[i];
		cni.style.display = "block";
		cni.className = "false";
		cni.set = false;
	}
	for(var i = l; i < cn.length; i++) {
		cn[i].style.display = "none";
	}
	
}


HtmlDivOutput.prototype.putSprite = function(x, y, sprite_bytes) {
	var unset = 0;
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
				if (result == false) {
					unset = 1;
				}
			}
			
			
		//Mojo.Log.info('fillRect',x,i,xmod,scale,((x+i)%xmod)*scale,y+row*scale);
		
		}
    }
    
    
    return unset;
}


HtmlDivOutput.prototype.drawBuffer = function() {	
	var pixels = this.pixels;
	var xsize = this.xsize;
	var ysize = this.ysize;
    for (var y = 0; y < ysize; y++) {
        for (var x = 0; x < xsize; x++) {
			var pixel = pixels[y*xsize+x];
            pixel.className;
        }
    }
	
	
}

HtmlDivOutput.prototype.scrollDown = function(n){
	var pixels = this.pixels;
	var len = this.xsize*this.ysize;
	var parent = this.container;
	for(var i = this.xsize-1; i >=0 ; i--) {
	   this.container.insertBefore(pixels[len-i]);	
	}
}


HtmlDivOutput.prototype.scrollLeft = function(n){

}
HtmlDivOutput.prototype.scrollRight = function(n){

}
HtmlDivOutput.prototype.loRes = function(n){
	this.screenMode = 2; /* 2 - loRes, 1 - hiRes */
    this.xsize = 64;
	this.ysize = 32;
	this.container.className = "";
	this.screenClear();
}

HtmlDivOutput.prototype.hiRes = function(n){
	Mojo.Log.info('setting hires');
	this.screenMode = 1;
	this.xsize = 128;
	this.ysize = 64;
	this.container.className = "hiRes";
	this.screenClear();
	
}
