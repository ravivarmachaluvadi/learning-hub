/*
 * data/versions.js - the Java version map (#/versions, batch 2): every concurrency JEP from Java 19 to 27,
 * whether it was an incubator, a preview or final, and what it changed. Every row was read on openjdk.org
 * on 1 Nov 2026 (each JEP page, and the JDK 26 and 27 project pages); the "changed" notes for 25 and later
 * were also probed on JDK 25.0.4.1 where this tool runs code.
 *
 * Shape: {id, feature, lesson? ('track:<id>' or 'lesson:<id>'), summary, rows: [{jdk, jep, status: 'incubator' | 'preview' | 'final', note}]}
 */
(function (U) {
  'use strict';
  U.data.versions = [
    { id: 'virtual-threads', feature: 'Virtual threads', lesson: 'track:virtual-threads',
      summary: 'Final since Java 21, so every LTS from 21 has them.',
      rows: [
        { jdk: 19, jep: 425, status: 'preview', note: 'First preview: `Thread.ofVirtual()`, `Executors.newVirtualThreadPerTaskExecutor()`' },
        { jdk: 20, jep: 436, status: 'preview', note: 'Second preview, minor changes' },
        { jdk: 21, jep: 444, status: 'final', note: 'Final. Thread-local variables always supported; `jdk.tracePinnedThreads`; JSON thread dumps with `jcmd Thread.dump_to_file`' }
      ] },
    { id: 'pinning', feature: 'Synchronize virtual threads without pinning', lesson: 'lesson:vt-pinning',
      summary: 'Java 24 removed the main cause of pinning; Java 25 LTS has it.',
      rows: [
        { jdk: 24, jep: 491, status: 'final', note: '`synchronized` and `Object.wait()` no longer pin; still pinned: class initializers, native frames. `jdk.tracePinnedThreads` removed; JFR `jdk.VirtualThreadPinned` gives the reason' }
      ] },
    { id: 'structured', feature: 'Structured concurrency', lesson: 'track:structured',
      summary: 'Still a preview in 25, 26 and 27: compile and run with `--enable-preview`, and expect the API to change.',
      rows: [
        { jdk: 19, jep: 428, status: 'incubator', note: '`StructuredTaskScope` in `jdk.incubator.concurrent`' },
        { jdk: 20, jep: 437, status: 'incubator', note: 'Second incubator: subtasks inherit scoped values' },
        { jdk: 21, jep: 453, status: 'preview', note: 'Preview in `java.util.concurrent`; `fork` returns a `Subtask`; `ShutdownOnFailure` and `ShutdownOnSuccess`' },
        { jdk: 22, jep: 462, status: 'preview', note: 'Second preview, unchanged' },
        { jdk: 23, jep: 480, status: 'preview', note: 'Third preview, unchanged' },
        { jdk: 24, jep: 499, status: 'preview', note: 'Fourth preview, unchanged' },
        { jdk: 25, jep: 505, status: 'preview', note: 'Fifth preview, a new API: `StructuredTaskScope.open()` and `Joiner`s replace the constructors and subclasses; `Configuration` with `withTimeout`, `withName`, `withThreadFactory`' },
        { jdk: 26, jep: 525, status: 'preview', note: 'Sixth: `anySuccessfulResultOrThrow` renamed `anySuccessfulOrThrow`; `allSuccessfulOrThrow` returns a `List` of results; `Joiner.onTimeout()`; configuration by `UnaryOperator`' },
        { jdk: 27, jep: 533, status: 'preview', note: 'Seventh: a type parameter for the exception `join()` throws; the `…OrThrow` joiners throw `ExecutionException`; `awaitAll()` removed; `timeout()` replaces `onTimeout()`' }
      ] },
    { id: 'scoped', feature: 'Scoped values', lesson: 'track:scoped',
      summary: 'Final in Java 25: no preview flag needed.',
      rows: [
        { jdk: 20, jep: 429, status: 'incubator', note: 'Incubator: `ScopedValue.where(key, value).run(…)`' },
        { jdk: 21, jep: 446, status: 'preview', note: 'Preview in `java.lang`' },
        { jdk: 22, jep: 464, status: 'preview', note: 'Second preview' },
        { jdk: 23, jep: 481, status: 'preview', note: 'Third preview' },
        { jdk: 24, jep: 487, status: 'preview', note: 'Fourth preview: `callWhere` and `runWhere` removed, so bindings are used only through `where(…).call` and `run`' },
        { jdk: 25, jep: 506, status: 'final', note: 'Final. `orElse(null)` is no longer accepted' }
      ] },
    { id: 'gatherers', feature: 'Stream gatherers (`mapConcurrent`)', lesson: 'lesson:sv-map-concurrent',
      summary: '`Gatherers.mapConcurrent(n, fn)` runs a stream step on virtual threads, at most `n` at once, in order.',
      rows: [
        { jdk: 22, jep: 461, status: 'preview', note: 'Preview: `Stream.gather` and `Gatherers`' },
        { jdk: 23, jep: 473, status: 'preview', note: 'Second preview, unchanged' },
        { jdk: 24, jep: 485, status: 'final', note: 'Final, `mapConcurrent` included' }
      ] },
    { id: 'lazy', feature: 'Stable values, then lazy constants', lesson: 'lesson:sv-lazy-init',
      summary: 'Thread-safe lazy initialisation the JIT can treat as a constant. Preview in 25, renamed in 26.',
      rows: [
        { jdk: 25, jep: 502, status: 'preview', note: '`StableValue.of()`, `orElseSet`, `StableValue.supplier`, `list`, `map`' },
        { jdk: 26, jep: 526, status: 'preview', note: 'Renamed `LazyConstant` (`LazyConstant.of(…)`, `get()`); `List.ofLazy`, `Map.ofLazy`; `orElseSet`, `setOrThrow`, `trySet` removed' },
        { jdk: 27, jep: 531, status: 'preview', note: 'Third preview' }
      ] },
    { id: 'compact', feature: 'Compact source files and instance `main`', lesson: 'lesson:vt-why',
      summary: 'Why every program in this tool starts at `void main()` with no class and no imports.',
      rows: [
        { jdk: 21, jep: 445, status: 'preview', note: 'Unnamed classes and instance main methods' },
        { jdk: 22, jep: 463, status: 'preview', note: 'Renamed implicitly declared classes' },
        { jdk: 23, jep: 477, status: 'preview', note: 'Third preview: `java.io.IO` with `println` and `readln`; `java.base` imported' },
        { jdk: 24, jep: 495, status: 'preview', note: 'Fourth preview: "simple source files"' },
        { jdk: 25, jep: 512, status: 'final', note: 'Final as compact source files; `IO` moved to `java.lang`' }
      ] }
  ];
})(window.JCLT);
