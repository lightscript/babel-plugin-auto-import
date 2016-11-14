import aOne from './a/aOne.js';
import aTwo from './a/aTwo.js';

import * as bOne from './b/bOne.js';
import * as bTwo from './b/bTwo.js';

import { cOne } from './c/cOne.js';
import { cTwo } from './c/cTwo.js';

console.log([aOne(), aTwo(), bOne.bOne(), bTwo.bTwo(), cOne(), cTwo()].join(' '));
