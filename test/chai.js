const chai = require('chai')
const chaiFiles = require('chai-files')
const chaiDiff = require('chai-diff')

require('babel-register')

chai.use(chaiFiles)
chai.use(chaiDiff)

chai.config.includeStack = true

global.expect = chai.expect
global.AssertionError = chai.AssertionError
global.Assertion = chai.Assertion
global.assert = chai.assert

global.file = chaiFiles.file
global.dir = chaiFiles.dir
