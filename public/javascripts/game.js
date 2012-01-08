Game = {

  debug               : true,

  score               : 0,
  frustration         : 0,
  high_score          : 0,

  started             : false,
  paused              : true,
  ended               : false,
  muted               : false,

  touch_device        : (navigator.platform.indexOf("iPad") != -1),
  
  with_css3_animation : true,

  with_sound          : false,
  with_phonegap_sound : false,   // we use the phonegap sound library for iOS
  with_sm2_sound      : true,    // soundmanager2 is what we use for regular web presentation

  raw_sounds          : { 
        horns_short   : [
          "sounds/horn1.mp3",
          "sounds/horn2.mp3",
          "sounds/horn3.mp3",
          "sounds/horn4.mp3" 
        ],
        horns_long    : [
          "sounds/horn_long1.mp3",
          "sounds/horn_long2.mp3"
        ],
        horn_truck    : "sounds/horn_truck.mp3",
        countdown     : "sounds/countdown.mp3",
        theme         : "sounds/bg.mp3",
        explosion     : "sounds/explosion_short.mp3"
      },
  sounds              : {},
  
  streets             : [],
  barriers            : {},
  
  max_frustration     : 100,
  enable_frustration  : true,
  
  maker_freq          : 3000,
  max_cars_per_street : 1,
  car_types           : {
          car         : { type : 'car', width : 20, height : 35, frustrates_by : 1,
            colors    : [ 'orange' ]
          },
          jeepney     : { type : 'jeepney',   width : 20, height : 45, frustrates_by : 1.5 },
          van         : { type : 'van',       width : 20, height : 40, frustrates_by : 1.5 },
          bus         : { type : 'bus',       width : 20, height : 55, frustrates_by : 2   },
          ambulance   : { type : 'ambulance', width : 20, height : 40, frustrates_by : 5   }
        },
  
  db_name             : "gridlock",
  high_score_key      : "high_score",

  high_score_key_full : ["gridlock", "high_score"].join("_"),

  initialize : function(auto_start){
    
    jQuery.fx.interval = 50;

    // TODO: Add Loader somewhere here
    Game.initialize_canvas();

    Game.initialize_mobile_behaviours();

    Game.initialize_containers();
    
    Game.initialize_behaviours();

    Game.initialize_buttons();

    Game.initialize_sounds();

    Game.initialize_barriers();

    Game.initialize_streets();
    
    Game.initialize_controls();

    Game.initialize_high_score();

    if (auto_start===true) {
      Game.start();
    }

  },

  initialize_canvas : function(){
    
    window.requestAnimFrame = (function(callback){
      return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback){
        window.setTimeout(callback, 1000 / 60);
      };
    })();

    Game.canvas  = document.getElementById('cars');
    Game.context = Game.canvas.getContext('2d');
    
  },

  // this is the main animation function,
  // which calls the animate() function on all
  // the cars on all the streets
  animate : function() {
    //update
    
    //clear 
    Game.context.clearRect(0,0,Game.canvas.width, Game.canvas.height);

    _.each(Game.streets, function(street){
      _.each(street.cars, function(car){
        car.animate();
      });
    });

    if (Game.debug==true) {
      Game.show_barriers();  
    }

    //new frame
    requestAnimFrame(function(){
      Game.animate();  
    });
  },

  initialize_mobile_behaviours : function(){
    $("body, .screen").bind('touchmove',function(e){
      e.preventDefault();
    })
  },

  //TODO
  initialize_parameters : function(){
    document.location.hash.indexOf('nofrustration');
  },

  initialize_containers : function(){
    Game.intro           = $("#intro");
    Game.leaderboards    = $("#leaderboards");
    Game.main            = $("#game");
    Game.map             = $("#map");
    
    Game.credits         = $("#credits");
    Game.messages        = $("#messages");
    Game.score_cont      = $("#score");
    Game.frus_cont       = $("#frustration");
    Game.frus_bar        = $(".bar","#frustration");
    Game.high_score_cont = $(".high_score");
    Game.overlay         = $("#overlay").hide();
  },

  initialize_behaviours : function() {
    
    Game.intro.show();
    Game.main.hide();
    Game.credits.hide();
    Game.hide_message();
    Game.streets = [];
    Game.score = 0;
    Game.score_cont.text('0');
    //Game.initialize_frustration();
    Game.initialize_high_score();

    $(".restart").hide();
    $(".pause, .quit").addClass('disabled');

  },

  // phonegap function
  initialize_sounds : function() {
    if (Game.with_sound){
      if (Game.with_phonegap_sound && typeof Media!=="undefined") {

        _.each(Game.raw_sounds, function(media_or_arr, key){
          if (_.isArray(media_or_arr)) {
            _.each(media_or_arr, function(media, index){
              var new_k = [key, index].join("");
              Game.sounds[new_k] = new Media(media);
            });
          } else {
            Game.sounds[key] = new Media(media_or_arr);
          }          
        });
        
      } else if (Game.with_sm2_sound) {
        
        soundManager.waitForWindowLoad = true;

        soundManager.onready(function() {

          _.each(Game.raw_sounds, function(media_or_arr, key){
            
            if (_.isArray(media_or_arr)) {
              _.each(media_or_arr, function(media, index){
                var new_k = [key, index].join("");
                var new_obj = soundManager.createSound({ id : new_k, url : media, autoLoad : true });
                Game.sounds[new_k] = new_obj;
              });
            } else {
              Game.sounds[key] = soundManager.createSound({ id : key, url : media_or_arr, autoLoad : true });
            }
            
          });

        });

      }
    }
  },

  initialize_buttons : function(){
    
    $(".start_game").click(function(){
      Game.start();
    });

    $(".restart").click(function(){
      document.location.reload();
    });
    
    $(".pause").click(function(){
      if (!$(this).hasClass('disabled') && Game.started && !Game.paused && !Game.ended) {
        Game.pause();  
      }
    });

    $(".resume").click(function(){
      if (!$(this).hasClass('disabled') && Game.started && Game.paused && !Game.ended) {
        Game.resume();  
      }
    });

    $(".mute").click(function(){
      if (Game.muted) {
        Game.unmute();
      } else {
        Game.mute();
      }
    });

     $(".quit").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.quit();  
      }
    });

    $(".bttn.credits").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.show_credits();  
      }
    });

    $(".bttn.leaderboards").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.show_leaderboards();  
      }
    });

    $(".bttn.intro").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.show_intro();  
      }
    });
  },

  initialize_streets : function(){

    _.each( STREETS, function(street_data){
      var street = new Street();  
      street.initialize( Game, street_data );
      Game.streets.push( street );
    });
    
  },

  initialize_barriers : function(){
    
    var self  = this;

    _.each(BARRIERS, function(b){
      var t  = b[0].match(/^([^\s]+)\_barrier[\d]$/i),
        hash = {  name   : b[0],
                  top    : b[1], 
                  left   : b[2], 
                  width  : b[3], 
                  height : b[4], 
                  active : b[7], 
                  orientation : b[5],
                  intersection : b[6],
                  color : b[8] };

      if (Game.barriers[t[1]]) {
        Game.barriers[t[1]].push( hash );  
      } else {
        Game.barriers[t[1]] = [ hash ];
      }
    });

    console.log(Game.barriers);
  },

  show_barriers : function(){
    // temporary
    _.each(Game.streets, function(street){
      _.each(street.barriers, function(b){
        if (b.active) {
          Game.context.beginPath();
          Game.context.rect( b.left, b.top, b.width, b.height);
          Game.context.fillStyle = b.color;
          Game.context.fill();  
        }
      });
    });

  },

  initialize_high_score : function(){
    if ($.jStorage.storageAvailable()) {
      Game.high_score = $.jStorage.get(Game.high_score_key_full, 0);
      Game.high_score_cont.text( Game.high_score );
    }
  },

  store_high_score : function(new_score) {
    if (new_score>Game.high_score) {
      Game.high_score = new_score;
      $.jStorage.set( Game.high_score_key_full, new_score );
    }
  },

  show_intro : function() {
    Game.intro.show();
    Game.credits.hide();
    Game.leaderboards.hide();
    Game.main.hide();
  },

  show_credits : function() {
    Game.intro.hide();
    Game.credits.show();
    Game.leaderboards.hide();
    Game.main.hide();
  },

  show_leaderboards : function(){
    Game.intro.hide();
    Game.credits.hide();
    Game.leaderboards.show();
    Game.main.hide();
  },

  start : function(){
    Game.started = true;
    Game.paused  = true;
    Game.ended   = false;
    Game.intro.hide();
    Game.credits.hide();
    Game.leaderboards.hide();
    Game.main.show();
    Game.credits.hide();
    Game.start_countdown();
  },

  start_streets : function(){

    if (Game.with_sound) {
      Game.start_theme();
    }

    _.each(Game.streets,function(street){
      street.start();
    });

    Game.animate();

  },

  stop_streets : function(){

    _.each(Game.streets,function(street){
      street.stop();
    });
    
    Game.map.stopTime('intersecting');

  },

  control_all_barriers : function(value){
    _.each(Game.streets, function(street){
      _.each(street.barriers,function(barrier){
        barrier.active=value;
      });
    });
  },

  pause : function(){
    Game.paused = true;
    $("#overlay").show();
    $(".car").pause();
    if (Game.with_sound) {
      Game.stop_theme();
    }
  },

  resume : function() {
    Game.paused = false;
    $("#overlay").hide();
    $(".car").resume();
    if (Game.with_sound) {
      Game.start_theme();
    }
  },

  quit : function() {
    if (Game.with_sound) {
      Game.stop_theme();
    }

    document.location.reload();
  },

  mute : function(){
    $(".bttn.mute").addClass('muted').text('Un-mute');
    Game.with_sound = false;
    Game.muted = true;
    _.each(Game.sounds,function(media, key) {
      Game.sounds[key].stop();
    });
  },

  unmute : function(){
    $(".bttn.mute").removeClass('muted').text('Mute');
    Game.with_sound = true;
    Game.muted = false;
    if (Game.started) {
      Game.start_theme();
    }
  },

  start_theme : function(){
    if (Game.with_sm2_sound) {
      Game.sounds.theme.play({ loops : 99 });
    } else {
      Game.sounds.theme.play({ numberOfLoops : 99 });  
    }
  },

  stop_theme : function(){
    Game.sounds.theme.stop();
  },

  // if passed a callback, will delay for X seconds, then run it
  show_message : function(html, subtle) {
    
    Game.messages.html(html).show();
    if (subtle===true) {
      Game.messages.addClass("subtle");
    } else {
      Game.messages.removeClass("subtle");
    }
    Game.messages.animate({ opacity : 1 },200);
  },

  hide_message : function(){
    Game.messages.animate({ opacity : 0 }).hide();
  },

  start_countdown : function() {
    
    var int = 3;
    Game.messages.css({ display : 'block', opacity : 1 });

    if (Game.with_sound) {
      _.delay(function(){
        Game.sounds.countdown.play();    
      },1000);
    }

    Game.main.everyTime(1000,'countdown',function(){

      Game.messages.html("<h1 class='countdown'>" + int + "<h1>");
      
      if (int==0){
        $(".countdown").text("GO!");
      }

      if (int==-1) {
        $(this).stopTime('countdown');
        Game.started = true;
        Game.paused = false;
        Game.messages.hide();
        Game.start_streets();
        $(".pause, .quit").removeClass('disabled');
      } 

      int-=1;
      
    });
  },

  reset : function(return_to_intro){
    
    if (Game.with_sound) {
      Game.sounds.theme.stop();
    }

    Game.stop_streets();
    Game.frus_cont.stopTime('frustrating');

    $(".restart").show();

  },

  arrived : function() {
    Game.increment_score();
  },

  increment_score : function(){
    Game.score+=1;
    Game.score_cont.text(Game.score);
  },

  initialize_frustration : function(){

    Game.frustration = 0;
    
    Game.frus_bar.width(0);

    Game.frus_cont.
      stopTime('frustrating').
      everyTime(1000, 'frustrating', function(){
        Game.adjust_frustration();
        if (Game.frustration >= Game.max_frustration) {
          Game.end_with_frustration();
        }
      });
  },

  adjust_frustration : function(){
    var w = (Game.frustration/Game.max_frustration) * Game.frus_cont.innerWidth();
    Game.frus_bar.width(w);
  },

  initialize_controls : function(){
    
    var self = this;
    self.intersections = INTERSECTIONS;

    $(".stoplight").each(function(idx, el){
      
      var elem   = $(el),
          inter  = self.intersections[idx],
          click  = function(){
            if (Game.started) {
              if (elem.hasClass('horizontal')) {
                elem.removeClass('horizontal').addClass('vertical');
              } else {
                elem.addClass('horizontal').removeClass('vertical');
              }

              var new_orientation = elem.hasClass('horizontal') ? 'horizontal' : 'vertical';
              
              var barriers_to_activate   = inter[ new_orientation=='horizontal' ? 1 : 0 ],
                  barriers_to_deactivate = inter[ new_orientation=='horizontal' ? 0 : 1 ];

              _.each(Game.streets, function(street){
                _.each(street.barriers, function(street_barrier) {
                  if (_.include(barriers_to_activate, street_barrier.name)) {
                    street_barrier.active = true;
                    console.log('activating', street_barrier.name, street_barrier.active);
                  } else if (_.include(barriers_to_deactivate, street_barrier.name)) {
                    street_barrier.active = false;
                    console.log('deactivating', street_barrier.name, street_barrier.active);
                  }
                });
              });
            } 
          }
      
      elem.removeClass('vertical').addClass('horizontal');

      if (Game.touch_device) {
        elem.tappable(click);
      } else {
        elem.unbind('click').click(click);
      }

    });

  },

  end_with_frustration : function(){
    if (!Game.ended) {
      Game.started = false;
      Game.ended = true;
      Game.store_high_score(Game.score);
      Game.show_message("<h1>How Frustrating!</h1><p>Final Score: " + Game.score + "</p>");
      Game.reset();  
    }
  },

  end_with_collision : function( exploding_car ){
    if (!Game.ended) {
      Game.started = false;
      Game.ended = true;
      Game.generate_explosion( exploding_car );
      Game.store_high_score(Game.score);
      Game.show_message("<h1>Boom!</h1><p>Final Score: " + Game.score + "</p>");
      Game.reset();  
    }
  },

  generate_explosion : function( exploding_car ) {
    
    var off = exploding_car.dom.offset();
    
    $("<div class='explosion'></div>").css({
      top : off.top,
      left : off.left
    }).
    appendTo("#cars").
    oneTime(3000, function(){
      $(this).animate({ opacity : 0 });  
    });

    if (Game.with_sound) {
      Game.sounds.explosion.play();
    }
  },

};

