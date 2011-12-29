Game = {

  wait        : 1500,
  scores      : 0,
  paused      : true,
  sounds      : {},
  streets     : [],
  barriers    : [],

  initialize : function(auto_start){
    
    jQuery.fx.interval = 42;

    Game.initialize_containers();
    
    Game.initialize_behaviours();

    Game.initialize_buttons();

    Game.initialize_sounds();

    Game.initialize_streets();
    
    Game.initialize_controls();

    if (auto_start===true) {
      Game.start();
    }

  },

  initialize_containers : function(){
    Game.intro        = $("#intro");
    Game.main         = $("#game");
    Game.map          = $("#map");
    Game.cars         = $("#cars");
    Game.credits      = $("#credits");
    Game.messages     = $("#messages");
    Game.score_cont   = $("#score");
  },

  initialize_behaviours : function() {
    
    Game.intro.show();
    Game.main.hide();
    Game.credits.hide();
    Game.hide_message();
    Game.streets = [];
    Game.score = 0;
    
    $(".restart").hide();
    $(".pause, .quit").addClass('disabled');

  },

  initialize_sounds : function() {
    Game.sounds.honk1  = new Audio("sounds/honk_short.mp3");
    Game.sounds.honk2  = new Audio("sounds/honk_long.mp3");
  },

  initialize_buttons : function(){
    
    $(".start_game").click(function(){
      Game.start();
    });

    $(".restart").click(function(){
      Game.initialize_behaviours();
      Game.initialize_streets();
      Game.start();
    });
    
    $(".pause").click(function(){
      if (!$(this).hasClass('disabled')) {
        Game.pause();  
      }
    });

  },

  initialize_streets : function(){

    _.each( STREETS, function(street_data){
      var street = new Street();  
      street.initialize( self, street_data[0], street_data[1] );
      Game.streets.push( street );
    });
    
  },

  initialize_barriers : function(){
    
    var self  = this;

    $(".barrier").each(function(){
      var barrier = $(this);
      var barrier_hash = {  top    : barrier.offset().top, 
                            left   : barrier.offset().left, 
                            width  : barrier.width(), 
                            height : barrier.height(), 
                            orientation  : barrier.hasClass('horizontal') ? 'horizontal' : 'vertical',
                            active       : barrier.hasClass('horizontal') ? false : true,
                            intersection : barrier.parent().attr('data-streets') };
      Game.barriers.push( barrier_hash );
    });
    //console.log(Game.barriers);
  },

  start : function(){
    Game.intro.hide();
    Game.main.show();
    Game.credits.hide();
    Game.start_countdown();
  },

  start_streets : function(){
    
    Game.initialize_barriers();

    _.each(Game.streets,function(street){
      street.start();
    });

  },

  stop_streets : function(){
    
    _.each(Game.streets,function(street){
      street.stop();
    });

    Game.sounds.honk1.pause();
    Game.sounds.honk2.pause();

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
  },

  quit : function() {
    Game.reset();
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
    
    //temporary
    Game.messages.hide();
    Game.start_streets();
    $(".pause, .quit").removeClass('disabled');

    // var int = 3;
    // Game.messages.show();

    // Game.main.everyTime(1000,'countdown',function(){
      
    //   Game.messages.html("<h1 class='countdown'>" + int + "<h1>");
      
    //   if (int==0){
    //     $(".countdown").text("GO!");
    //   }

    //   if (int==-1) {
    //     $(this).stopTime('countdown');
    //     Game.messages.hide();
    //     Game.start_streets();
    //     $(".pause, .quit").removeClass('disabled');
    //   } 

    //   int-=1;
      
    // });
  },

  reset : function(return_to_intro){
    
    Game.stop_streets();

    $(".restart").show();

  },

  resume : function() {
    $("#overlay").remove();
  },

  arrived : function( car ) {
    car.street.cars.splice(car.street.cars.indexOf(car),1);
    Game.increment_score();
  },

  increment_score : function(){
    Game.score+=1;
    Game.score_cont.text(Game.score);
  },

  initialize_controls : function(){
    $(".stoplight").each(function(){
      var self          = $(this),
          intersection  = $(this).parents(".intersection").attr('data-streets');
      
      self.click(function(){
        
        if (self.hasClass('horizontal')) {
          self.removeClass('horizontal').addClass('vertical');
        } else {
          self.addClass('horizontal').removeClass('vertical');
        }

        var new_orientation = self.hasClass('horizontal') ? 'horizontal' : 'vertical';
        // we go through the Game.barriers array and toggle the orientation of barrier,
        // then iterate through Game.streets.barriers to find the specific barriers within 
        // each matching street object
        if (barriers = _.filter(Game.barriers, function(b){ return b.intersection==intersection; })) {
          
          _.each(barriers, function(barrier){
            barrier.active = !(barrier.orientation==new_orientation);
          });

          _.each(Game.streets, function(street){
            _.each(street.barriers, function(street_barrier){
              if (street_barrier.intersection==intersection) {
                street_barrier.active = !(street_barrier.orientation==new_orientation);
              }
            });
          });
        }

      });
    });
  },

  end_with_frustration : function(){
    Game.show_message("<h1>How Frustrating!</h1><p>Final Score: " + Game.score + "</p>");
    Game.reset();
  },

  end_with_collision : function(){
    Game.show_message("<h1>Boom!</h1><p>Final Score: " + Game.score + "</p>");
    Game.reset();
  }

};

