/*
 * Practice (batch 5), part 2: the Medium katas. The shape is at the top of data/katas-easy.js.
 */
(function (U) {
  'use strict';
  var K = U.data.katas = U.data.katas || [];
  var SERVICE = { name: 'Service.java', code: `/** A slow service: each call waits for an answer, as a call over the network does. */
public interface Service {
    String fetch(String id) throws Exception;
}
` };
  var HANG = `try (var watcher = Executors.newVirtualThreadPerTaskExecutor()) {
    var result = watcher.submit(c.task(() -> {
BODY
    }));
    try {
        result.get(3, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        c.fail("MESSAGE");
    } catch (ExecutionException e) {
        throw e.getCause();
    } finally {
        watcher.shutdownNow();
    }
}`;
  function within(body, message) { return HANG.replace('BODY', body).replace('MESSAGE', message); }

  K.push({
    id: 'bounded-buffer', level: 'Medium', kind: 'pattern', title: 'A bounded buffer with two conditions',
    summary: 'The classic: a lock and two wait sets, one for "not full" and one for "not empty".',
    patterns: ['locks', 'design'], keywords: ['ReentrantLock', 'Condition', 'await', 'signal', 'bounded buffer', 'producer consumer', 'guarded block'],
    learn: ['lesson:juc-locks', 'lesson:th-wait-notify'],
    java: 'Rarely written by hand at work (`ArrayBlockingQueue` is this), and asked for in interviews constantly, because it shows you understand waiting, signalling and why a wait is in a loop.',
    task: 'Write a nested class `Buffer` with a constructor `Buffer(int capacity)` and three methods:\n\n- `void put(String item)`: waits while the buffer is full;\n- `String take()`: waits while it is empty, and returns the oldest item;\n- `int size()`.\n\nUse one `ReentrantLock` and two `Condition`s. Each wait goes in a `while`.',
    starter: `import java.util.concurrent.locks.*;

// One ReentrantLock, two Conditions. put waits while full; take waits while empty.
static class Buffer {
    Buffer(int capacity) { }
    public void put(String item) throws InterruptedException { }
    public String take() throws InterruptedException { return null; }
    public int size() { return 0; }
}

void main() throws InterruptedException {
    var buffer = new Buffer(1);
    buffer.put("a");
    IO.println(buffer.take());
}`,
    solution: `import java.util.concurrent.locks.*;

static class Buffer {
    private final int capacity;
    private final ArrayDeque<String> items = new ArrayDeque<>();
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    Buffer(int capacity) { this.capacity = capacity; }

    public void put(String item) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity) notFull.await();
            items.addLast(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public String take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty()) notEmpty.await();
            String item = items.removeFirst();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return items.size();
        } finally {
            lock.unlock();
        }
    }
}

void main() throws InterruptedException {
    var buffer = new Buffer(1);
    buffer.put("a");
    IO.println(buffer.take());
}`,
    hints: ['`lock.newCondition()` twice: `notFull` and `notEmpty`.', 'After adding, `notEmpty.signal()`; after removing, `notFull.signal()`.', '`await()` gives the lock up while waiting; `while`, not `if`, because the condition may be false again when it wakes.'],
    checks: [
      { label: 'it gives items back, oldest first', code: `Object b = c.make("Buffer", 3);
c.callOn(b, "put", "a");
c.callOn(b, "put", "b");
c.eq(c.callOn(b, "size"), 2);
c.eq(c.callOn(b, "take"), "a");
c.eq(c.callOn(b, "take"), "b");` },
      { label: 'put waits while the buffer is full', code: `Object b = c.make("Buffer", 1);
c.callOn(b, "put", "a");
var second = c.task(() -> c.callOn(b, "put", "b"));
Thread t = Thread.ofVirtual().start(() -> { try { second.call(); } catch (Exception e) { } });
boolean ended = t.join(java.time.Duration.ofMillis(200));
c.ok(!ended, "put returned although the buffer was full");
c.eq(c.callOn(b, "take"), "a");
c.ok(t.join(java.time.Duration.ofSeconds(2)), "the waiting put did not wake when room appeared: did take signal notFull?");` },
      { label: 'take waits while it is empty, and wakes for an item', code: `Object b = c.make("Buffer", 1);
var got = new CompletableFuture<Object>();
var taking = c.task(() -> got.complete(c.callOn(b, "take")));
Thread t = Thread.ofVirtual().start(() -> { try { taking.call(); } catch (Exception e) { got.completeExceptionally(e); } });
boolean ended = t.join(java.time.Duration.ofMillis(200));
c.ok(!ended, "take returned although the buffer was empty");
c.callOn(b, "put", "a");
c.eq(got.get(2, TimeUnit.SECONDS), "a");` },
      { label: 'many producers and consumers lose nothing', code: `Object b = c.make("Buffer", 2);
var taken = new ConcurrentLinkedQueue<Object>();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 200; i++) {
        String item = "x" + i;
        ex.submit(c.task(() -> c.callOn(b, "put", item)));
        ex.submit(c.task(() -> taken.add(c.callOn(b, "take"))));
    }
}
c.eq(new HashSet<>(taken).size(), 200);` }
    ]
  });

  K.push({
    id: 'load-once', level: 'Medium', kind: 'pattern', title: 'Load each key once, without one big lock',
    summary: 'A cache where 50 threads asking for one key load it once, and other keys do not wait.',
    patterns: ['collections'], keywords: ['computeIfAbsent', 'ConcurrentHashMap', 'cache', 'stampede', 'thundering herd', 'load once'],
    learn: ['lesson:juc-collections'],
    java: 'A local cache of slow lookups. Get-then-put loads the same key many times at once (a cache stampede). A big `synchronized` stops that and makes every key wait for every other.',
    task: 'Write `load(cache, key, loader)`: return the cached value for `key`, calling `loader` only if it is absent. From many threads, one key loads **once**, and loading one key must not hold up another.',
    starter: `// One key loads once; different keys do not wait for each other.
String load(ConcurrentHashMap<String, String> cache, String key, Function<String, String> loader) {
    String value = cache.get(key);
    if (value == null) {
        value = loader.apply(key);
        cache.put(key, value);
    }
    return value;
}

void main() {
    IO.println(load(new ConcurrentHashMap<>(), "a", k -> k + "!"));
}`,
    solution: `String load(ConcurrentHashMap<String, String> cache, String key, Function<String, String> loader) {
    return cache.computeIfAbsent(key, loader);
}

void main() {
    IO.println(load(new ConcurrentHashMap<>(), "a", k -> k + "!"));
}`,
    hints: ['Look at the atomic per-key methods of `ConcurrentHashMap`.', '`computeIfAbsent` locks only one bin, and runs the function at most once per key.'],
    checks: [
      { label: 'it loads a value and keeps it', code: `var cache = new ConcurrentHashMap<String, String>();
var loads = new AtomicInteger();
Function<String, String> loader = k -> { loads.incrementAndGet(); return k + "!"; };
c.eq(c.call("load", cache, "a", loader), "a!");
c.eq(c.call("load", cache, "a", loader), "a!");
c.eq(loads.get(), 1);` },
      { label: 'from 50 threads, one key loads once', code: `var cache = new ConcurrentHashMap<String, String>();
var loads = new AtomicInteger();
Function<String, String> loader = k -> {
    loads.incrementAndGet();
    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    return k;
};
var start = new CountDownLatch(1);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 50; i++) {
        ex.submit(c.task(() -> { start.await(); c.call("load", cache, "a", loader); }));
    }
    start.countDown();
}
c.eq(loads.get(), 1);` },
      { label: 'loading one key does not hold up another', code: `var cache = new ConcurrentHashMap<String, String>();
var probe = c.probe(2);
Function<String, String> loader = k -> {
    try { probe.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    return k;
};
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    ex.submit(c.task(() -> c.call("load", cache, "a", loader)));
    ex.submit(c.task(() -> c.call("load", cache, "b", loader)));
}
c.ok(probe.peak() == 2, "two different keys could not load at the same time: a lock around everything?");` }
    ]
  });

  K.push({
    id: 'cas-max', level: 'Medium', kind: 'pattern', title: 'A running maximum, without a lock',
    summary: 'The compare-and-set loop, and why a check and a set must be one step.',
    patterns: ['atomics'], keywords: ['compareAndSet', 'CAS', 'CAS loop', 'accumulateAndGet', 'updateAndGet', 'maximum', 'lock free'],
    learn: ['lesson:juc-atomics'],
    java: 'A peak gauge: the most requests in flight, the slowest call seen. Every `Probe` in this tool\'s checks has exactly this line in it.',
    task: 'Write `raise(max, value)`: raise `max` to `value` if `value` is higher, and return the maximum afterwards. Many threads call it at once, with no lock, and a higher value must never be overwritten by a lower one.',
    starter: `// Raise max to value if it is higher; return the maximum. No lock; nothing overwritten by a lower value.
int raise(AtomicInteger max, int value) {
    if (value > max.get()) {
        max.set(value);
    }
    return max.get();
}

void main() {
    IO.println(raise(new AtomicInteger(3), 7));
}`,
    solution: `int raise(AtomicInteger max, int value) {
    int seen = max.get();
    while (value > seen) {
        if (max.compareAndSet(seen, value)) {
            return value;
        }
        seen = max.get();
    }
    return seen;
}

void main() {
    IO.println(raise(new AtomicInteger(3), 7));
}`,
    hints: ['`compareAndSet(seen, value)` writes only if the value is still the one you saw.', 'If it fails, another thread got in: read again and try again.', '`accumulateAndGet(value, Math::max)` is the same loop, ready made.'],
    checks: [
      { label: 'a higher value raises it', code: `var m = new AtomicInteger(3);
c.eq(c.call("raise", m, 7), 7);
c.eq(m.get(), 7);` },
      { label: 'a lower value leaves it', code: `var m = new AtomicInteger(9);
c.eq(c.call("raise", m, 7), 9);
c.eq(m.get(), 9);` },
      { label: 'from many threads the maximum is right', code: `var m = new AtomicInteger();
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 1; i <= 5000; i++) {
        int v = i;
        ex.submit(c.task(() -> c.call("raise", m, v)));
    }
}
c.eq(m.get(), 5000);` },
      { label: 'the check and the write are one step', idiom: true, code: `c.ok(c.uses("compareAndSet|accumulateAndGet|updateAndGet"), "a get and a set are two steps: a lower value can overwrite a higher one between them");` }
    ]
  });

  K.push({
    id: 'try-transfer', level: 'Medium', kind: 'pattern', title: 'A transfer that backs off instead of deadlocking',
    summary: 'Take two locks with tryLock, and let go if you cannot get both.',
    patterns: ['locks'], keywords: ['tryLock', 'ReentrantLock', 'deadlock', 'transfer', 'back off', 'lock ordering'],
    learn: ['lesson:th-deadlock', 'lesson:juc-locks'],
    java: 'Two accounts, two inventory rows. Databases do this for you and report a deadlock victim; in memory it is your job. Lock ordering is the other fix, and needs a total order to be possible.',
    task: 'Write `tryTransfer(from, to, amount)` with `Account` (in `Account.java`): take both accounts\' locks with `tryLock()`. If you get both and `from` has the money, move it and return `true`. Otherwise return `false`, having moved nothing and **holding neither lock**.',
    files: [{ name: 'Account.java', code: `import java.util.concurrent.locks.ReentrantLock;

/** An account: its balance is guarded by its lock. */
public class Account {
    public final ReentrantLock lock = new ReentrantLock();
    public int balance;

    public Account(int balance) { this.balance = balance; }
}
` }],
    starter: `// tryLock both. Got both and enough money: move it, true. Otherwise false, moving nothing, holding neither.
boolean tryTransfer(Account from, Account to, int amount) {
    from.lock.lock();
    to.lock.lock();
    try {
        if (from.balance < amount) return false;
        from.balance -= amount;
        to.balance += amount;
        return true;
    } finally {
        to.lock.unlock();
        from.lock.unlock();
    }
}

void main() {
    IO.println(tryTransfer(new Account(10), new Account(0), 5));
}`,
    solution: `boolean tryTransfer(Account from, Account to, int amount) {
    if (!from.lock.tryLock()) return false;
    try {
        if (!to.lock.tryLock()) return false;
        try {
            if (from.balance < amount) return false;
            from.balance -= amount;
            to.balance += amount;
            return true;
        } finally {
            to.lock.unlock();
        }
    } finally {
        from.lock.unlock();
    }
}

void main() {
    IO.println(tryTransfer(new Account(10), new Account(0), 5));
}`,
    hints: ['`if (!from.lock.tryLock()) return false;` then a `try` whose `finally` unlocks it.', 'The same again, nested, for `to`.', 'Letting go of the first when the second fails is what breaks the deadlock.'],
    checks: [
      { label: 'it moves the money', code: `var a = new Account(10);
var b = new Account(0);
c.eq(c.call("tryTransfer", a, b, 4), true);
c.eq(List.of(a.balance, b.balance), List.of(6, 4));` },
      { label: 'without enough money it moves nothing', code: `var a = new Account(1);
var b = new Account(0);
c.eq(c.call("tryTransfer", a, b, 4), false);
c.eq(List.of(a.balance, b.balance), List.of(1, 0));` },
      { label: 'if another thread holds a lock it returns false, at once, holding nothing', code: `var a = new Account(10);
var b = new Account(0);
var held = new CountDownLatch(1);
var release = new CountDownLatch(1);
Thread holder = Thread.ofPlatform().start(() -> {
    b.lock.lock();
    held.countDown();
    try { release.await(); } catch (InterruptedException e) { }
    b.lock.unlock();
});
held.await();
${''}` + within(`        c.eq(c.call("tryTransfer", a, b, 4), false);
        c.ok(!a.lock.isLocked(), "it kept the first lock after failing to get the second: that is how a deadlock starts");`, 'it waited for the lock instead of backing off') + `
release.countDown();
holder.join();
c.eq(List.of(a.balance, b.balance), List.of(10, 0));` },
      { label: 'it holds no lock afterwards', code: `var a = new Account(10);
var b = new Account(0);
c.call("tryTransfer", a, b, 4);
c.call("tryTransfer", a, b, 400);
c.ok(!a.lock.isLocked() && !b.lock.isLocked(), "a lock is still held after it returned");` }
    ]
  });

  K.push({
    id: 'cf-pipeline', level: 'Medium', kind: 'pattern', title: 'A CompletableFuture pipeline',
    summary: 'Two calls at once on your executor, combined, with a fallback when either fails.',
    patterns: ['futures'], keywords: ['CompletableFuture', 'supplyAsync', 'thenCombine', 'exceptionally', 'executor', 'common pool'],
    learn: ['lesson:juc-completable', 'lesson:sp-aggregator'],
    java: 'Aggregators written before scopes, and most code you will meet. A `supplyAsync` with no executor uses the common pool: its threads are few, and on Spring they carry none of your context.',
    task: 'Write `page(executor, price, stock)`: run both suppliers at the same time **on the executor you are given**, and return a `CompletableFuture<String>` of `"<price> x <stock>"`. If either fails, the future gives `"unavailable"` instead of failing.',
    starter: `// Both at once on the given executor; "price x stock"; "unavailable" if either fails.
CompletableFuture<String> page(Executor executor, Supplier<String> price, Supplier<String> stock) {
    return CompletableFuture.supplyAsync(() -> price.get() + " x " + stock.get());
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(page(executor, () -> "250", () -> "4").join());
    }
}`,
    solution: `CompletableFuture<String> page(Executor executor, Supplier<String> price, Supplier<String> stock) {
    var p = CompletableFuture.supplyAsync(price, executor);
    var s = CompletableFuture.supplyAsync(stock, executor);
    return p.thenCombine(s, (a, b) -> a + " x " + b).exceptionally(e -> "unavailable");
}

void main() {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        IO.println(page(executor, () -> "250", () -> "4").join());
    }
}`,
    hints: ['`CompletableFuture.supplyAsync(price, executor)`: the second argument is what keeps it off the common pool.', '`thenCombine` joins two futures.', '`exceptionally` at the end of the chain turns any failure into a value.'],
    checks: [
      { label: 'it combines the two answers', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Supplier<String> p = () -> "250";
    Supplier<String> s = () -> "4";
    CompletableFuture<String> f = c.call("page", ex, p, s);
    c.eq(f.join(), "250 x 4");
}` },
      { label: 'both run at the same time', code: `var probe = c.probe(2);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Supplier<String> call = () -> { try { probe.meet(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return "x"; };
    CompletableFuture<String> f = c.call("page", ex, call, call);
    f.join();
}
c.ok(probe.peak() == 2, "at most " + probe.peak() + " at once");` },
      { label: 'both run on your executor, not on the common pool', code: `var probe = c.probe(1);
try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Supplier<String> call = () -> { try { probe.sleep(1); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } return "x"; };
    CompletableFuture<String> f = c.call("page", ex, call, call);
    f.join();
}
c.ok(probe.allVirtual(), probe.platformCalls() + " calls ran on a platform thread: was the executor passed?");` },
      { label: 'if either fails, it gives "unavailable"', code: `try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
    Supplier<String> good = () -> "4";
    Supplier<String> bad = () -> { throw new IllegalStateException("down"); };
    CompletableFuture<String> one = c.call("page", ex, bad, good);
    CompletableFuture<String> two = c.call("page", ex, good, bad);
    c.eq(one.join(), "unavailable");
    c.eq(two.join(), "unavailable");
}` }
    ]
  });

  K.push({
    id: 'first-success', level: 'Medium', kind: 'pattern', title: 'The first mirror to answer',
    summary: 'A race: the first success wins, the losers are cancelled, and only all failing is a failure.',
    patterns: ['structured'], keywords: ['anySuccessfulResultOrThrow', 'Joiner', 'race', 'mirror', 'StructuredTaskScope', 'cancel'],
    learn: ['lesson:sc-joiners'],
    java: 'Asking several replicas or regions and taking the fastest. Preview API in Java 25; the joiner was renamed `anySuccessfulOrThrow` in 26 ([[lesson:sc-patterns]]).',
    task: 'Write `firstAnswer(service, mirrors)`: ask every mirror at once with `service.fetch`, and return the **first success**. The others are cancelled. A mirror that fails is ignored unless all fail, and then return `"none"`.',
    files: [SERVICE],
    starter: `// Ask all at once; the first success wins, the rest are cancelled; "none" if all fail.
String firstAnswer(Service service, List<String> mirrors) throws Exception {
    return service.fetch(mirrors.get(0));
}

void main() throws Exception {
    Service service = id -> "from " + id;
    IO.println(firstAnswer(service, List.of("eu", "us")));
}`,
    solution: `String firstAnswer(Service service, List<String> mirrors) throws Exception {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        for (String mirror : mirrors) {
            scope.fork(() -> service.fetch(mirror));
        }
        return scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        return "none";
    }
}

void main() throws Exception {
    Service service = id -> "from " + id;
    IO.println(firstAnswer(service, List.of("eu", "us")));
}`,
    hints: ['`StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())`', 'Fork one per mirror; `scope.join()` returns the winner\'s result.', 'When all fail, `join()` throws `FailedException`.'],
    checks: [
      { label: 'it returns the one that answers, while the other hangs', code: `var probe = c.probe(1);
Service service = id -> { if (id.equals("slow")) probe.hang(); return "from " + id; };
c.eq(c.call("firstAnswer", service, List.of("slow", "fast")), "from fast");` },
      { label: 'the loser is cancelled', code: `var probe = c.probe(1);
Service service = id -> { if (id.equals("slow")) probe.hang(); probe.whenHanging(1); return "from " + id; };
c.call("firstAnswer", service, List.of("slow", "fast"));
c.ok(probe.cancelled() == 1, "the slow mirror was left running");` },
      { label: 'a failing mirror is ignored when another answers', code: `Service service = id -> {
    if (id.equals("bad")) throw new IllegalStateException("down");
    Thread.sleep(50);
    return "from " + id;
};
c.eq(c.call("firstAnswer", service, List.of("bad", "good")), "from good");` },
      { label: 'if all fail, it returns "none"', code: `Service service = id -> { throw new IllegalStateException("down"); };
c.eq(c.call("firstAnswer", service, List.of("a", "b")), "none");` }
    ]
  });

  K.push({
    id: 'timed-batch', level: 'Medium', kind: 'pattern', title: 'A batch with one deadline',
    summary: 'invokeAll with a timeout: what finished, what was late, and what failed.',
    patterns: ['futures'], keywords: ['invokeAll', 'timeout', 'Future', 'state', 'cancelled', 'partial results'],
    learn: ['lesson:juc-futures'],
    java: 'A dashboard: show what arrived within a second, and mark the rest. The per-task `get(timeout)` version gives each task its own second, and adds up to many.',
    task: 'Write `within(service, ids, ms)`: fetch every id, all at once on virtual threads, with **one** deadline of `ms` for the whole batch. Return one string per id, in order: the answer; `"late"` for one that missed the deadline, which must be cancelled; `"failed"` for one that threw.',
    files: [SERVICE],
    starter: `// One deadline for the batch. For each id, in order: the answer, "late" (and cancelled) or "failed".
List<String> within(Service service, List<String> ids, long ms) throws Exception {
    var out = new ArrayList<String>();
    for (String id : ids) {
        out.add(service.fetch(id));
    }
    return out;
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(within(service, List.of("a"), 100));
}`,
    solution: `List<String> within(Service service, List<String> ids, long ms) throws Exception {
    var tasks = new ArrayList<Callable<String>>();
    for (String id : ids) {
        tasks.add(() -> service.fetch(id));
    }
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        var out = new ArrayList<String>();
        for (var f : executor.invokeAll(tasks, ms, TimeUnit.MILLISECONDS)) {
            out.add(switch (f.state()) {
                case SUCCESS -> f.resultNow();
                case FAILED -> "failed";
                default -> "late";
            });
        }
        return out;
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(within(service, List.of("a"), 100));
}`,
    hints: ['`executor.invokeAll(tasks, ms, TimeUnit.MILLISECONDS)` waits for all or the deadline, and cancels the late ones. Its futures are in the order of the tasks.', '`f.state()` is `SUCCESS`, `FAILED` or `CANCELLED`.', '`f.resultNow()` gives a successful task\'s result.'],
    checks: [
      { label: 'answers in order', code: `Service service = id -> "answer " + id;
c.eq(c.call("within", service, List.of("a", "b"), 2000L), List.of("answer a", "answer b"));` },
      { label: 'they run at the same time', code: `var probe = c.probe(3);
Service service = id -> { probe.meet(); return id; };
c.call("within", service, List.of("a", "b", "c"), 3000L);
c.ok(probe.peak() == 3, "at most " + probe.peak() + " at once");` },
      { label: 'one late: marked, and cancelled', code: `var probe = c.probe(1);
Service service = id -> { if (id.equals("slow")) probe.hang(); return "answer " + id; };
c.eq(c.call("within", service, List.of("a", "slow", "b"), 150L), List.of("answer a", "late", "answer b"));
c.ok(probe.cancelled() == 1, "the late call ran on");` },
      { label: 'one failed: marked', code: `Service service = id -> { if (id.equals("bad")) throw new IllegalStateException("down"); return "answer " + id; };
c.eq(c.call("within", service, List.of("bad", "a"), 2000L), List.of("failed", "answer a"));` }
    ]
  });

  K.push({
    id: 'sum-fork-join', level: 'Medium', kind: 'pattern', title: 'Divide and conquer with fork/join',
    summary: 'A RecursiveTask that splits an array until the pieces are small.',
    patterns: ['forkjoin'], keywords: ['RecursiveTask', 'ForkJoinPool', 'fork', 'join', 'compute', 'work stealing', 'threshold'],
    learn: ['lesson:juc-forkjoin'],
    java: 'Parallel streams run on this. You rarely write one at work, but it is the shape of CPU-bound parallel work, the one kind virtual threads do not help ([[lesson:vt-cpu-bound]]).',
    task: 'Write `sum(numbers)`: add up an `int[]` with a nested `RecursiveTask<Long>`: at or below 1,000 items add them in a loop, otherwise split in two, `fork` one half and `compute` the other. Run it with `ForkJoinPool.commonPool().invoke(...)`.',
    starter: `// A RecursiveTask<Long>: split above 1,000 items, fork one half, compute the other.
long sum(int[] numbers) {
    long total = 0;
    for (int n : numbers) total += n;
    return total;
}

void main() {
    IO.println(sum(new int[] { 1, 2, 3 }));
}`,
    solution: `static class Sum extends RecursiveTask<Long> {
    final int[] numbers;
    final int from, to;

    Sum(int[] numbers, int from, int to) {
        this.numbers = numbers;
        this.from = from;
        this.to = to;
    }

    @Override protected Long compute() {
        if (to - from <= 1_000) {
            long total = 0;
            for (int i = from; i < to; i++) total += numbers[i];
            return total;
        }
        int middle = (from + to) / 2;
        var left = new Sum(numbers, from, middle);
        var right = new Sum(numbers, middle, to);
        left.fork();
        return right.compute() + left.join();
    }
}

long sum(int[] numbers) {
    return ForkJoinPool.commonPool().invoke(new Sum(numbers, 0, numbers.length));
}

void main() {
    IO.println(sum(new int[] { 1, 2, 3 }));
}`,
    hints: ['A class that `extends RecursiveTask<Long>` and overrides `compute()`, with a from and a to.', '`left.fork(); return right.compute() + left.join();`: this thread does one half itself.', 'Splitting at `middle`: the left half is `from` to `middle`, the right `middle` to `to`.'],
    checks: [
      { label: 'a small array', code: `c.eq(c.call("sum", (Object) new int[] { 1, 2, 3 }), 6L);` },
      { label: 'an empty array', code: `c.eq(c.call("sum", (Object) new int[0]), 0L);` },
      { label: 'a big array, every number counted once', code: `int[] a = new int[1_000_001];
long want = 0;
for (int i = 0; i < a.length; i++) { a[i] = i % 97; want += a[i]; }
c.eq(c.call("sum", (Object) a), want);` },
      { label: 'it is a RecursiveTask, split with fork', idiom: true, code: `c.ok(c.uses("RecursiveTask") && c.uses("fork"), "a loop adds them correctly, on one thread: split with a RecursiveTask");` }
    ]
  });

  K.push({
    id: 'map-limited', level: 'Medium', kind: 'pattern', title: 'A stream with a concurrency limit',
    summary: 'Gatherers.mapConcurrent: virtual threads, the order kept, at most n at once.',
    patterns: ['limits', 'forkjoin'], keywords: ['Gatherers', 'mapConcurrent', 'stream', 'parallelStream', 'limit', 'order'],
    learn: ['lesson:sv-map-concurrent', 'lesson:juc-forkjoin'],
    java: 'Calling a service for each item of a list, gently. A parallel stream would be the wrong tool: common-pool threads, a size you do not choose, and blocking calls starving everything else using that pool.',
    task: 'Write `fetchLimited(service, ids, limit)` as one stream: at most `limit` calls at once, on virtual threads, answers in the order of the ids. A checked exception from `fetch` should come out as a `RuntimeException`.',
    files: [SERVICE],
    starter: `// One stream: at most limit calls at once, on virtual threads, answers in order.
List<String> fetchLimited(Service service, List<String> ids, int limit) {
    return ids.parallelStream().map(id -> {
        try {
            return service.fetch(id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }).toList();
}

void main() {
    Service service = id -> "answer " + id;
    IO.println(fetchLimited(service, List.of("a", "b"), 1));
}`,
    solution: `List<String> fetchLimited(Service service, List<String> ids, int limit) {
    return ids.stream().gather(Gatherers.mapConcurrent(limit, (String id) -> {
        try {
            return service.fetch(id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    })).toList();
}

void main() {
    Service service = id -> "answer " + id;
    IO.println(fetchLimited(service, List.of("a", "b"), 1));
}`,
    hints: ['`ids.stream().gather(Gatherers.mapConcurrent(limit, id -> …)).toList()`', 'It needs `import java.util.stream.*`? A compact source file imports all of `java.base`, so no.', 'If the compiler cannot work out the type, write `(String id) -> …`.'],
    checks: [
      { label: 'answers in order', code: `Service service = id -> { if (id.equals("a")) Thread.sleep(50); return "answer " + id; };
c.eq(c.call("fetchLimited", service, List.of("a", "b", "c"), 3), List.of("answer a", "answer b", "answer c"));` },
      { label: 'never more than the limit', code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(10); return id; };
var ids = new ArrayList<String>();
for (int i = 0; i < 30; i++) ids.add("x" + i);
c.call("fetchLimited", service, ids, 3);
c.ok(probe.peak() <= 3, probe.peak() + " at once, with a limit of 3");` },
      { label: 'it reaches the limit', code: `var probe = c.probe(3);
Service service = id -> { probe.meet(); return id; };
c.call("fetchLimited", service, List.of("a", "b", "c", "d", "e", "f"), 3);
c.ok(probe.peak() == 3, "at most " + probe.peak() + " at once, with a limit of 3");` },
      { label: 'on virtual threads', code: `var probe = c.probe(1);
Service service = id -> { probe.sleep(1); return id; };
c.call("fetchLimited", service, List.of("a", "b", "c", "d"), 2);
c.ok(probe.allVirtual(), probe.platformCalls() + " calls ran on a platform thread");` }
    ]
  });

  K.push({
    id: 'rw-wait-notify-to-queue', level: 'Medium', kind: 'rewrite', title: 'wait and notify, retired',
    summary: 'A hand-made mailbox with a monitor becomes a bounded queue.',
    patterns: ['queues', 'locks'], keywords: ['wait', 'notifyAll', 'ArrayBlockingQueue', 'SynchronousQueue', 'guarded block', 'mailbox'],
    learn: ['lesson:th-wait-notify', 'lesson:juc-collections'],
    java: 'You will meet this in old code. It is often correct, and it is easy to break: an `if` where a `while` should be, a `notify` that wakes the wrong thread. A queue from the JDK has none of those lines.',
    task: 'This works. Rewrite the nested class `Mailbox` with a `BlockingQueue` of capacity 1: no `wait`, no `notifyAll`, no `synchronized`. `put` still waits while it is full; `take` still waits while it is empty.',
    starter: `// Works today. Rewrite with a BlockingQueue of capacity 1.
static class Mailbox {
    private String item;

    public synchronized void put(String value) throws InterruptedException {
        while (item != null) wait();
        item = value;
        notifyAll();
    }

    public synchronized String take() throws InterruptedException {
        while (item == null) wait();
        String value = item;
        item = null;
        notifyAll();
        return value;
    }
}

void main() throws InterruptedException {
    var box = new Mailbox();
    box.put("hello");
    IO.println(box.take());
}`,
    solution: `static class Mailbox {
    private final BlockingQueue<String> queue = new ArrayBlockingQueue<>(1);

    public void put(String value) throws InterruptedException {
        queue.put(value);
    }

    public String take() throws InterruptedException {
        return queue.take();
    }
}

void main() throws InterruptedException {
    var box = new Mailbox();
    box.put("hello");
    IO.println(box.take());
}`,
    hints: ['`new ArrayBlockingQueue<>(1)`.', '`queue.put` and `queue.take` already wait.'],
    checks: [
      { label: 'it hands a value over', code: `Object b = c.make("Mailbox");
c.callOn(b, "put", "a");
c.eq(c.callOn(b, "take"), "a");` },
      { label: 'put waits while it is full', code: `Object b = c.make("Mailbox");
c.callOn(b, "put", "a");
var second = c.task(() -> c.callOn(b, "put", "b"));
Thread t = Thread.ofVirtual().start(() -> { try { second.call(); } catch (Exception e) { } });
c.ok(!t.join(java.time.Duration.ofMillis(200)), "put returned although the mailbox was full");
c.eq(c.callOn(b, "take"), "a");
c.ok(t.join(java.time.Duration.ofSeconds(2)), "the waiting put never woke");
c.eq(c.callOn(b, "take"), "b");` },
      { label: 'take waits while it is empty', code: `Object b = c.make("Mailbox");
var taking = c.task(() -> c.callOn(b, "take"));
Thread t = Thread.ofVirtual().start(() -> { try { taking.call(); } catch (Exception e) { } });
c.ok(!t.join(java.time.Duration.ofMillis(200)), "take returned although the mailbox was empty");
c.callOn(b, "put", "a");
c.ok(t.join(java.time.Duration.ofSeconds(2)), "the waiting take never woke");` },
      { label: 'no monitor left: the JDK\'s queue does it', idiom: true, code: `c.ok(c.uses("BlockingQueue") && !c.uses("notifyAll") && !c.uses("synchronized"), "use a BlockingQueue: no wait, no notifyAll, no synchronized");` }
    ]
  });

  K.push({
    id: 'rw-future-to-scope', level: 'Medium', kind: 'rewrite', title: 'From futures to a scope',
    summary: 'The same fan-out, except that a failure now stops the other call.',
    patterns: ['structured'], keywords: ['StructuredTaskScope', 'fork', 'join', 'Future', 'cancel', 'failure', 'rewrite'],
    learn: ['lesson:sc-why', 'lesson:sc-failure', 'then:cancel-siblings'],
    java: 'What you gain: when one call fails, the other stops, the caller hears at once, and nothing is left behind. Preview in Java 25, so weigh that before you ship it ([[lesson:sp-aggregator]]).',
    task: 'This works, but when one call fails the other runs on. Rewrite it with a `StructuredTaskScope`, so the failure cancels the other call and the exception (a `FailedException`) still reaches the caller.',
    files: [SERVICE],
    starter: `// Works, but a failure leaves the other call running. Rewrite with a StructuredTaskScope.
String both(Service service, String a, String b) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> first = executor.submit(() -> service.fetch(a));
        Future<String> second = executor.submit(() -> service.fetch(b));
        return first.get() + " and " + second.get();
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(both(service, "a", "b"));
}`,
    solution: `String both(Service service, String a, String b) throws Exception {
    try (var scope = StructuredTaskScope.open()) {
        var first = scope.fork(() -> service.fetch(a));
        var second = scope.fork(() -> service.fetch(b));
        scope.join();
        return first.get() + " and " + second.get();
    }
}

void main() throws Exception {
    Service service = id -> "answer " + id;
    IO.println(both(service, "a", "b"));
}`,
    hints: ['`try (var scope = StructuredTaskScope.open()) { … }`: the default joiner cancels on the first failure.', '`fork` replaces `submit`; call `scope.join()` before you read a subtask with `get()`.'],
    checks: [
      { label: 'the same answer', code: `Service service = id -> "answer " + id;
c.eq(c.call("both", service, "a", "b"), "answer a and answer b");` },
      { label: 'both run at the same time, on virtual threads', code: `var probe = c.probe(2);
Service service = id -> { probe.meet(); return id; };
c.call("both", service, "a", "b");
c.ok(probe.peak() == 2 && probe.allVirtual(), "peak " + probe.peak() + ", all virtual: " + probe.allVirtual());` },
      { label: 'a failure reaches the caller', code: `Service service = id -> { throw new IllegalStateException("down"); };
boolean threw = false;
try {
    c.call("both", service, "a", "b");
} catch (Throwable t) {
    threw = true;
}
c.ok(threw, "it returned normally although the calls failed");` },
      { label: 'a failure cancels the other call', idiom: true, code: `var probe = c.probe(1);
Service service = id -> {
    if (id.equals("slow")) probe.hang();
    probe.whenHanging(1);
    throw new IllegalStateException("down");
};
try {
    c.call("both", service, "slow", "bad");
} catch (Throwable t) {
}
c.ok(probe.cancelled() == 1, "the other call ran on after the failure");` }
    ]
  });
})(window.JCLT);
