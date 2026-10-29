/*
 * JavaScript for React (#/javascript): the shorthand modern JavaScript is written in, as React code
 * uses it, each taken apart next to its long form and the nearest Java. Entries are in the order the
 * lessons first use them (tests/check_data.py checks it).
 *
 * Entry shape:
 *   {id, title, says (Markdown: what it means, in one sentence),
 *    short (the shorthand), long (the same thing written out), longLabel? (the middle column's name,
 *    when "Written out" does not fit), java (the nearest Java), javaLabel?, javaNote (Markdown: where
 *    Java is the same and where it differs), trap (Markdown), keywords,
 *    first (the id of the first lesson that uses it: every entry has one, so every entry has a box),
 *    pattern? (a regular expression for the shorthand: tests/check_data.py tries it on every lesson's
 *      text, example and starter in course order and requires `first` to be the first lesson it
 *      matches, and some lesson to match; an entry with no pattern names its lesson by hand),
 *    uilt? (the UI Learning Tool's JavaScript topic with more on it),
 *    run: {js: a module that prints `prints` through the shorthand, then the same lines again through
 *      the written-out form; java: a program that prints `prints`; prints: [lines]}}
 *
 * The lessons show a "New JavaScript in this lesson" box for the entries whose `first` they are
 * (js/views/lessons.js): no lesson text names an entry, so the boxes cannot drift from the entries.
 * tests/test_ui.py ("javascript") runs every run.js in the preview and every run.java with the JDK.
 * Code is written in template literals; only the template-literal entry needs \` and \${ in them
 * (in the lessons, only lesson 7's example: data/lessons-foundations.js).
 */
