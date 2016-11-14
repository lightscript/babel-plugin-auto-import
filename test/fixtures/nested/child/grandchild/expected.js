import hello from '../../hello';
import howdy from '../../howdy';
import child from '../child';
import grandchild from './grandchild';

console.log([hello(), howdy(), child(), grandchild()].join(' '));
