/* eslint-disable no-console */
const babel = require('babel-core')
const chalk = require('chalk')
const clear = require('clear')
const diff = require('diff')
const fs = require('fs')
const path = require('path')
const watch = require('watch')
// const modulesPlugin = require('babel-plugin-transform-es2015-modules-commonjs')
const { spawnSync } = require('child_process')

require('babel-register')

const pluginPath = require.resolve('../src')

const write = (...args) => process.stdout.write(...args)
const log = (...args) => console.log(...args)

function runTest(dir) {
  const expectedCodePath = path.join(dir.path, 'expected_code.js')
  const expectedOutputPath = path.join(dir.path, 'expected_output.txt')
  const inputPath = path.join(dir.path, 'input.js')

  const expectedCode = fs.readFileSync(expectedCodePath, 'utf-8')
  const expectedOutput = fs.readFileSync(expectedOutputPath, 'utf-8')
  const output = babel.transformFileSync(inputPath, {
    plugins: [pluginPath],
  })


  log(chalk.bgWhite.black(dir.name))

  const diffs = diff.diffTrimmedLines(expectedCode, output.code, {
    ignoreWhitespace: true,
    newlineIsToken: true,
  })
  if (diffs.length === 1 && (!diffs[0].added && !diffs[0].removed)) {
    log(chalk.white(output.code))

    const { stdout, stderr } = spawnSync('babel-node', [
      '--plugins', 'transform-es2015-modules-commonjs',
      expectedCodePath,
    ])
    const stdoutStr = stdout.toString()
    const stderrStr = stderr.toString()

    if (stderrStr) {
      log(chalk.red(stderrStr))
    }
    if (stdoutStr) {
      if (stdoutStr === expectedOutput) {
        log(chalk.green(stdoutStr))
      } else {
        log(chalk.red(`Expected "${expectedOutput}", got "${stdoutStr}"`))
      }
    }
  } else {
    diffs.forEach((part) => {
      let value = part.value
      if (part.added) {
        value = chalk.green(part.value)
      } else if (part.removed) {
        value = chalk.red(part.value)
      }
      log(value)
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