var Street = function(){
  
  this.name            = 'amber_left';
  this.dom             = false;
  this.width           = 0;
  this.height          = 0;
  this.top             = 0;
  this.left            = 0;
  this.lanes           = 1;
  this.orientation     = 'horizontal';
  this.frustration     = 0;
  this.max_frustration = 30;
  this.gap             = 5;
  this.cars            = [];
  this.stopped         = false;
  this.jammed          = false;
  this.barriers        = [];
  this.intersections   = [];
  this.lefthand        = false;

  this.initialize    = function(game, street) {
    this.game        = Game;
    this.name        = street[0];
    
    this.lefthand    = this.name.indexOf('left')!==-1;
    this.orientation = street[1];
    this.top         = street[2];
    this.left        = street[3];
    this.width       = street[4];
    this.height      = street[5];
  
    this.maker       = new Maker(Game, this);

    this.initialize_barriers();
    // this.initialize_intersections();

  };

  this.initialize_barriers = function(){
    
    var self  = this,
        name  = self.name.replace(/\_lane[\d]/,'');

    self.barriers = Game.barriers[name] || [];  
    
  };

  this.initialize_intersections = function(){
    var self = this,
        css  = this.name.replace(/\_(left|right)_lane[\d]+$/,'');

    $(".intersection." + css).each(function(){
      var intersection = $(this);
      var intersection_hash = {
          top    : intersection.offset().top,
          left   : intersection.offset().left,
          width  : intersection.width(),
          height : intersection.height(),
          css    : intersection.attr('data-streets')
        };
      self.intersections.push( intersection_hash );
    });
    //console.log(self.intersections);
  };

  this.start = function(){
    //this.initialize_barriers();
    //this.initialize_intersections();
    this.maker.initialize(this);
  };

  this.stop = function(){
    var car_dom = $(".car." + this.name ).stopTime('frustrating').stopTime('driving');

    car_dom.remove();

    $(".frustration").remove();
    
    this.maker.stop();
  };

};

