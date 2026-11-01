/*
 * data/lessons-spring.js - Track 6, Spring and production: lessons 1 to 5 (batch 4). Lessons 6 to 10 are in
 * data/lessons-spring2.js. The lesson shape is described at the top of data/lessons-virtual-threads.js.
 *
 * These programs run on real Spring Boot 4.1.2: jclearn.py puts it on the class path of any program that names
 * org.springframework, on this PC only (loopback), on a free port, with errors-only logging.
 * A compact source file has no package and cannot name its own class (Main.class does not compile), so an app
 * here is a nested class with @EnableAutoConfiguration and @Import; at work it is @SpringBootApplication in a
 * package. Each program closes its app (try-with-resources), and a request is made with a real HTTP client.
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

  /* ---------------------------------------------------------------- 1 */
  L.push({
    id: 'sp-virtual', track: 'spring', title: 'spring.threads.virtual.enabled: what it switches',
    summary: 'One property moves Tomcat\'s requests, @Async and @Scheduled onto virtual threads. What it switches, what it leaves alone, which of your settings it silently ignores, and how it can make your JVM exit.',
    keywords: ['spring.threads.virtual.enabled', 'spring boot', 'tomcat', 'virtual threads in spring', 'applicationTaskExecutor', 'SimpleAsyncTaskExecutor', 'keep-alive', 'spring.main.keep-alive', 'server.tomcat.threads.max', 'daemon'],
    docs: BOOT + 'features/spring-application.html#features.spring-application.virtual-threads', docsLabel: 'Spring Boot: virtual threads', lab: '18-java-virtual-threads',
    body: [
      '## One property',
      'Everything so far ran on Java alone. From here on these programs start a **real Spring Boot 4.1.2 application** on your PC: Tomcat, Spring MVC, the lot. Spring Boot moves its own threads to virtual threads with one line (Java 21 or later; the docs strongly recommend 24 or later, for [[lesson:vt-pinning|the end of `synchronized` pinning]]):',
      props('spring.threads.virtual.enabled=true'),
      'Here it is, measured: one app with a controller, an `@Async` method and a `@Scheduled` method, started both ways.',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

static String kind() { return Thread.currentThread().isVirtual() ? "virtual" : "platform"; }

@Component
static class Worker {
    final CompletableFuture<String> scheduled = new CompletableFuture<>();
    @Async CompletableFuture<String> run() { return CompletableFuture.completedFuture(kind()); }
    @Scheduled(fixedDelay = 60_000) void tick() { scheduled.complete(kind()); }
    String lastTick() throws Exception { return scheduled.get(); }
}

@RestController
static class Web {
    final Worker worker;
    Web(Worker worker) { this.worker = worker; }
    @GetMapping("/request") String request() { return kind(); }
    @GetMapping("/async") String async() throws Exception { return worker.run().get(); }
    @GetMapping("/scheduled") String scheduled() throws Exception { return worker.lastTick(); }
}

@EnableAutoConfiguration
@EnableAsync
@EnableScheduling
@Import({ Web.class, Worker.class })
static class App { }

void show(String on) {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=" + on)) {
        int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
        var http = RestClient.create("http://localhost:" + port);
        IO.println("enabled=" + on);
        for (String path : List.of("/request", "/async", "/scheduled")) {
            IO.println("  " + path + ": " + http.get().uri(path).retrieve().body(String.class));
        }
        IO.println("  @Async runs on " + ctx.getBean("applicationTaskExecutor").getClass().getSimpleName());
        IO.println("  @Scheduled runs on " + ctx.getBean("taskScheduler").getClass().getSimpleName());
    }
}

void main() {
    show("false");
    show("true");
}`),
      out(`enabled=false
  /request: platform
  /async: platform
  /scheduled: platform
  @Async runs on ThreadPoolTaskExecutor
  @Scheduled runs on ThreadPoolTaskScheduler
enabled=true
  /request: virtual
  /async: virtual
  /scheduled: virtual
  @Async runs on SimpleAsyncTaskExecutor
  @Scheduled runs on SimpleAsyncTaskScheduler`),
      'See the [[explain:throughput|throughput simulator]] for what that does to load, and the **[Spring map](#/spring)** for every feature\'s thread, both ways.',
      '## What it does not switch',
      'It changes the threads **Spring owns**. Yours stay yours: `@PostConstruct` and `ApplicationRunner` still run on `main`; `CompletableFuture.supplyAsync` with no executor still runs on the common pool ([[lesson:juc-completable]]), and so does a parallel stream; a `newFixedThreadPool` of your own is still a pool of platform threads.',
      '## The settings it silently ignores',
      'With it on, these have no effect, and nothing warns you. Each one\'s own description, in the jar, says "Doesn\'t have an effect if virtual threads are enabled":',
      '| Property | Default | Why it mattered |\n|---|---|---|\n| `server.tomcat.threads.max` | 200 | the most requests at once |\n| `server.tomcat.threads.min-spare` | 10 | threads kept ready |\n| `spring.task.execution.pool.core-size` | 8 | `@Async` threads |\n| `spring.task.execution.pool.max-size`, `queue-capacity` | none set | how far `@Async` grows |\n| `spring.task.scheduling.pool.size` | 1 | `@Scheduled` threads |',
      'So here is the same app under load with Tomcat capped at 10 threads. Thirty requests each wait until all thirty are inside the handler, or until it gives up:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.*;

static final AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();
static volatile CountDownLatch thirty;

@RestController
static class Web {
    @GetMapping("/slow") String slow() throws Exception {
        peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
        thirty.countDown();
        thirty.await(400, TimeUnit.MILLISECONDS);
        inFlight.decrementAndGet();
        return "ok";
    }
}

@EnableAutoConfiguration
@Import(Web.class)
static class App { }

void load(String virtual) throws Exception {
    peak.set(0);
    thirty = new CountDownLatch(30);
    try (var ctx = SpringApplication.run(App.class, "--server.tomcat.threads.max=10", "--spring.threads.virtual.enabled=" + virtual)) {
        int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
        var http = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/slow")).build();
        try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 30; i++) {
                clients.submit(() -> http.send(request, HttpResponse.BodyHandlers.ofString()));
            }
        }
        IO.println("virtual " + virtual + ": at most 10 at once: " + (peak.get() <= 10) + ", all 30 at once: " + (peak.get() == 30));
    }
}

void main() throws Exception {
    load("false");
    load("true");
}`),
      out(`virtual false: at most 10 at once: true, all 30 at once: false
virtual true: at most 10 at once: false, all 30 at once: true`),
      'That is the gain, and a warning: `threads.max` used to be **a limit on how much your service did to everything behind it**. [[lesson:sp-db-pool]] and [[lesson:sp-migrate]] are about what happens when it silently goes.',
      '## The trap: your JVM can exit',
      'Virtual threads are always daemon threads ([[lesson:vt-create]]), and a JVM exits when only daemon threads are left. Tomcat keeps one ordinary thread, so a web app is safe. An app with **no web server**, whose only work is a `@Scheduled` job, is not. Measured on this PC, with `main` returning after `run()` (outside this tool, which ends each program itself):',
      '| Settings | What the JVM did |\n|---|---|\n| no web server, `enabled=false` | stayed up; the job kept ticking |\n| no web server, `enabled=true` | **exited after 1.6 s, having ticked once, exit code 0** |\n| no web server, `enabled=true`, `spring.main.keep-alive=true` | stayed up |\n| Tomcat, `enabled=true` | stayed up |',
      props(`spring.threads.virtual.enabled=true
# for an app with no web server: a worker, a scheduler, a queue consumer
spring.main.keep-alive=true`)
    ].join('\n\n'),
    work: [
      '**In a real service,** this one line is the whole switch, but it is not the whole migration: [[lesson:sp-migrate]] is the checklist. Turn it on behind a config flag in one environment first, so turning it off is a deploy, not a rewrite.',
      '**A worker that exits with code 0 looks healthy.** Kubernetes restarts it, it ticks once, and it exits again; the logs show a clean shutdown and no error. If a batch worker starts "restarting for no reason" just after a Spring upgrade, check for this first.',
      '**Which Java.** Spring Boot accepts Java 21, but on 21 a `synchronized` block around a blocking call pins its carrier ([[lesson:vt-pinning]]). The docs strongly recommend 24 or later for this reason.'
    ].join('\n\n'),
    example: {
      code: `// Change the thread name prefix, and turn virtual threads off and on: what do the names become?
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Worker {
    @Async CompletableFuture<String> where() { return CompletableFuture.completedFuture(Thread.currentThread().toString()); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Worker.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none",
            "--spring.threads.virtual.enabled=true", "--spring.task.execution.thread-name-prefix=mail-")) {
        IO.println(ctx.getBean(Worker.class).where().get());
    }
}`,
      note: 'The thread\'s name comes from the prefix; after the slash is the carrier it was mounted on.'
    },
    challenge: {
      title: 'A worker that stays up',
      task: 'A background worker has no web server, runs on virtual threads, and its threads should be easy to spot in a dump.\n\nWrite `settings()`: the command-line arguments that make:\n\n1. requests, `@Async` and `@Scheduled` run on virtual threads;\n2. `@Async` threads named `work-1`, `work-2`…;\n3. the JVM stay up when only virtual threads are left.\n\nThe checks start the app in `ThreadApp.java` with your arguments. Each argument is written `--name=value`.',
      files: [{ name: 'ThreadApp.java', code: `import java.util.*;
import java.util.concurrent.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;

/** The app the checks start, with your arguments. It reports what really happened, once. */
public class ThreadApp {
    static String where() {
        Thread t = Thread.currentThread();
        return (t.isVirtual() ? "virtual " : "platform ") + t.getName();
    }

    @Component
    public static class Worker {
        final CompletableFuture<String> tick = new CompletableFuture<>();
        @Async public CompletableFuture<String> run() { return CompletableFuture.completedFuture(where()); }
        @Scheduled(fixedDelay = 60_000) public void tick() { tick.complete(where()); }
        public String lastTick() throws Exception { return tick.get(10, TimeUnit.SECONDS); }
    }

    @RestController
    public static class Web {
        @GetMapping("/where") public String request() { return where(); }
    }

    @EnableAutoConfiguration
    @EnableAsync
    @EnableScheduling
    @Import({ Web.class, Worker.class })
    public static class App { }

    private static Map<String, String> found;

    public static synchronized Map<String, String> report(String[] args) throws Exception {
        if (found != null) return found;
        try (var ctx = SpringApplication.run(App.class, args)) {
            var map = new HashMap<String, String>();
            var worker = ctx.getBean(Worker.class);
            int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
            map.put("request", RestClient.create("http://localhost:" + port).get().uri("/where").retrieve().body(String.class));
            map.put("async", worker.run().get());
            map.put("scheduled", worker.lastTick());
            map.put("keepAlive", String.valueOf(ctx.getEnvironment().getProperty("spring.main.keep-alive")));
            found = map;
            return map;
        }
    }
}
` }],
      starter: `// The arguments to start the worker with: each one is "--name=value".
String[] settings() {
    return new String[] { };
}

void main() {
    IO.println(String.join(" ", settings()));
}`,
      solution: `String[] settings() {
    return new String[] {
        "--spring.threads.virtual.enabled=true",
        "--spring.task.execution.thread-name-prefix=work-",
        "--spring.main.keep-alive=true"
    };
}

void main() {
    IO.println(String.join(" ", settings()));
}`,
      hints: [
        'The property that moves Spring\'s threads is in this lesson\'s first box.',
        'The name prefix is `spring.task.execution.thread-name-prefix`. Its value includes the dash: `work-`.',
        '`spring.main.keep-alive=true` keeps the JVM up when only daemon threads are left.'
      ],
      checks: [
        { label: 'a request runs on a virtual thread', code: `String[] args = c.call("settings");
c.ok(ThreadApp.report(args).get("request").startsWith("virtual"), "a request ran on: " + ThreadApp.report(args).get("request"));` },
        { label: '@Async runs on a virtual thread', code: `String[] args = c.call("settings");
c.ok(ThreadApp.report(args).get("async").startsWith("virtual"), "@Async ran on: " + ThreadApp.report(args).get("async"));` },
        { label: '@Scheduled runs on a virtual thread', code: `String[] args = c.call("settings");
c.ok(ThreadApp.report(args).get("scheduled").startsWith("virtual"), "@Scheduled ran on: " + ThreadApp.report(args).get("scheduled"));` },
        { label: '@Async threads are named work-1, work-2…', code: `String[] args = c.call("settings");
c.ok(ThreadApp.report(args).get("async").endsWith(" work-1"), "the @Async thread: " + ThreadApp.report(args).get("async"));` },
        { label: 'the JVM stays up when only virtual threads are left', code: `String[] args = c.call("settings");
c.eq(ThreadApp.report(args).get("keepAlive"), "true");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 2 */
  L.push({
    id: 'sp-async', track: 'spring', title: '@Async: the proxy, and what it hides',
    summary: 'An @Async method runs on another thread only when called through Spring\'s proxy. Why calling it from its own class does nothing, why its fields read null, where a void method\'s exception goes, and how to limit one on virtual threads.',
    keywords: ['@Async', 'EnableAsync', 'proxy', 'CGLIB', 'self-invocation', 'AsyncUncaughtExceptionHandler', 'concurrency-limit', 'SimpleAsyncTaskExecutor', 'fire and forget', 'CompletableFuture'],
    docs: FW + 'integration/scheduling.html#scheduling-annotation-support-async', docsLabel: 'Spring: @Async', lab: '16-java-multithreading',
    body: [
      '## A proxy does the work',
      '`@Async` puts nothing into your method. Spring makes a **subclass of your bean at run time**, a proxy, and gives that to everyone who asks for the bean. The proxy\'s version of the method hands your real method to the task executor and returns. Three things follow, and each surprises someone in production. This program shows all three:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

static String where() { return Thread.currentThread().isVirtual() ? "a new virtual thread" : "the caller's thread"; }

@Component
static class Mail {
    final AtomicInteger sent = new AtomicInteger(7);
    @Async CompletableFuture<String> send() { return CompletableFuture.completedFuture(where()); }
    CompletableFuture<String> sendViaThis() { return send(); }
    int sentCount() { return sent.get(); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Mail.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        var mail = ctx.getBean(Mail.class);
        IO.println("is the bean really a Mail? " + (mail.getClass() == Mail.class));
        IO.println("through the bean, send() ran on " + mail.send().get());
        IO.println("from its own class, send() ran on " + mail.sendViaThis().get());
        IO.println("the field, through a method: " + mail.sentCount());
        IO.println("the field, read directly: " + mail.sent);
    }
}`),
      out(`is the bean really a Mail? false
through the bean, send() ran on a new virtual thread
from its own class, send() ran on the caller's thread
the field, through a method: 7
the field, read directly: null`),
      '| What happened | Why | What to do |\n|---|---|---|\n| Calling `send()` from inside `Mail` ran on the caller | `this` is the real object, not the proxy: **self-invocation** skips the proxy | call it from another bean |\n| `mail.sent` is `null` | the proxy is a subclass made without running your constructor, and only its **methods** forward to the real object | never read a bean\'s field from outside |\n| It is not really a `Mail` | `getClass()` is `Main$Mail$$SpringCGLIB$$0` | never compare a bean\'s class |',
      'The same proxy gives you `@Transactional`, `@Retryable` and `@Cacheable`, with the same three rules.',
      '## Where a failure goes',
      'A method that returns a future hands its exception to whoever holds the future. A `void` method has nobody to hand it to: Spring logs it and **the caller never hears**.',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Mail {
    @Async public void fireAndForget() { throw new IllegalStateException("smtp down"); }
    @Async public CompletableFuture<String> withFuture() { throw new IllegalStateException("smtp down"); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Mail.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--logging.level.root=OFF")) {
        var mail = ctx.getBean(Mail.class);
        mail.fireAndForget();
        IO.println("void: the caller carries on, knowing nothing");
        try {
            mail.withFuture().get();
        } catch (ExecutionException e) {
            IO.println("future: " + e.getCause().getMessage());
        }
    }
}`),
      out(`void: the caller carries on, knowing nothing
future: smtp down`),
      'To hear `void` failures, implement `AsyncConfigurer.getAsyncUncaughtExceptionHandler()`. Better: return `CompletableFuture<Void>`, so a caller **can** wait.',
      '## No pool, so no limit',
      'On platform threads the `@Async` pool limited how many ran at once. On virtual threads there is a new thread per call and no limit. If the work needs one (it calls something that can only take so much), Boot has a property, and extra calls **wait**, they are not rejected:',
      props('spring.task.execution.simple.concurrency-limit=20'),
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Report {
    private final AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();
    @Async public CompletableFuture<Void> build() throws InterruptedException {
        peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
        Thread.sleep(50);
        inFlight.decrementAndGet();
        return CompletableFuture.completedFuture(null);
    }
    public int peak() { return peak.get(); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Report.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true",
            "--spring.task.execution.simple.concurrency-limit=2")) {
        var report = ctx.getBean(Report.class);
        var all = new ArrayList<CompletableFuture<Void>>();
        for (int i = 0; i < 6; i++) all.add(report.build());
        CompletableFuture.allOf(all.toArray(CompletableFuture[]::new)).get();
        IO.println("6 calls, a limit of 2: at most 2 at once: " + (report.peak() <= 2));
    }
}`),
      out('6 calls, a limit of 2: at most 2 at once: true')
    ].join('\n\n'),
    work: [
      '**"I added @Async and nothing got faster."** Nine times in ten it is self-invocation, or a missing `@EnableAsync`. Log `Thread.currentThread()` in the method to see.',
      '**A lost email.** A `void` `@Async` method in a request fails at 3 a.m.; the request returned 200 long ago, and the only trace is one log line nobody alerts on. Return a future if anyone cares, or send the work to a real queue if it must not be lost: a JVM restart loses every `@Async` call still running.',
      '**The context does not come along.** The new thread has no transaction, no security context and no MDC: [[lesson:sp-context]].'
    ].join('\n\n'),
    example: {
      code: `// Remove @EnableAsync: what changes? Then call send() from main through the bean, then from sendViaThis().
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

@Component
static class Mail {
    @Async CompletableFuture<String> send() { return CompletableFuture.completedFuture(Thread.currentThread().toString()); }
    CompletableFuture<String> sendViaThis() { return send(); }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Mail.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        var mail = ctx.getBean(Mail.class);
        IO.println(mail.getClass().getName());
        IO.println(mail.send().get());
        IO.println(mail.sendViaThis().get());
    }
}`,
      note: 'With @EnableAsync gone there is no proxy: the class name is plain, and every call runs on main.'
    },
    challenge: {
      title: 'Send them all, and hear about failures',
      task: '`Mailer.send(address)` (in `Mailer.java`) is an `@Async` method on a real Spring bean: each call returns a `CompletableFuture<String>` at once.\n\nWrite `sendAll(mailer, addresses)`: send to every address **at the same time**, wait for all of them, and return the receipts **in the order of the addresses**. If a send fails, its exception must reach the caller of `sendAll`.',
      files: [{ name: 'Mailer.java', code: `import java.util.concurrent.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;

/** A real @Async bean. Mailer.start(probe) starts the app and gives you the bean (the proxy). */
@Component
public class Mailer {
    private static volatile jclt.Probe probe;

    @Async
    public CompletableFuture<String> send(String address) throws InterruptedException {
        if (address.equals("bad")) throw new IllegalStateException("no such address: bad");
        probe.meet();
        return CompletableFuture.completedFuture("sent " + address);
    }

    private static ConfigurableApplicationContext ctx;

    public static synchronized Mailer start(jclt.Probe p) {
        probe = p;
        if (ctx == null) ctx = SpringApplication.run(MailerApp.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true");
        return ctx.getBean(Mailer.class);
    }
}

@EnableAutoConfiguration
@EnableAsync
@Import(Mailer.class)
class MailerApp { }
` }],
      starter: `// Send to every address at the same time; return the receipts in order; a failure reaches the caller.
List<String> sendAll(Mailer mailer, List<String> addresses) throws Exception {
    throw new UnsupportedOperationException("Not written yet");
}

void main() {
    IO.println("the checks start the app and call sendAll");
}`,
      solution: `List<String> sendAll(Mailer mailer, List<String> addresses) throws Exception {
    var sending = new ArrayList<CompletableFuture<String>>();
    for (String address : addresses) {
        sending.add(mailer.send(address));
    }
    var receipts = new ArrayList<String>();
    for (var f : sending) {
        receipts.add(f.join());
    }
    return receipts;
}

void main() {
    IO.println("the checks start the app and call sendAll");
}`,
      hints: [
        'First a loop that only **starts** the sends and keeps the futures. Do not wait inside it, or they run one at a time.',
        'Then a second loop that waits for each future, in order, with `join()`.',
        'Do not catch anything: `join()` throws a `CompletionException` holding the failure, which is what the caller should get.'
      ],
      checks: [
        { label: 'the receipts come back in the order of the addresses', code: `Mailer mailer = Mailer.start(c.probe(1));
c.eq(c.call("sendAll", mailer, List.of("a", "b", "c")), List.of("sent a", "sent b", "sent c"));` },
        { label: 'the sends run at the same time', code: `var probe = c.probe(3);
Mailer mailer = Mailer.start(probe);
c.call("sendAll", mailer, List.of("a", "b", "c"));
c.ok(probe.peak() == 3, "at most " + probe.peak() + " sends at once: are you waiting for each one before starting the next?");` },
        { label: 'each send runs on a virtual thread', code: `var probe = c.probe(2);
Mailer mailer = Mailer.start(probe);
c.call("sendAll", mailer, List.of("a", "b"));
c.ok(probe.allVirtual(), probe.platformCalls() + " sends ran on a platform thread");` },
        { label: 'a failed send reaches the caller', code: `Mailer mailer = Mailer.start(c.probe(1));
boolean threw = false;
try {
    c.call("sendAll", mailer, List.of("a", "bad"));
} catch (Throwable t) {
    threw = String.valueOf(t).contains("no such address");
}
c.ok(threw, "sendAll returned normally although one send failed");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 3 */
  L.push({
    id: 'sp-mvc', track: 'spring', title: 'Spring MVC or WebFlux, with virtual threads',
    summary: 'Spring MVC gives each request a thread. That was its limit, and it is why WebFlux exists. What Callable and DeferredResult were for, what virtual threads change, and when WebFlux is still the right choice.',
    keywords: ['spring mvc', 'webflux', 'reactive', 'thread per request', 'callable', 'deferredresult', 'servlet', 'tomcat threads', 'accept-count', 'async request', 'mono'],
    docs: FW + 'web/webmvc/mvc-ann-async.html', docsLabel: 'Spring MVC: asynchronous requests', lab: '57-queueing-theory',
    body: [
      '## One request, one thread',
      'Spring MVC runs on servlets: a request takes a thread, your controller runs on it, and it comes back when the response is written. If the controller waits for a database or another service, the thread waits too. So Tomcat\'s 200 threads ([[lesson:sp-virtual]]) are also 200 requests **waiting**, however idle the CPU is. That is Little\'s law again ([[lesson:vt-why]]): at 200 ms a request, 200 threads can serve 1,000 requests a second and no more.',
      'Two answers came before virtual threads.',
      '## Answer 1: hand the wait to another thread',
      'A controller can return a `Callable`. Tomcat\'s thread goes back to the pool at once, the `Callable` runs on `applicationTaskExecutor`, and Tomcat picks up the finished result on another thread. Here Tomcat has **one** thread, and each request waits until a second is in flight, so they can only finish if the first frees the thread:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.*;

static volatile CountDownLatch two;
static final AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();

static String waitForTheOther() throws InterruptedException {
    peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
    two.countDown();
    two.await(400, TimeUnit.MILLISECONDS);
    inFlight.decrementAndGet();
    return "ok";
}

@RestController
static class Web {
    @GetMapping("/plain") String plain() throws Exception { return waitForTheOther(); }
    @GetMapping("/callable") Callable<String> callable() { return () -> waitForTheOther(); }
}

@EnableAutoConfiguration
@Import(Web.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--server.tomcat.threads.max=1")) {
        int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
        var http = HttpClient.newHttpClient();
        for (String path : List.of("/plain", "/callable")) {
            two = new CountDownLatch(2);
            peak.set(0);
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build();
            try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
                for (int i = 0; i < 2; i++) {
                    clients.submit(() -> http.send(request, HttpResponse.BodyHandlers.ofString()));
                }
            }
            IO.println(path + " on one Tomcat thread: " + peak + " in flight at once");
        }
    }
}`),
      out(`/plain on one Tomcat thread: 1 in flight at once
/callable on one Tomcat thread: 2 in flight at once`),
      '`DeferredResult` is the same idea when the answer arrives from elsewhere: a message listener completes it. Both help the servlet thread, and both move the wait to another pool, whose size you must now choose.',
      '## Answer 2: never wait (WebFlux)',
      'WebFlux drops the thread-per-request model: a few event-loop threads, and a controller that returns a `Mono` or `Flux`, a description of work to do when each answer arrives. **Not run here** (it is not on this tool\'s class path), so this is from the docs:',
      norun(`@GetMapping("/page/{id}")
Mono<Page> page(@PathVariable String id) {
    return Mono.zip(prices.get(id), stock.get(id), Page::new)
        .timeout(Duration.ofSeconds(2));
}`),
      'It serves huge numbers of waiting requests on few threads, at a price: every library in the path must be non-blocking (one blocking call on an event loop stalls every request on it), stack traces stop saying who called whom, and `ThreadLocal` context does not work.',
      '## Answer 3: let threads be cheap',
      'With virtual threads the plain, blocking controller waits without holding a platform thread ([[lesson:vt-blocking]]). The same `/plain` above, with `--spring.threads.virtual.enabled=true`, has both in flight: try it in the Example. Stack traces, debuggers, `ThreadLocal` and JDBC work as before.',
      '| | MVC, pool | MVC, `Callable` | MVC, virtual | WebFlux |\n|---|---|---|---|---|\n| Requests waiting at once | 200 | as many as the second pool | as many as memory allows | as many as memory allows |\n| Controller code | plain | wrapped | plain | `Mono` and `Flux` |\n| Stack traces, debugger | whole | split | whole | split into stages |\n| Blocking libraries (JDBC) | fine | fine | fine | must go on another scheduler |\n| Streaming, back pressure | no | no | no | **built in** |',
      '## So which?',
      'Virtual threads answer "my requests mostly wait". **WebFlux still earns its keep** when the response is a stream (server-sent events, a long-lived feed), when you need back pressure from a slow consumer, or when a team already has it working. And neither makes a CPU-bound service faster ([[lesson:vt-cpu-bound]]).'
    ].join('\n\n'),
    work: [
      '**A migration not to do.** Rewriting a working MVC service in WebFlux to survive load is now rarely the first step: try one property and test it. Rewriting a working WebFlux service back to MVC just because virtual threads exist is rarely worth it either.',
      '**The request is not the only queue.** `server.tomcat.accept-count` (default 100) is how many connections wait when every thread is busy. `server.tomcat.max-connections` (8,192) is how many Tomcat holds. On virtual threads, the second becomes your real ceiling.',
      '**`Callable` timeouts.** MVC async requests have their own timeout, `spring.mvc.async.request-timeout`, and hitting it gives a 503. Check it when you migrate.'
    ].join('\n\n'),
    example: {
      code: `// The same two requests on /plain, now with virtual threads. Change "true" to "false".
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.*;

static final CountDownLatch two = new CountDownLatch(2);

@RestController
static class Web {
    @GetMapping("/plain") String plain() throws Exception {
        two.countDown();
        return two.await(400, TimeUnit.MILLISECONDS) ? "both in flight" : "alone";
    }
}

@EnableAutoConfiguration
@Import(Web.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--server.tomcat.threads.max=1", "--spring.threads.virtual.enabled=true")) {
        int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
        var http = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/plain")).build();
        try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
            var a = clients.submit(() -> http.send(request, HttpResponse.BodyHandlers.ofString()).body());
            var b = clients.submit(() -> http.send(request, HttpResponse.BodyHandlers.ofString()).body());
            IO.println(a.get() + ", " + b.get());
        }
    }
}`,
      note: 'With virtual threads, server.tomcat.threads.max=1 is simply ignored.'
    },
    challenge: {
      title: 'A report that frees the request thread',
      task: 'This service runs on a small pool of platform threads, and `/report` waits on something slow. Write the controller in your code, a nested class named `Report`:\n\n- `@RestController static class Report`;\n- `GET /report?id=7` returns `report 7`, as text;\n- it waits for `Slow.fetch()` (in `Slow.java`) **without holding the Tomcat thread**: return a `Callable`.\n\nThe checks start your controller on a Tomcat with one thread.',
      files: [{ name: 'Slow.java', code: `import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;

/** The slow thing your controller waits for, and the host the checks start your controller in. */
public final class Slow {
    private static volatile jclt.Probe probe = new jclt.Probe(1, 100);
    private static final List<String> threads = new CopyOnWriteArrayList<>();

    public static void fetch() throws InterruptedException {
        threads.add(Thread.currentThread().getName());
        probe.meet();
    }

    @EnableAutoConfiguration
    public static class Host { }

    /** Start your controller class, send this many requests at once, and return the bodies. */
    public static List<String> serve(jclt.Probe p, Class<?> controller, String path, int count, String... args) throws Exception {
        probe = p;
        threads.clear();
        var sources = new Class<?>[] { Host.class, controller };
        try (var ctx = SpringApplication.run(sources, args)) {
            int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
            var http = HttpClient.newHttpClient();
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build();
            var bodies = new ArrayList<Future<String>>();
            try (var clients = Executors.newVirtualThreadPerTaskExecutor()) {
                for (int i = 0; i < count; i++) {
                    bodies.add(clients.submit(() -> http.send(request, HttpResponse.BodyHandlers.ofString()).body()));
                }
            }
            var out = new ArrayList<String>();
            for (var f : bodies) out.add(f.get());
            return out;
        }
    }

    public static List<String> threadNames() { return threads; }
}
` }],
      starter: `import org.springframework.web.bind.annotation.*;

// A nested class named Report: GET /report?id=7 returns "report 7", without holding the Tomcat thread.
@RestController
static class Report {
    @GetMapping("/report") String report(@RequestParam String id) throws Exception {
        Slow.fetch();
        return "report " + id;
    }
}

void main() {
    IO.println("the checks start Report on a Tomcat with one thread");
}`,
      solution: `import org.springframework.web.bind.annotation.*;

@RestController
static class Report {
    @GetMapping("/report") Callable<String> report(@RequestParam String id) {
        return () -> {
            Slow.fetch();
            return "report " + id;
        };
    }
}

void main() {
    IO.println("the checks start Report on a Tomcat with one thread");
}`,
      hints: [
        'Change the return type to `Callable<String>`, and return a lambda that does the waiting.',
        'The lambda may throw, as a `Callable` can: no `try` is needed, and the method itself no longer `throws`.',
        'With one Tomcat thread, a controller that blocks can only ever have one request in flight.'
      ],
      checks: [
        { label: 'GET /report?id=7 returns "report 7"', code: `Class<?> cls = Class.forName("Main$Report", true, Thread.currentThread().getContextClassLoader());
c.eq(Slow.serve(c.probe(1), cls, "/report?id=7", 1, "--server.tomcat.threads.max=1"), List.of("report 7"));` },
        { label: 'two requests are in flight at once on one Tomcat thread', code: `Class<?> cls = Class.forName("Main$Report", true, Thread.currentThread().getContextClassLoader());
var probe = c.probe(2, 800);
Slow.serve(probe, cls, "/report?id=1", 2, "--server.tomcat.threads.max=1");
c.ok(probe.peak() == 2, "at most " + probe.peak() + " at once: the request is still holding Tomcat's only thread");` },
        { label: 'the wait runs on the task executor, not on Tomcat', code: `Class<?> cls = Class.forName("Main$Report", true, Thread.currentThread().getContextClassLoader());
Slow.serve(c.probe(1), cls, "/report?id=1", 1, "--server.tomcat.threads.max=1");
c.ok(Slow.threadNames().get(0).startsWith("task-"), "it ran on " + Slow.threadNames().get(0));` },
        { label: 'with virtual threads on, it runs on a virtual thread', code: `Class<?> cls = Class.forName("Main$Report", true, Thread.currentThread().getContextClassLoader());
var probe = c.probe(1);
Slow.serve(probe, cls, "/report?id=1", 1, "--spring.threads.virtual.enabled=true");
c.ok(probe.allVirtual(), "it ran on a platform thread");` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 4 */
  L.push({
    id: 'sp-db-pool', track: 'spring', title: 'The database pool is the real limit',
    summary: 'Virtual threads remove the limit on requests, not the limit on connections. Hikari\'s default of 10, what a full pool looks like, how to size one, and the mistake that wastes it: holding a connection while you wait for something else.',
    keywords: ['hikari', 'hikaricp', 'connection pool', 'database', 'jdbc', 'maximum-pool-size', 'connection-timeout', 'transactional', 'little\'s law', 'CannotGetJdbcConnectionException', 'transaction template'],
    docs: BOOT + 'data/sql.html#data.sql.datasource.connection-pool', docsLabel: 'Spring Boot: connection pools', lab: '57-queueing-theory',
    body: [
      '## The limit moved',
      'A database connection is expensive for the database: a process or thread, memory, locks. So there are few of them, and a pool shares them out. Spring Boot picks HikariCP when it is there. With virtual threads you can now have ten thousand requests in flight, all wanting one of **ten** connections:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.jdbc.core.*;
import com.zaxxer.hikari.*;

@EnableAutoConfiguration
static class App { }

static void pause(long ms) {
    try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
}

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.threads.virtual.enabled=true")) {
        var pool = (HikariDataSource) ctx.getBean(javax.sql.DataSource.class);
        IO.println("the default pool: " + pool.getMaximumPoolSize() + " connections, callers wait " + pool.getConnectionTimeout() / 1000 + " s for one");
        var jdbc = ctx.getBean(JdbcTemplate.class);
        var inUse = new AtomicInteger();
        var peak = new AtomicInteger();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 50; i++) {
                executor.submit(() -> jdbc.execute((java.sql.Connection connection) -> {
                    peak.accumulateAndGet(inUse.incrementAndGet(), Math::max);
                    pause(50);
                    inUse.decrementAndGet();
                    return null;
                }));
            }
        }
        IO.println("50 virtual threads: at most 10 held a connection at once: " + (peak.get() <= 10));
    }
}`),
      out(`the default pool: 10 connections, callers wait 30 s for one
50 virtual threads: at most 10 held a connection at once: true`),
      'The other 40 virtual threads simply wait, cheaply. That is **fine, and it is what you want**: the pool protects the database. See it in the [[explain:throughput|throughput simulator]]: raise the threads as far as you like, and the line stays where the connections put it.',
      '## What a full pool looks like',
      'A caller that cannot get a connection within `connection-timeout` gets an exception. Here the pool has one connection, someone is holding it, and the wait is 200 ms:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.jdbc.core.*;

@EnableAutoConfiguration
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none",
            "--spring.datasource.hikari.maximum-pool-size=1", "--spring.datasource.hikari.connection-timeout=250")) {
        var jdbc = ctx.getBean(JdbcTemplate.class);
        var release = new CountDownLatch(1);
        var holding = new CountDownLatch(1);
        Thread holder = Thread.ofVirtual().start(() -> jdbc.execute((java.sql.Connection connection) -> {
            holding.countDown();
            try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            return null;
        }));
        holding.await();
        try {
            jdbc.queryForObject("select 1", Integer.class);
        } catch (Exception e) {
            IO.println(e.getClass().getSimpleName() + ": " + e.getMessage());
            IO.println("caused by " + e.getCause().getClass().getSimpleName());
            IO.println("it says what was wrong: " + e.getCause().getMessage().contains("total=1, active=1, idle=0"));
        }
        release.countDown();
        holder.join();
    }
}`),
      out(`CannotGetJdbcConnectionException: Failed to obtain JDBC Connection
caused by SQLTransientConnectionException
it says what was wrong: true`),
      'Learn to read that message in production: `total=10, active=10, idle=0, waiting=340` means the pool is the bottleneck.',
      '## How big?',
      'Little\'s law once more: connections needed = requests a second × seconds each one **holds** a connection. At 200 requests a second holding 20 ms each, that is 4. Sized past what the database can really do, a bigger pool only makes it slower; the classic advice (from Hikari\'s own "About Pool Sizing") is that a pool is usually much smaller than people think.',
      '## The mistake: holding a connection while you wait',
      '`@Transactional` takes a connection at the start of the method and gives it back at the end. Call a slow service inside it, and the connection sits idle while you wait, **unavailable to anyone else**:',
      norun(`@Transactional
public void confirm(int orderId) {
    orders.markPaying(orderId);
    payments.charge(orderId);          // 2 seconds, holding a connection and row locks
    orders.markPaid(orderId);
}`),
      'With a pool of 10 and a 2-second call, the whole service does 5 of these a second, however many threads it has. Virtual threads make it worse: there used to be 200 threads to run into this limit gradually; now everything arrives at once. Split it: short transactions, with the slow call between them:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.jdbc.core.*;
import org.springframework.transaction.support.*;

@EnableAutoConfiguration
static class App { }

String charge(JdbcTemplate jdbc) {
    // stands for a slow service that also needs a connection: another thread, so not this transaction's
    return CompletableFuture.supplyAsync(() -> jdbc.queryForObject("select 'charged'", String.class)).join();
}

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none",
            "--spring.datasource.hikari.maximum-pool-size=1", "--spring.datasource.hikari.connection-timeout=250")) {
        var jdbc = ctx.getBean(JdbcTemplate.class);
        var tx = ctx.getBean(TransactionTemplate.class);
        jdbc.execute("create table orders(id int, status varchar(20))");
        jdbc.update("insert into orders values (1, 'new')");

        try {
            tx.executeWithoutResult(s -> {
                jdbc.update("update orders set status = 'paying' where id = 1");
                charge(jdbc);
                jdbc.update("update orders set status = 'paid' where id = 1");
            });
        } catch (CompletionException e) {
            IO.println("inside one transaction: " + e.getCause().getClass().getSimpleName());
        }

        tx.executeWithoutResult(s -> jdbc.update("update orders set status = 'paying' where id = 1"));
        String result = charge(jdbc);
        tx.executeWithoutResult(s -> jdbc.update("update orders set status = 'paid' where id = 1"));
        IO.println("between two transactions: " + result + ", " + jdbc.queryForObject("select status from orders", String.class));
    }
}`),
      out(`inside one transaction: CannotGetJdbcConnectionException
