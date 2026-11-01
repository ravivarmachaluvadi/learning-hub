/*
 * data/interview-spring.js - the interview questions on Spring and production (batch 4).
 * The shape is described at the top of data/interview-virtual-threads.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var Q = U.data.questions = U.data.questions || [];
  var BOOT = 'https://docs.spring.io/spring-boot/reference/';
  var FW = 'https://docs.spring.io/spring-framework/reference/';

  Q.push({
    id: 'sp-what-switches', track: 'spring', weight: 3,
    q: 'What does spring.threads.virtual.enabled=true actually change?',
    keywords: ['spring.threads.virtual.enabled', 'tomcat', 'applicationTaskExecutor', 'SimpleAsyncTaskExecutor', 'SimpleAsyncTaskScheduler', 'keep-alive'],
    short: 'It moves the threads Spring owns to virtual threads: Tomcat\'s request handling, `applicationTaskExecutor` (so `@Async` and MVC `Callable`), which becomes a `SimpleAsyncTaskExecutor`, and the scheduler, which becomes a `SimpleAsyncTaskScheduler`. It leaves yours alone: `supplyAsync` with no executor, parallel streams, your own pools. Pool properties (`server.tomcat.threads.max`, `spring.task.execution.pool.*`) stop having any effect, silently. And since virtual threads are daemons, an app with no web server can exit: set `spring.main.keep-alive=true`.',
    answer: jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;

@EnableAutoConfiguration
static class App { }

void main() {
    for (String on : List.of("false", "true")) {
        try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=" + on)) {
            IO.println(on + ": " + ctx.getBean("applicationTaskExecutor").getClass().getSimpleName());
        }
    }
}`) + '\n\n' + out(`false: ThreadPoolTaskExecutor
true: SimpleAsyncTaskExecutor`),
    followups: ['What limit did server.tomcat.threads.max enforce that is now gone?', 'What changes for a fixedRate job?', 'Why does Spring recommend Java 24 or later?'],
    related: ['lesson:sp-virtual', 'lesson:sp-jobs'],
    docs: BOOT + 'features/task-execution-and-scheduling.html'
  });

  Q.push({
    id: 'sp-pool-limit', track: 'spring', weight: 3,
    q: 'You turn on virtual threads and the database falls over. Why, and what do you do?',
    keywords: ['hikari', 'connection pool', 'database', 'little\'s law', 'semaphore', 'hidden limit', 'bulkhead'],
    short: 'The 200 Tomcat threads were also a limit nobody had chosen: at most 200 requests reached the database layer. Now nothing limits requests, so everything queues at the connection pool, or, if the pool was sized up to match, hits the database itself. The pool (Hikari, 10 by default) is the right limit: keep it small and sized by Little\'s law (requests per second × seconds holding a connection). Do not hold a connection across a remote call, so split long transactions. Then set a short `connection-timeout` and watch `hikaricp.connections.pending`.',
    answer: jv(`int poolFor(double requestsPerSecond, double holdMs) {
    return (int) Math.ceil(requestsPerSecond * holdMs / 1000);
}

void main() {
    IO.println("500 a second, holding 20 ms: " + poolFor(500, 20));
    IO.println("the same, with a 2 s call inside the transaction: " + poolFor(500, 2020));
}`) + '\n\n' + out(`500 a second, holding 20 ms: 10
the same, with a 2 s call inside the transaction: 1010`),
    followups: ['How do you size a Hikari pool?', 'What does the message "total=10, active=10, idle=0, waiting=340" tell you?', 'Why is a bigger pool often slower?'],
    related: ['lesson:sp-db-pool', 'lesson:sp-migrate', 'lesson:vt-limit'],
    docs: BOOT + 'data/sql.html'
  });

  Q.push({
    id: 'sp-context-lost', track: 'spring', weight: 3,
    q: 'What happens to @Transactional, the security context and MDC when you start a thread?',
    keywords: ['context propagation', 'transaction', 'SecurityContextHolder', 'MDC', 'TaskDecorator', 'threadlocal', 'rollback'],
    short: 'All are `ThreadLocal`s, so all stay behind. The security context and MDC can be copied: a `TaskDecorator` bean (Boot applies it to `applicationTaskExecutor`), `ContextPropagatingTaskDecorator`, or `DelegatingSecurityContextExecutor`. The transaction cannot: it is one connection serving one thread, so a write on another thread runs in its own transaction and **commits even if the method rolls back**. Keep database work on the request\'s thread, and clear copied context in a `finally`, because a pool reuses threads.',
    answer: jv(`import org.springframework.transaction.support.*;

void main() throws Exception {
    TransactionSynchronizationManager.setActualTransactionActive(true);
    boolean[] there = new boolean[1];
    Thread.ofVirtual().start(() -> there[0] = TransactionSynchronizationManager.isActualTransactionActive()).join();
    IO.println("this thread: " + TransactionSynchronizationManager.isActualTransactionActive());
    IO.println("a new thread: " + there[0]);
}`) + '\n\n' + out(`this thread: true
a new thread: false`),
    followups: ['Which executors does a TaskDecorator bean not reach?', 'Why not MODE_INHERITABLETHREADLOCAL for security?', 'How does a ScopedValue change this?'],
    related: ['lesson:sp-context', 'lesson:sv-inheritance', 'explain:spring-context'],
    docs: FW + 'data-access/transaction/declarative/tx-decl-explained.html'
  });

  Q.push({
    id: 'sp-self-invocation', track: 'spring', weight: 3,
    q: 'Why does @Async or @Transactional do nothing when called from the same class?',
    keywords: ['self-invocation', 'proxy', 'CGLIB', '@Async', '@Transactional', 'AOP'],
    short: 'These annotations work through a proxy: Spring subclasses your bean at run time and gives the subclass to everyone else. A call from outside goes through the proxy, which adds the behaviour. A call from inside the class goes through `this`, the real object, and skips it. The same proxy explains why `final` methods cannot be advised and why a field read through a bean can be `null`. Fix it by moving the method to another bean; injecting a bean into itself also works, but says something is misplaced.',
    answer: jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Mail {
    @Async public CompletableFuture<Boolean> send() { return CompletableFuture.completedFuture(Thread.currentThread().isVirtual()); }
    public CompletableFuture<Boolean> viaThis() { return send(); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Mail.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        var mail = ctx.getBean(Mail.class);
        IO.println("through the proxy, on a new virtual thread: " + mail.send().get());
        IO.println("through this, on a new virtual thread: " + mail.viaThis().get());
    }
}`) + '\n\n' + out(`through the proxy, on a new virtual thread: true
through this, on a new virtual thread: false`),
    followups: ['What else breaks because of the proxy?', 'JDK proxy or CGLIB: which is used, and when?', 'Where does a void @Async method\'s exception go?'],
    related: ['lesson:sp-async'],
    docs: FW + 'integration/scheduling.html'
  });

  Q.push({
    id: 'sp-webflux', track: 'spring', weight: 3,
    q: 'Do virtual threads make WebFlux obsolete?',
    keywords: ['webflux', 'reactive', 'spring mvc', 'back pressure', 'streaming', 'thread per request'],
    short: 'For the common case, largely: most services chose WebFlux because requests mostly wait, and now a plain blocking controller can wait cheaply, with whole stack traces, `ThreadLocal` context and JDBC intact. Not for all: WebFlux is still the natural fit for streaming responses and back pressure from a slow consumer, and there is no reason to rewrite one that works. Neither helps CPU-bound work. I would pick MVC on virtual threads for a new request-and-response service, and test that choice under load.',
    answer: 'Not a coding question. The comparison table is in [[lesson:sp-mvc]], and the [[explain:throughput|simulator]] shows the arithmetic: on a pool the limit is threads ÷ latency, on virtual threads something else takes over, usually the database.',
    followups: ['What is the danger of a blocking call on an event loop?', 'What did Callable and DeferredResult solve?', 'What does reactive still cost you in debugging?'],
    related: ['lesson:sp-mvc', 'lesson:vt-blocking'],
    docs: FW + 'web/webmvc/mvc-ann-async.html'
  });

  Q.push({
    id: 'sp-scheduled', track: 'spring', weight: 2,
    q: 'How do @Scheduled jobs change on virtual threads?',
    keywords: ['@Scheduled', 'fixedRate', 'fixedDelay', 'overlap', 'SimpleAsyncTaskScheduler', 'ShedLock'],
    short: 'On a pool, all jobs share one thread by default: a slow one delays the rest, and none overlaps. With virtual threads, `SimpleAsyncTaskScheduler` starts each `fixedRate` run on a new thread, so a job longer than its rate **overlaps itself** (measured: peak 5, up from 1). `fixedDelay` jobs still run one at a time, and two of them cannot even run together. Check every `fixedRate` before you migrate: use `fixedDelay`, or a guard with `AtomicBoolean.compareAndSet`. In a cluster, each instance runs every job, so lock in the database if only one should.',
    answer: jv(`Runnable skipIfRunning(Runnable job) {
    var running = new AtomicBoolean();
    return () -> {
        if (!running.compareAndSet(false, true)) return;
        try {
            job.run();
        } finally {
            running.set(false);
        }
    };
}

void main() {
    var ran = new AtomicInteger();
    Runnable job = skipIfRunning(ran::incrementAndGet);
    job.run();
    job.run();
    IO.println("ran " + ran + " times, one after the other");
}`) + '\n\n' + out('ran 2 times, one after the other'),
    followups: ['What happens when a @Scheduled job throws?', 'How would you run a job on one instance only?', 'What happens to a running job at shutdown?'],
    related: ['lesson:sp-jobs'],
    docs: BOOT + 'features/task-execution-and-scheduling.html'
  });

  Q.push({
    id: 'sp-observe-vt', track: 'spring', weight: 2,
    q: 'How do you monitor a Spring service on virtual threads?',
    keywords: ['actuator', 'metrics', 'thread dump', 'JFR', 'saturation', 'http.server.requests.active', 'hikaricp'],
    short: 'Not by thread pools: `executor.*` disappears, and `jvm.threads.live` counts only platform threads. Watch requests in flight (`http.server.requests.active`), latency percentiles, the connection pool (`hikaricp.connections.pending`), heap (waiting threads are memory), and a gauge on each semaphore you own. `/actuator/threaddump` and `jstack` leave out waiting virtual threads, so use `jcmd <pid> Thread.dump_to_file`. Keep JFR running for `jdk.VirtualThreadPinned`.',
    answer: jv(`import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.simple.*;

void main() throws Exception {
    var registry = new SimpleMeterRegistry();
    var limit = new Semaphore(10);
    Gauge.builder("calls.in.use", limit, s -> 10 - s.availablePermits()).strongReference(true).register(registry);
    limit.acquire(4);
    IO.println(registry.get("calls.in.use").gauge().value());
}`) + '\n\n' + out('4.0'),
    followups: ['How do you read a dump of 50,000 threads?', 'Latency is up, CPU is low, errors are low. Where do you look?', 'What still pins, and how would you see it?'],
    related: ['lesson:sp-observe', 'lesson:vt-observe'],
    docs: BOOT + 'actuator/metrics.html'
  });

  Q.push({
    id: 'sp-migration', track: 'spring', weight: 3,
    q: 'Walk me through migrating a production Spring service to virtual threads.',
    keywords: ['migration', 'checklist', 'load test', 'threadlocal cache', 'pinning', 'canary', 'rollback'],
    short: 'First ask whether it mostly waits: if it computes, stop. Upgrade to Java 24 or later, for `synchronized`. Replace the pool dashboards before they go blank. Write down each limit the pool enforced, and make it real: the connection pool, a semaphore per dependency. Put a timeout on every remote call. Check every `fixedRate` job and `ThreadLocal` cache. Load test past the old limit with a dependency made slow on purpose, comparing latency, pool pending and heap. Then roll out behind config, one instance first, keeping the way back. Remove the old pool settings last.',
    answer: jv(`int buffersMade(ExecutorService executor) {
    var made = new AtomicInteger();
    var buffer = ThreadLocal.withInitial(() -> {
        made.incrementAndGet();
        return new byte[64];
    });
    try (executor) {
        for (int i = 0; i < 100; i++) {
            executor.submit(() -> buffer.get().length);
        }
    }
    return made.get();
}

void main() {
    IO.println("virtual threads, 100 tasks: " + buffersMade(Executors.newVirtualThreadPerTaskExecutor()) + " cached buffers");
}`) + '\n\n' + out('virtual threads, 100 tasks: 100 cached buffers'),
    followups: ['When would you not migrate?', 'What usually goes wrong first?', 'How do you prove it helped?'],
    related: ['lesson:sp-migrate', 'lesson:sp-observe', 'lesson:sp-resilience'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html'
  });

  Q.push({
    id: 'sp-fanout', track: 'spring', weight: 2,
    q: 'Design an endpoint that calls three services and returns one answer.',
    keywords: ['aggregator', 'fan-out', 'StructuredTaskScope', 'CompletableFuture', 'deadline', 'partial failure', 'timeout'],
    short: 'Call them at the same time, so the cost is the slowest and not the sum. Give the whole request one deadline. Decide per call what a failure means: required ones fail the page and cancel the rest; optional ones return a default. With `StructuredTaskScope` (preview in 25), the first failure interrupts the others, and a deadline cancels every subtask. With `CompletableFuture`, `thenCombine` waits for all even after a failure, and a timeout does not stop the work. Context needs care either way: a `ScopedValue` is inherited by a fork, and a `ThreadLocal` is not.',
    answer: jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofSeconds(2)))) {
        var price = scope.fork(() -> "250");
        var stock = scope.fork(() -> "4");
        scope.join();
        IO.println(price.get() + " x " + stock.get());
    }
}`) + '\n\n' + out('250 x 4'),
    followups: ['How would you show a page without its reviews?', 'What does a retry do to this?', 'Would you use a preview API here?'],
    related: ['lesson:sp-aggregator', 'lesson:sc-failure', 'explain:cf-vs-scope'],
    docs: 'https://openjdk.org/jeps/505'
  });

  Q.push({
    id: 'sp-retry-timeouts', track: 'spring', weight: 2,
    q: 'Your service depends on a flaky one. What do you put between them?',
    keywords: ['timeout', 'retry', 'bulkhead', 'circuit breaker', 'Retryable', 'ConcurrencyLimit', 'backoff', 'idempotency'],
    short: 'In order: a **timeout** on every call, shorter than your caller\'s. A **limit** (`@ConcurrencyLimit`, or a semaphore) so one dependency cannot take all your memory and threads. A **retry** only for failures worth retrying, at one layer only, with backoff and jitter, and on writes only if they are idempotent: three layers of 3 is 27 calls. A **circuit breaker** so a dead dependency fails fast. Spring Framework 7 builds in `@Retryable` and `@ConcurrencyLimit`.',
    answer: jv(`int callsAtTheBottom(int layers, int triesEach) {
    return (int) Math.pow(triesEach, layers);
}

void main() {
    IO.println("one layer retrying: " + callsAtTheBottom(1, 3));
    IO.println("three layers retrying: " + callsAtTheBottom(3, 3));
}`) + '\n\n' + out(`one layer retrying: 3
three layers retrying: 27`),
    followups: ['What is jitter for?', 'Queue or reject when you are at the limit?', 'How do you make a POST safe to retry?'],
    related: ['lesson:sp-resilience'],
    docs: FW + 'core/resilience.html'
  });
})(window.JCLT);
