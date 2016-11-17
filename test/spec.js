/* eslint-disable no-undef, no-unused-expressions */
require('./chai')
require('./helpers')
const path = require('path')

const fixturePath = folder =>
  path.resolve('./test/fixtures', folder)
const compiledMain = (folder, ...subfolders) =>
  path.resolve(fixturePath(folder), 'build', ...subfolders, 'main.js')
const outPath = (folder, ...paths) =>
  path.resolve(fixturePath(folder), 'out', ...paths)

describe('babel-plugin-auto-import', () => {
  before(compilePlugin)

  describe('basic', () => {
    before(() => { compileFixtureOut(fixturePath('basic')) })
    before(() => { compileFixtureBuild(fixturePath('basic')) })

    it('adds imports to the top of main.js', () => {
      const mainFile = file(outPath('basic', 'main.js'))

      expect(mainFile).to.contain("import hello from './hello'")
      expect(mainFile).to.contain("import howdy from './howdy'")
    })

    it('does not add a file to itself', () => {
      const helloFile = file(outPath('basic', 'hello.js'))

      expect(helloFile).to.contain("import howdy from './howdy'")
      expect(helloFile).not.to.contain("import hello from './hello'")
    })

    it('executes', () => {
      expect(compiledMain('basic')).to.executeTo('hello howdy')
    })
  })

  describe('nested', () => {
    before(() => { compileFixtureOut(fixturePath('nested')) })
    before(() => { compileFixtureBuild(fixturePath('nested')) })

    describe('grandchild', () => {
      it('executes', () => {
        expect(compiledMain('nested', 'child', 'grandchild'))
          .to.executeTo('hello howdy child grandchild')
      })
    })

    describe('child', () => {
      const mainFile = file(outPath('nested', 'child', 'main.js'))

      it('contains imports from its own dir', () => {
        expect(mainFile)
          .to.contain("import child from './child'")
      })

      it('contains imports from parent dir', () => {
        expect(mainFile)
          .to.contain("import howdy from '../howdy'")
      })

      it('does not contain grandchild imports', () => {
        expect(mainFile)
          .not.to.contain('grandchild.js')
      })

      it('executes', () => {
        expect(compiledMain('nested', 'child'))
          .to.executeTo('hello howdy child')
      })
    })
  })

  describe('npm_modules', () => {
    before(() => { compileFixtureOut(fixturePath('npm_modules')) })
    before(() => { compileFixtureBuild(fixturePath('npm_modules')) })

    it('executes', () => {
      expect(compiledMain('npm_modules')).to.executeTo('---hello')
    })
  })

  describe('templates', () => {
    before(() => { compileFixtureOut(fixturePath('templates')) })
    before(() => { compileFixtureBuild(fixturePath('templates')) })

    it('executes', () => {
      expect(compiledMain('templates'))
        .to.executeTo('aOne aTwo bOne bTwo cOne cTwo')
    })
  })
})