between two transactions: charged, paid`),
      'Splitting means the order can stay `paying` if you crash in the middle: a real state your code must handle (retry, or a sweep job), which is the honest price.'
    ].join('\n\n'),
    work: [
      '**The numbers to watch** are `hikaricp.connections.active`, `.pending` and `.timeout` (Micrometer, once the pool has been used; see [[lesson:sp-observe]]). Pending above zero for long, or any timeout, says the pool is your limit.',
      '**Fail fast.** The default wait is 30 s. Under overload, every request waits 30 s and then fails: a thread pile-up that looks like an outage. A shorter `connection-timeout`, with a 503 and a retry at the edge, is often kinder.',
      '**Many instances.** The pool size is per instance. Twenty instances of 10 are 200 connections on one database; check the database\'s own limit before you scale out. `spring.datasource.connection-fetch=lazy` makes Boot fetch connections only when they are really needed.'
    ].join('\n\n'),
    example: {
      code: `// Change the pool size and the number of threads. Does the peak ever pass the pool size?
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.jdbc.core.*;

@EnableAutoConfiguration
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none", "--spring.datasource.hikari.maximum-pool-size=3")) {
        var jdbc = ctx.getBean(JdbcTemplate.class);
        var inUse = new AtomicInteger();
        var peak = new AtomicInteger();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 20; i++) {
                executor.submit(() -> jdbc.execute((java.sql.Connection connection) -> {
                    peak.accumulateAndGet(inUse.incrementAndGet(), Math::max);
                    try { Thread.sleep(20); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    inUse.decrementAndGet();
                    return null;
                }));
            }
        }
        IO.println("peak connections in use: " + peak);
    }
}`,
      note: 'The real H2 database, in memory: nothing is written to disk.'
    },
    challenge: {
      title: 'Do not hold a connection while you wait',
      task: 'Two methods.\n\n1. `poolFor(requestsPerSecond, holdMs)`: the connections needed, by Little\'s law, **rounded up**.\n2. `confirm(tx, jdbc, payment, id)`: set order `id` to `paying`, **commit**, call `payment.get()` with no transaction open, then set it to `paid` and return the order\'s status. If the payment throws, the exception reaches the caller and the order stays `paying`.\n\nThe starter does everything in one transaction. The pool in the checks has one connection, and the payment needs it.',
      starter: `import org.springframework.jdbc.core.*;
