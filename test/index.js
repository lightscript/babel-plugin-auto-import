/* eslint-disable no-console */
const babel = require('babel-core')
const chalk = require('chalk')
const clear = require('clear')
const diff = require('diff')
const fs = require('fs')
const path = require('path')
const watch = require('watch')
// const modulesPlugin = require('babel-plugin-transform-es2015-modules-commonjs')

require('babel-register')

const pluginPath = require.resolve('../src')

const write = (...args) => process.stdout.write(...args)

function runTest(dir) {
  const output = babel.transformFileSync(path.join(dir.path, 'input.js'), {
    plugins: [pluginPath],
  })

  const expected = fs.readFileSync(path.join(dir.path, 'expected.js'), 'utf-8')

  write(chalk.bgWhite.black(dir.name))
  write('\n\n')

  const diffs = diff.diffTrimmedLines(expected, output.code, {
    ignoreWhitespace: true,
    newlineIsToken: true,
  })
  if (diffs.length === 1 && (!diffs[0].added && !diffs[0].removed)) {
    write(chalk.white(output.code))
  } else {
    diffs.forEach((part) => {
      let value = part.value
      if (part.added) {
        value = chalk.green(part.value)
      } else if (part.removed) {
        value = chalk.red(part.value)
      }
      write(value)
      write('\n')
    })
  }
  write('\n\n\n')
}

function runTests() {
  const testsPath = path.resolve('./test/fixtures/')

  fs.readdirSync(testsPath)
    .map(item => ({
      path: path.join(testsPath, item),
      name: item,
    }))
    .filter(item => fs.statSync(item.path).isDirectory())
    .forEach(runTest)
}


if (process.argv.indexOf('--watch') >= 0) {
  watch.watchTree(path.resolve('.'), () => {
    delete require.cache[pluginPath]
    clear()
    console.log('Press Ctrl+C to stop watching...')
    console.log('================================')
    try {
      runTests()
    } catch (e) {
      console.error(chalk.magenta(e.stack))
    }
  })
} else {
  runTests()
}
