import { AST_NODE_TYPES, parse } from '@typescript-eslint/typescript-estree';
import { ImportDeclaration } from '@typescript-eslint/types/dist/ts-estree';
import fs from 'fs';
import path from 'path';

export function enumerate(filename: string, resolve: resolver = TypescriptResolver): string[] {
  const rootDir = path.dirname(filename);
  const seen = new Set<string>();

  const absoluteFilename = path.resolve(rootDir, filename);

  seen.add(absoluteFilename);
  return enumerateRecurse(rootDir, seen, filename, resolve);
}

function enumerateRecurse(rootDir: string, seen: Set<string>, filename: string, resolve: resolver): string[] {
  const code = fs.readFileSync(filename, 'utf-8');
  const ast = parse(code, { filePath: filename });
  const importProgramStatements = ast.body.filter((ps) => ps.type == AST_NODE_TYPES.ImportDeclaration);
  const importDeclarations = importProgramStatements.map((is) => { return is as ImportDeclaration });

  const parentDir = path.dirname(filename);
  let out: string[] = [];

  importDeclarations.forEach((impDecl: ImportDeclaration) => {
    const value = impDecl.source.value as string;


    const importFilename = resolve(parentDir, value);
    if (!importFilename) {
      console.error("can't find file that implements import", value);
      return;
    }

    if (seen.has(importFilename)) {
      return
    }
    seen.add(importFilename);

    // we know we're importing that file
    out = out.concat(path.relative(rootDir, importFilename));

    // let's see what this file imports itself
    let extra = enumerateRecurse(rootDir, seen, importFilename, resolve);
    if (extra.length > 0) {
      out = out.concat(extra);
    }
  });
  return out
}

export type resolver = (dir: string, importString: string) => (string | undefined);

const existsWithExtension = (ext: string): resolver => {
  return (dir: string, importString: string): (string | undefined) => {
    const filename = path.resolve(dir, importString + ext);
    if (!fs.existsSync(filename)) {
      return undefined
    }
    return filename
  }
}

const attemptInOrder = (strategies: resolver[]): resolver => {
  return (dir: string, importString: string): (string | undefined) => {
    let result;
    strategies.find((res) => {
      const imported = res(dir, importString)
      if (imported) {
        result = imported;
        return true
      }
      return false
    });
    return result;
  }
}

// this is currently overly simplistic, fix using what the real stuff does:
// e.g. see:
// - https://www.typescriptlang.org/docs/handbook/module-resolution.html#classic
// - https://www.typescriptlang.org/docs/handbook/module-resolution.html#node
// - and other alternatives to node


export const ClassicResolver = attemptInOrder([
  existsWithExtension(".ts"),
  existsWithExtension(".d.ts"),
]);

export const NodeResolver = attemptInOrder([
  existsWithExtension(".js"),
  existsWithExtension(".jsx"),
  // TODO: https://www.typescriptlang.org/docs/handbook/module-resolution.html#node,
]);

export const TypescriptResolver = attemptInOrder([
  existsWithExtension(".ts"),
  existsWithExtension(".tsx"),
  existsWithExtension(".d.ts"),
  // TODO: https://www.typescriptlang.org/docs/handbook/module-resolution.html#node,
]);