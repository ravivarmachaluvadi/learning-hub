/*
 * data/templates.js - starting points for the Playground's "Templates…" menu.
 *
 * Template shape: {id, title, code (a whole program), stdin?}. tests/test_content.py runs each one.
 */
(function (U) {
  'use strict';
  U.data.templates = [
    { id: 'hello-input', title: 'Hello, with input', stdin: 'Ravi\n3\n', code: `void main() {
    String name = IO.readln("Your name: ");
    int workers = Integer.parseInt(IO.readln("How many workers? "));
    IO.println("Hello, " + name + "! Starting " + workers + " virtual threads.");
    for (int i = 1; i <= workers; i++) {
        int n = i;
        try {
            Thread.ofVirtual().name("worker-" + n).start(() -> IO.println(Thread.currentThread().getName() + " says hi")).join();
        } catch (InterruptedException e) {
            return;
        }
    }
}
` },
    { id: 'fan-out', title: 'Fan out on virtual threads', code: `// Three slow calls at once, each on a virtual thread: the whole takes as long as the slowest.
String call(String service, int millis) throws InterruptedException {
    Thread.sleep(millis);
    return service + " answered";
}

void main() throws Exception {
    long start = System.nanoTime();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        Future<String> user = executor.submit(() -> call("users", 300));
        Future<String> orders = executor.submit(() -> call("orders", 200));
        Future<String> prices = executor.submit(() -> call("prices", 100));
        IO.println(user.get() + ", " + orders.get() + ", " + prices.get());
    }
    IO.println("took about " + (System.nanoTime() - start) / 1_000_000 + " ms, not 600");
}
` },
    { id: 'semaphore-limit', title: 'Limit calls with a Semaphore', code: `void main() throws Exception {
    var permits = new Semaphore(3);
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 30; i++) {
            executor.submit(() -> {
                permits.acquire();
                try {
                    most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    Thread.sleep(100);
                    inFlight.decrementAndGet();
                } finally {
                    permits.release();
                }
                return null;
            });
        }
    }
    IO.println("30 virtual threads, at most " + most.get() + " in the guarded call at once");
}
` },
    { id: 'one-carrier', title: 'Many virtual threads on one carrier', code: `void main() throws Exception {
    // one carrier: must come first
    System.setProperty("jdk.virtualThreadScheduler.parallelism", "1");
    // and never a second one
    System.setProperty("jdk.virtualThreadScheduler.maxPoolSize", "1");
    var inFlight = new AtomicInteger();
    var most = new AtomicInteger();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 10_000; i++) {
            executor.submit(() -> {
                most.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                Thread.sleep(1_000);
                inFlight.decrementAndGet();
                return null;
            });
        }
    }
    IO.println("10,000 virtual threads, " + most.get() + " sleeping at once, on one carrier");
}
` },
    { id: 'pinning-check', title: 'Does it pin? (JFR)', code: `import jdk.jfr.consumer.RecordingStream;

static class Slow {
    static final String VALUE;
    static {
        // try moving this sleep elsewhere
        try { Thread.sleep(100); } catch (InterruptedException e) { }
        VALUE = "ready";
    }
}

void main() throws Exception {
    var pinned = new AtomicInteger();
    try (var stream = new RecordingStream()) {
        stream.enable("jdk.VirtualThreadPinned").withThreshold(Duration.ofMillis(10));
        stream.onEvent("jdk.VirtualThreadPinned", e -> {
            pinned.incrementAndGet();
            IO.println("pinned: " + e.getString("pinnedReason"));
        });
        stream.startAsync();
        Thread.ofVirtual().start(() -> IO.println("value: " + Slow.VALUE)).join();
        // give JFR time to deliver the events
        Thread.sleep(1_500);
    }
    IO.println("pinned events: " + pinned.get());
}
` },
    { id: 'thread-dump', title: 'Dump your own threads', code: `import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

void main() throws Exception {
    var gate = new CountDownLatch(1);
    try (var executor = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("request-", 1).factory())) {
        for (int i = 0; i < 3; i++) executor.submit(() -> { gate.await(); return null; });
        Thread.sleep(200);
        Path file = Files.createTempFile("threads", ".txt");
        Files.delete(file);
        ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class)
            .dumpThreads(file.toString(), HotSpotDiagnosticMXBean.ThreadDumpFormat.TEXT_PLAIN);
        Files.readAllLines(file).forEach(IO::println);
        Files.delete(file);
        gate.countDown();
    }
}
` }
  ];
})(window.JCLT);
