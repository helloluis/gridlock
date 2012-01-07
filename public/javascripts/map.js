var STREETS = [
  // name, orientation, top, left, width, height
  ["amber_right_lane1", "horizontal", 250, 0, 1024, 20 ],
  // ["amber_right_lane2", "horizontal"],
  // ["amber_left_lane1", "horizontal"],
  // ["amber_left_lane2", "horizontal"],
  // ["baker_right", "horizontal"],
  // ["baker_left", "horizontal"],
  // ['chang_right_lane1','vertical'],
  // ['chang_right_lane2','vertical'],
  // ['chang_left_lane1','vertical'],
  // ['chang_left_lane2','vertical'],
  // ['dexter_right_lane1','vertical'],
  // ['dexter_right_lane2','vertical'],
  // ['dexter_left_lane1','vertical'],
  // ['dexter_left_lane2','vertical']
];

var BARRIERS = [
  // name, top, left, width, height
  ['amber_right_barrier1', 250, 230, 20, 50],
  ['amber_right_barrier2', 250, 627, 20, 50]
];
/*

Definitions:

When on a horizontal road, 'right' is the bottom half of the street and 'left' is the top half
When on a vertical road, 'right' is the right half, and 'left' is the left half

*/