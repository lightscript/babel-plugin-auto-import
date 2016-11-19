/* eslint-disable no-undef, no-unused-expressions, no-underscore-dangle, no-console */
const { emptyDirSync, removeSync } = require('fs-extra')
const path = require('path')
const { spawnSync } = require('child_process')


const diffOpts = {
  relaxedSpace: true,
  context: 2,
}


global.compilePlugin = () => {
  const srcPath = path.resolve('./src/index.js')
  const outPath = path.resolve('./dist/index.js')
  removeSync(outPath)

  const { stderr } = spawnSync('babel', [
    srcPath,
    '--out-file', outPath,
    '--presets', 'eslatest-node6',
  ])

  const stderrStr = stderr.toString()
  if (stderrStr) throw new Error(stderrStr)
}

global.compileFixtureOut = (fixtureFolderPath) => {
  const srcPath = path.join(fixtureFolderPath, 'src')
  const outPath = path.join(fixtureFolderPath, 'out')

  emptyDirSync(outPath)

  const { stdout, stderr } = spawnSync('babel', [
    srcPath,
    '--out-dir', outPath,
    '--plugins', path.resolve('./dist/index.js'),
    '--source-maps',
    '--quiet',
  ])

  const stdoutStr = stdout.toString()
  if (stdoutStr) console.log(stdoutStr)

  const stderrStr = stderr.toString()
  if (stderrStr) throw new Error(stderrStr)
}

global.compileFixtureBuild = (fixtureFolderPath) => {
  const outPath = path.join(fixtureFolderPath, 'out')
  const buildPath = path.join(fixtureFolderPath, 'build')

  emptyDirSync(buildPath)

  const { stdout, stderr } = spawnSync('babel', [
    outPath,
    '--out-dir', buildPath,
    '--plugins', 'transform-es2015-modules-commonjs',
    '--quiet',
  ])

  const stdoutStr = stdout.toString()
  if (stdoutStr) console.log(stdoutStr)

  const stderrStr = stderr.toString()
  if (stderrStr) throw new Error(stderrStr)
}

Assertion.addMethod('executeTo', function executeTo(expected) {
  const compiledPath = this._obj

  const { stdout, stderr } = spawnSync('node', [
    compiledPath,
  ])

  expect(stderr.toString()).to.be.empty
  expect(stdout.toString()).not.differentFrom(expected, diffOpts)
})