(function (U) {
  U.data.javascript = [
    {
      id: 'modules', title: 'Modules: import and export',
      keywords: ['import', 'export', 'export default', 'module', 'modules', 'default export', 'named export'],
      says: 'Each file is a module: `export` lets other files use a name, and `import` takes names from another file, or from a package such as `react`.',
      short: `import { useState } from 'react';
import Profile from './Profile';

export default function App() { … }
export function Badge() { … }`,
      long: `import * as React from 'react';
const useState = React.useState;
import { default as Profile } from './Profile';

function App() { … }
function Badge() { … }
export { App as default, Badge };`,
      java: `import java.util.List;             // one class from a package
import static java.lang.Math.max;  // one static member

public class Profile { … }         // the file's one public class`,
      javaNote: 'Both import names from somewhere else, but JavaScript imports from a **file path** (`./Profile`) or a package name, and a file exports any names it chooses. `export default` marks the file\'s main export, the nearest thing to Java\'s one public class per file, and whoever imports it picks the name.',
      trap: 'The braces decide which export you get. `import Profile from \'./Profile\'` takes the default export; `import { Profile } from \'./Profile\'` takes an export **named** `Profile`. Use the wrong one and you get `undefined`, which React reports as "Element type is invalid". In this tool each lesson is one file: `App` is its default export, and the other components are plain functions beside it.',
      first: 'r-first-component', pattern: '\\bimport\\s+[\\w{*]|\\bexport\\s+default\\b',
      run: {
        js: `// The shorthand: take one name out of React's module
import { Children } from 'react';

console.log(Children.count(['a', 'b', 'c']) + ' children');

// Written out: take the whole module, then read the name off it
import * as React from 'react';

console.log(React.Children.count(['a', 'b', 'c']) + ' children');`,
        java: `import java.util.List;   // one class out of the java.util package

class Main {
  public static void main(String[] args) {
    System.out.println(List.of("a", "b", "c").size() + " children");
  }
}`,
        prints: ['3 children']
      }
    },
    {
      id: 'const-let', title: 'const and let', uilt: 'basics',
      keywords: ['const', 'let', 'var', 'final', 'variable', 'reassign', 'constant'],
      says: '`const` gives a value a name that can never point at anything else; `let` gives a name you may reassign. Neither freezes an object: a `const` array can still be pushed to.',
      short: `const user = { name: 'Ada' };
user.name = 'Grace';    // allowed: the object changes
// user = {};         TypeError: Assignment to constant variable

let count = 0;
count = count + 1;      // allowed: let can be reassigned`,
      longLabel: 'The old way: var',
      long: `var user = { name: 'Ada' };   // before 2015, both were var
user.name = 'Grace';
user = {};                    // var allows this too

var count = 0;
count = count + 1;`,
      java: `final User user = new User("Ada");
user.name = "Grace";     // allowed: final fixes the reference
// user = new User("Grace");   does not compile

int count = 0;
count = count + 1;`,
      javaNote: '`const` is Java\'s `final` on a local variable: the name always points at the same thing, and the thing itself can still change. Java stops a reassignment when it compiles; JavaScript stops it when the line runs. `var`, the old way, belongs to the whole function rather than the block, which is why modern code no longer uses it.',
      trap: '`const` protects the name, not the value. `items.push(item)` on a `const` array is allowed, and it is exactly the change in place that React cannot see. Copy instead ([[js:spread]], [[lesson:r-state-arrays]]).',
      first: 'r-first-component', pattern: '\\b(?:const|let)\\s+[\\w$\\[{]',
      run: {
        js: `// The shorthand: const for what is never reassigned, let for what is
const user = { name: 'Ada', langs: ['Java'] };
user.name = 'Grace';
user.langs.push('JavaScript');
let count = 0;
count = count + 1;
console.log(user.name + ' knows ' + user.langs.join(' and '));
console.log('count is ' + count);

// The old way: var for both
var oldUser = { name: 'Ada', langs: ['Java'] };
oldUser.name = 'Grace';
oldUser.langs.push('JavaScript');
var oldCount = 0;
oldCount = oldCount + 1;
console.log(oldUser.name + ' knows ' + oldUser.langs.join(' and '));
console.log('count is ' + oldCount);`,
        java: `import java.util.ArrayList;
import java.util.List;

class Main {
  static class User {
    String name;
    List<String> langs = new ArrayList<>(List.of("Java"));
    User(String name) { this.name = name; }
  }

  public static void main(String[] args) {
    final User user = new User("Ada");
    user.name = "Grace";             // allowed: final fixes the reference, not the object
    user.langs.add("JavaScript");
    int count = 0;
    count = count + 1;
    System.out.println(user.name + " knows " + String.join(" and ", user.langs));
    System.out.println("count is " + count);
  }
}`,
        prints: ['Grace knows Java and JavaScript', 'count is 1']
      }
    },
    {
      id: 'functions-as-values', title: 'Functions are values', uilt: 'functions',
      keywords: ['function', 'callback', 'handler', 'onClick', 'method reference', 'pass a function'],
      says: 'A function can be handed around like any other value. `onClick={handleClick}` gives React the function to call later; `onClick={handleClick()}` calls it now, while rendering, and gives React whatever it returned.',
      short: `function handleClick(event) {
  console.log('clicked', event.target);
}

<button onClick={handleClick}>Save</button>`,
      long: `<button onClick={function (event) { handleClick(event); }}>
  Save
</button>`,
      java: `button.addActionListener(this::handleClick);
// or
button.addActionListener(event -> handleClick(event));`,
      javaNote: 'Passing `handleClick` is Java\'s method reference `this::handleClick`, without the `::`. And no interface such as `ActionListener` has to fit: any function goes wherever a function is expected.',
      trap: 'The brackets call it. `onClick={handleClick()}` runs `handleClick` during the render and hands React its result, usually `undefined`, so a click does nothing; if it sets state, the page re-renders for ever ("Too many re-renders"). To pass an argument, wrap it: `onClick={() => remove(item.id)}`. See [[lesson:r-events]].',
      first: 'r-jsx', pattern: '\\bon[A-Z]\\w*=\\{[A-Za-z_$][\\w$.]*\\}',
      run: {
        js: `function handleClick(event) {
  return 'saved by ' + event;
}
// what React does with onClick when the button is clicked
function click(onClick) {
  return onClick('a click');
}

// The shorthand: hand over the function itself
console.log(click(handleClick));

// Written out: a new function that calls it
console.log(click(function (event) { return handleClick(event); }));`,
        java: `import java.util.function.Function;

class Main {
  static String handleClick(String event) {
    return "saved by " + event;
  }

  // what a button does with its listener when it is clicked
  static String click(Function<String, String> onClick) {
    return onClick.apply("a click");
  }

  public static void main(String[] args) {
    System.out.println(click(Main::handleClick));
  }
}`,
        prints: ['saved by a click']
      }
    },
    {
      id: 'object-destructuring', title: 'Object destructuring', uilt: 'arrays',
      keywords: ['destructuring', 'destructure', 'props', 'default value', 'rename', 'record pattern'],
      says: '`const { name } = user` copies `user.name` into a new variable called `name`. In a parameter list, `function Card({ title })` does the same with the props object.',
      short: `const { name, role: job, city = 'Pune' } = user;

function Card({ title, size = 'md' }) {
  return <h2 className={size}>{title}</h2>;
}`,
      long: `const name = user.name;
const job = user.role;
const city = user.city === undefined ? 'Pune' : user.city;

function Card(props) {
  const title = props.title;
  const size = props.size === undefined ? 'md' : props.size;
  return <h2 className={size}>{title}</h2>;
}`,
      java: `record User(String name, String role, String city) {}

if (obj instanceof User(String name, String job, String city)) {
  // name, job and city are set here (Java 21)
}`,
      javaNote: 'Java 21\'s record patterns are the nearest: they take a record apart into variables. But Java matches by **position**, and only records; JavaScript matches by **name**, on any object, takes only the fields it wants, and can give a default.',
      trap: 'A default applies only when the field is `undefined`: `null`, `0` and `\'\'` keep their value. `{ role: job }` renames (it makes a variable `job`); it is not a type, though TypeScript\'s `role: string` looks the same. And destructuring `undefined` throws ("Cannot destructure property \'name\' of undefined"). See [[lesson:r-props]].',
      first: 'r-props', pattern: '\\bfunction\\s*[\\w$]*\\s*\\(\\s*\\{|\\(\\s*\\{[\\w$\\s,=:\'".]*\\}\\s*\\)\\s*=>|\\b(?:const|let)\\s*\\{',
      run: {
        js: `const user = { name: 'Ada', role: 'admin' };

{ // the shorthand
  const { name, role: job, city = 'Pune' } = user;
  console.log(name + ' / ' + job + ' / ' + city);
  const Card = ({ title, size = 'md' }) => title + ' (' + size + ')';
  console.log(Card({ title: 'Hello' }));
}
{ // written out
  const name = user.name;
  const job = user.role;
  const city = user.city === undefined ? 'Pune' : user.city;
  console.log(name + ' / ' + job + ' / ' + city);
  const Card = props => {
    const title = props.title;
    const size = props.size === undefined ? 'md' : props.size;
    return title + ' (' + size + ')';
  };
  console.log(Card({ title: 'Hello' }));
}`,
        java: `class Main {
  record User(String name, String role, String city) {}
  record CardProps(String title, String size) {}

  // a pattern has no defaults: the default is written out
  static String card(Object props) {
    if (props instanceof CardProps(String title, String size)) {
      return title + " (" + (size == null ? "md" : size) + ")";
    }
    return "";
  }

  public static void main(String[] args) {
    Object user = new User("Ada", "admin", null);
    if (user instanceof User(String name, String job, String city)) {
      System.out.println(name + " / " + job + " / " + (city == null ? "Pune" : city));
    }
    System.out.println(card(new CardProps("Hello", null)));
  }
}`,
        prints: ['Ada / admin / Pune', 'Hello (md)']
      }
    },
    {
      id: 'truthy-falsy', title: 'Truthy and falsy: &&, ||, ?? and ?.', uilt: 'basics',
      keywords: ['truthy', 'falsy', '&&', '||', '??', '?.', 'optional chaining', 'nullish coalescing', 'Optional', 'stray 0'],
      says: 'Any value can stand where a condition goes: `0`, `\'\'`, `null`, `undefined`, `NaN` and `false` count as false (they are "falsy"), everything else as true. `&&` and `||` give back one of their two sides, not `true` or `false`.',
      short: `{count && <Badge count={count} />}   // count 0: shows "0"
const label = name || 'Anonymous';
const size = props.size ?? 'md';
const city = user?.address?.city;`,
      long: `{count ? <Badge count={count} /> : count}
const label = name ? name : 'Anonymous';
const size = props.size !== null && props.size !== undefined
  ? props.size : 'md';
const address = user === null || user === undefined
  ? undefined : user.address;
const city = address === null || address === undefined
  ? undefined : address.city;`,
      java: `// a Java condition takes only a boolean
if (count != 0) { … }
String label = name.isEmpty() ? "Anonymous" : name;
String size = Optional.ofNullable(props.size()).orElse("md");
String city = Optional.ofNullable(user)
    .map(User::address).map(Address::city).orElse(null);`,
      javaNote: 'Java has none of this: an `if` takes only a `boolean`, so you write `count != 0` or `!name.isEmpty()`, and `Optional` does the work of `??` and `?.`. JavaScript\'s rule is looser, and it differs where it matters most: `0` and `\'\'` are false, though they are real values.',
      trap: '`{count && <Badge />}` with `count` at `0` draws a **0**: `0 && …` is `0`, and React draws numbers (it skips only `false`, `null` and `undefined`). Write `{count > 0 && <Badge />}`. And `||` replaces `0` and `\'\'` too: `quantity || 1` turns a real 0 into 1, where `quantity ?? 1` keeps it. See [[lesson:r-conditional]].',
      first: 'r-children', pattern: '[\\w$)\\]]\\s*&&\\s*\\(?\\s*<|\\?\\?|\\?\\.|\\|\\|',
      run: {
        js: `const count = 0, name = '', size = null, user = { address: null };

// The shorthand
console.log(count && 'badge');
console.log(name || 'Anonymous');
console.log(size ?? 'md');
console.log(user?.address?.city ?? 'no city');

// Written out
console.log(count ? 'badge' : count);
console.log(name ? name : 'Anonymous');
console.log(size !== null && size !== undefined ? size : 'md');
const address = user === null || user === undefined ? undefined : user.address;
const city = address === null || address === undefined ? undefined : address.city;
console.log(city !== null && city !== undefined ? city : 'no city');`,
        java: `import java.util.Optional;

class Main {
  record Address(String city) {}
  record User(Address address) {}

  public static void main(String[] args) {
    int count = 0;
    String name = "";
    String size = null;
    User user = new User(null);
    // a Java condition takes only a boolean: each test is written out
    System.out.println(count != 0 ? "badge" : String.valueOf(count));
    System.out.println(name.isEmpty() ? "Anonymous" : name);
    System.out.println(Optional.ofNullable(size).orElse("md"));
    System.out.println(Optional.ofNullable(user).map(User::address).map(Address::city).orElse("no city"));
  }
}`,
        prints: ['0', 'Anonymous', 'md', 'no city']
      }
    },
    {
      id: 'equality', title: 'Equality: === and !==', uilt: 'basics',
      keywords: ['===', '!==', '==', 'equals', 'equality', 'strict equality', 'compare', 'Object.is'],
      says: '`===` compares two values without converting either; `==` converts first, so `\'1\' == 1` is `true`. Write `===` and `!==` always. For objects, both ask "the same object?", never "the same fields?".',
      short: `if (status === 'done') { … }
if (count !== 0) { … }
a === b      // two objects: the same object?`,
      longLabel: 'What === does, written out',
      long: `// a === b: the same type, then the same value
(typeof a == typeof b) && a == b

// a !== b is its opposite
!((typeof a == typeof b) && a == b)`,
      java: `"done".equals(status)    // strings: equals
count != 0               // numbers: ==
a == b                   // objects: the same object?
a.equals(b)              // the same fields: JavaScript has no equals()`,
      javaNote: 'For numbers, strings and booleans, `===` gives what Java\'s `==` and `equals` give: JavaScript strings compare by value, so `status === \'done\'` is right, with no `.equals`. For objects and arrays, `===` is Java\'s `==` on references, and there is no `equals()` to override: two objects with the same fields are never `===`.',
      trap: 'React compares the same way. A new object is always "changed", even with the same fields, so an effect that depends on an object made during the render runs after every render ([[lesson:r-effect-deps]]); an object changed in place is "unchanged", so nothing re-renders ([[lesson:r-state-objects]]). `==` brings surprises of its own: `\'\' == 0` and `null == undefined` are both `true`.',
      first: 'r-conditional', pattern: '[!=]==',
      run: {
        js: `const a = { id: 1 };
const b = { id: 1 };

// The shorthand
console.log('1' === 1);
console.log(1 === 1);
console.log(a === b);
console.log(a === a);

// Written out: the same type, then the same value
function same(x, y) {
  return (typeof x == typeof y) && x == y;
}
console.log(same('1', 1));
console.log(same(1, 1));
console.log(same(a, b));
console.log(same(a, a));`,
        java: `class Main {
  static class Item {
    final int id;
    Item(int id) { this.id = id; }
  }

  public static void main(String[] args) {
    Item a = new Item(1);
    Item b = new Item(1);
    System.out.println("1".equals(1));   // a String is never an Integer
    System.out.println(1 == 1);
    System.out.println(a == b);          // two objects, not the same one
    System.out.println(a == a);
  }
}`,
        prints: ['false', 'true', 'false', 'true']
      }
    },
    {
      id: 'arrow-functions', title: 'Arrow functions', uilt: 'functions',
      keywords: ['=>', 'arrow', 'arrow function', 'lambda', 'anonymous function', 'fat arrow', 'implicit return'],
      says: '`x => x * 2` is a function that takes `x` and returns `x * 2`. With braces, `x => { … }` runs statements, and returns only what `return` gives.',
      short: `const double = x => x * 2;
const add = (a, b) => a + b;
const newUser = name => ({ name: name, likes: 0 });

<button onClick={() => setCount(count + 1)}>+1</button>
{items.map(item => <li key={item.id}>{item.name}</li>)}`,
      long: `const double = function (x) {
  return x * 2;
};
const add = function (a, b) {
  return a + b;
};
const newUser = function (name) {
  return { name: name, likes: 0 };
};`,
      java: `IntUnaryOperator twice = x -> x * 2;
IntBinaryOperator add = (a, b) -> a + b;
Function<String, User> newUser = name -> new User(name, 0);

button.addActionListener(e -> setCount(count + 1));`,
      javaNote: 'The same idea as a Java lambda, with `=>` for `->`. Two differences: a JavaScript function needs no interface (no `Function<…>` or `IntUnaryOperator` to choose), and it can read and change the variables around it, where a Java lambda may only read locals that never change ([[js:closures]]).',
      trap: 'Braces after `=>` start a body, not an object: `name => { name: name }` returns `undefined` (the `name:` is read as a label). Put an object in brackets: `name => ({ name: name })`. In the same way `x => { x * 2 }` returns nothing: drop the braces, or write `return`. Inside `map`, that gives a list of `undefined` and an empty screen.',
      first: 'r-lists-keys', pattern: '=>',
      run: {
        js: `const people = ['Ada', 'Linus'];

{ // the shorthand
  const double = x => x * 2;
  const add = (a, b) => a + b;
  const newUser = name => ({ name: name, likes: 0 });
  console.log(double(21));
  console.log(add(2, 3));
  console.log(people.map(newUser).map(u => u.name + ':' + u.likes).join(' '));
}
{ // written out
  const double = function (x) { return x * 2; };
  const add = function (a, b) { return a + b; };
  const newUser = function (name) { return { name: name, likes: 0 }; };
  console.log(double(21));
  console.log(add(2, 3));
  console.log(people.map(newUser).map(function (u) { return u.name + ':' + u.likes; }).join(' '));
}`,
        java: `import java.util.List;
import java.util.function.Function;
import java.util.function.IntBinaryOperator;
import java.util.function.IntUnaryOperator;
import java.util.stream.Collectors;

class Main {
  record User(String name, int likes) {}

  public static void main(String[] args) {
    List<String> people = List.of("Ada", "Linus");
    IntUnaryOperator twice = x -> x * 2;
    IntBinaryOperator add = (a, b) -> a + b;
    Function<String, User> newUser = name -> new User(name, 0);
    System.out.println(twice.applyAsInt(21));
    System.out.println(add.applyAsInt(2, 3));
    System.out.println(people.stream().map(newUser).map(u -> u.name() + ":" + u.likes()).collect(Collectors.joining(" ")));
  }
}`,
        prints: ['42', '5', 'Ada:0 Linus:0']
      }
    },
    {
      id: 'array-destructuring', title: 'Array destructuring', uilt: 'arrays',
      keywords: ['destructuring', 'array destructuring', 'const [', 'tuple', 'pair', 'setter'],
      says: '`const [count, setCount] = useState(0)` takes the first two items of the array that `useState` returns and names them, by position.',
      short: `const [count, setCount] = useState(0);
const [, setOnly] = useState(0);         // skip the first
const [first, second = 'none'] = items;  // a default`,
      long: `const pair = useState(0);
const count = pair[0];
const setCount = pair[1];

const first = items[0];
const second = items[1] === undefined ? 'none' : items[1];`,
      javaLabel: 'The nearest Java (it has none)',
      java: `// Java cannot take an array apart into variables.
// The nearest: a record, read by its accessors
record State(int value, IntUnaryOperator set) {}

State pair = useState(0);
int count = pair.value();
IntUnaryOperator setCount = pair.set();`,
      javaNote: 'Java has no equivalent: a method returns one value, and you read its parts by name (a record\'s accessors) or by index (`list.get(0)`). `useState` returns a two-item array so that **you** choose the names: `[count, setCount]` in one component, `[email, setEmail]` in the next.',
      trap: 'Only the position counts, not the name: `const [setCount, count] = useState(0)` silently swaps them, and `count` is now a function. A missing item is `undefined`, not an error. See [[lesson:r-state-basics]].',
      first: 'r-lists-keys', pattern: '\\b(?:const|let)\\s*\\[',
      run: {
        js: `// stands in for useState: an array of [value, setter]
function useCounter(start) {
  let value = start;
  return [value, next => { value = next; return value; }];
}
const items = ['a'];

{ // the shorthand
  const [count, setCount] = useCounter(5);
  console.log(count);
  console.log(setCount(count + 1));
  const [first, second = 'none'] = items;
  console.log(first + ' ' + second);
}
{ // written out
  const pair = useCounter(5);
  const count = pair[0];
  const setCount = pair[1];
  console.log(count);
  console.log(setCount(count + 1));
  const first = items[0];
  const second = items[1] === undefined ? 'none' : items[1];
  console.log(first + ' ' + second);
}`,
        java: `import java.util.List;
import java.util.function.IntUnaryOperator;

class Main {
  // what useState returns, as Java has to write it: a record with named parts
  record Counter(int value, IntUnaryOperator set) {}

  static Counter useCounter(int start) {
    int[] value = { start };
    return new Counter(value[0], next -> value[0] = next);
  }

  public static void main(String[] args) {
    Counter pair = useCounter(5);
    int count = pair.value();
    IntUnaryOperator setCount = pair.set();
    System.out.println(count);
    System.out.println(setCount.applyAsInt(count + 1));
    List<String> items = List.of("a");
    String first = items.get(0);
    String second = items.size() > 1 ? items.get(1) : "none";
    System.out.println(first + " " + second);
  }
}`,
        prints: ['5', '6', 'a none']
      }
    },
    {
      id: 'spread', title: 'Spread: copy with ...', uilt: 'arrays',
      keywords: ['...', 'spread', 'spread syntax', 'copy', 'shallow copy', 'immutable update', 'Object.assign'],
      says: '`...` inside `[ ]` or `{ }` copies every item of an array, or every field of an object, into the new one you are writing; what follows adds to it, or replaces a field.',
      short: `const next = [...items, newItem];
const older = { ...person, age: 31 };

setTodos([...todos, todo]);`,
      long: `const next = items.slice();     // a copy
next.push(newItem);

const older = Object.assign({}, person);
older.age = 31;`,
      java: `List<Item> next = new ArrayList<>(items);
next.add(newItem);

Person older = new Person(person.name(), 31, person.address());`,
      javaNote: '`[...items]` is `new ArrayList<>(items)`, and `{ ...person, age: 31 }` is a new record with one field changed. As in Java, the copy is **shallow**: a field that holds an object still points at the same object.',
      trap: 'One level deep only. `{ ...person }` makes a new person whose `address` is the **same** object as the old one\'s, so `copy.address.city = \'Chennai\'` changes the original too, and React, comparing the two addresses, sees no change. Copy each level you change: `{ ...person, address: { ...person.address, city } }`. See [[lesson:r-state-objects]].',
      first: 'r-lists-keys', pattern: '\\[\\s*\\.\\.\\.[\\w$]|(?:[=(,:?]|\\breturn)\\s*\\{\\s*\\.\\.\\.[\\w$]',
      run: {
        js: `const items = ['a', 'b'];
const person = { name: 'Ada', age: 30, address: { city: 'Pune' } };

{ // the shorthand
  const next = [...items, 'c'];
  const older = { ...person, age: 31 };
  console.log(next.join(' ') + ' / ' + items.join(' '));
  console.log(older.age + ' / ' + person.age);
  console.log('the same address object: ' + (older.address === person.address));
}
{ // written out
  const next = items.slice();
  next.push('c');
  const older = Object.assign({}, person);
  older.age = 31;
  console.log(next.join(' ') + ' / ' + items.join(' '));
  console.log(older.age + ' / ' + person.age);
  console.log('the same address object: ' + (older.address === person.address));
}`,
        java: `import java.util.ArrayList;
import java.util.List;

class Main {
  record Address(String city) {}
  record Person(String name, int age, Address address) {}

  public static void main(String[] args) {
    List<String> items = List.of("a", "b");
    Person person = new Person("Ada", 30, new Address("Pune"));
    List<String> next = new ArrayList<>(items);
    next.add("c");
    Person older = new Person(person.name(), 31, person.address());
    System.out.println(String.join(" ", next) + " / " + String.join(" ", items));
    System.out.println(older.age() + " / " + person.age());
    System.out.println("the same address object: " + (older.address() == person.address()));
  }
}`,
        prints: ['a b c / a b', '31 / 30', 'the same address object: true']
      }
    },
    {
      id: 'array-methods', title: 'Array methods: map, filter, find, some, reduce', uilt: 'arrays',
      keywords: ['map', 'filter', 'find', 'some', 'every', 'reduce', 'sort', 'toSorted', 'stream', 'streams', 'array methods'],
      says: 'Arrays carry Java\'s stream operations: `map` and `filter` return a **new** array and leave the old one alone, `find` returns the first match, `some` says whether there is one, and `reduce` folds the array into one value.',
      short: `const names = users.filter(u => u.age > 30).map(u => u.name);
const linus = users.find(u => u.name === 'Linus');
const anyOver40 = users.some(u => u.age > 40);
const total = users.reduce((sum, u) => sum + u.age, 0);
const sorted = names.toSorted();`,
      longLabel: 'Written out, with loops',
      long: `const names = [];
for (const u of users) {
  if (u.age > 30) names.push(u.name);
}
let linus;
for (const u of users) {
  if (u.name === 'Linus') { linus = u; break; }
}
let total = 0;
for (const u of users) total = total + u.age;`,
      java: `List<String> names = users.stream()
    .filter(u -> u.age() > 30).map(User::name).toList();
Optional<User> linus = users.stream()
    .filter(u -> u.name().equals("Linus")).findFirst();
boolean anyOver40 = users.stream().anyMatch(u -> u.age() > 40);
int total = users.stream().mapToInt(User::age).sum();`,
      javaNote: 'The same operations as Java streams, called on the array itself: no `.stream()`, no `.collect(…)`, and each step builds a real array at once, with no laziness. `find` returns the item or `undefined`, not an `Optional`.',
      trap: '`sort` and `reverse` are the exceptions: they change the array **in place**, as `Collections.sort` does, and return that same array. On state, that is a change React cannot see. Copy first, `[...items].sort()`, or use `toSorted()` and `toReversed()`, which return new arrays. See [[lesson:r-state-arrays]].',
      first: 'r-lists-keys', pattern: '\\.(?:map|filter|find|findIndex|some|every|reduce|sort|toSorted|reverse|includes)\\(',
      run: {
        js: `const users = [
  { name: 'Ada', age: 36 },
  { name: 'Linus', age: 28 },
  { name: 'Grace', age: 45 }
];

// The shorthand
console.log(users.filter(u => u.age > 30).map(u => u.name).join(', '));
console.log(users.find(u => u.name === 'Linus').age);
console.log(users.some(u => u.age > 40));
console.log(users.reduce((sum, u) => sum + u.age, 0));
console.log(users.map(u => u.name).toSorted().join(', ') + ' / ' + users[0].name);

// Written out, with loops
const names = [];
for (const u of users) if (u.age > 30) names.push(u.name);
console.log(names.join(', '));
let linus;
for (const u of users) if (u.name === 'Linus') { linus = u; break; }
console.log(linus.age);
let any = false;
for (const u of users) if (u.age > 40) any = true;
console.log(any);
let total = 0;
for (const u of users) total = total + u.age;
console.log(total);
const sorted = [];
for (const u of users) sorted.push(u.name);
sorted.sort();
console.log(sorted.join(', ') + ' / ' + users[0].name);`,
        java: `import java.util.List;
import java.util.stream.Collectors;

class Main {
  record User(String name, int age) {}

  public static void main(String[] args) {
    List<User> users = List.of(new User("Ada", 36), new User("Linus", 28), new User("Grace", 45));
    System.out.println(users.stream().filter(u -> u.age() > 30).map(User::name).collect(Collectors.joining(", ")));
    System.out.println(users.stream().filter(u -> u.name().equals("Linus")).findFirst().orElseThrow().age());
    System.out.println(users.stream().anyMatch(u -> u.age() > 40));
    System.out.println(users.stream().mapToInt(User::age).sum());
    System.out.println(users.stream().map(User::name).sorted().collect(Collectors.joining(", ")) + " / " + users.get(0).name());
  }
}`,
        prints: ['Ada, Grace', '28', 'true', '109', 'Ada, Grace, Linus / Ada']
      }
    },
    {
      id: 'template-literals', title: 'Template literals', uilt: 'basics',
      keywords: ['template literal', 'template string', 'backtick', 'interpolation', 'string interpolation', '${', 'formatted'],
      says: 'A string in backticks can hold `${expression}`: the value is put into the text. It may also run over several lines.',
      short: `const label = \`Clicked \${count} times\`;

<div className={\`tab \${active ? 'tab-on' : ''}\`}>…</div>`,
      long: `const label = 'Clicked ' + count + ' times';

<div className={'tab ' + (active ? 'tab-on' : '')}>…</div>`,
      java: `String label = "Clicked " + count + " times";
String same = "Clicked %d times".formatted(count);`,
      javaNote: 'Java\'s `+` and `formatted()` do the same job. Java has text blocks (`"""`) for several lines, but nothing that puts a variable into the text itself: string templates were previewed in Java 21 and 22, then withdrawn.',
      trap: 'Only backticks work: `\'Clicked ${count}\'`, in plain quotes, prints `${count}` as it is. The lessons here mostly build their strings with `+` (lesson 7 logs a click with a template literal), but most React code you read uses template literals, often inside a `className`.',
      first: 'r-events', pattern: '`[^`\\n]*\\$\\{',
      run: {
        js: `const count = 3;
const active = true;

// The shorthand
console.log(\`Clicked \${count} times\`);
console.log(\`tab \${active ? 'tab-on' : ''}\`);
console.log(\`\${count} + \${count} = \${count + count}\`);

// Written out
console.log('Clicked ' + count + ' times');
console.log('tab ' + (active ? 'tab-on' : ''));
console.log(count + ' + ' + count + ' = ' + (count + count));`,
        java: `class Main {
  public static void main(String[] args) {
    int count = 3;
    boolean active = true;
    System.out.println("Clicked " + count + " times");
    System.out.println("tab " + (active ? "tab-on" : ""));
    System.out.println("%d + %d = %d".formatted(count, count, count + count));
  }
}`,
        prints: ['Clicked 3 times', 'tab tab-on', '3 + 3 = 6']
      }
    },
    {
      id: 'closures', title: 'Closures', uilt: 'functions',
      keywords: ['closure', 'closures', 'captured variable', 'scope', 'snapshot', 'effectively final'],
      says: 'A function keeps the variables of the place where it was made, for as long as the function lives. In React, each render makes its own functions, and each keeps that render\'s props and state.',
      short: `function render(count) {     // as React calls a component
  function handleClick() {
    return 'this render saw ' + count;
  }
  return handleClick;
}
const fromFirst = render(0);
const fromSecond = render(1);
fromFirst();    // 'this render saw 0'`,
      longLabel: 'The same, as an object',
      long: `class Handler {
  constructor(count) {
    this.count = count;   // the kept variable, as a field
  }
  call() {
    return 'this render saw ' + this.count;
  }
}
const fromFirst = new Handler(0);
fromFirst.call();   // 'this render saw 0'`,
      java: `Supplier<String> render(int count) {
  return () -> "this render saw " + count;  // count: effectively final
}
Supplier<String> fromFirst = render(0);
fromFirst.get();   // "this render saw 0"`,
      javaNote: 'A Java lambda captures local variables too, but only **effectively final** ones, so what it saw can never change. A JavaScript closure keeps the variable itself: if the variable changes later, the closure sees the change. React steers clear of that by giving every render its own `const` values, so each render\'s functions see that render for ever: a snapshot ([[lesson:r-state-snapshot]]).',
      trap: 'A function made in one render and called much later still sees that render\'s values: the **stale closure**. An interval started once, in an effect with `[]`, calls `setCount(count + 1)` with the first render\'s `count` for ever, so the count sticks at 1. Use the updater, `setCount(c => c + 1)`, or list the value as a dependency. Step through it in [[explain:stale-closure]].',
      first: 'r-state-snapshot',
      run: {
        js: `// The shorthand: a closure keeps the count of the render that made it
function render(count) {
  function handleClick() {
    return 'this render saw ' + count;
  }
  return handleClick;
}
const fromFirst = render(0);
const fromSecond = render(1);
console.log(fromFirst());
console.log(fromSecond());

// Written out: the kept variable, as an object's field
class Handler {
  constructor(count) {
    this.count = count;
  }
  call() {
    return 'this render saw ' + this.count;
  }
}
const longFirst = new Handler(0);
const longSecond = new Handler(1);
console.log(longFirst.call());
console.log(longSecond.call());`,
        java: `import java.util.function.Supplier;

class Main {
  // as React calls a component: once per render
  static Supplier<String> render(int count) {
    return () -> "this render saw " + count;   // count is effectively final
  }

  public static void main(String[] args) {
    Supplier<String> fromFirst = render(0);
    Supplier<String> fromSecond = render(1);
    System.out.println(fromFirst.get());
    System.out.println(fromSecond.get());
  }
}`,
        prints: ['this render saw 0', 'this render saw 1']
      }
    },
    {
      id: 'object-shorthand', title: 'Object shorthand and computed keys', uilt: 'arrays',
      keywords: ['shorthand property', 'computed key', 'computed property', '[key]: value', 'object literal', 'Map', 'put'],
      says: '`{ name, email }` is short for `{ name: name, email: email }`. `{ [key]: value }` uses the **value** of `key` as the name of the field.',
      short: `const user = { name, email };

setForm({ ...form, [e.target.name]: e.target.value });`,
      long: `const user = { name: name, email: email };

const next = Object.assign({}, form);
next[e.target.name] = e.target.value;
setForm(next);`,
      java: `Map<String, String> next = new HashMap<>(form);
next.put(field, value);`,
      javaNote: 'An object used this way is a `Map<String, …>`: `obj[key] = value` is `map.put(key, value)`, and a computed key does the `put` while the object is written. Java has no shorthand for `name: name`; a record\'s constructor takes its values by position.',
      trap: 'Without the brackets the key is the word itself: `{ field: value }` makes a field called `field`, whatever `field` holds. The computed key is how one `handleChange` serves every input: each input\'s `name` is the field it updates. See [[lesson:r-state-objects]] and [[lesson:r-forms]].',
      first: 'r-state-objects', pattern: '\\{\\s*\\[[^\\]\\n]+\\]\\s*:|(?:=|\\breturn)\\s*\\{\\s*[\\w$]+\\s*,\\s*[\\w$]+\\s*[,}]',
      run: {
        js: `const name = 'Ada';
const email = 'ada@example.com';
const form = { name: 'Ada', city: 'Pune' };
const field = 'city';
const value = 'Chennai';

{ // the shorthand
  const user = { name, email };
  const next = { ...form, [field]: value };
  console.log(user.name + ' ' + user.email);
  console.log(next.name + ' ' + next.city + ' / ' + form.city);
}
{ // written out
  const user = { name: name, email: email };
  const next = Object.assign({}, form);
  next[field] = value;
  console.log(user.name + ' ' + user.email);
  console.log(next.name + ' ' + next.city + ' / ' + form.city);
}`,
        java: `import java.util.HashMap;
import java.util.Map;

class Main {
  record User(String name, String email) {}

  public static void main(String[] args) {
    String name = "Ada";
    String email = "ada@example.com";
    Map<String, String> form = Map.of("name", "Ada", "city", "Pune");
    String field = "city";
    String value = "Chennai";
    User user = new User(name, email);
    Map<String, String> next = new HashMap<>(form);
    next.put(field, value);
    System.out.println(user.name() + " " + user.email());
    System.out.println(next.get("name") + " " + next.get("city") + " / " + form.get("city"));
  }
}`,
        prints: ['Ada ada@example.com', 'Ada Chennai / Pune']
      }
    },
    {
      id: 'async-await', title: 'Promises, async and await', uilt: 'fetch',
      keywords: ['async', 'await', 'promise', 'promises', 'then', 'catch', 'fetch', 'CompletableFuture', 'future'],
      says: 'A Promise is a value that arrives later. Inside an `async` function, `await` waits for it without freezing the page; `.then(…)` is the same wait, written as a callback.',
      short: `async function loadUser(id) {
  const res = await fetch('/api/users/' + id);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

try {
  const user = await loadUser(1);
} catch (e) { … }`,
      long: `function loadUser(id) {
  return fetch('/api/users/' + id).then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

loadUser(1)
  .then(user => { … })
  .catch(e => { … });`,
      java: `CompletableFuture<User> user = CompletableFuture
    .supplyAsync(() -> client.get("/api/users/" + id))
    .thenApply(res -> res.body());

User u = user.join();   // blocks the thread: await does not`,
      javaNote: 'A Promise is a `CompletableFuture`, and `.then` is `thenApply` (or `thenCompose`, when the callback returns another Promise). The difference is in the waiting: `await` pauses only its `async` function, and the page keeps answering clicks, where Java\'s `join()` blocks the whole thread. A page has one thread, so nothing may block it.',
      trap: 'Forget `await` and you hold the Promise, not the data: `user.name` is `undefined`. An `async` function always returns a Promise, which is why an effect cannot be `async` itself: write the async function inside the effect, and call it ([[lesson:r-fetching]]). And `fetch` does not throw on a 404 or a 500: check `res.ok`.',
      first: 'r-fetching', pattern: '\\bawait\\b|\\basync\\b|\\.then\\(',
      run: {
        js: `// stand in for requests: Promises that settle after ms
function later(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
function failLater(ms, message) {
  return new Promise((resolve, reject) => setTimeout(() => reject(new Error(message)), ms));
}

// The shorthand: async and await
async function shortForm() {
  const user = await later(30, { name: 'Ada' });
  console.log('Hello, ' + user.name);
  try {
    await failLater(30, 'offline');
  } catch (e) {
    console.log('failed: ' + e.message);
  }
}

// Written out: then and catch
function longForm() {
  return later(30, { name: 'Ada' })
    .then(user => { console.log('Hello, ' + user.name); })
    .then(() => failLater(30, 'offline'))
    .catch(e => { console.log('failed: ' + e.message); });
}

await shortForm();
await longForm();`,
        java: `import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

class Main {
  record User(String name) {}

  public static void main(String[] args) {
    CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> new User("Ada"));
    System.out.println(user.thenApply(u -> "Hello, " + u.name()).join());
    CompletableFuture<User> failing = CompletableFuture.supplyAsync(() -> { throw new RuntimeException("offline"); });
    try {
      failing.join();
    } catch (CompletionException e) {
      System.out.println("failed: " + e.getCause().getMessage());
    }
  }
}`,
        prints: ['Hello, Ada', 'failed: offline']
      }
    },
    {
      id: 'rest', title: 'Rest: ...rest and {...props}', uilt: 'functions',
      keywords: ['...', 'rest', 'rest parameters', '...rest', '{...props}', 'spread props', 'varargs', 'arguments'],
      says: 'In a parameter list or a destructuring, `...` gathers **the rest** into one array or object. In JSX, `{...rest}` spreads that object back out as props.',
      short: `function Input({ label, ...rest }) {
  return <label>{label} <input {...rest} /></label>;
}

function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}`,
      long: `function Input(props) {
  const label = props.label;
  const rest = Object.assign({}, props);
  delete rest.label;
  return <label>{label} {createElement('input', rest)}</label>;
}

function sum() {
  const nums = Array.from(arguments);
  return nums.reduce(function (a, b) { return a + b; }, 0);
}`,
      java: `int sum(int... nums) {
  return IntStream.of(nums).sum();
}

// "every other field": copy the map, remove one
Map<String, Object> rest = new LinkedHashMap<>(props);
rest.remove("label");`,
      javaNote: '`...nums` in a parameter list is Java\'s varargs, `int... nums`, and in both it must come last. Gathering "every other field" has no Java syntax: with props as a `Map`, you copy it and remove what you took. `<input {...rest} />` is what JSX turns into `createElement(\'input\', rest)`.',
      trap: 'Where `{...rest}` goes decides who wins: in `<input {...rest} type="text" />` the type is always `text`, while `<input type="text" {...rest} />` lets the parent override it. And `rest` passes on everything, props the element does not understand included: React warns about an unknown `onPick` on an `<input>`. See [[lesson:r-dom-refs]].',
      first: 'r-dom-refs', pattern: ',\\s*\\.\\.\\.[\\w$]+\\s*\\}\\s*\\)|,\\s*\\.\\.\\.[\\w$]+\\s*\\]\\s*=|<[A-Za-z][\\w.]*\\s[^<>]*\\{\\s*\\.\\.\\.[\\w$]+\\s*\\}|\\(\\s*\\.\\.\\.[\\w$]+\\s*\\)\\s*(?:=>|\\{)',
      run: {
        js: `import { createElement } from 'react';

const rest = { type: 'email', required: true };

{ // the shorthand
  const describe = ({ label, ...others }) => label + ': ' + Object.keys(others).join(', ');
  const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
  console.log(describe({ label: 'Email', ...rest }));
  console.log(sum(1, 2, 3));
  console.log(Object.keys((<input {...rest} />).props).join(', '));
}
{ // written out
  const describe = function (props) {
    const label = props.label;
    const others = Object.assign({}, props);
    delete others.label;
    return label + ': ' + Object.keys(others).join(', ');
  };
  const sum = function () {
    const nums = Array.from(arguments);
    return nums.reduce(function (a, b) { return a + b; }, 0);
  };
  console.log(describe(Object.assign({ label: 'Email' }, rest)));
  console.log(sum(1, 2, 3));
  console.log(Object.keys(createElement('input', rest).props).join(', '));
}`,
        java: `import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.IntStream;

class Main {
  static String describe(Map<String, Object> props) {
    Object label = props.get("label");
    Map<String, Object> others = new LinkedHashMap<>(props);
    others.remove("label");
    return label + ": " + String.join(", ", others.keySet());
  }

  static int sum(int... nums) {
    return IntStream.of(nums).sum();
  }

  public static void main(String[] args) {
    Map<String, Object> rest = new LinkedHashMap<>();
    rest.put("type", "email");
    rest.put("required", true);
    Map<String, Object> props = new LinkedHashMap<>();
    props.put("label", "Email");
    props.putAll(rest);
    System.out.println(describe(props));
    System.out.println(sum(1, 2, 3));
    System.out.println(String.join(", ", rest.keySet()));
  }
}`,
        prints: ['Email: type, required', '6', 'type, required']
      }
    }
  ];
})(window.RLT);
