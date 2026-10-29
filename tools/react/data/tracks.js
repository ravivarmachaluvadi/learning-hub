/*
 * The tracks of the course, beginner to advanced. Lessons, interview questions and machine-coding
 * problems name their track by id. A track with no lessons yet is shown in the list as "coming in
 * batch N" (ROADMAP.md): each batch brings a track's lessons together with its interview questions
 * (from 18_React_QA.md) and its machine-coding problems.
 *
 * Track shape: {id, title, level: 'Beginner'|'Intermediate'|'Advanced', batch, summary, keywords}
 */
(function (U) {
  U.data.tracks = [
    {
      id: 'foundations', title: 'Foundations', level: 'Beginner', batch: 1,
      summary: 'Components, JSX, props and children, conditional rendering, lists and keys, events, and your first state: enough to build a counter, a star rating and an accordion.',
      keywords: ['beginner', 'start', 'basics', 'jsx', 'components']
    },
    {
      id: 'state', title: 'State and forms', level: 'Beginner', batch: 2,
      summary: 'State as a snapshot and why updates are batched, updating objects and arrays without mutating them, lifting state up, controlled inputs and forms, and useReducer.',
      keywords: ['useState', 'forms', 'immutability', 'useReducer', 'controlled']
    },
    {
      id: 'effects', title: 'Effects and refs', level: 'Intermediate', batch: 3,
      summary: 'useEffect and its cleanup, dependencies, fetching data without races, useRef, useLayoutEffect, custom hooks, the rules of hooks, and why StrictMode runs effects twice.',
      keywords: ['useEffect', 'useRef', 'custom hooks', 'fetch', 'StrictMode']
    },
    {
      id: 'composition', title: 'Composition and shared state', level: 'Intermediate', batch: 4,
      summary: 'Context and when not to use it, prop drilling, error boundaries, portals, higher-order components and render props, and choosing a state library (Redux Toolkit, Zustand).',
      keywords: ['context', 'portals', 'error boundary', 'redux', 'hoc']
    },
    {
      id: 'performance', title: 'Performance and internals', level: 'Advanced', batch: 4,
      summary: 'Rendering and reconciliation, memo, useMemo and useCallback, the React Compiler, transitions and useDeferredValue, lazy and Suspense, and long lists.',
      keywords: ['performance', 'memo', 'useMemo', 'useCallback', 'reconciliation', 'virtual dom']
    },
    {
      id: 'react19', title: 'React 19 and beyond', level: 'Advanced', batch: 5,
      summary: 'Actions, useActionState, useOptimistic, useFormStatus, use(), ref as a prop; Server Components and CSR, SSR and SSG (explained); testing components.',
      keywords: ['react 19', 'actions', 'useActionState', 'server components', 'ssr', 'testing']
    }
  ];
})(window.RLT);
