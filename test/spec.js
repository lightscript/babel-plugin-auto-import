/* eslint-disable no-undef, no-unused-expressions, no-underscore-dangle */
const path = require('path')
const fs = require('fs')
const babel = require('babel-core')
const { spawnSync } = require('child_process')

const pluginPath = require.resolve('../src')

const diffOpts = {
  relaxedSpace: true,
  context: 2,
}


Assertion.addMethod('compileTo', function compileTo(expectedPath) {
  const inputPath = this._obj

  const expectedCode = fs.readFileSync(expectedPath, 'utf-8')
  const output = babel.transformFileSync(inputPath, {
    plugins: [pluginPath],
  })

  expect(output.code).not.differentFrom(expectedCode, diffOpts)
})

Assertion.addMethod('executeTo', function executeTo(expected) {
  const compiledPath = this._obj

  const { stdout, stderr } = spawnSync('babel-node', [
    '--plugins', 'transform-es2015-modules-commonjs',
    compiledPath,
  ])

  expect(stderr.toString()).to.be.empty
  expect(stdout.toString()).not.differentFrom(expected, diffOpts)
})

describe('basic', () => {
  const input = path.resolve('./test/fixtures/basic/input.js')
  const expected = path.resolve('./test/fixtures/basic/expected.js')

  it('compiles', () => {
    expect(input).to.compileTo(expected)
  })

  it('executes', () => {
    expect(expected).to.executeTo('hello howdy')
  })
})

describe('nested', () => {
  describe('grandchild', () => {
    const input = path.resolve('./test/fixtures/nested/child/grandchild/input.js')
    const expected = path.resolve('./test/fixtures/nested/child/grandchild/expected.js')

    it('compiles', () => {
      expect(input).to.compileTo(expected)
    })

    it('executes', () => {
      expect(expected).to.executeTo('hello howdy child grandchild')
    })
  })

  describe('child', () => {
    const input = path.resolve('./test/fixtures/nested/child/input.js')
    const expected = path.resolve('./test/fixtures/nested/child/expected.js')

    it('compiles', () => {
      expect(input).to.compileTo(expected)
    })

    it('executes', () => {
      expect(expected).to.executeTo('hello howdy child')
    })
  })
})
