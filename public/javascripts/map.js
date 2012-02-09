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

var MAP_NAME = "manila";

var MAP_WIDTH = 1024;

var MAP_HEIGHT = 768;

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
  car               : { 
      type          : 'car', 
      width         : 20, 
      height        : 40, 
      frustrates_by : 6,
      score         : 1,
      assets        : [ 
        [ 'car2_r.png', 'car2_l.png', 'car2_d.png', 'car2_u.png' ], 
        [ 'taxi_r.png', 'taxi_l.png', 'taxi_d.png', 'taxi_u.png' ], 
      ]
    },
  hatch           : { type : 'hatch',     width : 20, height : 35, frustrates_by : 6, score : 1,
      assets      : [ 'car1_r.png', 'car1_l.png', 'car1_d.png', 'car1_u.png' ] 
    },
  jeepney         : { type : 'jeepney',   width : 20, height : 45, frustrates_by : 5, score : 3,
      assets      : [ 'jeepney_r.png', 'jeepney_l.png', 'jeepney_d.png', 'jeepney_u.png' ] 
    },
  van             : { type : 'van',       width : 20, height : 45, frustrates_by : 4, score : 2,
      assets      : [ 'van_r.png', 'van_l.png', 'van_d.png', 'van_u.png' ] 
    },
  bus             : { type : 'bus',       width : 20, height : 60, frustrates_by : 3, speed : 5, score : 4,
      assets      : [ 'bus_r.png', 'bus_l.png', 'bus_d.png', 'bus_u.png' ] 
    },
  ambulance       : { type : 'ambulance', width : 20, height : 45, frustrates_by : 3, speed : 8, score : 5, 
      assets      : [ 'ambulance_r_anim.png', 'ambulance_l_anim.png', 'ambulance_d_anim.png', 'ambulance_u_anim.png' ],
      animate     : true,
      animation   : { step : 12, frames : 4 },
      sounds      : [ 'ambulance.mp3' ] 
    }
};

var LOADING_CARS = [
  'car2_r.png', 
  'taxi_r.png', 
  'car1_r.png', 
  'jeepney_r.png', 
  'van_r.png', 
  'bus_r.png'
];

var FRUSTRATIONS = [
  // filename, width, height, offset top, offset left
  [ 'frustration_01.png', 40, 40, -20, -25 ],
  [ 'frustration_02.png', 40, 40, -20, -25 ],
  [ 'frustration_03.png', 40, 40, -20, -25 ],
  [ 'frustration_04.png', 40, 40, -20, -25 ]
];

var CAR_ODDS = { 'car' : [1,40], 'hatch' : [41,60], 'van' : [61,75], 'jeepney' : [75,90], 'bus' : [91,99], 'ambulance' : [99,100] };

// in order for the global car odds to go up, a player
// has to hit a certain number of points. we start at 0.3,
// in other words, a car is only half as likely to be spawned
// as "normal".
var CAR_ODD_LEVELS = [
  [ 0,   0.3   ],
  [ 30,  0.5   ],
  [ 60,  0.7   ],
  [ 100, 0.85  ],
  [ 150, 1.0   ]
];

var SOUNDS_DIR = "sounds/";

// all sounds and music
var SOUNDS = { 
  horns_short   : [
    "horn1",
    "horn2",
    "horn3",
    "horn4" 
  ],
  horns_long    : [
    "horn_long1",
    "horn_long2"
  ],
  horn_truck    : "horn_truck",
  countdown     : "countdown",
  theme         : "bg",
  explosion     : "explosion_short",
  frustration   : "frustration",
  arrived       : "kaching"
};

var SOUND_FORMATS = { web : "mp3", ios : "wav", pokki : "ogg" };

var SOUND_SPRITE = "sprite01.mp3";

var SOUND_SPRITE_MAP = {
  'ambulance'    : { start : 0.00, end : 7.3 },
  'theme'        : { start : 8.00, end : 80.0, loop : true },
  'horns_short1' : { start : 81.00, end : 81.8 }
};

var NEIGHBORHOOD = [
  "bg.jpg"
];

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
  "\"When everything's coming your way, you're in the wrong lane.\" ~ Unknown",
  "\"A car is not the only thing that can be recalled by its maker.\" ~ Unknown",
  "Honking means they're getting annoyed at you",
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
  "Ikaw na! Ikaw na ang MMDA!",
  "Fantastic!",
  "You Don't Suck After All!"
];

var OTHERS = [ "bg_polaroid.png", "traffix_logo.png", "bttn_play.png", "bttn_again.png", "explosion.png", "bg_help.jpg" ];


var BOSSES = [
  { time : 45,  score : 10, speed : 4, width : 20, height : 80,  assets : [ "towtruck_r.png", "towtruck_l.png", "towtruck_d.png", "towtruck_u.png" ] },
  { time : 75,  score : 10, speed : 3, width : 20, height : 100, assets : [ "truck_r.png", "truck_l.png", "truck_d.png", "truck_u.png" ] },
  { time : 105, score : 20, speed : 3, width : 20, height : 120, assets : [ "convoy_r.png", "convoy_l.png", "convoy_d.png", "convoy_u.png" ] },
  { time : 135, score : 20, speed : 3, width : 20, height : 120, assets : [ "convoy_r.png", "convoy_l.png", "convoy_d.png", "convoy_u.png" ] },
  { time : 165, score : 20, speed : 3, width : 20, height : 120, assets : [ "convoy_r.png", "convoy_l.png", "convoy_d.png", "convoy_u.png" ] },
  { time : 195, score : 30, speed : 3, width : 20, height : 200, assets : [ "hearse_r.png", "hearse_l.png", "hearse_d.png", "hearse_u.png" ] },
  { time : 225, score : 30, speed : 3, width : 20, height : 200, assets : [ "hearse_r.png", "hearse_l.png", "hearse_d.png", "hearse_u.png" ] },
  { time : 255, score : 30, speed : 3, width : 20, height : 200, assets : [ "hearse_r.png", "hearse_l.png", "hearse_d.png", "hearse_u.png" ] }
];

var TUTORIAL = [
  { time : 1, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 1 },
  { time : 3, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 7 },
  { time : 5, score : 1, speed : 6, assets : CARS.car.assets[0], maker_id : 2 }
];

