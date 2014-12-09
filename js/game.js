/*==================================================
BUILD CANVAS
==================================================*/

var canvas_width = 920;
var canvas_height = 742;

var canvas_element = $("<canvas width='" + canvas_width + "' height='" + canvas_height + "'></canvas>");
var canvas = canvas_element.get(0).getContext("2d");
canvas_element.appendTo('#playable_area');

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
var all_bunker_sections = [];
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
var current_level = 0;
var enemy_movement = 900-(100*current_level);
var total_points = 0;
var pause_game = false;
var highscore_name = '';
var show_score_screen = false;
var highscores = [];


/*==================================================
GAME LOOP
==================================================*/
var fps = 30;
var game_running = true;

$(document.body).on('keydown', function(e) {
	e.preventDefault();
});

setInterval(function(){
	update();
	draw();
	update_score();
}, 1000/fps);

var enemy_mover = setInterval(function(){
	if(game_running){
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
	}
}, enemy_movement);



/*==================================================
UPDATE GAME
==================================================*/
function update(){
	if(game_running){
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

	  	all_bunker_sections = all_bunker_sections.filter(function(bunker) {
	    	return bunker.active;
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

	  	if(all_enemies.length==0){
	  		reset_game();
	  	}
  	}
}


/*==================================================
GAME LOOP
==================================================*/
function endgame(){
	game_running = false;
	Sound.play("explosion");
	current_level = 0;

	setTimeout(function(){
		highscore_screen();
		//reset_game();
		//total_points = 0;
	},1000);
}


/*==================================================
HIGHSCORE SCREEN
==================================================*/
function highscore_screen(){
	canvas.fillStyle = game_background;
	canvas.fillRect(0, 0, canvas_width, canvas_height);
	pause_game=true;

	$(document.body).bind('keydown', function(e) {
		e.preventDefault();
		if(highscore_name.length > 0){
			if(e.keyCode==8){
				highscore_name=highscore_name.slice(0,-1)
			}
		}
		if(highscore_name.length <= 2){
			highscore_name += getKey(e);
		}
		if(show_score_screen){
			if(e.keyCode==13){
				total_points = 0;
				reset_game();
			}
		}
		else {
			if(e.keyCode==13){
				submit_highscore();
			}
		}
	});
}

function submit_highscore(){
	$.ajax({
		url: 'https://docs.google.com/forms/d/1FtRvGyBGIkbwUkAjKWsDVuwoD8LqPFTiBA5GcP1xpOE/formResponse',
		data: {"entry.1853689493" : highscore_name, "entry.1611809266" : total_points},
		type: 'POST',
		dataType: 'xml',
		statusCode: {
			0: function(){
				console.log('Success 0');
				show_highscores();
			},
			200: function(){
				console.log('Success 200');
				show_highscores();
			}
		}
	});
}

function show_highscores(){
	var names = [];
	$.ajax({
		url: 'https://spreadsheets.google.com/feeds/list/0Ah2-a5OmIB_pdFdwVzZUeUNWZ2kxb29qdlNoY1lKdWc/od6/public/basic?alt=json-in-script&callback=?',
		type: 'get',
		dataType: 'jsonp',
		success: function(json){
			console.log(json);
			for (i = 0; i < json.feed.entry.length; i++)
			{
				entry = json.feed.entry[i];
				var highscores_string = entry.content.$t;

				var split_highscores = highscores_string.split('highscore: ');
				var split_names = split_highscores[0].replace('name: ','').replace(', ','');
				split_highscores = split_highscores[1]


				highscores.push({"name":split_names,"score":split_highscores});
			}
			show_scores();
		}
	});

	function show_scores(){
		highscores.push({"name": highscore_name,"score":total_points});
		highscores.sort(function(a, b) {
		    return (a.name - b.name);
		}).sort(function(a, b) {
		    return (b.score - a.score);
		});

		show_score_screen = true;

		console.log(highscores);
	}
}

function draw_highscore(){
	canvas.font = "48pt Arial";
	canvas.textAlign = 'center';
	canvas.fillStyle = '#00ff00';
	canvas.fillText('Highscore '+total_points+' points', canvas_width/2, 100);

	canvas.font = "32pt Arial";
	canvas.textAlign = 'center';
	canvas.fillStyle = '#fff';
	canvas.fillText('Enter Your Name', canvas_width/2, 200);

	canvas.font = "32pt Arial";
	canvas.textAlign = 'center';
	canvas.fillStyle = '#fff';
	canvas.fillText(highscore_name, canvas_width/2, 300);
}


function draw_scores(){
	canvas.font = "36pt Arial";
	canvas.textAlign = 'center';
	canvas.fillStyle = '#fff';
	canvas.fillText('Highscores', canvas_width/2, 100);
	for(i=0;i<10;i++){
		canvas.font = "18pt monospace";
		canvas.textAlign = 'center';
		canvas.fillStyle = '#fff';
		canvas.fillText(i+1 + ' ' + highscores[i]['name'] + '   ' + highscores[i].score, canvas_width/2, 180+(i*30));
	}

	canvas.font = "26pt Arial";
	canvas.textAlign = 'center';
	canvas.fillStyle = '#fff';
	canvas.fillText('Press Enter To Continue', canvas_width/2, 600);
}


/*==================================================
UPDATE SCORE
==================================================*/
function update_score(){
	canvas.font = "16pt Arial";
	canvas.textAlign = 'right';
	canvas.fillStyle = '#00ff00';
	canvas.fillText('Score: ' + total_points, canvas_width-10, 30, 300);
}


/*==================================================
RESET GAME
==================================================*/
function reset_game(){
	all_player_bullets = [];
	all_enemies = [];
	all_bunkers = [];
	all_bunker_sections = [];
	all_enemy_bullets = [];
	created_bunkers = false;
	created_enemies = false;
	delay_bullet = false;
	reverse_direction = false;
	enemy_y_offset = 0;
	enemy_speed = 8;
	enemy_moves = 6;
	move_sound = 0;
	player.active = true;
	current_level += 1;
	enemy_movement = 900-(100*current_level);
	pause_game = false;
	highscore_name = '';
	show_score_screen = false;
	highscores = [];
	reset_enemy_movement();
	console.log(current_level);
	setTimeout(function(){
		game_running = true;
		$(document.body).unbind("keydown");
	},200);
}


/*==================================================
DRAW GAME
==================================================*/
function draw(){
	canvas.fillStyle = game_background;
	canvas.fillRect(0, 0, canvas_width, canvas_height);

	if(pause_game==false){
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

	  	all_bunker_sections.forEach(function(bunker_section){
	  		bunker_section.draw();
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
  	else {
  		if(show_score_screen){
  			draw_scores();
  		}
  		else {
  			draw_highscore();
  		}
  	}
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
	active: true,
	color: '#00ff00',
	x: 0,
	y: 0,
	width: 60,
	height: 32,
	speed: 10
}

player.x = canvas_midpoint.x - (player.width/2);
player.y = canvas_height - player.height - 10;

player.sprite = Sprite("player");
player.sprite_death = Sprite("player_death1");

player.draw = function() {
	if(player.active){
		this.sprite.draw(canvas, this.x, this.y);
	}
	else {
		this.sprite_death.draw(canvas, this.x, this.y);
	}
}

player.shoot = function() {
	if(delay_bullet==false){
		var bullet_position = this.midpoint();
		if(all_player_bullets.length < 1){
			Sound.play("shoot");
			all_player_bullets.push(player_bullets({
				speed: 30,
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

player.death = function(){
	player.active = false;
	endgame();
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

	i.init = function(){
		for(i=0; i<12; i++){
			var bunker_section_image = 1;
			if(i==0){bunker_section_image=2}
			if(i==3){bunker_section_image=3}
			if(i==5){bunker_section_image=4}
			if(i==6){bunker_section_image=5}

			var current_top = this.y;
			var current_left = this.x;
			if(i>=4 && i<8){
				current_top = this.y+24;
			}
			else if(i>=8){
				current_top = this.y+48;
			}
			if(i<4){
				current_left = this.x+(24*i);
			}
			else if(i>=4 && i<8) {
				current_left = this.x+(24*(i-4));
			}
			else {
				current_left = this.x+(24*(i-8));
			}
			if(i!= 9 && i!=10){
				all_bunker_sections.push(bunker_sections({
					x: current_left,
					y: current_top,
					width: 24,
					height: 24,
					bunker_section: bunker_section_image
				}));
			}
		}
	}

	i.draw = function() {
		//this.sprite.draw(canvas, this.x, this.y);
		//canvas.strokeStyle = '#ff0000';
		//canvas.strokeRect(this.x, this.y, 32, 36);

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

		all_bunkers[i].init();
	}
}


/*==================================================
BUNKER SECTIONS
==================================================*/
function bunker_sections(i){
	i.active = true;

	i.color = "#1aff03"
	i.health = 100;
	i.sprite_inside = Sprite("bunker_inside");
	i.sprite_topleft = Sprite("bunker_topleft");
	i.sprite_topright = Sprite("bunker_topright");
	i.sprite_middleleft = Sprite("bunker_middleleft");
	i.sprite_middleright = Sprite("bunker_middleright");
	i.sprite_25 = Sprite("damage_25");
	i.sprite_50 = Sprite("damage_50");
	i.sprite_75 = Sprite("damage_75");

	i.hit = function(damage) {
		this.health-=damage;
		if(this.health<=0){
			this.active = false;
		}
	}

	i.draw = function(){
		if(this.health!=0){
			switch (this.bunker_section){
				case 1:
					this.sprite_inside.draw(canvas, this.x, this.y);
					break;
				case 2:
					this.sprite_topleft.draw(canvas, this.x, this.y);
					break;
				case 3:
					this.sprite_topright.draw(canvas, this.x, this.y);
					break;
				case 4:
					this.sprite_middleleft.draw(canvas, this.x, this.y);
					break;
				case 5:
					this.sprite_middleright.draw(canvas, this.x, this.y);
					break;
			}
		}
		switch (this.health){
			case 75:
				this.sprite_25.draw(canvas, this.x, this.y);
				break;
			case 50:
				this.sprite_50.draw(canvas, this.x, this.y);
				break;
			case 25:
				this.sprite_75.draw(canvas, this.x, this.y);
				break;
		}
	}

	return i;
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
	}, 200);
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
		all_bunker_sections.forEach(function(bunker) {
			if (collides(bullet, bunker)) {
				bullet.active = false;
				bunker.hit(25);
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
					var points_to_collect = enemy.points;
					total_points += points_to_collect;
					enemy.active = false;
				}, 400);
			}
		});
	});

	all_enemy_bullets.forEach(function(bullet) {
		all_bunker_sections.forEach(function(bunker){
			if (collides(bullet, bunker)) {
				bullet.active = false;
				bunker.hit(25);
			}
		});
	});

	all_enemy_bullets.forEach(function(bullet) {
		if (collides(bullet, player)) {
			bullet.active = false;
			player.death();
		}
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
	
	enemy_movement-=150;
	if(enemy_movement<100){
		enemy_movement=50;
	}

	reset_enemy_movement();
}

function reset_enemy_movement(){
	clearInterval(enemy_mover);
	
	enemy_mover = setInterval(function(){
		if(game_running){
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
		}
	}, enemy_movement);
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
		all_enemies[i].y = 48;

		all_enemies[i].color = "#fff";
		all_enemies[i].points = 30;
	}

	/* Creates Second Row */
	for(i=11; i<22; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-11)+enemy_margin;
		all_enemies[i].y = all_enemies[i].height+enemy_vertical_offset+48;
		all_enemies[i].sprite = Sprite("enemy_2");
		all_enemies[i].sprite_2 = Sprite("enemy_2_2");
		all_enemies[i].points = 20;
	}

	/* Creates Third Row */
	for(i=22; i<33; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-22)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*2+48;
		all_enemies[i].sprite = Sprite("enemy_2");
		all_enemies[i].sprite_2 = Sprite("enemy_2_2");
		all_enemies[i].points = 20;
	}

	/* Creates Fourth Row */
	for(i=33; i<44; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-33)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*3+48;
		all_enemies[i].sprite = Sprite("enemy_3");
		all_enemies[i].sprite_2 = Sprite("enemy_3_2");
		all_enemies[i].points = 10;
	}

	/* Creates Fifth Row */
	for(i=44; i<55; i++){
		all_enemies.push(enemies());
		all_enemies[i].x = (all_enemies[i].width+enemy_offset)*(i-44)+enemy_margin;
		all_enemies[i].y = (all_enemies[i].height+enemy_vertical_offset)*4+48;
		all_enemies[i].sprite = Sprite("enemy_3");
		all_enemies[i].sprite_2 = Sprite("enemy_3_2");
		all_enemies[i].points = 10;
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