import org.springframework.transaction.support.*;

// Connections needed: requests per second x seconds each holds one, rounded up.
int poolFor(double requestsPerSecond, double holdMs) {
    throw new UnsupportedOperationException("Not written yet");
}

// Commit 'paying', call the payment with no transaction open, then commit 'paid'.
String confirm(TransactionTemplate tx, JdbcTemplate jdbc, Supplier<String> payment, int id) {
    tx.executeWithoutResult(s -> {
        jdbc.update("update orders set status = 'paying' where id = ?", id);
        payment.get();
        jdbc.update("update orders set status = 'paid' where id = ?", id);
    });
    return jdbc.queryForObject("select status from orders where id = ?", String.class, id);
}

void main() {
    IO.println("the checks make the database and call confirm");
}`,
      solution: `import org.springframework.jdbc.core.*;
import org.springframework.transaction.support.*;

int poolFor(double requestsPerSecond, double holdMs) {
    return (int) Math.ceil(requestsPerSecond * holdMs / 1000);
}

String confirm(TransactionTemplate tx, JdbcTemplate jdbc, Supplier<String> payment, int id) {
    tx.executeWithoutResult(s -> jdbc.update("update orders set status = 'paying' where id = ?", id));
    payment.get();
    tx.executeWithoutResult(s -> jdbc.update("update orders set status = 'paid' where id = ?", id));
    return jdbc.queryForObject("select status from orders where id = ?", String.class, id);
}

