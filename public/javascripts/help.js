Help = {

  intersection : { dom : false, cars : {} },
  frustration  : { dom : false, cars : {} },
  acceleration : { dom : false, cars : {} },
  diagrams     : $(".help_illustration"),

	initialize : function(){
    this.initialize_controls();
    this.initialize_intersection();
    this.initialize_frustration();
    this.initialize_acceleration();
  },

  initialize_controls : function(){
    this.diagrams.click(function(){
      var help = $(this);
      help.css('z-index',5).siblings().each(function(){ $(this).css('z-index',3); });
    });  
  },

  initialize_intersection : function(){
    this.intersection.dom = $("#help_intersection");

    var obj = this.intersection, num_blue = 3, num_yellow = 3;

    obj.cars.blue = [];
    obj.cars.yellow = [];

    for (var i=0; i < num_blue; i++) {
      obj.cars.blue.push(
        $("<div class='car horizontal blue'></div>").
          css({ position : "absolute", 
              top : 100, 
              left : dom.width() + 50 }).
        appendTo(dom));
    }

    for (var i=0; i < num_yellow; i++) {
      obj.cars.yellow.push(
        $("<div class='car vertical yellow'></div>").
          css({ position : "absolute", 
                top : -50, 
                left : 50 }).
          appendTo(dom)
      );
    }
  },

  initialize_frustration : function(){
    this.frustration = $("#help_frustration");
  },

  initialize_acceleration : function(){
    this.acceleration = $("#help_acceleration");
  },

  animate_intersection : function(){
    
  },

  animate_frustration : function(){
    
  },

  animate_acceleration : function(){
    
  },

  stop_all : function(){
    this.intersection.stopTime();
    this.frustration.stopTime();
    this.acceleration.stopTime();
  }
	
};