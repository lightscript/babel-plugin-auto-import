import { dirname, resolve, relative, sep } from 'path'
import glob from 'glob'
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
    .map((node) => {
      const source = node.source.value
      if (source.indexOf('*') === -1) {
        return [t.importDeclaration(node.specifiers, t.stringLiteral(source))]
      }
      if (source.match(/\*/g).length > 1) throw new Error('Only one * for now')

      // templates
      const sourceGlob = resolve(dirname(importsFileName), source)
      const filepaths = glob.sync(sourceGlob)
      return filepaths.map((filepath) => {
        const [_match, beforeStar, afterStar] = sourceGlob.match(/(.*)\*(.*)/)
        const starMatch = filepath
          .replace(new RegExp(`^${beforeStar}`), '')
          .replace(new RegExp(`${afterStar}$`), '')

        const specifiers = node.specifiers.map((specifier) => {
          const name = specifier.local.name.replace(/_\$\d+_/, starMatch)
          if (t.isImportDefaultSpecifier(specifier)) {
            return t.importDefaultSpecifier(t.identifier(name))
          } else if (t.isImportNamespaceSpecifier(specifier)) {
            return t.importNamespaceSpecifier(t.identifier(name))
          } else if (t.isImportSpecifier(specifier)) {
            const imported = specifier.imported.name
              .replace(/_\$\d+_/, starMatch)
            return t.importSpecifier(t.identifier(name), t.identifier(imported))
          }
          return t.assertImportSpecifier(specifier)
        })
        const sourceName = source.replace('*', starMatch)
        return t.importDeclaration(specifiers, t.stringLiteral(sourceName))
      })
    })
    .reduce((a, b) => a.concat(...b), [])
  return importNodes
}

function dotSlash(pathname, pathFromImportFile) {
  if (pathFromImportFile.startsWith('./')) {
    if (!pathname.startsWith('.')) {
      return `./${pathname}`
    }
  }

  return pathname
}

// Object<filepath, Array<ImportNode>>
const importsCache = {}

function getImports(babel, targetFilePath) {
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
      const dotSlashRelativePath = dotSlash(relativePath, pathFromImportFile)

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

      const importNodes = getImports(babel, filename)
      path.unshiftContainer('body', importNodes)
    },
  },
})
