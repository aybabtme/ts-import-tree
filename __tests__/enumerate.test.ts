import { jest } from '@jest/globals';
import { enumerate } from '../src/enumerate';
import fs from 'fs';
import util from 'util';

const fixtures = `${process.cwd()}/__tests__/fixtures`;

test('reads a file', async () => {
  const currentTest = `${fixtures}/basecase`;
  const input = `${currentTest}/input.ts`

  const expectedOutput = readJSONFile(`${currentTest}/output.json`);
  const got = enumerate(input);
  expect(got).toEqual(expectedOutput);
});

const readJSONFile = (filename: string): any => {
  const json = fs.readFileSync(filename, 'utf8');
  const out = JSON.parse(json);
  return out
}