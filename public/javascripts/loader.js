Loader = {

  field    : $("#loader"),
  interval : 1000,

  start : function( completed_callback ) {
    
    var s = this, i = 0;

    s.completed_callback = completed_callback;

    s.start_preloading();

    if (s.loaded_images < s.images.length) {
      
      s.initialize_lemniscates();  

      s.field.
        everyTime(this.interval, 'stars', function(){
          if (i < s.max_loops && s.loaded_images < s.images.length) {
            // DO SOMETHING
          } else {
            s.everything_loaded();
          }
        });

    } else {
      
      s.everything_loaded();

    }

  },

  start_preloading : function(  ){
    
    var self = this;

    var preloader = $("<div></div>").
      css({ height   : "0px",
            width    : "0px",
            overflow : "hidden"
      }).
      appendTo(this.field);

    for (var i = 0; i < this.images.length; i++) {
        $("<img/>")
          .unbind("load")
          .unbind("readystatechange")
          .bind("load readystatechange", function(){ self.loaded_callback(); })
          .attr("src", this.images[i])
          .appendTo($(preloader));
      }

  },

  loaded_callback: function () {
    if ( this.force_loading===false ){
      this.loaded_images += 1;  
    }
  },

  get_images: function (selector) {

    var self = this;
    
    var everything = $(selector).find("img,div,span").each(function () {
      var url = "";
    
      if ($(this).css("background-image") != "none") {
        var url = $(this).css("background-image");
      } else if (typeof($(this).attr("src")) != "undefined") {
        var url = $(this).attr("src");
      }
    
      url = url.replace("url(\"", "");
      url = url.replace("url(", "");
      url = url.replace("\")", "");
      url = url.replace(")", "");
      
      if (url.length > 0) {
        self.images.push(url);
      }
    });

    debug.log(self.images);
    
  },

  everything_loaded : function() {
    
    this.completed = true;
    if (this.completed_callback!==undefined) {
      this.completed_callback.call();
    }

  }
};