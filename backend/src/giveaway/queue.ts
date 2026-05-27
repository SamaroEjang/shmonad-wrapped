let tail: Promise<unknown> = Promise.resolve();

const swallow = () => undefined;

// Sequential queue with no per-task timeout — viem's RPC transport has its
// own timeout, and a local timeout here would cancel the wrapper but leave
// the underlying tx broadcast running, opening a double-pay window if the
// route's catch deleted the lock row. Lock restoration in the route handles
// edge cases instead.
export function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = tail.catch(swallow).then(work);
  tail = next.catch(swallow);
  return next;
}
