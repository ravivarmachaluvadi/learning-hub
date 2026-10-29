/*
 * data/tracks.js - the seven tracks of the course, in order. A track's lessons arrive in its batch
 * (ROADMAP.md); until then the Lessons page lists it as "coming in batch N".
 *
 * Track shape: {id, title, level: 'Beginner' | 'Intermediate' | 'Advanced', batch, summary, keywords}
 */
(function (U) {
  'use strict';
  U.data.tracks = [
    { id: 'basics', title: 'Basics', level: 'Beginner', batch: 1,
      summary: 'Your first program, val and var, numbers, strings and templates, if and when as expressions, ranges and loops, functions with default and named arguments, null safety, exceptions, and the collections you use every day.',
      keywords: ['beginner', 'start', 'basics', 'syntax', 'null safety', 'collections'] },
    { id: 'classes', title: 'Classes and objects', level: 'Beginner', batch: 2,
      summary: 'Constructors and init, properties and lateinit, final by default and open, data classes, object and companion object, enums, sealed classes, interfaces, inheritance, value classes and inner classes.',
      keywords: ['class', 'object', 'data class', 'sealed', 'enum', 'companion', 'oop'] },
    { id: 'functional', title: 'Functional Kotlin', level: 'Intermediate', batch: 2,
      summary: 'Lambdas and function types, higher-order functions, the collection operations, sequences next to Java streams, extension functions, the scope functions, inline functions and reified type parameters.',
      keywords: ['lambda', 'higher-order', 'extension', 'scope functions', 'let', 'apply', 'inline', 'sequence'] },
    { id: 'types', title: 'Types in depth', level: 'Intermediate', batch: 3,
      summary: 'Generics and variance, Any, Unit and Nothing, == and ===, delegation, property delegates, operator overloading and destructuring, type aliases, const val and platform types.',
      keywords: ['generics', 'variance', 'in', 'out', 'delegation', 'lazy', 'operator', 'nothing'] },
    { id: 'interop', title: 'Idioms, DSLs and Java interop', level: 'Intermediate', batch: 3,
      summary: 'Calling Java from Kotlin and Kotlin from Java (the @Jvm annotations), builders and type-safe DSLs, buildList and buildString, fun interfaces, annotations and reflection, and testing with kotlin.test.',
      keywords: ['interop', 'java', 'jvmstatic', 'dsl', 'builder', 'annotation', 'test'] },
    { id: 'coroutines', title: 'Coroutines', level: 'Advanced', batch: 4,
      summary: 'Coroutines next to threads and virtual threads, suspend functions, launch and async, structured concurrency, cancellation, dispatchers, exception handling, channels, shared state and scopes.',
      keywords: ['coroutines', 'suspend', 'async', 'launch', 'concurrency', 'dispatcher', 'structured concurrency'] },
    { id: 'flow', title: 'Flow', level: 'Advanced', batch: 4,
      summary: 'Cold flows and their operators, flowOn and context, buffering and conflation, errors and retries, StateFlow and SharedFlow, and testing with runTest.',
      keywords: ['flow', 'stateflow', 'sharedflow', 'reactive', 'stream', 'runtest'] }
  ];
})(window.KLT);
