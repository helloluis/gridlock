Game = {

  wait        : 1500,
  scores      : 0,
  paused      : true,
  sounds      : {},
  streets     : [],

  initialize : function(auto_start){
    
    jQuery.fx.interval = 42;

    Game.initialize_containers();
    
    Game.initialize_behaviours();

    Game.initialize_buttons();

    Game.initialize_sounds();

    Game.initialize_streets();
    
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
  },

  initialize_behaviours : function() {
    
    Game.intro.show();
    Game.main.hide();
    Game.credits.hide();
    Game.messages.hide();
    Game.streets = [];
    Game.score = 0;
    
    $(".pause, .quit").addClass('disabled');

  },

  initialize_sounds : function() {
    // Game.sounds.click  = new Audio("sounds/clook.mp3");
    // Game.sounds.tick   = new Audio("sounds/tock.mp3");
    // Game.sounds.buzzer = new Audio("sounds/beep_long.mp3");
  },

  initialize_buttons : function(){
    
    $(".start_game").click(function(){
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

  start : function(){
    Game.intro.hide();
    Game.main.show();
    Game.credits.hide();
    Game.start_countdown();
  },

  start_streets : function(){
    _.each(Game.streets,function(street){
      street.start();
    });
  },

  pause : function(){
    Game.paused = true;
  },

  quit : function() {
    Game.reset();
  },

  // if passed a callback, will delay for X seconds, then run it
  show_message : function(text, subtle) {
    
    Game.messages.html("<h2>" + text + "</h2>");
    if (subtle===true) {
      Game.messages.addClass("subtle");
    } else {
      Game.messages.removeClass("subtle");
    }
    Game.messages.animate({ opacity : 1 },200);
  },

  hide_message : function(){
    Game.messages.animate({ opacity : 0 });
  },

  start_countdown : function() {
    
    var int = 3;
    Game.messages.show();

    Game.main.everyTime(1000,'countdown',function(){
      
      Game.messages.html("<h1 class='countdown'>" + int + "<h1>");
      
      if (int==0){
        $(".countdown").text("GO!");
      }

      if (int==-1) {
        $(this).stopTime('countdown');
        Game.messages.hide();
        Game.start_streets();
        $(".pause, .quit").removeClass('disabled');
      } 

      int-=1;
      
    });
  },

  reset : function(return_to_intro){

    var home = $("<h1 class='bttn home'>Home</h1>").
      click(function(){
        Game.initialize_behaviours();
      });

    Game.countdown.empty().append(home);

    if (return_to_intro===true) {
      Game.initialize_behaviours();
    }
  },

  resume : function() {
    $("#overlay").remove();
  },

  arrived : function( car ) {
    street.cars.splice(car.street.cars.indexOf(car),1);
    Game.increment_score();
  },

  increment_score : function(){
    Game.score+=1;
  }

};

var Street = function(){
  
  this.name        = 'amber_left';
  this.dom         = false;
  this.width       = 0;
  this.height      = 0;
  this.top         = 0;
  this.left        = 0;
  this.lanes       = 2;
  this.orientation = 'horizontal';
  this.frustration = 0;
  this.gap         = 5;
  this.cars        = [];
  this.stopped     = false;

  this.initialize  = function(game, name, orientation) {
    this.game      = game;
    this.name      = name;
    this.dom       = $("#" + name);
    this.orientation = orientation;
    this.top       = this.dom.offset().top;
    this.left      = this.dom.offset().left;
    this.width     = this.dom.width();
    this.height    = this.dom.height();
    this.maker     = new Maker();
  };

  this.start = function(){
    console.log('starting street');
    this.maker.initialize(game, this);
  };

};

var Car = function(){
  
  this.width           = 15;
  this.height          = 30;
  this.street          = false;
  this.moving          = false;
  this.frustration     = 0;
  this.speed           = 60; // pixels per second
  this.at_intersection = false;
  this.on_street       = false;
  this.orientation     = 'horizontal';
  this.origins         = {};
  this.destinations    = {};

  this.initialize = function(game, street, orientation){
    this.game         = game;
    this.street       = street;
    this.orientation  = orientation;
    this.initialize_origins(); 
    this.render();
  };

  this.initialize_origins = function(){
    if (this.orientation == 'horizontal') {
      
      this.origins.left = this.street.dom.offset().left;
      this.destinations.left = Game.map.width();

      if (this.street.lanes==2) {
        this.origins.top = (this.street.dom.offset().top - this.street.dom.height()) + (Math.random() > 0.5 ? 0 : (this.street.height/2)) + this.street.gap;
      } else {
        this.origins.top = (this.street.dom.offset().top - this.street.dom.height()) + this.street.gap;
      }

      this.destinations.top = this.origins.top;

    } else {

      this.origins.top = this.street.dom.offset().top;
      this.destinations.top = Game.map.height();

      if (this.street.lanes==2) {
        this.origins.left = this.street.dom.offset().left + (Math.random() > 0.5 ? 0 : (this.street.width/2)) + this.street.gap;
      } else {
        this.origins.left = this.street.dom.offset().left + this.street.gap;
      }

      this.destinations.left = this.origins.left;

    }
  };

  this.render = function(){
    
    var self     = this,
        street   = self.street,
        speed    = (this.orientation=='horizontal' ? Game.map.width() : Game.map.height())/this.speed;

    self.dom = $("<div class='car'></div>").
      addClass(this.orientation).
      append("<div class='bumper bumper_front'></div><div class='bumper bumper_back'></div>").
      appendTo(Game.cars).
      css({ top: self.origins.top, left : self.origins.left }).
      everyTime(100, function(){ self.drive(); });

    self.go();

  };

  this.go = function(){
    
    var self = this;

    if (this.orientation==='horizontal') {
      var speed = ((Game.map.width() - this.dom.offset().left)/this.speed)*1000;
    } else {
      var speed = ((Game.map.height() - this.dom.offset().top)/this.speed)*1000;
    }
    console.log('car speed',speed);
    this.dom.animate({
      top: self.destinations.top, left: self.destinations.left
    }, {duration : speed, easing : 'linear'});

    this.moving = true;
  };

  this.stop = function(){
    this.dom.stop();
    this.moving = false;
  };

  this.collide = function(){
    //return this.dom.collision("#cars .car");
  };

  this.drive = function(){
    var self = this;
    if (self.street.stopped===true) {
      self.stop();
    } else {
      if (other_car = self.collide()) {
        self.stop();
        if (!self.friendly(other_car)) {
          Game.end_with_collision();
        }
      } else {
        if (self.destinations.top <= self.dom.offset().top && self.destinations.left <= self.dom.offset().left) {
          self.arrived();
        } else {
          if (!self.moving) {
            self.go();
          }
        }
      }
    }
  };

  this.friendly = function(other_car) {
    return true;
  };

  this.arrived = function(){
    this.dom.remove();
    Game.arrived( this );
  };

};

var Maker = function(){
  
  this.initialize   = function(game, street) {
 
    var self        = this;
    self.game       = game;
    self.street     = street;
    self.frequency  = 6000+(Math.random()*5000);
    self.iterations = 0;

    // this.street.dom.everyTime(this.frequency, function(){
    //   self.make();
    // });

    self.make();
  };

  this.make = function(){
    
    var self = this;

    console.log('making', self.iterations);
    self.iterations+=1;
    
    var num_cars = Math.ceil(Math.random()*self.iterations);
    if (num_cars < 1) { num_cars = 1; }

    for (var i=0; i < num_cars; i++) {
      var car = new Car();
      car.initialize(self.game, self.street, self.street.orientation);
      self.street.cars.push( car ); 
    }

  };

};
