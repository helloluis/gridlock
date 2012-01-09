/*
 * jSwipe - jQuery Plugin
 * http://plugins.jquery.com/project/swipe
 * http://ryanscherf.com/demos/swipe/
 *
 * Copyright (c) 2009 Ryan Scherf <http://ryanscherf.com/>
 * Modified by Mathias Bynens <http://mathiasbynens.be/>
 * Modified by Karl Swedberg <http://learningjquery.com/>
 * Licensed under the MIT license
 *
 * $Date: 2011-05-25 (Wed, 25 May 2011) $
 * $version: 0.2.2
 *
 * This jQuery plugin will work on any device that supports touch events,
 * while degrading gracefully (without throwing errors) on others.
 */
(function($) {

	$.fn.swipe = function(options) {

		// Default thresholds & swipe functions
		options = $.extend(true, {}, $.fn.swipe.options, options);

		return this.each(function() {

			var self = this,
                            originalCoord = { 'x': 0, 'y': 0 },
			    finalCoord = { 'x': 0, 'y': 0 };

			// Screen touched, store the initial coordinates
			function touchStart(event) {
				var touch = event.originalEvent.targetTouches[0];
				originalCoord.x = touch.pageX;
				originalCoord.y = touch.pageY;
			}

			// Store coordinates as finger is swiping
			function touchMove(event) {
				var touch = event.originalEvent.targetTouches[0];
				finalCoord.x = touch.pageX; // Updated X,Y coordinates
				finalCoord.y = touch.pageY;
				event.preventDefault();
			}

			// Done swiping
			// Swipe should only be on X axis, ignore if swipe on Y axis
			// Calculate if the swipe was left or right
			function touchEnd() {
				var changeY = originalCoord.y - finalCoord.y,
				    changeX,
				    threshold = options.threshold,
				    y = threshold.y,
				    x = threshold.x;
				if (changeY < y && changeY > (- y)) {
					changeX = originalCoord.x - finalCoord.x;
					if (changeX > x) {
						options.swipeLeft.call(self);
					} else if (changeX < (- x)) {
						options.swipeRight.call(self);
					}
				}
			}

			// Swipe was canceled
			function touchCancel() {
				//console.log('Canceling swipe gesture…')
			}

			// Add gestures to all swipable areas
			$(self).bind({
				'touchstart.swipe': touchStart,
				'touchmove.swipe': touchMove,
				'touchend.swipe': touchEnd,
				'touchcancel.swipe': touchCancel
			});

		});

	};

	$.fn.swipe.options = {
		'threshold': {
			'x': 30,
			'y': 10
		},
		'swipeLeft': function() {
			alert('swiped left');
		},
		'swipeRight': function() {
			alert('swiped right');
		}
	};

}(jQuery));