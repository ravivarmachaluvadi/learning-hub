/*
 * data/quizzes-spring.js - the quiz at the end of each Spring and production lesson (batch 4).
 * The shape is described at the top of data/quizzes-virtual-threads.js.
 */
(function (U) {
  'use strict';
  var Q = U.data.quizzes = U.data.quizzes || {};

  Q['sp-virtual'] = [
    { q: 'You set spring.threads.virtual.enabled=true and server.tomcat.threads.max=10. How many requests can be in flight at once?',
      choices: ['Far more than 10: the thread setting has no effect now', 'Exactly 10', '200, the default', '10 for each carrier thread'],
      answer: 0,
      why: 'Measured: 30 requests were all inside the handler at once. The property\'s own description says it does not have an effect if virtual threads are enabled, and nothing warns you.' },
    { q: 'Which of these does the property NOT move to a virtual thread?',
      choices: ['CompletableFuture.supplyAsync with no executor', 'An @Async method', 'A controller method', 'A @Scheduled method'],
      answer: 0,
      why: 'It changes the threads Spring owns. `supplyAsync` with no executor still uses the common pool, and your own pools stay yours.' },
    { q: 'A worker app has no web server, only a @Scheduled job, and you turn virtual threads on. What happens when main returns?',
      choices: ['The JVM exits with code 0, after about one tick', 'It keeps ticking, as before', 'It throws at start-up', 'Spring starts a platform thread to stay alive'],
      answer: 0,
      why: 'Virtual threads are daemons and nothing else is keeping the JVM up. Measured: it exited after 1.6 s. `spring.main.keep-alive=true` is the fix.' },
    { q: 'What runs @Async methods when the property is on?',
      choices: ['A SimpleAsyncTaskExecutor: a new virtual thread per call', 'A ThreadPoolTaskExecutor of virtual threads', 'The common pool', 'Tomcat\'s threads'],
      answer: 0,
      why: 'Virtual threads are not pooled. Off, the same bean is a `ThreadPoolTaskExecutor`.' }
  ];

  Q['sp-async'] = [
    { q: 'Method a() in a bean calls this.b(), and b() is @Async. Where does b() run?',
      choices: ['On a()\'s thread: this is the real object, so the proxy is skipped', 'On a new thread', 'It fails at start-up', 'On the task executor, after a() returns'],
      answer: 0,
      why: 'That is self-invocation. The proxy does the work, and `this` is not the proxy. Call it from another bean.' },
    { q: 'Outside the bean you read a field directly from an @Async bean you got from Spring. It is null, though the constructor set it. Why?',
      choices: ['You hold a proxy, a subclass made without running your constructor; only its methods forward to the real object', 'Fields are cleared by @Async', 'The bean has not been initialised yet', 'The field is on another thread'],
      answer: 0,
      why: 'Measured. (A `final` constant is inlined by the compiler, so it hides this: a real object field reads null.)' },
    { q: 'A void @Async method throws. What does the caller see?',
      choices: ['Nothing: Spring logs it', 'The exception, at the call', 'An ExecutionException', 'A RejectedExecutionException'],
      answer: 0,
      why: 'Nobody holds anything to hand it to. Return a `CompletableFuture`, or set an `AsyncUncaughtExceptionHandler`.' },
    { q: 'With virtual threads on, spring.task.execution.simple.concurrency-limit=2 is set and 6 @Async calls arrive. What happens to the extra 4?',
      choices: ['They wait for a turn', 'They are rejected with an exception', 'They run anyway', 'They run on the caller'],
      answer: 0,
      why: 'Measured: peak 2, and all six finished. Spring\'s docs: it "blocks any invocations that are over the limit".' }
  ];

  Q['sp-mvc'] = [
    { q: 'A controller returns a Callable. What does Tomcat\'s thread do?',
      choices: ['Goes back to the pool; the Callable runs on applicationTaskExecutor', 'Waits for the Callable', 'Runs the Callable itself', 'Is cancelled'],
      answer: 0,
      why: 'Measured: on a Tomcat of one thread, two such requests were in flight at once. The wait has moved to another pool.' },
    { q: 'What does WebFlux still do better than Spring MVC on virtual threads?',
      choices: ['Streaming responses, and back pressure from a slow consumer', 'Plain request and response with blocking JDBC', 'Readable stack traces', 'CPU-bound work'],
      answer: 0,
      why: 'A blocking controller on a virtual thread answers "my requests mostly wait". A stream with back pressure is what the reactive model is built for.' },
    { q: 'What is the danger of one blocking call inside a WebFlux handler?',
      choices: ['It stalls an event-loop thread, and with it every request on that loop', 'It only slows that request', 'It fails at compile time', 'It is pinned to a carrier'],
      answer: 0,
      why: 'There are few event-loop threads, and they must never wait. This is from the docs: WebFlux is not run in this tool.' },
    { q: 'Does moving to virtual threads make a CPU-bound service faster?',
      choices: ['No: the processors were already the limit', 'Yes, by the number of threads', 'Yes, because switching is cheaper', 'Only on Java 25'],
      answer: 0,
      why: 'They help with waiting. See the CPU-bound lesson of the Virtual threads track.' }
  ];

  Q['sp-db-pool'] = [
    { q: 'What is Hikari\'s default pool size, under Spring Boot here?',
      choices: ['10', '200', '8', 'Unlimited'],
      answer: 0,
      why: 'Measured: `getMaximumPoolSize()` is 10, and callers wait 30 s (`connectionTimeout` 30000).' },
    { q: 'A service gets 500 requests a second, each holding a connection 20 ms. How many connections does it need, by Little\'s law?',
      choices: ['10', '25', '500', '20'],
      answer: 0,
      why: '500 × 0.020 = 10. That is the minimum for the average; leave room for bursts, and watch `pending`.' },
    { q: 'A @Transactional method calls a 2-second payment API, with a pool of 10. What is the limit on this method?',
      choices: ['5 a second, however many threads you have', 'As many as virtual threads allow', '10 a second', 'None'],
      answer: 0,
      why: 'Each call holds a connection for 2 s, so 10 connections serve 5 a second. Split it into short transactions around the call.' },
    { q: 'Inside a transaction, a JdbcTemplate call on the same thread needs a connection, and the pool has only one. What happens?',
      choices: ['It works: it reuses the transaction\'s own connection', 'It waits, then times out', 'It deadlocks', 'It opens a new connection past the limit'],
      answer: 0,
      why: 'Measured: this is why the demo\'s payment runs on another thread. A real remote call holds the connection all the same; it just does not use it.' }
  ];

  Q['sp-context'] = [
    { q: 'A @Transactional method starts a thread that inserts a row, then throws. What is in the table afterwards?',
      choices: ['The row from the other thread: it ran in its own transaction and committed', 'Nothing: the whole method rolled back', 'An exception stops the insert', 'The row, until the rollback finishes'],
      answer: 0,
      why: 'Measured. Spring\'s docs: it "does not propagate to newly started threads". A transaction is one connection, serving one thread.' },
    { q: 'Where does a TaskDecorator\'s outer code run, and where does the Runnable it returns run?',
      choices: ['On the submitting thread; on the new thread', 'Both on the new thread', 'Both on the submitting thread', 'On the scheduler thread; on a carrier'],
      answer: 0,
      why: 'That is what lets it copy context: read on one thread, restore on the other.' },
    { q: 'You register a TaskDecorator bean. Which of these now carries the trace id?',
      choices: ['An @Async method', 'CompletableFuture.supplyAsync with no executor', 'A StructuredTaskScope fork', 'A new Thread you start'],
      answer: 0,
      why: 'Measured: Boot applies it to `applicationTaskExecutor`. Everything that does not go through that executor is untouched.' },
    { q: 'Why must a decorator clear the MDC in a finally?',
      choices: ['A pool reuses the thread, so the next task would run with this one\'s identity', 'MDC leaks memory otherwise', 'SLF4J requires it', 'The task would fail'],
      answer: 0,
      why: 'A wrong trace id is a nuisance. A wrong user in the security context is a real bug.' }
  ];

  Q['sp-aggregator'] = [
    { q: 'price.thenCombine(stock, f).join(): stock fails at once, and price takes 5 seconds. When does join return?',
      choices: ['After about 5 seconds: thenCombine waits for both', 'At once', 'Never', 'After the default timeout'],
      answer: 0,
      why: 'Measured: the price call ran to the end, and only then did the caller hear. A scope would have cancelled it.' },
    { q: 'In a scope with the default joiner, one fork fails while another is sleeping. What happens to the sleeper?',
      choices: ['It is interrupted', 'It finishes first', 'It is abandoned, still running', 'It is rejected'],
      answer: 0,
      why: 'The first failure cancels the rest, and `close()` waits for them. Nothing is left behind.' },
    { q: 'Why does a trace id in a ScopedValue reach a fork, when a ThreadLocal does not?',
      choices: ['Subtasks inherit the scoped values bound where the scope was opened', 'ScopedValue is a global', 'fork copies every ThreadLocal except this one', 'Virtual threads share a stack'],
      answer: 0,
      why: 'Measured in this lesson and the scoped-values track.' },
    { q: 'What is the honest case for CompletableFuture in production today?',
      choices: ['StructuredTaskScope is still a preview API in Java 25, and its API changed in 26 and 27', 'It cancels better', 'It runs faster', 'Scopes cannot use virtual threads'],
      answer: 0,
      why: 'Using a preview API means `--enable-preview` and changes at each release. That is a fair reason to wait, with its costs known.' }
  ];

  Q['sp-resilience'] = [
    { q: 'Three layers each retry 3 times in all. How many calls can reach the bottom service for one user action?',
      choices: ['27', '9', '3', '6'],
      answer: 0,
      why: '3 × 3 × 3, exactly when it is already in trouble. Retry at one layer.' },
    { q: '@Retryable(maxRetries = 2): how many tries in all, if every one fails?',
      choices: ['3', '2', '1', '4'],
      answer: 0,
      why: 'It counts retries after the first try.' },
    { q: 'What does @ConcurrencyLimit(5) do with a sixth call?',
      choices: ['Makes it wait for a turn', 'Rejects it', 'Runs it on the caller', 'Drops it'],
      answer: 0,
      why: 'Measured: all calls finish, with at most the limit inside. For a user-facing path you may prefer a fast rejection: `Semaphore.tryAcquire`.' },
    { q: 'Why is retrying a timed-out POST dangerous?',
      choices: ['The first try may have worked: only the answer was lost', 'Timeouts are never retried', 'It deadlocks the pool', 'POST has no timeout'],
      answer: 0,
      why: 'Make it idempotent first, with a key the server can recognise.' }
  ];

  Q['sp-jobs'] = [
    { q: 'A @Scheduled(fixedRate = 50) job takes 200 ms. You turn virtual threads on. What changes?',
      choices: ['It starts overlapping itself', 'Nothing', 'It stops running', 'It runs less often'],
      answer: 0,
      why: 'Measured: peak 1 becomes peak 5, each run on a new virtual thread.' },
    { q: 'The same job with fixedDelay, on virtual threads?',
      choices: ['Still one at a time', 'It overlaps too', 'It runs on the common pool', 'It is pinned'],
      answer: 0,
      why: 'Measured. Two `fixedDelay` jobs cannot even run together: each timed out waiting for the other.' },
    { q: 'On whose thread does a plain @EventListener run?',
      choices: ['The publisher\'s', 'A new virtual thread', 'The scheduler\'s', 'The common pool'],
      answer: 0,
      why: 'Measured: so a slow listener slows the publisher, and it runs inside the publisher\'s transaction. Add `@Async` to move it.' },
    { q: 'What happens to a @Scheduled job that throws?',
      choices: ['Spring logs it, and the job runs again', 'It never runs again', 'The application stops', 'The exception reaches main'],
      answer: 0,
      why: 'Measured. A plain `ScheduledExecutorService` is the opposite: it stops repeating.' }
  ];

  Q['sp-observe'] = [
    { q: 'What does /actuator/threaddump show of your waiting virtual threads?',
      choices: ['Nothing', 'All of them', 'Their carriers\' stacks', 'A count'],
      answer: 0,
      why: 'Measured: not listed. The JDK\'s `Thread.dump_to_file` lists them.' },
    { q: 'Which metric disappears when you turn virtual threads on?',
      choices: ['executor.active', 'http.server.requests', 'jvm.threads.live', 'http.server.requests.active'],
      answer: 0,
      why: 'Measured: there is no pool for it to measure. Replace any alert built on it.' },
    { q: 'Under load on virtual threads, jvm.threads.live stays near 30. What does that tell you?',
      choices: ['Very little: it counts platform threads', 'Load is low', 'Virtual threads are not on', 'The service is healthy'],
      answer: 0,
      why: 'Watch requests in flight, latency, the connection pool and heap.' },
    { q: 'Why might a Micrometer gauge read NaN later on?',
      choices: ['It holds its object weakly, and the object has been collected', 'The value was zero', 'Gauges expire after a minute', 'The registry is full'],
      answer: 0,
      why: 'Keep a reference to what it measures, or ask for `.strongReference(true)`.' }
  ];

  Q['sp-migrate'] = [
    { q: 'What did a pool of 200 threads do for you, that nobody decided?',
      choices: ['Limited every dependency to at most 200 of your calls at once', 'Made the service faster', 'Kept requests in order', 'Reduced garbage collection'],
      answer: 0,
      why: 'Remove the pool and the limit goes with it. Write it down as a real limit.' },
    { q: 'A ThreadLocal holds a 1 KB buffer as a cache, and you run 1000 tasks. How many buffers?',
      choices: ['1000 on virtual threads, at most 4 on a pool of 4', '4 either way', '1000 either way', '1 on virtual threads'],
      answer: 0,
      why: 'Measured. One per thread, and virtual threads are one per task.' },
    { q: 'Which comes first?',
      choices: ['Replace the dashboards and alerts that will go blank', 'Remove the pool settings', 'Turn it on in production', 'Rewrite the controllers'],
      answer: 0,
      why: 'Without them you lose your overload alarm on the day you need it. Pool settings go last: harmless, only misleading.' },
    { q: 'What load test tells you the most about this change?',
      choices: ['Past the old limit, with a dependency made slow on purpose', 'Your usual traffic', 'A single request', 'Unit tests under parallel execution'],
      answer: 0,
      why: 'That is exactly where the behaviour differs. At ordinary load, little changes.' }
  ];
})(window.JCLT);
