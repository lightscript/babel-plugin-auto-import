import { basename, dirname, resolve, relative, sep, isAbsolute } from 'path'
import glob from 'glob'
import fs from 'fs'

const IMPORTS_FILENAME = '.imports.js'
const SPECIFIER_TEMPLATE = /_\$\d+_/


function fileExists(filename) {
  try {
    fs.statSync(filename)
    return true
  } catch (e) {
    return false
  }
}

function processImportTemplate(babel, importsFileName, node, fullSource) {
  const t = babel.types

  // go from "/Users/who/blah/**/*.js" to a list of files
  const filepaths = glob.sync(fullSource)

  // create an import statement for each file
  return filepaths.map((filepath) => {
    const fileName = basename(filepath)
    const fileNameWithoutExt = fileName.replace(/^\./, '').split('.')[0]

    const specifierTemplate = name =>
      name.replace(SPECIFIER_TEMPLATE, fileNameWithoutExt)

    // go from `_$1_Main, * as _$2_Stuff` to `filenameMain, * as filenameStuff`
    const specifiers = node.specifiers.map((specifier) => {
      const name = specifierTemplate(specifier.local.name)

      if (t.isImportDefaultSpecifier(specifier)) {
        return t.importDefaultSpecifier(t.identifier(name))
      } else if (t.isImportNamespaceSpecifier(specifier)) {
        return t.importNamespaceSpecifier(t.identifier(name))
      } else if (t.isImportSpecifier(specifier)) {
        const imported = specifierTemplate(specifier.imported.name)
        return t.importSpecifier(t.identifier(name), t.identifier(imported))
      }
      return t.assertImportSpecifier(specifier)
    })

    return t.importDeclaration(specifiers, t.stringLiteral(filepath))
  })
}

function isNodeModule(source) {
  // TODO: improve, be less hacky
  // TODO: assert that its a child of node_modules folder...
  return !(source.startsWith('.') || isAbsolute(source))
}

function fullSourcePath(importsFile, source) {
  if (isNodeModule(source)) return source

  return resolve(dirname(importsFile), source)
}

function relativeSourcePath(fullImportPath, targetFilePath) {
  if (isNodeModule(fullImportPath)) return fullImportPath

  const pathname = relative(dirname(targetFilePath), fullImportPath)

  if (!pathname.startsWith('.')) {
    return `./${pathname}`
  }
  return pathname
}

function loadImportsFile(babel, importsFile) {
  if (!fileExists(importsFile)) return []
  const t = babel.types
  const importsBody = babel.transformFileSync(importsFile).ast.program.body

  const importNodes = importsBody
    .filter(node => t.isImportDeclaration(node))
    .map((node) => {
      const fullSource = fullSourcePath(importsFile, node.source.value)

      if (glob.hasMagic(fullSource)) {
        return processImportTemplate(babel, importsFile, node, fullSource)
      }

      return [t.importDeclaration(node.specifiers, t.stringLiteral(fullSource))]
    })
    .reduce((a, b) => a.concat(...b), []) // flatten
  return importNodes
}

// Object<absoluteFilepath, Array<ImportNode<translatedSpecifiers, absoluteSourcePath>>>
const importsCache = {}

function getImports(babel, targetFilePath) {
  const t = babel.types
  const rootDir = process.cwd()
  const dirs = relative(rootDir, targetFilePath).split(sep)

  return dirs.reduce((importNodes, _dirname, i) => {
    const dir = resolve(rootDir, ...dirs.slice(0, i))
    const importsFile = resolve(dir, IMPORTS_FILENAME)

    if (!importsCache[importsFile]) {
      importsCache[importsFile] = loadImportsFile(babel, importsFile)
    }

    const relativeImports = importsCache[importsFile].map((node) => {
      const relativePath = relativeSourcePath(node.source.value, targetFilePath)

      return t.importDeclaration(
        node.specifiers,
        t.stringLiteral(relativePath),
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