void main() {
    IO.println("the checks make the database and call confirm");
}`,
      hints: [
        'Little\'s law: requests per second × seconds held. `holdMs / 1000` is the seconds; `Math.ceil` rounds up.',
        'Each `tx.executeWithoutResult(...)` is one transaction: it commits and gives the connection back when its lambda ends.',
        'Use two of them, with `payment.get()` between them, outside both.'
      ],
      checks: [
        { label: 'poolFor(200, 20) is 4', code: `c.eq(c.call("poolFor", 200.0, 20.0), 4);` },
        { label: 'poolFor rounds up: (100, 21) is 3, not 2', code: `c.eq(c.call("poolFor", 100.0, 21.0), 3);` },
        { label: 'the payment can get a connection: confirm holds none while it waits', code: `var cfg = new com.zaxxer.hikari.HikariConfig();
cfg.setJdbcUrl("jdbc:h2:mem:pool" + System.nanoTime() + ";DB_CLOSE_DELAY=-1");
cfg.setMaximumPoolSize(1);
cfg.setConnectionTimeout(250);
try (var ds = new com.zaxxer.hikari.HikariDataSource(cfg)) {
    var jdbc = new org.springframework.jdbc.core.JdbcTemplate(ds);
    var tx = new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds));
    jdbc.execute("create table orders(id int, status varchar(20))");
    jdbc.update("insert into orders values (1, 'new')");
    // another service: another thread, so it needs a connection of its own from this pool of one
    Supplier<String> payment = () -> CompletableFuture.supplyAsync(() -> jdbc.queryForObject("select 'charged'", String.class)).join();
    c.eq(c.call("confirm", tx, jdbc, payment, 1), "paid");
}` },
        { label: 'while the payment runs, others can already see "paying": it was committed', code: `var cfg = new com.zaxxer.hikari.HikariConfig();
