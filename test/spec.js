/* eslint-disable no-undef, no-unused-expressions */
require('./chai')
require('./helpers')
const path = require('path')

const inputPath = folder =>
  path.resolve('./test/fixtures', folder, 'input.js')
const expectedPath = folder =>
  path.resolve('./test/fixtures', folder, 'expected.js')

describe('basic', () => {
  const input = inputPath('basic')
  const expected = expectedPath('basic')

  it('compiles', () => {
    expect(input).to.compileTo(expected)
  })

  it('executes', () => {
    expect(expected).to.executeTo('hello howdy')
  })
})

describe('nested', () => {
  describe('grandchild', () => {
    const input = inputPath('nested/child/grandchild')
    const expected = expectedPath('nested/child/grandchild')

    it('compiles', () => {
      expect(input).to.compileTo(expected)
    })

    it('executes', () => {
      expect(expected).to.executeTo('hello howdy child grandchild')
    })
  })

  describe('child', () => {
    const input = inputPath('nested/child')
    const expected = expectedPath('nested/child')

    it('compiles', () => {
      expect(input).to.compileTo(expected)
    })

    it('executes', () => {
      expect(expected).to.executeTo('hello howdy child')
    })
  })
})

describe('npm_modules', () => {
  const input = inputPath('npm_modules')
  const expected = expectedPath('npm_modules')

  it('compiles', () => {
    expect(input).to.compileTo(expected)
  })

  it('executes', () => {
    expect(expected).to.executeTo('---hello')
  })
})

describe('templates', () => {
  const input = inputPath('templates')
  const expected = expectedPath('templates')

  it('compiles', () => {
    expect(input).to.compileTo(expected)
  })

  it('executes', () => {
    expect(expected).to.executeTo('aOne aTwo bOne bTwo cOne cTwo')
  })
})
