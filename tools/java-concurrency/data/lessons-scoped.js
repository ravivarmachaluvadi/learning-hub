/*
 * data/lessons-scoped.js - Track 5, Scoped values and the other new APIs: five lessons (batch 2).
 * The lesson shape is described at the top of data/lessons-virtual-threads.js.
 *
 * Scoped values are final in Java 25 (JEP 506); Gatherers.mapConcurrent has been final since 24 (JEP 485);
 * StableValue is a preview in 25 (JEP 502), renamed LazyConstant in 26 (JEP 526). Each fact was read on
 * openjdk.org and probed on JDK 25.0.4.1 (ROADMAP.md, batch 2).
 */
(function (U) {
  'use strict';
  function jv(code) { return '```java\n' + code + '\n```'; }
  function norun(code) { return '```java-norun\n' + code + '\n```'; }
  function out(text) { return '```output\n' + text + '\n```'; }
  var L = U.data.lessons = U.data.lessons || [];

  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws InterruptedException;
}
` };

  var CALL_GREET = '(Service) id -> { try { return c.call("greet"); } catch (Throwable t) { throw new RuntimeException(t); } }';

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'sv-basics', track: 'scoped', title: 'Scoped values',
    summary: 'A ScopedValue is bound with where(key, value).run(...) for the duration of a call, read anywhere inside it with get(), and cannot be changed. Final in Java 25.',
    keywords: ['ScopedValue', 'scoped value', 'where', 'run', 'call', 'get', 'isBound', 'orElse', 'context', 'implicit parameter', 'jep 506'],
    docs: 'https://openjdk.org/jeps/506', docsLabel: 'JEP 506: Scoped Values', lab: '20-scoped-values',
    body: [
      '## A value for the length of a call',
      'Some values belong to a whole request: the user, the tenant, a trace id. Passing them through every method is noise; a `ThreadLocal` is a global variable per thread, which anyone can change and which outlives the request unless someone remembers `remove()`. A **scoped value** is bound for exactly one call and everything it calls:',
      jv(`static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() {
    ScopedValue.where(USER, "ravi").run(() -> handle());
    IO.println("outside: bound? " + USER.isBound());
}

void handle() {
    IO.println("handling for " + USER.get());
    audit();
}

void audit() {
    IO.println("audit: " + USER.get());
}`),
      out(`handling for ravi
audit: ravi
outside: bound? false`),
      '`handle` and `audit` take no user parameter, yet read it. Outside the `run`, the key is unbound again: nothing to clean up, nothing to leak.',
      '## call, several keys, and unbound reads',
      jv(`static final ScopedValue<String> USER = ScopedValue.newInstance();
static final ScopedValue<String> TENANT = ScopedValue.newInstance();

String describe() {
    return USER.get() + "@" + TENANT.get();
}

void main() {
    String who = ScopedValue.where(USER, "ravi").where(TENANT, "acme").call(this::describe);
    IO.println(who);
    IO.println("unbound, orElse: " + USER.orElse("guest"));
    try {
        USER.get();
    } catch (NoSuchElementException e) {
        IO.println("unbound, get: " + e.getMessage());
    }
}`),
      out(`ravi@acme
unbound, orElse: guest
unbound, get: ScopedValue not bound`),
      '| Method | Does |\n|---|---|\n| `ScopedValue.newInstance()` | a new key, usually a `private static final` field |\n| `where(key, value)` | a carrier of bindings; chain `.where(…)` for more keys |\n| `.run(runnable)`, `.call(op)` | run code with the bindings in force; `call` returns a value and may throw checked exceptions |\n| `get()` | the value; throws `NoSuchElementException` when unbound |\n| `isBound()`, `orElse(other)` | ask first, or use a default (`orElse(null)` throws in Java 25) |',
      '## No set',
      'There is no `set`: inside a binding the value cannot change. A callee that needs a different value binds the key again for its own callees (lesson [[lesson:sv-rebinding]]). Data flows one way, from caller to callees, which is what makes scoped values cheap to read and safe to share with subtasks.'
    ].join('\n\n'),
    work: [
      '**A servlet filter in Spring** is the natural place to bind request context: `ScopedValue.where(TENANT, tenantFrom(request)).call(() -> { chain.doFilter(request, response); return null; })`. Everything the request calls, on its virtual thread, reads `TENANT.get()`. `call` lets the filter\'s `IOException` and `ServletException` through.',
      '**What stays a ThreadLocal for now:** Spring\'s own holders (`SecurityContextHolder`, `RequestContextHolder`, the transaction manager\'s resources) and the logging MDC are `ThreadLocal`-based, and libraries set them. Scoped values are for your own context; the next lessons show how they reach subtasks, which `ThreadLocal`s do not.'
    ].join('\n\n'),
    example: {
      code: `static final ScopedValue<String> TRACE = ScopedValue.newInstance();

void log(String message) {
    IO.println("[" + TRACE.orElse("no-trace") + "] " + message);
}

void main() {
    log("starting");
    ScopedValue.where(TRACE, "t-1001").run(() -> {
        log("loading the order");
        log("charging the card");
    });
    log("done");
}`
    },
    challenge: {
      title: 'Who is asking',
      task: 'Write two methods around a scoped value `USER` of your own:\n\n1. `greet()` returns `"hello " + ` the bound user, or `"hello guest"` when none is bound;\n2. `handle(user, work)` binds `USER` to `user` and returns `work.fetch("job")`, called with that binding in force.\n\nTwo requests handled at the same time must each see their own user, and nothing stays bound after `handle` returns. Use `ScopedValue`, not a `ThreadLocal` or a field.',
      files: [SERVICE],
      starter: `static String currentUser;                    // a shared field: two requests at once overwrite each other

String greet() {
    return "hello " + (currentUser == null ? "guest" : currentUser);
}

String handle(String user, Service work) throws Exception {
    currentUser = user;
    try {
        return work.fetch("job");
    } finally {
        currentUser = null;
    }
}

void main() throws Exception {
    IO.println(greet());
    IO.println(handle("ravi", id -> greet()));
}`,
      solution: `static final ScopedValue<String> USER = ScopedValue.newInstance();

String greet() {
    return "hello " + USER.orElse("guest");
}

String handle(String user, Service work) throws Exception {
    return ScopedValue.where(USER, user).call(() -> work.fetch("job"));
}

void main() throws Exception {
    IO.println(greet());
    IO.println(handle("ravi", id -> greet()));
}`,
      hints: [
        '`static final ScopedValue<String> USER = ScopedValue.newInstance();`',
        '`greet`: `"hello " + USER.orElse("guest")`.',
        '`handle`: `return ScopedValue.where(USER, user).call(() -> work.fetch("job"));` (`call` lets `InterruptedException` through).'
      ],
      checks: [
        { label: 'greet() with nothing bound: "hello guest"', code: `c.eq(c.call("greet"), "hello guest");` },
        { label: 'handle("ravi", …) runs the work with the user bound', code: `c.eq(c.call("handle", "ravi", ${CALL_GREET}), "hello ravi");` },
        { label: 'nothing stays bound after handle returns', code: `c.call("handle", "ravi", ${CALL_GREET});
c.eq(c.call("greet"), "hello guest");` },
        { label: 'two requests at once each see their own user', code: `var p = c.probe(2);
Service work = id -> { p.meet(); try { return c.call("greet"); } catch (Throwable t) { throw new RuntimeException(t); } };
List<Future<String>> results = new ArrayList<>();
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    results.add(executor.submit(c.callable("handle", "asha", work)));
    results.add(executor.submit(c.callable("handle", "ravi", work)));
}
c.eq(List.of(results.get(0).get(), results.get(1).get()), List.of("hello asha", "hello ravi"));` },
        { label: 'it uses a ScopedValue, not a ThreadLocal', code: `c.ok(c.uses("ScopedValue") && !c.uses("ThreadLocal"), "bind the user with a ScopedValue");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'sv-rebinding', track: 'scoped', title: 'Rebinding and nesting',
    summary: 'A nested where(...).run(...) binds a key again for its own callees: the outer value is hidden, not changed, and comes back when the inner block ends. Useful for depth, roles and nested transactions.',
    keywords: ['rebinding', 'nested', 'ScopedValue', 'shadowing', 'recursion depth', 'role', 'elevate', 'sudo'],
    docs: 'https://openjdk.org/jeps/506', docsLabel: 'JEP 506: Scoped Values', lab: '20-scoped-values',
    body: [
      '## Bind again, for a smaller block',
      'A callee cannot change a scoped value, but it can bind the same key again for the code *it* calls. The inner binding hides the outer one, and when the inner block ends, the outer value is back: it was never overwritten. The [[explain:scoped-bindings]] explainer draws it.',
      jv(`static final ScopedValue<String> ROLE = ScopedValue.newInstance();

String role() {
    return ROLE.orElse("anonymous");
}

void main() {
    IO.println("before: " + role());
    ScopedValue.where(ROLE, "user").run(() -> {
        IO.println("as " + role());
        ScopedValue.where(ROLE, "admin").run(() -> IO.println("elevated: " + role()));
        IO.println("back to " + role());
    });
}`),
      out(`before: anonymous
as user
elevated: admin
back to user`),
      '## A depth that follows the calls',
      'Rebinding to a new value for each level gives every level its own value, without a counter to increment and decrement (and forget to decrement when an exception passes):',
      jv(`static final ScopedValue<Integer> DEPTH = ScopedValue.newInstance();

void visit(String name, Map<String, List<String>> children) {
    int depth = DEPTH.orElse(0);
    IO.println("  ".repeat(depth) + name);
    for (String child : children.getOrDefault(name, List.of())) {
        ScopedValue.where(DEPTH, depth + 1).run(() -> visit(child, children));
    }
}

void main() {
    var tree = Map.of("order", List.of("item-1", "item-2"), "item-1", List.of("price", "stock"));
    visit("order", tree);
}`),
      out(`order
  item-1
    price
    stock
  item-2`),
      '## Why not a mutable value?',
      'Because the binding cannot change while it is in force, a reader never sees a half-made update, code you call cannot leave a changed value behind for code that runs after it, and a subtask can read the parent\'s value without copying it. If a callee must return something to its caller, return it: scoped values flow one way.'
    ].join('\n\n'),
    work: [
      '**Running part of a request with more rights,** the way a support tool acts as an admin for one operation: rebind the role for that call only, and it ends with the call even if it throws. Compare a `ThreadLocal` set and reset in a `try`/`finally`, where a forgotten `finally` leaves the request elevated.',
      '**Nested transactions or tracing spans** follow the same shape: each level binds its own transaction or span for its callees, and the outer one is untouched when the inner returns.'
    ].join('\n\n'),
    example: {
      code: `static final ScopedValue<String> SPAN = ScopedValue.newInstance();

void inSpan(String name, Runnable work) {
    String parent = SPAN.orElse("root");
    ScopedValue.where(SPAN, parent + " > " + name).run(work);
}

void main() {
    inSpan("checkout", () -> {
        IO.println(SPAN.get());
        inSpan("charge-card", () -> IO.println(SPAN.get()));
        inSpan("send-email", () -> IO.println(SPAN.get()));
    });
}`
    },
    challenge: {
      title: 'Roles for one call',
      task: 'Write `currentRole()` (the bound role, or `"anonymous"`) and `withRole(role, work)`, which runs `work.get()` with the role bound and returns its result. Nested calls must rebind: inside `withRole("admin", …)` called from inside `withRole("user", …)` the role is `"admin"`, and `"user"` again afterwards.',
      starter: `String currentRole() {
    throw new UnsupportedOperationException("Not written yet");
}

String withRole(String role, Supplier<String> work) {
    throw new UnsupportedOperationException("Not written yet");
}

void main() {
    IO.println(withRole("user", () -> currentRole() + "," + withRole("admin", this::currentRole) + "," + currentRole()));
}`,
      solution: `static final ScopedValue<String> ROLE = ScopedValue.newInstance();

String currentRole() {
    return ROLE.orElse("anonymous");
}

String withRole(String role, Supplier<String> work) {
    return ScopedValue.where(ROLE, role).call(work::get);
}

void main() {
    IO.println(withRole("user", () -> currentRole() + "," + withRole("admin", this::currentRole) + "," + currentRole()));
}`,
      hints: [
        'A `static final ScopedValue<String> ROLE`, and `currentRole()` is `ROLE.orElse("anonymous")`.',
        '`withRole`: `return ScopedValue.where(ROLE, role).call(work::get);`. Nesting needs nothing more: the inner `where` hides the outer binding for its own block.'
      ],
      checks: [
        { label: 'no role bound: "anonymous"', code: `c.eq(c.call("currentRole"), "anonymous");` },
        { label: 'withRole("user", currentRole) is "user"', code: `Supplier<String> who = () -> { try { return c.call("currentRole"); } catch (Throwable t) { throw new RuntimeException(t); } };
c.eq(c.call("withRole", "user", who), "user");` },
        { label: 'nested: "user,admin,user"', code: `Supplier<String> who = () -> { try { return c.call("currentRole"); } catch (Throwable t) { throw new RuntimeException(t); } };
Supplier<String> nested = () -> { try { return who.get() + "," + c.call("withRole", "admin", who) + "," + who.get(); } catch (Throwable t) { throw new RuntimeException(t); } };
c.eq(c.call("withRole", "user", nested), "user,admin,user");` },
        { label: 'after withRole returns: "anonymous" again', code: `Supplier<String> who = () -> { try { return c.call("currentRole"); } catch (Throwable t) { throw new RuntimeException(t); } };
c.call("withRole", "user", who);
c.eq(c.call("currentRole"), "anonymous");` },
        { label: 'a failing work still ends the binding', code: `try {
    c.call("withRole", "admin", (Supplier<String>) () -> { throw new IllegalStateException("boom"); });
} catch (IllegalStateException e) { }
c.eq(c.call("currentRole"), "anonymous");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'sv-inheritance', track: 'scoped', title: 'Inheritance, and leaving ThreadLocal',
    summary: 'Subtasks forked in a StructuredTaskScope read the parent\'s bindings, without copying; an executor\'s threads do not. InheritableThreadLocal copies once, at thread creation, so pooled threads keep stale values.',
    keywords: ['inheritance', 'ScopedValue', 'StructuredTaskScope', 'fork', 'InheritableThreadLocal', 'migration', 'ThreadLocal', 'executor', 'request context'],
    docs: 'https://openjdk.org/jeps/506', docsLabel: 'JEP 506: Scoped Values', lab: '20-scoped-values',
    body: [
      '## Subtasks see the binding',
      'A subtask forked in a `StructuredTaskScope` inherits the bindings in force where the scope was opened: it reads the same value, nothing copied. The scope guarantees every subtask ends before the scope closes, so no thread can outlive the binding. An executor promises no such thing, so its threads inherit nothing (probed on 25):',
      jv(`static final ScopedValue<String> REQUEST = ScopedValue.newInstance();

void main() throws Exception {
    ScopedValue.where(REQUEST, "req-42").call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {
            scope.fork(() -> "subtask 1 sees " + REQUEST.get());
            scope.fork(() -> "subtask 2 sees " + REQUEST.get());
            scope.join().map(StructuredTaskScope.Subtask::get).forEach(IO::println);
        }
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IO.println("executor thread: bound? " + executor.submit(() -> REQUEST.isBound()).get());
        }
        return null;
    });
}`),
      out(`subtask 1 sees req-42
