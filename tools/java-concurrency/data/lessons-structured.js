/*
 * data/lessons-structured.js - Track 4, Structured concurrency (a preview API in Java 25, JEP 505): eight
 * lessons (batch 2). The lesson shape is described at the top of data/lessons-virtual-threads.js.
 *
 * Every program runs with --enable-preview, as this tool always does. Facts about the API were read on
 * openjdk.org (JEPs 505, 525, 533) and probed on JDK 25.0.4.1 (ROADMAP.md, batch 2). Programs print only
 * what their order makes certain: a subtask that is cancelled prints before close() returns, so a line
 * printed after the try block always comes last.
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

  var SLOW = `String slow(String name, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    IO.println(name + ": finished");
    return name;
}`;

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'sc-why', track: 'structured', title: 'Why structured concurrency',
    summary: 'With an executor, a task outlives the method that started it: when one call fails, its sibling runs on as an orphan. A structured scope ties every subtask to a block of code, so a failure cancels the rest.',
    keywords: ['structured concurrency', 'unstructured', 'orphan', 'leak', 'cancellation', 'ExecutorService', 'CompletableFuture', 'jep 505', 'fan-out'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## A method that starts two calls',
      'A profile page needs the user and their orders: two independent calls, so you run them at the same time. With an executor, each is a task of its own, and nothing ties the tasks to the method that started them. Watch what happens when the orders call fails at once:',
      jv(SLOW + `

String profile(ExecutorService executor) throws Exception {
    Future<String> user = executor.submit(() -> slow("user", 300));
    Future<String> orders = executor.submit(() -> { throw new IllegalStateException("orders down"); });
    return orders.get() + user.get();
}

void main() throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        try {
            profile(executor);
        } catch (ExecutionException e) {
            IO.println("profile failed: " + e.getCause().getMessage());
        }
    }
    IO.println("executor closed");
}`),
      out(`profile failed: orders down
user: finished
executor closed`),
      '`profile` has already failed and returned, yet the user call runs on for 300 ms and finishes for nobody. That task is an **orphan**: work, a thread, maybe a database connection, kept busy for a result no one will read. Nothing cancelled it, because nothing knew it belonged to `profile`.',
      '## The same, structured',
      jv(SLOW + `

String profile() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> slow("user", 300));
        var orders = scope.fork(() -> { throw new IllegalStateException("orders down"); });
        scope.join();
        return orders.get() + user.get();
    }
}

void main() throws Exception {
    try {
        profile();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("profile failed: " + e.getCause().getMessage());
    }
    IO.println("nothing left running");
}`),
      out(`user: cancelled
profile failed: orders down
nothing left running`),
      'The scope saw the failure, **cancelled** the user call (it was interrupted in its sleep), and `close()` at the end of the `try` block waited for it to stop. When `profile` fails, nothing it started is still running.',
      '## What "structured" means',
      'Structured concurrency applies to threads the rule that structured programming applied to code: a block that splits work into subtasks gets all of them back before it ends. The subtasks\' lifetimes nest inside the block, like a method call inside its caller.',
      '| | Unstructured (executor, `CompletableFuture`) | Structured (`StructuredTaskScope`) |\n|---|---|---|\n| A subtask outlives the method | possible: an orphan | never: `close()` waits |\n| One fails | the others run on, unless you cancel them by hand | the scope cancels them |\n| The caller is cancelled | the tasks do not notice | interrupting the owner cancels the scope |\n| A thread dump | unrelated threads | the scope and its subtasks, as a tree |',
      '## A preview API',
      '`StructuredTaskScope` is a **preview API** in Java 25 (JEP 505, the fifth preview): compile and run with `--enable-preview` (this tool always does). The API changed in Java 25 (scopes are opened with `StructuredTaskScope.open`) and changes again in 26 and 27; lesson [[lesson:sc-patterns]] and the [Java version map](#/versions) list what. The ideas do not change.'
    ].join('\n\n'),
    work: [
      '**A Spring controller that fans out.** A `GET /orders/{id}` that calls the order service, the payment service and the shipping service at the same time is a fan-out. Written with `@Async` methods returning `CompletableFuture`, a failure in one returns an error to the client while the other two calls run on, each holding a connection from a pool. Under load, those orphans pile up until the pool is empty.',
      '**With virtual threads on** (`spring.threads.virtual.enabled=true`), the controller runs on a virtual thread, and the fan-out can be a scope inside the controller method: the request\'s calls end with the request. Because the API is a preview, a production service needs `--enable-preview` in its build (the compiler plugin) and in its `java` command, and must expect to change the code when it moves to Java 26 or 27.'
    ].join('\n\n'),
    example: {
      code: SLOW + `

void main() throws Exception {
    // Make "orders" slow and "user" fail instead: who is cancelled now?
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> slow("user", 300));
        scope.fork(() -> slow("orders", 100));
        scope.fork(() -> { Thread.sleep(150); throw new IllegalStateException("payments down"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("failed: " + e.getCause().getMessage());
    }
}`
    },
    challenge: {
      title: 'No orphans',
      task: '`profile(id, users, orders)` calls `users.fetch(id)` and `orders.fetch(id)` at the same time and returns `"<user> / <orders>"`. As given, it uses an executor, so when one call fails, the other runs on.\n\nRewrite it with a `StructuredTaskScope`, so that:\n\n1. the two calls still run **at the same time**;\n2. when one fails, `profile` **throws**, and the other call is **cancelled** (interrupted) before `profile` returns.',
      files: [SERVICE],
      starter: `String profile(String id, Service users, Service orders) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> user = executor.submit(() -> users.fetch(id));
        Future<String> order = executor.submit(() -> orders.fetch(id));
        return user.get() + " / " + order.get();
    }
}

void main() throws Exception {
    IO.println(profile("7", id -> "user " + id, id -> "orders " + id));
}`,
      solution: `String profile(String id, Service users, Service orders) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> users.fetch(id));
        var order = scope.fork(() -> orders.fetch(id));
        scope.join();
        return user.get() + " / " + order.get();
    }
}

void main() throws Exception {
    IO.println(profile("7", id -> "user " + id, id -> "orders " + id));
}`,
      hints: [
        '`try (var scope = StructuredTaskScope.open()) { … }`: fork each call with `scope.fork(() -> users.fetch(id))`, which returns a `Subtask`.',
        'Call `scope.join()` before reading any result. With `open()`, a failure makes `join()` throw `FailedException`, after cancelling the other subtask.',
        'Then `user.get() + " / " + order.get()`.'
      ],
      checks: [
        { label: 'profile("7") is "user 7 / orders 7"', code: `c.eq(c.call("profile", "7", (Service) id -> "user " + id, (Service) id -> "orders " + id), "user 7 / orders 7");` },
        { label: 'the two calls run at the same time', code: `var p = c.probe(2);
c.call("profile", "1", (Service) id -> { p.meet(); return "u"; }, (Service) id -> { p.meet(); return "o"; });
c.ok(p.met(), "the two calls never ran at the same time");` },
        { label: 'when the orders call fails, profile throws', code: `try {
    c.call("profile", "1", (Service) id -> "u", (Service) id -> { throw new IllegalStateException("orders down"); });
    c.fail("profile returned normally, though the orders call failed");
} catch (Exception e) {
    c.ok(true, "");
}` },
        { label: 'when the orders call fails, the users call is cancelled', code: `var p = c.probe(1);
try {
    c.call("profile", "1", (Service) id -> { p.hang(); return "u"; }, (Service) id -> { p.whenHanging(1); throw new IllegalStateException("orders down"); });
} catch (Exception e) { }
c.ok(p.cancelled() == 1, "the users call was not cancelled when the orders call failed: it ran on as an orphan");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'sc-basics', track: 'structured', title: 'open, fork, join',
    summary: 'A scope is opened in a try-with-resources block, subtasks are forked on virtual threads, the owner joins, then reads each Subtask. Only the owner may fork and join, and get() before join() throws.',
    keywords: ['StructuredTaskScope', 'open', 'fork', 'join', 'Subtask', 'state', 'owner', 'WrongThreadException', 'try-with-resources'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## The shape',
      norun(`try (var scope = StructuredTaskScope.open()) {        // 1. open: this thread is the owner
    Subtask<String> a = scope.fork(() -> callA());     // 2. fork: each on a new virtual thread
    Subtask<Integer> b = scope.fork(() -> callB());
    scope.join();                                      // 3. join: wait, by the scope's policy
    return a.get() + b.get();                          // 4. read the results
}                                                      // 5. close: no subtask outlives the block`),
      jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> { Thread.sleep(100); return "Asha"; });
        var count = scope.fork(() -> { Thread.sleep(50); return 3; });
        IO.println("before join: " + user.state());
        scope.join();
        IO.println("after join: " + user.state() + ", " + count.state());
        IO.println(user.get() + " has " + count.get() + " orders");
    }
}`),
      out(`before join: UNAVAILABLE
after join: SUCCESS, SUCCESS
Asha has 3 orders`),
      'Each subtask runs on a new **virtual thread**: forking a hundred costs about as much as a hundred small objects.',
      '## What a Subtask is',
      'A `Subtask<T>` is a handle on one forked call: `state()` is `UNAVAILABLE` (not finished, or cancelled), `SUCCESS` or `FAILED`; `get()` returns the result; `exception()` the failure. It is not a `Future`: there is no `cancel` and no `get(timeout)`, because the scope decides those things for all of them.',
      jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> "Asha");
        try {
            user.get();
        } catch (IllegalStateException e) {
            IO.println("get() before join(): " + e.getMessage());
        }
        scope.join();
        IO.println("after join(): " + user.get());
    }
}`),
      out(`get() before join(): join not called
after join(): Asha`),
      '## The owner',
      'The thread that opens the scope is its **owner**. Only the owner may fork and join; the subtasks may not reach back into the scope. Measured on Java 25:',
      jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var other = new AtomicReference<String>();
        Thread.ofVirtual().start(() -> {
            try {
                scope.fork(() -> "x");
            } catch (WrongThreadException e) {
                other.set(e.getMessage());
            }
        }).join();
        IO.println("fork from another thread: " + other.get());
        scope.join();
        try {
            scope.join();
        } catch (IllegalStateException e) {
            IO.println("join() twice: " + e.getMessage());
        }
    }
}`),
      out(`fork from another thread: Current thread not owner
join() twice: Already joined or scope is closed`),
      '## Why try-with-resources',
      '`close()` cancels the scope if it is still going, and waits for every subtask thread to end. Open a scope in a `try` block and that is guaranteed on every path out of it, exceptions included. A scope is not an `ExecutorService`: it does not take tasks for later, and it cannot be shared.'
    ].join('\n\n'),
    work: [
      '**The everyday use: an aggregator endpoint.** A "dashboard" or "order details" endpoint in a Spring service that gathers three or four independent pieces is the shape this API was built for: `open`, a `fork` per call, `join`, build the response from the subtasks. It replaces `CompletableFuture.allOf(…)` and `thenCombine` chains, and the code reads top to bottom.',
      '**Code review:** a `get()` before `join()`, a scope opened without try-with-resources, or a scope handed to another thread are bugs the API refuses at run time. The ⚠ in this tool\'s editor flags the first one as you type.'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var a = scope.fork(() -> { Thread.sleep(200); return "slow"; });
        var b = scope.fork(() -> { Thread.sleep(50); return "fast"; });
        IO.println("forked: " + a.state() + ", " + b.state());
        scope.join();
        IO.println("joined: " + a.get() + ", " + b.get());
    }
}`
    },
    challenge: {
      title: 'All of them, in order',
      task: 'Write `fetchAll(ids, service)`: fork one subtask per id in a `StructuredTaskScope`, join, and return the answers **in the order of the ids**, joined with `","` (an empty list gives `""`). The calls must run at the same time.',
      files: [SERVICE],
      starter: `String fetchAll(List<String> ids, Service service) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id.toUpperCase()));
}`,
      solution: `String fetchAll(List<String> ids, Service service) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        List<StructuredTaskScope.Subtask<String>> subtasks = new ArrayList<>();
        for (String id : ids) {
            subtasks.add(scope.fork(() -> service.fetch(id)));
        }
        scope.join();
        List<String> answers = new ArrayList<>();
        for (var s : subtasks) answers.add(s.get());
        return String.join(",", answers);
    }
}

void main() throws Exception {
    IO.println(fetchAll(List.of("a", "b", "c"), id -> id.toUpperCase()));
}`,
      hints: [
        'Keep each `Subtask` in a list as you fork it: the list is in the order of the ids.',
        'After `scope.join()`, read `s.get()` from each, in that order, and `String.join(",", answers)`.'
      ],
      checks: [
        { label: 'the answers come back in the order of the ids', code: `c.eq(c.call("fetchAll", List.of("x", "y", "z"), (Service) id -> id + "!"), "x!,y!,z!");` },
        { label: 'an empty list gives ""', code: `c.eq(c.call("fetchAll", List.of(), (Service) id -> id), "");` },
        { label: 'the calls run at the same time', code: `var p = c.probe(4);
c.call("fetchAll", List.of("a", "b", "c", "d"), (Service) id -> { p.meet(); return id; });
c.ok(p.met(), "at most " + p.peak() + " of the 4 calls were in flight at once");` },
        { label: 'each call runs on a virtual thread (a forked subtask)', code: `var p = c.probe(3);
c.call("fetchAll", List.of("a", "b", "c"), (Service) id -> { p.meet(); return id; });
c.ok(p.allVirtual(), p.platformCalls() + " calls ran on a platform thread");` },
        { label: 'slow first answers do not change the order', code: `c.eq(c.call("fetchAll", List.of("slow", "fast"), (Service) id -> { if (id.equals("slow")) Thread.sleep(200); return id; }), "slow,fast");` },
        { label: 'it uses a StructuredTaskScope', code: `c.ok(c.uses("StructuredTaskScope"), "fork the calls in a StructuredTaskScope");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'sc-failure', track: 'structured', title: 'Failure and cancellation',
    summary: 'With open(), the first failure cancels the other subtasks and join() throws FailedException carrying the cause. Cancelling is interrupting, so subtasks must let InterruptedException through.',
    keywords: ['FailedException', 'cancellation', 'interrupt', 'InterruptedException', 'getCause', 'fail fast', 'short-circuit', 'cancel'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## Fail fast, by default',
      '`StructuredTaskScope.open()` with no arguments waits for **all subtasks to succeed or any one to fail**. On the first failure it cancels the scope: every subtask still running is **interrupted**, and `join()` throws `StructuredTaskScope.FailedException` whose **cause** is the subtask\'s exception. The [[explain:scope-tree]] explainer steps through it.',
      jv(SLOW + `

void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> slow("stock", 100));
        scope.fork(() -> { Thread.sleep(200); throw new IllegalStateException("card declined"); });
        scope.fork(() -> slow("shipping", 2_000));
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("checkout failed: " + e.getCause().getMessage());
        IO.println("cause type: " + e.getCause().getClass().getSimpleName());
    }
}`),
      out(`stock: finished
shipping: cancelled
checkout failed: card declined
cause type: IllegalStateException`),
      '## Cancelling is interrupting',
      'Java cannot stop a thread from outside; it can only ask, with an **interrupt**. Blocking calls (`sleep`, `join`, a lock, a queue, socket I/O on a virtual thread) answer it by throwing `InterruptedException`. A subtask that catches that exception and carries on is not cancelled at all: the scope\'s `close()` then waits for it.',
      jv(`void main() throws Exception {
    long start = System.nanoTime();
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> {
            for (int i = 0; i < 3; i++) {
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    // swallowed: the loop goes on, and close() waits for it
                }
            }
            return "stubborn";
        });
        scope.fork(() -> { throw new IllegalStateException("fails at once"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        long ms = (System.nanoTime() - start) / 1_000_000;
        IO.println("failed at once, but close() waited for the stubborn subtask: " + (ms >= 350));
    }
}`),
      out('failed at once, but close() waited for the stubborn subtask: true'),
      'The ⚠ in the editor marks a swallowed `InterruptedException`. Let it propagate (declare `throws InterruptedException`), or stop and restore the flag with `Thread.currentThread().interrupt()`.',
      '## Reading the failure',
      'Catch `FailedException` around the `try` (the scope is closed by then, so every subtask has stopped) and look at `getCause()`; a `switch` with patterns sorts the causes:',
      norun(`} catch (StructuredTaskScope.FailedException e) {
    return switch (e.getCause()) {
        case PaymentDeclined d -> Response.declined(d.reason());
        case TimeoutException t -> Response.retryLater();
        default -> throw e;
    };
}`),
      'When the owner itself is interrupted (its own request was cancelled), `join()` throws `InterruptedException` and the scope cancels its subtasks too: cancellation flows down the tree.'
    ].join('\n\n'),
    work: [
      '**Checkout in an online shop:** reserve stock, charge the card, book shipping, at once. If the card is declined, the reservation and the booking must stop, not finish and leave half an order. Fail-fast with automatic cancellation is that rule in one line.',
      '**JDBC and HTTP calls answer interrupts** on virtual threads, because they block in socket reads that unmount and park. A cancelled subtask stuck in a query is woken and its connection returned to the pool. Code that wraps every call in `catch (Exception e) { log; }` swallows that interrupt, and cancellation quietly stops working.'
    ].join('\n\n'),
    example: {
      code: SLOW + `

void main() throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> slow("a", 300));
        scope.fork(() -> slow("b", 300));
        scope.fork(() -> { Thread.sleep(100); throw new IllegalArgumentException("bad input"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("failed: " + e.getCause());
    }
}`
    },
    challenge: {
      title: 'Checkout, all or nothing',
      task: 'Write `checkout(order, stock, payment)`: call `stock.fetch(order)` and `payment.fetch(order)` at the same time, in a `StructuredTaskScope`.\n\n- Both succeed: return `"ok: <stock answer>, <payment answer>"`.\n- Either fails: **cancel the other** (the scope does it) and return `"failed: <the cause\'s message>"`.',
      files: [SERVICE],
      starter: `String checkout(String order, Service stock, Service payment) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    IO.println(checkout("o-1", id -> "reserved", id -> "charged"));
    IO.println(checkout("o-2", id -> "reserved", id -> { throw new IllegalStateException("card declined"); }));
}`,
      solution: `String checkout(String order, Service stock, Service payment) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var reserved = scope.fork(() -> stock.fetch(order));
        var charged = scope.fork(() -> payment.fetch(order));
        scope.join();
        return "ok: " + reserved.get() + ", " + charged.get();
    } catch (StructuredTaskScope.FailedException e) {
        return "failed: " + e.getCause().getMessage();
    }
}

void main() throws Exception {
    IO.println(checkout("o-1", id -> "reserved", id -> "charged"));
    IO.println(checkout("o-2", id -> "reserved", id -> { throw new IllegalStateException("card declined"); }));
}`,
      hints: [
        'The shape of lesson [[lesson:sc-basics]], with a `catch (StructuredTaskScope.FailedException e)` after the `try` block.',
        'The message you want is the subtask\'s exception\'s: `e.getCause().getMessage()`.'
      ],
      checks: [
        { label: 'both succeed: "ok: reserved, charged"', code: `c.eq(c.call("checkout", "o1", (Service) id -> "reserved", (Service) id -> "charged"), "ok: reserved, charged");` },
        { label: 'the card is declined: "failed: card declined"', code: `c.eq(c.call("checkout", "o1", (Service) id -> "reserved", (Service) id -> { throw new IllegalStateException("card declined"); }), "failed: card declined");` },
        { label: 'stock fails: "failed: out of stock"', code: `c.eq(c.call("checkout", "o1", (Service) id -> { throw new IllegalStateException("out of stock"); }, (Service) id -> "charged"), "failed: out of stock");` },
        { label: 'the two calls run at the same time', code: `var p = c.probe(2);
c.call("checkout", "o1", (Service) id -> { p.meet(); return "a"; }, (Service) id -> { p.meet(); return "b"; });
c.ok(p.met(), "stock and payment never ran at the same time");` },
        { label: 'when payment fails, the stock call is cancelled', code: `var p = c.probe(1);
c.call("checkout", "o1", (Service) id -> { p.hang(); return "a"; }, (Service) id -> { p.whenHanging(1); throw new IllegalStateException("card declined"); });
c.ok(p.cancelled() == 1, "the stock call was not cancelled when payment failed");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'sc-joiners', track: 'structured', title: 'Joiners: the scope\'s policy',
    summary: 'A Joiner decides when join() returns and what it returns: all results, the first success, all done whatever happened, or until a condition. Each Joiner is used for one scope only.',
    keywords: ['Joiner', 'allSuccessfulOrThrow', 'anySuccessfulResultOrThrow', 'awaitAllSuccessfulOrThrow', 'awaitAll', 'allUntil', 'race', 'policy'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## open(joiner)',
      '`StructuredTaskScope.open(joiner)` takes the policy. The five built in (Java 25; their behaviour below was probed on JDK 25.0.4.1):',
      '| `Joiner.` | `join()` returns | The scope is cancelled when |\n|---|---|---|\n| `awaitAllSuccessfulOrThrow()` (what `open()` uses) | `null` | one fails (then `join()` throws `FailedException`) |\n| `allSuccessfulOrThrow()` | a `Stream` of the subtasks, in fork order | one fails (then it throws) |\n| `anySuccessfulResultOrThrow()` | the first successful result | one succeeds; throws only if all fail |\n| `awaitAll()` | `null`; failures stay in their subtasks | never: it waits for all |\n| `allUntil(predicate)` | a `Stream` of all the subtasks | the predicate is true for a finished one |',
      '## All the results',
      jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allSuccessfulOrThrow())) {
        scope.fork(() -> { Thread.sleep(150); return 1; });
        scope.fork(() -> { Thread.sleep(50); return 2; });
        scope.fork(() -> 3);
        List<Integer> results = scope.join().map(StructuredTaskScope.Subtask::get).toList();
        IO.println("in fork order, not finishing order: " + results);
    }
}`),
      out('in fork order, not finishing order: [1, 2, 3]'),
      '## The first success: a race',
      jv(SLOW + `

void main() throws Exception {
    String first;
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> slow("mirror-a", 400));
        scope.fork(() -> { throw new IllegalStateException("mirror-b is down"); });
        scope.fork(() -> slow("mirror-c", 100));
        first = scope.join();
    }
    IO.println("first answer: " + first);
}`),
      out(`mirror-c: finished
mirror-a: cancelled
first answer: mirror-c`),
      'A failure does not end the race: only a success does. If every subtask fails, `join()` throws `FailedException` with the first failure as its cause.',
      '## Everything, whatever happened',
      jv(`void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAll())) {
        var a = scope.fork(() -> "fine");
        var b = scope.fork(() -> { throw new IllegalStateException("broken"); });
        scope.join();
        IO.println(a.state() + " " + a.get());
        IO.println(b.state() + " " + b.exception().getMessage());
    }
}`),
      out(`SUCCESS fine
FAILED broken`),
      '## One joiner, one scope',
      'A `Joiner` keeps state about its scope\'s subtasks, so the JEP says a new one must be made for each scope. Java 25 does not stop you reusing one; probed, the second scope\'s `join()` then returned the first scope\'s subtasks as well. Call `Joiner.allSuccessfulOrThrow()` again for each scope.'
    ].join('\n\n'),
    work: [
      '**Which joiner for which endpoint:** an aggregator that needs every piece uses `allSuccessfulOrThrow()`; a lookup sent to several replicas or regions takes the first answer with `anySuccessfulResultOrThrow()`; a batch job that must report every item\'s outcome uses `awaitAll()` and reads each subtask\'s state; "search until 10 results" is `allUntil`.',
      '**These names change in Java 26** (`anySuccessfulOrThrow`, and `allSuccessfulOrThrow` returning a `List` of results) **and 27** (`awaitAll` removed). Code written for 25\'s preview needs edits when the service moves: see [[lesson:sc-patterns]].'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    // allUntil: stop as soon as one subtask has found a result over 10
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allUntil(
            s -> s.state() == StructuredTaskScope.Subtask.State.SUCCESS && s.get() > 10))) {
        scope.fork(() -> { Thread.sleep(50); return 5; });
        scope.fork(() -> { Thread.sleep(100); return 50; });
        scope.fork(() -> { Thread.sleep(2_000); return 7; });
        scope.join().forEach(s -> IO.println(s.state() + (s.state() == StructuredTaskScope.Subtask.State.SUCCESS ? " " + s.get() : "")));
    }
}`
    },
    challenge: {
      title: 'The fastest mirror',
      task: 'Write `fastest(mirrors, service)`: ask every mirror at once (`service.fetch(mirror)`) and return the **first successful answer**; the scope must **cancel** the others. If every mirror fails, return `"none"`.',
      files: [SERVICE],
      starter: `String fastest(List<String> mirrors, Service service) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    IO.println(fastest(List.of("eu", "us"), m -> m + " answered"));
}`,
      solution: `String fastest(List<String> mirrors, Service service) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        for (String m : mirrors) {
            scope.fork(() -> service.fetch(m));
        }
        return scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        return "none";
    }
}

void main() throws Exception {
    IO.println(fastest(List.of("eu", "us"), m -> m + " answered"));
}`,
      hints: [
        '`StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())`: its `join()` returns the first result.',
        'If every subtask fails, `join()` throws `FailedException`: catch it and return `"none"`.'
      ],
      checks: [
        { label: 'one mirror: its answer', code: `c.eq(c.call("fastest", List.of("eu"), (Service) m -> m + "!"), "eu!");` },
        { label: 'the quick mirror wins over a slow one', code: `var p = c.probe(1);
c.eq(c.call("fastest", List.of("slow", "quick"), (Service) m -> { if (m.equals("slow")) p.hang(); return m; }), "quick");` },
        { label: 'the losers are cancelled', code: `var p = c.probe(1);
c.call("fastest", List.of("a", "b", "c"), (Service) m -> { if (!m.equals("b")) p.hang(); else p.whenHanging(2); return m; });
c.ok(p.cancelled() == 2, p.cancelled() + " of the 2 slow mirrors were cancelled");` },
        { label: 'a failing mirror does not end the race', code: `c.eq(c.call("fastest", List.of("down", "up"), (Service) m -> { if (m.equals("down")) throw new IllegalStateException("down"); Thread.sleep(50); return m; }), "up");` },
        { label: 'all fail: "none"', code: `c.eq(c.call("fastest", List.of("a", "b"), (Service) m -> { throw new IllegalStateException(m); }), "none");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'sc-custom-joiner', track: 'structured', title: 'Writing your own Joiner',
    summary: 'Implement Joiner: onComplete is told about each finished subtask (on its thread, so be thread-safe) and returns true to cancel the scope; result() is what join() returns. A quorum is ten lines.',
    keywords: ['Joiner', 'custom joiner', 'onFork', 'onComplete', 'result', 'quorum', 'first N', 'thread-safe'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## The interface',
      norun(`public interface Joiner<T, R> {
    default boolean onFork(Subtask<? extends T> subtask) { return false; }      // true: cancel the scope
    default boolean onComplete(Subtask<? extends T> subtask) { return false; }  // true: cancel the scope
    R result() throws Throwable;                                               // what join() returns
}`),
      '`onComplete` runs on the subtask\'s own thread as each one finishes, so several can run at once: keep the joiner\'s state in thread-safe types. Returning `true` cancels the scope: the subtasks still running are interrupted and `join()` wakes up. If `result()` throws, `join()` throws `FailedException` with that cause.',
      '## The first two successes',
      jv(SLOW + `

class FirstTwo implements StructuredTaskScope.Joiner<String, List<String>> {
    private final Queue<String> answers = new ConcurrentLinkedQueue<>();

    public boolean onComplete(StructuredTaskScope.Subtask<? extends String> s) {
        if (s.state() == StructuredTaskScope.Subtask.State.SUCCESS) answers.add(s.get());
        return answers.size() >= 2;
    }

    public List<String> result() {
        return List.copyOf(answers);
    }
}

void main() throws Exception {
    List<String> two;
    try (var scope = StructuredTaskScope.open(new FirstTwo())) {
        scope.fork(() -> slow("replica-1", 50));
        scope.fork(() -> slow("replica-2", 100));
        scope.fork(() -> slow("replica-3", 2_000));
        two = scope.join();
    }
    IO.println("quorum: " + two);
}`),
      out(`replica-1: finished
replica-2: finished
replica-3: cancelled
quorum: [replica-1, replica-2]`),
      '## When to write one',
      'Write a joiner when the policy is about the *combination* of outcomes: a quorum (2 of 3 replicas agree), the first N results, "stop after 2 failures", collecting partial results with their errors. Keep the decision in the joiner and the work in the subtasks.'
    ].join('\n\n'),
    work: [
      '**Quorum reads and writes** are how replicated stores (Cassandra, a Raft log) stay consistent: ask three, accept two. A custom joiner expresses it directly, and cancels the slow third.',
      '**Partial results for a search page:** "show whatever three providers have answered within the deadline" is a joiner that collects successes and failures and returns both, combined with `withTimeout` (lesson [[lesson:sc-timeouts]]).'
    ].join('\n\n'),
    example: {
      code: `class CountFailures implements StructuredTaskScope.Joiner<String, String> {
    private final AtomicInteger ok = new AtomicInteger(), failed = new AtomicInteger();

    public boolean onComplete(StructuredTaskScope.Subtask<? extends String> s) {
        if (s.state() == StructuredTaskScope.Subtask.State.SUCCESS) ok.incrementAndGet(); else failed.incrementAndGet();
        return failed.get() >= 2;           // give up after two failures
    }

    public String result() {
        return ok.get() + " ok, " + failed.get() + " failed";
    }
}

void main() throws Exception {
    try (var scope = StructuredTaskScope.open(new CountFailures())) {
        scope.fork(() -> "a");
        scope.fork(() -> { throw new IllegalStateException("x"); });
        scope.fork(() -> { throw new IllegalStateException("y"); });
        scope.fork(() -> { Thread.sleep(2_000); return "slow"; });
        IO.println(scope.join());
    }
}`
    },
    challenge: {
      title: 'A quorum of replicas',
      task: 'Write `quorum(replicas, service, needed)`: ask every replica at once and return the first `needed` successful answers (in the order they arrived), **cancelling** the rest as soon as there are enough. Failures are allowed as long as enough succeed. If too few succeed, `quorum` must throw.\n\nWrite your own `Joiner` for it.',
      files: [SERVICE],
      starter: `List<String> quorum(List<String> replicas, Service service, int needed) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() throws Exception {
    IO.println(quorum(List.of("r1", "r2", "r3"), r -> r + " says 42", 2));
}`,
      solution: `class Quorum implements StructuredTaskScope.Joiner<String, List<String>> {
    private final int needed;
    private final Queue<String> answers = new ConcurrentLinkedQueue<>();

    Quorum(int needed) {
        this.needed = needed;
    }

    public boolean onComplete(StructuredTaskScope.Subtask<? extends String> s) {
        if (s.state() == StructuredTaskScope.Subtask.State.SUCCESS) answers.add(s.get());
        return answers.size() >= needed;
    }

    public List<String> result() {
        if (answers.size() < needed) throw new IllegalStateException("only " + answers.size() + " of " + needed + " answered");
        return List.copyOf(answers).subList(0, needed);
    }
}

List<String> quorum(List<String> replicas, Service service, int needed) throws Exception {
    try (var scope = StructuredTaskScope.open(new Quorum(needed))) {
        for (String r : replicas) {
            scope.fork(() -> service.fetch(r));
        }
        return scope.join();
    }
}

void main() throws Exception {
    IO.println(quorum(List.of("r1", "r2", "r3"), r -> r + " says 42", 2));
}`,
      hints: [
        'A class implementing `StructuredTaskScope.Joiner<String, List<String>>`, with the number needed and a `ConcurrentLinkedQueue` of answers.',
        '`onComplete`: add the answer when `s.state()` is `SUCCESS`, and return `true` once there are enough. `result()`: the answers, or throw if there are too few.',
        'A joiner that throws in `result()` makes `join()` throw `FailedException`.'
      ],
      checks: [
        { label: 'two of three: two answers', code: `List<String> r = c.call("quorum", List.of("r1", "r2", "r3"), (Service) id -> id, 2);
c.eq(r.size(), 2);` },
        { label: 'the answers are the ones that arrived first', code: `List<String> r = c.call("quorum", List.of("slow", "a", "b"), (Service) id -> { if (id.equals("slow")) Thread.sleep(1_000); return id; }, 2);
c.eq(new HashSet<>(r), Set.of("a", "b"));` },
        { label: 'the replica still running is cancelled', code: `var p = c.probe(1);
c.call("quorum", List.of("a", "b", "slow"), (Service) id -> { if (id.equals("slow")) p.hang(); else p.whenHanging(1); return id; }, 2);
c.ok(p.cancelled() == 1, "the slow replica was not cancelled once two had answered");` },
        { label: 'a failure is allowed when enough succeed', code: `List<String> r = c.call("quorum", List.of("down", "a", "b"), (Service) id -> { if (id.equals("down")) throw new IllegalStateException("down"); return id; }, 2);
c.eq(new HashSet<>(r), Set.of("a", "b"));` },
        { label: 'too few answers: quorum throws', code: `try {
    c.call("quorum", List.of("a", "x", "y"), (Service) id -> { if (!id.equals("a")) throw new IllegalStateException(id); return id; }, 2);
    c.fail("quorum returned, though only 1 of the 2 needed answered");
} catch (Exception e) {
    c.ok(true, "");
}` },
        { label: 'it implements Joiner', code: `c.ok(c.uses("implements\\\\s+StructuredTaskScope\\\\.Joiner|implements\\\\s+Joiner"), "write a class that implements StructuredTaskScope.Joiner");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 6 */
  L.push({
    id: 'sc-timeouts', track: 'structured', title: 'Timeouts and configuration',
    summary: 'open(joiner, config -> config.withTimeout(...)) gives the whole scope a deadline: when it passes, the scope is cancelled and join() throws TimeoutException. withName and withThreadFactory name the scope and its threads.',
    keywords: ['timeout', 'withTimeout', 'deadline', 'TimeoutException', 'Configuration', 'withName', 'withThreadFactory', 'fallback'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## A deadline for the whole fan-out',
      'The third `open` takes a function that adjusts the scope\'s `Configuration`. `withTimeout(duration)` sets a deadline from when the scope opens: if it passes before the joiner is satisfied, the scope is cancelled and `join()` throws `StructuredTaskScope.TimeoutException` (probed: it has no message).',
      jv(SLOW + `

void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(200)))) {
        scope.fork(() -> slow("cache", 50));
        scope.fork(() -> slow("database", 5_000));
        scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        IO.println("over the 200 ms deadline");
    }
}`),
      out(`cache: finished
database: cancelled
over the 200 ms deadline`),
      'One deadline for all the calls is usually what a request wants: "answer within 200 ms" rather than a separate timeout per call that adds up.',
      '## A fallback',
      jv(`String price(String item) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(100)))) {
        scope.fork(() -> { Thread.sleep(1_000); return item + ": live price"; });
        return scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        return item + ": cached price";
    }
}

void main() throws Exception {
    IO.println(price("book"));
}`),
      out('book: cached price'),
      '## Names and thread factories',
      jv(`void main() throws Exception {
    var factory = Thread.ofVirtual().name("checkout-", 1).factory();
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
            config -> config.withName("checkout").withThreadFactory(factory))) {
        scope.fork(() -> Thread.currentThread().getName());
        scope.fork(() -> Thread.currentThread().getName());
        IO.println("scope: " + scope);
        IO.println("threads: " + scope.join().map(StructuredTaskScope.Subtask::get).sorted().toList());
    }
}`),
      out(`scope: checkout
threads: [checkout-1, checkout-2]`),
      'The name shows in thread dumps (lesson [[lesson:sc-nesting]]); the factory decides how subtask threads are made (named, or with an uncaught-exception handler). Subtasks run on virtual threads unless the factory says otherwise.'
    ].join('\n\n'),
    work: [
      '**A request deadline:** an API with a 300 ms budget calls three services; one deadline on the scope keeps the whole fan-out inside the budget, and a timeout leads to a fallback (a cached value, a partial page, an HTTP 504) rather than a request that hangs.',
      '**Per-call timeouts still matter:** the HTTP client\'s and the JDBC driver\'s own timeouts protect the connection; the scope\'s deadline protects the request. Set both. Java 26 adds `Joiner.onTimeout()`, so a joiner can return partial results when the deadline passes.'
    ].join('\n\n'),
    example: {
      code: `void main() throws Exception {
    // Change the deadline or the sleeps: which calls make it?
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAll(),
            config -> config.withTimeout(Duration.ofMillis(250)))) {
        var a = scope.fork(() -> { Thread.sleep(100); return "a"; });
        var b = scope.fork(() -> { Thread.sleep(400); return "b"; });
        try {
            scope.join();
        } catch (StructuredTaskScope.TimeoutException e) {
            IO.println("deadline passed");
        }
        IO.println("a: " + a.state() + ", b: " + b.state());
    }
}`
    },
    challenge: {
      title: 'Answer within the deadline',
      task: 'Write `withDeadline(service, millis)`: call `service.fetch("quote")` in a scope with a **deadline of `millis`**. Return the answer if it comes in time; otherwise return `"timeout"`, and the call must be **cancelled**.',
      files: [SERVICE],
      starter: `String withDeadline(Service service, long millis) throws Exception {
    return service.fetch("quote");           // no deadline: a slow call makes the caller wait as long as it takes
}

void main() throws Exception {
    IO.println(withDeadline(id -> "42.50", 100));
}`,
      solution: `String withDeadline(Service service, long millis) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(millis)))) {
        scope.fork(() -> service.fetch("quote"));
        return scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        return "timeout";
    }
}

void main() throws Exception {
    IO.println(withDeadline(id -> "42.50", 100));
}`,
      hints: [
        '`StructuredTaskScope.open(joiner, config -> config.withTimeout(Duration.ofMillis(millis)))`; `anySuccessfulResultOrThrow()` makes `join()` return the one result.',
        'Catch `StructuredTaskScope.TimeoutException` and return `"timeout"`: the scope has already cancelled the call.'
      ],
      checks: [
        { label: 'a quick answer comes back', code: `c.eq(c.call("withDeadline", (Service) id -> "42.50", 500L), "42.50");` },
        { label: 'a slow answer gives "timeout"', code: `c.eq(c.call("withDeadline", (Service) id -> { Thread.sleep(2_000); return "late"; }, 100L), "timeout");` },
        { label: 'the slow call is cancelled', code: `var p = c.probe(1);
c.call("withDeadline", (Service) id -> { p.hang(); return "late"; }, 100L);
c.ok(p.cancelled() == 1, "the slow call was not cancelled when the deadline passed");` },
        { label: 'it gives up at the deadline, not after the call', code: `long ms = c.timed(() -> c.call("withDeadline", (Service) id -> { Thread.sleep(3_000); return "late"; }, 100L));
c.ok(ms < 1_500, "withDeadline took " + ms + " ms with a 100 ms deadline");` },
        { label: 'it uses withTimeout', code: `c.ok(c.uses("withTimeout"), "give the scope a deadline with config.withTimeout(...)");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 7 */
  L.push({
    id: 'sc-nesting', track: 'structured', title: 'Nesting and the scope tree',
    summary: 'A subtask can open a scope of its own, so work forms a tree. Scopes must close in the order they opened (StructureViolationException otherwise), and a JSON thread dump shows the tree.',
    keywords: ['nested scope', 'scope tree', 'StructureViolationException', 'thread dump', 'jcmd', 'cancellation propagates', 'tree'],
    docs: 'https://openjdk.org/jeps/505', docsLabel: 'JEP 505: Structured Concurrency (Fifth Preview)', lab: '19-structured-concurrency',
    body: [
      '## Scopes inside subtasks',
      'An order page fans out per item, and each item fans out again for its price and its stock. Each subtask opens its own scope: the work forms a **tree**, and cancelling a parent cancels everything below it.',
      jv(`String item(String name, long priceMs, boolean inStock) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var price = scope.fork(() -> { Thread.sleep(priceMs); return 10; });
        var stock = scope.fork(() -> inStock);
        scope.join();
        return name + "=" + (stock.get() ? price.get() : 0);
    }
}

void main() throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow())) {
        scope.fork(() -> item("pen", 100, true));
        scope.fork(() -> item("ink", 50, false));
        IO.println(scope.join().map(StructuredTaskScope.Subtask::get).toList());
    }
}`),
      out('[pen=10, ink=0]'),
      '## Structure is enforced',
      'Scopes close in the reverse order they opened, as nested blocks do. Closing an outer scope while an inner one is still open throws `StructureViolationException` (probed on 25). In a `try` block you cannot get this wrong, which is why every scope is opened in one.',
      jv(`void main() {
    var outer = StructuredTaskScope.open();
    var inner = StructuredTaskScope.open();
    try {
        outer.close();
    } catch (java.util.concurrent.StructureViolationException e) {
        IO.println("closing the outer scope first: StructureViolationException");
    }
    inner.close();
}`),
      out('closing the outer scope first: StructureViolationException'),
      '## The tree in a thread dump',
      'A JSON thread dump (`jcmd <pid> Thread.dump_to_file -format=json <file>`, or `HotSpotDiagnosticMXBean`) lists each scope as a **thread container** with its threads, its `"parent"` and its `"owner"` (the id of the thread that opened it), so the tree can be rebuilt from the dump. Probed on 25, a scope opened `withName("checkout")` appears as `"container": "checkout\\/jdk.internal.misc.ThreadFlock…"`:',
      jv(`import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

