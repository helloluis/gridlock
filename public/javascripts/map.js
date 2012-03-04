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


/* DEFAULT MAP CONSTANTS */

var MAP_NAME = "manila";

var MAP_WIDTH = 1024;
var MAP_HEIGHT = 768;
var MAP_COMPACT_WIDTH = 1024;
var MAP_COMPACT_HEIGHT = 600;

var STREETS = [
  // name, orientation, top, left, width, height
  ["amber_left_lane1",   "horizontal",  210,   0,     1024,  20 ],
  ["amber_left_lane2",   "horizontal",  230,   0,     1024,  20 ],
  ["amber_right_lane1",  "horizontal",  260,   0,     1024,  20 ],
  ["amber_right_lane2",  "horizontal",  285,   0,     1024,  20 ],
  ["baker_left",         "horizontal",  512,   0,     1024,  20 ],
  ["baker_right",        "horizontal",  533,   0,     1024,  20 ],
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
  ['amber_right_barrier1',  260, 237, 15, 50, 'horizontal', 'amber chang',   false, "#fff" ],
  ['amber_right_barrier2',  260, 637, 15, 50, 'horizontal', 'amber dexter',  false, "#eee" ],
  ['amber_left_barrier1',   210, 347, 15, 50, 'horizontal', 'amber chang',   false, "#ddd" ],
  ['amber_left_barrier2',   210, 747, 15, 50, 'horizontal', 'amber dexter',  false, "#ccc" ],
  ['baker_right_barrier1',  535, 237, 15, 25, 'horizontal', 'baker chang',   false, "#bbb" ],
  ['baker_right_barrier2',  535, 637, 15, 25, 'horizontal', 'baker dexter',  false, "#aaa" ],
  ['baker_left_barrier1',   510, 347, 15, 25, 'horizontal', 'baker chang',   false, "#999" ],
  ['baker_left_barrier2',   510, 747, 15, 25, 'horizontal', 'baker dexter',  false, "#888" ],
  ['chang_right_barrier1',  308, 310, 50, 15, 'horizontal', 'amber chang',   true,  "#999" ],
  ['chang_right_barrier2',  558, 310, 50, 15, 'horizontal', 'baker chang',   true,  "#aaa" ],
  ['chang_left_barrier1',   195, 253, 50, 15, 'horizontal', 'amber chang',   true,  "#bbb" ],
  ['chang_left_barrier2',   497, 253, 50, 15, 'horizontal', 'baker chang',   true,  "#ccc" ],
  ['dexter_right_barrier1', 308, 710, 50, 15, 'horizontal', 'amber dexter',  true,  "#ddd" ],
  ['dexter_right_barrier2', 558, 710, 50, 15, 'horizontal', 'baker dexter',  true,  "#eee" ],
  ['dexter_left_barrier1',  195, 655, 50, 15, 'horizontal', 'amber dexter',  true,  "#fff" ],
  ['dexter_left_barrier2',  497, 655, 50, 15, 'horizontal', 'baker dexter',  true,  "#eee" ]
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
  [ 'amber chang',  212, 252, 95, 95 ],
  [ 'amber dexter', 212, 652, 95, 95 ],
  [ 'baker chang',  512, 252, 95, 45 ],
  [ 'baker dexter', 512, 652, 95, 45 ],
];


var STREETS_COMPACT = STREETS;

STREETS_COMPACT[0][2]  = 148;
STREETS_COMPACT[1][2]  = 165;
STREETS_COMPACT[2][2]  = 0;
STREETS_COMPACT[3][2]  = 0;
STREETS_COMPACT[4][2]  = 0;
STREETS_COMPACT[5][2]  = 0;
STREETS_COMPACT[6][2]  = 0;
STREETS_COMPACT[7][2]  = 0;
STREETS_COMPACT[8][2]  = 0;
STREETS_COMPACT[9][2]  = 0;
STREETS_COMPACT[10][2] = 0;
STREETS_COMPACT[11][2] = 0;
STREETS_COMPACT[12][2] = 0;
STREETS_COMPACT[13][2] = 0;

var BARRIERS_COMPACT = BARRIERS;

var INTERSECTIONS_COMPACT = INTERSECTIONS;


// we only need 24 fps coz we're third-world that way
var FPS = 24;

// once a Maker hits MAX_CARS_PER_STREET, it stops generating new cars until the user
// has managed to remove some more. 15 is a purely arbitrary number.
var MAX_CARS_PER_STREET = 15;

