
var JumpBump = (function(){
    // Default dimensions of the world
	var DEFAULT_WIDTH = 400,
		DEFAULT_HEIGHT = 256;
	var MENU_FADE_IN_DURATION = 600;
	var SCALE = 2.0;
	var DIRECTION_LEFT = 1,
		DIRECTION_RIGHT = 0;
    // Flags if the game should output debug information
	var DEBUG = URLUtil.queryValue('debug') == '1';

	var TOUCH_INPUT = navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);

    // The world dimensions
	var world = {
	    width: DEFAULT_WIDTH,
	    height: DEFAULT_HEIGHT
	};
	var screenSize = {
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	};

	var canvas,
		context;
	var menuBackground;

	var players = [];
	var screen;
	var objects = [];
	var rabbitAtlas;
	var input;
		
	function initialize() {
		// Run selectors and cache element references
		container = $( '#game' );
		canvas = document.querySelector( '#world' );
		
		if ( canvas && canvas.getContext ) {
			context = canvas.getContext('2d');        
		} else {
			alert('Doesn\'t seem like your browser supports the HTML5 canvas element :(');
			return;
		}
		window.addEventListener('resize', onWindowResizeHandler, false);

		input = new Input();
		input.init();

	    // Force an initial layout
		onWindowResizeHandler();

		loadSprites();
		initScreen();
		createPlayers();
		reset();
		update();

        container.fadeIn(MENU_FADE_IN_DURATION);
	}

	function loadSprites() {
		menuBackground = new Image();	
		menuBackground.src = "images/menu.png";

		rabbitAtlas = new Atlas();
		rabbitAtlas.load("images/rabbit.json.txt");
	}
	function initScreen() {
		screen = new Screen();
		screen.init(world.width, world.height);
	}

	function createPlayers() {
		for (var i = 0; i < 4; i++) {
			var player = new Player(i);
			player.initAnumation();
			players.push(player);
		}
	}

	function reset() {
	
	}

	function update() {
		for (var i in players) {
			updatePlayer(players[i]);
		}

		screen.clear();

		for (var i in players) {
			var player = players[i];
			screen.addSprite(rabbitAtlas.getSprite(player.image + 18 * player.id), player.x >> 16, player.y >> 16);
		}
	
		screen.context.drawImage(menuBackground, 0, 0, world.width, world.height);

		screen.drawSprites();

		context.drawImage(screen.canvas, 0, 0, world.width, world.height, 0, 0, screenSize.width, screenSize.height);
		//console.log(screen);
	  
		requestAnimFrame(update);
	}

	function updatePlayer(player) {
		if (input.actions['move-left-' + player.id] && (player.direction == DIRECTION_LEFT || !input.actions['move-right-' + player.id])) {
			if (player.x_add > 0) {
				player.x_add -= 16384;
			} else {
				player.x_add -= 12288;
			}
			if (player.x_add < -98304) {
				player.x_add = -98304;
			}
			player.direction = DIRECTION_LEFT;
			if (player.anim == player.ANIMATION_NONE) {
				player.setAnimation(player.ANIMATION_RUN);
			}
		} else if (input.actions['move-right-' + player.id]) {
			if (player.x_add < 0) {
				player.x_add += 16384;
			} else {
				player.x_add += 12288;
			}
			if (player.x_add > 98304) {
				player.x_add = 98304;
			}
			player.direction = DIRECTION_RIGHT;
			if (player.anim == player.ANIMATION_NONE) {
				player.setAnimation(player.ANIMATION_RUN);
			}
		} else {
			if (player.x_add < 0) {
				player.x_add += 16384;
				if (player.x_add > 0)
					player.x_add = 0;
			} else if (player.x_add > 0) {
				player.x_add -= 16384;
				if (player.x_add < 0)
					player.x_add = 0;
			}
			if (player.anim == player.ANIMATION_RUN) {
				player.setAnimation(player.ANIMATION_NONE);
			}
		}

		if (player.jump_ready && input.actions['move-up-' + player.id]) {
			if ((player.y >> 16) >= (160 + player.id * 2)) {
				player.y_add = -280000;
				player.setAnimation(player.ANIMATION_JUMPUP);
				player.jump_ready = false;
			}
		} else if (!input.actions['move-up-' + player.id]) {
			if (player.y_add < 0) {
				player.y_add += 32768;
				if (player.y_add > 0) player.y_add = 0;
			}
			player.jump_ready = true;
		}
		player.y_add += 12288;
		if (player.y_add > 36864 && player.anim != player.ANIMATION_JUMPDOWN) {
			player.setAnimation(player.ANIMATION_JUMPDOWN);
		}

		player.y += player.y_add;
		if ((player.y >> 16) > (160 + player.id * 2)) {
			player.y = (160 + player.id * 2) << 16;
			player.y_add = 0;
			if (player.anim != player.ANIMATION_RUN && player.anim != player.ANIMATION_NONE) {
				player.setAnimation(player.ANIMATION_NONE);
			}
		}

		player.x += player.x_add;
		if (player.x >> 16 < 0) {
			player.x = 0;
			player.x_add = 0;
		}

		player.updateAnimation();
	}

	function onWindowResizeHandler() {
	    // Update the game size
	    world.width = TOUCH_INPUT ? window.innerWidth : DEFAULT_WIDTH;
	    world.height = TOUCH_INPUT ? window.innerHeight : DEFAULT_HEIGHT;

	    screenSize.width = world.width * SCALE;
	    screenSize.height = world.height * SCALE;

	    // Resize the container
	    container.width(screenSize.width);
	    container.height(screenSize.height);

	    // Resize the canvas
	    canvas.width = screenSize.width;
	    canvas.height = screenSize.height;

	    // Determine the x/y position of the canvas
	    var cx = Math.max((window.innerWidth - screenSize.width) * 0.5, 1);
	    var cy = Math.max((window.innerHeight - screenSize.height) * 0.5, 1);

	    // Update the position of the canvas
	    container.css({
	        left: cx,
	        top: cy
	    });

	}
	
	initialize();
	
})();


