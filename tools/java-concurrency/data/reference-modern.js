/*
 * data/reference-modern.js - the Reference, part 2 (batch 3): the Java 21 to 25 APIs of the structured
 * concurrency and scoped values tracks, and ThreadLocal beside them. The entry shape is described at the
 * top of data/reference-foundations.js.
 *
 * StructuredTaskScope (with Joiner, Subtask and Configuration) and StableValue are preview APIs in Java
 * 25: their entries say so, and the tool compiles and runs everything with --enable-preview. ScopedValue
 * is final in Java 25 (its source says @since 25; it was a preview from 21 to 24).
 */
(function (U) {
  'use strict';
  var R = U.data.reference = U.data.reference || [];
  var API = 'https://docs.oracle.com/en/java/javase/25/docs/api/java.base/';
  var STS = API + 'java/util/concurrent/StructuredTaskScope.html';
  function nl(s) { return /\n$/.test(s) ? s : s + '\n'; }
  function slug(t) { return t.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function add(group, docs, rows) {
    rows.forEach(function (r) {
      var title = r.title || (r.owner ? r.owner + '.' + r.name : r.receiver ? r.receiver[0] + '.' + r.name : r.name);
      var e = { id: r.key || slug(title), group: group, name: r.name, title: title, sig: r.sig, since: r.since, preview: !!r.preview,
        summary: r.summary, example: nl(r.example), output: nl(r.output), docs: r.docs || docs };
      ['owner', 'receiver', 'kind', 'covers', 'see', 'stdin'].forEach(function (k) { if (r[k] !== undefined) e[k] = r[k]; });
      R.push(e);
    });
  }

  U.data.refGroups = (U.data.refGroups || []).concat([
    { id: 'structured', title: 'Structured concurrency (preview)', docs: STS,
      intro: '`StructuredTaskScope`, a **preview API in Java 25** (JEP 505): open a scope, fork subtasks, join them, and the scope\'s `Joiner` decides what a failure or a first success does. Its API changes in Java 26 and 27. See [[lesson:sc-basics]] and [[lesson:sc-joiners]].' },
    { id: 'scoped', title: 'Scoped values, ThreadLocal and lazy values', docs: API + 'java/lang/ScopedValue.html',
      intro: '`ScopedValue` (final in Java 25) for context bound for a call, `ThreadLocal` for a value per thread, `StableValue` (a preview in 25) for a value set once, and `Gatherers.mapConcurrent` (Java 24) for blocking calls in a stream. See [[lesson:sv-basics]].' }
  ]);

  /* ---------------------------------------------------------------- structured concurrency */
  var SCOPE = ['StructuredTaskScope'];
  add('structured', STS, [
    { name: 'open', owner: 'StructuredTaskScope', sig: 'static <T> StructuredTaskScope<T, Void> open()\nstatic <T, R> StructuredTaskScope<T, R> open(Joiner<? super T, ? extends R> joiner)\nstatic <T, R> StructuredTaskScope<T, R> open(Joiner<? super T, ? extends R> joiner, Function<Configuration, Configuration> configFunction)',
      since: '25', preview: true, see: ['lesson:sc-basics'],
      summary: 'Opens a scope owned by the current thread, in try-with-resources. With no `Joiner` it waits for every subtask and fails if any fails (`FailedException`), cancelling the others; a `Joiner` sets another policy, and the configuration function a timeout, a name or a thread factory.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var user = scope.fork(() -> "ravi");
        var orders = scope.fork(() -> 3);
        scope.join();
        IO.println(user.get() + " has " + orders.get() + " orders");
    }
}`,
      output: 'ravi has 3 orders' },
    { name: 'fork', receiver: SCOPE, title: 'StructuredTaskScope.fork', sig: '<U extends T> Subtask<U> fork(Callable<? extends U> task)\nSubtask<? extends T> fork(Runnable task)   // since 25', since: '21', preview: true, see: ['lesson:sc-basics'],
      summary: 'Starts a subtask, on a new virtual thread by default, and returns its `Subtask` at once. Only the scope\'s owner may fork (another thread gets `WrongThreadException`), and the subtask inherits the owner\'s scoped values.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var where = scope.fork(() -> Thread.currentThread().isVirtual() ? "a virtual thread" : "a platform thread");
        scope.join();
        IO.println("the subtask ran on " + where.get());
    }
}`,
      output: 'the subtask ran on a virtual thread' },
    { name: 'join', key: 'structured-task-scope-join', receiver: SCOPE, title: 'StructuredTaskScope.join', sig: 'R join() throws StructuredTaskScope.FailedException, InterruptedException', since: '25', preview: true, see: ['lesson:sc-basics'],
      summary: 'Waits for the subtasks as the `Joiner` decides, and returns what it produces (`null` for `open()`\'s default). Call it once, before reading any subtask; a second call throws `IllegalStateException`.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        var a = scope.fork(() -> 1);
        try {
            a.get();
        } catch (IllegalStateException e) {
            IO.println("before join: " + e.getMessage());
        }
        IO.println("join returned: " + scope.join() + ", a = " + a.get());
    }
}`,
      output: 'before join: join not called\njoin returned: null, a = 1' },
    { name: 'get', key: 'subtask-get', receiver: ['Subtask'], title: 'Subtask.get', sig: 'T get()\nSubtask.State state()   // UNAVAILABLE, SUCCESS, FAILED\nThrowable exception()', since: '21', preview: true, covers: ['state', 'exception'], see: ['lesson:sc-basics'],
      summary: 'A subtask\'s result, after `join()`. `state()` says `SUCCESS`, `FAILED` or `UNAVAILABLE` (not finished, or cancelled); `exception()` gives a failed one\'s exception.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>awaitAll())) {
        var ok = scope.fork(() -> "fine");
        var bad = scope.fork(() -> { throw new IllegalStateException("broken"); });
        scope.join();
        IO.println(ok.state() + " " + ok.get());
        IO.println(bad.state() + " " + bad.exception().getMessage());
    }
}`,
      output: 'SUCCESS fine\nFAILED broken' },
    { name: 'allSuccessfulOrThrow', owner: 'Joiner', title: 'Joiner.allSuccessfulOrThrow', sig: 'static <T> StructuredTaskScope.Joiner<T, Stream<Subtask<T>>> allSuccessfulOrThrow()', since: '25', preview: true, see: ['lesson:sc-joiners'],
      summary: 'Every subtask must succeed: `join()` returns a stream of the subtasks, in fork order; the first failure cancels the rest and `join()` throws `FailedException`. (Java 26 makes it return a `List` of results.)',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>allSuccessfulOrThrow())) {
        for (int i = 1; i <= 3; i++) {
            int n = i;
            scope.fork(() -> n * n);
        }
        IO.println(scope.join().map(StructuredTaskScope.Subtask::get).toList());
    }
}`,
      output: '[1, 4, 9]' },
    { name: 'anySuccessfulResultOrThrow', owner: 'Joiner', title: 'Joiner.anySuccessfulResultOrThrow', sig: 'static <T> StructuredTaskScope.Joiner<T, T> anySuccessfulResultOrThrow()', since: '25', preview: true, see: ['lesson:sc-joiners'],
      summary: 'A race: the first subtask to succeed wins, the others are cancelled, and `join()` returns the winner\'s result; it throws only if all fail. (Renamed `anySuccessfulOrThrow` in Java 26.)',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>anySuccessfulResultOrThrow())) {
        scope.fork(() -> { Thread.sleep(500); return "slow mirror"; });
        scope.fork(() -> "fast mirror");
        IO.println(scope.join());
    }
}`,
      output: 'fast mirror' },
    { name: 'awaitAll', owner: 'Joiner', title: 'Joiner.awaitAll', sig: 'static <T> StructuredTaskScope.Joiner<T, Void> awaitAll()\nstatic <T> StructuredTaskScope.Joiner<T, Void> awaitAllSuccessfulOrThrow()', since: '25', preview: true, covers: ['awaitAllSuccessfulOrThrow'], see: ['lesson:sc-joiners'],
      summary: '`awaitAll` waits for every subtask whatever happens and never throws (read each subtask\'s state); `awaitAllSuccessfulOrThrow`, the default of `open()`, cancels the rest at the first failure. (`awaitAll` is removed in Java 27.)',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<Integer>awaitAll())) {
        var a = scope.fork(() -> 1);
        var b = scope.fork(() -> { throw new IllegalStateException(); });
        IO.println("join: " + scope.join() + ", " + a.state() + " and " + b.state());
    }
}`,
      output: 'join: null, SUCCESS and FAILED' },
    { name: 'withTimeout', receiver: ['Configuration'], title: 'Configuration.withTimeout', sig: 'StructuredTaskScope.Configuration withTimeout(Duration timeout)\n// also withName(String), withThreadFactory(ThreadFactory)', since: '25', preview: true, covers: ['withName', 'withThreadFactory'], see: ['lesson:sc-timeouts'],
      summary: 'One deadline for the whole scope: when it passes, the unfinished subtasks are cancelled and `join()` throws `StructuredTaskScope.TimeoutException`.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open(StructuredTaskScope.Joiner.<String>allSuccessfulOrThrow(),
            config -> config.withTimeout(Duration.ofMillis(100)))) {
        scope.fork(() -> { Thread.sleep(5_000); return "late"; });
        scope.join();
    } catch (StructuredTaskScope.TimeoutException e) {
        IO.println("deadline passed: " + e.getClass().getSimpleName());
    }
}`,
      output: 'deadline passed: TimeoutException' },
    { name: 'FailedException', title: 'StructuredTaskScope.FailedException', sig: 'public static final class StructuredTaskScope.FailedException extends RuntimeException', since: '25', preview: true, see: ['lesson:sc-failure'],
      summary: 'What `join()` throws when the joiner gives up because a subtask failed; `getCause()` is the subtask\'s exception. By then the other subtasks have been interrupted.',
      example: `void main() throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {
        scope.fork(() -> { throw new IllegalStateException("payment declined"); });
        scope.join();
    } catch (StructuredTaskScope.FailedException e) {
        IO.println("FailedException, cause: " + e.getCause().getMessage());
    }
}`,
      output: 'FailedException, cause: payment declined' }
  ]);

  /* ---------------------------------------------------------------- scoped values and friends */
  var SV = ['ScopedValue'];
  add('scoped', API + 'java/lang/ScopedValue.html', [
    { name: 'newInstance', owner: 'ScopedValue', sig: 'static <T> ScopedValue<T> newInstance()', since: '25', see: ['lesson:sv-basics'],
      summary: 'A new key, usually a `static final` field. It holds nothing itself: values are bound to it for the length of a call with `where`. Final in Java 25 (a preview from 21 to 24).',
      example: `static final ScopedValue<String> TENANT = ScopedValue.newInstance();

void main() {
    IO.println("bound outside a binding: " + TENANT.isBound());
}`,
      output: 'bound outside a binding: false' },
    { name: 'where', owner: 'ScopedValue', sig: 'static <T> ScopedValue.Carrier where(ScopedValue<T> key, T value)\n// Carrier: run(Runnable), call(CallableOp), where(key, value)', since: '25', covers: ['run', 'call'], see: ['lesson:sv-basics', 'lesson:sv-rebinding'],
      summary: 'Binds a value to a key for one call: `where(KEY, v).run(op)` or `.call(op)`. Code inside reads it; the binding ends with the call, however it ends. A nested `where` hides the outer value only inside itself.',
      example: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void show() { IO.println("user: " + USER.get()); }

void main() {
    ScopedValue.where(USER, "asha").run(() -> {
        show();
        ScopedValue.where(USER, "admin").run(this::show);
        show();
    });
}`,
      output: 'user: asha\nuser: admin\nuser: asha' },
    { name: 'get', key: 'scoped-value-get', receiver: SV, title: 'ScopedValue.get', sig: 'T get()\nboolean isBound()\nT orElse(T other)\n<X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X', since: '25', covers: ['isBound', 'orElse', 'orElseThrow'], see: ['lesson:sv-basics'],
      summary: 'The value bound in this call, or `NoSuchElementException` when none is. `isBound()` asks; `orElse(default)` gives a default (in Java 25 the default may not be `null`).',
      example: `static final ScopedValue<String> USER = ScopedValue.newInstance();

void main() {
    IO.println(USER.orElse("guest"));
    try {
        USER.get();
    } catch (NoSuchElementException e) {
        IO.println(e.getMessage());
    }
}`,
      output: 'guest\nScopedValue not bound' },
    { name: 'ThreadLocal', sig: 'public class ThreadLocal<T>\nstatic <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier)   // since 1.8\nT get(), void set(T value), void remove()', since: '1.2', covers: ['withInitial', 'set', 'remove'], see: ['lesson:th-publication', 'lesson:vt-threadlocals'],
      docs: API + 'java/lang/ThreadLocal.html',
      summary: 'A variable with a separate value for each thread. A pooled thread keeps its value from one task to the next unless you `remove()` it; for context passed down a call, `ScopedValue` is the safer tool.',
      example: `static final ThreadLocal<StringBuilder> BUFFER = ThreadLocal.withInitial(StringBuilder::new);

void main() throws InterruptedException {
    BUFFER.get().append("main's");
    Thread other = Thread.ofPlatform().start(() -> IO.println("other thread sees: [" + BUFFER.get() + "]"));
    other.join();
    IO.println("main sees: [" + BUFFER.get() + "]");
    BUFFER.remove();
}`,
      output: 'other thread sees: []\nmain sees: [main\'s]' },
    { name: 'of', key: 'stable-value-of', owner: 'StableValue', title: 'StableValue.of', sig: 'static <T> StableValue<T> of()\nT orElseSet(Supplier<? extends T> supplier)', since: '25', preview: true, covers: ['orElseSet'], see: ['lesson:sv-lazy-init'],
      docs: API + 'java/lang/StableValue.html',
      summary: 'A holder set at most once: `orElseSet(supplier)` runs the supplier the first time (once, even when many threads ask at once) and returns the same value ever after. A preview in Java 25, renamed `LazyConstant` in 26.',
      example: `private final StableValue<String> holder = StableValue.of();
private int loads;

String config() {
    return holder.orElseSet(() -> { loads++; return "loaded"; });
}

void main() {
    config();
    config();
    IO.println(config() + " " + loads + " time");
}`,
      output: 'loaded 1 time' },
    { name: 'mapConcurrent', owner: 'Gatherers', title: 'Gatherers.mapConcurrent', sig: 'static <T, R> Gatherer<T, ?, R> mapConcurrent(int maxConcurrency, Function<? super T, ? extends R> mapper)', since: '24', see: ['lesson:sv-map-concurrent'],
      docs: API + 'java/util/stream/Gatherers.html',
      summary: 'Runs `mapper` on virtual threads, at most `maxConcurrency` at once, and keeps the stream\'s order: blocking calls in a stream with a bound. A failure is rethrown and the rest cancelled.',
      example: `String fetch(int id) {
    try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    return "page " + id;
}

void main() {
    IO.println(Stream.of(3, 1, 2).gather(Gatherers.mapConcurrent(2, this::fetch)).toList());
}`,
      output: '[page 3, page 1, page 2]' }
  ]);
})(window.JCLT);
