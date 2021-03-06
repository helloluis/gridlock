/* needs jQuery.pause.js */

Help = {

  intersection : { dom : false, cars : {}, coordinates : {} },
  frustration  : { dom : false, cars : {}, coordinates : {} },
  acceleration : { dom : false, cars : {}, coordinates : {} },
  reward       : { dom : false, cars : {}, coordinates : {} },
  diagrams     : false,

  initialize : function(){
    var self = this;
    
    this.diagrams = $(".help_illustration");

    this.animate_in(function(){
      self.initialize_intersection();
      self.initialize_frustration();
      self.initialize_reward();
    });

  },

  animate_in : function(callback){
    
    var self    = this,
        dom     = $("#intro").css({ opacity : 0 }),
        logo    = $("h1", dom).css({ top : 400, left : -700 }),
        cap1    = $(".caption_intersection", dom).css({ top : 850, left : -200 }),
        cap2    = $(".caption_frustration", dom).css({ top : 850, left : 400 }),
        cap3    = $(".caption_reward", dom).css({ top : 850, left : 1200 }),
        help1   = $(".help_illustration_intersection", dom).css({ top : 250, left : -500 }),
        help2   = $(".help_illustration_frustration", dom).css({ top : 850, left : 400 }),
        help3   = $(".help_illustration_reward", dom).css({ top : 900, left : 1200 }),
        score   = $(".high_score_cont", dom).hide(),
        play    = $(".start_game", dom).hide(),
        credits = $(".credits", dom).hide(),
        pintsized = $("#pintsized", dom).hide(),
        leaders = $(".leaderboards", dom).hide();

    dom.animate({ opacity : 1 });

    _.delay(function(){
      logo.animate({ top : -50, left : 110 });  
    }, 500);
    
    _.delay(function(){
      help1.animate({ top : 160, left : -80});
      cap1.animate({ top : 430, left : -40});
      self.initialize_intersection();
    }, 750);
    
    _.delay(function(){
      help2.animate({ top : 130, left : 240}); 
      cap2.animate({ top : 430, left : 275},800); 
      self.initialize_frustration();  
    }, 1000);

    _.delay(function(){
      help3.animate({ top : 140, left : 560});
      cap3.animate({ top : 420, left : 578},800);
      self.initialize_reward();  
    }, 1250);

    _.delay(function(){
      score.show();
    }, 2000);

    _.delay(function(){
      play.show();
      credits.show();
      pintsized.show();
      leaders.show();
    }, 2250);

    _.delay(function(){
      callback.call();
      self.start_intersection();
      self.start_frustration();
      self.start_reward();
    }, 3000);

  },

  animate_out : function(callback) {
    
    var self = this;
        dom  = $("#intro").animate({ opacity:0  },1000);
    
    $("h1", dom).animate({ top : -400, left : 200 },500),
    $(".help_illustration_intersection", dom).animate({ top : 300, left : -500 },500),
    $(".help_illustration_frustration", dom).animate({ top : 1200, left : 400 },500),
    $(".help_illustration_reward", dom).animate({ top : 300, left : 1200 },500),
    $(".caption_intersection",dom).animate({ top: 800, left:-300 }),
    $(".caption_frustration",dom).animate({ top: 800, left:400 }),
    $(".caption_reward",dom).animate({ top: 800, left:800 }),
    $(".high_score_cont", dom).hide(),
    $(".start_game", dom).hide(),
    $(".credits", dom).hide(),
    $("#pintsized", dom).hide(),
    $(".leaderboards", dom).hide();

    if (callback!==undefined) {
      _.delay(callback, 1500);  
    }

  },

  initialize_controls : function(){
    // this.diagrams.click(function(){
    //   $(this).
    //     css({'z-index':5}).
    //     addClass('selected').
    //     siblings().each(function(){ 
    //       $(this).
    //         removeClass('selected').
    //         css('z-index',3); 
    //     });
    // });  
  },

  initialize_intersection : function(){
    
    this.intersection.animating = false;
    this.intersection.animate_h = false;
    this.intersection.animate_v = false;
    this.intersection.dom       = $("#help_intersection");
    this.intersection.cont      = $(".help_background", this.intersection.dom);

    this.build_cars(this.intersection, 3, 3, true, true);

  },

  // only the intersection screen needs this convenience method,
  // the other two just spawn their cars as needed by their animate() methods
  restart_intersection : function(){
    
    this.build_cars(this.intersection, 3, 3, true, true);
    this.start_intersection();

  },

  initialize_frustration : function(){
    
    this.frustration.dom   = $("#help_frustration");
    this.frustration.cont  = $(".help_background", this.frustration.dom);

    var obj = this.frustration,
        stoplight = $(".stoplight", this.frustration.dom).show();

  },

  initialize_acceleration : function(){
    this.acceleration.dom  = $("#help_acceleration");
    this.acceleration.cont = $(".help_background", this.acceleration.dom);

    var obj = this.acceleration,
        stoplight = $(".stoplight", this.acceleration.dom).show();
  },

  initialize_reward : function() {
    
    this.reward.dom = $("#help_reward");
    this.reward.cont = $(".help_background", this.reward.dom);

  },

  build_cars : function(object, num_blue, num_yellow, blue_left, yellow_left) {
    object.cars.blue = [];
    object.cars.yellow = [];

    for (var i=0; i < num_blue; i++) {
      object.cars.blue.push(
        $("<div class='car horizontal " + (blue_left ? "left" : "right") + " blue'></div>").
          css({ position : "absolute", 
                top : 90, 
                left : 400 }).
        appendTo(object.cont));
    }

    for (var i=0; i < num_yellow; i++) {
      object.cars.yellow.push(
        $("<div class='car vertical " + (yellow_left ? "left" : "right") + " yellow'></div>").
          css({ position : "absolute", 
                top : -150, 
                left : 100 }).
          appendTo(object.cont));
    }
  },

  animate_intersection : function(){

    var self   = this,
        obj    = this.intersection,
        light  = $(".stoplight", obj.dom).show().addClass('horizontal').removeClass('vertical'),
        finger = $(".finger", obj.dom).css({ 'visibility' : 'hidden' }),
        coords = {  blue   : { x : 400, y : [ 90, 70, 90] },
                    yellow : { x : [ 100, 122, 100], y : -100 }
                 };

    // looping functions for both blue and yellow cars
    var loop_blue = function(car, i, x1, x2, y, duration) {
        car.
          stop(false,false).
          animate({ left : x2 }, 
            { duration : duration, 
              complete : function(){
                if (obj.animate_h===true) {
                  car.css({ top : coords.blue.y[i], left : coords.blue.x });
                  loop_blue(car, i, coords.blue.x, x2, coords.blue.y[i], duration);  
                }
            } 
          });
      },
      loop_yellow = function(car, i, x, y1, y2, duration) {
        car.
          stop(false,false).
          animate({ top : y2 },
            { duration : duration,
              complete : function(){
                if (obj.animate_v===true) {
                  car.css({ top : coords.yellow.y, left : coords.yellow.x[i] });
                  loop_yellow(car, i, coords.yellow.x[i], coords.yellow.y, y2, duration);
                }
              }
            });
      };

    //console.log(obj.cars);

    if (typeof obj.cars.blue=='undefined' || typeof obj.cars.yellow=='undefined') { return false; }

    obj.cars.blue[0].css('top', coords.blue.y[0]);
    obj.cars.blue[1].css('top', coords.blue.y[1]);
    obj.cars.blue[2].css('top', coords.blue.y[2]);

    // actual animation queue definition begins here
    obj.dom.
      queue('intersection', function(next){

        obj.animate_h = true;

        // animate blue cars crossing the intersection
        var blue = obj.cars.blue;
        loop_blue(blue[0], 0, blue[0].position().left, -100, blue[0].position().top, 3000);
        loop_blue(blue[1], 1, blue[1].position().left, -100, blue[1].position().top, 3500);
        loop_blue(blue[2], 2, blue[2].position().left, -100, blue[2].position().top, 4000);

        next();
        // animate yellow cars stopping at the intersection
        // _.delay(function(){
        //   var yellow = obj.cars.yellow;
        //   yellow[0].stop(false,false).css({ top : -150, left : coords.yellow.x[0] }).animate({ top : 35 }, 1000);
        //   yellow[1].stop(false,false).css({ top : -150, left : coords.yellow.x[1] }).animate({ top : 35 }, 1500);
        //   yellow[2].stop(false,false).css({ top : -150, left : coords.yellow.x[2] }).animate({ top : -5 }, 2000);  
        // }, 1000);
        
        // the whole thing should take about 4 sec
        // _.delay(function(){
        //   obj.animate_h = false;
        //   next();
        // }, 4000);

      }).
      delay(1000, 'intersection').
      queue('intersection', function(next){

        var yellow = obj.cars.yellow;
        yellow[0].stop(false,false).css({ top : -150, left : coords.yellow.x[0] }).animate({ top : 35 }, 1000);
        yellow[1].stop(false,false).css({ top : -150, left : coords.yellow.x[1] }).animate({ top : 35 }, 1500);
        yellow[2].stop(false,false).css({ top : -150, left : coords.yellow.x[2] }).animate({ top : -5 }, 2000);

        next();

      }).
      delay(4000, 'intersection').
      queue('intersection', function(next){
        
        obj.animate_h = false;

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
      delay(500, 'intersection').
      queue('intersection', function(next){
        
        // move away the finger
        finger.removeClass('tapped').animate({ top : -50, left : 300, opacity : 0 }, 1000);  
        
        // animate the blue cars, stopping at the intersection
        var blue = obj.cars.blue;
        _.delay(function(){
          blue[0].stop(false,false).css({ top : coords.blue.y[0], left : 300 }).animate({ left : 200 }, 1000);
          blue[1].stop(false,false).css({ top : coords.blue.y[1], left : 400 }).animate({ left : 200 }, 1000);
          blue[2].stop(false,false).css({ top : coords.blue.y[2], left : 500 }).animate({ left : 245 }, 1000);  
        }, 1000);
        
        // animate the yellow cars
        obj.animate_v = true;
        var yellow = obj.cars.yellow;
        
        loop_yellow(yellow[0], 0, yellow[0].position().left, yellow[0].position().top, 400, 3000);
        loop_yellow(yellow[1], 1, yellow[1].position().left, yellow[1].position().top, 400, 3500);
        loop_yellow(yellow[2], 2, yellow[2].position().left, yellow[2].position().top, 400, 4000);

        next();

      }).
      delay(4000, 'intersection').
      queue('intersection', function(next){
        
        // finger taps the button
        finger.stop().
          animate({ top : light.position().top, left : light.position().left, opacity : 1 }, {
            duration : 1500, 
            complete : function(){ 
              $(this).addClass('tapped').
                animate({ top : "-=2", left : "-=2" },100).
                animate({ top : "+=2", left : "+=2" },100).
                delay(200).
                animate({ top : 300, left : 300, opacity : 0 },1000); 
              
              obj.animate_v = false;
              light.removeClass('vertical').addClass('horizontal');
            }
          });

        // loop it infinitely, we recreate the queue and start at the top again
        _.delay(function(){
          self.animate_intersection();
        }, 4000);

      });

      // kick off the animation
      self.intersection.dom.dequeue('intersection');

  },

  start_intersection : function(){
    
    var self = this;
    self.intersection.animating = true;
    self.animate_intersection();

  },

  animate_frustration : function(){
    
    this.build_cars(this.frustration, 3, 3, true);

    var self   = this,
        obj    = this.frustration,
        light  = $(".stoplight", obj.dom).show().addClass('horizontal').removeClass('vertical'),
        frus   = [ 'frustration01', 'frustration02', 'frustration03' ],
        coords = {  blue   : { x : 400, y : [ 90, 70, 90] },
                    yellow : { x : [ 152, 175, 152 ], y : 350 },
                 };
    
    this.frustration.animate_h = true;

    $(".frustration", obj.cont).
      css('visibility', 'hidden').
      removeClass('frustration01').
      removeClass('frustration02').
      removeClass('frustration03');

    // looping functions for both blue and yellow cars
    var loop_blue = function(car, i, x1, x2, y, duration) {
        car.
          stop(false,false).
          animate({ left : x2 }, 
            { duration : duration, 
              complete : function(){
                if (obj.animate_h===true) {
                  car.css({ top : coords.blue.y[i], left : coords.blue.x });
                  loop_blue(car, i, coords.blue.x, x2, coords.blue.y[i], duration);  
                }
            } 
          });
      },
      build_frus = function(num){
        for(var i=0; i<num; i++) {
          $("<div></div>").addClass('frustration').appendTo(obj.cont);  
        }
      };
    
    obj.cars.blue[0].css('top', coords.blue.y[0]);
    obj.cars.blue[1].css('top', coords.blue.y[1]);
    obj.cars.blue[2].css('top', coords.blue.y[2]);

    obj.cars.yellow[0].addClass('right').css({ top : 180, left : coords.yellow.x[0] });
    obj.cars.yellow[1].addClass('right').css({ top : 180, left : coords.yellow.x[1] });
    obj.cars.yellow[2].addClass('right').css({ top : 225, left : coords.yellow.x[2] });

    build_frus( obj.cars.yellow.length );

    // actual animation queue definition begins here
    obj.dom.
      queue('frustration', function(next){

        obj.animate_h = true;

        // animate blue cars crossing the intersection
        var blue = obj.cars.blue;
        loop_blue(blue[0], 0, blue[0].position().left, -100, blue[0].position().top, 3000);
        loop_blue(blue[1], 1, blue[1].position().left, -100, blue[1].position().top, 3500);
        loop_blue(blue[2], 2, blue[2].position().left, -100, blue[2].position().top, 4000);
        
        next();

      }).
      delay(2000, 'frustration').
      queue('frustration', function(next){
        var i = 0; 
        self.frustration.dom.everyTime(1000,function(){
          
          var pos = obj.cars.yellow[i%3].position(),
              f   = $($(".frustration", obj.cont).get(i%3));
          
          f.css({ top : pos.top-30, left : pos.left-40, visibility : 'visible' }).addClass( frus[i%3] );

          i+=1;

          if (i==9) {
            $(this).stopTime();
          }
        });
      });

    self.frustration.dom.dequeue('frustration');
        
  },

  start_frustration : function(){
    
    var self = this;
    self.frustration.animating  = true;
    self.animate_frustration();

  },

  animate_reward : function(){
    
    var self = this,
        obj  = this.reward,
        loop = function(car, x1, x2, y, duration) {
          car.
            css({ top : y, left : x1 }).
            stop(false,false).
            animate({ left : x2 }, 
              { duration : duration,
                easing   : 'linear', 
                complete : function(){
                  loop(car, x1, x2, y, duration);
                  score(x2, y);
                } 
            });
            return car;
          },
        score = function(left, top) {
          $("<div class='car_score'>+1</div>").
            css({ top : top-20, left : left-50, opacity : 1 }).
            animate({ top : "-=100", left : "-=150", opacity : 0 }, 
              { duration : 2000, 
                complete : function(){
                  $(this).remove();  
              }
            }).
            appendTo(self.reward.cont);
        };

    self.build_cars(obj, 3, 0);

    self.reward.loops = new Array;

    self.reward.loops = new Array;

    self.reward.dom.
      queue('reward', function(next){
        
        self.reward.loops.push( loop(obj.cars.blue[0], -40, 300, 120, 2000) );
        self.reward.loops.push( loop(obj.cars.blue[1], -40, 300, 140, 3000) );
        _.delay(function(){
          self.reward.loops.push( loop(obj.cars.blue[2], -40, 300, 120, 2000) );
        },1000);

      });

    self.reward.dom.dequeue('reward');

  },

  start_reward : function(){
    
    var self = this;
    self.reward.animating = true;
    self.animate_reward();

  },

  animate_acceleration : function(){
    
    var self = this,
        obj  = this.acceleration,
        finger = $(".finger", obj.dom);

    self.build_cars(obj, 1, 0);

    self.acceleration.dom.
      queue('acceleration', function(next){

        obj.cars.blue[0].
          css({
            top : 90, left : 400
          }).
          animate({ left : 200 },2000).
          delay(200).
          animate({ left : -100 },1000);
        
        _.delay(function(){
          finger.
            css({ top : 250, left : 250, opacity : 0, visibility : 'visible' }).
            animate({ top : 140, left : 250, opacity : 1 }, 
              { duration : 750, 
                complete : function(){ 
                  $(this).addClass('tapped');  
                } 
              }).
            delay(100).
            animate({ left : 200 }, 
              { duration : 500, 
                complete : function(){
                  $(this).removeClass('tapped').animate({ top : 250, left : 250, opacity : 0 }, 1000);

                  // loop it infinitely
                  self.animate_acceleration();  
              }
            });
        }, 1000);

      });

    self.acceleration.dom.dequeue('acceleration', function(){ self.animate_acceleration(); });

  },

  start_acceleration : function(){
    
    var self = this;
    self.acceleration.animating = true;
    self.animate_acceleration();

  },

  stop_intersection : function(){

    if (this.intersection.dom) {
      $(".car", this.intersection.dom).stop(false,false);
      $(".finger", this.intersection.dom).stop(false,false);
      this.intersection.dom.stop(false,false).stopTime();
    
      this.intersection.cars = { blue : [], yellow : [] };
      this.intersection.cont.empty();
      this.intersection.animating = false;
      this.intersection.cars = {};  
    }
    
  },

  stop_frustration : function(){

    if (this.frustration.dom) {
      $(".car", this.frustration.dom).stop(false,false);
      this.frustration.dom.stop(false,false).stopTime();
      this.frustration.cont.empty();
      this.frustration.animating  = false;
      this.frustration.cars = {};  
    }
    
  },

  stop_reward : function(){

    if (this.reward.dom) {
      this.reward.dom.stop(false,false).stopTime();
      $(".car", this.reward.cont).stop(false,false);
      this.reward.cont.empty();
      this.reward.animating  = false;
      this.reward.cars = {};
    }
    
  },

  stop_all : function(){
    
    // console.log("Stopping all menus");
    
    this.stop_intersection();
    this.stop_frustration();
    this.stop_reward();

  }
  
};