void main() throws Exception {
    var gate = new CountDownLatch(1);
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAll(), config -> config.withName("checkout"))) {
        scope.fork(() -> { gate.await(); return "a"; });
        scope.fork(() -> { gate.await(); return "b"; });
        Thread.sleep(200);
        Path file = Files.createTempFile("dump", ".json");
        Files.delete(file);
        ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class).dumpThreads(file.toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.JSON);
        String json = Files.readString(file);
        IO.println("the dump names the scope: " + json.contains("\\"container\\": \\"checkout"));
        gate.countDown();
        scope.join();
    }
}`),
      out('the dump names the scope: true')
    ].join('\n\n'),
    work: [
      '**When a request hangs in production,** the JSON dump of a service using scopes shows *which* request\'s fan-out is stuck and on which call: the scope (named after the endpoint with `withName`) and its waiting subtasks, instead of thousands of unrelated threads.',
      '**Nesting is the normal case in layered code:** the controller opens a scope, a service method it calls opens another. Each layer owns its own scope and can fail or time out independently, while a cancellation from the top still reaches the bottom.'
    ].join('\n\n'),
    example: {
      code: `String leaf(String name, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(name + ": cancelled");
        throw e;
    }
    return name;
}

String branch(String name) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> leaf(name + ".1", 1_000));
        scope.fork(() -> leaf(name + ".2", 1_000));
        scope.join();
        return name;
    }
}