subtask 2 sees req-42
executor thread: bound? false`),
      '## InheritableThreadLocal copies once',
      'An `InheritableThreadLocal` is copied into a thread when the thread is *made*. A pool makes its threads once and reuses them, so they keep whatever was current at that moment:',
      jv(`static final InheritableThreadLocal<String> TENANT = new InheritableThreadLocal<>();

void main() throws Exception {
    TENANT.set("acme");
    try (var pool = Executors.newFixedThreadPool(1)) {
        pool.submit(() -> IO.println("pool thread, made now: " + TENANT.get())).get();
        TENANT.set("globex");
        pool.submit(() -> IO.println("same pool thread, later: " + TENANT.get())).get();
    }
}`),
      out(`pool thread, made now: acme
same pool thread, later: acme`),
      'The second task ran for `globex` and read `acme`: a request served with another tenant\'s data. Scoped values cannot do this: a binding ends with its block, and only structured subtasks see it.',
      '## Moving a ThreadLocal to a ScopedValue',
      'JEP 506\'s advice: migrate a `ThreadLocal` that carries **unchanging data one way**, from caller to callees (a user, a tenant, a request id). Keep a `ThreadLocal` where data flows back through `set`, or for a per-thread cache of a mutable object. Steps: make the `ThreadLocal` a `ScopedValue`; replace the `set(…)` / `try` / `finally remove()` with `where(…).run(…)` around the call; leave every `get()` as it is; and fork with a scope where an executor used to lose the value.'
    ].join('\n\n'),
    work: [
      '**The lost-context bug in Spring:** a request handler that hands work to `@Async`, an executor or `CompletableFuture.supplyAsync` loses `SecurityContextHolder`, the MDC (so log lines lose the trace id) and the transaction, because they are `ThreadLocal`s and the work runs on another thread. The fixes today are copying them across (a `TaskDecorator`, Spring Security\'s `DelegatingSecurityContextExecutor`, Micrometer\'s context propagation); Track 6 shows them. For your own context, a scoped value plus a structured scope needs no copying at all.',
      '**Tenant leaks are real incidents:** pooled threads carrying a previous request\'s `ThreadLocal` (set and never removed) have served one customer\'s data to another. A scoped value cannot outlive its block.'
    ].join('\n\n'),
    example: {
      code: `static final ScopedValue<String> TRACE = ScopedValue.newInstance();

