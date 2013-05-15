function SChip48(iface) {
	
	/*Memory, byte addressed*/
	var mem = [];
	
	 hp48 = [0,0,0,0,0,0,0,0];
	/*Call stack*/
	var stack = [];
	var font_start = 0x100;
	/*Registers*/
	var V= [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	var I = 0;
	var PC = 0x200;
	
	var input = iface.keys;
	var output = iface.output;
	var sound = iface.sound;
	Mojo.Log.info('output:',typeof output);
	
	var breakpoints = [];
	var delay_timer = 0;
	var beep_timer = 0;
	var blocking = false;
	var running = false;
	var reset = true;
	var timerHandle = null;
	var screenBuffer = [];
	var CYCLES_PER_INTERVAL = (iface.preferences && iface.preferences.cycles_per_interval) || 1;
	/* Build fonts */
	var font =  [
	0xF0, 0x90, 0x90, 0x90, 0xF0, 
	0x20, 0x60, 0x20, 0x20, 0x70,
	0xF0, 0x10, 0xF0, 0x80, 0xF0,
	0xF0, 0x10, 0x70, 0x10, 0xF0,
	0xA0, 0xA0, 0xF0, 0x20, 0x20,
	0xF0, 0x80, 0xF0, 0x10, 0xF0,
	0xF0, 0x80, 0xF0, 0x90, 0xF0,
	0xF0, 0x10, 0x10, 0x10, 0x10,
	0x60, 0x90, 0x60, 0x90, 0x60,
	0xF0, 0x90, 0xF0, 0x10, 0x10,
	0x60, 0x90, 0xF0, 0x90, 0x90,
	0xE0, 0x90, 0xE0, 0x90, 0xE0,
	0xF0, 0x80, 0x80, 0x80, 0xF0,
	0xE0, 0x90, 0x90, 0x90, 0xE0,
	0xF0, 0x80, 0xF0, 0x80, 0xF0,
	0xF0, 0x80, 0xE0, 0x80, 0x80
	];
	for(var i = 0; i < 80; i++) {
		mem[font_start + i] = font[i];
	}
	
	this.preferences_updated = function() {
		 CYCLES_PER_INTERVAL = (iface.preferences && iface.preferences.cycles_per_interval) || 1;
	}
	
	/* Initialize screen */
	for(var y = 0; y < 64; y++) {
		screenBuffer[y] = [];
		for(var x= 0; x< 16; x++) {
			screenBuffer[y][x] = 0;
		}
	}
	
	
	
	/*PreAllocate*/
	var rows = [];
	var opcode;
	var oldPC;
	var x, y, yt, subcode, r, i, index;
	
	
	var dumpstate = function() {
		output.showState("Registers:"+V+"<br/>"+"I:"+I.toString(16)+" PC:"+PC.toString(16)+"ST:"+beep_timer+"DT:"+delay_timer);
	}
	var operations = function(high, low) {
		//Mojo.Log.info('Executing',(PC-2).toString(16),":",high.toString(16),low.toString(16));
		
		opcode = high & 0xF0;
		
		/* Native routines*/
		if(opcode===0x00) {
			if((high&0x0F) !== 0) {
				return;
			} 
			//SCD N
			if((low&0xF0) === 0xC0) {
				Mojo.Log.info("scrolldown opcode");
				output.scrollDown(low&0x0F);
			}
			//SCL
			if (low === 0xFB) {
				output.scrollRight(4);
			}
			//SCR
			if (low === 0xFC) {
				output.scrollRight(4);
			}
			//EXIT
			if (low === 0xFD) {
				running = false;
			}
			//LOW
			if (low === 0xFE) {
				output.loRes();
			}
			//HIGH
			if (low === 0xFF) {
				output.hiRes();
			//CLS
			}if (low === 0xE0) {
				output.screenClear();
			}
			//RET
			if (low === 0xEE) {
				PC = stack.pop();
			}
				
		}
		
		/*Jump*/
		//JP Addr
		else if(opcode===0x10) {
			oldPC = PC-2;
			PC = low + ((high&0x0F) << 8);
			
			if (PC === oldPC) {
				Mojo.Log.info("infinite loop, don't waste energy running it");
				running = false;
			}
		}
		
		//CALL
		else if(opcode===0x20){
			//Mojo.Log.info('pushing PC');
			stack.push(PC);
			PC = low + ((high&0x0F) << 8);
			}
		
		/*Test Skip if vx==const*/
		//SE Const
		else if(opcode===0x30) {
			if(V[high&0x0F] === low) {
				PC+=2;
			}
		}
		//SNE Const
		/*Test and Skip vx!= const*/
		else if(opcode===0x40) {
			if(V[high&0x0F] !== low) {
				PC+=2;
			}
		}
		//SE VX
		/*Test and Skip vx==vy */
		else if(opcode===0x50){
			if(V[high&0x0F] === V[(low&0xF0)>>4]) {
				PC+=2;
			}
		}
		//LD VX, VY
		/*Assign const vx=kk*/
		else if(opcode===0x60){
			//Mojo.Log.info("v",n2,"=",n1,n0);
			V[high&0x0F] = low;
		}
		/*Add const vx+=kk*/
		else if(opcode===0x70){
			x = high&0x0F;
			V[x] += low;
			V[15] = V[x]&0x100 ? 1 :0;
			V[x] &= 0xFF;			
		}
		/*Math ops vx = vx op vy*/
		else if(opcode===0x80){
			x= high&0x0F, y=((low&0xF0)>>4), subcode=low&0x0F;
			if(subcode===0) {
				V[x] = V[y];
			}
			if(subcode===1) {	
				V[x] |= V[y];		
			}
			if(subcode===2) {
				V[x] &= V[y];
			}
			if(subcode===3) {
				V[x] ^= V[y];
			}
			if(subcode===4) {		
				V[x] += V[y];
				V[15] = V[x]&0x100 ? 1 :0;
				V[x] &= 0xFF;	
			}
			
			if(subcode===5) {
				if(V[x] >= V[y]) {
					V[x] -= V[y];
					V[15] = 1;				
				} else {
					V[x] += 255-V[y];
					V[15] = 0;
				}
			}			
			if(subcode===6) {
				V[15] = V[x] & 0x01;
				V[x] >>= 1;
			}
			
			if(subcode===7) {
				if(V[y] >= V[x]) {
					V[x] = V[y] - V[x];
					V[15] = 1;
					
				} else {
					V[x] = 255+V[y]-V[x];
					V[15] = 0;
				}
			}
			
			
			if(subcode===0x0E) {
				V[15] = V[x] & 0x80;
				V[x] <<= 1;
			}
			
		
		}
		
		/*Skip vx != vy*/
		else if(opcode===0x90){
			
			if(V[high&0x0F] !== V[(low&0xF0)>>4]) {
				PC+=2;
			}
		}
		

		/* I = NNN */
		else if(opcode===0xA0) {			
			//Mojo.Log.info(n0,n1<<4,n2<<8);
			I = low + ((high&0x0F) << 8);
		}
		
		else if(opcode===0xB0){
			PC = low + ((high&0x0F) << 8) + V[0];
		}
		else if(opcode===0xC0){
			r = Math.floor(Math.random()*255);
			//Mojo.Log.info('random',r,n0+(n1<<4));
			V[high&0x0F] = r & low;
		
		}
		else if(opcode===0xD0){
			rows = [];
			x = V[high&0x0F];
			y = V[(low&0xF0)>>4];
			yt = V[(low&0xF0)>>4];
			
			for(index = 0; index < (low&0x0F); index++) {		
				rows[index] = mem[I+index];			
			}
			
			V[15] = output.putSprite(x,y,rows);
			
		}
		else if(opcode===0xE0){
			if(low === 0x9E) {
				if(!!input[V[high&0x0F]]) {
					//Mojo.Log.info('key was down',V[n2]);
					PC+=2;
				}
			}
			if(low===0xA1) {
				if(!input[V[high&0x0F]]) {
					//Mojo.Log.info('key was up',V[n2]);
					PC+=2;
				}
			}
		}
		
		else if(opcode===0xF0){
			if(low === 0x07) {
				V[high&0x0F] = delay_timer;
			}
			if(low === 0x0A) {
				for(i = 0; i < 16; i++) {
					if(!!input[i]) {
						V[high&0x0F] = i;
						return;
					}
				} 
				Mojo.Log.info('waiting on keys')
			
				PC -= 2;
				blocking = true;
				
			}
			if(low===0x15) {
				delay_timer = V[high&0x0F];
				timerHandle = setInterval(do_timers, 16);
				
			}
			if(low===0x18) {
				sound.beepOn();
				//beep_timer = V[high&0x0F];
				
			}
			if(low===0x1E) {
				I += V[high&0x0F];
			}
			if(low===0x29) {			
				I = font_start + V[high&0x0F] * 5;
			
			}
			if(low === 0x33) {
				x = V[high&0x0F];			
				mem[I] = Math.floor(x/100);
				mem[I+1] = Math.floor(x%100/10);
				mem[I+2] = Math.floor(x%10);
				
			}
			
			if(low===0x55) {
				for(i = 0; i <= (high&0x0F); i++) {
					mem[I+i] = V[i];
				}
			}
			if(low===0x65) {
				for(i = 0; i <= (high&0x0F); i++) {
					V[i] = mem[I+i];
				}
			}
			if(low===0x75) {
				for(i = 0; i <= (high&0x0F); i++) {
					hp48[i] = V[i];
				}
			}
			if(low===0x85) {
				for(i = 0; i <= (high&0x0F); i++) {
					V[i] = hp48[i];
				}
			}
			
			
		} else {
			Mojo.Log.info("invalid opcode, halting");
			running = false;
		}
	//Mojo.Log.info('showing registers next');
	//Mojo.Log.info("registers:",PC,V,I);
	};
	
	this.load = function(program_array, start_address) {
		if(running) {
			running = false;
		}
		if(start_address === undefined) {
			PC = 0x200;
		} else {
			PC = start_address;
		}
		for(var i = 0; i < program_array.length; i++) {
			mem[PC+i] = program_array[i];
		}
		
	};
	
	this.reset = function(clear_mem) {
		if(clear_mem) {
			mem = [];
			for(var i = 0; i < 80; i++) {
				mem[font_start + i] = font[i];
			}
		}
		output.screenClear();
		stack = [];
		PC = 0x200;
		V = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		I = 0;
		delay_timer = 0;
		beep_timer = 0;		
		running = false;
		halted = false;
		reset= true;
	};
	
	fae_debug = function() {
		operations(mem[PC++], mem[PC++]);
		for(var i = 0; i<breakpoints.length; i++) {
			if(PC === breakpoints[i]) {
				running = false;
				dumpstate();
			}
		}
		if(showstate) {
			dumpstate();
		}
	}

	this.step = function() {
		if(!running) {
			fae_debug();
		}
		
	}
	
	var do_timers = function() {
		if(delay_timer > 0) {
			delay_timer--;
		} else {
			clearInterval(timerHandle);
		}
	}
	
	var do_run = function() {		
		remaining = CYCLES_PER_INTERVAL;	
		while(running && !blocking && remaining !== 0) {
			remaining--;
			operations(mem[PC++], mem[PC++]);
		}
		if (running) {
			setTimeout(do_run, 1);
		}
	}
	
	
	this.pause = function() {
		running = false;
	}
	this.cont = function() {
		running = true;
		setTimeout(do_run, 1);
	}
	this.stopstart = function() {
		running = !running;
		if(running) {
			if (reset) {
				this.run();
			} else {
				setTimeout(do_run, 1);
			}
		}
		return running;
	}
	this.run = function() {
		PC = 0x200;
		running = true;
		reset = false;
		output.screenClear();
		setTimeout(do_run, 1);
	};
	
	/* If the block-in-keys opcode is called,
	 * the input object needs to call this
	 * to continue running
	 */
	this.check_keys = function() {
		blocking = false;	
	};

	this.set_breakpoint = function(address) {
		this.breakpoints.push(address)
	}
	this.is_running = function() {
		return this.running;
	}
	
}
