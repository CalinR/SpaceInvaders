/*==================================================
BUILD CANVAS
==================================================*/
var canvas_width = 920;
var canvas_height = 742;

var canvas_element = $("<canvas width='" + canvas_width + "' height='" + canvas_height + "'></canvas>");
var canvas = canvas_element.get(0).getContext("2d");
canvas_element.appendTo('#game_container');

var canvas_midpoint = {
	x: canvas_width/2,
	y: canvas_height/2
}

var canvas_ninths = Math.round(canvas_width/9);
var canvas_elevenths = Math.round(canvas_width/11);


/*==================================================
GLOBAL GAME VARIABLES
==================================================*/
var game_background = '#000';
var all_player_bullets = [];
var all_enemies = [];
var all_bunkers = [];
var all_enemy_bullets = [];
var created_bunkers = false;
var created_enemies = false;
var bunker_position = canvas_height-104;
var delay_bullet = false;
var reverse_direction = false;
var enemy_y_offset = 0;
var enemy_speed = 8;
var enemy_moves = 6;
var move_sound = 0;


/*==================================================
GAME LOOP
==================================================*/
var fps = 30;
setInterval(function(){
	update();
	draw();
}, 1000/fps);


setInterval(function(){
	if(reverse_direction){
		reverse_enemies();
		reverse_direction = false;
	}
	all_enemies.forEach(function(enemy){
  		enemy.update();
  		enemy.shoot();
  	});
	enemy_y_offset = 0;
	enemy_moves += 1;
	move_sound += 1;
	
	move_sounds();

}, 800);


/*==================================================
UPDATE GAME
==================================================*/
function update(){
	player.controls();

	all_player_bullets.forEach(function(bullet) {
    	bullet.update();
  	});

  	all_enemy_bullets.forEach(function(bullet) {
    	bullet.update();
  	});

  	all_player_bullets = all_player_bullets.filter(function(bullet) {
    	return bullet.active;
  	});

  	all_enemies = all_enemies.filter(function(enemy) {
		return enemy.active;
	});

	all_enemy_bullets = all_enemy_bullets.filter(function(bullet) {
    	return bullet.active;
  	});

  	handle_collisions();

  	all_enemies.forEach(function(enemy){
		if(enemy.x>=canvas_width-(enemy.width+15)){
  			reverse_direction=true;
  		}
  		if(enemy.x<20){
  			reverse_direction=true;
  		}
  	});
}


/*==================================================
DRAW GAME
==================================================*/
function draw(){
	canvas.fillStyle = game_background;
	canvas.fillRect(0, 0, canvas_width, canvas_height);

	player.draw();

	if(created_bunkers == false){
		init_bunkers();
	}
	if(created_enemies == false){
		init_enemies();
	}

	all_bunkers.forEach(function(bunker) {
    	bunker.draw();
  	});

  	all_player_bullets.forEach(function(bullet) {
    	bullet.draw();
  	});

  	all_enemy_bullets.forEach(function(bullet) {
    	bullet.draw();
  	});

  	all_enemies.forEach(function(enemy) {
    	enemy.draw();
  	});
}


/*--------------------------------------------------
RETURN WHICH KEY IS DOWN
--------------------------------------------------*/
$(function() {
	window.keydown = {};

	function keyName(event) {
		return jQuery.hotkeys.specialKeys[event.which] || String.fromCharCode(event.which).toLowerCase();
	}

	$(document).bind("keydown", function(event) {
		keydown[keyName(event)] = true;
	});

	$(document).bind("keyup", function(event) {
		keydown[keyName(event)] = false;
	});
});


/*==================================================
PLAYER
==================================================*/
var player = {
	color: '#00ff00',
	x: 0,
	y: 0,
	width: 60,
	height: 32,
	speed: 5
}

player.x = canvas_midpoint.x - (player.width/2);
player.y = canvas_height - player.height - 10;

player.sprite = Sprite("player");

player.draw = function() {
	this.sprite.draw(canvas, this.x, this.y);
}

player.shoot = function() {
	if(delay_bullet==false){
		var bullet_position = this.midpoint();
		if(all_player_bullets.length < 1){
			Sound.play("shoot");
			all_player_bullets.push(player_bullets({
				speed: 20,
				x: bullet_position.x,
				y: bullet_position.y
			}));
		}
		bullet_delay();
	}
}

player.midpoint = function() {
	return {
		x: this.x + this.width/2,
		y: this.y + this.height/2
	};
}

player.controls = function() {
	if (keydown.left){ player.x -= player.speed; }
	if (keydown.right){ player.x += player.speed; }
	if (keydown.space){ player.shoot(); }

	player.x = player.x.clamp(10, canvas_width - player.width - 10);
}


/*==================================================
BUNKERS
==================================================*/
function bunkers(i){
	i = i || {};

	i.color = '#00ff00';
	i.x = 20;
	i.y = bunker_position-72;
	i.height = 72;
	i.width = 96;
	i.sprite = Sprite("bunker");

	i.draw = function() {
		this.sprite.draw(canvas, this.x, this.y);
	}

	return i;
}

function init_bunkers(){
	created_bunkers = true;
	for(i=0; i<4; i++){
		all_bunkers.push(bunkers());
		var bunker_offset = 124;
		var bunker_margin = 78;

		all_bunkers[i].x=(all_bunkers[i].width+bunker_offset)*i+bunker_margin;
	}
}


