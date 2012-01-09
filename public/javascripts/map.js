/*

A Definition of Terms:

We're modelling a left-hand drive system here, so:
When on a horizontal road, 'right' refers to the bottom half of the street and 'left' is the top half.
When on a vertical road, 'right' is the right half, and 'left' is the left half. This implies that the
lefthand vertical road is going downwards, while the righthand side goes upwards.

Furthermore, roads are divided into lanes (not always, but generally). Each lane is treated as a separate
entity, and manages its cars independently of all other lanes. In the STREETS array, we have names like
'amber_right_lane1' and 'amber_right_lane2'. These are lanes that are right next to each other on the 
righthand side of Amber St.

We do this because it's computationally simpler to check for collisions on a lane-by-lane basis 
rather than across an entire street (which may or may not have more than one lane).

Each STREET has a Maker object attached to it offscreen. The Maker generates new cars to send down the
street every (Gamer.maker_freq) seconds. The car to be generated is decided by a randomizer, 
according to the cars odds defined in the CARS array.

BARRIERS are our invisible obstacles that can be toggled by user action. Once a barrier is active,
any car colliding with it will come to a stop. In some instances, a car will already be partially 
passed a BARRIER when it comes up. The car will stop as long as any part of it overlaps with the
BARRIER, in which case a situation occurs where the car is in a potentially Game-ending position. 
(See INTERSECTIONS below.)

STOPLIGHTS are the actual user controls. Each stoplight toggles a handful of BARRIERs, activating
either a horizontal set of barriers or a vertical one. It's impossible to turn all barriers off at once,
you can only toggle between horizontals and verticals.

INTERSECTIONS are hotspots for collision detection. When a car enters an intersection, we start
aggressively calculating for collisions with any other cars from a different street. 
Game-ending collisions can only occur within an INTERSECTION; it's impossible for the game to end by 
a car bumping into another car on the same street.

*/

var STREETS = [
  // name, orientation, top, left, width, height
  ["amber_left_lane1",   "horizontal",  200,   0,     1024,  20 ],
  ["amber_left_lane2",   "horizontal",  220,   0,     1024,  20 ],
  ["amber_right_lane1",  "horizontal",  250,   0,     1024,  20 ],
  ["amber_right_lane2",  "horizontal",  275,   0,     1024,  20 ],
  ["baker_left",         "horizontal",  502,   0,     1024,  20 ],
  ["baker_right",        "horizontal",  523,   0,     1024,  20 ],
  ['chang_left_lane1',   "vertical",    0,     253,   20,    768 ],
  ['chang_left_lane2',   "vertical",    0,     276,   20,    768 ],
  ['chang_right_lane1',  "vertical",    0,     306,   20,    768 ],
  ['chang_right_lane2',  "vertical",    0,     327,   20,    768 ],
  ['dexter_left_lane1',  "vertical",    0,     653,   20,    768 ],
  ['dexter_left_lane2',  "vertical",    0,     676,   20,    768 ],
  ['dexter_right_lane1', "vertical",    0,     706,   20,    768 ],
  ['dexter_right_lane2', "vertical",    0,     728,   20,    768 ]
];


var BARRIERS = [
  // name, top, left, width, height
  ['amber_right_barrier1',  250, 237, 15, 50, 'horizontal', 'amber chang',   false, "#fff" ],
  ['amber_right_barrier2',  250, 637, 15, 50, 'horizontal', 'amber dexter',  false, "#eee" ],
  ['amber_left_barrier1',   200, 347, 15, 50, 'horizontal', 'amber chang',   false, "#ddd" ],
  ['amber_left_barrier2',   200, 747, 15, 50, 'horizontal', 'amber dexter',  false, "#ccc" ],
  ['baker_right_barrier1',  525, 237, 15, 25, 'horizontal', 'baker chang',   false, "#bbb" ],
  ['baker_right_barrier2',  525, 637, 15, 25, 'horizontal', 'baker dexter',  false, "#aaa" ],
  ['baker_left_barrier1',   500, 347, 15, 25, 'horizontal', 'baker chang',   false, "#999" ],
  ['baker_left_barrier2',   500, 747, 15, 25, 'horizontal', 'baker dexter',  false, "#888" ],
  ['chang_right_barrier1',  295, 310, 50, 15, 'horizontal', 'amber chang',   true,  "#999" ],
  ['chang_right_barrier2',  545, 310, 50, 15, 'horizontal', 'baker chang',   true,  "#aaa" ],
  ['chang_left_barrier1',   190, 253, 50, 15, 'horizontal', 'amber chang',   true,  "#bbb" ],
  ['chang_left_barrier2',   487, 253, 50, 15, 'horizontal', 'baker chang',   true,  "#ccc" ],
  ['dexter_right_barrier1', 295, 710, 50, 15, 'horizontal', 'amber dexter',  true,  "#ddd" ],
  ['dexter_right_barrier2', 545, 710, 50, 15, 'horizontal', 'baker dexter',  true,  "#eee" ],
  ['dexter_left_barrier1',  190, 655, 50, 15, 'horizontal', 'amber dexter',  true,  "#fff" ],
  ['dexter_left_barrier2',  487, 655, 50, 15, 'horizontal', 'baker dexter',  true,  "#eee" ]
];