var Street = function(){
  
  this.name        = 'amber_left';
  this.dom         = false;
  this.width       = 0;
  this.height      = 0;
  this.top         = 0;
  this.left        = 0;
  this.lanes       = 1;
  this.orientation = 'horizontal';
  this.frustration = 0;
  this.max_frustration = 30;
  this.gap         = 5;
  this.cars        = [];
  this.stopped     = false;
  this.jammed      = false;
  this.barriers    = [];
  this.lefthand    = false;

  this.initialize  = function(game, name, orientation) {
    this.game      = game;
    this.name      = name;
    this.dom       = $("#" + name);
    
    this.lefthand  = name.indexOf('left')!==-1;
    this.orientation = orientation;
    this.top       = this.dom.offset().top;
    this.left      = this.dom.offset().left;
    this.width     = this.dom.width();
    this.height    = this.dom.height();

    this.maker     = new Maker();
  };

  this.initialize_barriers = function(){
    
    var self  = this,
      b_class = this.name.replace(/\_lane[\d]+$/,'');

    $(".barrier[data-streets='" + b_class + "']").each(function(){
      var barrier = $(this);
      var barrier_hash = {  top    : barrier.offset().top, 
                            left   : barrier.offset().left, 
                            width  : barrier.width(), 
                            height : barrier.height(), 
                            orientation  : barrier.hasClass('horizontal') ? 'horizontal' : 'vertical',
                            active       : barrier.hasClass('horizontal') ? false : true,
                            intersection : barrier.parent().attr('data-streets') };
      self.barriers.push( barrier_hash );
    });
    //console.log('street barriers', self.barriers);
  };

  this.start = function(){
    this.initialize_barriers();
    this.maker.initialize(game, this);
    this.initialize_frustration();
  };

  this.stop = function(){
    $(".car." + this.name ).stopTime('frustrating').stopTime('driving').remove();
    $(".frustration").remove();
    this.dom.stopTime('frustrating');
    this.maker.stop();
  };

  this.initialize_frustration = function(){
    var self = this;
    self.dom.everyTime(1000, 'frustrating', function(){
      //console.log(self.frustration);
      if (self.frustration >= self.max_frustration) {
        Game.end_with_frustration();
      }
    });
  };

};

