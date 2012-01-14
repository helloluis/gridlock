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
    
    var dom     = $("#intro").css({ top : 1024 }),
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
    }, 750);
    
    _.delay(function(){
      help2.animate({ top : 150, right : 120});   
    }, 1000);

    _.delay(function(){
      help3.animate({ top : 330, right : -50});   
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
    
    this.intersection.dom = $("#help_intersection");

    var obj = this.intersection;

    this.build_cars(obj, 3, 3);
    
    // setup origins & destinations
    _.each(obj.cars.blue,function(){
      //
    });

  },

  initialize_frustration : function(){
    this.frustration = $("#help_frustration");
  },

  initialize_acceleration : function(){
    this.acceleration = $("#help_acceleration");
  },

  build_cars : function(object, num_blue, num_yellow) {
    object.cars.blue = [];
    object.cars.yellow = [];

    for (var i=0; i < num_blue; i++) {
      object.cars.blue.push(
        $("<div class='car horizontal blue'></div>").
          css({ position : "absolute", 
              top : 100, 
              left : object.dom.width() + 50 }).
        appendTo(object.dom));
    }

    for (var i=0; i < num_yellow; i++) {
      object.cars.yellow.push(
        $("<div class='car vertical yellow'></div>").
          css({ position : "absolute", 
                top : -50, 
                left : 50 }).
          appendTo(object.dom)
      );
    }
  },

  animate_intersection : function(){
    var animate = function(){
      
    };

    _.delay(function(){
      animate();
    }, 500);
  },

  animate_frustration : function(){
    var animate = function(){
      
    };

    _.delay(function(){
      animate();
    }, 500);
  },

  animate_acceleration : function(){
    var animate = function(){
      
    };

    _.delay(function(){
      animate();
    }, 500);
  },

  stop_all : function(){
    this.intersection.stopTime();
    this.frustration.stopTime();
    this.acceleration.stopTime();
  }
	
};