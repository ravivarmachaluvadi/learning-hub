/*
 * data/lessons-spring2.js - Track 6, Spring and production: lessons 6 to 10 (batch 4). See data/lessons-spring.js.
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function norun(code) { return '```java-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  function props(t) { return '```properties\n' + t + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];
  var BOOT = 'https://docs.spring.io/spring-boot/reference/';
  var FW = 'https://docs.spring.io/spring-framework/reference/';

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'sp-aggregator', track: 'spring', title: 'An aggregator endpoint',
    summary: 'One request, several calls behind it: the most common place concurrency appears in a service. CompletableFuture against a structured scope when one call fails or runs late, in a real controller, with the trace id still there.',
    keywords: ['aggregator', 'fan-out', 'backend for frontend', 'bff', 'RestClient', 'CompletableFuture', 'StructuredTaskScope', 'deadline', 'partial failure', 'scoped value'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: structured concurrency', lab: '19-structured-concurrency',
    body: [
      '## The shape',
      'A product page needs a price, stock and reviews, from three services. Called one after another they cost the **sum** of their latencies; together, the **slowest**. Every service has an endpoint like this, and three questions decide whether it holds up in production: what happens when one call fails, what happens when one runs late, and does the context still arrive?',
      '## With CompletableFuture',
      'The usual answer since Java 8. Here the second call fails at once, while the first is still running. `join()` reports the failure, and **nobody stops the first call**:',
      jv(`void main() throws Exception {
    var finished = new CountDownLatch(1);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var price = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(200);
                IO.println("price: still ran to the end");
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
            }
            finished.countDown();
            return 250;
        }, executor);
        var stock = CompletableFuture.supplyAsync(() -> {
            if (true) throw new IllegalStateException("stock service down");
            return 4;
        }, executor);
        try {
            IO.println(price.thenCombine(stock, (p, s) -> p * s).join());
        } catch (CompletionException e) {
            IO.println("the caller has its answer: " + e.getCause().getMessage());
        }
        finished.await();
    }
}`),
      out(`price: still ran to the end
the caller has its answer: stock service down`),
      'Look at the order. `thenCombine` waits for **both** futures even when one has failed, so the caller waited 200 ms for an answer it could not use. And if the price call had been slower, its load on the price service would have gone on for nothing. The [[explain:cf-vs-scope|explainer]] draws this on a timeline.',
      '## With a scope',
      'The same two calls in a `StructuredTaskScope` ([[lesson:sc-failure]]; a preview API in Java 25): the first failure cancels the rest, and `join()` returns at once.',
      jv(`void main() throws Exception {
    var cancelled = new CountDownLatch(1);
    try (var scope = StructuredTaskScope.open()) {
        var price = scope.fork(() -> {
            try {
                Thread.sleep(5_000);
                return 250;
            } catch (InterruptedException e) {
                IO.println("price: cancelled");
                cancelled.countDown();
                throw e;
            }
        });
        var stock = scope.fork(() -> {
            Thread.sleep(50);
            if (true) throw new IllegalStateException("stock service down");
            return 4;
        });
        try {
            scope.join();
            IO.println(price.get() * stock.get());
        } catch (StructuredTaskScope.FailedException e) {
            cancelled.await();
            IO.println("the caller has its answer: " + e.getCause().getMessage());
        }
    }
}`),
      out(`price: cancelled
the caller has its answer: stock service down`),
      '| When one call… | `CompletableFuture` | `StructuredTaskScope` |\n|---|---|---|\n| fails | the others run on; `thenCombine` still waits for them | the others are interrupted; `join()` returns at once |\n| runs past the deadline | `orTimeout` fails the future; the work runs on ([[lesson:juc-completable]]) | `withTimeout` cancels every subtask |\n| leaves threads behind | possible: nothing owns them | impossible: `close()` waits for all |\n| in a thread dump | unrelated threads | a tree under the scope\'s name ([[lesson:sc-nesting]]) |\n| status | final since Java 8 | **preview in Java 25**, and its API changed in 26 and 27 ([[lesson:sc-patterns]]) |',
      '## In a real controller',
      'Here is the whole thing on Spring: a page endpoint calling two others over real HTTP, with a deadline, a fallback, and a trace id that reaches both calls because a `ScopedValue` is inherited by subtasks ([[lesson:sv-inheritance]]), which a `ThreadLocal` is not ([[lesson:sp-context]]):',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.core.env.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

static final ScopedValue<String> TRACE = ScopedValue.newInstance();

@RestController
static class Backends {
    @GetMapping("/price/{id}") int price(@PathVariable int id) { return 250 * id; }
    @GetMapping("/stock/{id}") int stock(@PathVariable int id) {
        if (id == 0) throw new IllegalStateException("no stock data");
        return 4;
    }
}

@RestController
static class Pages {
    final Environment env;
    Pages(Environment env) { this.env = env; }

    int call(String path) {
        var http = RestClient.create("http://localhost:" + env.getProperty("local.server.port"));
        return http.get().uri(path).header("X-Trace", TRACE.get()).retrieve().body(Integer.class);
    }

    @GetMapping("/page/{id}") String page(@PathVariable int id) throws Exception {
        return ScopedValue.where(TRACE, "t-" + id).call(() -> {
            try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofSeconds(5)))) {
                var price = scope.fork(() -> call("/price/" + id));
                var stock = scope.fork(() -> call("/stock/" + id));
                scope.join();
                return "item " + id + ": " + price.get() + ", " + stock.get() + " in stock";
            } catch (StructuredTaskScope.FailedException | StructuredTaskScope.TimeoutException e) {
                return "item " + id + ": unavailable just now";
            }
        });
    }
}

@EnableAutoConfiguration
@Import({ Backends.class, Pages.class })
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=true", "--logging.level.root=OFF")) {
        var http = RestClient.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"));
        IO.println(http.get().uri("/page/1").retrieve().body(String.class));
        IO.println(http.get().uri("/page/0").retrieve().body(String.class));
    }
}`),
      out(`item 1: 250, 4 in stock
item 0: unavailable just now`),
      '## Partial answers',
      'A page may be worth showing without its reviews. Then a failure must not cancel the others: fork with a joiner that waits for all (`Joiner.awaitAll()`), and look at each `Subtask`\'s `state()`; or catch the failure inside the optional call and return a default. Decide per call, on purpose: which ones can the page live without?'
    ].join('\n\n'),
    work: [
      '**A budget, not three timeouts.** A page with a 500 ms budget and three calls each allowed 500 ms is still a 500 ms page only if they run together. A deadline on the scope is one number that covers them all.',
      '**Fan-out multiplies load.** One request becoming three means every service behind you sees your traffic, and a retry at the top multiplies through them ([[lesson:sp-resilience]]). Cancelling calls whose answer no longer matters is real saved load, and it is what `CompletableFuture` cannot do.',
      '**If you cannot use a preview API** in production, which is a reasonable rule until it is final, use `CompletableFuture` with your own virtual-thread executor, `orTimeout`, and an explicit `cancel` on failure, knowing that a cancelled `CompletableFuture` does not interrupt its running task. The Then ↔ now page shows both.'
    ].join('\n\n'),
    example: {
      code: `// Make stock slower than the deadline, or make it fail. What does the caller get, and when?
void main() throws Exception {
    long start = System.nanoTime();
    String page;
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofMillis(300)))) {
        var price = scope.fork(() -> { Thread.sleep(100); return "250"; });
        var stock = scope.fork(() -> { Thread.sleep(150); return "4"; });
        scope.join();
        page = price.get() + " x " + stock.get();
    } catch (StructuredTaskScope.TimeoutException | StructuredTaskScope.FailedException e) {
        page = "unavailable: " + e.getClass().getSimpleName();
    }
    IO.println(page + " after about " + (System.nanoTime() - start) / 50_000_000 * 50 + " ms");
}`,
      note: 'Whichever way it ends, close() has waited: no call is left running.'
    },
    challenge: {
      title: 'A page with a deadline',
      task: 'Write `page(catalog, id)`, the heart of an aggregator endpoint:\n\n- call `catalog.price(id)` and `catalog.stock(id)` **at the same time**, on a `StructuredTaskScope`;\n- bind `Catalog.TRACE` to `"trace-" + id` so both calls can read it;\n- return `"<id>: <price>, <stock>"`, for example `"7: 250, 4"`;\n- if either call fails, or the two together take more than **300 ms**, return `"<id>: unavailable"`, with the other call cancelled.',
      files: [{ name: 'Catalog.java', code: `/** The two services behind the page. The checks hand you a fake one. */