function Player(id) {
	this.id = id;
    this.enabld = 0;
    this.x = rnd(150) << 16;
    this.y = (160 + id * 2) << 16;
    this.x_add = 0;
    this.y_add = 0;
    this.direction = rnd(2);
    this.jump_ready = 1;
    this.frame = 0;
    this.frame_tick = 0;
    this.image = 0;

    this.ANIMATION_NONE = 0;
    this.ANIMATION_RUN = 1;
    this.ANIMATION_JUMPUP = 2;
    this.ANIMATION_JUMPDOWN = 3;

    //this.animation = [];

	this.initAnumation = function () {
		/*var player_anim_data = [
			1, 0, 0, 0x7fff, 0, 0, 0, 0, 0, 0,
			4, 0, 0, 4, 1, 4, 2, 4, 3, 4,
			1, 0, 4, 0x7fff, 0, 0, 0, 0, 0, 0,
			4, 2, 5, 8, 6, 10, 7, 3, 6, 3,
			1, 0, 6, 0x7fff, 0, 0, 0, 0, 0, 0,
			2, 1, 5, 8, 4, 0x7fff, 0, 0, 0, 0,
			1, 0, 8, 5, 0, 0, 0, 0, 0, 0];

    	for (var c1 = 0; c1 < 7; c1++) {
    		var playerAnim = new Object();
    		playerAnim.num_frames = player_anim_data[c1 * 10];
    		playerAnim.restart_frame = player_anim_data[c1 * 10 + 1];
    		playerAnim.frame = [];
    		for (var c2 = 0; c2 < 4; c2++) {
    			var frame = {
    				image: player_anim_data[c1 * 10 + c2 * 2 + 2],
    				ticks: player_anim_data[c1 * 10 + c2 * 2 + 3]
    			};
    			playerAnim.frame.push(frame);
    		}
    		this.animation.push(playerAnim);
    	}
    	console.log(this.animation);*/
		this.ANIMATION_NONE = {
			restart_frame: 0,
			frame: [{image: 0, ticks: 1}]
		};
		this.ANIMATION_RUN = {
			restart_frame: 0,
			frame: [{image: 0, ticks: 4}, {image: 1, ticks: 4}, {image: 2, ticks: 4}, {image: 3, ticks: 4}]
		};
		this.ANIMATION_JUMPUP = {
			restart_frame: 0,
			frame: [{image: 4, tick: 1}]
		};
		this.ANIMATION_JUMPDOWN = {
			restart_frame: 2,
			frame: [{image: 5, ticks: 8}, {image: 6, ticks: 10}, {image: 7, ticks: 3}, {image: 6, ticks: 3}]
		};

		this.anim = this.ANIMATION_NONE;
	}

	this.setAnimation = function (anim) {
		this.anim = anim;
		this.frame = 0;
		this.frame_tick = 0;
	}

	this.updateAnimation = function () {
		this.frame_tick++;
		var anim = this.anim;

		if (this.frame_tick >= anim.frame[this.frame].ticks) {
			this.frame++;
			if (this.frame >= anim.frame.length)
				this.frame = anim.restart_frame;
			this.frame_tick = 0;
		}
		this.image = anim.frame[this.frame].image + this.direction * 9;
	}
}