String call(String service) throws InterruptedException {
    Thread.sleep(50);
    return service + " (trace " + TRACE.get() + ")";
}

void main() throws Exception {
    ScopedValue.where(TRACE, "t-77").call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {
            scope.fork(() -> call("users"));
            scope.fork(() -> call("orders"));
            scope.join().map(StructuredTaskScope.Subtask::get).forEach(IO::println);
        }
        return null;
    });
}`
    },
    challenge: {
      title: 'The request id in every subtask',
      task: '`RequestContext.ID` (in its own file, read-only) is a scoped value for the request id. Write `fanOut(requestId, ids, service)`: bind `RequestContext.ID` to `requestId`, call `service.fetch(id)` for every id **at the same time, in a structured scope**, and return the answers in the order of the ids.\n\nThe checks\' service reads `RequestContext.ID.get()` inside each call: on an executor\'s thread it would not be bound.',
      files: [SERVICE, { name: 'RequestContext.java', code: `/** The request being served: bound around a request, read anywhere inside it. */
public final class RequestContext {
    public static final ScopedValue<String> ID = ScopedValue.newInstance();

    private RequestContext() {
    }
}
` }],
      starter: `List<String> fanOut(String requestId, List<String> ids, Service service) throws Exception {
    // As written, the calls run on an executor's threads, where RequestContext.ID is not bound.
    return ScopedValue.where(RequestContext.ID, requestId).call(() -> {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<String>> futures = new ArrayList<>();
            for (String id : ids) futures.add(executor.submit(() -> service.fetch(id)));
            List<String> answers = new ArrayList<>();
            for (var f : futures) answers.add(f.get());
            return answers;
        }
    });
}

