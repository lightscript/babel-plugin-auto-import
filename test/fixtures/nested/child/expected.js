import hello from '../hello';
import howdy from '../howdy';
import child from './child';

console.log([hello(), howdy(), child()].join(' '));
