var STREETS = [
  // name, orientation, top, left, width, height
  ["amber_right_lane1",  "horizontal",  250,   0,     1024,  20 ],
  ["amber_right_lane2",  "horizontal",  275,   0,     1024,  20 ],
  ["amber_left_lane1",   "horizontal",  202,   0,     1024,  20 ],
  ["amber_left_lane2",   "horizontal",  225,   0,     1024,  20 ],
  ["baker_right",        "horizontal",  528,   0,     1024,  20 ],
  ["baker_left",         "horizontal",  505,   0,     1024,  20 ],
  ['chang_right_lane1',  "vertical",    0,     308,   768,   20 ],
  ['chang_right_lane2',  "vertical",    0,     329,   768,   20 ],
  ['chang_left_lane1',   "vertical",    0,     253,   768,   20 ],
  ['chang_left_lane2',   "vertical",    0,     276,   768,   20 ],
  ['dexter_right_lane1', "vertical",    0,     706,   768,   20 ],
  ['dexter_right_lane2', "vertical",    0,     728,   768,   20 ],
  ['dexter_left_lane1',  "vertical",    0,     653,   768,   20 ],
  ['dexter_left_lane2',  "vertical",    0,     676,   768,   20 ]
];

var BARRIERS = [
  // name, top, left, width, height
  ['amber_right_barrier1',  250, 232, 20, 50, 'horizontal', 'amber chang',   false, "#fff" ],
  ['amber_right_barrier2',  250, 632, 20, 50, 'horizontal', 'amber dexter',  false, "#eee" ],
  ['amber_left_barrier1',   200, 347, 20, 50, 'horizontal', 'amber chang',   false, "#ddd" ],
  ['amber_left_barrier2',   200, 747, 20, 50, 'horizontal', 'amber dexter',  false, "#ccc" ],
  ['baker_right_barrier1',  525, 232, 20, 25, 'horizontal', 'baker chang',   false, "#bbb" ],
  ['baker_right_barrier2',  525, 632, 20, 25, 'horizontal', 'baker dexter',  false, "#aaa" ],
  ['baker_left_barrier1',   498, 347, 20, 25, 'horizontal', 'baker chang',   false, "#999" ],
  ['baker_left_barrier2',   498, 747, 20, 25, 'horizontal', 'baker dexter',  false, "#888" ],
  ['chang_right_barrier1',  300, 305, 50, 20, 'horizontal', 'amber chang',   true,  "#999" ],
  ['chang_right_barrier2',  550, 305, 50, 20, 'horizontal', 'baker chang',   true,  "#aaa" ],
  ['chang_left_barrier1',   180, 253, 50, 20, 'horizontal', 'amber chang',   true,  "#bbb" ],
  ['chang_left_barrier2',   487, 253, 50, 20, 'horizontal', 'baker chang',   true,  "#ccc" ],
  ['dexter_right_barrier1', 300, 705, 50, 20, 'horizontal', 'amber dexter',  true,  "#ddd" ],
  ['dexter_right_barrier2', 550, 705, 50, 20, 'horizontal', 'baker dexter',  true,  "#eee" ],
  ['dexter_left_barrier1',  180, 655, 50, 20, 'horizontal', 'amber dexter',  true,  "#fff" ],
  ['dexter_left_barrier2',  487, 655, 50, 20, 'horizontal', 'baker dexter',  true,  "#eee" ]
];

// intersections from left to right, top to bottom
var INTERSECTIONS = [
  // [ horizontal barriers ], [ vertical_barriers ]
  [ [ 'amber_right_barrier1', 'amber_left_barrier1' ], ['chang_right_barrier1',  'chang_left_barrier1'] ],
  [ [ 'amber_right_barrier2', 'amber_left_barrier2' ], ['dexter_right_barrier1', 'dexter_left_barrier1'] ],
  [ [ 'baker_right_barrier1', 'amber_left_barrier1' ], ['chang_right_barrier2',  'chang_left_barrier2'] ],
  [ [ 'baker_right_barrier2', 'amber_left_barrier2' ], ['dexter_right_barrier2', 'dexter_left_barrier2'] ],
];
/*

Definitions:

When on a horizontal road, 'right' is the bottom half of the street and 'left' is the top half
When on a vertical road, 'right' is the right half, and 'left' is the left half

*/