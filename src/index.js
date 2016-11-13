import { dirname, basename, resolve } from 'path'
import fs from 'fs'

const isIgnoredFile = (filename) => false  // TODO

// TODO: build cache, do lots of relative imports...
function getImports(babel, importsFile) {
  const t = babel.types
  const importsBody = babel.transformFileSync(importsFile).ast.program.body

  const importNodes = importsBody
    .filter(node => node.type === 'ImportDeclaration')
    // strip SourceLocation stuff so Babel doesn't get confused...
    // TODO: figure out how to make it work with sourcemaps
    .map(node => t.importDeclaration(node.specifiers, node.source))

  return importNodes
}

function fileExists(filename) {
  try {
    fs.statSync(filename)
    return true
  } catch (e) {
    return false
  }
}

export default (babel) => ({
  visitor: {
    Program(path, state) {
      const { types: t } = babel
      const filename = state.file.opts.filename;

      if (isIgnoredFile(filename)) {
        console.log('not importing in this file...', filename)
        return
      }

      const importsFile = resolve(dirname(filename), '.imports.js')
      if (!fileExists(importsFile)) {
        console.log('no imports file relative to ', filename)
        return
      }

      const importNodes = getImports(babel, importsFile)
      path.unshiftContainer('body', importNodes)
    }
  }
})