var Car = function(){
  
  this.width           = 15;
  this.height          = 35;
  this.street          = false;
  this.moving          = false;
  this.frustration     = 0;
  this.speed           = 60; // pixels per second
  this.polling_rate    = 60;
  this.at_intersection = false;
  this.on_street       = false;
  this.orientation     = 'horizontal';
  this.lefthand        = false;
  this.origins         = {};
  this.destinations    = {};
  this.travel_time     = 0; 
  // travel time is the time in seconds it would take the car to travel from 
  // origin to destination, assuming the road was completely open, multiplied by 2.
  // the closer we approach the travel_time, the more frustrated the car driver becomes.

  this.initialize = function(name, game, street, orientation){
    
    this.name         = name;
    this.game         = game;
    this.street       = street;
    this.orientation  = orientation;
    this.lefthand     = street.lefthand;

    this.initialize_speed();
    this.initialize_origins(); 
    this.render();
    this.initialize_frustration();

    // the leader is the car directly in front of this current car.
    // on a two-lane street, we have to check the two older cars, just
    // to make sure we're not colliding with either one

    var other_cars    = $(".car." + this.street.name + "[data-name!='" + this.name + "']");
    
    if (other_cars.length) {
      var myindex     = other_cars.length;

      this.leaders    = [ $(other_cars.get( myindex-1 )) ];
      // console.log(this.leaders[0].attr('data-name'));
      // if (other_cars.length>1){
      //   this.leaders.push($(other_cars.get( myindex-2 )));      
      // }
      
    } else {
      this.leaders    = false;
    }

  };

  this.initialize_speed = function(){
    this.speed = 60+Math.round(Math.random()*20);
  };

  this.initialize_origins = function(){
    if (this.orientation == 'horizontal') {
      
      var a1 = this.street.dom.offset().left - 100,
          a2 = Game.map.width() + 100;

      if (this.street.lanes==2) {
        var b1 = this.street.dom.offset().top + 
            (Math.random() > 0.5 ? 0 : (this.street.dom.height()/2)) + this.street.gap;
      } else {
        var b1 = this.street.dom.offset().top + this.street.gap;
      }

      if (this.lefthand) {
        this.origins.left = a2;
        this.destinations.left = a1;
      } else {
        this.origins.left = a1;
        this.destinations.left = a2;  
      }
      
      this.origins.top = this.destinations.top = b1;

      this.travel_time = (Math.abs(this.destinations.left-this.origins.left)/this.speed)*2;

    } else {

      var a1 = this.street.dom.offset().top - 100,
          a2 = Game.map.height() + 100;

      if (this.street.lanes==2) {
        var b1 = this.street.dom.offset().left + (Math.random() > 0.5 ? 0 : (this.street.width/2)) + this.street.gap;
      } else {
        var b1 = this.street.dom.offset().left + this.street.gap;
      }

      if (this.lefthand) {
        this.origins.top = a1;
        this.destinations.top = a2;
      } else {
        this.origins.top = a2;
        this.destinations.top = a1;  
      }
      
      this.destinations.left = this.origins.left = b1;

      this.travel_time = Math.ceil((Math.abs(this.destinations.top-this.origins.top)/this.speed)*2);

    }

  };

  this.initialize_frustration = function(){
    
    var self = this;
    
    self.dom.everyTime( (self.travel_time/5)*1000, 'frustrating', function(){
      self.frustration+=1;
      self.street.frustration+=1;
      if (self.frustration == 4) {
        self.dom.addClass('frustrated');
        self.add_frustration_cloud();
        Game.sounds.honk1.play();
      } else if (self.frustration >= 5) {
        self.dom.addClass('very_frustrated');
        self.add_frustration_cloud(true);
        Game.sounds.honk2.play();
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

  this.render = function(){
    
    var self     = this,
        street   = self.street,
        speed    = (this.orientation=='horizontal' ? Game.map.width() : Game.map.height())/this.speed;
    
    self.dom = $("<div class='car'></div>").
      addClass([this.orientation, this.street.name, this.lefthand ? 'left' : 'right'].join(' ')).
      attr({ 'data-name' : this.name, 'data-speed' : this.speed, 'data-stopped' : false }).
      appendTo(Game.cars).
      css({ top: self.origins.top, left : self.origins.left });

    self.restart();
    self.go();

  };

  this.change_speed = function(new_speed) {
    
    var self   = this;
    self.speed = new_speed;

    console.log('changing speed to ', new_speed);
    self.dom.stop();
    self.go();

  };

  this.go = function(){
    
    var self = this,
       speed = self.calculate_speed();

    self.dom.animate({
      top: self.destinations.top, left: self.destinations.left
    }, {duration : speed, easing : 'linear'});

    self.moving = true;
    self.dom.attr('data-stopped', false);
    self.remove_frustration_cloud();
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

  this.stop = function(){

    this.dom.stopTime('driving').stop();
    this.dom.attr('data-stopped',true);
    this.moving = false;
    this.polling_rate = 500;
    this.restart(); // restart the polling, but slower this time

  };

  this.restart = function(reset_polling){
    
    var self = this;
    if (reset_polling===true) { self.polling_rate = 100; }
    self.dom.stopTime('driving').everyTime( self.polling_rate, 'driving', function(){ self.drive(); });

  };

  // we need to check for passive collisions with leader cars (i.e., the car in front of this one),
  // and barriers. in both cases this car will just stop. if the leader car starts moving or the barrier
  // is raised, the car starts moving again.
  // there are also active collisions within the intersection bounding box, where cars from perpendicular
  // streets may overlap with the current car's path. this is a game-ending situation in all cases.
  this.is_colliding = function(){
    
    var self1 = [this.dom.offset().left, this.dom.offset().left + this.dom.width()],
        self2 = [this.dom.offset().top, this.dom.offset().top + this.dom.height()];

    if (this.leaders) {
      for (var i=0; i < this.leaders.length; i++) {
        if (this.leaders[i]!==null) {
          var leader = this.leaders[i],
                p1 = [leader.offset().left, leader.offset().left + leader.width()],
                p2 = [leader.offset().top, leader.offset().top + leader.height()];

          var horiz_match = this.compare_positions( self1, p1 ),
              vert_match  = this.compare_positions( self2, p2 );
          
          if (horiz_match && vert_match) { return leader; }  
        }
      } 
    }

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

  this.compare_positions = function(p1, p2){
    var x1 = p1[0] < p2[0] ? p1 : p2;
    var x2 = p1[0] < p2[0] ? p2 : p1;
    return x1[1] > x2[0] || x1[0] === x2[0] ? true : false;
  };

  this.drive = function(){
    var self = this;
    if (self.street.stopped===true) {
      self.stop();
    } else {
      if (leader = self.is_colliding()) {
        self.stop();
        // if (leader!==true && leader.attr('data-speed') && leader.attr('data-stopped')!='true') {
        //   self.change_speed( leader.attr('data-speed') );
        // }
        // this doesnt work yet
        // if (!self.friendly(other_car)) {
        //   Game.end_with_collision();
        // }
      } else {
        //console.log('arrived at', self.destinations.left, self.dom.offset().left);
        if (self.has_arrived()) {
          
          console.log('arrived!');
          self.dom.stopTime('driving').remove();
          self.arrived();
          
        } else {
          if (!self.moving) {
            self.restart(true);
            self.go();
          }
        }
      }
    }
  };

  this.has_arrived = function(){
    var self = this;
    if (self.orientation=='horizontal') {
      if (self.lefthand){ 
        return self.dom.offset().left <= self.destinations.left;
      } else {
        return self.destinations.left <= self.dom.offset().left;
      }
    } else {
      if (self.lefthand) {
        return self.dom.offset().top >= self.destinations.top;
      } else {
        return self.dom.offset().top <= self.destinations.top;
      }
    }
  };

  this.friendly = function(other_car) {
    return true;
  };

  this.arrived = function(){
    this.street.frustration -= this.frustration;
    this.dom.remove();
    this.remove_frustration_cloud();
    Game.arrived( this );
  };

};

var Maker = function(){
  
  this.initialize   = function(game, street) {
 
    var self        = this;
    self.game       = game;
    self.street     = street;
    self.frequency  = 3000; //+(Math.random()*5000);
    self.iterations = 0;
    self.max_cars   = 20;

    _.delay(function(){
      
      self.street.dom.everyTime(self.frequency, 'making', function(){
        self.make();
      });

      self.make();

    }, (1 + Math.round(Math.random()*3))*1000);

  };

  this.make = function(){
    
    var self = this,
    num_cars = 1;

    //var num_cars = Math.ceil(Math.random()*self.iterations);
    //if (num_cars < 1) { num_cars = 1; }

    if (Math.random() > 0.5 && $(".car." + self.street.name).length < self.max_cars) {
      self.iterations+=1;
      for (var i=0; i < num_cars; i++) {
        var car  = new Car(),
            name = [self.street.name, self.iterations, i].join("-");
        car.initialize(name, self.game, self.street, self.street.orientation);
        self.street.cars.push( car ); 
      }
    }
    

  };

  this.stop = function(){
    this.street.dom.stopTime('making');
    this.iterations = 0;
  };

};
