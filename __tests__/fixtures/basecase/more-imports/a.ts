import {} from '../imports/a'; // shouldn't loop forever
import {} from '../imports/c'; // should show "c" before "b"

export default "a";