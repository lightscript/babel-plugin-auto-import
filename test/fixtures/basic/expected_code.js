import hello from './hello';
import howdy from './howdy';

export default function main() {
  return hello() + howdy();
}
console.log(main());