void main() throws Exception {
    IO.println(fanOut("req-1", List.of("a", "b"), id -> id + "@" + RequestContext.ID.orElse("?")));
}`,
      solution: `List<String> fanOut(String requestId, List<String> ids, Service service) throws Exception {
    return ScopedValue.where(RequestContext.ID, requestId).call(() -> {
        try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {
            for (String id : ids) {
                scope.fork(() -> service.fetch(id));
            }
            return scope.join().map(StructuredTaskScope.Subtask::get).toList();
        }
    });
}

void main() throws Exception {
    IO.println(fanOut("req-1", List.of("a", "b"), id -> id + "@" + RequestContext.ID.orElse("?")));
}`,
      hints: [
        'Keep the `ScopedValue.where(RequestContext.ID, requestId).call(…)`; inside it, swap the executor for a `StructuredTaskScope`.',
        'With `allSuccessfulOrThrow()`, `scope.join().map(StructuredTaskScope.Subtask::get).toList()` is the answers in fork order.'
      ],
      checks: [
        { label: 'every call sees the request id', code: `c.eq(c.call("fanOut", "req-7", List.of("a", "b"), (Service) id -> id + "@" + RequestContext.ID.get()), List.of("a@req-7", "b@req-7"));` },
        { label: 'the calls run at the same time', code: `var p = c.probe(3);
