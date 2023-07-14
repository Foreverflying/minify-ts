import fs from 'fs'
import ts from 'typescript'
import { createMinifyTransformer } from './transformer'

// const transformer = createMinifyTransformer({
//     srcDir: 'test/',
//     interfaceFileArr: [
//         'index.ts'
//     ]
// })

const useSource = true

const transformer = function ezhTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    return (sourceNode: ts.SourceFile): ts.SourceFile => {
        const { createIdentifier, updateVariableDeclaration } = ts.factory
        function visit(node: ts.Node): ts.Node {
            if (node.kind === ts.SyntaxKind.Identifier) {
                const varNode = node as ts.Identifier
                const { text } = varNode
                if (text === 'hello') {
                    const newNode = createIdentifier('l')

                    const sourceFileName = sourceNode.fileName
                    const targetFileName = sourceFileName.replace('.ts', '.js')
                    console.log('---------------------------------------- useSource:', useSource, sourceFileName, targetFileName)
                    const source: ts.SourceMapSource = useSource ? {
                        fileName: targetFileName,
                        text: 'hello',
                        getLineAndCharacterOfPosition: sourceNode.getLineAndCharacterOfPosition
                    } : {
                        fileName: targetFileName,
                        text: 'l',
                        getLineAndCharacterOfPosition: sourceNode.getLineAndCharacterOfPosition
                    }
                    const range: ts.SourceMapRange = {
                        pos: node.pos,
                        end: node.end + (useSource ? 0 : 2),
                        source: source,
                    }

                    ts.setOriginalNode(newNode, varNode)
                    ts.setTextRange(newNode, varNode)
                    ts.setTokenSourceMapRange(newNode, newNode.kind, range)
                    return ts.visitEachChild(newNode, visit, context)
                }
            }
            return ts.visitEachChild(node, visit, context)
        }
        return ts.visitNode(sourceNode, visit) as ts.SourceFile
    }
}

const code = fs.readFileSync('src/try/index.ts')
const codeStr = new TextDecoder().decode(code)

const result = ts.transpileModule(codeStr, {
    compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        sourceMap: true,
        esModuleInterop: true,
    },
    fileName: 'index.ts',
    transformers: {
        after: [transformer],
    }
})

console.log(result.outputText)

console.log(result.sourceMapText)

const file = fs.openSync('src/try/index.js', 'w+')
fs.writeFileSync(file, result.outputText)
fs.closeSync(file)

const mapFile = fs.openSync('src/try/index.js.map', 'w+')
fs.writeFileSync(mapFile, result.sourceMapText || '')
fs.closeSync(mapFile)