public interface Catalog {
    ScopedValue<String> TRACE = ScopedValue.newInstance();

    String price(String id) throws Exception;

    String stock(String id) throws Exception;
}
` }],
      starter: `// Both calls at once; TRACE bound for both; "id: price, stock", or "id: unavailable" on a failure or after 300 ms.
String page(Catalog catalog, String id) throws Exception {
    return id + ": " + catalog.price(id) + ", " + catalog.stock(id);
}

void main() throws Exception {
    Catalog fake = new Catalog() {
        public String price(String id) { return "250"; }
        public String stock(String id) { return "4"; }
    };
    IO.println(page(fake, "7"));
}`,
      solution: `String page(Catalog catalog, String id) throws Exception {
    return ScopedValue.where(Catalog.TRACE, "trace-" + id).call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofMillis(300)))) {
            var price = scope.fork(() -> catalog.price(id));
            var stock = scope.fork(() -> catalog.stock(id));
            scope.join();
            return id + ": " + price.get() + ", " + stock.get();
        } catch (StructuredTaskScope.FailedException | StructuredTaskScope.TimeoutException e) {
            return id + ": unavailable";
        }
    });
}

void main() throws Exception {
    Catalog fake = new Catalog() {
        public String price(String id) { return "250"; }
        public String stock(String id) { return "4"; }
    };
    IO.println(page(fake, "7"));
}`,
      hints: [
        '`ScopedValue.where(Catalog.TRACE, value).call(() -> { … })` runs the block with the value bound; subtasks forked inside it inherit it.',
        '`StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAllSuccessfulOrThrow(), cf -> cf.withTimeout(Duration.ofMillis(300)))` is the default joiner with a deadline.',
        '`join()` throws `FailedException` for a failure and `TimeoutException` past the deadline: catch both, on the `try`.'
      ],
      checks: [
        { label: 'the page has the price and the stock', code: `Catalog fake = new Catalog() {
    public String price(String id) { return "250"; }
    public String stock(String id) { return "4"; }
};
c.eq(c.call("page", fake, "7"), "7: 250, 4");` },
        { label: 'both calls run at the same time, on virtual threads', code: `var probe = c.probe(2);
Catalog fake = new Catalog() {
    public String price(String id) throws Exception { probe.meet(); return "250"; }
    public String stock(String id) throws Exception { probe.meet(); return "4"; }
};
c.call("page", fake, "7");
c.ok(probe.peak() == 2, "at most " + probe.peak() + " at once");
c.ok(probe.allVirtual(), "a call ran on a platform thread");` },
        { label: 'both calls can read the trace id', code: `var seen = new ConcurrentLinkedQueue<String>();
Catalog fake = new Catalog() {
    public String price(String id) { seen.add(Catalog.TRACE.isBound() ? Catalog.TRACE.get() : "not bound"); return "250"; }
    public String stock(String id) { seen.add(Catalog.TRACE.isBound() ? Catalog.TRACE.get() : "not bound"); return "4"; }
};
c.call("page", fake, "7");
c.eq(new ArrayList<>(seen), List.of("trace-7", "trace-7"));` },
        { label: 'one call fails: "unavailable", and the other is cancelled', code: `var probe = c.probe(1);
Catalog fake = new Catalog() {
    public String price(String id) throws Exception { probe.hang(); return "250"; }
    public String stock(String id) throws Exception { probe.whenHanging(1); throw new IllegalStateException("down"); }
};
c.eq(c.call("page", fake, "7"), "7: unavailable");
c.ok(probe.cancelled() == 1, "the price call was not cancelled");` },
        { label: 'past 300 ms: "unavailable", and both are cancelled', code: `var probe = c.probe(1);
Catalog fake = new Catalog() {
    public String price(String id) throws Exception { probe.hang(); return "250"; }
    public String stock(String id) throws Exception { probe.hang(); return "4"; }
};
c.eq(c.call("page", fake, "7"), "7: unavailable");
c.ok(probe.cancelled() == 2, probe.cancelled() + " of 2 calls were cancelled");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'sp-resilience', track: 'spring', title: 'Timeouts, limits and retries',
    summary: 'On virtual threads nothing stops ten thousand calls piling onto a slow service, so you must. Every call needs a timeout, every scarce thing a limit, and every retry a reason. Spring Framework 7 builds @Retryable and @ConcurrencyLimit in.',
    keywords: ['resilience', 'timeout', 'retry', 'Retryable', 'ConcurrencyLimit', 'EnableResilientMethods', 'bulkhead', 'circuit breaker', 'backoff', 'jitter', 'retry storm', 'semaphore', 'RestClient timeout'],
    docs: FW + 'core/resilience.html', docsLabel: 'Spring Framework: resilience features', lab: '56-microservices',
    body: [
      '## Waiting got cheap, which is the danger',
      'With 200 Tomcat threads, a stuck dependency hurt quickly and visibly: threads ran out, the service stopped taking requests. With virtual threads, requests keep arriving and keep waiting, memory climbs, and the dependency gets more load than ever. Three tools, in the order you should reach for them.',
      '## 1. A timeout on every call',
      'A call with no timeout can wait for ever, and a `RestClient` you build by hand has none you chose. Set them where the client is made:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.http.client.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

@RestController
static class Slow {
    @GetMapping("/slow") String slow() throws Exception {
        Thread.sleep(2_000);
        return "too late";
    }
}

@EnableAutoConfiguration
@Import(Slow.class)
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=true")) {
        var factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofMillis(200));
        var http = RestClient.builder()
            .baseUrl("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"))
            .requestFactory(factory)
            .build();
        try {
            IO.println(http.get().uri("/slow").retrieve().body(String.class));
        } catch (ResourceAccessException e) {
            IO.println("gave up: " + e.getClass().getSimpleName());
        }
    }
}`),
      out('gave up: ResourceAccessException'),
      '## 2. A limit on every scarce thing',
      'A semaphore ([[lesson:vt-limit]]) is a **bulkhead**: this one dependency can only take so many of your threads. Spring Framework 7 has it as an annotation. Extra calls wait for a turn:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.resilience.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Inventory {
    private final AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();
    @ConcurrencyLimit(2)
    public void check() throws InterruptedException {
        peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
        Thread.sleep(30);
        inFlight.decrementAndGet();
    }
    public int peak() { return peak.get(); }
}

@EnableAutoConfiguration
@EnableResilientMethods
@Import(Inventory.class)
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none")) {
        var inventory = ctx.getBean(Inventory.class);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 8; i++) {
                executor.submit(() -> { inventory.check(); return null; });
            }
        }
        IO.println("8 calls at once, a limit of 2: at most 2 inside: " + (inventory.peak() <= 2));
    }
}`),
      out('8 calls at once, a limit of 2: at most 2 inside: true'),
      '## 3. A retry, for what is worth retrying',
      'A retry is a bet that the next try will go differently. It is a good bet for a dropped connection, a bad one for a validation error, and a dangerous one for a timeout on something that changes data (the first try may have worked). `includes` says which failures count:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.dao.*;