// the maximum number of pixels a car moves forward per frame
var MAX_SPEED = 8; 

var MAKER_FREQUENCY = 4000;

var IMAGES_DIR = "images/";

// all car types
var CARS = {
  car             : {  type : 'car',      width : 20, height : 40, frustrates_by : 6, score : 1,
      assets      : [ 'car2.png' ] 
    },
  car3            : {  type : 'car3',      width : 20, height : 40, frustrates_by : 6, score : 1,
      assets      : [ 'car3.png' ] 
    },
  taxi            : { type : 'taxi',      width : 20, height : 40, frustrates_by : 5, score : 1,
      assets      : [ 'taxi.png' ] 
    },
  suv             : { type : 'suv',       width : 20, height : 40, frustrates_by : 6, score : 1,
      assets      : [ 'suv.png' ]
    },
  hatch           : { type : 'hatch',     width : 20, height : 35, frustrates_by : 6, score : 1,
      assets      : [ 'car1.png' ] 
    },
  jeepney         : { type : 'jeepney',   width : 20, height : 45, frustrates_by : 5, score : 3,
      assets      : [ 'jeepney.png' ] 
    },
  van             : { type : 'van',       width : 20, height : 45, frustrates_by : 4, score : 2,
      assets      : [ 'van.png' ] 
    },
  bus             : { type : 'bus',       width : 20, height : 60, frustrates_by : 3, speed : 5, score : 4,
      assets      : [ 'bus.png' ] 
    },
  truck_veg       : { type : 'truck_veg', width : 20, height : 40, frustrates_by : 3, speed : 5, score : 3,
      assets      : [ 'truck_veg.png' ] 
    },
  police          : { type : 'police', width : 20, height : 40, frustrates_by : 3, speed : 7, score : 4,
      assets      : [ 'carpolice_r.png', 'carpolice_l.png', 'carpolice_u.png', 'carpolice_d.png' ],
      animating   : true,
      animation   : { step : 6, frames : 5 },
      important   : true,
      sounds      : [ 'police' ]
    },
  firetruck       : { type : 'firetruck', width : 20, height : 40, frustrates_by : 3, speed : 7, score : 4,
      assets      : [ 'firetruck_r.png', 'firetruck_l.png', 'firetruck_u.png', 'firetruck_d.png' ],
      animating   : true,
      animation   : { step : 6, frames : 5 },
      important   : true,
      sounds      : [ 'firetruck' ]
    },
  ambulance       : { type : 'ambulance', width : 20, height : 45, frustrates_by : 3, speed : 8, score : 5, 
      assets      : [ 'ambulance_r.png', 'ambulance_l.png', 'ambulance_u.png', 'ambulance_d.png' ],
      animating   : true,
      animation   : { step : 6, frames : 5 },
      important   : true,
      sounds      : [ 'ambulance' ] 
    }
};

var CAR_SPRITE_LAYOUT = [ "vertical-left", "vertical-right", "horizontal-right", "horizontal-left" ];

var LOADING_CARS = [
  'car', 
  'taxi', 
  'hatch', 
  'jeepney', 
  'van', 
  'bus'
];

// width, height, offset top, offset left
var THOUGHTBUBBLES_DIMENSIONS = [ 40, 40, -25, -25 ];

var THOUGHTBUBBLES_SPRITE = "thoughtbubbles.png";

var THOUGHTBUBBLES = [
   'ambulance',
   'police',
   'firetruck',
   'important',
   'frustration_01',
   'frustration_02',
   'frustration_03',
   'frustration_04'
];

var CAR_ODDS = [  
  [ 'car',       20 ], 
  [ 'car3',      20 ], 
  [ 'taxi',      20 ], 
  [ 'hatch',     20 ], 
  [ 'suv',       15 ], 
  [ 'van',       15 ], 
  [ 'jeepney',   15 ], 
  [ 'bus',       10 ], 
  [ 'truck_veg', 5  ], 
  [ 'ambulance', 1  ], 
  [ 'police',    1  ], 
  [ 'firetruck', 1  ] 
];


// in order for the global car odds to go up, a player
// has to hit a certain number of points. we start at 0.3,
// in other words, a car is only a third as likely to be spawned.
var CAR_ODDS_LEVELS = [
  [ 0,   0.3   ],
  [ 30,  0.5   ],
  [ 60,  0.7   ],
  [ 100, 0.85  ],
  [ 150, 1.0   ]
];

