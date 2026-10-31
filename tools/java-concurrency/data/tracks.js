/*
 * data/tracks.js - the six tracks of the course, in teaching order. A track's lessons arrive in its batch
 * (ROADMAP.md); until then the Lessons page lists it as "coming in batch N". Virtual threads come first
 * in building order (batch 1), because they are what the tool is for; the foundations come in batch 3.
 *
 * Track shape: {id, title, level: 'Foundations' | 'Modern Java (21 to 25)' | 'In production', batch, summary, keywords}
 */
(function (U) {
  'use strict';
  U.data.tracks = [
    { id: 'threads', title: 'Threads and the memory model', level: 'Foundations', batch: 3,
      summary: 'Thread states, races and atomicity, visibility and happens-before, volatile, synchronized and monitors, wait and notify, deadlock, safe publication, ThreadLocal, and interruption as the way Java cancels.',
      keywords: ['thread', 'memory model', 'jmm', 'volatile', 'synchronized', 'happens-before', 'deadlock', 'race', 'interrupt'] },
    { id: 'juc', title: 'The java.util.concurrent toolkit', level: 'Foundations', batch: 3,
      summary: 'Executors and pool sizing, Future and Callable, CompletableFuture, locks and conditions, atomics and LongAdder, the concurrent collections, latches, barriers and semaphores, ForkJoin and parallel streams.',
      keywords: ['executor', 'thread pool', 'completablefuture', 'lock', 'atomic', 'concurrenthashmap', 'semaphore', 'forkjoin'] },
    { id: 'virtual-threads', title: 'Virtual threads', level: 'Modern Java (21 to 25)', batch: 1,
      summary: 'Why a thread per request needs cheap threads, how to create virtual threads, carriers and mounting, what blocking does, pinning and the Java 24 fix, limiting concurrency without a pool, ThreadLocal at scale, CPU-bound work, and observing them with thread dumps and JFR.',
      keywords: ['virtual thread', 'loom', 'carrier', 'pinning', 'jep 444', 'jep 491', 'thread per request', 'semaphore'] },
    { id: 'structured', title: 'Structured concurrency (preview in Java 25)', level: 'Modern Java (21 to 25)', batch: 2,
      summary: 'StructuredTaskScope: subtasks that cannot outlive their scope, a failure that cancels the siblings, the Joiners, your own Joiner, timeouts, nesting and the scope tree in a thread dump, and the fan-out, race and hedged-request patterns.',
      keywords: ['structured concurrency', 'structuredtaskscope', 'joiner', 'fork', 'join', 'cancellation', 'jep 505'] },
    { id: 'scoped', title: 'Scoped values and the other new APIs', level: 'Modern Java (21 to 25)', batch: 2,
      summary: 'ScopedValue (final in Java 25) instead of ThreadLocal, rebinding, inheritance into forked subtasks, Gatherers.mapConcurrent for bounded concurrency in a stream, and thread-safe lazy initialisation with StableValue (preview).',
      keywords: ['scopedvalue', 'scoped value', 'threadlocal', 'mapconcurrent', 'gatherers', 'stablevalue', 'jep 506'] },
    { id: 'spring', title: 'Spring and production', level: 'In production', batch: 4,
      summary: 'spring.threads.virtual.enabled and what it switches, @Async and schedulers on virtual threads, MVC or WebFlux, the database pool as the real limit, Spring\'s thread-bound context when you fork, an aggregator endpoint, resilience, messaging and scheduled jobs, observing it all, and migrating a real service.',
      keywords: ['spring', 'spring boot', 'tomcat', 'async', 'hikari', 'transactional', 'security context', 'mdc', 'production', 'migration'] }
  ];
})(window.JCLT);