import org.springframework.resilience.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Prices {
    private final AtomicInteger tries = new AtomicInteger();
    @Retryable(includes = TransientDataAccessException.class, maxRetries = 3, delay = 10)
    public String flaky() {
        if (tries.incrementAndGet() < 3) throw new TransientDataAccessResourceException("try " + tries);
        return "worked on try " + tries;
    }
    @Retryable(includes = TransientDataAccessException.class, maxRetries = 3, delay = 10)
    public String wrong() {
        tries.incrementAndGet();
        throw new IllegalArgumentException("no such product");
    }
    public int tries() { return tries.get(); }
}

@EnableAutoConfiguration
@EnableResilientMethods
@Import(Prices.class)
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none")) {
        var prices = ctx.getBean(Prices.class);
        IO.println(prices.flaky());
        int before = prices.tries();
        try {
            prices.wrong();
        } catch (IllegalArgumentException e) {
            IO.println(e.getMessage() + ", after " + (prices.tries() - before) + " try");
        }
    }
}`),
      out(`worked on try 3
no such product, after 1 try`),
      '## Retries multiply',
      'Three layers that each try three times make **27** calls to the bottom service for one user action, exactly when it is already struggling. So retry at one layer only, with a growing delay (`delay`, `multiplier`) and random jitter (`jitter`), so that everyone who failed together does not come back together. And give the whole request one budget, the deadline of [[lesson:sp-aggregator]].',
      '| Tool | Protects | Goes wrong when |\n|---|---|---|\n| Timeout | you, from waiting for ever | it is longer than your caller\'s |\n| Concurrency limit | the dependency, and your memory | it is set per instance and you run 50 |\n| Retry | against brief failures | it is on writes without idempotency, or on every layer |\n| Circuit breaker | a dependency that is down: fail fast for a while | never tested: **not run here**; Resilience4j is the usual library |',
      'The proxy rules of [[lesson:sp-async]] apply: these annotations work only through the bean, not on a call to `this`.'
    ].join('\n\n'),
    work: [
      '**An outage story.** A dependency slows from 50 ms to 5 s. With virtual threads and no limit, in-flight calls grow to tens of thousands, heap fills with their stacks, GC takes over, and your service falls over too, when it could have failed one feature. A limit turns that into slow or rejected calls to one dependency.',
      '**Idempotency first.** Before retrying a `POST`, ask what happens if the first attempt did work and only the answer was lost. An idempotency key on the request makes it safe. See the Learning lab [[lab:48-transactional-outbox]].',
      '**Reject rather than queue.** `@ConcurrencyLimit` makes callers wait. For a user-facing path, a fast 503 is often kinder than a long wait, so use `Semaphore.tryAcquire` with a short timeout there.'
    ].join('\n\n'),
    example: {
      code: `// Change maxRetries, and what flaky throws. How many tries does it take?
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.resilience.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Flaky {
    private final AtomicInteger tries = new AtomicInteger();
    @Retryable(maxRetries = 2, delay = 10)
    public String call() {
        int n = tries.incrementAndGet();
        IO.println("try " + n);
        if (n < 3) throw new IllegalStateException("try " + n + " failed");
        return "worked";
    }
}

@EnableAutoConfiguration
@EnableResilientMethods
@Import(Flaky.class)
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none")) {
        IO.println(ctx.getBean(Flaky.class).call());
    }
}`,
      note: 'maxRetries counts retries, after the first try.'
    },
    challenge: {
      title: 'A careful client',
      task: 'Write a nested class named `Pricing`, a Spring bean with one public method:\n\n`public String price(String id)` returns `Upstream.call(id)` (in `Upstream.java`), and is annotated so that:\n\n- at most **3** calls are inside it at once;\n- it retries a `TransientDataAccessException` up to **2** times (3 tries in all), with a delay of 1 ms;\n- it does **not** retry anything else.\n\nThe checks start your bean with `@EnableResilientMethods`.',
      files: [{ name: 'Upstream.java', code: `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.*;
import org.springframework.dao.*;
import org.springframework.resilience.annotation.*;

/** The service behind your bean, and the host the checks start your bean in. */
public final class Upstream {
    public static volatile jclt.Probe probe = new jclt.Probe(1, 50);
    public static volatile int failTimes;
    public static volatile RuntimeException failure;