void main() throws Exception {
    // a failure in one branch cancels the leaves of the other
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> branch("left"));
        scope.fork(() -> { Thread.sleep(100); throw new IllegalStateException("right failed"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println(e.getCause().getMessage());
    }
}`
    },
    challenge: {
      title: 'An order, item by item',
      task: 'Write `total(items, prices, stock)`: for each item, **at the same time**, fetch its price (`prices.fetch(item)`, a whole number as text) and whether it is in stock (`stock.fetch(item)`, `"yes"` or `"no"`), each pair in a **scope of its own nested inside** one scope for the whole order. Return the sum of the prices of the items in stock.\n\nAll the calls, for every item, must be in flight together.',
      files: [SERVICE],
      starter: `int total(List<String> items, Service prices, Service stock) throws Exception {
    int sum = 0;
    for (String item : items) {                         // one item after another, one call after another
        int price = Integer.parseInt(prices.fetch(item));
        if (stock.fetch(item).equals("yes")) sum += price;
    }
    return sum;
}

void main() throws Exception {
    IO.println(total(List.of("pen", "ink"), item -> item.equals("pen") ? "10" : "4", item -> "yes"));
}`,
      solution: `int itemTotal(String item, Service prices, Service stock) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var price = scope.fork(() -> prices.fetch(item));
        var available = scope.fork(() -> stock.fetch(item));
        scope.join();
        return available.get().equals("yes") ? Integer.parseInt(price.get()) : 0;
    }
}

