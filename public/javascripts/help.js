Help = {

  intersection : { dom : false, cars : {}, coordinates : {} },
  frustration  : { dom : false, cars : {}, coordinates : {} },
  acceleration : { dom : false, cars : {}, coordinates : {} },
  diagrams     : false,

	initialize : function(){
    var self = this;
    
    this.diagrams = $(".help_illustration");

    this.animate_in(function(){
      self.initialize_controls();
      self.initialize_intersection();
      self.initialize_frustration();
      self.initialize_acceleration();
    });

  },

  animate_in : function(callback){
    
    var self    = this,
        dom     = $("#intro").css({ top : 1024 }),
        logo    = $("h1", dom).css({ top : 20, left : -700 }),
        text    = $(".help p", dom).hide(),
        help1   = $(".help_illustration_intersection", dom).css({ top : -450, right : -400 }),
        help2   = $(".help_illustration_frustration", dom).css({ top : 450, right : -600 }),
        help3   = $(".help_illustration_acceleration", dom).css({ top : 900, right : -400 }),
        score   = $(".high_score_cont", dom).hide(),
        play    = $(".start_game", dom).hide(),
        credits = $(".credits", dom).hide(),
        leaders = $(".leaderboards", dom).hide();

    dom.animate({ top : 0 });

    _.delay(function(){
      logo.animate({ top : -50, left : -60 });  
    }, 500);
    
    _.delay(function(){
      help1.animate({ top : -60, right : -60});
      self.initialize_intersection();
    }, 750);
    
    _.delay(function(){
      help2.animate({ top : 150, right : 120}); 
      self.initialize_frustration();  
    }, 1000);

    _.delay(function(){
      help3.animate({ top : 330, right : -50});
      self.initialize_acceleration();  
    }, 1250);

    _.delay(function(){
      text.show();
    }, 1750);

    _.delay(function(){
      score.show();
    }, 2000);

    _.delay(function(){
      play.show();
      credits.show();
      leaders.show();
    }, 2250);

    _.delay(function(){
      callback.call();
      self.start_intersection();
      // self.animate_intersection();
      // self.animate_frustration();
      // self.animate_acceleration();
    }, 3000);

  },

  initialize_controls : function(){
    this.diagrams.click(function(){
      $(this).
        css({'z-index':5}).
        addClass('selected').
        siblings().each(function(){ 
          $(this).
            removeClass('selected').
            css('z-index',3); 
        });
    });  
  },

  initialize_intersection : function(){
    
    this.intersection.animating = false;
    this.intersection.animate_h = false;
    this.intersection.animate_v = false;
    this.intersection.dom       = $("#help_intersection");
    this.intersection.cont      = $(".help_background", this.intersection.dom);

    this.build_cars(this.intersection, 3, 3);

  },

  initialize_frustration : function(){
    
    this.frustration.dom = $("#help_frustration");

    var obj = this.frustration,
        stoplight = $(".stoplight", this.frustration.dom).show();

  },

  initialize_acceleration : function(){
    this.acceleration.dom = $("#help_acceleration");

    var obj = this.acceleration,
        stoplight = $(".stoplight", this.acceleration.dom).show();
  },

  build_cars : function(object, num_blue, num_yellow) {
    object.cars.blue = [];
    object.cars.yellow = [];

    for (var i=0; i < num_blue; i++) {
      object.cars.blue.push(
        $("<div class='car horizontal right blue'></div>").
          css({ position : "absolute", 
                top : 90, 
                left : 400 }).
        appendTo(object.cont));
    }

    for (var i=0; i < num_yellow; i++) {
      object.cars.yellow.push(
        $("<div class='car vertical yellow'></div>").
          css({ position : "absolute", 
                top : -150, 
                left : 100 }).
          appendTo(object.cont));
    }
  },

  animate_intersection : function(){

    var self   = this,
        obj    = this.intersection,
        light  = $(".stoplight", obj.dom).show(),
        finger = $(".finger", obj.dom).css({ 'visibility' : 'hidden' });

    var loop_blue = function(car, x1, x2, y, duration) {
        var default_x1 = 400;
        car.
          stop(false,false).
          css({ top : y, left : (x1 ? x1 : default_x1) }).
          animate({ left : x2 }, 
            { duration : duration, 
              complete : function(){
                if (obj.animate_h===true) {
                  loop_blue(car, false, x2, y, duration);  
                }
            } 
          });
      },
      loop_yellow = function(car, x, y1, y2, duration) {
        var default_y1 = -100;
        car.
          stop(false,false).
          css({ top : (y1 ? y1 : default_y1), left : x }).
          animate({ top : y2 },
            { duration : duration,
              complete : function(){
                if (obj.animate_v===true) {
                  loop_yellow(car, x, false, y2, duration);
                }
              }
            });
      };

    obj.dom.
      queue('intersection', function(next){

        obj.animate_h = true;

        // animate blue cars crossing the intersection
        var blue = obj.cars.blue;
        loop_blue(blue[0], blue[0].position().left, -100, 90, 3000);
        loop_blue(blue[1], blue[1].position().left, -100, 70, 3500);
        loop_blue(blue[2], blue[2].position().left, -100, 90, 4000);

        // animate yellow cars stopping at the intersection
        _.delay(function(){
          var yellow = obj.cars.yellow;
          yellow[0].stop(false,false).css({ top : -150, left : 100 }).animate({ top : 35 }, 1000);
          yellow[1].stop(false,false).css({ top : -150, left : 122 }).animate({ top : 35 }, 1500);
          yellow[2].stop(false,false).css({ top : -150, left : 100 }).animate({ top : -5 }, 2000);
        }, 1000);
        
        _.delay(function(){
          obj.animate_h = false;
          next();
        }, 8000);

      }).
      queue('intersection', function(next){
        
        // finger taps the button
        finger.stop().css({ top : 300, left : 300, opacity : 0, visibility : 'visible' }).
          animate({ top : light.position().top, left : light.position().left, opacity : 1 }, {
            duration : 1500, 
            complete : function(){ 
              $(this).addClass('tapped').
                animate({ top : "-=2", left : "-=2" },100).
                animate({ top : "+=2", left : "+=2" },100); 

              light.removeClass('horizontal').addClass('vertical');

              next();
            }
          });

      }).
      queue('intersection', function(next){
        
        // animate the yellow cars
        _.delay(function(){
          finger.removeClass('tapped').animate({ top : -50, left : 300, opacity : 0 }, 1000);  
        }, 500);
        
        var blue = obj.cars.blue;
        _.delay(function(){
          blue[0].stop(false,false).css({ top : 90, left : 300 }).animate({ left : 200 }, 1000);
          blue[1].stop(false,false).css({ top : 70, left : 400 }).animate({ left : 200 }, 1000);
          blue[2].stop(false,false).css({ top : 90, left : 500 }).animate({ left : 245 }, 1000);  
        }, 1000);
        
        obj.animate_v = true;
        var yellow = obj.cars.yellow;
        loop_yellow(yellow[0], 100, yellow[0].position().top, 400, 3000);
        loop_yellow(yellow[1], 122, yellow[1].position().top, 400, 3500);
        loop_yellow(yellow[2], 100, yellow[2].position().top, 400, 4000);

        // loop it infinitely
        _.delay(next, 8000);

      }).
      queue('intersection', function(next){
        
        // finger taps the button
        finger.stop().
          animate({ top : light.position().top, left : light.position().left, opacity : 1 }, {
            duration : 1500, 
            complete : function(){ 
              $(this).addClass('tapped').
                animate({ top : "-=2", left : "-=2" },100).
                animate({ top : "+=2", left : "+=2" },100); 

              light.removeClass('vertical').addClass('horizontal');
            }
          });

        // loop it infinitely
        _.delay(function(){
          self.animate_intersection();
        }, 2000);

      });

      // kick off the animation
      self.intersection.dom.dequeue('intersection');

  },

  start_intersection : function(){
    
    var self = this;
    self.intersection.animating = true;
    self.acceleration.animating = false;
    self.frustration.animating  = false;
    self.animate_intersection();

  },

  animate_frustration : function(){
    
    var self = this;
    
    // TODO : animation queue

    self.frustration.dom.dequeue('frustration', function(){ self.animate_frustration(); });
        
  },

  start_frustration : function(){
    
    var self = this;
    self.intersection.animating = false;
    self.acceleration.animating = false;
    self.frustration.animating  = true;
    self.animate_frustration();

  },

  animate_acceleration : function(){
    
    var self = this;

    // TODO : animation queue

    self.acceleration.dom.dequeue('acceleration', function(){ self.animate_acceleration(); });

  },

  start_acceleration : function(){
    
    var self = this;
    self.intersection.animating = false;
    self.acceleration.animating = true;
    self.frustration.animating  = false;
    self.animate_acceleration();

  },

  stop_all : function(){
    
    this.intersection.dom.stop(false,false).stopTime();
    this.frustration.dom.stop(false,false).stopTime();
    this.acceleration.dom.stop(false,false).stopTime();

    this.intersection.cont.empty();
    this.frustration.cont.empty();
    this.acceleration.cont.empty();

    self.intersection.animating = false;
    self.acceleration.animating = false;
    self.frustration.animating  = false;

  }
	
};