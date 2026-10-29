/*
 * lessons-arch.js - the Software architecture track: design docs and decision records, design
 * reviews, quality requirements and trade-offs, C4 diagrams, monolith or microservices, migrations,
 * API versioning, SLOs and error budgets, and Conway's law.
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-arch.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'rfcs-and-adrs', track: 'arch', minutes: 7,
      title: 'Design docs and decision records',
      summary: 'When to write a design doc (an RFC) before building, what goes in it, and how a one-page decision record (an ADR) stops the same argument from coming back every six months.',
      keywords: ['rfc', 'design doc', 'design document', 'adr', 'architecture decision record', 'decision record', 'nygard', 'madr', 'technical design', 'write it down'],
      body: `## Two documents, two jobs
- A **design doc** (many companies call it an RFC, a "request for comments") is written **before** building: the problem, the options and the proposal, so reviewers can find the problems while they are cheap to fix.
- A **decision record** (an architecture decision record, ADR) is written **when a decision is made**: one page saying what was decided, why, and what it costs. It is for the person who joins in a year and asks "why on earth did we do it this way?"

## When to write a design doc
Not for every change. Write one when the change is **expensive to reverse**, **crosses teams**, or has **real alternatives** that people will disagree about: a new service, a new datastore, a payment flow, a migration. Google's design-doc culture, as Malte Ubl describes it, keeps them short and informal: the value is in thinking it through and in the discussion, not in the format.

## What goes in it
- **The problem and the goals,** with numbers where possible, and **non-goals**.
- **Quality requirements** with numbers: speed, load, availability, security, cost.
- **The proposed design:** the parts, the data, the flow.
- **Alternatives,** including doing nothing, with why each was turned down.
- **Risks, trade-offs, and how it rolls out and rolls back.**
- **A decider and a date.** Without them, a design doc collects comments for weeks.

## Decision records
Michael Nygard proposed the format in 2011: a short numbered file kept with the code, with a **title**, a **status** (proposed, accepted, superseded), the **context**, the **decision** ("We will…") and the **consequences**, good and bad. MADR adds the options considered and the criteria. Rules that keep them useful:
- **One decision per record,** written the day it is made.
- **Never edit an accepted record.** When the decision changes, write a new one that supersedes it, and link the two.
- **Write the bad consequences.** The costs you accepted on purpose are what the next person most needs.

## For a lead
You do not have to write every document yourself. Ask for them, review them, and make sure decisions end in a record. A team that writes its decisions down argues less, onboards faster and repeats fewer mistakes.

The [[tool:rfc]] and the [[tool:adr]] build both documents and check what is missing.`,
      analogy: `A design doc is a pull request for the architecture: reviewed before it is merged, while changes are cheap. A decision record is the commit message: it says why, for the person running "git blame" two years from now.`,
      mistakes: [
        `Deciding big designs on a call, with nothing written down.`,
        `A design doc that only describes the chosen solution, with no alternatives.`,
        `A design doc with no decider and no date, stuck in review for weeks.`,
        `Decision records that list only the benefits.`,
        `Editing an old decision record instead of writing a new one that supersedes it.`
      ],
      say: [
        `"Before we build this, can you write a two-page design doc with two alternatives? Neha decides on Thursday."`,
        `"I'll write an ADR today: the decision, the options we turned down and why, and when we'd revisit it."`,
        `"This decision changed, so let's write ADR-019 that supersedes ADR-007, rather than editing the old one."`
      ],
      sources: [
        `Michael Nygard, "Documenting Architecture Decisions" (Cognitect blog, November 2011)`,
        `MADR, Markdown Architectural Decision Records (adr.github.io)`,
        `Malte Ubl, "Design Docs at Google" (industrialempathy.com, 2020)`,
        `Titus Winters, Tom Manshreck and Hyrum Wright (eds.), *Software Engineering at Google* (O'Reilly, 2020), on design documents`
      ],
      related: ['tool:rfc', 'tool:adr', 'scenario:why-did-we-choose-kafka', 'scenario:rfc-stuck-in-review', 'scenario:decision-reversed', 'phrase:arch-decision-record', 'phrase:arch-alternatives', 'term:rfc', 'term:decision-record']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'design-reviews', track: 'arch', minutes: 6,
      title: 'Design reviews that decide',
      summary: 'How to run a design review that finds real problems and ends in a decision, how to review someone else\'s design, and what to do when the review turns into an argument.',
      keywords: ['design review', 'architecture review', 'review meeting', 'premortem', 'disagree and commit', 'decision', 'reviewers', 'feedback on design', 'atam'],
      body: `## Before the meeting
- **Send the doc two or three days before,** and ask for comments in the doc. Most issues can be settled in writing.
- **Invite the people who can find problems:** the teams you depend on, security, operations, the person who will be on-call for it. Not the whole department.
- **Name the decider** and say so in the invite. Reviewers advise; one person decides.

## In the meeting
- **Start from the open questions,** not a walkthrough of the doc: people have read it.
- **Run a premortem** (Gary Klein's technique): *"It is six months from now and this design has failed. What went wrong?"* People who would never criticise a senior's design in the abstract will happily imagine a failure.
- **Walk the failure modes:** what happens when a dependency is slow, a message arrives twice, the database fails over, traffic is ten times normal?
- **Check the quality requirements** against the numbers in the doc, not against feelings.
- **End with a decision,** or with exactly what is needed to make one, by when, and who brings it.

## Reviewing someone else's design
- **Ask questions that expose risk,** rather than proposing your own design: *"What happens to in-flight refunds during the migration?"*
- **Separate blocking concerns from preferences.** Say which is which.
- **Bring evidence:** a past incident, a load number, a constraint they may not know.

## When it becomes an argument
Move it from opinions to criteria: *"We agree the goals are X and Y. Which option serves Y better, and how would we know?"* If two options are close, pick one and move on: a fast reversible decision beats a slow perfect one. Once the decider decides, everyone commits, including people who disagreed: Amazon calls it "disagree and commit". Write the decision in a record ([[tool:adr]]), with the dissent noted if it matters.

## As the lead
You are often the facilitator, not the cleverest reviewer. Make sure the quiet engineer who will run it in production gets heard, and that the most senior voice in the room is not the only one that counts.`,
      analogy: `A design review is a chaos experiment run on paper: you inject the failures (a slow dependency, a duplicate message, ten times the traffic) and watch the design, before production does it for you at 3 am.`,
      mistakes: [
        `A walkthrough of slides nobody read beforehand.`,
        `No decider, so the review ends with "let's discuss more".`,
        `Reviewers redesigning the system to their taste instead of finding risks.`,
        `The most senior person's opinion winning because nobody asks for evidence.`,
        `Reopening the decision in every later meeting.`
      ],
      say: [
        `"It's six months from now and this design has failed. What went wrong?"`,
        `"Is that a blocking concern or a preference? Both are fine; I just want to record it right."`,
        `"We have two good options. Neha, it's your call; whichever you choose, we commit to it."`
      ],
      sources: [
        `Gary Klein, "Performing a Project Premortem", *Harvard Business Review*, September 2007`,
        `Rick Kazman, Mark Klein and Paul Clements, *ATAM: Method for Architecture Evaluation* (Software Engineering Institute, 2000)`,
        `Amazon, "Leadership Principles": "Have Backbone; Disagree and Commit"`,
        `Malte Ubl, "Design Docs at Google" (industrialempathy.com, 2020), on the review process`
      ],
      related: ['tool:rfc', 'scenario:rfc-stuck-in-review', 'scenario:architect-disagree', 'scenario:design-argument', 'phrase:disagree-options', 'phrase:disagree-commit', 'term:disagree-and-commit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'nfrs-tradeoffs', track: 'arch', minutes: 7,
      title: 'Quality requirements and trade-offs',
      summary: 'Why speed, load, availability and security shape the architecture more than features do, how to turn "fast" and "scalable" into testable numbers, and how to talk about trade-offs.',
      keywords: ['nfr', 'nfrs', 'non-functional requirements', 'quality attributes', 'trade-off', 'tradeoffs', 'latency', 'p95', 'scalability', 'availability', 'performance', 'iso 25010'],
      body: `## Why they decide the architecture
Two systems with the same features can need completely different designs. A refund screen for 50 support agents and one for 5 million customers during a sale share every feature and almost no architecture. The qualities (how fast, how much load, how available, how secure, how cheap) are what decide it. ISO/IEC 25010 lists them as quality characteristics: performance efficiency, reliability, security, maintainability and others.

## Turn adjectives into numbers
"Fast", "scalable" and "highly available" cannot be designed or tested. Ask for, or propose, numbers:
- **Speed:** *"The order page loads in under 800 ms for 95% of requests"*, a percentile, not an average, because averages hide the slow requests users remember.
- **Load:** *"2,000 orders a minute at the sale peak, growing to 5,000 next year."*
- **Availability:** *"99.9% of checkout requests succeed each month"*, which allows about 43 minutes of failure a month (see [[lesson:slos]]).
- **Security:** *"Only Finance can approve refunds above 10,000 rupees, and every approval is logged."*
- **Data:** *"A paid order is never lost, even if a server dies mid-request."*

## Quality attribute scenarios
Len Bass, Paul Clements and Rick Kazman's *Software Architecture in Practice* gives a template that makes each requirement testable: a **source** and a **stimulus** (10,000 users arrive in a minute), the **environment** (during the sale), the **response** (orders are accepted, slower pages are fine) and the **measure** (no order lost; 95% of pages under 2 seconds).

## Every choice is a trade-off
Mark Richards and Neal Ford call it the first law of software architecture: everything is a trade-off. A cache makes reads fast and data slightly stale. Microservices make teams independent and operations harder. Strong consistency makes data correct and writes slower. So:
- **Name what you give up,** not only what you gain.
- **Rank the qualities for this system** with the business: for payments, correctness beats speed; for a product search, speed beats perfect freshness.
- **Say what would change the choice:** *"If the load goes past 5,000 a minute, we revisit the single database."*

When a PRD says "fast" and "scalable", the [[tool:prd]] turns them into questions; the [[tool:rfc]] asks each target for its number.`,
      analogy: `Quality requirements are the constraints you give a query planner. Without them it cannot choose between a full scan and an index; with "under 50 ms on 10 million rows", the choice is obvious. Architects are query planners for systems.`,
      mistakes: [
        `Designing before anyone has said how fast, how big or how available.`,
        `Averages instead of percentiles for speed.`,
        `"It must be scalable" accepted as a requirement.`,
        `Presenting a design's benefits without its costs.`,
        `Ranking every quality as "high", which ranks nothing.`
      ],
      say: [
        `"When you say scalable, how many orders a minute at the peak, and what growth over the next year?"`,
        `"By fast, do we mean 95% of pages under 800 ms at the sale peak? If not, what number?"`,
        `"This cache makes the page fast, and the stock can be up to a minute old. Is that acceptable for the sale?"`
      ],
      sources: [
        `ISO/IEC 25010:2023, *Systems and software quality requirements and evaluation (SQuaRE): product quality model*`,
        `Len Bass, Paul Clements and Rick Kazman, *Software Architecture in Practice* (4th edition, Addison-Wesley, 2021), quality attribute scenarios`,
        `Mark Richards and Neal Ford, *Fundamentals of Software Architecture* (O'Reilly, 2020), "everything in software architecture is a trade-off"`
      ],
      related: ['scenario:make-it-scalable', 'scenario:four-nines-request', 'tool:prd', 'tool:rfc', 'phrase:arch-scalable-number', 'phrase:ask-propose-number', 'term:nfr', 'term:slo']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'c4-model', track: 'arch', minutes: 5,
      title: 'Drawing the system: the C4 model',
      summary: 'Why most architecture diagrams confuse people, Simon Brown\'s four levels of zoom, and the two diagrams almost every team should have.',
      keywords: ['c4', 'c4 model', 'architecture diagram', 'diagram', 'context diagram', 'container diagram', 'simon brown', 'boxes and lines', 'structurizr', 'system design'],
      body: `## Why diagrams confuse
Most whiteboard diagrams mix levels: a user, a Kafka topic, a Java class and "the cloud" in the same picture, with unlabelled arrows and colours nobody explains. Each reader leaves with a different picture of the system.

## Four levels of zoom
Simon Brown's C4 model draws the system at four levels, like a map you can zoom into:
- **1. System context:** your system as one box, the people who use it and the other systems it talks to. Readable by a product manager.
- **2. Containers:** the separately running things inside it: the web app, the mobile app, each service, each database, the message broker, with what they do and how they talk. ("Container" here means a runnable unit, not only a Docker container.)
- **3. Components:** the main parts inside one container.
- **4. Code:** classes. Rarely worth drawing by hand; your IDE can.

## The two diagrams to keep
Brown's advice is that most teams get most of the value from the **first two**. A context diagram explains the system to a new joiner, a stakeholder or an auditor in a minute; a container diagram is the map for design reviews, incident calls and onboarding.

## Rules that make diagrams readable
- **A title and a key** on every diagram: what the shapes, colours and line styles mean.
- **Every box says what it is** and what it does: "Payment service (Java, Spring Boot): takes card payments".
- **Every arrow says what flows**, and how: "Sends refund requests (HTTPS, JSON)".
- **One level per diagram.**
- **Keep them as code** (Structurizr, PlantUML or Mermaid) next to the code, so they get reviewed and updated like it.

## For a lead
Ask for a context and a container diagram before the first design review of anything new, and use them in onboarding. When someone draws a diagram in a meeting, ask the two C4 questions: *what kind of thing is this box, and what flows along this line?*`,
      analogy: `C4 is the zoom levels of a stack trace and a profiler: the service map, then the service, then the method. You pick the level that answers the question, and you never mix them in one view.`,
      mistakes: [
        `One diagram that shows everything, at every level.`,
        `Unlabelled arrows and colours with no key.`,
        `Diagrams drawn once for a slide and never updated.`,
        `Drawing class diagrams by hand that the code already shows.`
      ],
      say: [
        `"Before the review, could you draw the context and the container diagram? Two pictures are enough."`,
        `"What kind of thing is this box: a service, a database, a queue? And what flows along this arrow?"`,
        `"Let's keep the diagrams as code in the repository, so they change with the system."`
      ],
      sources: [
        `Simon Brown, "The C4 model for visualising software architecture" (c4model.com)`,
        `Simon Brown, *Software Architecture for Developers, Volume 2: Visualise, document and explore your software architecture* (Leanpub)`
      ],
      related: ['tool:rfc', 'lesson:design-reviews', 'playbook:onboarding', 'term:c4-model', 'scenario:split-into-microservices']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'monolith-microservices', track: 'arch', minutes: 7,
      title: 'Monolith or microservices',
      summary: 'What microservices buy and what they cost, why a well-structured monolith is often the better start, the signals that a split will pay, and how to split one piece at a time.',
      keywords: ['microservices', 'monolith', 'modular monolith', 'services', 'architecture', 'split', 'distributed system', 'service boundaries', 'monolith first', 'prime video'],
      body: `## What microservices buy
Splitting a system into independently deployable services lets **teams change and release their part without waiting for others**, scale the busy parts separately, and use different technology where it really helps. For a large organisation with many teams, that independence is worth a lot.

## What they cost
Martin Fowler calls it the "microservice premium". Every split turns a function call into a network call that can be slow, fail or arrive twice. You now need service discovery, distributed tracing, retries and timeouts, versioned interfaces, a deployment pipeline per service, and on-call that understands all of it. Data that sat in one database is spread across several, so a simple join becomes a distributed problem. A team of six running twelve services spends much of its time operating them.

## Monolith first
Fowler's advice, from watching many teams, is to start with a **well-structured monolith** and split when you know where the boundaries are. A **modular monolith** keeps one deployable application but enforces clear modules with their own interfaces and data: you get most of the design benefits without the network. Shopify, for example, has run one of the largest Ruby on Rails monoliths in the world as a modular monolith.

The opposite move happens too: in 2023 the Prime Video team described moving one monitoring service from many distributed components back into a single process, cutting its infrastructure cost by about 90%.

## Signals that a split will pay
- **Teams block each other:** two teams wait on one release train for unrelated changes.
- **Very different load or reliability needs:** one part takes 100 times the traffic, or must stay up when the rest is down.
- **A clear, stable boundary,** with its own data, that one team can own completely.
If the reason is "it's modern" or "the monolith is messy", a split usually gives you a distributed mess.

## How to split
One piece at a time, starting with the boundary that hurts most: the strangler fig approach in [[lesson:migrations]]. Give each service to one team (see [[lesson:conways-law]]), with its own data, and change the team design before the architecture, not after.`,
      analogy: `Microservices are like sharding a database. When one machine truly cannot cope, sharding is the answer, and it is worth all its pain. Done early "for scale", it turns every query into a distributed one and every bug into a cross-shard investigation.`,
      mistakes: [
        `Splitting because microservices are fashionable, not because of a problem they solve.`,
        `More services than people, so each engineer operates two of them.`,
        `Services sharing one database, so they cannot change or release independently anyway.`,
        `A big-bang rewrite into microservices instead of splitting one piece at a time.`,
        `Ignoring the cost of tracing, on-call and versioned interfaces.`
      ],
      say: [
        `"What problem would splitting solve that a cleaner module boundary wouldn't? If it's independent releases for refunds, let's split just that piece."`,
        `"Six of us running twelve services means each of us operates two. Is that where we want our time to go?"`,
        `"Let's make the modules strict inside the monolith first; if refunds still needs its own releases in six months, it's ready to move."`
      ],
      sources: [
        `Martin Fowler, "MonolithFirst" (2015) and "Microservice Premium" (2015), martinfowler.com`,
        `James Lewis and Martin Fowler, "Microservices" (martinfowler.com, 2014)`,
        `Sam Newman, *Monolith to Microservices* (O'Reilly, 2019)`,
        `Marcin Kolny, "Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%" (Prime Video Tech blog, 2023)`,
        `Kirsten Westeinde, "Deconstructing the Monolith" (Shopify Engineering, 2019)`
      ],
      related: ['scenario:split-into-microservices', 'explainer:conways-law', 'lesson:conways-law', 'lesson:migrations', 'phrase:arch-microservices', 'term:modular-monolith']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'migrations', track: 'arch', minutes: 7,
      title: 'Migrations without a big bang',
      summary: 'Why weekend cutovers go wrong, and the patterns that move a system, a database or a dependency in small, reversible steps: strangler fig, expand and contract, parallel runs and feature flags.',
      keywords: ['migration', 'migrate', 'strangler fig', 'big bang', 'cutover', 'expand and contract', 'parallel change', 'parallel run', 'dark launch', 'database migration', 'rewrite', 'rollback'],
      body: `## Why big bangs fail
A big-bang migration moves everything at once, usually over a weekend: freeze, switch, pray. It fails for predictable reasons. The old system has rules nobody wrote down, which only show up in production. Problems appear all at once, in the hardest possible moment to debug them. And by Sunday night there is often no way back.

## Strangler fig
Martin Fowler named it after a fig that grows around a tree until it replaces it. Put a routing layer in front of the old system, then move **one piece at a time** to the new one: first the refund status page, then refund requests, then reports. Each step is small, live and reversible, and the old system shrinks until it can be switched off.

## Expand and contract
For database and interface changes (also called "parallel change"):
1. **Expand:** add the new column, table or field alongside the old one.
2. **Migrate:** write to both, backfill the old data, move readers to the new one.
3. **Contract:** once nothing reads the old one, remove it, in a later release.
Never rename or remove in one step while the old version of the code may still be running. That one rule prevents a whole class of outages during rolling deployments.

## Proving it before you switch
- **Parallel run:** send real traffic to both systems and compare the results, while only the old system's answer is used. Differences show you the unwritten rules.
- **Dark launch:** the new path runs in production, invisible to users, to test load.
- **Feature flags:** move a share of users (staff, then 1%, then 10%) and switch back in seconds.
- **Branch by abstraction:** inside one codebase, put an interface in front of the old implementation, build the new one behind it, and switch over gradually.

## For a lead
Every migration plan should answer three questions: *What is the smallest first step that runs in production? How do we know each step worked? How do we go back?* If the honest answer to the last one is "we can't", make the steps smaller.`,
      analogy: `It is the difference between a rolling deployment and stopping every server to deploy at once. Nobody would take production fully down to ship a release; a migration is a release of a new system, and deserves the same rolling, reversible care.`,
      mistakes: [
        `A weekend cutover with no way back.`,
        `Renaming a column in one release while the old code still reads it.`,
        `"Rewrite it all, then switch", with months of nothing in production.`,
        `No comparison of old and new results before switching.`,
        `Leaving the old system half-alive forever because nobody plans the last step.`
      ],
      say: [
        `"Instead of a weekend cutover, can we move the refund status page first, live, next week? If it goes wrong, we route it back."`,
        `"Add the new column in this release and remove the old one in the next. Never both at once."`,
        `"For two weeks, both systems calculate the invoice and we compare; only then does the new one count."`
      ],
      sources: [
        `Martin Fowler, "Strangler Fig Application" (martinfowler.com, 2004, revised 2024)`,
        `Danilo Sato, "Parallel Change" (martinfowler.com, 2014)`,
        `Martin Fowler, "Branch By Abstraction" (martinfowler.com, 2014)`,
        `Sam Newman, *Monolith to Microservices* (O'Reilly, 2019), chapters on splitting and parallel runs`
      ],
      related: ['scenario:big-bang-migration', 'scenario:breaking-api-change', 'lesson:ci-cd', 'tool:rfc', 'term:strangler-fig', 'term:expand-contract', 'term:feature-flag']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'api-versioning', track: 'arch', minutes: 6,
      title: 'Changing an API other teams use',
      summary: 'Why any visible behaviour becomes a promise, which changes are safe, how to version and deprecate with dates, and contract tests that catch a break before the other team does.',
      keywords: ['api', 'api versioning', 'versioning', 'breaking change', 'backward compatibility', 'deprecation', 'hyrum\'s law', 'contract testing', 'pact', 'v2', 'sunset'],
      body: `## Every behaviour is a promise
Hyrum Wright, at Google, put it this way: with enough users of an API, it does not matter what the documentation promises: **every observable behaviour will be depended on by somebody**. The order of fields, an error message's wording, a response that happens to be fast. That is why changing an API used by other teams is a people problem as much as a technical one.

## Safe and unsafe changes
Usually safe (backward compatible):
- **Adding** an optional field, a new endpoint, a new optional parameter.
Breaking:
- **Removing or renaming** a field or endpoint; **changing a type or meaning**; making an optional field required; tightening validation; changing error codes.
Be careful with the old advice to be "liberal in what you accept": the IETF's 2023 RFC 9413 notes that accepting sloppy input forever turns every mistake into a requirement.

## Versioning
- **Avoid breaking changes** where you can: add the new field, keep the old one working.
- When you must break, **publish a new version** side by side (in the path, such as /v2/, or in a header), and keep the old one running.
- Stripe's approach is a known example: each customer is pinned to the API version they started with, and moves on when they choose.

## Deprecate with dates
A deprecation without a date is a wish. Tell every consumer team in writing: what changes, the new version's date, a **sunset date** for the old one with enough time for their planning cycle (often a quarter), and a migration guide. Measure who still calls the old version, and talk to each of them before the date. Offer help; the change is yours, so the cost should mostly be too.

## Contract tests
Consumer-driven contract tests (Ian Robinson described them in 2006; Pact is a common tool) let each consumer team publish what it relies on. Your pipeline runs their contracts, so a break fails **your** build before it fails their production.

## For a lead
Before changing a shared API, list the consumers, talk to their leads, and agree the timeline in writing (see [[lesson:managing-dependencies]]). The technical work is the easy half.`,
      analogy: `A public API is a database schema other people query directly. You would never drop a column that reports read without asking; you add the new one, move the readers, and only then drop the old one: expand and contract, applied to an interface.`,
      mistakes: [
        `"Nobody uses that field": changing behaviour without checking who depends on it.`,
        `Deprecations with no date, or a date a week away.`,
        `Breaking an API and leaving the migration cost to the other teams.`,
        `Versioning everything as v2 for small additive changes.`,
        `Finding out about a break from the other team's incident.`
      ],
      say: [
        `"v1 keeps working until 31 March. v2 is live today; here's the migration guide, and I'll pair with your team on the first call."`,
        `"Before we change the refund response, who calls it today? Let's check the logs and talk to each team."`,
        `"Could your team publish a contract test for what you use? Then our build tells us before we break you."`
      ],
      sources: [
        `Hyrum Wright, "Hyrum's Law" (hyrumslaw.com); and Titus Winters, Tom Manshreck and Hyrum Wright (eds.), *Software Engineering at Google* (O'Reilly, 2020)`,
        `Martin Thomson and David Schinazi, RFC 9413, "Maintaining Robust Protocols" (IETF, 2023)`,
        `Ian Robinson, "Consumer-Driven Contracts: A Service Evolution Pattern" (martinfowler.com, 2006)`,
        `Google Cloud, *API Design Guide* (cloud.google.com/apis/design), on versioning and compatibility`,
        `Stripe, "APIs as infrastructure: future-proofing Stripe with versioning" (Stripe blog, 2017)`
      ],
      related: ['scenario:breaking-api-change', 'lesson:migrations', 'lesson:managing-dependencies', 'tool:dependencies', 'phrase:arch-deprecate', 'term:hyrums-law', 'term:expand-contract']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'slos', track: 'arch', minutes: 7,
      title: 'SLOs and error budgets',
      summary: 'How to agree how reliable a service must be, what the "nines" really allow, and how an error budget turns arguments about speed versus stability into a rule both sides accept.',
      keywords: ['slo', 'slos', 'sli', 'sla', 'error budget', 'availability', 'reliability', 'uptime', 'nines', '99.9', '99.99', 'sre'],
      body: `## Three terms
- **SLI (service level indicator):** a measurement of what users feel, as a ratio of good events to all events. *"The share of checkout requests that succeed in under 1 second."*
- **SLO (service level objective):** the target for it over a period. *"99.9% of checkout requests succeed in under 1 second, over 30 days."*
- **SLA (service level agreement):** a contract with a customer, with penalties if it is missed. Set it looser than your SLO, so you see trouble before it costs money.

## What the nines allow
Over a 30-day month:
- **99%** allows about **7 hours 12 minutes** of failure.
- **99.9%** allows about **43 minutes**.
- **99.95%** allows about **22 minutes**.
- **99.99%** allows about **4 minutes**.
Each extra nine costs far more than the last: more redundancy, more automation, faster on-call, slower releases. And users rarely notice the difference beyond what their own phone network and Wi-Fi already lose. Ask what the business really needs, per journey: checkout may need 99.95%, the order-history page 99.5%.

## Error budgets
Google's SRE book turns the SLO into a rule. If the SLO is 99.9%, the other **0.1% is a budget** the team may spend: on releases, experiments and the failures that come with them.
- **While budget remains,** the team ships at full speed.
- **When the budget is spent,** releases slow or stop, and the team works on reliability until the service is back within its SLO.
Agree this policy with the product owner **before** you need it. It ends the argument between "ship faster" and "be careful", because both sides agreed the rule in advance.

## Choosing SLIs
Measure close to the user (at the load balancer or in the app), not on a server's CPU. Choose a few: availability and latency for most services; freshness for data pipelines; correctness for payments. Alert on the speed at which the budget is burning, not on every error.

## For a lead
When someone asks for "100% uptime" or "four nines", translate it into minutes and cost, and offer the choice. That conversation is in [[scenario:four-nines-request]].`,
      analogy: `An error budget is a retry budget for the whole team. A client that retries without limit melts the server; one with a budget retries freely until the budget is gone, and then backs off. Releases are the team's retries.`,
      mistakes: [
        `Promising 99.99% because it sounds professional, without the people or design to meet it.`,
        `SLIs measured on servers (CPU, memory) instead of what users feel.`,
        `An SLA as tight as the SLO, so every miss costs money.`,
        `Error budgets with no agreed policy, so a spent budget changes nothing.`,
        `One SLO for every journey, when checkout and order history need different ones.`
      ],
      say: [
        `"99.99% allows 4 minutes of failure a month; 99.9% allows 43. Each nine costs more people and slower releases. Which does checkout need?"`,
        `"We've spent this month's error budget. Until we're back within the SLO, we only ship reliability fixes. That's the rule we agreed in March."`,
        `"Let's measure success at the load balancer, as the share of requests that succeed in under a second."`
      ],
      sources: [
        `Betsy Beyer and others (eds.), *Site Reliability Engineering* (O'Reilly, 2016), chapter 3 "Embracing Risk" and chapter 4 "Service Level Objectives"`,
        `Betsy Beyer and others (eds.), *The Site Reliability Workbook* (O'Reilly, 2018), chapter 2 "Implementing SLOs"`,
        `Alex Hidalgo, *Implementing Service Level Objectives* (O'Reilly, 2020)`
      ],
      related: ['scenario:four-nines-request', 'lesson:nfrs-tradeoffs', 'lesson:on-call', 'phrase:arch-error-budget', 'term:sli', 'term:slo', 'term:sla', 'term:error-budget']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'conways-law', track: 'arch', minutes: 6,
      title: 'Conway\'s law and team design',
      summary: 'Why systems end up shaped like the teams that build them, how to use that on purpose, and the four kinds of team in Team Topologies.',
      keywords: ['conway', 'conway\'s law', 'inverse conway', 'team topologies', 'team design', 'stream-aligned', 'platform team', 'cognitive load', 'org structure', 'ownership'],
      body: `## The law
Melvin Conway wrote in 1968 that organisations "are constrained to produce designs which are copies of the communication structures of these organizations". Teams that talk every day build tightly connected parts; teams that rarely talk build parts with a hard boundary between them. A study of real software by Alan MacCormack and colleagues in 2012 found exactly this "mirroring".

## Why a lead should care
If one feature needs the front-end team, the back-end team and the database team, every feature is a relay race with three backlogs and two handoffs, however good each team is. If the system has a boundary nobody owns, it decays. Most "architecture problems" in a growing company are partly team-design problems. See [[explainer:conways-law]].

## The inverse Conway manoeuvre
Use the law on purpose: **design the teams for the architecture you want**, and the system follows. If you want refunds to be an independent service, first create a team that owns refunds end to end. Splitting a system into services that no single team can own rarely works.

## Team Topologies
Matthew Skelton and Manuel Pais describe four kinds of team:
- **Stream-aligned:** owns a flow of work end to end, such as checkout or refunds. Most teams should be this kind.
- **Platform:** provides internal services (deployment, observability, databases) that stream-aligned teams use as a self-service product.
- **Enabling:** experts who help other teams learn something (testing, security) and then step back.
- **Complicated subsystem:** owns a part needing deep specialist knowledge, such as a pricing engine or a video codec.
They add a key idea: **cognitive load**. A team can only own as much as it can understand. Give a team more services than it can hold in its head and quality drops, whatever the org chart says.

## For a lead
Watch where work waits. If your team often waits on another, or another team often waits on yours, raise it as a design question with your manager: *"Every refund change needs both teams; should refunds have one owner?"* Make sure every part of the system has exactly one owning team.`,
      analogy: `Conway's law is coupling and cohesion applied to people. Code that changes together should live together; so should the people who change it. A feature that needs three teams is a change that touches three modules: a sign the boundaries are in the wrong place.`,
      mistakes: [
        `Teams split by layer, so every feature needs three of them.`,
        `Designing a service architecture without changing who owns what.`,
        `Parts of the system that no team owns.`,
        `Giving one team so many services that nobody understands any of them well.`,
        `Treating constant handoffs as a people problem when it is a design problem.`
      ],
      say: [
        `"Every refund change needs both our team and Platform. Should refunds have one owner end to end?"`,
        `"Before we split this into a service, which team will own it, and can they hold it alongside what they own today?"`,
        `"Who owns the notification service? If the answer is 'everyone', it's nobody."`
      ],
      sources: [
        `Melvin E. Conway, "How Do Committees Invent?", *Datamation*, April 1968`,
        `Matthew Skelton and Manuel Pais, *Team Topologies* (IT Revolution, 2019)`,
        `Alan MacCormack, John Rusnak and Carliss Baldwin, "Exploring the duality between product and organizational architectures", *Research Policy* 41(8), 2012`
      ],
      related: ['explainer:conways-law', 'lesson:monolith-microservices', 'scenario:split-into-microservices', 'scenario:merged-team-storming', 'term:conways-law', 'term:inverse-conway', 'explainer:brooks-law']
    }
  );
})(window.LELT);
