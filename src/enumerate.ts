import { parse } from '@typescript-eslint/typescript-estree';
import fs from 'fs';

export function enumerate(filename: string): string[] {
  const code = fs.readFileSync(filename, 'utf-8');
  const ast = parse(code, {})
  return [""]
}