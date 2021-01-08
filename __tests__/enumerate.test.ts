import { jest } from '@jest/globals';
import { enumerate } from '../src/enumerate';

test('reads a file', () => {
  const got = enumerate("test_file.ts");
  expect(got).toBe("hello");
});