// stoplights from left to right, top to bottom
var STOPLIGHTS = [
  // [ horizontal barriers ], [ vertical_barriers ]
  [ [ 'amber_right_barrier1', 'amber_left_barrier1' ], ['chang_right_barrier1',  'chang_left_barrier1']  ],
  [ [ 'amber_right_barrier2', 'amber_left_barrier2' ], ['dexter_right_barrier1', 'dexter_left_barrier1'] ],
  [ [ 'baker_right_barrier1', 'baker_left_barrier1' ], ['chang_right_barrier2',  'chang_left_barrier2']  ],
  [ [ 'baker_right_barrier2', 'baker_left_barrier2' ], ['dexter_right_barrier2', 'dexter_left_barrier2'] ],
];


// intersections from left to right, top to bottom
var INTERSECTIONS = [
  [ 'amber chang',  202, 252, 95, 95 ],
  [ 'amber dexter', 202, 652, 95, 95 ],
  [ 'baker chang',  502, 252, 95, 45 ],
  [ 'baker dexter', 502, 652, 95, 45 ],
];


// once a Maker hits MAX_CARS_PER_STREET, it stops generating new cars until the user
// has managed to remove some more. 8 is a purely arbitrary number.
var MAX_CARS_PER_STREET = 10;

var MAKER_FREQUENCY = 5000;

var IMAGES_DIR = "images/";

// all car types
var CARS = {
  car         : { 
    type      : 'car', 
    width     : 20, 
    height    : 35, 
    frustrates_by : 7,
    assets    : [ 
      [ 'car_orange_horizontal.png', 'car_orange_horizontal_left.png', 'car_orange.png', 'car_orange_bottom.png' ], 
      [ 'car_yellow_horizontal.png', 'car_yellow_horizontal_left.png', 'car_yellow.png', 'car_yellow_bottom.png' ], 
    ]
  },
  jeepney     : { type : 'jeepney',   width : 20, height : 45, frustrates_by : 5, 
       assets : [ 'jeepney_horizontal.png', 'jeepney_horizontal_left.png', 'jeepney.png', 'jeepney_bottom.png' ] },
  van         : { type : 'van',       width : 20, height : 50, frustrates_by : 5, 
       assets : [ 'van_horizontal.png', 'van_horizontal_left.png', 'van.png', 'van_bottom.png' ] },
  bus         : { type : 'bus',       width : 20, height : 55, frustrates_by : 4,   
       assets : [ 'bus_horizontal.png', 'bus_horizontal_left.png', 'bus.png', 'bus_bottom.png' ]   },
  ambulance   : { type : 'ambulance', width : 20, height : 40, frustrates_by : 4, speed : 5,  
       assets : [ 'ambulance_horizontal.png', 'ambulance_horizontal_left.png', 'ambulance.png', 'ambulance_bottom.png' ],
       sounds : [ 'ambulance.mp3' ] }
};

var FRUSTRATIONS = [
  // filename, width, height, offset top, offset left
  [ 'frustration_01.png', 40, 40, -20, -25 ],
  [ 'frustration_02.png', 40, 40, -20, -25 ],
  [ 'frustration_03.png', 40, 40, -20, -25 ],
  [ 'frustration_04.png', 40, 40, -20, -25 ]
];

var CAR_ODDS = { 'car' : 0.6, 'van' : 0.2, 'jeepney' : 0.15, 'bus' : 0.04, 'ambulance' : 0.01 };

var SOUNDS_DIR = "sounds/";

// all sounds and music
var SOUNDS = { 
  horns_short   : [
    "sounds/horn1.mp3",
    "sounds/horn2.mp3",
    "sounds/horn3.mp3",
    "sounds/horn4.mp3" 
  ],
  horns_long    : [
    "sounds/horn_long1.mp3",
    "sounds/horn_long2.mp3"
  ],
  horn_truck    : "sounds/horn_truck.mp3",
  countdown     : "sounds/countdown.mp3",
  theme         : "sounds/bg.mp3",
  explosion     : "sounds/explosion_short.mp3"
};
