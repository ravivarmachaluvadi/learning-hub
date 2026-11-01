/*
 * data/quizzes-juc.js - the quiz at the end of each java.util.concurrent toolkit lesson (batch 3).
 * The shape is described at the top of data/quizzes-virtual-threads.js.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['juc-executors'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    try (var pool = (ThreadPoolExecutor) Executors.newFixedThreadPool(3)) {\n        IO.println(pool.getMaximumPoolSize() + " " + (pool.getQueue().remainingCapacity() == Integer.MAX_VALUE));\n    }\n}',
      choices: ['`3 true`', '`3 false`', '`2147483647 true`'],
      answer: 0,
      why: 'A fixed pool has exactly n threads and an unbounded `LinkedBlockingQueue`: under overload, the queue grows without limit.' },
    { q: 'A ThreadPoolExecutor has core 4, max 16 and an unbounded queue. How many threads does it ever run?',
      choices: ['4: new tasks go to the queue before extra threads, and the queue is never full', '16 under load', 'As many as tasks', '1'],
      answer: 0,
      why: 'The order is core threads, then the queue, then up to max, then rejection. An unbounded queue always has room.' },
    { q: 'The queue and the threads are full, and the policy is CallerRunsPolicy. What happens to the next task?',
      choices: ['It runs on the thread that submitted it, slowing the submitter down', 'It is dropped silently', 'It throws RejectedExecutionException', 'It waits in a second queue'],
      answer: 0,
      why: 'Back pressure: the caller is busy running the task, so it submits no more for a while. `AbortPolicy`, the default, throws.' },
    { q: 'Tasks spend 90 ms waiting for every 10 ms of computing, on 8 cores. Roughly what pool size does Goetz\'s formula give?',
      choices: ['80', '8', '9', '800'],
      answer: 0,
      why: 'cores × (1 + wait / compute) = 8 × 10. For waiting tasks, virtual threads remove the need to guess.' }
  ];

  Q['juc-futures'] = [
    { q: 'What does this program print?',
      code: 'void main() throws Exception {\n    try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {\n        Future<Integer> f = ex.submit(() -> { throw new IllegalStateException("no"); });\n        try {\n            f.get();\n        } catch (ExecutionException e) {\n            IO.println(e.getCause().getMessage());\n        }\n    }\n}',
      choices: ['`no`', '`java.lang.IllegalStateException: no`', '`null`'],
      answer: 0,
      why: 'The task\'s exception is the cause of the `ExecutionException`; the wrapper\'s own message is "java.lang.IllegalStateException: no".' },
    { q: '`future.get(100, MILLISECONDS)` throws TimeoutException. What has happened to the task?',
      choices: ['Nothing: it is still running, until you cancel it', 'It was cancelled', 'It was interrupted', 'It failed'],
      answer: 0,
      why: 'The timeout is only on your wait. Call `cancel(true)` to interrupt the task.' },
    { q: 'What does `cancel(true)` do to a task an executor is running?',
      choices: ['Interrupts the thread running it', 'Kills the thread', 'Nothing, the task always finishes', 'Removes it from the queue only'],
      answer: 0,
      why: 'Cancellation is an interrupt; the task stops if it answers interrupts (measured: it was interrupted).' },
    { q: 'What does `invokeAll(tasks, 200, MILLISECONDS)` do with a task still running after 200 ms?',
      choices: ['Cancels it; its Future\'s state is CANCELLED', 'Waits for it anyway', 'Throws TimeoutException', 'Leaves it running and returns its Future unfinished'],
      answer: 0,
      why: 'Every Future it returns is done: succeeded, failed or cancelled.' }
  ];

  Q['juc-completable'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    var f = CompletableFuture.completedFuture(2)\n        .thenApply(x -> x * 10)\n        .thenCombine(CompletableFuture.completedFuture(1), Integer::sum);\n    IO.println(f.join());\n}',
      choices: ['`21`', '`30`', '`3`'],
      answer: 0,
      why: '2 × 10 = 20, combined with 1 by `Integer::sum`.' },
    { q: 'An async step failed with IllegalStateException. What does `exceptionally(e -> …)` receive as e?',
      choices: ['A CompletionException whose cause is the IllegalStateException', 'The IllegalStateException itself', 'An ExecutionException', 'null'],
      answer: 0,
      why: 'Measured. Look at `e.getCause()`; a future failed directly with `completeExceptionally` hands over the exception unwrapped.' },
    { q: 'A running CompletableFuture is cancelled with cancel(true), or times out with orTimeout. What happens to the code computing it?',
      choices: ['It keeps running: neither interrupts it', 'It is interrupted', 'It is killed', 'It is retried'],
      answer: 0,
      why: 'Measured: the task finished anyway. A CompletableFuture is not tied to a thread. Give the client its own timeout.' },
    { q: 'Why give `supplyAsync` an executor?',
      choices: ['Without one it runs on the common ForkJoinPool, shared by every parallel stream: blocking there starves them', 'It does not compile without one', 'To make it run sequentially', 'To get a CompletionException'],
      answer: 0,
      why: 'The common pool has one thread per processor, less one.' }
  ];

  Q['juc-locks'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    var lock = new ReentrantLock();\n    lock.lock();\n    lock.lock();\n    IO.println(lock.getHoldCount() + " " + lock.isFair());\n    lock.unlock();\n    lock.unlock();\n}',
      choices: ['`2 false`', '`1 false`', '`2 true`'],
      answer: 0,
      why: 'Reentrant: the hold count counts. And a `ReentrantLock` is not fair unless you ask: `new ReentrantLock(true)`.' },
    { q: 'Why is `lock.unlock()` always in a `finally` block?',
      choices: ['If the critical section throws, nothing else would release the lock', 'Because unlock() throws', 'For speed', 'It is not needed'],
      answer: 0,
      why: 'Unlike `synchronized`, a `Lock` is released only by your code.' },
    { q: 'What can a ReentrantLock do that synchronized cannot?',
      choices: ['Try for a while and give up (tryLock), and stop waiting on an interrupt (lockInterruptibly)', 'Be reentrant', 'Exclude other threads', 'Make writes visible'],
      answer: 0,
      why: 'Also fairness and several Conditions. Both are reentrant, exclusive and give visibility.' },
    { q: 'Why does a bounded buffer built on one lock use two Conditions, notFull and notEmpty?',
      choices: ['So a signal wakes only threads that can go on: producers wait on one, consumers on the other', 'Because one Condition can hold only one thread', 'To make it fair', 'Conditions must come in pairs'],
      answer: 0,
      why: 'With a single wait set (wait/notify) you need notifyAll and every waiter wakes.' }
  ];

  Q['juc-atomics'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    var n = new AtomicInteger(5);\n    IO.println(n.compareAndSet(5, 6) + " " + n.compareAndSet(5, 7) + " " + n.get());\n}',
      choices: ['`true false 6`', '`true true 7`', '`false false 5`'],
      answer: 0,
      why: 'The second CAS expected 5, but the value is 6 by then: it fails and changes nothing.' },
    { q: 'In a CAS loop, what do you do when compareAndSet returns false?',
      choices: ['Read the value again, recompute, and retry', 'Give up and return false', 'Take a lock', 'Wait for an interrupt'],
      answer: 0,
      why: 'False means another thread changed it after you read it; nothing was written, so try again.' },
    { q: 'Why must the function given to `updateAndGet` have no side effects?',
      choices: ['It can be called more than once, once per retry', 'It runs on another thread', 'It runs only once anyway', 'It is called with a lock held'],
      answer: 0,
      why: 'Under contention the CAS fails and the function runs again.' },
    { q: 'When is a LongAdder better than an AtomicLong?',
      choices: ['For a counter many threads increment at once and you read now and then', 'When you need compareAndSet', 'When you need an exact snapshot during updates', 'For a single-threaded counter'],
      answer: 0,
      why: 'It spreads the count over cells, so threads rarely contend; `sum()` adds them, and is not a snapshot while others add.' }
  ];

  Q['juc-collections'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    var counts = new ConcurrentHashMap<String, Integer>();\n    for (String w : List.of("a", "b", "a")) counts.merge(w, 1, Integer::sum);\n    IO.println(counts.get("a") + " " + counts.get("b"));\n}',
      choices: ['`2 1`', '`1 1`', '`3 0`'],
      answer: 0,
      why: '`merge` puts 1 for a new key and adds 1 to an old count, atomically per key.' },
    { q: 'What happens if you put a null value into a ConcurrentHashMap?',
      choices: ['NullPointerException', 'It is stored', 'The key is removed', 'It is ignored'],
      answer: 0,
      why: 'Measured. A `get` returning null must mean "absent", or a concurrent reader could not tell.' },
    { q: '50 threads call `cache.computeIfAbsent("config", k -> load())` at the same moment. How many times does load() run?',
      choices: ['Once', '50 times', 'Up to the number of processors', 'Zero'],
      answer: 0,
      why: 'Measured: once. The others wait for the first, then see its value.' },
    { q: 'You iterate a CopyOnWriteArrayList while another thread adds to it. What does the iteration see?',
      choices: ['A snapshot from when it began: no exception, no new elements', 'ConcurrentModificationException', 'The new elements too', 'Some elements twice'],
      answer: 0,
      why: 'Every write copies the array; an iterator keeps the array it started with.' }
  ];

  Q['juc-synchronizers'] = [
    { q: 'What does this program print?',
      code: 'void main() throws InterruptedException {\n    var latch = new CountDownLatch(2);\n    latch.countDown();\n    IO.println(latch.await(10, TimeUnit.MILLISECONDS) + " " + latch.getCount());\n}',
      choices: ['`false 1`', '`true 0`', '`false 2`'],
      answer: 0,
      why: 'One of two counts done: the latch is still shut, and `await` gives up after its time.' },
    { q: 'Which can be used again for a second round?',
      choices: ['CyclicBarrier', 'CountDownLatch', 'Neither', 'Both'],
      answer: 0,
      why: 'A latch opens once, for good; a barrier resets itself after each round.' },
    { q: 'One of three threads waiting at a CyclicBarrier is interrupted. What do the other two get?',
      choices: ['BrokenBarrierException: the barrier is broken until reset()', 'They keep waiting', 'InterruptedException too', 'They pass the barrier'],
      answer: 0,
      why: 'Measured: an interrupted waiter breaks the barrier for everyone.' },
    { q: 'What does this program print?',
      code: 'void main() throws InterruptedException {\n    var s = new Semaphore(1);\n    s.acquire();\n    s.release();\n    s.release();\n    IO.println(s.availablePermits());\n}',
      choices: ['`2`', '`1`', '`0`'],
      answer: 0,
      why: 'A semaphore does not check who releases: a release never matched by an acquire adds a permit.' }
  ];

  Q['juc-forkjoin'] = [
    { q: 'What does this program print?',
      code: 'void main() {\n    IO.println(IntStream.rangeClosed(1, 4).parallel().reduce(10, Integer::sum));\n}',
      choices: ['`50`', '`20`', '`10`'],
      answer: 0,
      why: 'The identity is used once per piece (four pieces here), so it must be a true identity: 0 for a sum.' },
    { q: 'In a RecursiveTask, why fork one half and compute the other yourself, instead of forking both?',
      choices: ['The current thread does useful work instead of waiting, while an idle worker may steal the forked half', 'fork() can be called only once', 'compute() is faster than fork()', 'To keep the order'],
      answer: 0,
      why: 'Then `join()` the forked half. Forking both and joining leaves this thread idle.' },
    { q: 'Where does a parallel stream run its work?',
      choices: ['On the common ForkJoinPool and the calling thread', 'On new virtual threads', 'On a new pool per stream', 'Only on the calling thread'],
      answer: 0,
      why: 'Measured: commonPool workers and main. The common pool is shared by the whole JVM.' },
    { q: 'A parallel stream calls a slow HTTP service for each element. What is wrong?',
      choices: ['It blocks the common pool\'s few threads, starving every other parallel stream in the JVM', 'Nothing: that is what parallel streams are for', 'HTTP calls cannot run in streams', 'It runs sequentially'],
      answer: 0,
      why: 'For blocking calls, `Gatherers.mapConcurrent` on virtual threads, with a limit.' }
  ];
})(window.JCLT);