cfg.setJdbcUrl("jdbc:h2:mem:seen" + System.nanoTime() + ";DB_CLOSE_DELAY=-1");
cfg.setMaximumPoolSize(2);
cfg.setConnectionTimeout(250);
try (var ds = new com.zaxxer.hikari.HikariDataSource(cfg)) {
    var jdbc = new org.springframework.jdbc.core.JdbcTemplate(ds);
    var tx = new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds));
    jdbc.execute("create table orders(id int, status varchar(20))");
    jdbc.update("insert into orders values (1, 'new')");
    String[] seen = new String[1];
    Supplier<String> payment = () -> {
        try {
            var other = Executors.newVirtualThreadPerTaskExecutor().submit(() -> jdbc.queryForObject("select status from orders where id = 1", String.class));
            seen[0] = other.get();
        } catch (Exception e) {
            seen[0] = String.valueOf(e);
        }
        return "charged";
    };
    c.call("confirm", tx, jdbc, payment, 1);
    c.eq(seen[0], "paying");
}` },
        { label: 'a failed payment reaches the caller, and the order stays "paying"', code: `var cfg = new com.zaxxer.hikari.HikariConfig();
cfg.setJdbcUrl("jdbc:h2:mem:fail" + System.nanoTime() + ";DB_CLOSE_DELAY=-1");
cfg.setMaximumPoolSize(2);
try (var ds = new com.zaxxer.hikari.HikariDataSource(cfg)) {
    var jdbc = new org.springframework.jdbc.core.JdbcTemplate(ds);
    var tx = new org.springframework.transaction.support.TransactionTemplate(new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds));
    jdbc.execute("create table orders(id int, status varchar(20))");
    jdbc.update("insert into orders values (1, 'new')");
    Supplier<String> payment = () -> { throw new IllegalStateException("card declined"); };
    boolean threw = false;
    try {
        c.call("confirm", tx, jdbc, payment, 1);
    } catch (Throwable t) {
        threw = String.valueOf(t).contains("card declined");
    }
    c.ok(threw, "confirm returned normally although the payment failed");
    c.eq(jdbc.queryForObject("select status from orders where id = 1", String.class), "paying");
}` }
      ]
    }
  });

  /* ---------------------------------------------------------------- 5 */
  L.push({
    id: 'sp-context', track: 'spring', title: 'Thread-bound context, when you fork',
    summary: 'Spring keeps the request, the user, the logging context and the transaction in ThreadLocals. Start a thread and all four are gone, silently. What that does, the rollback that does not roll back, and how to carry what can be carried.',
    keywords: ['context propagation', 'threadlocal', 'mdc', 'SecurityContextHolder', 'RequestContextHolder', 'transaction', 'TaskDecorator', 'ContextPropagatingTaskDecorator', 'DelegatingSecurityContextExecutor', 'transaction synchronization', 'trace id'],
    docs: FW + 'data-access/transaction/declarative/tx-decl-explained.html', docsLabel: 'Spring: how @Transactional works', lab: '16-java-multithreading',
    body: [
      '## Four things live on your thread',
      'Spring does not pass the current user down through every method. It keeps these in `ThreadLocal`s ([[lesson:th-publication]]), and that works as long as one request stays on one thread:',
      '| What | Where | If it is lost |\n|---|---|---|\n| The request | `RequestContextHolder` | a request-scoped bean throws |\n| The user | `SecurityContextHolder` | an access check throws or, worse, runs as nobody |\n| The logging context (trace id) | SLF4J\'s `MDC` | log lines lose their trace id |\n| The transaction | `TransactionSynchronizationManager` | **your writes commit on their own** |',
      'Start a thread, by any means, and none of them comes along. The [[explain:spring-context|explainer]] steps through this; here it is measured on a real request:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.context.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;
import org.springframework.web.context.request.*;
import org.slf4j.MDC;

static String seen() {
    var user = SecurityContextHolder.getContext().getAuthentication();
    return "request " + (RequestContextHolder.getRequestAttributes() != null ? "yes" : "NO")
        + ", user " + (user != null ? user.getName() : "NO")
        + ", trace " + (MDC.get("trace") != null ? MDC.get("trace") : "NO");
}

@Component
static class Later {
    @Async public CompletableFuture<String> run() { return CompletableFuture.completedFuture(seen()); }
}

@RestController
static class Web {
    final Later later;
    Web(Later later) { this.later = later; }
    @GetMapping("/orders") String orders() throws Exception {
        MDC.put("trace", "t-1");
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated("ravi", "x", List.of()));
        var report = new StringBuilder("handler:     " + seen() + "\\n");
        report.append("@Async:      ").append(later.run().get()).append("\\n");
        report.append("supplyAsync: ").append(CompletableFuture.supplyAsync(() -> seen()).get()).append("\\n");
        try (var scope = StructuredTaskScope.open()) {
            var forked = scope.fork(() -> seen());
            scope.join();
            report.append("scope fork:  ").append(forked.get()).append("\\n");
        }
        MDC.clear();
        SecurityContextHolder.clearContext();
        return report.toString();
    }
}

@EnableAutoConfiguration
@EnableAsync
@Import({ Web.class, Later.class })
static class App { }

void main() {
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=true")) {
        int port = ctx.getEnvironment().getProperty("local.server.port", Integer.class);
        IO.print(RestClient.create("http://localhost:" + port).get().uri("/orders").retrieve().body(String.class));
    }
}`),
      out(`handler:     request yes, user ravi, trace t-1
@Async:      request NO, user NO, trace NO
supplyAsync: request NO, user NO, trace NO
scope fork:  request NO, user NO, trace NO`),
      '## The rollback that does not roll back',
      'The docs say it plainly: a `@Transactional` transaction "does not propagate to newly started threads within the method". So a write on another thread runs **in its own transaction, and commits**, whatever the method does next:',
      jv(`import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

@Service
static class Orders {
    final JdbcTemplate jdbc;
    Orders(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Transactional
    public void place() throws InterruptedException {
        jdbc.update("insert into orders values ('on the caller')");
        Thread.ofVirtual().start(() -> jdbc.update("insert into orders values ('on another thread')")).join();
        throw new IllegalStateException("something went wrong");
    }
}

@EnableAutoConfiguration
@EnableTransactionManagement
@Import(Orders.class)
static class App { }

void main() throws Exception {
    try (var ctx = SpringApplication.run(App.class, "--spring.main.web-application-type=none")) {
        var jdbc = ctx.getBean(JdbcTemplate.class);
        jdbc.execute("create table orders(name varchar(40))");
        try {
            ctx.getBean(Orders.class).place();
        } catch (IllegalStateException e) {
            IO.println("the method failed: " + e.getMessage());
        }
        IO.println("after the rollback, the table has: " + jdbc.queryForList("select name from orders", String.class));
    }
}`),
      out(`the method failed: something went wrong
after the rollback, the table has: [on another thread]`),
      'A transaction cannot follow you: it **is** one connection, and one connection serves one thread at a time. The fix is not to carry it. Do the database work on the request\'s thread, and fork only for calls that are not part of the transaction.',
      '## Carrying what can be carried: TaskDecorator',
      'A `TaskDecorator` wraps every task an executor is given. It runs on the **submitting** thread, so it can read the context there and restore it on the new thread. Boot applies a `TaskDecorator` bean to `applicationTaskExecutor` for you, so `@Async` is covered:',
      norun(`@Bean
TaskDecorator copyContext() {
    return task -> {
        Map<String, String> mdc = MDC.getCopyOfContextMap();     // on the caller's thread
        SecurityContext security = SecurityContextHolder.getContext();
        return () -> {                                           // on the new thread
            if (mdc != null) MDC.setContextMap(mdc);
            SecurityContextHolder.setContext(security);
            try {
                task.run();
            } finally {
                MDC.clear();                                     // a pool reuses this thread
                SecurityContextHolder.clearContext();
            }
        };
    };
}`),
      'Measured with that bean: `@Async` and the executor now see the user and the trace id. **`supplyAsync` with no executor and a scope\'s `fork` still do not**: they do not go through `applicationTaskExecutor`. The request and the transaction are not copied, and should not be: the request may be finished when the task runs.',
      '| To carry | Use |\n|---|---|\n| `@Async`, `applicationTaskExecutor` | a `TaskDecorator` bean |\n| The user alone | `DelegatingSecurityContextExecutor` around any executor (measured: user yes, trace no) |\n| Any registered `ThreadLocal`, with Micrometer | `ContextPropagatingTaskDecorator`, below |\n| `CompletableFuture` | pass it the decorated executor, **always** |\n| A scope\'s `fork` | `ScopedValue`, inherited by subtasks ([[lesson:sv-inheritance]]), or a thread factory that restores it |',
      'Spring\'s own decorator copies every `ThreadLocal` registered with Micrometer\'s `ContextRegistry`, the same registry tracing uses:',
      jv(`import org.springframework.core.task.support.*;
import io.micrometer.context.*;

static final ThreadLocal<String> TENANT = new ThreadLocal<>();

void main() throws Exception {
    ContextRegistry.getInstance().registerThreadLocalAccessor("tenant", TENANT);
    var decorator = new ContextPropagatingTaskDecorator();
    TENANT.set("acme");
    String[] plain = new String[1], decorated = new String[1];
    Thread.ofVirtual().start(() -> plain[0] = TENANT.get()).join();
    Thread.ofVirtual().start(decorator.decorate(() -> decorated[0] = TENANT.get())).join();
    IO.println("a plain task sees: " + plain[0]);
    IO.println("a decorated task sees: " + decorated[0]);
}`),
      out(`a plain task sees: null
a decorated task sees: acme`)
    ].join('\n\n'),
    work: [
      '**Logs with no trace id** are the first sign: every line from inside a `CompletableFuture` is suddenly anonymous. Pass your executor to every `supplyAsync`, and make it the decorated one; a `supplyAsync` with no executor also runs on the common pool, a second problem ([[lesson:juc-completable]]).',
      '**Security that silently changes.** Code on a new thread with an empty context fails an access check at best. At worst a method with no check runs and audits as "anonymous". `SecurityContextHolder` defaults to a plain thread-local (measured: `ThreadLocalSecurityContextHolderStrategy`).',
      '**A leak the other way.** On a pool, a decorator that sets context and does not clear it leaves one user\'s identity on a thread the next task will use. That is why the `finally` above is not optional.'
    ].join('\n\n'),
    example: {
      code: `// A TaskDecorator by hand, without Spring's machinery. Remove the copy and see the trace id vanish.
import org.springframework.core.task.*;
import org.slf4j.MDC;

TaskDecorator copyMdc() {
    return task -> {
        var mdc = MDC.getCopyOfContextMap();
        return () -> {
            if (mdc != null) MDC.setContextMap(mdc);
            try {
                task.run();
            } finally {
                MDC.clear();
            }
        };
    };
}

void main() throws Exception {
    MDC.put("trace", "t-42");
    Thread.ofVirtual().start(() -> IO.println("plain:     " + MDC.get("trace"))).join();
    Thread.ofVirtual().start(copyMdc().decorate(() -> IO.println("decorated: " + MDC.get("trace")))).join();
}`,
      note: 'SLF4J\'s MDC is backed here by Logback, as in a default Spring Boot app.'
    },
    challenge: {
      title: 'A decorator that carries the trace id',
      task: 'Write `copyTrace()`, returning a `TaskDecorator` that carries SLF4J\'s `MDC` to the thread that runs the task:\n\n- it copies the context **when the task is submitted** (`decorate` runs on the submitting thread), so a change made after that does not reach the task;\n- on the new thread it restores the copy, runs the task, and **always** clears the MDC afterwards, even if the task throws, because a pool reuses that thread;\n- a caller with no MDC at all must work too: `getCopyOfContextMap()` can return `null`.',
      starter: `import org.springframework.core.task.*;
import org.slf4j.MDC;

// Copy the MDC when the task is submitted; restore it on the new thread; always clear it afterwards.
TaskDecorator copyTrace() {
    return task -> task;
}

void main() throws Exception {
    MDC.put("trace", "t-1");
    Thread.ofVirtual().start(copyTrace().decorate(() -> IO.println("the task sees " + MDC.get("trace")))).join();
}`,
      solution: `import org.springframework.core.task.*;
import org.slf4j.MDC;

TaskDecorator copyTrace() {
    return task -> {
        var copy = MDC.getCopyOfContextMap();
        return () -> {
            if (copy != null) MDC.setContextMap(copy);
            try {
                task.run();
            } finally {
                MDC.clear();
            }
        };
    };
}

void main() throws Exception {
    MDC.put("trace", "t-1");
    Thread.ofVirtual().start(copyTrace().decorate(() -> IO.println("the task sees " + MDC.get("trace")))).join();
}`,
      hints: [
        'A `TaskDecorator` takes a `Runnable` and returns a `Runnable`. Code in the outer lambda runs on the submitting thread; code in the returned one runs on the new thread.',
        '`MDC.getCopyOfContextMap()` in the outer lambda; `MDC.setContextMap(copy)` in the inner one.',
        '`try { task.run(); } finally { MDC.clear(); }` keeps the thread clean even when the task throws.'
      ],
      checks: [
        { label: 'the task sees the caller\'s trace id', code: `org.springframework.core.task.TaskDecorator d = c.call("copyTrace");
org.slf4j.MDC.put("trace", "t-1");
String[] seen = new String[1];
Thread.ofVirtual().start(d.decorate(() -> seen[0] = org.slf4j.MDC.get("trace"))).join();
org.slf4j.MDC.clear();
c.eq(seen[0], "t-1");` },
        { label: 'it copies when the task is submitted, not when it runs', code: `org.springframework.core.task.TaskDecorator d = c.call("copyTrace");
org.slf4j.MDC.put("trace", "at submit");
String[] seen = new String[1];
Runnable task = d.decorate(() -> seen[0] = org.slf4j.MDC.get("trace"));
org.slf4j.MDC.put("trace", "changed later");
Thread.ofVirtual().start(task).join();
org.slf4j.MDC.clear();
c.eq(seen[0], "at submit");` },
        { label: 'a reused thread is left clean afterwards', code: `org.springframework.core.task.TaskDecorator d = c.call("copyTrace");
org.slf4j.MDC.put("trace", "t-1");
Runnable task = d.decorate(() -> { });
org.slf4j.MDC.clear();
try (var one = Executors.newSingleThreadExecutor()) {
    one.submit(task).get();
    c.eq(one.submit(() -> org.slf4j.MDC.get("trace")).get(), null);
}` },
        { label: 'it is left clean even when the task throws', code: `org.springframework.core.task.TaskDecorator d = c.call("copyTrace");
org.slf4j.MDC.put("trace", "t-1");
Runnable task = d.decorate(() -> { throw new IllegalStateException("boom"); });
org.slf4j.MDC.clear();
try (var one = Executors.newSingleThreadExecutor()) {
    try { one.submit(task).get(); } catch (ExecutionException e) { }
    c.eq(one.submit(() -> org.slf4j.MDC.get("trace")).get(), null);
}` },
        { label: 'a caller with no MDC works', code: `org.springframework.core.task.TaskDecorator d = c.call("copyTrace");
org.slf4j.MDC.clear();
boolean[] ran = new boolean[1];
Runnable task = d.decorate(() -> ran[0] = true);
var thread = Thread.ofVirtual().start(task);
thread.join();
c.ok(ran[0], "the task did not run");` }
      ]
    }
  });
})(window.JCLT);