/*==================================================
PLAYER BULLETS
==================================================*/
function player_bullets(i){
	i.active = true;

	i.x_velocity = 0;
	i.y_velocity = -i.speed;
	i.width = 3;
	i.height = 10;
	i.color = "#fff";

	i.inBounds = function() {
		return i.x >= 0 && i.x <= canvas_width && i.y >= 0 && i.y <= canvas_height;
	}

	i.draw = function() {
		canvas.fillStyle = this.color;
		canvas.fillRect(this.x, this.y, this.width, this.height);
	}

	i.update = function() {
		i.x += i.x_velocity;
		i.y += i.y_velocity;

		i.active = i.active && i.inBounds();
	}

	return i;
}


/*==================================================
BULLET DELAY
==================================================*/
function bullet_delay(){
	delay_bullet=true;
	setTimeout(function(){
		delay_bullet=false;
	}, 500);
}


/*==================================================
ENEMY MOVEMENT DELAY
==================================================*/
function enemy_delay(){
	delay_enemy=true;
	setTimeout(function(){
		delay_enemy=false;
	}, 500);
}


/*==================================================
DETECT COLLISION
==================================================*/
function collides(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}


/*==================================================
HANDLE COLLISION
==================================================*/
function handle_collisions() {
	all_player_bullets.forEach(function(bullet) {
		all_bunkers.forEach(function(bunker) {
			if (collides(bullet, bunker)) {
				bullet.active = false;
			}
		});
	});

	all_player_bullets.forEach(function(bullet) {
		all_enemies.forEach(function(enemy) {
			if (collides(bullet, enemy)) {
				bullet.active = false;
				enemy.explode = true;
				Sound.play("invaderkilled");
				setTimeout(function(){
					enemy.active = false;
				}, 400);
			}
		});
	});

	all_enemy_bullets.forEach(function(bullet) {
		all_bunkers.forEach(function(bunkers) {
			if (collides(bullet, bunkers)) {
				bullet.active = false;
			}
		});
	});
}


/*==================================================
ENEMIES
==================================================*/
function enemies(i){
	i = i || {};
	i.active = true;
	i.color = '#00ff00';
	i.x = 0;
	i.y = 0;
	i.height = 32;
	i.width = 48;
	i.sprite = Sprite("enemy_1");
	i.sprite_2 = Sprite("enemy_1_2");
	i.sprite_explode = Sprite("enemy_killed");
	i.explode = false;

	i.draw = function() {
		if(i.explode == true ){
			this.sprite_explode.draw(canvas, this.x, this.y);
		}
		else {
			if(enemy_moves%2){
			this.sprite_2.draw(canvas, this.x, this.y);
			}
			else {
				this.sprite.draw(canvas, this.x, this.y);
			}
		}
	}

	i.update = function() {
		i.x += enemy_speed;
		i.y = i.y + enemy_y_offset;
	}

	i.midpoint = function() {
		return {
			x: this.x + this.width/2,
			y: this.y + this.height/2
		};
	}

	i.shoot = function() {
		if((Math.floor(Math.random()*101)) ==1){
			var bullet_position = this.midpoint();
			all_enemy_bullets.push(enemy_bullets({
				speed: 5,
				x: bullet_position.x,
				y: bullet_position.y
			}));
		}
	}

	return i;
}

function reverse_enemies(){
	if(enemy_speed > 0){
		enemy_speed = -8;
	}
	else {
		enemy_speed = 8;
	}
	enemy_y_offset = 48;
}

function init_enemies(){
	created_enemies = true;

	var enemy_offset = 12;
	var enemy_vertical_offset = 28;
	var enemy_margin = Math.round((canvas_width-((48+enemy_offset)*11))/2);


	/* Creates First Row */
	for(i=0; i<11; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*i+enemy_margin;
		all_enemies[i].y = 10;

		all_enemies[i].color = "#fff";
	}

	/* Creates Second Row */
	for(i=11; i<22; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-11)+enemy_margin;
		all_enemies[i].y = all_enemies[i].height+enemy_vertical_offset+10;
		all_enemies[i].sprite = Sprite("enemy_2");
		all_enemies[i].sprite_2 = Sprite("enemy_2_2");
	}

	/* Creates Third Row */
	for(i=22; i<33; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-22)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*2+10;
		all_enemies[i].sprite = Sprite("enemy_2");
		all_enemies[i].sprite_2 = Sprite("enemy_2_2");
	}

	/* Creates Fourth Row */
	for(i=33; i<44; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-33)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*3+10;
		all_enemies[i].sprite = Sprite("enemy_3");
		all_enemies[i].sprite_2 = Sprite("enemy_3_2");
	}

	/* Creates Fifth Row */
	for(i=44; i<55; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-44)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*4+10;
		all_enemies[i].sprite = Sprite("enemy_3");
		all_enemies[i].sprite_2 = Sprite("enemy_3_2");
	}
}


/*==================================================
ENEMY BULLETS
==================================================*/
function enemy_bullets(i){
	i.active = true;

	i.x_velocity = 0;
	i.y_velocity = i.speed;
	i.width = 3;
	i.height = 10;
	i.color = "#fff";

	i.inBounds = function() {
		return i.x >= 0 && i.x <= canvas_width && i.y >= 0 && i.y <= canvas_height;
	}

	i.draw = function() {
		canvas.fillStyle = this.color;
		canvas.fillRect(this.x, this.y, this.width, this.height);
	}

	i.update = function() {
		i.x += i.x_velocity;
		i.y += i.y_velocity;

		i.active = i.active && i.inBounds();
	}

	return i;
}


/*==================================================
MOVEMENT SOUNDS
==================================================*/
function move_sounds(){
	if(move_sound>4){
		move_sound=1;
	}

	if(move_sound==1){
		Sound.play("fastinvader1");
	}
	if(move_sound==2){
		Sound.play("fastinvader4");
	}
	if(move_sound==3){
		Sound.play("fastinvader2");
	}
	if(move_sound==4){
		Sound.play("fastinvader3");
	}
}