var SOUNDS_DIR    = "sounds/";

// all sounds and music
var SOUNDS = { 
  horns_short_1   : ["horn1",2],
  horns_short_2   : ["horn2",2],
  horns_short_3   : ["horn3",2],
  horns_short_4   : ["horn4",2],
  horns_long_1    : ["horn_long1",2],
  horns_long_2    : ["horn_long2",2],
  horn_truck      : ["horn_truck",1],
  countdown       : ["countdown",1],
  theme           : ["bg",1],
  explosion       : ["explosion_short",1],
  frustration     : ["frustration",1],
  arrived         : ["kaching",8],
  arrived_2       : ["kaching2",2],
  arrived_3       : ["kaching3",1],
  ambulance       : ["ambulance",3],
  hearse          : ["hearse",1],
  police          : ["police",3],
  firetruck       : ["firetruck",3]
};

var SOUND_FORMATS = { web : "mp3", ios : "wav", pokki : "ogg" };

var NEIGHBORHOOD  = [ "bg.jpg" ];

var BUILDINGS     = [ "buildings.png" ];

var COLLISION_MESSAGES = [
  "Y U NO STOP THEM?",
  "Well, that didn't work.",
  "Hmm, let's try that again.",
  "The idea is to prevent collisions, genius.",
  "This isn't a demolition derby.",
  "A bit accident-prone, are we?",
  "BOOM!",
  "KA-BOOOOM!",
  "You like making things explode, huh?",
  "\"Never drive faster than your guardian angel can fly.\"  ~ Unknown",
  "\"Traffic signals in New York are just rough guidelines.\" ~ David Letterman",
  "\"My driving abilities from Mexico have helped me get through Hollywood.\" ~ Salma Hayek",
  "\"Living with a conscience is like driving a car with the brakes on.\" ~ Budd Schulberg",
  "\"Until you've learned to drive, you've never really learned how to swear.\" ~ Robert Paul",
  "\"Baseball is like driving, it's the one who gets home safely that counts.\" ~ Tommy Lasorda",
  "\"It takes 8,460 bolts to assemble an automobile, and one nut to scatter it all over the road.\" ~ Unknown",
  "\"Driving is a spectacular form of amnesia. Everything is to be discovered, everything to be obliterated.\" ~ Jean Baudrillard" 
];

var FRUSTRATION_MESSAGES = [
  "How frustrating!",
  "You disappoint us.",
  "Hmm, let's try that again.",
  "Too slow. Too slow.",
  "Too hard for you?",
  "Fruit Ninja might be a better game for you",
  "Too much time playing PvZ?",
  "\"Safety doesn't happen by accident.\" ~ Unknown",
  "\"When everything's coming your way, you're in the wrong lane.\" ~ Unknown",
  "\"A car is not the only thing that can be recalled by its maker.\" ~ Unknown",
  "\"I'd like to have the flying car, I think that'd be really cool.\" ~ Rupert Grint",
  "Honking means they're getting annoyed at you",
  "\"A suburban mother's role is to deliver children obstetrically once, and by car forever after.\" ~ Peter De Vries",
  "\"Natives who beat drums to drive off evil spirits are objects of scorn to smart Americans who blow horns to break up traffic jams.\"  ~ Mary Ellen Kelly",
  "\"Anywhere from 10% to more than 70% of people in urban traffic are simply looking for parking.\" ~ Tom Vanderbilt",
  "Drivers in one-third of U.S. cities spend more than 40 hours a year (an entire work week) in traffic that is not moving.",
  "The individual cost of road congestion in the US exceeded $900 per driver in 1997, resulting in more than $72 billion in lost wages and wasted fuel.",
  "\"Have you ever noticed that anybody driving slower than you is an idiot, and anyone going faster than you is a maniac?\" ~ George Carlin"
];


var SUCCESS_MESSAGES = [
  "Awesome!",
  "Cool!",
  "Crazy!",
  "Fantastic!",
  "You Don't Suck After All!"
];


var OTHERS = [ 
  "bg_polaroid.png", 
  "traffix_logo.png", 
  "bttn_play.png", 
  "bttn_again.png", 
  "explosion.png", 
  "bg_help.jpg" 
];


