'use strict';

const utils = require('crizmas-utils');
const asyncUtils = require('../src/async-utils.js');

const {isPromise} = utils;
const {awaitFor, awaitAll, Cancellation, CancellationReason} = asyncUtils;

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

  describe('Cancellation', () => {
    test('cancellable returns a promise', () => {
      const cancellation = new Cancellation();
      const promise = cancellation.cancellable(Promise.resolve());

      expect(isPromise(promise)).toBe(true);

      return promise;
    });

    test('cancel returns a promise that rejects with the cancellation reason', () => {
      expect.assertions(3);

      const cancellation = new Cancellation();
      const promise1 = cancellation.cancellable(1).then((value) => expect(value).toBe(1));
      const promise2 = cancellation.cancel('testing cancellation').catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('testing cancellation');
      });

      cancellation.cancel('cancelled');

      return Promise.all([promise1, promise2]);
    });

    test('rejects with a cancellation reason with the provided message', () => {
      expect.assertions(2);

      const cancellation = new Cancellation();
      const promise = cancellation.cancellable(Promise.resolve().then()).catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('testing cancellation');
      });

      cancellation.cancel('testing cancellation');

      return promise;
    });

    test('an abort event is dispatched on the abort signal', () => {
      expect.assertions(2);

      const abortHandler = jest.fn();
      const cancellation = new Cancellation();
      const promise = cancellation.cancellable(Promise.resolve().then()).catch((reason) => {
        expect(reason.isCancellation).toBe(true);
      });

      cancellation.signal.onabort = abortHandler;

      cancellation.cancel('testing cancellation');

      expect(abortHandler.mock.calls.length).toBe(1);

      return promise;
    });

    test('can cancel multiple operations', () => {
      expect.assertions(5);

      const abortHandler = jest.fn();
      const cancellation = new Cancellation();
      const promise1 = cancellation.cancellable(Promise.resolve().then()).catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('testing cancellation');
      });
      const promise2 = cancellation.cancellable(Promise.resolve().then()).catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('testing cancellation');
      });

      cancellation.signal.onabort = abortHandler;

      cancellation.cancel('testing cancellation');

      expect(abortHandler.mock.calls.length).toBe(1);

      return Promise.all([promise1, promise2]);
    });

    test('cancelling with no associated operation doesn\'t throw', () => {
      expect.assertions(3);

      let promise;

      expect(() => {
        promise = new Cancellation().cancel('cancelled');
      }).not.toThrow();

      return promise.catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('cancelled');
      });
    });

    test('cancelling twice doesn\'t throw', () => {
      expect.assertions(3);

      const cancellation = new Cancellation();
      const promise = cancellation.cancellable(Promise.resolve().then()).catch((reason) => {
        expect(reason.isCancellation).toBe(true);
        expect(reason.message).toBe('testing cancellation');
      });

      expect(() => {
        cancellation.cancel('testing cancellation');
        cancellation.cancel('testing cancellation2');
      }).not.toThrow();

      return promise;
    });

    test('cancelling already finished operation doesn\'t throw and operation is successful', () => {
      expect.assertions(2);

      const cancellation = new Cancellation();
      const operation = Promise.resolve('success');

      return operation.then(() => {
        const promise = cancellation.cancellable(operation).then((val) => {
          expect(val).toBe('success');
        });

        expect(() => {
          cancellation.cancel('testing cancellation');
          cancellation.cancel('testing cancellation2');
        }).not.toThrow();

        return promise;
      });
    });

    test('marking non-promise as cancellable doesn\'t throw', () => {
      expect(() => {
        const cancellation = new Cancellation();

        cancellation.cancellable(3);
        cancellation.cancel();
      }).not.toThrow();
    });
  });

  describe('CancellationReason', () => {
    test('has the mandatory fields', () => {
      const cancellationReason = new CancellationReason('test');

      expect(cancellationReason.isCancellation).toBe(true);
      expect(cancellationReason.message).toBe('test');
    });
  });
});