c.call("fanOut", "r", List.of("a", "b", "c"), (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 3 calls were in flight at once");` },
        { label: 'each call runs on a virtual thread', code: `var p = c.probe(2);
c.call("fanOut", "r", List.of("a", "b"), (Service) id -> { p.meet(); return id; });
c.ok(p.allVirtual(), p.platformCalls() + " calls ran on a platform thread");` },
        { label: 'nothing stays bound after fanOut returns', code: `c.call("fanOut", "req-9", List.of("a"), (Service) id -> id);
c.ok(!RequestContext.ID.isBound(), "RequestContext.ID is still bound after fanOut returned");` },
        { label: 'two requests at once keep their own ids', code: `var p = c.probe(2);
Service s = id -> { p.meet(); return RequestContext.ID.get(); };
List<Future<List<String>>> results = new ArrayList<>();
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    results.add(executor.submit(c.callable("fanOut", "req-A", List.of("x"), s)));
    results.add(executor.submit(c.callable("fanOut", "req-B", List.of("y"), s)));
}
c.eq(List.of(results.get(0).get(), results.get(1).get()), List.of(List.of("req-A"), List.of("req-B")));` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'sv-map-concurrent', track: 'scoped', title: 'Gatherers.mapConcurrent',
    summary: 'A stream step that runs a blocking function on virtual threads, at most n at once, keeping the stream\'s order; a failure is rethrown and the rest cancelled. Final since Java 24. Use it where a parallel stream would block the common pool.',
    keywords: ['Gatherers', 'mapConcurrent', 'gather', 'stream', 'bounded concurrency', 'parallelStream', 'virtual threads', 'jep 485'],
    docs: 'https://openjdk.org/jeps/485', docsLabel: 'JEP 485: Stream Gatherers', lab: '18-java-virtual-threads',
    body: [
      '## A stream step that waits well',
      '`stream.gather(Gatherers.mapConcurrent(n, fn))` applies `fn` to each element on **virtual threads**, with at most `n` running at once, and passes the results on **in the stream\'s order** (the javadoc says so; probed on 25).',
      jv(`void main() {
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    var onVirtual = new AtomicInteger();
    List<String> pages = IntStream.rangeClosed(1, 12).boxed()
        .gather(Gatherers.mapConcurrent(4, i -> {
            most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
            if (Thread.currentThread().isVirtual()) onVirtual.incrementAndGet();
            try {
                Thread.sleep(130 - i * 10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            inFlight.decrementAndGet();
            return "page-" + i;
        }))
        .toList();
    IO.println(pages);
    IO.println("at most " + most.get() + " at once, " + onVirtual.get() + " of 12 on virtual threads");
}`),
      out(`[page-1, page-2, page-3, page-4, page-5, page-6, page-7, page-8, page-9, page-10, page-11, page-12]
at most 4 at once, 12 of 12 on virtual threads`),
      'The later pages slept less and finished first, yet come out in order.',
      '## A failure',
      jv(`void main() {
    try {
        List.of(1, 2, 3, 4).stream()
            .gather(Gatherers.mapConcurrent(2, i -> {
                if (i == 3) throw new IllegalStateException("item 3 failed");
                return i;
            }))
            .toList();
    } catch (IllegalStateException e) {
        IO.println("the stream threw: " + e.getMessage());
    }
}`),
      out('the stream threw: item 3 failed'),
      'The exception is rethrown as a `RuntimeException` (this one already is one) and the remaining tasks are cancelled. The function is a `Function`, so it cannot throw checked exceptions: wrap an `InterruptedException` or an `IOException`.',
      '## Not a parallel stream',
      '| | `parallelStream()` | `mapConcurrent(n, fn)` |\n|---|---|---|\n| Threads | the common `ForkJoinPool`: one per processor, less one | a virtual thread per element |\n| For | computing | waiting (HTTP, database) |\n| How many at once | the pool decides | at most `n`: you decide |\n| Order | kept for `toList()`, not for `forEach` | always kept |'
    ].join('\n\n'),
    work: [
      '**Enriching a batch:** a job that reads 10,000 rows and calls a pricing service for each, at most 20 at a time (the service\'s limit), is one stream: `rows.stream().gather(Gatherers.mapConcurrent(20, this::price)).toList()`. Before Java 24 that was an executor, a semaphore and a list of futures.',
      '**The parallel-stream trap:** `ids.parallelStream().map(id -> restClient.get()…)` in a Spring service blocks the common pool, which `CompletableFuture.supplyAsync` and every other parallel stream in the JVM share. The ⚠ in this tool\'s editor flags a blocking call inside a parallel stream.'
    ].join('\n\n'),
    example: {
      code: `String fetch(String url) {
    try {
        Thread.sleep(100);                      // stands for an HTTP call
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException(e);
    }
    return url + " -> 200";
}

void main() {
    long start = System.nanoTime();
    var results = Stream.of("a", "b", "c", "d", "e", "f", "g", "h")
        .gather(Gatherers.mapConcurrent(4, this::fetch))
        .toList();
    results.forEach(IO::println);
    IO.println((System.nanoTime() - start) / 1_000_000 + " ms (two waves of four)");
}`
    },
    challenge: {
      title: 'A stream, n at a time',
      task: 'Write `fetchAll(ids, service, max)` as **one stream**: `service.fetch(id)` for each id, on virtual threads, **at most `max` at once**, the answers in the order of the ids. Use `Gatherers.mapConcurrent`. (`fetch` throws `InterruptedException`, which a `Function` may not: wrap it.)',
      files: [SERVICE],
      starter: `List<String> fetchAll(List<String> ids, Service service, int max) {
    throw new UnsupportedOperationException("Not written yet");
}

void main() {
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id.toUpperCase(), 2));
}`,
      solution: `List<String> fetchAll(List<String> ids, Service service, int max) {
    return ids.stream()
        .gather(Gatherers.mapConcurrent(max, id -> {
            try {
                return service.fetch(id);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
        }))
        .toList();
}

void main() {
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id.toUpperCase(), 2));
}`,
      hints: [
        '`ids.stream().gather(Gatherers.mapConcurrent(max, id -> …)).toList()`.',
        'Inside the lambda, `try { return service.fetch(id); } catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException(e); }`.'
      ],
      checks: [
        { label: 'the answers come back in the order of the ids', code: `c.eq(c.call("fetchAll", List.of("slow", "b", "c"), (Service) id -> { if (id.equals("slow")) Thread.sleep(200); return id + "!"; }, 3), List.of("slow!", "b!", "c!"));` },
        { label: 'with max 3, three run together', code: `var p = c.probe(3);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 9; i++) ids.add("id" + i);
c.call("fetchAll", ids, (Service) id -> { p.meet(); p.sleep(20); return id; }, 3);
c.ok(p.met(), "at most " + p.peak() + " calls were in flight at once, with a max of 3");` },
        { label: 'never more than max at once', code: `var p = c.probe(3);
List<String> ids = new ArrayList<>();
for (int i = 0; i < 9; i++) ids.add("id" + i);
c.call("fetchAll", ids, (Service) id -> { p.meet(); p.sleep(20); return id; }, 3);
c.ok(p.peak() <= 3, p.peak() + " calls were in flight at once, with a max of 3");` },
        { label: 'the calls run on virtual threads', code: `var p = c.probe(2);
c.call("fetchAll", List.of("a", "b"), (Service) id -> { p.meet(); return id; }, 2);
c.ok(p.allVirtual(), p.platformCalls() + " calls ran on a platform thread");` },
        { label: 'it uses Gatherers.mapConcurrent', code: `c.ok(c.uses("mapConcurrent"), "use Gatherers.mapConcurrent");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'sv-lazy-init', track: 'scoped', title: 'Thread-safe lazy initialisation',
    summary: 'Three ways to compute a value once, on first use, from many threads: the holder idiom, double-checked locking with a volatile field, and StableValue (a preview in Java 25, renamed LazyConstant in 26).',
    keywords: ['lazy initialization', 'singleton', 'holder idiom', 'double-checked locking', 'volatile', 'StableValue', 'LazyConstant', 'orElseSet', 'jep 502', 'jep 526'],
    docs: 'https://openjdk.org/jeps/502', docsLabel: 'JEP 502: Stable Values (Preview)', lab: '17-java-memory-model',
    body: [
      '## The problem',
      'A value that is costly to make (a configuration, a client, a big table) should be made on first use and only once, though many threads may ask at the same moment. Each block below asks 50 virtual threads at once and counts the loads.',
      '## 1. The holder idiom',
      jv(`static final AtomicInteger loads = new AtomicInteger();

static class Holder {
    static final String CONFIG = load();
}

static String load() {
    loads.incrementAndGet();
    return "config v1";
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) executor.submit(() -> Holder.CONFIG);
    }
    IO.println(Holder.CONFIG + ", loaded " + loads.get() + " time");
}`),
      out('config v1, loaded 1 time'),
      'The JVM runs a class\'s initializer once, under a lock, the first time the class is used: `Holder` is initialised on the first read of `CONFIG`. Simple and fast, but only for `static` values, a class per value, and (lesson [[lesson:vt-pinning]]) a slow, blocking `load()` pins every virtual thread that waits for it.',
      '## 2. Double-checked locking',
      jv(`static volatile String config;
static final Object LOCK = new Object();
static final AtomicInteger loads = new AtomicInteger();

static String config() {
    if (config == null) {
        synchronized (LOCK) {
            if (config == null) {
                loads.incrementAndGet();
                config = "config v1";
            }
        }
    }
    return config;
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) executor.submit(() -> config());
    }
    IO.println(config() + ", loaded " + loads.get() + " time");
}`),
      out('config v1, loaded 1 time'),
      'The first check skips the lock once the value exists; the second, under the lock, stops two threads that both saw `null` from both loading. The field **must be `volatile`**: without it, another thread can see the reference before the object it points to is fully built (the memory model allows it). The ⚠ in the editor warns when it is missing.',
      '## 3. StableValue (preview in Java 25)',
      jv(`static final AtomicInteger loads = new AtomicInteger();
static final StableValue<String> CONFIG = StableValue.of();

static String config() {
    return CONFIG.orElseSet(() -> {
        loads.incrementAndGet();
        return "config v1";
    });
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 50; i++) executor.submit(() -> config());
    }
    IO.println(config() + ", loaded " + loads.get() + " time");
}`),
      out('config v1, loaded 1 time'),
      '`orElseSet` runs its supplier at most once, even when called concurrently (JEP 502), and once set the JIT can treat the content as a constant, as it does a `static final` field. It works for instance fields too, with no holder class. `StableValue.supplier(() -> load())` wraps it as a `Supplier`.',
      '| | Holder | Double-checked locking | `StableValue` |\n|---|---|---|---|\n| Java | any | any (`volatile` since 5) | 25, preview |\n| Static only | yes | no | no |\n| Read speed | a constant | a `volatile` read | a constant |\n| Easy to get wrong | no | yes: the `volatile` | no |',
      'In Java 26, `StableValue` became `LazyConstant` (JEP 526): `LazyConstant.of(() -> load())`, read with `get()`; `orElseSet` was removed. Still a preview in 27.'
    ].join('\n\n'),
    work: [
      '**In a Spring service, most of these are beans:** a singleton bean is created once by the container at start-up, so lazy initialisation by hand is for values outside the container (a utility class, a library) or truly costly ones that should wait for first use (`@Lazy` is Spring\'s version).',
      '**Double-checked locking is a classic interview question** because of the `volatile`: the answer interviewers want is why it is needed (safe publication, the memory model) and what to use instead (the holder idiom, an enum singleton, or now `StableValue`/`LazyConstant`).'
    ].join('\n\n'),
    example: {
      code: `static final AtomicInteger loads = new AtomicInteger();