function Sprite() {

}

function Object() {
	
}

function Screen() {
	this.sprites = [];

	this.init = function (width, height) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;
		this.context = this.canvas.getContext('2d');
	}

	this.clear = function () {
		this.sprites = [];
	}
	this.addSprite = function (sprite, x, y) {
		if (sprite == null) {
			return;
		}
		var drawObject = {
			sprite: sprite,
			x: x,
			y: y
		};
		this.sprites.push(drawObject);
	}

	this.drawSprites = function () {
		for (var key in this.sprites) {
			var drawObject = this.sprites[key];
			var sprite = drawObject.sprite;
			this.context.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height,
				drawObject.x - sprite.hotspot_x, drawObject.y - sprite.hotspot_y, sprite.width, sprite.height);
		}
	}
}

function Atlas() {
	this.sprites = []
	this.ready = false;

	this.load = function (atlasDataUrl) {
		$.ajax({
			url: atlasDataUrl,
			dataType: "text",
			atlas: this,
			success: function (data) {
				var parsed = JSON.parse(data);
				var atlas = this.atlas;

				atlas.image = new Image();
				atlas.image.src = parsed.imageSource;

				for (var s in parsed.sprites) {
					var data = parsed.sprites[s];
					sprite = new Sprite();
					sprite.x = data.x;
					sprite.y = data.y;
					sprite.width = data.width;
					sprite.height = data.height;
					sprite.hotspot_x = data.hotspot_x;
					sprite.hotspot_y = data.hotspot_y;
					sprite.image = this.atlas.image;
					atlas.sprites.push(sprite);
				}
				atlas.ready = true
			}
		});
	}

	this.getSprite = function (index) {
		if (!this.ready) {
			return null;
		}
		return this.sprites[index];
	}
}

function Input() {
	this.bindings = {};
	this.actions = {};

	this.init = function () {
		var input = this;
		this.bindings[87] = 'move-up-0';
		this.bindings[65] = 'move-left-0';
		this.bindings[83] = 'move-down-0';
		this.bindings[68] = 'move-right-0';

		this.bindings[37] = 'move-left-1';
		this.bindings[38] = 'move-up-1';
		this.bindings[39] = 'move-right-1';

		window.addEventListener('keydown', function (event) { input.onKeyDown(event); });
		window.addEventListener('keyup', function (event) { input.onKeyUp(event); } );
	}

	this.onKeyDown = function (event) {
		var action = this.bindings[event.keyCode];
		if (action) {
			this.actions[action] = true;
		}
	}

	this.onKeyUp = function (event) {
		var action = this.bindings[event.keyCode];
		if (action) {
			this.actions[action] = false;
		}
	}
}
