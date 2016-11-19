autoloading
javascript

```js
import React from 'react'
import _ from 'lodash'
import TheThing, * as Thing from 'something'
import { someMethod, anotherMethod } from './whatever'
import * as util from './util'
import $ from 'jquery'

// templates
import _$1_ from 'components/*'
import _$2_Page from 'components/pages/*'
import * as _$3_ from 'blah/*'
import { _$4_ } from 'foo/**/*.js'
```

TODO

- [ ] ignore option
- [ ] inherit/extend npm package
