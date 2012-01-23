// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/1b7ad40ac54224a2771999b12627d2db 
// Or build this file again with packager using: packager build More/Request.JSONP More/Assets
/*
---
copyrights:
  - [MooTools](http://mootools.net)

licenses:
  - [MIT License](http://mootools.net/license.txt)
...
*/
MooTools.More={version:"1.4.0.1",build:"a4244edf2aa97ac8a196fc96082dd35af1abab87"};Request.JSONP=new Class({Implements:[Chain,Events,Options],options:{onRequest:function(a){if(this.options.log&&window.console&&console.log){console.log("JSONP retrieving script with url:"+a);
}},onError:function(a){if(this.options.log&&window.console&&console.warn){console.warn("JSONP "+a+" will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs");
}},url:"",callbackKey:"callback",injectScript:document.head,data:"",link:"ignore",timeout:0,log:false},initialize:function(a){this.setOptions(a);},send:function(c){if(!Request.prototype.check.call(this,c)){return this;
}this.running=true;var d=typeOf(c);if(d=="string"||d=="element"){c={data:c};}c=Object.merge(this.options,c||{});var e=c.data;switch(typeOf(e)){case"element":e=document.id(e).toQueryString();
break;case"object":case"hash":e=Object.toQueryString(e);}var b=this.index=Request.JSONP.counter++;var f=c.url+(c.url.test("\\?")?"&":"?")+(c.callbackKey)+"=Request.JSONP.request_map.request_"+b+(e?"&"+e:"");
if(f.length>2083){this.fireEvent("error",f);}Request.JSONP.request_map["request_"+b]=function(){this.success(arguments,b);}.bind(this);var a=this.getScript(f).inject(c.injectScript);
this.fireEvent("request",[f,a]);if(c.timeout){this.timeout.delay(c.timeout,this);}return this;},getScript:function(a){if(!this.script){this.script=new Element("script",{type:"text/javascript",async:true,src:a});
}return this.script;},success:function(b,a){if(!this.running){return;}this.clear().fireEvent("complete",b).fireEvent("success",b).callChain();},cancel:function(){if(this.running){this.clear().fireEvent("cancel");
}return this;},isRunning:function(){return !!this.running;},clear:function(){this.running=false;if(this.script){this.script.destroy();this.script=null;
}return this;},timeout:function(){if(this.running){this.running=false;this.fireEvent("timeout",[this.script.get("src"),this.script]).fireEvent("failure").cancel();
}return this;}});Request.JSONP.counter=0;Request.JSONP.request_map={};var Asset={javascript:function(d,b){if(!b){b={};}var a=new Element("script",{src:d,type:"text/javascript"}),e=b.document||document,c=b.onload||b.onLoad;
delete b.onload;delete b.onLoad;delete b.document;if(c){if(typeof a.onreadystatechange!="undefined"){a.addEvent("readystatechange",function(){if(["loaded","complete"].contains(this.readyState)){c.call(this);
}});}else{a.addEvent("load",c);}}return a.set(b).inject(e.head);},css:function(d,a){if(!a){a={};}var b=new Element("link",{rel:"stylesheet",media:"screen",type:"text/css",href:d});
var c=a.onload||a.onLoad,e=a.document||document;delete a.onload;delete a.onLoad;delete a.document;if(c){b.addEvent("load",c);}return b.set(a).inject(e.head);
},image:function(c,b){if(!b){b={};}var d=new Image(),a=document.id(d)||new Element("img");["load","abort","error"].each(function(e){var g="on"+e,f="on"+e.capitalize(),h=b[g]||b[f]||function(){};
delete b[f];delete b[g];d[g]=function(){if(!d){return;}if(!a.parentNode){a.width=d.width;a.height=d.height;}d=d.onload=d.onabort=d.onerror=null;h.delay(1,a,a);
a.fireEvent(e,a,1);};});d.src=a.src=c;if(d&&d.complete){d.onload.delay(1);}return a.set(b);},images:function(c,b){c=Array.from(c);var d=function(){},a=0;
b=Object.merge({onComplete:d,onProgress:d,onError:d,properties:{}},b);return new Elements(c.map(function(f,e){return Asset.image(f,Object.append(b.properties,{onload:function(){a++;
b.onProgress.call(this,a,e,f);if(a==c.length){b.onComplete();}},onerror:function(){a++;b.onError.call(this,a,e,f);if(a==c.length){b.onComplete();}}}));
}));}};



/**
 * @preserve Class for loading assets (images, sound, video, json, jsonp, javascript, css)
 * Provides an x out of y value and a percentage on progress
 * And lets you know when everything is done
 * Great for preloading all game assets
 * 
 * Requires MooTools and MooTools More (Assets, Reqest.JSONP)
 * 
 * Copyright Oliver Caldwell 2011 (olivercaldwell.co.uk)
 */
var Preloader = new Class({
	Implements: [Options, Events],
	options: {
		images: {},
		sounds: {},
		videos: {},
		json: {},
		jsonp: {},
		scripts: {},
		stylesheets: {}
	},
	initialize: function(options) {
		this.setOptions(options);
	},
	load: function() {
		// Initialise variables
		var assetCount = 0,
			completedCount = 0,
			startTime = new Date().getTime(),
			loaded = {
				images: {},
				sounds: {},
				videos: {},
				json: {},
				jsonp: {},
				scripts: {},
				stylesheets: {}
			},
			handleProgress = function() {
				completedCount += 1;
				this.fireEvent('progress', [completedCount, assetCount, 100 / assetCount * completedCount]);

				if(completedCount === assetCount) {
					this.fireEvent('complete', [loaded, assetCount, new Date().getTime() - startTime]);
				}
			}.bind(this);

		// Fire the start event
		this.fireEvent('start', [assetCount]);

		// Count all items
		Object.each(this.options, function(assetObject) {
			assetCount += Object.getLength(assetObject);
		});

		// Load images
		Object.each(this.options.images, function(path, name) {
			loaded.images[name] = Asset.image(path, {
				onLoad: handleProgress
			});
		});

		// Load sounds
		Object.each(this.options.sounds, function(path, name) {
			loaded.sounds[name] = new Element('audio');
			loaded.sounds[name].addEventListener('canplaythrough', handleProgress, false);
			loaded.sounds[name].set('src', path);
			loaded.sounds[name].load();
		});

		// Load videos
		Object.each(this.options.videos, function(path, name) {
			loaded.videos[name] = new Element('video');
			loaded.videos[name].addEventListener('canplaythrough', handleProgress, false);
			loaded.videos[name].set('src', path);
			loaded.videos[name].load();
		});

		// Load JSON
		Object.each(this.options.json, function(settings, name) {
			var request = new Request.JSON((typeof settings === 'object') ? settings : {url:settings});

			request.addEvent('success', function(loadedJson) {
					loaded.json[name] = loadedJson;
					handleProgress();
			});

			request.send();
		});

		// Load JSONP
		Object.each(this.options.jsonp, function(settings, name) {
			var request = new Request.JSONP((typeof settings === 'object') ? settings : {url:settings});

			request.addEvent('success', function(loadedJson) {
					loaded.jsonp[name] = loadedJson;
					handleProgress();
			});

			request.send();
		});

		// Load scripts
		Object.each(this.options.scripts, function(path, name) {
			loaded.scripts[name] = Asset.javascript(path, {
				onLoad: handleProgress
			});
		});

		// Load stylesheets
		Object.each(this.options.stylesheets, function(path, name) {
			loaded.stylesheets[name] = Asset.css(path);
			handleProgress();
		});
	}
});