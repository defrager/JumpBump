var PlayerAnimation = {
	NONE: {
		restart_frame: 0,
		frame: [{ image: 0, ticks: 1 }]
	},
	RUN: {
		restart_frame: 0,
		frame: [{ image: 0, ticks: 4 }, { image: 1, ticks: 4 }, { image: 2, ticks: 4 }, { image: 3, ticks: 4 }]
	},
	JUMPUP: {
		restart_frame: 0,
		frame: [{ image: 4, tick: 1 }]
	},
	JUMPDOWN: {
		restart_frame: 2,
		frame: [{ image: 5, ticks: 8 }, { image: 6, ticks: 10 }, { image: 7, ticks: 3 }, { image: 6, ticks: 3 }]
	},
	SWIMDOWN: {
		restart_frame: 0,
		frame: [{ image: 6, ticks: 1 }]
	},
	SWIMUP: {
		restart_frame: 1,
		frame: [{ image: 5, ticks: 8 }, { image: 4, ticks: 1 }]
	},
	DEATH: {
		restart_frame: 0,
		frame: [{ image: 8, ticks: 5 }]
	}
}

var ObjectAnimation = {
	SPRING: {
		frame: [{ image: 0, ticks: 3 }, { image: 1, ticks: 3 }, { image: 2, ticks: 3 }, { image: 4, ticks: 3 }, { image: 5, ticks: 3}]
	},
	SPLASH: {
		frame: [{ image: 6, ticks: 2 },{ image: 7, ticks: 2 },{ image: 8, ticks: 2 },{ image: 9, ticks: 2 },{ image: 10, ticks: 2 },{ image: 11, ticks: 2 },{ image: 12, ticks: 2 },{ image: 13, ticks: 2 },{ image: 14, ticks: 2 }]
	}
}

var GameObject = {
	Splash: function () {
		this.temporal = true;
	},

	Spring: function () {
		this.resetAnimation = function () {
			this.frame = 0;
			this.ticks = this.anim.frame[0].ticks;
			this.image = this.anim.frame[0].image;
		}
	}
}

var PlayerDirection = {
	LEFT: 1,
	RIGHT: 0
}

function Player(id) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.x_add = 0;
	this.y_add = 0;
	this.direction = rnd(2) ? PlayerDirection.LEFT : PlayerDirection.RIGHT;
	this.jump_ready = true;
	this.frame = 0;
	this.frame_tick = 0;
	this.image = 0;
	this.anim = PlayerAnimation.NONE;

	this.setAnimation = function (anim) {
		this.anim = anim;
		this.frame = 0;
		this.frame_tick = 0;
	}

	this.updateAnimation = function () {
		this.frame_tick++;
		var anim = this.anim;
		var restart_frame = false;

		if (this.frame_tick >= anim.frame[this.frame].ticks) {
			this.frame++;
			if (this.frame >= anim.frame.length) {
				this.frame = anim.restart_frame;
				restart_frame = true;
			}
			this.frame_tick = 0;
		}
		this.image = anim.frame[this.frame].image + this.direction * 9;
		return restart_frame;
	}
}

function Sprite() {

}

