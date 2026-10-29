/*
 * Playground starter templates (the "Start from a template…" menu). Shape: {id, title, html, css, js}
 */
(function (U) {
  var BASE = 'body {\n  font-family: system-ui, sans-serif;\n  margin: 16px;\n  color: #1d2433;\n}';

  U.data.templates = [
    {
      id: 'blank', title: 'Blank page',
      html: '<h1>Hello!</h1>\n<p>Start typing. The preview follows.</p>',
      css: BASE,
      js: ''
    },
    {
      id: 'card', title: 'Profile card',
      html: '<article class="card">\n  <img src="avatar.svg" alt="Avatar" class="avatar">\n  <h2>Ravi</h2>\n  <p class="role">Backend developer</p>\n  <p>Java, Spring Boot and SQL - now learning the front end.</p>\n  <a class="btn" href="#">Contact</a>\n</article>',
      css: BASE + '\n\n.card {\n  max-width: 260px;\n  margin: 0 auto;\n  padding: 24px;\n  text-align: center;\n  border-radius: 14px;\n  box-shadow: 0 6px 24px rgb(0 0 0 / 12%);\n}\n\n.avatar {\n  width: 96px;\n  border-radius: 50%;\n}\n\n.role {\n  color: #6b7385;\n  margin-top: -8px;\n}\n\n.btn {\n  display: inline-block;\n  padding: 8px 18px;\n  border-radius: 999px;\n  background: #4353c9;\n  color: white;\n  text-decoration: none;\n}',
      js: ''
    },
    {
      id: 'form', title: 'Sign-up form with validation',
      html: '<form id="signup" novalidate>\n  <h2>Create an account</h2>\n  <label>Email\n    <input name="email" type="email" required>\n  </label>\n  <label>Password\n    <input name="password" type="password" minlength="8" required>\n  </label>\n  <button>Sign up</button>\n  <p id="msg" role="status"></p>\n</form>',
      css: BASE + '\n\nform {\n  display: grid;\n  gap: 12px;\n  max-width: 320px;\n}\n\nlabel {\n  display: grid;\n  gap: 4px;\n  font-weight: 600;\n}\n\ninput {\n  padding: 8px;\n  border: 1px solid #b9bfd0;\n  border-radius: 6px;\n  font: inherit;\n}\n\ninput:focus {\n  outline: 2px solid #4353c9;\n}\n\nbutton {\n  padding: 10px;\n  border: 0;\n  border-radius: 6px;\n  background: #4353c9;\n  color: white;\n  font: inherit;\n}\n\n#msg {\n  min-height: 1.5em;\n}',
      js: 'const form = document.querySelector("#signup");\nconst msg = document.querySelector("#msg");\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  if (!form.checkValidity()) {\n    msg.textContent = "Please enter a valid email and a password of 8+ characters.";\n    msg.style.color = "crimson";\n    return;\n  }\n  const data = Object.fromEntries(new FormData(form));\n  msg.textContent = "Welcome, " + data.email + "!";\n  msg.style.color = "green";\n  console.log(data);\n});'
    },
    {
      id: 'flex-nav', title: 'Flexbox navbar and hero',
      html: '<header class="nav">\n  <strong class="logo">MySite</strong>\n  <nav>\n    <a href="#">Home</a>\n    <a href="#">Blog</a>\n    <a href="#">About</a>\n  </nav>\n</header>\n<section class="hero">\n  <h1>Build pages you understand</h1>\n  <p>Flexbox centres this text both ways.</p>\n</section>',
      css: 'body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}\n\n.nav {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 20px;\n  background: #1d2433;\n  color: white;\n}\n\n.nav nav {\n  display: flex;\n  gap: 16px;\n}\n\n.nav a {\n  color: white;\n  text-decoration: none;\n}\n\n.nav a:hover {\n  text-decoration: underline;\n}\n\n.hero {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  min-height: 260px;\n  text-align: center;\n  background: linear-gradient(135deg, #4353c9, #ff7a1a);\n  color: white;\n}',
      js: ''
    },
    {
      id: 'grid-gallery', title: 'Responsive grid gallery',
      html: '<h2>Gallery</h2>\n<div class="gallery">\n  <img src="landscape.svg" alt="Hills">\n  <img src="portrait.svg" alt="A tree">\n  <img src="landscape.svg" alt="Hills again">\n  <img src="avatar.svg" alt="Avatar">\n  <img src="portrait.svg" alt="Another tree">\n  <img src="landscape.svg" alt="More hills">\n</div>\n<p>Resize the preview (or use the Phone button): the number of columns adapts by itself.</p>',
      css: BASE + '\n\n.gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));\n  gap: 10px;\n}\n\n.gallery img {\n  width: 100%;\n  aspect-ratio: 1;\n  object-fit: cover;\n  border-radius: 8px;\n}',
      js: ''
    },
    {
      id: 'counter', title: 'Counter (events)',
      html: '<div class="counter">\n  <button id="minus" aria-label="Decrease">−</button>\n  <output id="count">0</output>\n  <button id="plus" aria-label="Increase">+</button>\n</div>',
      css: BASE + '\n\n.counter {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  font-size: 32px;\n}\n\nbutton {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  border: 0;\n  background: #4353c9;\n  color: white;\n  font-size: 24px;\n  cursor: pointer;\n}',
      js: 'let count = 0;\nconst out = document.querySelector("#count");\n\ndocument.querySelector("#plus").addEventListener("click", () => {\n  count++;\n  out.textContent = count;\n});\n\ndocument.querySelector("#minus").addEventListener("click", () => {\n  count--;\n  out.textContent = count;\n});'
    },
    {
      id: 'fetch-users', title: 'Fetch users from the pretend API',
      html: '<h2>Team</h2>\n<p id="status">Loading…</p>\n<div id="team" class="team"></div>',
      css: BASE + '\n\n.team {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));\n  gap: 12px;\n}\n\n.person {\n  padding: 12px;\n  border: 1px solid #d9dde8;\n  border-radius: 10px;\n}\n\n.person small {\n  color: #6b7385;\n}',
      js: '// The preview answers fetch("/api/...") with a pretend server.\n// Try also: /api/users/2, /api/todos, /api/slow, /api/error\nasync function load() {\n  const status = document.querySelector("#status");\n  try {\n    const res = await fetch("/api/users");\n    if (!res.ok) throw new Error("HTTP " + res.status);\n    const users = await res.json();\n    const team = document.querySelector("#team");\n    users.forEach(u => {\n      const card = document.createElement("div");\n      card.className = "person";\n      card.innerHTML = "<b></b><br><small></small>";\n      card.querySelector("b").textContent = u.name;\n      card.querySelector("small").textContent = u.role + " · " + u.email;\n      team.append(card);\n    });\n    status.textContent = users.length + " people";\n  } catch (err) {\n    status.textContent = "Failed: " + err.message;\n  }\n}\nload();'
    },
    {
      id: 'landing', title: 'Small landing page',
      html: '<header class="top">\n  <strong>CodeChai</strong>\n  <a class="btn" href="#signup">Get started</a>\n</header>\n\n<main>\n  <section class="hero">\n    <h1>Learn to build the web</h1>\n    <p>Short lessons, live examples, real projects.</p>\n  </section>\n\n  <section class="features">\n    <article><h3>HTML</h3><p>Structure and meaning.</p></article>\n    <article><h3>CSS</h3><p>Colours, spacing and layout.</p></article>\n    <article><h3>JavaScript</h3><p>Behaviour and data.</p></article>\n  </section>\n\n  <section id="signup" class="signup">\n    <h2>Join the waitlist</h2>\n    <form>\n      <input type="email" name="email" placeholder="you@example.com" required>\n      <button class="btn">Notify me</button>\n    </form>\n  </section>\n</main>\n\n<footer>© 2026 CodeChai</footer>',
      css: '* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  color: #1d2433;\n  line-height: 1.5;\n}\n\n.top {\n  position: sticky;\n  top: 0;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 20px;\n  background: white;\n  box-shadow: 0 1px 6px rgb(0 0 0 / 10%);\n}\n\n.btn {\n  display: inline-block;\n  padding: 8px 16px;\n  border: 0;\n  border-radius: 8px;\n  background: #4353c9;\n  color: white;\n  text-decoration: none;\n  font: inherit;\n}\n\n.hero {\n  padding: 60px 20px;\n  text-align: center;\n  background: linear-gradient(135deg, #eef1fb, #ffe7c2);\n}\n\n.hero h1 {\n  font-size: clamp(28px, 6vw, 48px);\n  margin: 0 0 8px;\n}\n\n.features {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));\n  gap: 16px;\n  max-width: 900px;\n  margin: 40px auto;\n  padding: 0 20px;\n}\n\n.features article {\n  padding: 20px;\n  border-radius: 12px;\n  background: #f6f7fb;\n}\n\n.signup {\n  text-align: center;\n  padding: 40px 20px;\n}\n\n.signup form {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 8px;\n}\n\n.signup input {\n  padding: 8px 12px;\n  border: 1px solid #b9bfd0;\n  border-radius: 8px;\n  font: inherit;\n  min-width: 220px;\n}\n\nfooter {\n  padding: 20px;\n  text-align: center;\n  color: #6b7385;\n}',
      js: 'document.querySelector(".signup form").addEventListener("submit", (e) => {\n  e.preventDefault();\n  e.target.innerHTML = "<p>Thanks! We will be in touch.</p>";\n});'
    }
  ];
})(window.UILT);
