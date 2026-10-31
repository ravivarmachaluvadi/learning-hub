/*
 * data/glossary.js - concurrency words in plain language (#/glossary), each linked to where it is taught.
 * Batch 1 holds the words of virtual threads; later batches add those of their tracks.
 *
 * Term shape: {id, term, def (Markdown), see: ['lesson:<id>' | 'q:<id>' | 'term:<id>'], keywords}
 */
(function (U) {
  'use strict';
  U.data.glossary = (U.data.glossary || []).concat([
    { id: 'virtual-thread', term: 'Virtual thread', see: ['lesson:vt-why', 'q:vt-what'], keywords: ['loom', 'lightweight thread', 'jep 444'],
      def: 'A `java.lang.Thread` scheduled by the JVM on a few platform threads, instead of by the operating system. Cheap enough to have millions; it gives its platform thread back while it blocks. Final in Java 21 (JEP 444).' },
    { id: 'platform-thread', term: 'Platform thread', see: ['lesson:vt-why'], keywords: ['os thread', 'kernel thread', 'native thread'],
      def: 'Every `Thread` before Java 21: a thin wrapper around one operating-system thread, for its whole life, with a stack the OS reserves. Made with `new Thread(…)` or `Thread.ofPlatform()`.' },
    { id: 'carrier-thread', term: 'Carrier thread', see: ['lesson:vt-under-the-hood', 'q:vt-how'], keywords: ['carrier', 'ForkJoinPool-1-worker'],
      def: 'A platform thread of the virtual-thread scheduler. A virtual thread runs *on* a carrier while it is mounted. By default there are as many carriers as processors.' },
    { id: 'continuation', term: 'Continuation', see: ['lesson:vt-under-the-hood', 'q:vt-how'], keywords: ['stack chunk', 'frames'],
      def: 'What a virtual thread is made of: the code to run and, while it is not running, its stack frames, kept in heap objects. Mounting copies them onto a carrier; unmounting copies them back.' },
    { id: 'mount', term: 'Mount and unmount', see: ['lesson:vt-under-the-hood'], keywords: ['mount', 'unmount', 'park', 'yield'],
      def: '**Mount**: the scheduler runs a virtual thread on a carrier. **Unmount**: when it blocks in a JDK call, its frames go to the heap and the carrier is free. It may resume on another carrier.' },
    { id: 'scheduler', term: 'Virtual-thread scheduler', see: ['lesson:vt-under-the-hood'], keywords: ['ForkJoinPool', 'parallelism', 'jdk.virtualThreadScheduler.parallelism'],
      def: 'The FIFO `ForkJoinPool` whose platform threads carry virtual threads. Its size is the processor count; `-Djdk.virtualThreadScheduler.parallelism=N` changes it.' },
    { id: 'pinning', term: 'Pinning', see: ['lesson:vt-pinning', 'q:vt-pinning'], keywords: ['pinned', 'synchronized', 'class initializer', 'jep 491'],
      def: 'A virtual thread that blocks but cannot unmount, so it blocks its carrier too. In Java 25: blocking in a class initializer, or in native code that calls back; `synchronized` stopped pinning in Java 24 (JEP 491).' },
    { id: 'capture', term: 'Capture (and compensation)', see: ['lesson:vt-blocking'], keywords: ['file io', 'compensate', 'maxPoolSize'],
      def: 'A blocking call that keeps the virtual thread mounted because the OS offers no way to wait without a thread, such as file I/O. The scheduler makes up for it by adding a carrier for a while; for pinning it does not.' },
    { id: 'thread-per-request', term: 'Thread-per-request', see: ['lesson:vt-why'], keywords: ['servlet', 'blocking style', 'tomcat'],
      def: 'A server style where each request runs on a thread of its own, top to bottom, with plain blocking calls. Simple to write and debug; with platform threads it caps throughput, with virtual threads it does not.' },
    { id: 'littles-law', term: 'Little\'s law', see: ['lesson:vt-why', 'q:vt-littles-law'], keywords: ['capacity', 'L = λW', 'queueing'],
      def: 'Items in a system = arrival rate × time each spends there (`L = λ × W`). 2,000 requests a second × 0.2 s = 400 in flight, so 400 threads with thread-per-request.' },
    { id: 'throughput', term: 'Throughput and latency', see: ['lesson:vt-why'], keywords: ['latency', 'requests per second', 'p99'],
      def: '**Throughput**: how many requests are finished per second. **Latency**: how long one request takes. Virtual threads raise throughput when requests wait; they do not shorten one request.' },
    { id: 'daemon-thread', term: 'Daemon thread', see: ['lesson:vt-create', 'q:vt-daemon'], keywords: ['setDaemon', 'jvm exit'],
      def: 'A thread the JVM does not wait for: the program ends when only daemon threads are left. Virtual threads are always daemons, so wait for them (join, an executor\'s `close()`, a structured scope).' },
    { id: 'thread-builder', term: 'Thread.Builder', see: ['lesson:vt-create', 'q:vt-create-ways'], keywords: ['ofVirtual', 'ofPlatform', 'factory', 'name'],
      def: 'What `Thread.ofVirtual()` and `Thread.ofPlatform()` return: set a name (with a counter), then `start(task)`, `unstarted(task)` or `factory()` for a `ThreadFactory`.' },
    { id: 'per-task-executor', term: 'Thread-per-task executor', see: ['lesson:vt-create'], keywords: ['newVirtualThreadPerTaskExecutor', 'newThreadPerTaskExecutor', 'executor'],
      def: 'An `ExecutorService` that starts a new thread for every task instead of reusing a pool: `Executors.newVirtualThreadPerTaskExecutor()`, or `newThreadPerTaskExecutor(factory)` for named threads.' },
    { id: 'semaphore', term: 'Semaphore', see: ['lesson:vt-limit', 'q:vt-pool'], keywords: ['permits', 'acquire', 'release', 'tryAcquire', 'limit'],
      def: 'A counter of permits: `acquire()` waits for one, `release()` gives it back. Around a call to a scarce resource it caps how many calls run at once, whatever the number of threads.' },
    { id: 'bulkhead', term: 'Bulkhead', see: ['lesson:vt-limit'], keywords: ['isolation', 'resilience4j', 'limit'],
      def: 'A limit on how much of a service one dependency can use, so a slow dependency cannot take everything: often a semaphore around its calls. Named after a ship\'s watertight compartments.' },
    { id: 'load-shedding', term: 'Load shedding', see: ['lesson:vt-limit'], keywords: ['503', 'reject', 'tryAcquire', 'overload'],
      def: 'Refusing work quickly when overloaded (an HTTP 503) instead of queueing it until it times out. `Semaphore.tryAcquire(timeout)` is the simplest form.' },
    { id: 'threadlocal', term: 'ThreadLocal', see: ['lesson:vt-threadlocals', 'q:vt-threadlocal'], keywords: ['per-thread', 'InheritableThreadLocal', 'context'],
      def: 'A variable with a separate value for each thread. Works on virtual threads; as a cache of costly objects it stops paying off, because every task is a new thread.' },
    { id: 'scoped-value', term: 'ScopedValue', see: ['lesson:vt-threadlocals', 'q:vt-threadlocal'], keywords: ['scoped values', 'jep 506', 'context'],
      def: 'Java 25\'s replacement for `ThreadLocal` context: a value bound for the duration of a call, read-only inside it, inherited by structured subtasks. Final in Java 25 (JEP 506); Track 5 teaches it.' },
    { id: 'time-slicing', term: 'Time slicing', see: ['lesson:vt-blocking', 'q:vt-time-slicing'], keywords: ['preemption', 'fairness', 'scheduling'],
      def: 'Taking the CPU away from a running thread after a slice of time. The OS does it to platform threads; the virtual-thread scheduler does not: a virtual thread runs until it blocks or ends.' },
    { id: 'cpu-bound', term: 'CPU-bound and I/O-bound', see: ['lesson:vt-cpu-bound', 'q:vt-when-not'], keywords: ['io-bound', 'compute', 'waiting'],
      def: '**CPU-bound** work spends its time computing; more threads than processors cannot speed it up. **I/O-bound** work spends its time waiting; that is where virtual threads help.' },
    { id: 'thread-dump', term: 'Thread dump', see: ['lesson:vt-observe', 'q:vt-observe'], keywords: ['jcmd', 'jstack', 'Thread.dump_to_file', 'json'],
      def: 'A snapshot of every thread and its stack. `jstack` lists platform threads; `jcmd <pid> Thread.dump_to_file -format=json <file>` lists virtual threads too, grouped by their executor or scope.' },
    { id: 'jfr', term: 'JFR (JDK Flight Recorder)', see: ['lesson:vt-observe', 'q:vt-observe'], keywords: ['flight recorder', 'VirtualThreadPinned', 'events', 'RecordingStream'],
      def: 'The JVM\'s built-in, low-overhead event recorder. `jdk.VirtualThreadPinned` (on by default, 20 ms threshold) reports pinned virtual threads with the reason.' },
    { id: 'jep', term: 'JEP', see: ['lesson:vt-why'], keywords: ['jdk enhancement proposal', 'openjdk', 'preview'],
      def: 'A JDK Enhancement Proposal: the document on openjdk.org that describes a change to Java and the release it lands in. Virtual threads are JEP 444; the Java 24 pinning fix is JEP 491.' },
    { id: 'preview-feature', term: 'Preview feature', see: ['lesson:vt-why'], keywords: ['--enable-preview', 'preview api', 'incubator'],
      def: 'A finished but not yet permanent feature, off unless compiled and run with `--enable-preview`. Structured concurrency is a preview API in Java 25; this tool turns preview on for every run.' }
  ]);
})(window.JCLT);