var BOSSES = {

  towtruck    : { 
    boss      : true, 
    type      : 'towtruck', 
    score     : 10, 
    speed     : 4, 
    width     : 20, 
    height    : 80,  
    important : true, 
    sounds    : [], 
    assets    : [ "towtruck.png" ] },

  truck       : { 
    boss      : true, 
    type      : 'truck',    
    score     : 10, 
    speed     : 3, 
    width     : 20, 
    height    : 100, 
    important : true, 
    sounds    : [ 'horn_truck' ], 
    assets    : [ "truck.png" ] },

  convoy      : { 
    boss      : true, 
    type      : 'convoy',   
    score     : 20, 
    speed     : 3, 
    width     : 20, 
    height    : 120, 
    important : true, 
    animating : true, 
    animation : { step : 6, frames : 4 }, 
    sounds    : [], 
    assets    : [ "convoy_r.png", 
                  "convoy_l.png", 
                  "convoy_u.png", 
                  "convoy_d.png" ] },

  transport   : { 
    boss      : true, 
    type      : 'transport', 
    score     : 30, 
    speed     : 3, 
    width     : 20, 
    height    : 150, 
    important : true, 
    sounds    : [ 'horn_truck' ], 
    assets    : [ "transporter.png" ] },

  hearse      : { 
    boss      : true, 
    type      : 'hearse',   
    score     : 50, 
    speed     : 2, 
    width     : 20, 
    height    : 200, 
    important : true, 
    interrupt_all_sounds : true, 
    animating : true, 
    animation : { step : 2, frames : 24 },
    sounds    : [ 'hearse' ], 
    assets    : [ "hearse_r.png", 
                  "hearse_l.png", 
                  "hearse_d.png", 
                  "hearse_u.png" ] 
  }

};

// var BOSS_SEQUENCE = [
//   [ 'towtruck',  15 ],
//   [ 'truck',     25 ],
//   [ 'convoy',    35 ],
//   [ 'transport', 45 ],
//   [ 'hearse',    55 ]
// ];

var BOSS_SEQUENCE = [
  [ 'towtruck',  45  ],
  [ 'truck',     75  ],
  [ 'truck',     105 ],
  [ 'convoy',    135 ],
  [ 'convoy',    165 ],
  [ 'transport', 195 ],
  [ 'convoy',    225 ],
  [ 'hearse',    255 ],
  [ 'towtruck',  300 ],
  [ 'convoy',    315 ],
  [ 'truck',     330 ],
  [ 'transport', 345 ],
  [ 'towtruck',  360 ],
  [ 'truck',     375 ],
  [ 'convoy',    390 ],
  [ 'truck',     410 ],
  [ 'transport', 425 ],
  [ 'towtruck',  440 ],
  [ 'truck',     455 ],
  [ 'convoy',    470 ],
  [ 'transport', 485 ],
  [ 'hearse',    500 ],
  [ 'convoy',    515 ],
  [ 'towtruck',  530 ],
  [ 'truck',     545 ],
  [ 'convoy',    560 ],
  [ 'transport', 575 ],
  [ 'truck',     590 ],
  [ 'convoy',    605 ]
];

// TODO
// var TUTORIAL = [
//   { time : 1, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 1 },
//   { time : 3, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 7 },
//   { time : 5, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 2 }
// ];

/* END DEFAULT MAP CONSTANTS */


/*********************************************************************************/
//
// WIP: We're placing all the game variables into a Map object so we can easily
// switch when we want to give people a different set of gameplay settings
//
/*********************************************************************************/

var LEVEL_1 = {
  id                    : 'easy',
  name                  : 'novice',
  streets               : STREETS,
  barriers              : BARRIERS,
  intersections         : INTERSECTIONS,
  streets_compact       : STREETS_COMPACT,
  barriers_compact      : BARRIERS_COMPACT,
  intersections_compact : INTERSECTIONS_COMPACT,
  stoplights            : STOPLIGHTS,

  cars                  : CARS,
  bosses                : BOSSES,
  boss_sequence         : BOSS_SEQUENCE,
  neighborhood          : NEIGHBORHOOD,
  buildings             : BUILDINGS,
    
  locked                : false,
  max_cars_per_street   : MAX_CARS_PER_STREET,
  max_speed             : MAX_SPEED,
  maker_frequency       : MAKER_FREQUENCY,
  icon                  : "map_level_1.png",
  
  car_odds              : CAR_ODDS,
  car_odds_levels       : CAR_ODDS_LEVELS
};

var LEVEL_2 = _.extend(LEVEL_1, {}, true);

var LEVEL_3 = _.extend(LEVEL_1, {}, true);

var LEVELS = [ LEVEL_1, LEVEL_2, LEVEL_3 ];