function Screen(width, height) {
	this.sprites = [];
	this.width = width;
	this.height = height;

	init = function (screen) {
		screen.canvas = document.createElement('canvas');
		screen.canvas.width = screen.width;
		screen.canvas.height = screen.height;
		screen.context = screen.canvas.getContext('2d');
	} (this);

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

var Tile = {
	NONE: '0',
	GROUND: '1',
	WATER: '2',
	ICE: '3',
	SPRING: '4', 

	isOneOf: function (tile, tiles) {
		return tiles.indexOf(tile) !== -1;
	}
}

function Level() {
	this.ready = false;
	this.backgroundImage;
	this.foregroundImage;
	this.tiles = [];
	this.ROW_COUNT = 16;
	this.COLUMN_COUNT = 22;
	this.TILE_WIDTH = 16;
	this.TILE_HEIGHT = 16;

	this.load = function (atlasDataUrl, callback) {
		loadJSON(atlasDataUrl, this, function (level, parsed) {
			level.backgroundImage = new Image();
			level.backgroundImage.src = parsed.backgroundImage;

			level.foregroundImage = new Image();
			level.foregroundImage.src = parsed.foregroundImage;

			for (var s in parsed.rows) {
				var row = parsed.rows[s];
				level.tiles.push(row);
			}
			level.ready = true;
			callback();
		});
	}

	this.positionPlayers = function (players) {
		for (var i in players) {
			this.positionPlayer(players[i], players);
		}
	}

	this.positionPlayer = function (player, players) {
		var positionFound = false;
		var column, row;
		while (!positionFound) {
			positionFound = true;
			column = rnd(this.COLUMN_COUNT);
			row = rnd(this.ROW_COUNT);
			if (this.tiles[row][column] != Tile.NONE) {
				positionFound = false;
			} 
			for (var p = 0; p < players.length; p++) {
				if (players[p] == player) continue;
				if (Math.abs(column * this.TILE_WIDTH - players[p].x) < 2 * this.TILE_WIDTH && Math.abs(row * this.TILE_HEIGHT - players[p].y) < 2 * this.TILE_HEIGHT) {
					positionFound = false;
				}
			}
		}
			
		player.dead_flag = false;
		player.x = column * this.TILE_WIDTH;
		player.y = row * this.TILE_HEIGHT;
		player.x_add = player.y_add = 0;
		player.direction = PlayerDirection.RIGHT;
		player.jump_ready = true;
		player.in_water = false;
		player.setAnimation(PlayerAnimation.NONE);
	}
}

function Atlas() {
	this.sprites = []
	this.ready = false;

	this.load = function (atlasDataUrl) {
		loadJSON(atlasDataUrl, this, function (atlas, parsed) {
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
				sprite.image = atlas.image;
				atlas.sprites.push(sprite);
			}
			atlas.ready = true
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
		window.addEventListener('keyup', function (event) { input.onKeyUp(event); });
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

var JumpBump = (function(){
    // Default dimensions of the world
	var DEFAULT_WIDTH = 400,
		DEFAULT_HEIGHT = 256;
	var MENU_FADE_IN_DURATION = 600;
	var SCALE = 1.5;
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
	var objectsAtlas;
	var input;
	var level;
	var menuMode = false;
		
	function initialize() {
		container = $('#game');
		canvas = document.querySelector('#world');
		
		if (canvas && canvas.getContext) {
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
		loadLevel();
		initScreen();
		createPlayers();
		reset();
		update();

        container.fadeIn(MENU_FADE_IN_DURATION);
	}

	function loadSprites() {
		menuBackground = new Image();	
		menuBackground.src = 'images/menu.png';

		rabbitAtlas = new Atlas();
		rabbitAtlas.load('images/rabbit.json.txt');

		objectsAtlas = new Atlas();
		objectsAtlas.load('images/objects.json.txt');
	}

	function loadLevel() {
		level = new Level();
		level.load('images/level.json.txt', onLevelLoad);
	}

	function onLevelLoad() {
		level.positionPlayers(players);
		for (var row = 0; row < level.ROW_COUNT; row++) {
			for (var column = 0; column < level.COLUMN_COUNT; column++) {
				if (level.tiles[row][column] == Tile.SPRING) {
					addObject(new GameObject.Spring(), column * level.TILE_WIDTH, row * level.TILE_HEIGHT, 0, 0, ObjectAnimation.SPRING, ObjectAnimation.SPRING.frame.length - 1);
				}
			}
		}
	}

	function initScreen() {
		screen = new Screen(world.width, world.height);
	}

	function createPlayers() {
		var NUM_PLAYERS = 2;
		for (var i = 0; i < NUM_PLAYERS; i++) {
			var player = new Player(i);
			player.x = rnd(150);
			player.y = 160 + i * 2;

			players.push(player);
		}
	}

	function reset() {
	
	}

	function update() {
		if (menuMode || level.ready) {
			for (var i in players) {
				updatePlayer(players[i]);
			}
		}
		if (level.ready) {
			checkDeath();
		}

		screen.clear();

		for (var i in players) {
			var player = players[i];
			screen.addSprite(rabbitAtlas.getSprite(player.image + 18 * player.id), Math.floor(player.x),  Math.floor(player.y));
		}

		updateObjects();
	
		if (menuMode) {
			screen.context.drawImage(menuBackground, 0, 0, world.width, world.height);
		} else if (level.ready) {
			screen.context.drawImage(level.backgroundImage, 0, 0, world.width, world.height);
		}

		screen.drawSprites();

		if (!menuMode && level.ready) {
			screen.context.drawImage(level.foregroundImage, 0, 0, world.width, world.height);
		}

		context.drawImage(screen.canvas, 0, 0, world.width, world.height, 0, 0, screenSize.width, screenSize.height);
	  
		requestAnimFrame(update);
	}

	function updateObjects() {
		for (var i = objects.length - 1; i >= 0; i--) {
			var object = objects[i];
			object.ticks--;
			if (object.ticks <= 0) {
				object.frame++;
				if (object.frame >= object.anim.frame.length) {
					if (object.temporal) {
						objects.splice(i, 1);
						continue;
					}
					object.frame--;
				}
				object.ticks = object.anim.frame[object.frame].ticks;
				object.image = object.anim.frame[object.frame].image;
			}
			screen.addSprite(objectsAtlas.getSprite(object.image), Math.floor(object.x), Math.floor(object.y));
		}
	}

	function getTile(y, x) {
		if (y < 0) {
			return Tile.NONE;
		}
		row = Math.floor(y / level.TILE_HEIGHT);
		if (row >= level.tiles.length) {
			return Tile.GROUND;
		}
		return level.tiles[row][Math.floor(x / level.TILE_WIDTH)]
	}

	function addObject(object, x, y, x_add, y_add, anim, frame) {
		object.x = x;
		object.y = y;
		object.x_add = x_add;
		object.y_add = y_add;
		object.x_acc = 0;
		object.y_acc = 0;
		object.anim = anim;
		object.frame = frame;
		object.ticks = anim.frame[frame].ticks;
		object.image = anim.frame[frame].image;
		objects.push(object);
	}

	function checkDeath() {
		for (var i = 0; i < players.length; ++i) {
			for (var j = 0; j < i; ++j) {
				var p1 = players[i];
				var p2 = players[j];

				if (Math.abs(p1.x - p2.x) >= 12 || Math.abs(p1.y - p2.y) >= 12)
					continue;
				

				if (Math.abs(p1.y - p2.y) > 5) {
					if (p1.y > p2.y) {
						var p = p1; p1 = p2; p2 = p;
					}
					if (p1.y < p2.y) {
						if (p1.y_add >= 0) {
							p1.y_add = -p1.y_add;
							if (p1.y_add > 4) {
								p1.y_add = 4;
							}
							p1.jump_abort = true;
							p2.dead_flag = true;

							if (p2.anim != PlayerAnimation.DEATH) {
								p2.setAnimation(PlayerAnimation.DEATH);
							}
						} else {
							if (p2.y_add < 0) p2.y_add = 0;
						}


					}
				} else {
					if (p1.x > p2.x) {
						var p = p1; p1 = p2; p2 = p;
					}
					if (p1.x < p2.x) {
						if (p1.x_add > 0)
							p1.x = p2.x - 12;
						else if (p2.x_add < 0)
							p2.x = p1.x + 12;
						else {
							p1.x -= p1.x_add;
							p2.x -= p2.x_add;
						}
						var t = p2.x_add;
						p2.x_add = p1.x_add;
						p1.x_add = t;
						if (p1.x_add > 0) p1.x_add = -p1.x_add;
						if (p2.x_add < 0) p2.x_add = -p2.x_add;
					}
				}
			}
		}
	}

	function updatePlayer(player) {
		var UNIT = 1.0 / 16;
		var cx = level.TILE_WIDTH, cy = level.TILE_HEIGHT;

		if (player.dead_flag) {
			if (player.updateAnimation()) {
				level.positionPlayer(player, players);
			}
			return;
		}

		if (input.actions['move-left-' + player.id] && (player.direction == PlayerDirection.LEFT || !input.actions['move-right-' + player.id])) {
			if (getTile(player.y + cy, player.x + cx / 2) == Tile.ICE
				|| getTile(player.y + cy, player.x) != Tile.GROUND && getTile(player.y + cy, player.x + cx - 1) == Tile.ICE
				|| getTile(player.y + cy, player.x) == Tile.ICE && getTile(player.y + cy, player.x + cx - 1) != Tile.GROUND) {
				if (player.x_add > 0) {
					player.x_add -= 0.25 * UNIT;
				} else {
					player.x_add -= 0.1875 * UNIT;
				}
			} else {
				if (player.x_add > 0) {
					player.x_add -= 4 * UNIT;
				} else {
					player.x_add -= 3 * UNIT;
				}
			}
			if (player.x_add < -24 * UNIT) {
				player.x_add = -24 * UNIT;
			}

			player.direction = PlayerDirection.LEFT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else if (input.actions['move-right-' + player.id]) {
			if (getTile(player.y + cy, player.x + cx / 2) == Tile.ICE
				|| getTile(player.y + cy, player.x) != Tile.GROUND && getTile(player.y + cy, player.x + cx - 1) == Tile.ICE
				|| getTile(player.y + cy, player.x) == Tile.ICE && getTile(player.y + cy, player.x + cx - 1) != Tile.GROUND) {
				if (player.x_add > 0) {
					player.x_add += 0.25 * UNIT;
				} else {
					player.x_add += 0.1875 * UNIT;
				}
			} else {
				if (player.x_add < 0) {
					player.x_add += 4 * UNIT;
				} else {
					player.x_add += 3 * UNIT;
				}
			}
			if (player.x_add > 24 * UNIT) {
				player.x_add = 24 * UNIT;
			}
			player.direction = PlayerDirection.RIGHT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else {
			if (Tile.isOneOf(getTile(player.y + cy, player.x + cx / 2), [Tile.GROUND, Tile.SPRING])
				|| Tile.isOneOf(getTile(player.y + cy, player.x), [Tile.GROUND, Tile.SPRING]) && getTile(player.y + cy, player.x + cx - 1) != Tile.ICE
				|| Tile.isOneOf(getTile(player.y + cy, player.x + cx - 1), [Tile.GROUND, Tile.SPRING]) && getTile(player.y + cy, player.x) != Tile.ICE) {
				if (player.x_add < 0) {
					player.x_add += 4 * UNIT;
					if (player.x_add > 0)
						player.x_add = 0;
				} else if (player.x_add > 0) {
					player.x_add -= 4 * UNIT;
					if (player.x_add < 0)
						player.x_add = 0;
				}
			}
			if (player.anim == PlayerAnimation.RUN) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		}

		if (player.jump_ready && input.actions['move-up-' + player.id]) {
			if (Tile.isOneOf(getTile(player.y + cy, player.x), [Tile.GROUND, Tile.ICE]) || Tile.isOneOf(getTile(player.y + cy, player.x + cx - 1), [Tile.GROUND, Tile.ICE])) {
				player.y_add = -70 * UNIT;
				player.setAnimation(PlayerAnimation.JUMPUP);
				player.jump_ready = false;
				player.jump_abort = true;
			}
			if ((getTile(player.y + cy / 2 - 1, player.x) == Tile.NONE || getTile(player.y + cy / 2 - 1, player.x + cx - 1) == Tile.NONE)
				&& (getTile(player.y + cy / 2 + 1, player.x) == Tile.WATER || getTile(player.y + cy / 2 + 1, player.x + cx - 1) == Tile.WATER)) {
				player.y_add = -48 * UNIT;
				player.in_water = false;
				player.setAnimation(PlayerAnimation.JUMPUP);
				player.jump_ready = false;
				player.jump_abort = true;
			}
		} else if (!input.actions['move-up-' + player.id]) {
			player.jump_ready = true;
			if (!player.in_water && player.y_add < 0 && player.jump_abort) {
				player.y_add += 8 * UNIT;
				if (player.y_add > 0) player.y_add = 0;
			}
		}

		player.x += player.x_add;
		if (player.x < 0) {
			player.x = 0;
			player.x_add = 0;
		}
		if (player.x + cx > level.TILE_WIDTH * level.COLUMN_COUNT) {
			player.x = level.TILE_WIDTH * level.COLUMN_COUNT - cx;
			player.x_add = 0;
		}
		
		y = Math.floor(player.y); x = Math.floor(player.x);
		if (y < 0) y = 0;
		if (Tile.isOneOf(getTile(y, x), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(y + cy - 1, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.x = Math.floor((player.x + cx / 2) / cx) * cx;
			player.x_add = 0;
		}
		if (Tile.isOneOf(getTile(y, x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(y + cy - 1, x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.x = Math.floor((player.x + cx / 2) / cx) * cx;
			player.x_add = 0;
		}

		player.y += player.y_add;

		if (getTile(player.y + cy - 1, player.x + cx / 2) == Tile.SPRING
			|| getTile(player.y + cy - 1, player.x) == Tile.SPRING && getTile(player.y + cy - 1, player.x + cx - 1) != Tile.GROUND
			|| getTile(player.y + cy - 1, player.x) != Tile.GROUND && getTile(player.y + cy - 1, player.x + cx - 1) == Tile.SPRING) {
			player.y -= 1;
			player.y_add = -100 * UNIT;
			player.setAnimation(PlayerAnimation.JUMPUP);
			player.jump_ready = false;
			player.jump_abort = false;
			console.log("Jump");

			for (var i in objects) {
				var object = objects[i];
				if (object.anim == ObjectAnimation.SPRING) { // TODO: Add multiple spring support.
					object.resetAnimation();
				}
			}

			// TODO(Spring Sound);
		}

		if (Tile.isOneOf(getTile(player.y, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING]) || Tile.isOneOf(getTile(player.y, player.x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.y = Math.floor((player.y + cy / 2) / cy) * cy;
			player.y_add = 0;
			player.setAnimation(PlayerAnimation.NONE);
		}

		if (getTile(player.y + cy / 2, player.x + cx / 2) == Tile.WATER) {
			if (!player.in_water) {
				player.in_water = true;
				player.setAnimation(PlayerAnimation.SWIMDOWN);
				if (player.y_add >= 8 * UNIT) {
					// TODO: Add Splash sound.
					addObject(new GameObject.Splash(), player.x + 8, Math.floor((player.y) / cy) * cy + cy - 1, 0, 0, ObjectAnimation.SPLASH, 0);
				}
			}
			player.y_add -= 0.375 * UNIT;
			if (player.y_add < 0 && player.anim != PlayerAnimation.SWIMUP) {
				player.setAnimation(PlayerAnimation.SWIMUP);
			}
			if (player.y_add < -16 * UNIT) {
				player.y_add = -16 * UNIT;
			}
			if (player.y_add > 16 * UNIT) {
				player.y_add = 16 * UNIT;
			}
			if (Tile.isOneOf(getTile(player.y + cy - 1, player.x), [Tile.GROUND, Tile.ICE]) || Tile.isOneOf(getTile(player.y + cy - 1, player.x + cx - 1), [Tile.GROUND, Tile.ICE])) {
				player.y = Math.floor((player.y + cy / 2) / cy) * cy;
				player.y_add = 0;
			}

		} else if (Tile.isOneOf(getTile(player.y + cy - 1, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(player.y + cy - 1, player.x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.in_water = false;
			player.y = Math.floor((player.y + cy / 2) / cy) * cy;
			player.y_add = 0;
			if (player.anim != PlayerAnimation.NONE && player.anim != PlayerAnimation.RUN) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		} else {
			if (!player.in_water) {
				player.y_add += 3 * UNIT;
				player.y_add = Math.min(player.y_add, 80 * UNIT);
			} else {
				player.y = Math.floor(player.y) + 1;
				player.y_add = 0;
			}
			player.in_water = false;
		}

		if (player.y_add > 9 * UNIT && player.anim != PlayerAnimation.JUMPDOWN && !player.in_water) {
			player.setAnimation(PlayerAnimation.JUMPDOWN);
		}

		player.updateAnimation();

	}
	function updatePlayer2(player) {
		var UNIT = 1.0 / 16;
		if (input.actions['move-left-' + player.id] && (player.direction == PlayerDirection.LEFT || !input.actions['move-right-' + player.id])) {
			if (player.x_add > 0) {
				player.x_add -= 4 * UNIT;
			} else {
				player.x_add -= 3 * UNIT;
			}
			if (player.x_add < -24 * UNIT) {
				player.x_add = -24 * UNIT;
			}
			player.direction = PlayerDirection.LEFT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else if (input.actions['move-right-' + player.id]) {
			if (player.x_add < 0) {
				player.x_add += 4 * UNIT;
			} else {
				player.x_add += 3 * UNIT;
			}
			if (player.x_add > 24 * UNIT) {
				player.x_add = 24 * UNIT;
			}
			player.direction = PlayerDirection.RIGHT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else {
			if (player.x_add < 0) {
				player.x_add += 4 * UNIT;
				if (player.x_add > 0)
					player.x_add = 0;
			} else if (player.x_add > 0) {
				player.x_add -= 4 * UNIT;
				if (player.x_add < 0)
					player.x_add = 0;
			}
			if (player.anim == PlayerAnimation.RUN) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		}

		if (player.jump_ready && input.actions['move-up-' + player.id]) {
			if (player.y >= 160 + player.id * 2) {
				player.y_add = -70 * UNIT;
				player.setAnimation(PlayerAnimation.JUMPUP);
				player.jump_ready = false;
			}
		} else if (!input.actions['move-up-' + player.id]) {
			if (player.y_add < 0) {
				player.y_add += 8 * UNIT;
				if (player.y_add > 0) player.y_add = 0;
			}
			player.jump_ready = true;
		}
		player.y_add += 3 * UNIT;
		if (player.y_add > 9 * UNIT && player.anim != PlayerAnimation.JUMPDOWN) {
			player.setAnimation(PlayerAnimation.JUMPDOWN);
		}

		player.y += player.y_add;
		if (player.y > 160 + player.id * 2) {
			player.y = 160 + player.id * 2;
			player.y_add = 0;
			if (player.anim != PlayerAnimation.RUN && player.anim != PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		}

		player.x += player.x_add;
		if (player.x < 0) {
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