var Car = function(car_hash){
  
  this.width                 = car_hash && car_hash.width  ? car_hash.width  : 20;
  this.height                = car_hash && car_hash.height ? car_hash.height : 35;
  this.color                 = car_hash && car_hash.colors ? car_hash.colors[Math.floor(Math.random()*car_hash.colors.length)] : 'default';
  this.type                  = car_hash && car_hash.type ? car_hash.type : 'car';
  this.street                = false;
  this.moving                = false;
  this.frustration           = 0;
  this.frustrates_by         = car_hash && car_hash.frustrates_by ? car_hash.frustrates_by : 1; // rate of frustration
  this.frustration_checks    = 0;
  this.frustration_threshold = 3;
  this.frustration_level1    = 4;
  this.frustration_level2    = 5;
  this.speed                 = Math.round((Math.random()*1)+1); // pixels per frame
  this.polling_rate          = 50;
  this.polling_fast          = 50;
  this.polling_slow          = 500;
  this.at_intersection       = false;
  this.on_street             = false;
  this.orientation           = 'horizontal';
  this.lefthand              = false;
  this.origins               = {}; // top, left
  this.current_pos           = {}; // top, left
  this.destinations          = {}; // top, left
  this.travel_time           = 0; 
  // travel time is the time in seconds it would take the car to travel from 
  // origin to destination, assuming the road was completely open, multiplied by 2.
  // the closer we approach the travel_time, the more frustrated the car driver becomes.

  this.initialize = function(name, street, orientation){
    
    this.name         = name;
    this.game         = Game;
    this.street       = street;
    this.moving       = true;
    this.orientation  = orientation;
    this.lefthand     = street.lefthand;
    
    this.flip_dimensions(this.width, this.height);
    
    //this.initialize_speed();
    this.initialize_origins(); 

    var colors = ["#c00","#009","#360","#f60","#ff0"];
    this.color = colors[Math.floor(Math.random()*colors.length)];

    this.render();
    // this.initialize_frustration();

    // the leader is the car directly in front of this current car.
    // on a two-lane street, we have to check the two older cars, just
    // to make sure we're not colliding with either one

    //console.log('length', this.street.cars.length);
    if (this.street.cars.length > 1) {
      var idx = this.street.cars.indexOf(this);
      //console.log('this index', idx);
      if (leader = this.street.cars[ idx-1 ]) {
        this.leader = leader; 
      }
      
    } else {
      this.leader = false;
    }

  };

  this.flip_dimensions = function(w, h){
    if (this.orientation=='horizontal') {
      this.width  = h;
      this.height = w;
    }
  };

  this.initialize_origins = function(){
    if (this.orientation == 'horizontal') {
      
      var a1 = this.street.left - 100,
          a2 = Game.map.width() + 100,
          b1 = this.street.top + (Math.random() > 0.5 ? -1 : 1);

      if (this.lefthand) {
        this.origins.left = a2;
        this.current_pos.left = a2;
        this.destinations.left = a1;
      } else {
        this.origins.left = a1;
        this.current_pos.left = a1;
        this.destinations.left = a2;  
      }
      
      this.origins.top = this.current_pos.top = this.destinations.top = b1;

      this.travel_time = (Math.abs(this.destinations.left-this.origins.left)/this.speed)*2;

    } else {

      var a1 = this.street.top - 100,
          a2 = Game.map.height() + 100,
          b1 = this.street.left + (Math.random() > 0.5 ? -1 : 1);

      if (this.lefthand) {
        this.origins.top = a1;
        this.current_pos.top = a1;
        this.destinations.top = a2;
      } else {
        this.origins.top = a2;
        this.current_pos.top = a2;
        this.destinations.top = a1;  
      }
      
      this.destinations.left = this.current_pos.left = this.origins.left = b1;

      this.travel_time = Math.ceil((Math.abs(this.destinations.top-this.origins.top)/this.speed)*2);

    }

  };

  this.initialize_frustration = function(){
    
    var self = this;
    
    self.dom.
      stopTime('frustrating').
      everyTime( (self.travel_time/5)*1000, 'frustrating', function(){
      
        if (Game.paused!==true) {
          self.frustration_checks+=1;
        
          if (self.frustration_checks>self.frustration_threshold) {
            self.frustration+=self.frustrates_by;
            Game.frustration+=self.frustrates_by;  
          }

          if (self.frustration == self.frustration_level1) {
            self.dom.addClass('frustrated');
            self.add_frustration_cloud();
            if (Game.with_sound && (Math.random()*5 > 3)) {
              var horn_name = 'horns_short' + (Math.floor(Math.random()*Game.raw_sounds.horns_short.length));
              Game.sounds[horn_name].play();
            }
            
          } else if (self.frustration >= self.frustration_level2) {
            self.dom.addClass('very_frustrated');
            self.add_frustration_cloud(true);
            if (Game.with_sound) {
              var horn_name = 'horns_long' + (Math.floor(Math.random()*Game.raw_sounds.horns_long.length));
              Game.sounds[horn_name].play();
            }
            
          }
        }
        
      });

  };

  this.add_frustration_cloud = function(very){
    if (!this.moving) {

      var top = this.orientation=='horizontal' ? 
        this.dom.offset().top : 
        ( this.lefthand ? (this.dom.offset().top + this.dom.height()) - 15 : this.dom.offset().top - 15 ); 

      var left = this.orientation=='horizontal' ?
        ( this.lefthand ? this.dom.offset().left - 15 : (this.dom.offset().left + this.dom.width()) - 15 ) : 
        this.dom.offset().left;

      var cloud = $("<div class='frustration'></div>").
        css({ top : top, left : left }).
        attr('data-car-name',this.name).
        appendTo('#cars');
      if (very===true) {
        cloud.addClass('very');
      }
    }
  };

  this.remove_frustration_cloud = function(){
    $(".frustration[data-car-name='" + this.name + "']").remove();
  };

  this.render = function(left, top){
    
    var self   = this,
        street = self.street,
        ctx    = Game.context;
  
    ctx.beginPath();

    ctx.rect( self.current_pos.left, 
            self.current_pos.top, 
            self.width, 
            self.height );

    ctx.fillStyle = this.color;
    ctx.fill();

  };

  this.animate = function(){
    
    this.drive();
    this.render(); 

  };

  this.go = function(){
    
    var self = this,
       speed = self.calculate_speed();

    self.moving = true;
    //self.remove_frustration_cloud();

  };

  this.stop = function(){
    var self = this;

    // if (Game.with_css3_animation===true) {
    //   self.dom.css3animate({
    //       top  : self.dom.offset().top, 
    //       left : self.dom.offset().left 
    //     }, 0);
    // } else {
    //   self.dom.stop();  
    // }
    
    self.moving = false;
    
    // if the car is stopped at a light, we restart the polling, but slower this time.  
    // we maintain the high polling rate if the car is 'intersecting' though, i.e.,
    // stuck in the middle of an intersection
    // if (!self.dom.hasClass('intersecting')) {
    //   self.polling_rate = self.polling_slow;
    //   self.dom.stopTime('driving');
    //   self.restart();
    // }

  };

  this.calculate_speed = function(){
    var self = this;
    if (this.orientation==='horizontal') {
      if (this.lefthand) {
        var speed = (this.dom.offset().left/this.speed)*1000;
      } else {
        var speed = ((Game.map.width() - this.dom.offset().left)/this.speed)*1000;  
      }
      
    } else {
      if (this.lefthand) {
        var speed = ((Game.map.height() - this.dom.offset().top)/this.speed)*1000;
      } else {
        var speed = (this.dom.offset().top/this.speed)*1000;
      }
    }
    //console.log('calculating speed', this.dom.offset().top, this.speed, speed);
    return speed;
  };

  this.restart = function(reset_polling) {
    
    var self = this;
    if (reset_polling===true) { self.polling_rate = this.polling_fast; }
    self.dom.stopTime('driving').everyTime( self.polling_rate, 'driving', function(){ self.drive(); });

  };

  // we need to check for passive collisions with leader cars (i.e., the car in front of this one),
  // and barriers. in both cases this car will just stop. if the leader car starts moving or the barrier
  // is raised, the car starts moving again.
  // there are also active collisions within the intersection bounding box, where cars from perpendicular
  // streets may overlap with the current car's path. this is a game-ending situation in all cases.
  this.is_colliding = function(){
    
    var self1 = [this.current_pos.left, this.current_pos.left + this.width],
        self2 = [this.current_pos.top,  this.current_pos.top + this.height];
    
    if (this.is_at_barrier(self1, self2)) {
      return 'barrier';
    } else if (leader = this.is_following(self1, self2)) {
      return leader;
    }

    // if (intersection = this.is_at_intersection(self1, self2)) {
    //   if (collision = this.is_colliding_at_intersection(intersection, self1, self2)){
    //     return collision;
    //   }

    // } else if (leader = this.is_following(self1, self2)) {
    //   return leader;

    // } else if (this.is_at_barrier(self1, self2)) {
    //   return 'barrier';  

    // }

    return false;

  };

  this.is_following = function(self1, self2) {
    if (this.street.cars.length > 1) {
      if (index = this.street.cars.indexOf(this)) {
        for (var i=index-1; i >= 0; i--) {
          
          var leader = this.street.cars[i],
              p1     = [leader.current_pos.left, leader.current_pos.left + this.leader.width],
              p2     = [leader.current_pos.top,  leader.current_pos.top  + this.leader.height];
          
          var horiz_match = this.compare_positions( self1, p1 ),
              vert_match  = this.compare_positions( self2, p2 );
      
          if (horiz_match && vert_match) { return leader; }  
          
        }    
      }
      
    }
    
    return false;

    // if (this.leader) {  
    //   var leader = this.leader,
    //       p1     = [leader.current_pos.left, leader.current_pos.left + this.leader.width],
    //       p2     = [leader.current_pos.top,  leader.current_pos.top  + this.leader];
    //   var horiz_match = this.compare_positions( self1, p1 ),
    //       vert_match  = this.compare_positions( self2, p2 );
    //   if (horiz_match && vert_match) { return leader; }  
    // }

  };

  this.is_at_barrier = function(self1, self2) {
    if (this.street.barriers.length) {
      for (var i=0;i<this.street.barriers.length;i++) {
        if (this.street.barriers[i].active) {

          var b1 = [this.street.barriers[i].left, this.street.barriers[i].left + this.street.barriers[i].width],
              b2 = [this.street.barriers[i].top, this.street.barriers[i].top + this.street.barriers[i].height];
          
          var horiz_match = this.compare_positions( self1, b1 ),
              vert_match  = this.compare_positions( self2, b2 );
          
          if (horiz_match && vert_match) { return true; } 
        }
      }
    }
    return false;
  };

  this.is_at_intersection = function(self1, self2) {
    if (this.street.intersections.length) {
      //console.log('intersections',this.street.intersections);
      var offset = this.dom.offset();
      for (var i=0; i<this.street.intersections.length; i++) {
        var intersection = this.street.intersections[i];
        var b1 = [intersection.left, intersection.left + intersection.width  ],
            b2 = [intersection.top,  intersection.top +  intersection.height ];
            
          var horiz_match = this.compare_positions( self1, b1 ),
              vert_match  = this.compare_positions( self2, b2 );
          
          if (horiz_match && vert_match) { 
            this.dom.addClass('intersecting ' + intersection.css);
            return intersection.css; 
          } else {
            this.dom.removeClass('intersecting ' + intersection.css);  
          }
      }
    }
  };

  this.is_colliding_at_intersection = function(intersection, self1, self2) {
    var self = this;
    var classes = intersection.split(' ');
    classes.push('intersecting');
    classes.push(this.orientation=='horizontal' ? 'vertical' : 'horizontal');

    var potential_collisions = $("." + classes.join('.'));
    
    if (potential_collisions.length) {
      var collision = false;
      //console.log(potential_collisions);
      $("." + classes.join('.')).each(function(){
        var c     = $(this),
            c_off = c.offset(),
            c1    = [ c_off.left, c_off.left + c.width() ],
            c2    = [ c_off.top,  c_off.top + c.height() ];

        var horiz_match = self.compare_positions( self1, c1 ),
            vert_match  = self.compare_positions( self2, c2 );
        
        if (horiz_match && vert_match){
          collision = c;
        }
      });

      return collision;
    }
  };

  this.compare_positions = function(p1, p2){
    var x1 = p1[0] < p2[0] ? p1 : p2;
    var x2 = p1[0] < p2[0] ? p2 : p1;
    return x1[1] > x2[0] || x1[0] === x2[0] ? true : false;
  };

  this.drive = function(){
    var self = this;
    
    var leader_or_collision_or_barrier = self.is_colliding();

    if (leader_or_collision_or_barrier) {
      
      if (leader_or_collision_or_barrier==='barrier') {
        self.moving = false;

      } else if (typeof leader_or_collision_or_barrier==='object') {
        self.moving = false;
        
      } else if (leader_or_collision_or_barrier==='collision') {
        self.moving = false;
        Game.end_with_collision( self );

      }
    } else {
      
      if (self.orientation=='horizontal') {
        if (self.lefthand) {
          self.current_pos.left-=self.speed;  
        } else {
          self.current_pos.left+=self.speed;    
        }
      } else {
        if (self.lefthand) {
          self.current_pos.top+=self.speed;  
        } else {
          self.current_pos.top-=self.speed;    
        }
      }
  

      if (self.has_arrived()) {
        self.arrived();
      }

    }
    
  };

  this.has_arrived = function(){
    var self = this;
    if (self.orientation=='horizontal') {
      if (self.lefthand){ 
        return self.current_pos.left <= self.destinations.left + self.width;
      } else {
        return self.destinations.left - self.width <= self.current_pos.left;
      }
    } else {
      if (self.lefthand) {
        return self.current_pos.top >= self.destinations.top;
      } else {
        return self.current_pos.top <= self.destinations.top;
      }
    }
  };

  this.friendly = function(other_car) {
    return true;
  };

  this.arrived = function(){
    
    var idx = this.street.cars.indexOf(this);
    
    if (follower = this.street.cars[(idx+1)]) {
      follower.leader = false;
    }

    this.street.cars.splice(idx,1);

    Game.frustration -= this.frustration;
    Game.arrived( this );
  };

};

