'use strict';

const asyncUtils = require('../src/async-utils.js');

const {awaitFor, awaitAll} = asyncUtils;

describe('async-utils', () => {
  describe('awaitFor', () => {
    test('await synchronous value', () => {
      expect.assertions(1);

      awaitFor(3, (value) => {
        expect(value).toBe(3);
      });
    });

    test('awaiting synchronous value is synchronous', () => {
      expect.assertions(1);

      let step = 0;

      awaitFor(3, () => {
        expect(step).toBe(0);
      });

      step = 1;
    });

    test('await promise', () => {
      expect.assertions(1);

      return awaitFor(Promise.resolve(3), (value) => {
        expect(value).toBe(3);
      });
    });

    test('await rejected promise', () => {
      expect.assertions(1);

      return awaitFor(
        Promise.reject(3),
        null,
        (reason) => {
          expect(reason).toBe(3);
        }
      );
    });

    test('awaiting promise is asynchronous', () => {
      expect.assertions(1);

      let step = 0;
      const result = awaitFor(Promise.resolve(), () => {
        expect(step).toBe(1);
      });

      step = 1;

      return result;
    });

    test('success callback modifies the result', () => {
      expect(awaitFor(3, () => 10)).toBe(10);
    });

    test('await awaited promise with success callback with different result', () => {
      expect.assertions(1);

      awaitFor(
        awaitFor(Promise.resolve(3), () => 10),
        (value) => {
          expect(value).toBe(10);
        }
      );
    });

    test('await awaited promise with rejecting success callback', () => {
      expect.assertions(1);

      return awaitFor(
        awaitFor(Promise.resolve(), () => Promise.reject(3)),
        null,
        (reason) => {
          expect(reason).toBe(3);
        }
      );
    });

    test('await awaited promise with rejecting error callback', () => {
      expect.assertions(1);

      return awaitFor(
        awaitFor(Promise.reject(), () => {}, () => Promise.reject(3)),
        null,
        (reason) => {
          expect(reason).toBe(3);
        }
      );
    });

    test('awaited thenable is converted to promise', () => {
      expect.assertions(1);

      return awaitFor({ then(r) { r(3); } }).then((value) => {
        expect(value).toBe(3);
      });
    });

    test('await synchronous value with no callback', () => {
      expect(awaitFor(1)).toBe(1);
    });
  });

  describe('awaitAll', () => {
    test('await no values with no callback', () => {
      expect(awaitAll(0)).toBe(0);
    });

    test('await no values with callback', () => {
      expect(awaitAll(0, () => 3)).toBe(3);
    });

    test('await synchronous values', () => {
      expect.assertions(1);

      awaitAll([1, 2], (values) => {
        expect(values).toEqual([1, 2]);
      });
    });

    test('awaiting synchronous values is synchronous', () => {
      expect.assertions(1);

      let step = 0;

      awaitAll([1, 2], () => {
        expect(step).toBe(0);
      });

      step = 1;
    });

    test('await promises', () => {
      expect.assertions(1);

      return awaitAll([
        Promise.resolve(1),
        2,
        Promise.resolve(3)
      ], (values) => {
        expect(values).toEqual([1, 2, 3]);
      });
    });

    test('await promises that include a rejection', () => {
      expect.assertions(1);

      const rejectionReasons = [, 2];

      rejectionReasons.success = [1, , 3];

      return awaitAll(
        [
          Promise.resolve(1),
          Promise.reject(2),
          Promise.resolve(3)
        ],
        null,
        (reasons) => {
          expect(reasons).toEqual(rejectionReasons);
        }
      );
    });

    test('awaiting promises is asynchronous', () => {
      expect.assertions(1);

      let step = 0;
      const result = awaitAll([1, Promise.resolve()], () => {
        expect(step).toBe(1);
      });

      step = 1;

      return result;
    });

    test('success callback modifies the result', () => {
      expect(awaitAll([1, 2], () => 10)).toBe(10);
    });

    test('await values with no callback', () => {
      expect(awaitAll([1, 2])).toEqual([1, 2]);
    });

    test('await awaited promises with success callback with different result', () => {
      expect.assertions(1);

      awaitFor(
        awaitAll([1, Promise.resolve(3)], () => 10),
        (value) => {
          expect(value).toBe(10);
        }
      );
    });

    test('await awaited promises with rejecting success callback', () => {
      expect.assertions(1);

      return awaitFor(
        awaitAll([1, Promise.resolve()], () => Promise.reject(2)),
        null,
        (reason) => {
          expect(reason).toBe(2);
        }
      );
    });

    test('await awaited promises with rejecting error callback', () => {
      expect.assertions(1);

      return awaitFor(
        awaitAll([1, Promise.reject()], () => {}, () => Promise.reject(2)),
        null,
        (reason) => {
          expect(reason).toBe(2);
        }
      );
    });

    test('await thenables', () => {
      expect.assertions(1);

      return awaitAll(
        [
          { then(r) { r(1); } },
          Promise.resolve(2)
        ],
        (values) => {
          expect(values).toEqual([1, 2]);
        });
    });

    test('returns a promise when awaiting a promise', () => {
      expect.assertions(1);

      return awaitAll([
        Promise.resolve(1),
        2
      ]).then((values) => {
        expect(values).toEqual([1, 2]);
      });
    });
  });
});
