autoloading
javascript


import React from 'react'
import _ from 'lodash'
import TheThing, * as Thing from 'something'
import { someMethod, anotherMethod } from './whatever'
import * as util from './util'
import $ from 'jquery'

// templates
import _$1_ from 'components/*'
import _$1_Page from 'components/pages/*'
import _$1__$2_Page from 'components/app/*/pages/*'


TODO

- [x] sibling .imports file
- [x] root directory .imports file
- [x] combine recursive .imports files
- [ ] node_modules
- [ ] templates with *
- [ ] sourcemaps
- [ ] ignore option
