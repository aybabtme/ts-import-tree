import { AST_NODE_TYPES, parse } from '@typescript-eslint/typescript-estree';
import { ImportDeclaration } from '@typescript-eslint/types/dist/ts-estree';
import fs from 'fs';
import path from 'path';

export function enumerate(filename: string, exts: string[] = ["tsx", "ts", "d.ts", "jsx", "js"]): string[] {
  const rootDir = path.dirname(filename);
  const seen = new Set<string>();

  const absoluteFilename = path.resolve(rootDir, filename);

  seen.add(absoluteFilename);
  return enumerateRecurse(rootDir, seen, filename, exts);
}

function enumerateRecurse(rootDir: string, seen: Set<string>, filename: string, exts: string[]): string[] {
  const code = fs.readFileSync(filename, 'utf-8');
  const ast = parse(code, {filePath: filename});
  const importProgramStatements = ast.body.filter((ps) => ps.type == AST_NODE_TYPES.ImportDeclaration);
  const importDeclarations = importProgramStatements.map((is) => { return is as ImportDeclaration });

  const parentDir = path.dirname(filename);
  let out: string[] = [];

  importDeclarations.forEach((impDecl: ImportDeclaration) => {
    const value = impDecl.source.value as string;


    const importFilename = exts.map((ext) => path.join(parentDir, `${value}.${ext}`)).find((filename) => fs.existsSync(filename));
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
    let extra = enumerateRecurse(rootDir, seen, importFilename, exts);
    if (extra.length > 0) {
      out = out.concat(extra);
    }
  });
  return out
}