var Maker = function(){
  
  this.initialize   = function(street) {
 
    var self        = this;
    self.street     = street;
    self.frequency  = Math.round(Game.maker_freq + (Math.random()*3000));
    self.max_cars   = Game.max_cars_per_street;
    self.iterations = 0;
    self.car_types  = Game.car_types;
    self.car_odds   = { 'jeepney' : 0.15, 'bus' : 0.04, 'ambulance' : 0.01 };

    //debugger;
    
    // self.make();

    _.delay(function(){
      
      self.timer = window.setInterval(function(){ self.make(); }, self.frequency);
      
      self.make();

    }, (1 + Math.round(Math.random()*8))*1000);

  };

  this.generate = function(){
    var self = this,
        rand = Math.random();
    
    if (rand < self.car_odds.ambulance) {
      return self.car_types.ambulance;
    } else if (rand < self.car_odds.bus) {
      return self.car_types.bus;
    } else if (rand < self.car_odds.jeepney) {
      return self.car_types.jeepney;
    } else {
      return self.car_types.car;
    }
    
  };

  this.make = function(){

    var self = this;
    
    if (Game.paused!==true) {
      if (self.street.cars.length < Game.max_cars_per_street) {
        self.build_car(0);
      }  
    }
    
    //   if (Math.random() > 0.5 && self.street.cars.length < Game.max_cars_per_street) {
    //     self.iterations+=1;
    //     for (var i=0; i < num_cars; i++) {
    //       self.build_car(i);
    //     }
    //   }

  };

  this.build_car = function(i){
    var self     = this,
        car_hash = self.generate(),
        car_name = [self.street.name, self.iterations, i].join("-"),
        car      = new Car(car_hash);
    
    self.street.cars.push( car ); 

    car.initialize(car_name, self.street, self.street.orientation);

  };

  this.stop = function(){
    this.street.dom.stopTime('making');
    this.iterations = 0;
  };

};