    public static String call(String id) {
        try {
            probe.meet();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        if (failTimes > 0) {
            failTimes--;
            throw failure;
        }
        return "price of " + id;
    }

    public static void failing(int times, RuntimeException e) {
        failTimes = times;
        failure = e;
    }

    @EnableAutoConfiguration
    @EnableResilientMethods
    public static class Host { }

    private static ConfigurableApplicationContext ctx;

    /** Your bean, through Spring's proxy. */
    public static synchronized Object bean(Class<?> cls) {
        if (ctx == null) ctx = SpringApplication.run(new Class<?>[] { Host.class, cls }, new String[] { "--spring.main.web-application-type=none" });
        return ctx.getBean(cls);
    }
}
` }],
      starter: `import org.springframework.dao.*;
import org.springframework.resilience.annotation.*;
import org.springframework.stereotype.*;

// Add the annotations: at most 3 at once; retry only TransientDataAccessException, twice, 1 ms apart.
@Component
static class Pricing {
    public String price(String id) {
        return Upstream.call(id);
    }
}

void main() {
    IO.println("the checks start Pricing");
}`,
      solution: `import org.springframework.dao.*;
import org.springframework.resilience.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Pricing {
    @ConcurrencyLimit(3)
    @Retryable(includes = TransientDataAccessException.class, maxRetries = 2, delay = 1)
    public String price(String id) {
        return Upstream.call(id);
    }
}

void main() {
    IO.println("the checks start Pricing");
}`,
      hints: [
        '`@ConcurrencyLimit(3)` on the method.',
        '`@Retryable(includes = TransientDataAccessException.class, maxRetries = 2, delay = 1)`: `maxRetries` does not count the first try.',
        'Both are in `org.springframework.resilience.annotation`.'
      ],
      checks: [
        { label: 'price returns what the service returned', code: `Object bean = Upstream.bean(Class.forName("Main$Pricing", true, Thread.currentThread().getContextClassLoader()));
Upstream.probe = c.probe(1);
Upstream.failing(0, null);
c.eq(c.callOn(bean, "price", "tea"), "price of tea");` },
        { label: 'a transient failure is retried', code: `Object bean = Upstream.bean(Class.forName("Main$Pricing", true, Thread.currentThread().getContextClassLoader()));
var probe = c.probe(1);
Upstream.probe = probe;
Upstream.failing(2, new org.springframework.dao.TransientDataAccessResourceException("blip"));
c.eq(c.callOn(bean, "price", "tea"), "price of tea");
c.eq(probe.calls(), 3);` },
        { label: 'it gives up after 3 tries', code: `Object bean = Upstream.bean(Class.forName("Main$Pricing", true, Thread.currentThread().getContextClassLoader()));
var probe = c.probe(1);
Upstream.probe = probe;
Upstream.failing(100, new org.springframework.dao.TransientDataAccessResourceException("down"));
boolean threw = false;
try {
    c.callOn(bean, "price", "tea");
} catch (Throwable t) {
    threw = true;
}
Upstream.failing(0, null);
c.ok(threw, "it returned although every try failed");
c.eq(probe.calls(), 3);` },
        { label: 'anything else is not retried', code: `Object bean = Upstream.bean(Class.forName("Main$Pricing", true, Thread.currentThread().getContextClassLoader()));
var probe = c.probe(1);
Upstream.probe = probe;
Upstream.failing(100, new IllegalArgumentException("no such product"));
try {
    c.callOn(bean, "price", "tea");
} catch (Throwable t) {
}
Upstream.failing(0, null);
c.eq(probe.calls(), 1);` },
        { label: 'three calls run at once, and never a fourth', code: `Object bean = Upstream.bean(Class.forName("Main$Pricing", true, Thread.currentThread().getContextClassLoader()));
var probe = c.probe(8, 300);
Upstream.probe = probe;
Upstream.failing(0, null);
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 8; i++) {
        executor.submit(c.task(() -> c.callOn(bean, "price", "tea")));
    }
}
c.ok(probe.peak() <= 3, probe.peak() + " calls were inside at once");
c.ok(probe.peak() == 3, "only " + probe.peak() + " at once: the limit is too low");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'sp-jobs', track: 'spring', title: 'Scheduled jobs, events and messaging',
    summary: 'Work no request asked for. @Scheduled on one thread and what virtual threads change, including a fixedRate job that starts overlapping itself. Events on whose thread, messaging listeners, and stopping cleanly.',
    keywords: ['@Scheduled', 'fixedRate', 'fixedDelay', 'cron', 'EventListener', 'TransactionalEventListener', 'kafka listener', 'SimpleAsyncTaskScheduler', 'overlap', 'graceful shutdown', 'ShedLock'],
    docs: BOOT + 'features/task-execution-and-scheduling.html', docsLabel: 'Spring Boot: task execution and scheduling', lab: '53-kafka',
    body: [
      '## One thread, by default',
      'Without virtual threads, every `@Scheduled` method in your app shares **one thread** (`spring.task.scheduling.pool.size`, default 1). A slow job delays all the others, and a job can never overlap itself. Turning virtual threads on changes this, in a way you might not guess: two kinds of schedule behave differently.',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Rate {
    private final AtomicInteger inside = new AtomicInteger(), peak = new AtomicInteger();
    @Scheduled(fixedRate = 50)
    public void job() throws InterruptedException {
        peak.accumulateAndGet(inside.incrementAndGet(), Math::max);
        Thread.sleep(200);
        inside.decrementAndGet();
    }
    public int peak() { return peak.get(); }
}

@Component
static class Delay {
    private final AtomicInteger inside = new AtomicInteger(), peak = new AtomicInteger();
    @Scheduled(fixedDelay = 50)
    public void job() throws InterruptedException {
        peak.accumulateAndGet(inside.incrementAndGet(), Math::max);
        Thread.sleep(200);
        inside.decrementAndGet();
    }
    public int peak() { return peak.get(); }
}

@EnableAutoConfiguration
@EnableScheduling
@Import(Rate.class)
static class RateApp { }

@EnableAutoConfiguration
@EnableScheduling
@Import(Delay.class)
static class DelayApp { }

void main() throws Exception {
    for (String virtual : List.of("false", "true")) {
        String[] args = { "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=" + virtual };
        try (var ctx = SpringApplication.run(RateApp.class, args)) {
            Thread.sleep(700);
            IO.println("virtual " + virtual + ", fixedRate:  overlaps itself: " + (ctx.getBean(Rate.class).peak() > 1));
        }
        try (var ctx = SpringApplication.run(DelayApp.class, args)) {
            Thread.sleep(700);
            IO.println("virtual " + virtual + ", fixedDelay: overlaps itself: " + (ctx.getBean(Delay.class).peak() > 1));
        }
    }
}`),
      out(`virtual false, fixedRate:  overlaps itself: false
virtual false, fixedDelay: overlaps itself: false
virtual true, fixedRate:  overlaps itself: true
virtual true, fixedDelay: overlaps itself: false`),
      '**A `fixedRate` job that used to be safe can run many copies at once after you flip one property.** We measured a peak of 5, with a job 4 times longer than its rate. If that job takes a lock, sends a report or walks a table, you now have a bug no code change caused.',
      '| | `fixedRate` | `fixedDelay` |\n|---|---|---|\n| Means | start every N ms | wait N ms after each run ends |\n| Pool of 1 | runs late, never overlaps | never overlaps |\n| Virtual threads | **a new thread each time: overlaps** | **one at a time, and two such jobs cannot even run together** (measured: two `fixedDelay` jobs waiting for each other timed out, on and off) |',
      'So `fixedDelay` is the safe default for work that must not overlap, and a job that must run past its rate needs its own guard: the Challenge writes one.',
      '## A job that throws',
      'A `ScheduledExecutorService` stops repeating a task that throws ([[lesson:juc-executors]]). `@Scheduled` logs it and runs again (measured). That keeps a job alive through a blip, and it also means a job failing every minute for a week shows up only in the logs: count failures in a metric.',
      '## Events: whose thread?',
      'An `@EventListener` runs **on the publisher\'s thread, inside its transaction**, unless it is also `@Async`. A `@TransactionalEventListener` runs after the commit, on the same thread:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.context.event.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

record Placed(String id) { }

@Component
static class Listeners {
    final Map<String, String> ran = new ConcurrentSkipListMap<>();
    final CountDownLatch async = new CountDownLatch(1);
    @EventListener public void plain(Placed e) { ran.put("@EventListener", Thread.currentThread().getName()); }
    @Async @EventListener public void later(Placed e) {
        ran.put("@Async @EventListener", Thread.currentThread().isVirtual() ? "a new virtual thread" : "another thread");
        async.countDown();
    }
    public Map<String, String> ran() throws InterruptedException { async.await(); return ran; }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Listeners.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        ctx.publishEvent(new Placed("order-1"));
        ctx.getBean(Listeners.class).ran().forEach((k, v) -> IO.println(k + " ran on " + v));
    }
}`),
      out(`@Async @EventListener ran on a new virtual thread
@EventListener ran on main`),
      '## Messaging',
      '**Not run here:** Kafka and RabbitMQ need a broker, and they are not on this tool\'s class path. From the Spring Boot 3.2 release notes: `spring.threads.virtual.enabled` also moves Kafka and RabbitMQ listeners to virtual threads. A Kafka listener\'s `concurrency` is still how many consumers read partitions; a virtual thread does not change that a partition is read in order by one consumer.',
      norun(`@KafkaListener(topics = "orders", concurrency = "3")
public void onOrder(Order order) {
    payments.charge(order);     // a slow call here holds up this partition, on any kind of thread
}`),
      '## Stopping cleanly',
      'Boot 4.1 defaults to `server.shutdown=graceful`, with 30 s per phase (`spring.lifecycle.timeout-per-shutdown-phase`): in-flight requests may finish. A running `@Async` task or scheduled job does not get that promise unless you ask: `spring.task.execution.shutdown.await-termination=true`, with a period. Otherwise, a deploy interrupts it mid-work.'
    ].join('\n\n'),
    work: [
      '**Many instances.** `@Scheduled` runs in every instance: three pods, three copies of the nightly job. Either run it in one place, or take a lock in the database (ShedLock is the usual library; **not run here**).',
      '**After migrating, check every `fixedRate`.** Search the code for it. Any job that can run longer than its rate now overlaps itself. Change it to `fixedDelay`, or add a guard.',
      '**A job is not a queue.** If missing a run matters, or the work must survive a restart, it belongs in a queue or a table with a status, not in memory. See the Learning lab [[lab:48-transactional-outbox]].'
    ].join('\n\n'),
    example: {
      code: `// Watch a fixedRate job overlap itself. Change the rate, the work, and turn virtual threads off.
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Job {
    private final AtomicInteger inside = new AtomicInteger();
    @Scheduled(fixedRate = 100)
    public void run() throws InterruptedException {
        IO.println(inside.incrementAndGet() + " running, on " + Thread.currentThread());
        Thread.sleep(250);
        inside.decrementAndGet();
    }
}

@EnableAutoConfiguration
@EnableScheduling
@Import(Job.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        Thread.sleep(800);
    }
}`,
      note: 'Each line says how many copies were inside the job when this one started.'
    },
    challenge: {
      title: 'A job that skips instead of overlapping',
      task: 'Write `skipIfRunning(job)`: wrap a `Runnable` so that if it is still running when the schedule fires again, the new run **does nothing and returns at once**. It must not wait, and it must not run two at the same time.\n\nIf the job throws, the exception reaches the caller and the next run must still work.\n\nThe last check puts your wrapper behind a real `@Scheduled(fixedRate)` job on virtual threads.',
      files: [{ name: 'JobApp.java', code: `import java.util.concurrent.atomic.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

/** A real fixedRate job, on virtual threads, whose work goes through your wrapper. */
public class JobApp {
    public static volatile Runnable wrapped;
    public static final AtomicInteger fired = new AtomicInteger();

    @Component
    public static class Job {
        @Scheduled(fixedRate = 10)
        public void fire() {
            fired.incrementAndGet();
            if (wrapped != null) wrapped.run();
        }
    }

    @EnableAutoConfiguration
    @EnableScheduling
    @Import(Job.class)
    public static class App { }

    public static void runFor(Runnable job, long ms) throws Exception {
        wrapped = job;
        try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
            Thread.sleep(ms);
        }
    }
}
` }],
      starter: `// If the job is still running, a new run does nothing and returns at once.
Runnable skipIfRunning(Runnable job) {
    return job;
}

void main() {
    skipIfRunning(() -> IO.println("ran")).run();
}`,
      solution: `Runnable skipIfRunning(Runnable job) {
    var running = new AtomicBoolean();
    return () -> {
        if (!running.compareAndSet(false, true)) {
            return;
        }
        try {
            job.run();
        } finally {
            running.set(false);
        }
    };
}

void main() {
    skipIfRunning(() -> IO.println("ran")).run();
}`,
      hints: [
        '`AtomicBoolean.compareAndSet(false, true)` is true for exactly one caller: the check and the set are one step ([[lesson:juc-atomics]]).',
        'A plain `if (!running) { running = true; … }` is a race: two threads can both see false.',
        'Reset it in a `finally`, or one exception stops the job for ever.'
      ],
      checks: [
        { label: 'it runs the job', code: `int[] ran = new int[1];
Runnable r = c.call("skipIfRunning", (Runnable) () -> ran[0]++);
r.run();
r.run();
c.eq(ran[0], 2);` },
        { label: 'a second run while the first is inside returns at once, without running', code: `var inside = new CountDownLatch(1);
var release = new CountDownLatch(1);
var ran = new AtomicInteger();
Runnable job = () -> {
    ran.incrementAndGet();
    inside.countDown();
    try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
};
Runnable r = c.call("skipIfRunning", job);
Thread first = Thread.ofVirtual().start(r);
inside.await();
Thread second = Thread.ofVirtual().start(r);
boolean returned = second.join(java.time.Duration.ofSeconds(1));
release.countDown();
first.join();
second.join();
c.ok(returned, "the second run waited for the first, when it should skip");
c.eq(ran.get(), 1);` },
        { label: 'of many at once, exactly one runs', code: `var meet = new CountDownLatch(1);
var ran = new AtomicInteger();
Runnable job = () -> {
    ran.incrementAndGet();
    try { meet.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
};
Runnable r = c.call("skipIfRunning", job);
var start = new CountDownLatch(1);
var threads = new ArrayList<Thread>();
for (int i = 0; i < 50; i++) {
    threads.add(Thread.ofVirtual().start(() -> {
        try { start.await(); } catch (InterruptedException e) { return; }
        r.run();
    }));
}
start.countDown();
Thread.sleep(100);
meet.countDown();
for (var t : threads) t.join();
c.eq(ran.get(), 1);` },
        { label: 'after the job throws, the exception reaches the caller and the next run still works', code: `var ran = new AtomicInteger();
Runnable job = () -> {
    if (ran.incrementAndGet() == 1) throw new IllegalStateException("first run failed");
};
Runnable r = c.call("skipIfRunning", job);
boolean threw = false;
try {
    r.run();
} catch (IllegalStateException e) {
    threw = true;
}
r.run();
c.ok(threw, "the exception was swallowed");
c.eq(ran.get(), 2);` },
        { label: 'behind a real fixedRate job on virtual threads, it never overlaps', code: `var inside = new AtomicInteger();
var peak = new AtomicInteger();
var runs = new AtomicInteger();
Runnable job = () -> {
    peak.accumulateAndGet(inside.incrementAndGet(), Math::max);
    runs.incrementAndGet();
    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    inside.decrementAndGet();
};
Runnable r = c.call("skipIfRunning", job);
JobApp.runFor(r, 500);
c.ok(JobApp.fired.get() > runs.get(), "the schedule fired " + JobApp.fired + " times, and all of them ran: nothing was skipped");
c.eq(peak.get(), 1);` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 9 */
  L.push({
    id: 'sp-observe', track: 'spring', title: 'Observing it: what the dashboards stop showing',
    summary: 'The pool graphs you trusted go blank on virtual threads, and the usual thread dump leaves out the very threads you need. Which signals remain, what to replace them with, and how to read a service under load.',
    keywords: ['actuator', 'metrics', 'micrometer', 'gauge', 'thread dump', 'threaddump', 'jstack', 'JFR', 'VirtualThreadPinned', 'tomcat.threads', 'http.server.requests', 'hikaricp', 'observability', 'saturation'],
    docs: BOOT + 'actuator/metrics.html', docsLabel: 'Spring Boot: metrics', lab: '18-java-virtual-threads',
    body: [
      '## The graphs that go blank',
      'On a pool, "threads busy of max" was the saturation graph: at 200 of 200 you knew. With virtual threads there is no max and no pool, so there is nothing for such a meter to count. Here are the names asked of `/actuator/metrics`, both ways:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

@RestController
static class Web {
    @GetMapping("/hello") String hello() { return "hi"; }
}

@EnableAutoConfiguration
@Import(Web.class)
static class App { }

void main() {
    for (String virtual : List.of("false", "true")) {
        try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=" + virtual, "--management.endpoints.web.exposure.include=metrics")) {
            var http = RestClient.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"));
            http.get().uri("/hello").retrieve().toBodilessEntity();
            String names = http.get().uri("/actuator/metrics").retrieve().body(String.class);
            IO.println("virtual " + virtual);
            for (String m : List.of("http.server.requests", "http.server.requests.active", "jvm.threads.live", "jvm.threads.started", "tomcat.threads.busy", "executor.active")) {
                IO.println("  " + m + ": " + (names.contains("\\"" + m + "\\"") ? "there" : "ABSENT"));
            }
        }
    }
}`),
      out(`virtual false
  http.server.requests: there
  http.server.requests.active: there
  jvm.threads.live: there
  jvm.threads.started: there
  tomcat.threads.busy: ABSENT
  executor.active: there
virtual true
  http.server.requests: there
  http.server.requests.active: there
  jvm.threads.live: there
  jvm.threads.started: there
  tomcat.threads.busy: ABSENT
  executor.active: ABSENT`),
      '`executor.active`, the `@Async` pool\'s meter, **disappears** when you switch. `jvm.threads.live` counts platform threads, so it stays low whatever the load, and says nothing. (`tomcat.threads.busy` is not there either way: on Spring Boot 4.1.2 we could not make it appear, even with `server.tomcat.mbeanregistry.enabled=true`, and did not find out why. If your dashboards have it, check it before you trust it.) `hikaricp.*` appears only after the pool is first used. What to watch instead:',
      '| The old signal | Now watch |\n|---|---|\n| Request threads busy | `http.server.requests.active`: requests in flight |\n| Request queue | latency percentiles of `http.server.requests` |\n| `@Async` pool busy, queued | your own gauge on the semaphore that limits it |\n| Threads stuck | connection pool pending (`hikaricp.connections.pending`), latency of each dependency |\n| Thread count alarm | heap: a pile of waiting virtual threads is **memory** |',
      '## The thread dump that hides them',
      '`jstack` and `/actuator/threaddump` list platform threads. Your waiting virtual threads, the very ones you want in an incident, are not there ([[lesson:vt-observe]]). The JDK\'s own dump has them:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.web.client.*;
import java.lang.management.*;
import java.nio.file.*;
import com.sun.management.*;

@EnableAutoConfiguration
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=true", "--management.endpoints.web.exposure.include=threaddump")) {
        var release = new CountDownLatch(1);
        for (int i = 0; i < 3; i++) {
            Thread.ofVirtual().name("order-" + i).start(() -> {
                try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            });
        }
        Thread.sleep(100);
        var http = RestClient.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"));
        String actuator = http.get().uri("/actuator/threaddump").retrieve().body(String.class);
        IO.println("/actuator/threaddump lists order-0: " + actuator.contains("order-0"));

        Path file = Files.createTempDirectory("dump").resolve("threads.json");
        ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class).dumpThreads(file.toAbsolutePath().toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.JSON);
        String json = Files.readString(file);
        IO.println("the JDK's dump lists order-0: " + json.contains("order-0"));
        release.countDown();
    }
}`),
      out(`/actuator/threaddump lists order-0: false
the JDK's dump lists order-0: true`),
      'From a shell it is `jcmd <pid> Thread.dump_to_file -format=json threads.json`. A dump of 50,000 threads is big but readable: group by the top frame, and the stuck call stands out. Named threads and named scopes make this far easier: set `spring.task.execution.thread-name-prefix`, and name your executors\' threads.',
      '## Your own numbers',
      'A limit you own should have a meter you own. Micrometer\'s `Gauge` reads a value when it is scraped. It holds its object **weakly** by default, so keep a reference to what it measures, or ask for a strong one:',
      jv(`import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.simple.*;

void main() throws Exception {
    var registry = new SimpleMeterRegistry();
    var limit = new Semaphore(10);
    Gauge.builder("payments.in.use", limit, s -> 10 - s.availablePermits()).strongReference(true).register(registry);
    limit.acquire(3);
    IO.println("payments.in.use = " + registry.get("payments.in.use").gauge().value());
    limit.release();
    IO.println("payments.in.use = " + registry.get("payments.in.use").gauge().value());
}`),
      out(`payments.in.use = 3.0
payments.in.use = 2.0`),
      '## Pinning',
      'Since Java 24 few things pin ([[lesson:vt-pinning]]), and when they do, JFR records `jdk.VirtualThreadPinned`, on by default, with its stack trace. Keep a JFR recording running in production; it costs little and it answers this question and others after the fact.'
    ].join('\n\n'),
    work: [
      '**Before you migrate,** list every alert and dashboard built on `executor.*` or on thread counts. They will not fire afterwards; they will not even say "no data" loudly. Replace them first, or you lose your overload alarm on the day you need it.',
      '**The USE method still applies:** utilisation, saturation, errors for each resource. Threads stopped being a resource; connections, downstream limits, memory and CPU are the ones left. Saturation now shows as **latency**, not as a full pool.',
      '**In an incident:** latency up, CPU low, errors low usually means waiting on something. Look at the connection pool first, then take the JDK\'s dump and group by top frame.'
    ].join('\n\n'),
    example: {
      code: `// A timer and a counter. Change the work, and read back what the registry recorded.
import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.simple.*;

void main() throws Exception {
    var registry = new SimpleMeterRegistry();
    Timer timer = Timer.builder("order.handle").publishPercentiles(0.99).register(registry);
    Counter failures = Counter.builder("order.failures").register(registry);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 20; i++) {
            int n = i;
            executor.submit(() -> timer.record(() -> {
                try { Thread.sleep(10 + n); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                if (n % 7 == 0) failures.increment();
            }));
        }
    }
    IO.println(timer.count() + " orders, longest about " + (int) timer.max(TimeUnit.MILLISECONDS) + " ms, " + (int) failures.count() + " failed");
}`,
      note: 'SimpleMeterRegistry keeps the numbers in memory; at work the registry sends them to Prometheus or similar.'
    },
    challenge: {
      title: 'A limit you can see',
      task: 'Virtual threads took away the pool graph, so give your limit its own. Write `meteredLimit(registry, name, permits)`: it makes a `Semaphore` with that many permits, registers a `Gauge` called `name` on the registry whose value is **the permits in use** (not the permits free), and returns the semaphore.\n\nThe gauge must keep working after your method returns, even if nothing else is holding on to it: ask for a strong reference.',
      starter: `import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.simple.*;

// A Semaphore, and a Gauge of the permits in use, registered under this name.
Semaphore meteredLimit(MeterRegistry registry, String name, int permits) {
    return new Semaphore(permits);
}

void main() throws Exception {
    var registry = new SimpleMeterRegistry();
    Semaphore limit = meteredLimit(registry, "calls.in.use", 5);
    limit.acquire();
    IO.println("available: " + limit.availablePermits());
}`,
      solution: `import io.micrometer.core.instrument.*;
import io.micrometer.core.instrument.simple.*;

Semaphore meteredLimit(MeterRegistry registry, String name, int permits) {
    var limit = new Semaphore(permits);
    Gauge.builder(name, limit, s -> permits - s.availablePermits()).strongReference(true).register(registry);
    return limit;
}

void main() throws Exception {
    var registry = new SimpleMeterRegistry();
    Semaphore limit = meteredLimit(registry, "calls.in.use", 5);
    limit.acquire();
    IO.println("available: " + limit.availablePermits());
}`,
      hints: [
        '`Gauge.builder(name, object, object -> value).register(registry)`: the function runs each time the gauge is read.',
        'Permits in use are `permits - s.availablePermits()`.',
        '`.strongReference(true)` before `.register`: otherwise the gauge holds its object weakly.'
      ],
      checks: [
        { label: 'it returns a semaphore with that many permits', code: `var registry = new io.micrometer.core.instrument.simple.SimpleMeterRegistry();
Semaphore s = c.call("meteredLimit", registry, "a", 5);
c.eq(s.availablePermits(), 5);` },
        { label: 'the gauge reads 0 when nothing is in use', code: `var registry = new io.micrometer.core.instrument.simple.SimpleMeterRegistry();
Semaphore s = c.call("meteredLimit", registry, "a", 5);
c.eq(registry.get("a").gauge().value(), 0.0);` },
        { label: 'the gauge counts the permits in use', code: `var registry = new io.micrometer.core.instrument.simple.SimpleMeterRegistry();
Semaphore s = c.call("meteredLimit", registry, "a", 5);
s.acquire(3);
c.eq(registry.get("a").gauge().value(), 3.0);
s.release();
c.eq(registry.get("a").gauge().value(), 2.0);` },
        { label: 'it survives a garbage collection with nothing else holding the semaphore', code: `var registry = new io.micrometer.core.instrument.simple.SimpleMeterRegistry();
c.call("meteredLimit", registry, "a", 5);
for (int i = 0; i < 5; i++) {
    System.gc();
    Thread.sleep(20);
}
c.ok(!Double.isNaN(registry.get("a").gauge().value()), "the gauge reads NaN: it held the semaphore weakly, and it has been collected");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 10 */
  L.push({
    id: 'sp-migrate', track: 'spring', title: 'Migrating a real service',
    summary: 'The property takes a minute; the migration is everything it silently changes. The limit your thread pool was enforcing without anyone deciding it, ThreadLocal caches, jobs, dashboards. A checklist, in order, and how to roll back.',
    keywords: ['migration', 'migrate to virtual threads', 'checklist', 'rollout', 'threadlocal cache', 'hidden limit', 'bulkhead', 'canary', 'jdk upgrade', 'load test'],
    docs: 'https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html', docsLabel: 'Java 25: virtual threads guide', lab: '56-microservices',
    body: [
      '## What the pool was doing for you',
      'A pool of 200 threads did not only run your code. Without anyone deciding it, it also meant **at most 200 calls to every service behind you**. Remove the pool, and that limit goes with it, in production, under the worst possible load:',
      jv(`int peakCalls(ExecutorService executor, Semaphore limit, int tasks) {
    var inFlight = new AtomicInteger();
    var peak = new AtomicInteger();
    var gate = new CountDownLatch(Math.min(tasks, 20));
    try (executor) {
        for (int i = 0; i < tasks; i++) {
            executor.submit(() -> {
                if (limit != null) limit.acquire();
                try {
                    peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    gate.countDown();
                    gate.await(100, TimeUnit.MILLISECONDS);
                    inFlight.decrementAndGet();
                } finally {
                    if (limit != null) limit.release();
                }
                return null;
            });
        }
    }
    return peak.get();
}

void main() {
    IO.println("a pool of 5, 20 tasks: at most 5 calls at once: " + (peakCalls(Executors.newFixedThreadPool(5), null, 20) <= 5));
    IO.println("virtual threads, 20 tasks: all 20 at once: " + (peakCalls(Executors.newVirtualThreadPerTaskExecutor(), null, 20) == 20));
    IO.println("virtual threads with a semaphore of 5: at most 5: " + (peakCalls(Executors.newVirtualThreadPerTaskExecutor(), new Semaphore(5), 20) <= 5));
}`),
      out(`a pool of 5, 20 tasks: at most 5 calls at once: true
virtual threads, 20 tasks: all 20 at once: true
virtual threads with a semaphore of 5: at most 5: true`),
      '**Find every limit your pool was enforcing, and write it down as a real limit.** The Challenge does this one.',
      '## What ThreadLocal caches were counting on',
      'A `ThreadLocal` used as a cache (one parser, one buffer per thread) works because threads are few and long-lived. Virtual threads are neither: one per task means **one per task**, and never reused ([[lesson:vt-threadlocals]]):',
      jv(`int buffersMade(ExecutorService executor) {
    var made = new AtomicInteger();
    var buffer = ThreadLocal.withInitial(() -> {
        made.incrementAndGet();
        return new byte[1024];
    });
    try (executor) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(() -> buffer.get().length);
        }
    }
    return made.get();
}

void main() {
    IO.println("a pool of 4, 1000 tasks: at most 4 buffers: " + (buffersMade(Executors.newFixedThreadPool(4)) <= 4));
    IO.println("virtual threads, 1000 tasks: " + buffersMade(Executors.newVirtualThreadPerTaskExecutor()) + " buffers");
}`),
      out(`a pool of 4, 1000 tasks: at most 4 buffers: true
virtual threads, 1000 tasks: 1000 buffers`),
      'Search for `ThreadLocal` in your code and your libraries\' release notes. Context is fine, but a cache needs another home: a real pool of objects, a local variable, or nothing, if allocating is cheap enough.',
      '## The checklist',
      'In this order. Each step is safe to stop after.',
      '| # | Do | Why | Lesson |\n|---|---|---|---|\n| 1 | Upgrade to Java 24 or later | `synchronized` no longer pins | [[lesson:vt-pinning]] |\n| 2 | Replace pool dashboards and alerts | they go blank | [[lesson:sp-observe]] |\n| 3 | Write down each limit the pool enforced: database, each dependency | they vanish | above |\n| 4 | Add a timeout to every remote call | waiting got cheap | [[lesson:sp-resilience]] |\n| 5 | Look at every `fixedRate` job, every `ThreadLocal` cache | behaviour changes | [[lesson:sp-jobs]] |\n| 6 | Check native calls, `static` initialisers that block | these still pin | [[lesson:vt-pinning]] |\n| 7 | Is the service really waiting, not computing? | CPU work gains nothing | [[lesson:vt-cpu-bound]] |\n| 8 | Load test before and after, past the old limit | that is where it changes | below |\n| 9 | Turn it on behind config, one instance, then more | turning it off is a deploy | |\n| 10 | Only then, remove the pool settings, now ignored | they mislead readers | [[lesson:sp-virtual]] |',
      '## What to test',
      'Load past the old limit, with a dependency made slow on purpose, because that is exactly what changes. Compare: in-flight requests, latency percentiles, connection pool pending, heap, the dependency\'s own load. "It starts and the tests pass" proves very little here: the tests do not have the load, and a race test that passes proves nothing ([[lesson:th-races]]).',
      '## When not to',
      'Mostly computing: no gain, and possibly some loss ([[lesson:vt-cpu-bound]]). A heavy dependence on `ThreadLocal` caches in libraries you cannot change. Native calls that block on a thread. And a service with no latency problem and a tight deadline: a working service does not need a migration, however good the idea is.'
    ].join('\n\n'),
    work: [
      '**Measure, do not assume.** Teams report large gains and small ones, because it depends entirely on how much the service waits. Your own before-and-after, on your own traffic, is the only number worth quoting. The [[explain:throughput|simulator]] shows the arithmetic; your load test shows the truth.',
      '**The usual surprise after a migration** is not in the service. It is a dependency that had never seen more than 200 concurrent calls from you, and now does.',
      '**Keep the way back.** Keep the property in config until you have run through a peak. Rolling back must be a config change, not a revert.'
    ].join('\n\n'),
    example: {
      code: `// The checklist's step 3 by hand. Change the limit and the tasks.
void main() throws InterruptedException {
    var limit = new Semaphore(3);
    var inFlight = new AtomicInteger();
    var peak = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 12; i++) {
            executor.submit(() -> {
                limit.acquire();
                try {
                    peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    Thread.sleep(50);
                    inFlight.decrementAndGet();
                } finally {
                    limit.release();
                }
                return null;
            });
        }
    }
    IO.println("the most calls at once: " + peak);
}`,
      note: '12 virtual threads exist; only 3 are ever calling. The other 9 wait, cheaply.'
    },
    challenge: {
      title: 'Keep the limit the pool was enforcing',
      task: 'A service moved from a pool of `limit` threads to virtual threads, and a downstream service fell over. Write `fetchAll(service, ids, limit)`:\n\n- one virtual thread per id;\n- at most `limit` calls to `service.fetch` at once, and it must **reach** `limit` (one at a time is too slow);\n- answers in the order of `ids`;\n- a failed call must give its permit back: other calls carry on, and `fetchAll` then throws.\n\nDo not make a pool of `limit` threads: this is the limit on the **calls**, as other work in a thread may not need it.',
      files: [{ name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws Exception;
}
` }],
      starter: `// One virtual thread per id; at most limit calls at once; answers in order.
List<String> fetchAll(Service service, List<String> ids, int limit) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var futures = new ArrayList<Future<String>>();
        for (String id : ids) {
            futures.add(executor.submit(() -> service.fetch(id)));
        }
        var answers = new ArrayList<String>();
        for (var f : futures) {
            answers.add(f.get());
        }
        return answers;
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b"), 1));
}`,
      solution: `List<String> fetchAll(Service service, List<String> ids, int limit) throws Exception {
    var permits = new Semaphore(limit);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var futures = new ArrayList<Future<String>>();
        for (String id : ids) {
            futures.add(executor.submit(() -> {
                permits.acquire();
                try {
                    return service.fetch(id);
                } finally {
                    permits.release();
                }
            }));
        }
        var answers = new ArrayList<String>();
        for (var f : futures) {
            answers.add(f.get());
        }
        return answers;
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(fetchAll(service, List.of("a", "b"), 1));
}`,
      hints: [
        'A `Semaphore(limit)` made once, before the loop, shared by every task.',
        'Inside each task: `permits.acquire();` then `try { return service.fetch(id); } finally { permits.release(); }`.',
        'The `finally` is the part that matters: without it, each failure removes one permit for good.'
      ],
      checks: [
        { label: 'the answers come back in order', code: `Service service = id -> "answer " + id;
c.eq(c.call("fetchAll", service, List.of("a", "b", "c"), 2), List.of("answer a", "answer b", "answer c"));` },
        { label: 'never more than the limit at once', code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(20); return id; };
var ids = new ArrayList<String>();
for (int i = 0; i < 20; i++) ids.add("x" + i);
c.call("fetchAll", service, ids, 3);
c.ok(probe.peak() <= 3, probe.peak() + " calls at once, with a limit of 3");` },
        { label: 'it reaches the limit', code: `var probe = c.probe(3);
Service service = id -> { probe.meet(); return id; };
c.call("fetchAll", service, List.of("a", "b", "c", "d", "e", "f"), 3);
c.ok(probe.peak() == 3, "at most " + probe.peak() + " at once, with a limit of 3");` },
        { label: 'each call runs on a virtual thread', code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(1); return id; };
c.call("fetchAll", service, List.of("a", "b"), 2);
c.ok(probe.allVirtual(), probe.platformCalls() + " calls ran on a platform thread");` },
        { label: 'failed calls give their permits back, and the rest still run', code: `var finished = new AtomicInteger();
Service service = id -> {
    if (id.startsWith("bad")) throw new IllegalStateException("down");
    finished.incrementAndGet();
    return id;
};
try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var done = watcher.submit(c.task(() -> {
        try {
            c.call("fetchAll", service, List.of("bad1", "bad2", "good1", "good2"), 2);
        } catch (ExecutionException e) {
        }
    }));
    try {
        done.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("it never finished: the failed calls kept their permits, so the others wait for ever");
    }
    c.eq(finished.get(), 2);
    watcher.shutdownNow();
}` }
      ]
    }
  });
})(window.JCLT);