int total(List<String> items, Service prices, Service stock) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allSuccessfulOrThrow())) {
        for (String item : items) {
            scope.fork(() -> itemTotal(item, prices, stock));
        }
        return scope.join().mapToInt(StructuredTaskScope.Subtask::get).sum();
    }
}

void main() throws Exception {
    IO.println(total(List.of("pen", "ink"), item -> item.equals("pen") ? "10" : "4", item -> "yes"));
}`,
      hints: [
        'A helper for one item: a scope that forks the price and the stock calls, joins, and returns the price or 0.',
        'In `total`, a scope with `allSuccessfulOrThrow()` forks the helper for each item; `join()` gives the subtasks: `.mapToInt(StructuredTaskScope.Subtask::get).sum()`.'
      ],
      checks: [
        { label: 'pen 10 and ink 4, both in stock: 14', code: `c.eq(c.call("total", List.of("pen", "ink"), (Service) i -> i.equals("pen") ? "10" : "4", (Service) i -> "yes"), 14);` },
        { label: 'an item out of stock does not count', code: `c.eq(c.call("total", List.of("pen", "ink"), (Service) i -> i.equals("pen") ? "10" : "4", (Service) i -> i.equals("ink") ? "no" : "yes"), 10);` },
        { label: 'no items: 0', code: `c.eq(c.call("total", List.of(), (Service) i -> "1", (Service) i -> "yes"), 0);` },
        { label: 'all 6 calls for 3 items are in flight together', code: `var p = c.probe(6);
