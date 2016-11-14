import { dirname, resolve, relative, sep } from 'path'
import fs from 'fs'


function fileExists(filename) {
  try {
    fs.statSync(filename)
    return true
  } catch (e) {
    return false
  }
}

function loadImportsFile(babel, importsFileName) {
  if (!fileExists(importsFileName)) return []
  const t = babel.types
  const importsBody = babel.transformFileSync(importsFileName).ast.program.body

  const importNodes = importsBody
    .filter(node => node.type === 'ImportDeclaration')
    // strip SourceLocation stuff so Babel doesn't get confused...
    // TODO: figure out how to make it work with sourcemaps
    .map(node => t.importDeclaration(node.specifiers, node.source))

  return importNodes
}

function dotSlash(pathname) {
  // starts with './' or '../'
  if (/^\.\.?\//.test(pathname)) return pathname

  return `./${pathname}`
}

// Object<filepath, Array<ImportNode>>
const importsCache = {}


function getImportsFiles(babel, targetFilePath) {
  const t = babel.types
  const rootDir = process.cwd()
  const dirs = relative(rootDir, targetFilePath).split(sep)

  return dirs.reduce((importNodes, _dirname, i) => {
    const dir = resolve(rootDir, ...dirs.slice(0, i))
    const importsFile = resolve(dir, '.imports.js')

    if (!importsCache[importsFile]) {
      importsCache[importsFile] = loadImportsFile(babel, importsFile)
    }

    const relativeImports = importsCache[importsFile].map((node) => {
      const pathFromImportFile = node.source.value
      const fullImportPath = resolve(dirname(importsFile), pathFromImportFile)
      const relativePath = relative(dirname(targetFilePath), fullImportPath)
      const dotSlashRelativePath = dotSlash(relativePath)

      return t.importDeclaration(
        node.specifiers,
        t.stringLiteral(dotSlashRelativePath),
      )
    })

    return importNodes.concat(relativeImports)
  }, [])
}

export default babel => ({
  visitor: {
    Program(path, state) {
      const filename = state.file.opts.filename

      const importNodes = getImportsFiles(babel, filename)
      path.unshiftContainer('body', importNodes)
    },
  },
})
