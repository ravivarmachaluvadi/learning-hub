/*
 * data/springmap.js - the Spring map (#/spring, batch 4): each Spring feature, the thread it runs on with and without
 * virtual threads, and the lesson that explains it.
 *
 * Shape: {program, output, rows: [{id, feature, off, on, lesson, note, notRun?}]}
 * `program` is one real Spring Boot application that does each thing and prints where it ran. tests/test_content.py
 * runs it and it must print exactly `output`; tests/check_data.py checks that each row's off and on are what `output`
 * says for that feature. A row the program cannot prove (no broker here) has notRun: where the fact comes from.
 */
(function (U) {
  'use strict';
  U.data.springMap = {
    program: `import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.context.event.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.event.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;
import jakarta.annotation.*;

// The thread's name without its numbers, so every run prints the same.
static String thread() {
    Thread t = Thread.currentThread();
    String name = t.getName().startsWith("http-nio") ? "http-nio-…-exec-N" : t.getName().replaceAll("[0-9]+$", "N");
    return name + (t.isVirtual() ? " (virtual)" : "");
}

static final Map<String, String> SEEN = new ConcurrentSkipListMap<>();
static void see(String what) { SEEN.put(what, thread()); }

record Placed(String id) { }

@RestController
static class Web implements ApplicationRunner {
    final ApplicationEventPublisher events;
    final Beans beans;
    Web(ApplicationEventPublisher events, Beans beans) { this.events = events; this.beans = beans; }
    @PostConstruct void made() { see("@PostConstruct"); }
    @Override public void run(ApplicationArguments a) { see("ApplicationRunner"); }
    @GetMapping("/plain") String plain() { see("A controller method"); events.publishEvent(new Placed("a")); beans.tx(); return "ok"; }
    @GetMapping("/callable") Callable<String> callable() { return () -> { see("A controller's Callable"); return "ok"; }; }
    @GetMapping("/async") String async() { beans.asyncMethod(); return "ok"; }
    @GetMapping("/plain-future") String future() throws Exception {
        CompletableFuture.supplyAsync(() -> { see("CompletableFuture.supplyAsync"); return "ok"; }).get();
        var two = new CountDownLatch(2);      // each element waits for another, so a second thread must take part
        List.of(1, 2, 3, 4).parallelStream().forEach(i -> {
            two.countDown();
            try { two.await(500, TimeUnit.MILLISECONDS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            if (Thread.currentThread().getName().startsWith("ForkJoinPool")) see("A parallel stream, its other threads");
        });
        return "ok";
    }
}

@Component
static class Beans {
    final CountDownLatch asyncDone = new CountDownLatch(2), scheduled = new CountDownLatch(1);
    @Autowired ApplicationEventPublisher events;
    @Async public void asyncMethod() { see("An @Async method"); asyncDone.countDown(); }
    @EventListener public void onEvent(Placed e) { see("An @EventListener"); }
    @Async @EventListener public void onEventAsync(Placed e) { see("An @Async @EventListener"); asyncDone.countDown(); }
    @Scheduled(fixedDelay = 60_000) public void tick() { see("A @Scheduled method"); scheduled.countDown(); }
    @Transactional public void tx() { see("A @Transactional method"); events.publishEvent(new Placed("in a transaction")); }
    @TransactionalEventListener public void afterCommit(Placed e) { see("A @TransactionalEventListener"); }
    public void await() throws InterruptedException { asyncDone.await(); scheduled.await(); }
}

@EnableAutoConfiguration
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
@Import({ Web.class, Beans.class })
static class App { }

Map<String, String> run(String on) throws Exception {
    SEEN.clear();
    try (var ctx = SpringApplication.run(App.class, "--spring.threads.virtual.enabled=" + on)) {
        var http = RestClient.create("http://localhost:" + ctx.getEnvironment().getProperty("local.server.port"));
        for (String path : List.of("/plain", "/callable", "/async", "/plain-future")) {
            http.get().uri(path).retrieve().toBodilessEntity();
        }
        ctx.getBean(Beans.class).await();
    }
    return new TreeMap<>(SEEN);
}

void main() throws Exception {
    var off = run("false");
    var on = run("true");
    off.forEach((what, thread) -> IO.println(what + " | " + thread + " | " + on.get(what)));
}`,
    output: `@PostConstruct | main | main
A @Scheduled method | scheduling-N | scheduling-N (virtual)
A @Transactional method | http-nio-…-exec-N | tomcat-handler-N (virtual)
A @TransactionalEventListener | http-nio-…-exec-N | tomcat-handler-N (virtual)
A controller method | http-nio-…-exec-N | tomcat-handler-N (virtual)
A controller's Callable | task-N | task-N (virtual)
A parallel stream, its other threads | ForkJoinPool.commonPool-worker-N | ForkJoinPool.commonPool-worker-N
An @Async @EventListener | task-N | task-N (virtual)
An @Async method | task-N | task-N (virtual)
An @EventListener | http-nio-…-exec-N | tomcat-handler-N (virtual)
ApplicationRunner | main | main
CompletableFuture.supplyAsync | ForkJoinPool.commonPool-worker-N | ForkJoinPool.commonPool-worker-N`,
    rows: [
      { id: 'controller', feature: 'A controller method', off: 'http-nio-…-exec-N', on: 'tomcat-handler-N (virtual)', lesson: 'sp-virtual',
        note: 'One thread per request. Off, at most `server.tomcat.threads.max` (200) at once; on, that setting is ignored.' },
      { id: 'callable', feature: 'A controller\'s Callable', off: 'task-N', on: 'task-N (virtual)', lesson: 'sp-mvc',
        note: 'Runs on `applicationTaskExecutor`, freeing the request thread. On virtual threads there is little left to free.' },
      { id: 'async', feature: 'An @Async method', off: 'task-N', on: 'task-N (virtual)', lesson: 'sp-async',
        note: 'Through the proxy only. Off, a `ThreadPoolTaskExecutor` of 8; on, a new virtual thread per call, with no limit unless you set one.' },
      { id: 'scheduled', feature: 'A @Scheduled method', off: 'scheduling-N', on: 'scheduling-N (virtual)', lesson: 'sp-jobs',
        note: 'Off, one thread for all jobs. On, a `fixedRate` job **overlaps itself**; `fixedDelay` jobs still run one at a time.' },
      { id: 'transactional', feature: 'A @Transactional method', off: 'http-nio-…-exec-N', on: 'tomcat-handler-N (virtual)', lesson: 'sp-context',
        note: 'On the caller\'s thread: the transaction is bound to it. A new thread is outside it, and commits on its own.' },
      { id: 'listener', feature: 'An @EventListener', off: 'http-nio-…-exec-N', on: 'tomcat-handler-N (virtual)', lesson: 'sp-jobs',
        note: 'On the publisher\'s thread, inside its transaction: a slow listener slows the publisher.' },
      { id: 'async-listener', feature: 'An @Async @EventListener', off: 'task-N', on: 'task-N (virtual)', lesson: 'sp-jobs',
        note: 'On the task executor: no transaction, no request, no security context unless you carry them.' },
      { id: 'tx-listener', feature: 'A @TransactionalEventListener', off: 'http-nio-…-exec-N', on: 'tomcat-handler-N (virtual)', lesson: 'sp-jobs',
        note: 'After the commit, on the same thread. The usual home for "send the email once it is really saved".' },
      { id: 'postconstruct', feature: '@PostConstruct', off: 'main', on: 'main', lesson: 'sp-virtual',
        note: 'Start-up runs on `main`. A blocking `static {}` is still a pinning risk elsewhere ([[lesson:vt-pinning]]).' },
      { id: 'runner', feature: 'ApplicationRunner', off: 'main', on: 'main', lesson: 'sp-virtual',
        note: 'Also `main`. The property does not touch it.' },
      { id: 'supply-async', feature: 'CompletableFuture.supplyAsync', off: 'ForkJoinPool.commonPool-worker-N', on: 'ForkJoinPool.commonPool-worker-N', lesson: 'sp-context',
        note: '**Not switched.** With no executor it is the common pool, both ways, with no context. Always pass your own executor.' },
      { id: 'parallel-stream', feature: 'A parallel stream, its other threads', off: 'ForkJoinPool.commonPool-worker-N', on: 'ForkJoinPool.commonPool-worker-N', lesson: 'juc-forkjoin',
        note: '**Not switched.** Plus the calling thread. Blocking in one starves everyone using the common pool.' },
      { id: 'kafka', feature: 'A @KafkaListener', off: 'a listener container thread', on: 'a virtual thread', lesson: 'sp-jobs',
        note: 'One consumer per `concurrency`, and a partition is still read in order, on any kind of thread.',
        notRun: 'Not run here: it needs a broker. From the Spring Boot 3.2 release notes, which list Kafka and RabbitMQ listeners as using virtual threads when the property is on.' }
    ]
  };
})(window.JCLT);