c.call("total", List.of("a", "b", "c"), (Service) i -> { p.meet(); return "1"; }, (Service) i -> { p.meet(); return "yes"; });
c.ok(p.met(), "at most " + p.peak() + " of the 6 calls were in flight at once");` },
        { label: 'a failing price cancels the other calls', code: `var p = c.probe(1);
try {
    c.call("total", List.of("a", "b"), (Service) i -> { if (i.equals("a")) { p.whenHanging(3); throw new IllegalStateException("no price"); } p.hang(); return "1"; }, (Service) i -> { p.hang(); return "yes"; });
} catch (Exception e) { }
c.ok(p.cancelled() == 3, p.cancelled() + " of the 3 other calls were cancelled when a price failed");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 8 */
  L.push({
    id: 'sc-patterns', track: 'structured', title: 'Patterns, and what changes next',
    summary: 'Fan-out and fan-in, the race, the hedged request, a deadline per request; and how the preview API changes in Java 26 and 27, so code written for 25 knows what it will need.',
    keywords: ['fan-out', 'fan-in', 'race', 'hedged request', 'hedging', 'tail latency', 'preview', 'java 26', 'java 27', 'jep 525', 'jep 533'],
    docs: 'https://openjdk.org/jeps/525', docsLabel: 'JEP 525: Structured Concurrency (Sixth Preview)', lab: '19-structured-concurrency',
    body: [
      '## Four patterns',
      '| Pattern | Joiner | For |\n|---|---|---|\n| Fan-out, fan-in | `allSuccessfulOrThrow()` | every piece of a page or a report |\n| Race | `anySuccessfulResultOrThrow()` | the same question to several replicas |\n| Deadline | any, with `withTimeout` | a request\'s time budget |\n| Hedged request | `anySuccessfulResultOrThrow()`, the second request after a delay | cutting the slowest 1% of calls |',
      '## The hedged request',
      'Most calls to a service are quick, a few are very slow (a garbage-collection pause, a cold cache). **Hedging**: send the request; if no answer has come within a short delay (about the usual answer time), send the same request to another replica, and take whichever answers first. Rarely sent, it cuts the slowest calls sharply. With a scope it is a race whose second runner starts late:',
      jv(`String call(String replica, long ms) throws InterruptedException {
    try {
        Thread.sleep(ms);
    } catch (InterruptedException e) {
        IO.println(replica + ": cancelled");
        throw e;
    }
    IO.println(replica + ": answered");
    return replica;
}

String hedged(long primaryMs, long hedgeAfterMs) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> call("primary", primaryMs));
        scope.fork(() -> {
            Thread.sleep(hedgeAfterMs);
            return call("backup", 50);
        });
        return scope.join();
    }
}

void main() throws Exception {
    IO.println("winner: " + hedged(500, 100));
}`),
      out(`backup: answered
primary: cancelled
winner: backup`),
      'When the primary is quick, the backup is still waiting out its delay when the scope is cancelled: it is never sent.',
      '## What changes in Java 26 and 27',
      'Structured concurrency is still a preview after 25, and the API moves (read on openjdk.org, JEPs 525 and 533):',
      '| Java | Change your code will meet |\n|---|---|\n| 26 (JEP 525) | `anySuccessfulResultOrThrow()` is renamed `anySuccessfulOrThrow()`; `allSuccessfulOrThrow()` makes `join()` return a `List` of results instead of a stream of subtasks; `Joiner.onTimeout()` lets a joiner answer at the deadline; the configuration function is a `UnaryOperator` |\n| 27 (JEP 533) | a third type parameter for the exception `join()` throws; the three `…OrThrow` joiners throw `ExecutionException`; `awaitAll()` is removed; `timeout()` replaces `onTimeout()` |',
      'So in 25: keep the scope code in a few places (one helper per pattern), so a move to 26 or 27 is a handful of edits; and keep the ideas, which do not change.'
    ].join('\n\n'),
    work: [
      '**Hedging is how large services keep tail latency down** (Google\'s "The Tail at Scale" paper made it well known): a backup request after the 95th-percentile delay, cancelled when the first answer arrives. Without cancellation, hedging doubles the load; with a scope, the loser stops.',
      '**Adopting a preview API in production** is a team decision: it needs `--enable-preview` in the build (`maven-compiler-plugin` `<enablePreview>true</enablePreview>`, Gradle\'s `options.compilerArgs`) and in every `java` command, and the code must be rebuilt for each Java release. Many teams wait for it to become final and use executors with careful cancellation meanwhile; others use it now behind a small wrapper.'
    ].join('\n\n'),
    example: {
      code: `String call(String replica, long ms) throws InterruptedException {
    Thread.sleep(ms);
    IO.println(replica + ": answered");
    return replica;
}

String hedged(long primaryMs, long hedgeAfterMs) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> call("primary", primaryMs));
        scope.fork(() -> { Thread.sleep(hedgeAfterMs); return call("backup", 50); });
        return scope.join();
    }
}

void main() throws Exception {
    IO.println("fast primary: " + hedged(30, 100));
    IO.println("slow primary: " + hedged(500, 100));
}`
    },
    challenge: {
      title: 'A hedged request',
      task: 'Write `hedged(service, hedgeAfterMillis)`: call `service.fetch("primary")`; if it has not answered within `hedgeAfterMillis`, **also** call `service.fetch("backup")`; return whichever answers first, and **cancel** the other.\n\nIf the primary answers in time, the backup must **never be called**.',
      files: [SERVICE],
      starter: `String hedged(Service service, long hedgeAfterMillis) throws Exception {
    return service.fetch("primary");          // a slow primary makes every caller wait for it
}

void main() throws Exception {
    IO.println(hedged(id -> id + " answered", 100));
}`,
      solution: `String hedged(Service service, long hedgeAfterMillis) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> service.fetch("primary"));
        scope.fork(() -> {
            Thread.sleep(hedgeAfterMillis);
            return service.fetch("backup");
        });
        return scope.join();
    }
}

void main() throws Exception {
    IO.println(hedged(id -> id + " answered", 100));
}`,
      hints: [
        'A race: `StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())`.',
        'Fork the primary call, and a second subtask that first sleeps `hedgeAfterMillis`, then calls the backup. If the primary wins first, the scope interrupts that sleep and the backup is never called.'
      ],
      checks: [
        { label: 'a quick primary wins', code: `c.eq(c.call("hedged", (Service) id -> id, 300L), "primary");` },
        { label: 'with a quick primary, the backup is never called', code: `var asked = Collections.synchronizedList(new ArrayList<String>());
c.call("hedged", (Service) id -> { asked.add(id); return id; }, 300L);
Thread.sleep(400);
c.eq(asked, List.of("primary"));` },
        { label: 'a slow primary: the backup wins', code: `var p = c.probe(1);
c.eq(c.call("hedged", (Service) id -> { if (id.equals("primary")) p.hang(); return id; }, 100L), "backup");` },
        { label: 'the slow primary is cancelled', code: `var p = c.probe(1);
c.call("hedged", (Service) id -> { if (id.equals("primary")) p.hang(); return id; }, 100L);
c.ok(p.cancelled() == 1, "the slow primary was not cancelled when the backup answered");` },
        { label: 'the backup is sent only after the delay', code: `var firstBackupAt = new AtomicLong(-1);
long start = System.nanoTime();
var p = c.probe(1);
c.call("hedged", (Service) id -> { if (id.equals("primary")) p.hang(); else firstBackupAt.set((System.nanoTime() - start) / 1_000_000); return id; }, 200L);
c.ok(firstBackupAt.get() >= 180, "the backup was sent after " + firstBackupAt.get() + " ms, before the 200 ms delay");` }
      ]
    }
  });
})(window.JCLT);
