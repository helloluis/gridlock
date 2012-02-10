Game = {

  debug                : false,  // set to TRUE to visualize barriers and intersections
  debug_cont           : false,
  debug_visually       : false,
   
  loader               : false,
  
  enable_preloading    : PLATFORM=='web' || PLATFORM=='pokki',

  is_iOS               : PLATFORM=='ios', 
  is_pokki             : PLATFORM=='pokki',
  is_web               : PLATFORM=='web',

  score                : 0,
  frustration          : 0,
  high_score           : 0,

  frames               : 0,    // global frame counter, don't really know what for yet

  seconds              : 0,    // global timer, in seconds, so only increments once every 1000 millisec

  difficulty_increases : true, // if set to false, we don't make the game harder as time goes on
  smart_intersections  : true, // if set to true, cars that get barrier-ed at an intersection will keep on moving forward
  double_buffering     : true, // if set to true, we create a virtual canvas where we draw everything first, then copy it on to the actual canvas when the final image is ready
  with_bosses          : true, // enable level bosses

  width                : MAP_WIDTH,
  height               : MAP_HEIGHT,

  enable_tutorial      : true,
   
  fps                  : FPS,
  timer                : 0,
  
  show_timer           : true,

  speed                : 1,     // the global speed of the Game can be modified by the user so all events occur faster

  started              : false,
  paused               : true,
  ended                : false,
  muted                : false,
 
  can_adjust_speed     : false,  // clicking or swiping on a car will increase its speed (UNDER CONSTRUCTION)
 
  streets              : [],     // array of Street objects
  barriers             : {},     // hash of barrier hitboxes
  intersections        : [],     // array of intersection hitboxes
   
  max_speed            : MAX_SPEED,
  max_frustration      : 100,
  enable_frustration   : true,
   
  maker_freq           : MAKER_FREQUENCY,                  // how often does a Maker add a new car to the road
  max_cars_per_street  : MAX_CARS_PER_STREET,              
  car_types            : CARS,                             // library of car settings and assets
  car_odds             : CAR_ODDS,                         // the likelihood that a particular car will be added
  car_odd_levels       : CAR_ODD_LEVELS.reverse(),         // modifiers for our car-creation randomness, basically making fewer cars spawn early on in the game
  neighborhood         : NEIGHBORHOOD,                     // graphics used for the neighborhood layers
          
  images_dir           : IMAGES_DIR,                       // path to images
  sounds_dir           : SOUNDS_DIR,                       // path to sounds
          
  is_critical          : false,                            // if traffic condition is critical, we overlay the scary red borders on the screen
  critical_cars        : [],                               // cars that are about to end the game
          
  show_arrived_score   : true,                             // show a little floating +score for every arrived car

  // cache of the images representing various levels of vehicular frustration
  frustration_assets   : [],

  collision_messages   : COLLISION_MESSAGES,
  frustration_messages : FRUSTRATION_MESSAGES,

  is_fullscreen        : false, // only works with pokki platform

  touch_device         : (navigator.platform.indexOf("iPad") != -1), // is this a desktop browser or an iPad?
   
  with_sound           : true,    // globally disable all sound
  with_phonegap_sound  : false,   // we use the Phonegap sound library for iOS
  with_sm2_sound       : false,   // SoundManager2 is what we use for regular web presentation
  with_soundjs         : true,    // SoundJS, for Pokki build

  sound_format         : "." + SOUND_FORMATS[PLATFORM],
 
  raw_sounds           : SOUNDS,  // our library of sounds
  sounds               : {},

  // sometimes we want to defer rendering on some items 
  // until all of the cars have been rendered, e.g., the frustration indicators
  deferred_renders     : [], 

  db_name              : "traffix",
  high_score_key       : "high_score",

  high_score_key_full  : ["traffix", MAP_NAME, "high_score"].join("_"),

  preload : function(auto_start){

    Game.dom = $("#game");
    
    Game.debug_cont = $("#debugger");

    if (!Game.debug_visually) { Game.debug_cont.hide(); }

    Game.loader = new PxLoader();

    Game.loading_screen = $("#loader");

    var loader_percentage = $(".loading_percentage", Game.loading_screen);

    Game.log("enable_preloading?", Game.enable_preloading);

    if (Game.enable_preloading) {
      
      _.each(Game.car_types, function(car){
        _.each(_.flatten(car.assets),function(fc){
          var img = new PxLoaderImage(Game.images_dir + fc);
          Game.loader.add(img);
        });
      });

      _.each(Game.neighborhood, function(n){
        var img = new PxLoaderImage(Game.images_dir + n);
          Game.loader.add(img);
      });

      _.each(FRUSTRATIONS, function(f){
        var img = new PxLoaderImage(Game.images_dir + f[0]);
          Game.loader.add(img);
      });

      _.each(OTHERS, function(o){
        var img = new PxLoaderImage(Game.images_dir + o);
        Game.loader.add(img);
      }); 

      _.each(BOSSES, function(b){
        _.each(b.assets,function(ba){
          var img = new PxLoaderImage(Game.images_dir + ba);
          Game.loader.add(img);
        });
      });

      loader_percentage.text("0%");

      Game.loader.addProgressListener(function(e) { 
        var percentage = Math.round((e.completedCount/e.totalCount)*100);
        loader_percentage.text( percentage + "%" );
      });

      if (Game.with_sm2_sound) {
      
        soundManager.onready(function() {

          _.each(Game.raw_sounds, function(media_or_arr, key){
            
            if (_.isArray(media_or_arr)) {
              _.each(media_or_arr, function(media, index){
                var new_k = [key, index].join("");
                Game.sounds[new_k] = Game.loader.addSound( new_k, Game.sounds_dir + media + Game.sound_format );
              });
            } else {
              Game.sounds[key] = Game.loader.addSound( key, Game.sounds_dir + media_or_arr + Game.sound_format );
            }
            
          });

        });

      } else if (Game.with_soundjs) {
        
        var sounds_to_load = [];

        _.each(Game.raw_sounds, function(media_or_arr, key){
          if (_.isArray(media_or_arr)) {

            _.each(media_or_arr, function(media, index){
              
              var new_k = [key, index].join(""),
                  src = Game.sounds_dir + media + Game.sound_format;

              Game.sounds[new_k] = src;
              sounds_to_load.push({ name : new_k, src : src, instances : 3 });
              
            });

          } else {

            var src = Game.sounds_dir + media_or_arr + Game.sound_format;
            Game.sounds[key] = src;
            sounds_to_load.push({ name : key, src : src, instances : key=='arrived' ? 4 : 1 });

          }
        });

        SoundJS.addBatch(sounds_to_load);

        SoundJS.onLoadQueueComplete = function(){
          setTimeout(function(){ myVar = SoundJS.play("horns_short1", SoundJS.INTERUPT_ANY)}, 3000);
        };
          
      }

      TraffixLoader.initialize();
      
      Game.loader.addCompletionListener(function(){
        TraffixLoader.stop();
        Game.initialize(auto_start);
      });

      _.delay(function(){
        Game.loader.start();  
      }, 1000);

    } else {
      
      Game.initialize(auto_start);

    }

  },

  initialize : function(auto_start){
    
    jQuery.fx.interval = 50;

    Game.initialize_fullscreen();

    Game.initialize_parameters();

    Game.initialize_animation_frame();

    Game.initialize_menus();

    Game.initialize_canvas();

    Game.initialize_mobile_behaviours();

    Game.initialize_containers();
    
    Game.initialize_behaviours();

    Game.initialize_buttons();

    Game.initialize_bosses();

    Game.initialize_sounds();

    Game.initialize_intersections();

    Game.initialize_barriers();

    Game.initialize_streets();
    
    Game.initialize_controls();

    Game.initialize_high_score();

    Game.initialize_speed_changer();

    Game.initialize_timer();

    Game.initialize_tutorial();

    Game.global_car_odds = Game.difficulty_increases ? Game.car_odd_levels[Game.car_odd_levels.length-1][1] : 1;

    Game.log("global car odds", Game.global_car_odds);

    if (Game.enable_frustration) {
      Game.initialize_frustration();  
    }

    if (auto_start===true) {
      Game.start();
    }

  },

  initialize_fullscreen : function(){
    if (Game.is_pokki) {
      $('#toggle_fullscreen').bind('click', function() {
        if (Game.is_fullscreen===false) {
          var wrapper = document.body;
          wrapper.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
          Game.is_fullscreen = true;
          $(this).html('x');
        } else {
          document.webkitCancelFullScreen();  
          Game.is_fullscreen = false;
          $(this).html('&#10065;');
        }
      });
      $("#minimize").bind('click', function(){
        pokki.closePopup();
      });
    }
  },

  initialize_menus : function(){

    Game.log("initializing help menus");

    Help.initialize();

  },

  initialize_animation_frame : function(){
    
    Game.log("initializing requestAnimFrame");

    window.requestAnimFrame = (function(callback){
      // return window.requestAnimationFrame ||
      // window.webkitRequestAnimationFrame ||
      // window.mozRequestAnimationFrame ||
      // window.oRequestAnimationFrame ||
      // window.msRequestAnimationFrame ||
      return function(callback){
        window.setTimeout(callback, 1000 / Game.fps); 
      };
    })();

  },

  initialize_tutorial : function() {
    
    // if the game has been played more than once, we don't run the tutorial mode anymore


  },

  initialize_timer : function() {
    
    Game.log("initializing timer");

    if (Game.show_timer) {
      $("<div id='timer'></div>").
        everyTime(1000, function(){
          if (Game.started && !Game.paused && !Game.ended) {
            Game.timer+=1;
            $(this).text(Game.timer);    
          }
        }).
        appendTo('#game');
    }

  },

  initialize_canvas : function(){
    
    Game.log("double buffering?", Game.double_buffering);

    if (Game.double_buffering) {
      Game.car_canvas  = document.getElementById('cars');
      Game.real_car_context = Game.car_canvas.getContext('2d');
      
      Game.virtual_car_canvas = document.createElement('canvas');
      Game.virtual_car_canvas.width = Game.width;
      Game.virtual_car_canvas.height = Game.height;
      Game.car_context = Game.virtual_car_canvas.getContext('2d');
    
    } else {
      Game.car_canvas  = document.getElementById('cars');
      Game.car_context = Game.car_canvas.getContext('2d');  
      
    }
    
    Game.frustration_canvas = document.getElementById('frustrations');
    Game.frustration_context = Game.frustration_canvas.getContext('2d');

    if (Game.debug==true) {
      $(".neighborhood").css({'background':"#121212"});
      $(".buildings").css({'background':"transparent"});
    }
    
  },

  initialize_speed_changer : function(){
    
    Game.log("speed is changeable?", Game.can_adjust_speed);

    if (this.can_adjust_speed) {

      var click = function(e, obj){ 
        if (Game.started && !Game.paused && !Game.ended) {
          
          var street_name = $(this).attr('data-name');

          if (obj && obj.originalEvent) {
            var hit1 = [ obj.originalEvent.pageX - 15, obj.originalEvent.pageX + 15 ],
                hit2 = [ obj.originalEvent.pageY - 15, obj.originalEvent.pageY + 15 ];
            
          } else {
            var hit1 = [ e.pageX - 15, e.pageX + 15 ],
                hit2 = [ e.pageY - 15, e.pageY + 15 ];
          }

          if (Game.debug) {
            $("<div></div>").
              addClass('hitbox').
              css({ top    : e.pageY-15, 
                    left   : e.pageX-15, 
                    width  : 30, 
                    height : 30,
                    opacity : 0.5 }).
              oneTime(20000, function(){ $(this).remove(); }).
              appendTo('#map');
          }

          if (streets = _.filter(Game.streets, function(street){ return (street_name===street.css_name); })) {
            _.each(streets, function(street){
              _.each(street.cars, function(c){
                var c1 = [ c.current_pos.left, c.current_pos.left + c.width ],
                    c2 = [ c.current_pos.top,  c.current_pos.top + c.height ];
                
                var horiz_match = Game.compare_positions( hit1, c1 ),
                    vert_match  = Game.compare_positions( hit2, c2 );
                
                if (horiz_match && vert_match) {
                  c.change_speed(true);  
                }
              });
            });
          }
        }
      };
      
      if (Game.touch_device) {
        $(".street").bind('swipemove',click);
      } else {
        $(".street").unbind('click').click(click);
      }
 
    } else {
      
      $(".help_acceleration_text").hide();

    }
  },

  log : function() {
    if (Game.debug_visually && arguments.length) {
      var str = "";
      for (var i=0; i<arguments.length;i++) {
        str+= arguments[i] + " ";
      }
      Game.debug_cont.append("<p>"+str+"</p>");
    }
  },

  initialize_bosses : function(){
    
    Game.log("initializing boss timers", BOSSES.length);

    if (Game.with_bosses) {
      
      Game.bosses = BOSSES;

      Game.boss_countdown = 0;

      Game.boss_timer = window.setInterval(function(){
        
        
        if (Game.started && !Game.paused && !Game.ended) {
          
          Game.boss_countdown+=1;
          
          // get boss hash
          if (boss = _.detect(Game.bosses, function(boss){ return boss.time==Game.boss_countdown; })) {
            
            // pick a random Street's Maker to usurp
            var boss_street = Game.streets[Math.floor(Math.random()*Game.streets.length)];

            // generate the boss
            boss_street.maker.build_car(boss);

          }    
        }
        
      }, 1000);

    }

  },

  // this is the main animation function,
  // which calls the animate() function on all
  // the cars on all the streets
  animate : function() {
    
    if (Game.started && !Game.paused && !Game.ended) {
      
      Game.frames+=1;

      Game.clear_canvases();

      if (Game.debug==true) {
        Game.show_game_objects();  
      }

      _.each(Game.streets, function(street){
        _.each(street.cars, function(car){
          car.animate();
        });
      });

      if (Game.double_buffering) {
        Game.real_car_context.drawImage(Game.virtual_car_canvas, 0, 0);
      }

      _.each(Game.deferred_renders, function(arr) {
        if (_.isFunction(arr[0])) {
          var func = arr[0];
          arr.splice(0,1);
          func(arr[0], arr[1]); // TODO: Figure out how to use Function.apply() here so we can have a dynamic number of arguments
        }
      });

      //new frame
      requestAnimFrame(function(){
        Game.animate();  
      });  
    }
    
  },

  clear_canvases : function(){
    
    if (Game.double_buffering) {
      Game.real_car_context.clearRect(0, 0, Game.width, Game.height);    
      Game.car_context.clearRect(0, 0, Game.width, Game.height);    

    } else {
      Game.car_context.clearRect(0, 0, Game.width, Game.height);    

    }
      
    Game.frustration_context.clearRect(0, 0, Game.width, Game.height);

    Game.deferred_renders = new Array;

  },

  initialize_mobile_behaviours : function(){
    $("body, .screen").bind('touchmove',function(e){
      e.preventDefault();
    })
  },

  initialize_parameters : function(){
    var hash = document.location.hash;
    if (hash.indexOf('reset_high_score')!==-1){
      Game.store_high_score(0);
    } else if (hash.indexOf('force_tutorial')!==-1) {
      Game.force_tutorial();
    }
  },

  initialize_containers : function(){
    
    Game.log("initializing containers");

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
    
    Game.log("initializing behaviours");

    Game.intro.show();
    Game.main.hide();
    Game.credits.hide();
    Game.hide_message();
    Game.streets = [];
    Game.score = 0;
    Game.score_cont.text('0');
    Game.initialize_frustration();
    Game.initialize_high_score();

    $(".restart").hide();
    $(".pause, .quit, .mute").addClass('disabled');

  },

  initialize_sounds : function() {

    Game.log("initializing sounds", Game.with_sound, Game.with_phonegap_sound, Game.with_sm2_sound);

    if (Game.with_sound){
      if (Game.with_phonegap_sound) {

        _.each(Game.raw_sounds, function(media_or_arr, key){
          if (_.isArray(media_or_arr)) {
            _.each(media_or_arr, function(media, index){
              var new_k = [key, index].join("");
              Game.sounds[new_k] = Game.sounds_dir + media + Game.sound_format;
            });
          } else {
            if (key==='theme') {
              Game.sounds[key] = new Media(Game.sounds_dir + media_or_arr + Game.sound_format);
            } else {
              Game.sounds[key] = Game.sounds_dir + media_or_arr + Game.sound_format;   
            }
          }          
        });
        
      } else if (Game.with_sm2_sound && Game.enable_preloading===false) {
        
        soundManager.onready(function() {

          _.each(Game.raw_sounds, function(media_or_arr, key){
            
            if (_.isArray(media_or_arr)) {
              _.each(media_or_arr, function(media, index){
                var new_k = [key, index].join("");
                Game.sounds[new_k] = Game.loader.addSound( new_k, Game.sounds_dir + media + Game.sound_format );
              });
            } else {
              Game.sounds[key] = Game.loader.addSound( key, Game.sounds_dir + media_or_arr + Game.sound_format );
            }
            
          });

        });

      }
    }
  },

  initialize_buttons : function(){
    
    Game.log("initializing buttons");

    $(".start_game").click(function(){
      Game.start();
    });

    $(".restart").click(function(){
      Game.restart();
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

    $(".bttn.speed").click(function(){
      if (Game.speed===1) {
        Game.speed=1.5;
        $(this).text("Slower");
      } else {
        Game.speed=1;
        $(this).text("Faster");
      }
    });

  },

  initialize_streets : function(){

    Game.log("initializing streets", STREETS.length);

    _.each( STREETS, function(street_data){
      var street  = new Street();

      street.initialize( Game, street_data, Game.car_context );
      Game.streets.push( street );
    });
    
  },

  initialize_barriers : function(){
    
    Game.log("initializing barriers", BARRIERS.length);

    var self  = this;

    _.each(BARRIERS, function(b){
      var t  = b[0].match(/^([^\s]+)\_barrier[\d]$/i),
        hash = {  name         : b[0],
                  top          : b[1], 
                  left         : b[2], 
                  width        : b[3], 
                  height       : b[4], 
                  orientation  : b[5],
                  intersection : b[6],
                  active       : b[7],
                  color        : b[8] };

      if (Game.barriers[t[1]]) {
        Game.barriers[t[1]].push( hash );  
      } else {
        Game.barriers[t[1]] = [ hash ];
      }
    });
  },

  initialize_intersections : function(){
    
    Game.log("initializing intersections", INTERSECTIONS.length);

    _.each(INTERSECTIONS, function(intersection){
      Game.intersections.push({
        name   : intersection[0],
        top    : intersection[1],
        left   : intersection[2],
        width  : intersection[3],
        height : intersection[4],
        cars   : [ [], [] ] // [ [ horizontal ], [ vertical ] ]
      });
    });
  },

  initialize_controls : function(){
    
    Game.log("initializing controls", $(".stoplight").length);

    var self = this;
    self.stoplights = STOPLIGHTS;

    // prevent gray overlay when tapping in iOS?
    $('body').live('touchstart', function(e){
      if(e.target.localName != 'select' && e.target.localName != 'h2'){
        e.preventDefault(); 
      }
    });

    $(".stoplight", Game.dom).hide().each(function(idx, el){
      
      var elem   = $(el),
          light  = self.stoplights[idx],
          click  = function(){
            if (Game.started && !Game.paused && !Game.ended) {
              if (elem.hasClass('horizontal')) {
                elem.removeClass('horizontal').addClass('vertical');
              } else {
                elem.addClass('horizontal').removeClass('vertical');
              }

              var new_orientation = elem.hasClass('horizontal') ? 'horizontal' : 'vertical';
              
              var barriers_to_activate   = light[ new_orientation=='horizontal' ? 1 : 0 ],
                  barriers_to_deactivate = light[ new_orientation=='horizontal' ? 0 : 1 ];

              _.each(Game.streets, function(street){
                _.each(street.barriers, function(street_barrier) {

                  if (_.include(barriers_to_activate, street_barrier.name)) {
                    street_barrier.active = true;
                  } else if (_.include(barriers_to_deactivate, street_barrier.name)) {
                    street_barrier.active = false;
                  }
                });
              });
            } 
          }
      
      elem.removeClass('vertical').addClass('horizontal');

      if (Game.touch_device) {
        elem.tappable(click);
        // new MBP.fastButton(el, click);
      } else {
        elem.unbind('click').click(click);
      }

    });

  },

  initialize_high_score : function(){

    Game.log("initializing high score", $.jStorage.storageAvailable(), Game.high_score);

    if ($.jStorage.storageAvailable()) {
      Game.high_score = $.jStorage.get(Game.high_score_key_full, 0);
      Game.high_score_cont.text( Game.high_score );
    }
  },

  store_high_score : function(new_score) {
    Game.log('storing high score', Game.high_score, new_score);
    Game.high_score = new_score;
    $.jStorage.set( Game.high_score_key_full, new_score );
  },

  show_intro : function() {
    Game.intro.show();
    Game.credits.hide();
    Game.loading_screen.hide();
    Game.leaderboards.hide();
    Game.main.hide();
  },

  show_credits : function() {
    Game.intro.hide();
    Game.credits.show();
    Game.loading_screen.hide();
    Game.leaderboards.hide();
    Game.main.hide();
  },

  show_leaderboards : function(){
    Game.intro.hide();
    Game.credits.hide();
    Game.loading_screen.hide();
    Game.leaderboards.show();
    Game.main.hide();
  },

  start : function(from_intro){

    Game.log("starting countdown now");

    Game.score   = 0;
    Game.score_cont.text("0");

    Game.high_score_cont.text( Game.high_score );

    Game.critical_cars = new Array;
    
    Game.check_critical();

    Game.started = true;
    Game.paused  = true;
    Game.ended   = false;
    
    Game.timer   = 0;
    Game.boss_countdown = 0;

    if (Game.difficulty_increases) {
      Game.global_car_odds = 0.3;
    }

    Game.loading_screen.hide();
    Game.credits.hide();
    Game.leaderboards.hide();
    Game.hide_message();
    
    Game.main.show();

    Game.exit_intro(function(){
      Game.intro.hide();
      Game.stop_sound_theme();
      Game.start_countdown();
    });
    
  },

  exit_intro : function(callback){
    Help.animate_out(callback);
  },

  start_streets : function(){

    _.delay(function(){
      Game.play_sound_theme();  
    },500);

    _.each(Game.streets,function(street){
      street.start();
    });

    Game.animate();

  },

  stop_streets : function(){

    _.each(Game.streets,function(street){
      street.stop();
    });

  },

  start_counters : function(){
    
    this.frames = 0;
    this.seconds = 0;

    this.dom.everyTime(1000, function(){
      Game.seconds += 1;
    });

  },

  clear_intersections : function(){
    _.each(Game.intersections, function(intersection){
      intersection.cars = [ [], [] ];
    });
  },

  control_all_barriers : function(value){
    _.each(Game.streets, function(street){
      _.each(street.barriers,function(barrier){
        barrier.active=value;
      });
    });
  },

  check_critical : function(){
    Game.dom.stopTime('check_critical').everyTime(1000, 'check_critical', function(){
      if (Game.critical_cars.length>0) {
        $("#critical").animate({ opacity : 1 },500);
      } else {
        $("#critical").animate({ opacity : 0 },500);
      }
    });
  },

  pause : function(){
    
    Game.paused = true;
    
    $("#overlay").show();
    
    Game.stop_sound_theme();
    
  },

  resume : function() {
    Game.paused = false;
    
    $("#overlay").hide();
    
    Game.animate();

    Game.play_sound_theme();
    
  },

  quit : function() {
    
    Game.stop_sound_theme();
    
    document.location.reload();

  },

  restart : function() {
    
    Game.stop_sound_theme();
    
    $(".restart, #messages").hide();
    
    Game.start();

  },

  reset : function(return_to_intro){
    
    Game.stop_sound_theme();

    Game.stop_streets();

    Game.clear_intersections();
    
    Game.frus_cont.stopTime('frustrating');

    $(".restart").show();

  },

  mute : function(){
    $(".bttn.mute").addClass('muted').text('Un-mute');
    Game.with_sound = false;
    Game.muted = true;
    Game.stop_all_sounds();
  },

  unmute : function(){
    $(".bttn.mute").removeClass('muted').text('Mute');
    Game.with_sound = true;
    Game.muted = false;
    if (Game.started) {
      Game.play_sound_theme();  
    }
  },

  play_sound_theme : function(){
    Game.play_sound('theme', true, 50);
  },

  stop_sound_theme : function(){
    Game.stop_sound('theme');
  },

  play_sound : function(sound, loop, volume, interrupt_all) {
    
    if (_.isUndefined(Game.sounds[sound])) { return false; }

    if (volume===undefined) { volume = 100; }
    
    if (Game.with_sound) {
      if (Game.with_phonegap_sound) {
        if (loop) {
          Game.loop_sound(sound, volume);
        } else {
          PhoneGap.exec("SoundPlug.play", Game.sounds[sound]);
        }
        
      } else if (Game.with_sm2_sound) {
        if (loop) {
          Game.loop_sound(sound,volume);
        } else {
          Game.sounds[sound].play({ volume : volume });  
        }

      } else if (Game.with_soundjs) {
        if (loop) {
          SoundJS.play( sound, null, 0.5, true );

        } else {
          if (interrupt_all) {
            SoundJS.play( sound, SoundJS.INTERUPT_ANY );
          } else {
            SoundJS.play( sound, SoundJS.INTERUPT_LATE );  
          }
        }
      }
    }
  },

  loop_sound : function(sound, volume) {
    if (Game.with_phonegap_sound) {
      
      // console.log('playing ' + sound);
      
      Game.sounds[sound].play();

      Game.theme_timer = setInterval(function(){ 
          Game.sounds[sound].play(); 
          // console.log('looping theme'); 
        }, 23980);
      
    } else if (Game.with_sm2_sound) {
      
      Game.sounds[sound].
          play({ 
            volume   : volume,
            onfinish : function(){
            Game.loop_sound(sound, volume);
          }
        }); 

    } else if (Game.with_soundjs) {
      
      SoundJS.play(sound, SoundJS.INTERRUPT_NONE, 50, true);

    }
  },

  stop_sound : function(sound) {
    
    Game.log('stopping sound', sound);

    if (Game.with_phonegap_sound) {
      clearInterval(Game.theme_timer);
      Game.sounds[sound].stop()

    } else if (Game.with_sm2_sound) {
      Game.sounds[sound].stop();

    } else if (Game.with_soundjs) {
      SoundJS.stop(sound);

    }
    
  },

  stop_all_sounds : function() {
    if (Game.with_phonegap_sound) {
      _.each(Game.sounds,function(media, key) {
        Game.stop_sound(key);
      });
    } else if (Game.with_sm2_sound) {
      soundManager.stopAll();
    } else if (Game.with_soundjs) {
      SoundJS.setMute(true);
      SoundJS.stop('theme');
    }
  },

  // if passed a callback, will delay for X seconds, then run it
  show_message : function(html, subtle) {
    
    Game.messages.html(html).show();
    if (subtle===true) {
      Game.messages.addClass("subtle");
    } else {
      Game.messages.removeClass("subtle");
    }
    Game.messages.css({ display : 'block' });
  },

  hide_message : function(){
    Game.messages.html("").css({ display : 'none' });
  },

  start_countdown : function() {
    
    var int = 3;
    Game.messages.css({ display : 'block', opacity : '1' }).html("<h1 class='countdown'>Starting ...</h1>");
    
    Game.clear_canvases();

    _.delay(function(){
      Game.play_sound('countdown');
    },1000);

    Game.main.everyTime(1000,'countdown',function(){

      Game.messages.html("<h1 class='countdown'>" + int + "<h1>");
      
      if (int==0){
        $(".countdown").text("GO!");
      }

      if (int==-1) {
        
        Game.log("starting game now");

        $(this).stopTime('countdown');
        Game.started = true;
        Game.paused = false;
        Game.messages.hide();
        Game.start_counters();
        Game.start_controls();
        Game.start_streets();

        $(".pause, .quit, .mute").removeClass('disabled');
      } 

      int-=1;
      
    });
  },

  arrived : function( car ) {
    Game.increment_score( car.score );
  },

  increment_score : function( score ){
    
    var css = (score > 3 ? 'good' : (score < 1 ? 'bad' : ''));

    Game.score+=(score || 1);
    
    Game.score_cont.
      text(Game.score).
      addClass(css).
      animate({'font-size' : "64px"},100).
      delay(50).
      animate({'font-size' : '48px'},
        { duration : 50, 
          complete : function(){
            $(this).removeClass(css);    
          }
        });

    Game.play_sound('arrived');

    if (Game.score > Game.high_score) {
      Game.score_cont.addClass('higher_score');
    }

    Game.increment_car_odds();

  },

  increment_car_odds : function(){
    if (Game.difficulty_increases) {
      if (Game.global_car_odds!=1.0) {
        if (arr = _.detect(Game.car_odd_levels, function(level){ return Game.score >= level[0]; })) {
          Game.global_car_odds = arr[1];
          return Game.global_car_odds;  
        }  
      }
    }
  },

  initialize_frustration : function(){
    
    Game.log("initializing frustration assets", FRUSTRATIONS.length);

    Game.frustration = 0;

    Game.frustration_assets = _.map(FRUSTRATIONS, function(f){ 
                                  var img = new Image();
                                  img.src = IMAGES_DIR + f[0];
                                  return {  image  : img, 
                                            width  : f[1], 
                                            height : f[2], 
                                            top    : f[3], 
                                            left   : f[4] };
                                });
    
  },

  adjust_frustration : function(){
    var w = (Game.frustration/Game.max_frustration) * Game.frus_cont.innerWidth();
    Game.frus_bar.width(w);
  },

  start_controls : function() {
    
    var i = 0;

    $(".stoplight").each(function(idx, el){
      var el     = $(el), 
          off    = el.offset(), 
          orig   = _.clone(el.offset()),
          width  = el.width(),
          height = el.height();

      el.css({
        opacity : 0,
        display : 'block'
      });

      _.delay(function(){
        el.animate({
          top : "+=2",
          left : "+=2",
          opacity : 1
        },200).
        animate({
          top : "-=2",
          left : "-=2"
        },200);  
      },(i*300));
      
      i+=1;
      
    });
  },

  end_with_frustration : function(){    

    // we delay the game end slightly so that the canvas has time 
    // to draw the rest of the cars,
    // otherwise some of them disappear.

    _.delay(function(){
      if (!Game.ended) {
        Game.started = false;
        Game.ended = true;
        $(".stoplight").css('opacity',0);
        
        if (Game.score>Game.high_score) {
          // Game.play_sound('new_high_score');
          Game.store_high_score(Game.score);
          Game.show_message( Game.show_new_high_score(Game.score) );

        } else {
          Game.stop_sound('theme');
          Game.play_sound('frustration',false,50,true);
          var message = Game.frustration_messages[Math.floor(Math.random()*Game.frustration_messages.length)];
          Game.show_message( "<h2 class='quip'>" + message + "</h2>" );

        }

        Game.reset();  
      }
    },1000/Game.fps);

  },

  end_with_collision : function( exploding_car ){
    
    // we delay the game end slightly so that the canvas has time 
    // to draw the rest of the cars,
    // otherwise some of them disappear.

    _.delay(function(){
      if (!Game.ended) {
        Game.started = false;
        Game.ended = true;
        Game.generate_explosion( exploding_car );
        $(".stoplight").css('opacity',0);

        if (Game.score>Game.high_score) {
          // Game.play_sound('new_high_score');
          Game.store_high_score(Game.score);
          Game.show_message( Game.show_new_high_score(Game.score) );

        } else {
          var message = Game.collision_messages[Math.floor(Math.random()*Game.collision_messages.length)];
          Game.show_message( "<h2 class='quip'>" + message + "</h2>" );

        }

        Game.reset();      
      }
      
    },1000/Game.fps);
    
  },

  show_new_high_score : function(score) {

    var fb_bttn = $("<p class='bttn post_to_facebook'><span class='icon facebook'></span>Congratulations, controller. Post your score on Facebook.</p>").
      click(function(){ Game.post_to_facebook(); });

    return $("<div class='new_high_score'></div>").
      append("<h1>" + Game.score + "</h1><h2>New high score!</h2>").
      append(fb_bttn);

  },

  generate_explosion : function( exploding_car ) {
    
    var pos = exploding_car.current_pos;
    
    $("<div class='explosion'></div>").css({
      top :  pos.top - 20,
      left : pos.left - 20
    }).
    appendTo("#map").
    oneTime(3000, function(){
      $(this).animate({ opacity : 0 });  
    });

    Game.play_sound('explosion',false,100,true);
    
  },

  compare_positions : function(p1, p2){
    var x1 = p1[0] < p2[0] ? p1 : p2;
    var x2 = p1[0] < p2[0] ? p2 : p1;
    return x1[1] > x2[0] || x1[0] === x2[0] ? true : false;
  },

  show_game_objects : function(){
    // temporary
    _.each(Game.streets, function(street){
      _.each(street.barriers, function(b){
        if (b.active) {
          Game.car_context.beginPath();
          Game.car_context.rect( b.left, b.top, b.width, b.height);
          Game.car_context.fillStyle = b.color;
          Game.car_context.fill();  
        }
      });
      Game.car_context.beginPath();
      Game.car_context.rect( street.left, street.top, street.width, street.height );
      Game.car_context.lineWidth = 2;
      Game.car_context.strokeStyle = "#333";
      Game.car_context.stroke();
    });

    _.each(Game.intersections, function(inter){
      Game.car_context.beginPath();
      Game.car_context.rect( inter.left, inter.top, inter.width, inter.height );
      Game.car_context.lineWidth = 2;
      Game.car_context.strokeStyle = "#0ff";
      Game.car_context.stroke();
    });

  },

  login_to_facebook : function(){
    
    FB.login(function(response) {
      if (response.authResponse) {
        Game.log('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
          Game.log('Good to see you, ' + response.name + '.');
          FB.logout(function(response) {
            Game.log('Logged out.');
          });
        });
      } else {
        Game.log('User cancelled login or did not fully authorize.');
      }
    }, {scope: 'publish_stream'});
      
  },

  post_to_facebook : function(){
    
    FB.init({appId: APP_ID, status: true, cookie: true});

    var obj = {
      method: 'feed',
      link: APP_URL,
      picture: APP_URL + "/images/apple-touch-icon-h.png",
      name: "New Traffix High Score! " + Game.high_score + "!",
      description: "Traffix is a traffic control game that's completely free to play!"
    }, 
    callback = function(response) {
      if (response && response.post_id) {
        Game.log('hi', response);
      } else {
        Game.log('error');
      }
    }

    FB.ui(obj, callback);
  }

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

  this.initialize      = function(game, street, context) {
    this.game          = Game;
    this.name          = street[0];
    this.cars          = new Array;
    this.css_name      = street[0].replace(/\_(right|left)/,'').replace(/\_lane[\d]/,'');
      
    this.lefthand      = this.name.indexOf('left')!==-1;
    this.orientation   = street[1];
    this.top           = street[2];
    this.left          = street[3];
    this.width         = street[4];
    this.height        = street[5];
    
    this.maker         = new Maker(Game, this);

    this.context       = context;

    this.initialize_barriers();
    this.initialize_intersections();

  };

  this.initialize_barriers = function(){
    
    var self  = this,
        name  = self.name.replace(/\_lane[\d]/,'');

    self.barriers = Game.barriers[name] || [];  
    
  };

  this.initialize_intersections = function(){
    var self = this,
        name = this.name.replace(/\_lane[\d]/i,'').replace(/\_(left|right)/i,'');
    
    _.each(Game.intersections, function(intersection){
      if (intersection.name.indexOf(name)!==-1) {
        self.intersections.push(intersection);
      }
    });
    
  };

  this.start = function(){
    this.maker.initialize(this);
  };

  this.stop = function(){
    this.cars = new Array;
    this.maker.stop();
  };

};

var Car = function(car_hash){
  
  this.width                 = car_hash && car_hash.width   ? car_hash.width     : 20;
  this.height                = car_hash && car_hash.height  ? car_hash.height    : 35;
  this.color                 = car_hash && car_hash.colors  ? car_hash.colors[Math.floor(Math.random()*car_hash.colors.length)] : 'default';
  this.type                  = car_hash && car_hash.type    ? car_hash.type      : 'car';
  this.image_assets          = car_hash && car_hash.assets  ? car_hash.assets    : false;
  this.sounds                = car_hash && car_hash.sounds  ? car_hash.sounds    : false;
  this.score                 = car_hash && car_hash.score   ? car_hash.score     : 1;
  this.animate               = car_hash && car_hash.animate ? true               : false;
  this.animation             = car_hash && car_hash.animate ? car_hash.animation : {};
  this.street                = false;
  this.moving                = false;
  this.frustration           = 0;
  this.frustrates_by         = car_hash && car_hash.frustrates_by ? car_hash.frustrates_by : 1; // rate of frustration
  this.frustration_checks    = 0;
  this.frustration_threshold = 3;
  this.frustration_level1    = 4;
  this.frustration_level2    = 5;

  // this is the number we use to modify ideal_travel_time, for frustration purposes
  this.travel_time_modifier  = car_hash && car_hash.frustrates_by ? car_hash.frustrates_by : 6;

  // might want to go back to the original integer version of this if you want to save CPU cycles on iPad 1 devices
  this.speed                 = car_hash && car_hash.speed ? car_hash.speed : (Math.random()*4)+4; // pixels per frame 
  
  this.intersecting          = {};
  
  this.orientation           = 'horizontal';
  this.lefthand              = false;
  this.origins               = {}; // top, left
  this.current_pos           = {}; // top, left
  this.destinations          = {}; // top, left
  
  this.ideal_travel_time     = 0; 
  this.actual_travel_time    = 0;
  // ideal_travel_time is the time in seconds it would take the car to travel from 
  // origin to destination, assuming the road was completely open, multiplied by 2.
  // the closer we approach the travel_time, the more frustrated the car driver becomes.
  // actual_travel_time is just an integer we increment with every render();

  this.initialize = function(name, street, orientation){
    
    this.name         = name;
    this.game         = Game;
    this.street       = street;
    this.moving       = true;
    this.orientation  = orientation;
    this.lefthand     = street.lefthand;
    
    this.flip_dimensions(this.width, this.height);
    
    this.initialize_origins(); 
    this.initialize_intersecting();
    
    if (Game.enable_frustration) {
      this.initialize_frustration();  
    }
    
    this.initialize_sounds();

    if (Game.debug===true) {
      
      var colors = ["#c00","#009","#360","#f60","#ff0"];
      this.color = colors[Math.floor(Math.random()*colors.length)];  

    } else {
  
      this.image = new Image();

      this.image.src = Game.images_dir + (this.orientation=='horizontal' ? 
        (this.lefthand ? this.image_assets[0] : this.image_assets[1]) : 
        (this.lefthand ? this.image_assets[2] : this.image_assets[3]) );      

      // console.log(this.image.src);

      if (this.animate) {

        // we store the current Game.frame number that this Car is created on, 
        // then wait until (this.last_game_frame+this.step) before switching to the next frame
        this.current_frame = 0;
        this.step = this.animation.step;
        this.last_game_frame = Game.frames; 

      }

    }

    this.render();
    
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

  this.initialize_sounds = function() {
    if (this.sounds) {
      this.sound_loop = this.play_sound_loop();
    }
  };

  // TODO!
  this.play_sound_loop = function(){
    if (Game.with_sound) {
      if (Game.with_phonegap_sound) {
        
      } else if (Game.with_sm2_sound) {
        
      }
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

      this.ideal_travel_time = Math.ceil((Math.abs(this.destinations.left-this.origins.left)/this.speed)*this.travel_time_modifier);

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

      this.ideal_travel_time = Math.ceil((Math.abs(this.destinations.top-this.origins.top)/this.speed)*this.travel_time_modifier);
      
    }

  };

  this.initialize_intersecting = function(){
    var self = this;
    _.each(self.street.intersections, function(inter){
      self.intersecting[inter.name] = false;
    });
  };

  this.initialize_frustration = function(){
    this.frustration_thresholds = [
      Math.round(this.ideal_travel_time/2),
      Math.round(this.ideal_travel_time - (this.ideal_travel_time*0.35)),
      Math.round(this.ideal_travel_time - (this.ideal_travel_time*0.2)),
      Math.round(this.ideal_travel_time - (this.ideal_travel_time*0.03))
    ];
  };

  this.manage_frustration = function(){
    
    var self = this;
    
    self.actual_travel_time += 1;

    var travel = Math.round(self.actual_travel_time/Game.speed);
    
    if (travel == self.frustration_thresholds[0]) {
      
      var horn_name = 'horns_short' + (Math.floor(Math.random()*Game.raw_sounds.horns_short.length));
      Game.play_sound(horn_name);

    } else if (travel > self.frustration_thresholds[0] && travel < self.frustration_thresholds[1]) {

      if (self.moving===false) {
        return Game.frustration_assets[0];
      }

    } else if (travel == self.frustration_thresholds[1]) {
      

      var horn_name = 'horns_long' + (Math.floor(Math.random()*Game.raw_sounds.horns_long.length));
      Game.play_sound(horn_name);

      if (self.moving===false) {
        return Game.frustration_assets[0];
      }
    
    } else if (travel > self.frustration_thresholds[1] && travel < self.frustration_thresholds[2]) {
      
      if (self.moving===false) {
        return Game.frustration_assets[1];  
      }

    } else if (travel == self.frustration_thresholds[2]) {
      
      // add to critical cars array
      Game.critical_cars.push(self);

      var horn_name = 'horns_long' + (Math.floor(Math.random()*Game.raw_sounds.horns_long.length));
      Game.play_sound(horn_name);

      if (self.moving===false) {
        return Game.frustration_assets[1];
      }

    } else if (travel > self.frustration_thresholds[2] && travel < self.frustration_thresholds[3]) {
      
      if (self.moving===false) {
        return Game.frustration_assets[2];  
      }
    
    } else if (travel === self.frustration_thresholds[3]) {
           
      var horn_name = 'horns_long' + (Math.floor(Math.random()*Game.raw_sounds.horns_long.length));
      Game.play_sound(horn_name);

      if (self.moving===false) {
        return Game.frustration_assets[2];  
      }
    
    } else if (travel > self.frustration_thresholds[3] && travel < self.ideal_travel_time) {

      if (self.moving===false) {
        return Game.frustration_assets[3];  
      }
      
    } else if (travel === self.ideal_travel_time) {
      
      Game.end_with_frustration();

      if (self.moving===false) {
        return Game.frustration_assets[3];  
      }

    }
    
    return false;

  };

  this.render = function(left, top){
    
    var self   = this,
        street = self.street,
        ctx    = self.street.context,
        frus   = Game.frustration_context;

    if (Game.debug===true) {
      ctx.beginPath();

      ctx.rect( self.current_pos.left, 
            self.current_pos.top, 
            self.width, 
            self.height );

      ctx.fillStyle = this.color;
      ctx.fill();

    } else {
      
      if (this.animate) {

        if (Game.frames == this.last_game_frame+this.step) {
          if (this.current_frame < this.animation.frames-1) {
            this.current_frame += 1;  
          } else {
            this.current_frame = 0;
          }
          this.last_game_frame = Game.frames;
        } 

        var sx = 0 + (this.width*this.current_frame);

        // console.log(self.image);
        ctx.drawImage(self.image, sx, 0, this.width, this.height, self.current_pos.left, self.current_pos.top, this.width, this.height); 

      } else {

        ctx.drawImage(self.image, self.current_pos.left, self.current_pos.top);  

      }
       
    }

    if (Game.enable_frustration) {
      if (frustration = self.manage_frustration()) {
        Game.deferred_renders.push([ 
            function(f, p) {
              frus.drawImage( f.image, 
                             (p.left + f.left), 
                             (p.top + f.top) );
            }, 
            frustration, 
            self.current_pos ]);
      }
    }

  };

  this.animate = function(){
    
    this.drive();
    this.render(); 

  };

  this.stop = function(){
    var self = this;
    self.moving = false;
  };

  this.change_speed = function(faster) {
    if (faster) {
      this.speed = Game.max_speed;
    } else if (!faster && Math.ceil(this.speed) > 2) {
      this.speed -= 1;
    }
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
    
    var current_left = this.current_pos.left,
        current_top  = this.current_pos.top;

    var self1 = [current_left, current_left + this.width],
        self2 = [current_top,  current_top + this.height];
    
    var collision_type = false;

    // is it at an intersection?
    if (intersection = this.is_at_intersection(self1, self2)) {
      if (other_car = this.is_colliding_at_intersection(intersection, self1, self2)){
        collision_type = other_car;

      // even if it's at an intersection, it will still check 
      // for a collision with a lead car, to prevent overlapping
      } else if (leader = this.is_following(self1, self2)) {
        collision_type = leader;
      }

    // is it at an active barrier?
    } else if (this.is_at_barrier(self1, self2)) {
      collision_type = 'barrier'; 

    // is it following a lead car?
    } else if (leader = this.is_following(self1, self2)) {
      collision_type = leader;
    }

    return collision_type;

  };

  this.is_following = function(self1, self2) {
    if (this.street.cars.length > 1) {
      if (index = this.street.cars.indexOf(this)) {
        if (index > 0) {
          var leader = this.street.cars[index-1],
              cur_l  = leader.current_pos.left,
              cur_t  = leader.current_pos.top,
              p1     = [cur_l, cur_l + this.leader.width],
              p2     = [cur_t, cur_t + this.leader.height],
              horiz_match = this.compare_positions( self1, p1 ),
              vert_match  = this.compare_positions( self2, p2 );
          
          if (horiz_match && vert_match) { return leader; } 

        }

        // for (var i=index-1; i >= 0; i--) {
          
        //   var leader = this.street.cars[i],
        //       cur_l  = leader.current_pos.left,
        //       cur_t  = leader.current_pos.top,
        //       p1     = [cur_l, cur_l + this.leader.width],
        //       p2     = [cur_t, cur_t + this.leader.height];
          
        //   var horiz_match = this.compare_positions( self1, p1 ),
        //       vert_match  = this.compare_positions( self2, p2 );
      
        //   if (horiz_match && vert_match) { return leader; }  
          
        // }    
      }
    }
    return false;
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
      
      for (var i=0; i<this.street.intersections.length; i++) {
        
        var intersection = this.street.intersections[i];
        
        var b1 = [intersection.left, intersection.left + intersection.width  ],
            b2 = [intersection.top,  intersection.top +  intersection.height ];
        
        var horiz_match = this.compare_positions( self1, b1 ),
            vert_match  = this.compare_positions( self2, b2 );
          
        if (horiz_match && vert_match) { 
          
          if (this.intersecting[intersection.name]!==true) {
            this.intersecting[intersection.name] = true;
            this.add_to_intersection(intersection.name);
          }
          return intersection;
          
        } else {
          
          if (this.intersecting[intersection.name]===true){
            this.intersecting[intersection.name] = false;
            this.remove_from_intersection(intersection.name);
          }

        }
      }
    }
  };

  this.is_intersecting = function() {
    return _.detect(_.values(this.intersecting), function(val){ return val===true; }) ? true : false;
  };

  this.add_to_intersection = function( name ) {
    if (intersection = _.detect(Game.intersections, function(inter){ return inter.name == name; })) {
      if (!_.include(intersection.cars, this)) {
        intersection.cars[( this.orientation=='horizontal' ? 0 : 1 )].push( this );
      } 
    }
  };

  this.remove_from_intersection = function( intersection_name ) {
    var self = this;
    for (var i=0; i < Game.intersections.length; i++) {
      if ( Game.intersections[i].name==intersection_name ) {
        var idx = Game.intersections[i].cars[( this.orientation=='horizontal' ? 0 : 1 )].indexOf(self);
        Game.intersections[i].cars[( this.orientation=='horizontal' ? 0 : 1 )].splice(idx, 1);
      }
    }
  };

  this.is_colliding_at_intersection = function(intersection, self1, self2) {
    
    var self = this,
       other = self.orientation=='horizontal' ? 1 : 0,
       collision = false;
    
    if (intersection.cars[other].length) {
      for (var i=0; i < intersection.cars[other].length; i++) {
        var c      = intersection.cars[other][i],
            cur_l  = c.current_pos.left,
            cur_t  = c.current_pos.top,
            c1     = [ cur_l, cur_l + c.width ],
            c2     = [ cur_t, cur_t + c.height ];
        
        var horiz_match = self.compare_positions( self1, c1 ),
            vert_match  = self.compare_positions( self2, c2 );
      
        if (horiz_match && vert_match) {
          collision = c; 
        }
      }  
    }

    return collision;
    
  };

  this.compare_positions = function(p1, p2){
    return Game.compare_positions( p1, p2 );
    // var x1 = p1[0] < p2[0] ? p1 : p2;
    // var x2 = p1[0] < p2[0] ? p2 : p1;
    // return x1[1] > x2[0] || x1[0] === x2[0] ? true : false;
  };

  this.drive = function(){
    var self = this;
    
    var leader_or_collision_or_barrier = self.is_colliding();

    if (leader_or_collision_or_barrier) {
      
      // perpendicular collision at intersection
      if (leader_or_collision_or_barrier.orientation!==undefined && 
          leader_or_collision_or_barrier.orientation !== self.orientation) {
        self.moving = false;
        Game.end_with_collision( self );

      // collision with barrier
      } else if (leader_or_collision_or_barrier==='barrier') {
        self.moving = false;

      // collision with leader
      } else if (typeof leader_or_collision_or_barrier==='object') {
        self.moving = false;
        if (leader.speed < self.speed) {
          self.speed  = leader.speed; // we copy the speed of the lead car  
        }
        
      }

    } else {
      
      if (self.orientation=='horizontal') {
        if (self.lefthand) {
          self.current_pos.left-=self.speed*Game.speed;  
        } else {
          self.current_pos.left+=self.speed*Game.speed;    
        }
      } else {
        if (self.lefthand) {
          self.current_pos.top+=self.speed*Game.speed;  
        } else {
          self.current_pos.top-=self.speed*Game.speed;    
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

    // remove from Game.critical_cars array
    if (crit_idx = Game.critical_cars.indexOf(self)) {
      Game.critical_cars.splice(crit_idx,1);
    }

    // remove from street.cars array
    this.street.cars.splice(idx,1);

    if (this.sound_loop) {
      this.sound_loop.stop();
    }

    if (Game.show_arrived_score) {
      var cur_top  = this.orientation=='horizontal' ? ( this.lefthand ? this.street.top-20 : this.street.top+10 ) : ( this.lefthand ? this.street.height-30 : this.street.top),
          cur_left = this.orientation=='horizontal' ? ( this.lefthand ? this.street.left : this.street.width-30 ) : ( this.lefthand ? this.street.left-20 : this.street.left + 20),
          end_top  = this.orientation=='horizontal' ? ( this.lefthand ?  "-=50" : "+=50" ) : ( this.lefthand ?  "-=60" : "+=50" ),
          end_left = this.orientation=='horizontal' ? ( this.lefthand ?  "+=50" : "-=60" ) : ( this.lefthand ?  "-=50" : "+=50" );

      $("<div class='car_score'></div>").
        text("+" + this.score).
        css({ top : cur_top, left : cur_left }).
        animate({ top : end_top, left : end_left, opacity : 0 },{ duration : 2000, complete : function(){ $(this).remove(); } }).
        appendTo(Game.dom);
    }

    Game.frustration -= this.frustration;
    Game.arrived( this );
  };

};

var Maker = function(){
  
  this.initialize    = function(street) {
  
    var self         = this;
    self.street      = street;
    self.frequency   = Math.round(Game.maker_freq + (Math.random()*(Game.maker_freq/2)));
    self.max_cars    = Game.max_cars_per_street;
    self.iterations  = 0;
    self.car_types   = Game.car_types;
    self.car_odds    = Game.car_odds;

    _.delay(function(){
      
      self.timer = window.setInterval(function(){ self.make(); }, self.frequency);
      
      self.make();

    }, (1 + Math.round(Math.random()*8))*1000);

  };

  this.generate = function(){

    var self = this,
        rand = Math.ceil(Math.random()*100),
        car  = false;
    
    _.each(self.car_odds, function(range, type){
      if ( rand >= Math.round(range[0]*Game.global_car_odds) && 
           rand <= Math.round(range[1]*Game.global_car_odds) ) {
          car = self.car_types[type];
        }
    });

    if (car && _.isArray(car.assets[0])) {
      var selected_assets = car.assets[ Math.floor(Math.random()*car.assets.length) ];
      return _.extend( _.clone(car), { assets : selected_assets });
    } else {
      // if (!car) { console.log('no car'); }
      return car;  
    }
    
  };

  this.make = function(){

    var self = this;
    
    if (Game.paused!==true) {
      if (self.street.cars.length < Game.max_cars_per_street) {
        self.build_car();
      }  
    }

  };

  this.build_car = function(car_hash_override){
    var self     = this;

    if (car_hash_override!==undefined) {
      var car_hash = car_hash_override;
    } else {
      var car_hash = self.generate();
    }

    if (car_hash) {
      
      var car_name = [self.street.name, self.iterations, 0].join("-"),
          car      = new Car(car_hash);
    
      self.street.cars.push( car ); 

      car.initialize(car_name, self.street, self.street.orientation);
    }

  };

  this.stop = function(){
    window.clearInterval(this.timer);
  };

};
