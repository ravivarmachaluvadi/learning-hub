/*
 * The tracks of the course, easy to advanced. Lessons name their track by id (data/lessons-*.js).
 * A track with no lessons yet is shown in the list as "coming in batch N" (ROADMAP.md).
 *
 * Track shape: {id, title, level: 'Beginner'|'Intermediate'|'Advanced', batch, summary, keywords}
 */
(function (U) {
  U.data.tracks = [
    {
      id: 'basics', title: 'Basics', level: 'Beginner', batch: 1,
      summary: 'The language itself: how a file runs, names and types, numbers, strings, decisions, loops, the four built-in collections, functions, exceptions, input and files.',
      keywords: ['beginner', 'start', 'syntax']
    },
    {
      id: 'pythonic', title: 'Pythonic Python', level: 'Beginner', batch: 2,
      summary: 'Writing Python the way Python developers do: comprehensions instead of loops, slicing, zip and enumerate, sorting with a key, the collections module, text and files, modules, and the "ask forgiveness" style.',
      keywords: ['idiomatic', 'comprehension', 'collections']
    },
    {
      id: 'functions', title: 'Functions in depth', level: 'Intermediate', batch: 2,
      summary: '*args and **kwargs, the mutable-default trap, scope rules, lambdas, closures, decorators, functools and recursion.',
      keywords: ['decorator', 'closure', 'lambda', 'scope']
    },
    {
      id: 'objects', title: 'Objects and classes', level: 'Intermediate', batch: 3,
      summary: 'Classes and self, references and copies, the special methods behind ==, hash, len and +, properties, inheritance and the MRO, ABCs and Protocols, dataclasses and enums.',
      keywords: ['class', 'oop', 'dataclass', 'inheritance']
    },
    {
      id: 'iteration', title: 'Iteration', level: 'Intermediate', batch: 3,
      summary: 'The iterator protocol behind every for loop, generators and yield, lazy pipelines (Python\'s answer to Java streams), itertools and yield from.',
      keywords: ['generator', 'iterator', 'yield', 'itertools']
    },
    {
      id: 'tooling', title: 'Tooling and quality', level: 'Advanced', batch: 4,
      summary: 'Type hints and generics, packages and pyproject.toml, virtual environments and pip (Maven\'s job), pytest (JUnit\'s job), logging and the debugger, context managers, command-line programs.',
      keywords: ['pytest', 'pip', 'venv', 'typing', 'logging']
    },
    {
      id: 'advanced', title: 'Advanced Python', level: 'Advanced', batch: 4,
      summary: 'Pattern matching, descriptors, metaclasses, memory and garbage collection, threads and the GIL, multiprocessing, asyncio, and measuring performance.',
      keywords: ['asyncio', 'gil', 'threads', 'metaclass', 'performance']
    }
  ];
})(window.PYLT);
