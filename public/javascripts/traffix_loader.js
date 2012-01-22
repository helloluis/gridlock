// animated loader to alleviate loading boredom
TraffixLoader = {
	
  freq : 1200,
  force_wait : 30000, // should be 0, normally
  dom : false,

  loading_cars : LOADING_CARS,
  loaded_cars : [],

  loading_cont : false,

  initialize : function(){
    var self = this;
    self.dom = $("#loading_cars");
    self.loading_cont = $("#loading_container");

    _.each(self.loading_cars, function(car_src){
      $("<img/>")
        .unbind("load")
        .unbind("readystatechange")
        .bind("load readystatechange", function(){ 
          self.loaded_cars.push( $(this) );
        })
        .addClass('car')
        .attr("src", IMAGES_DIR + car_src)
        .appendTo(self.loading_cont);
    });

    self.dom.everyTime( 100, function(){
      if (self.loaded_cars.length) {
        $(this).stopTime();
        self.animate_in();
      }
    });
  },

  animate_in : function(){
    var self = this,
      dom_w  = self.dom.width(),
      origin_left = dom_w + 50;
    
    self.dom.stopTime().everyTime( self.freq, function(){
      var new_car   = self.loaded_cars[Math.floor(Math.random()*self.loaded_cars.length)],
          cars      = $(".car", self.dom),
          last_car  = $(cars.get(cars.length-1)),
          dest_left = last_car.length ? (last_car.position().left + last_car.width()) : 0;
      
      if (dest_left > dom_w - 50) {
        
        self.animate_out();

          
      } else {
        new_car.
          clone().
          css({
            top : 0,
            left : origin_left
          }).
          animate({
            left : dest_left
          },1000).
          appendTo(self.dom); 
      }
    });

  },

  animate_out : function(){
    var self = this,
      dom_w  = self.dom.width(),
      dest_left = -50;

    self.dom.stopTime().everyTime( self.freq, function(){
      var cars = $(".car", self.dom),
        first_car = $(cars.get(0));

      if (first_car.length) {
        first_car.animate({
          left : dest_left,
        }, 
        { duration : 1000, 
          complete : function(){ 
            $(this).remove(); } 
        });

      } else {
        
        self.animate_in();

      }
    });
  },

  stop : function(){
    this.dom.stopTime().empty();
    this.loading_cont.empty();
  }

}