static final Supplier<String> REPORT = StableValue.supplier(() -> {
    loads.incrementAndGet();
    try {
        Thread.sleep(200);                     // a costly load
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
    return "report ready";
});

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) executor.submit(() -> REPORT.get());
    }
    IO.println(REPORT.get() + " after " + loads.get() + " load(s) for 1,000 callers");
}`
    },
    challenge: {
      title: 'Load it once',
      task: 'Write `config(source)`: return `source.fetch("config")`, fetching it **only the first time**, however many threads call at once. Keep the value in a `StableValue` field. (The supplier may not throw `InterruptedException`: wrap it.)',
      files: [SERVICE],
      starter: `private String cached;

String config(Service source) throws InterruptedException {
    if (cached == null) {                     // two threads can both see null, and both fetch
        cached = source.fetch("config");
    }
    return cached;
}

void main() throws Exception {
    IO.println(config(id -> "timeout=30s"));
}`,
      solution: `private final StableValue<String> cached = StableValue.of();

String config(Service source) {
    return cached.orElseSet(() -> {
        try {
            return source.fetch("config");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        }
    });
}

void main() throws Exception {
    IO.println(config(id -> "timeout=30s"));
}`,
      hints: [
        '`private final StableValue<String> cached = StableValue.of();`',
        '`return cached.orElseSet(() -> { try { return source.fetch("config"); } catch (InterruptedException e) { … throw new IllegalStateException(e); } });`'
      ],
      checks: [
        { label: 'it returns the source\'s answer', code: `c.eq(c.call("config", (Service) id -> "timeout=30s"), "timeout=30s");` },
        { label: '50 callers at once cause one fetch', code: `var p = c.probe(1);
Service s = id -> { p.sleep(100); return "v"; };
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 50; i++) executor.submit(c.callable("config", s));
}
c.ok(p.calls() == 1, "50 callers caused " + p.calls() + " fetches");` },
        { label: 'a later call does not fetch again', code: `var p = c.probe(1);
Service s = id -> { p.sleep(10); return "v"; };
c.call("config", s);
c.call("config", s);
c.eq(p.calls(), 1);` },
        { label: 'it keeps the value in a StableValue', code: `c.ok(c.uses("StableValue"), "keep the value in a StableValue");` }
      ]
    }
  });
})(window.JCLT);
