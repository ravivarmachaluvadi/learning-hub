/*
 * lessons-eng.js - the Engineering leadership track: code review, tech debt, quality and testing,
 * incidents, on-call, CI/CD, DORA metrics, documentation, AI tools in the team, and flow (Kanban,
 * WIP limits and Little's law).
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-eng.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'code-review-culture', track: 'eng', minutes: 7,
      title: 'Code review culture: fast, small and kind',
      summary: 'What reviews are really for, why speed matters more than thoroughness, how big a pull request should be, and how to write comments people act on without feeling attacked.',
      keywords: ['code review', 'pull request', 'pr', 'review', 'reviewer', 'review time', 'small prs', 'nit', 'conventional comments', 'lgtm', 'approve'],
      body: `## What reviews are for
Most people think code review is for catching bugs. When Microsoft researchers Alberto Bacchelli and Christian Bird studied it in 2013, they found that reviews catch fewer defects than people expect, and do more for **sharing knowledge**: who knows which part of the code, how the team writes things, what changed this week. That changes how a lead should run them. A review that sits for three days shares nothing and blocks everything.

## Speed first
Google's published review guidelines say a reviewer should respond within **one working day** at most, and sooner is better. A pull request that waits slows the author, invites bigger pull requests ("I'll add the next part while I wait"), and makes merging harder. As a lead:
- Agree a team rule, such as "first response within four working hours", and keep to it yourself.
- Make reviewing visible: review before starting new work, and talk about the review queue at stand-up.
- Spread reviews across the team, so it is not always the two seniors.

## Small pull requests
Review quality drops sharply with size: a study at Cisco found reviewers were far less effective beyond about 400 lines at a time or an hour of reviewing. Ask for changes that do one thing, behind a feature flag if needed. A 2,000-line pull request gets "LGTM" because nobody can review it properly.

## The standard: better, not perfect
Google's guideline is to approve a change once it clearly **improves the overall health of the code**, even if it is not exactly how you would have written it. Perfectionism in review is a tax on everyone's speed.

## Comments people act on
- **Label each comment**, as Conventional Comments suggests: *issue (blocking)*, *suggestion*, *question*, *nit*. The author then knows what must change and what is taste.
- **Ask about risk, don't announce wrongness:** *"What happens here if the payment call times out? I think we'd charge twice."*
- **Comment on the code, never the person.** "This function" not "you".
- **Praise what is good.** A review with only criticism teaches people to dread reviews.
- **Move long threads to a call**, then write the outcome in the pull request.

People problems in review (a harsh reviewer, a junior who never gets approved) are feedback conversations: see [[lesson:feedback-sbi]] and [[scenario:harsh-reviewer]].`,
      analogy: `A review queue is a queue like any other: Little's law applies. Twenty pull requests waiting and four reviewed a day means each waits five days. You make it faster by reviewing sooner and sending smaller items, not by reviewing harder.`,
      mistakes: [
        `Reviews that wait days, so authors build huge pull requests to avoid waiting twice.`,
        `Treating every comment as blocking, so the author cannot tell taste from risk.`,
        `Approving a 2,000-line change with "LGTM" because nobody can really review it.`,
        `Only two seniors ever review, who become the bottleneck and the only ones who know the code.`,
        `Arguing in 40 comments instead of a ten-minute call.`
      ],
      say: [
        `"Team rule from today: first response to a pull request within four working hours. I'll start with mine."`,
        `"Blocking: the retry can charge twice. Two nits, take them or leave them."`,
        `"Could we split this into three pull requests? I can review each one properly today."`
      ],
      sources: [
        `Alberto Bacchelli and Christian Bird, "Expectations, Outcomes, and Challenges of Modern Code Review", ICSE 2013 (Microsoft Research)`,
        `Google, *Engineering Practices: Code Review Developer Guide* (google.github.io/eng-practices), "The Standard of Code Review" and "Speed of Code Reviews"`,
        `Jason Cohen, *Best Kept Secrets of Peer Code Review* (SmartBear, 2006), the Cisco review study`,
        `Conventional Comments (conventionalcomments.org), labels for review comments`
      ],
      related: ['scenario:prs-wait-three-days', 'scenario:ai-pr-nobody-understands', 'scenario:harsh-reviewer', 'phrase:eng-review-question', 'phrase:eng-review-blocking', 'phrase:eng-review-fast', 'explainer:littles-law']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'tech-debt', track: 'eng', minutes: 7,
      title: 'Tech debt: making the case in time and money',
      summary: 'What the debt metaphor really means, the four kinds of debt, why "we need to refactor" never wins, and how to get a steady share of each sprint for it.',
      keywords: ['tech debt', 'technical debt', 'refactor', 'refactoring', 'debt quadrant', 'interest', 'legacy', 'business case', '20%', 'boy scout rule'],
      body: `## What the metaphor means
Ward Cunningham coined "technical debt" in 1992. Shipping code before you fully understand the problem is like borrowing money: it gets you something sooner, and then you pay **interest** on every later change in that area until you repay it by improving the code. The metaphor is about interest, not about ugliness. Ugly code nobody changes costs almost nothing; a messy module everyone touches every week is expensive.

## Four kinds of debt
Martin Fowler's "technical debt quadrant" sorts it by two questions: was it **deliberate or accidental**, and **prudent or reckless**?
- *Prudent and deliberate:* "We ship now and clean up after the sale." Often the right call, if you really clean up.
- *Reckless and deliberate:* "No time for tests." Usually costs more than it saved, within weeks.
- *Prudent and accidental:* "Now we know how we should have built it." Normal learning; every good team has it.
- *Reckless and accidental:* nobody knew better. Training and review fix the cause.

## Why "we need to refactor" loses
A Product Owner hears "a sprint with nothing new for customers". They are not wrong to say no to that. They say yes to **time, money and risk**:
- *"Flaky tests cost us about 12 hours a sprint in re-runs. Three days fixes them, so it pays back in two sprints."*
- *"Only Sameer can change the settlement job. If he is on leave at month-end, Finance cannot close the books."*

To get those numbers, measure for two weeks: note the hours lost to re-runs, manual steps, workarounds and the incidents each problem causes.

## Paying it down
- **Fix the fast paybacks first.** An item that pays back in two sprints earns trust for the next one; one that takes a year should wait, unless its risk is high.
- **Ask for a steady share** of each sprint (many teams use 15 to 20%), not "a tech-debt sprint someday", which never comes.
- **Leave code a little better than you found it** (Robert Martin's "boy scout rule"), as part of normal work, not as a separate project.
- **Show the result** at the Sprint Review: hours saved, incidents gone.

The [[tool:techdebt]] turns your list into a plan with paybacks and the message to send.`,
      analogy: `Debt in a system is like a slow memory leak: each request still works, but everything gets a little slower, and nobody notices until the day it falls over. You do not fix a leak by rewriting the service; you measure it, find the biggest allocation and fix that first.`,
      mistakes: [
        `Asking for "time to refactor" with no numbers.`,
        `Proposing a full rewrite, the riskiest way to repay debt.`,
        `Fixing debt in code nobody changes, because it is ugly, while the expensive module waits.`,
        `Taking "deliberate" debt and never scheduling the repayment.`,
        `Hiding clean-up inside feature estimates without saying so, until the estimates stop being trusted.`
      ],
      say: [
        `"Flaky tests cost us about 12 hours a sprint. Three days fixes them; it pays back in two sprints."`,
        `"I'd like 20% of each sprint for the three things that slow every feature. I'll show the hours saved at each review."`,
        `"We can ship it this way for the sale. I'll add the clean-up to the backlog now, for the sprint after."`
      ],
      sources: [
        `Ward Cunningham, "The WyCash Portfolio Management System", OOPSLA 1992 experience report, the origin of the debt metaphor`,
        `Martin Fowler, "Technical Debt Quadrant" (martinfowler.com, 2009)`,
        `Philippe Kruchten, Robert Nord and Ipek Ozkaya, *Managing Technical Debt* (Addison-Wesley, 2019)`,
        `Robert C. Martin, *Clean Code* (Prentice Hall, 2008), the boy scout rule`
      ],
      related: ['tool:techdebt', 'scenario:no-time-for-tech-debt', 'scenario:flaky-builds-ignored', 'scenario:simple-change-three-weeks', 'phrase:eng-debt-share', 'phrase:write-plain-business', 'term:tech-debt']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'quality-testing', track: 'eng', minutes: 6,
      title: 'Quality and testing: the team owns it',
      summary: 'Who is responsible for quality, the test pyramid, why coverage is a floor and not a goal, and what to do about flaky tests before the team stops trusting the build.',
      keywords: ['testing', 'quality', 'test pyramid', 'unit tests', 'integration tests', 'end to end', 'coverage', 'flaky tests', 'qa', 'shift left', 'definition of done'],
      body: `## Quality belongs to the team
In many Indian service companies, quality used to be "the QA team's job": developers finish, testers find bugs, developers fix, repeat. It is slow, and it makes quality someone else's problem. In a Scrum team, the **Definition of Done** is the team's promise: code is not done until it is tested to the agreed standard. Testers become quality coaches who help the team test well, not a gate at the end.

## The test pyramid
Mike Cohn's test pyramid describes a healthy mix:
- **Many unit tests:** fast, cheap, run on every change. They check one piece of logic.
- **Fewer integration tests:** a service with its database, or two services talking.
- **A few end-to-end tests:** a real user journey through the whole system. Slow and fragile, so keep them for the journeys that matter most, such as login and payment.

An "ice-cream cone" (mostly manual and end-to-end tests) gives slow feedback and a build nobody trusts.

## Coverage is a floor, not a goal
A coverage number shows what is **not** tested. As a target it fails, as Goodhart's law predicts: people write tests that run code without checking anything. Ask instead: *"If this broke, would a test tell us?"*

## Flaky tests are an emergency
A flaky test passes and fails on the same code. Google reported that about 16% of its tests showed some flakiness. Once a team learns that red builds are "probably flaky", it starts ignoring real failures. Treat it like an incident:
- **Quarantine** a flaky test the day it is found: move it out of the blocking run, with an owner and a date to fix or delete it.
- **Track the flaky rate** and put fixing it in the sprint.
- **Never normalise "just re-run it".**

## Shift left
Find problems where they are cheapest: clear acceptance criteria before coding, tests written with the code, reviews within a day, and a pipeline that runs the tests on every change.`,
      analogy: `The test pyramid is like monitoring: many cheap metrics and health checks, fewer synthetic transactions, and a handful of full end-to-end probes. You would not monitor a system only with a human clicking through it every evening, and you should not test it that way either.`,
      mistakes: [
        `"QA will catch it": testing as a phase after development instead of part of done.`,
        `Coverage targets that produce tests which check nothing.`,
        `Mostly slow end-to-end tests, so the build takes an hour and fails at random.`,
        `"Just re-run it" as the answer to a red build.`,
        `Cutting testing when a date is tight, which moves the cost to production.`
      ],
      say: [
        `"This test failed twice this week on the same code. I'm quarantining it now; Anil owns fixing it by Thursday."`,
        `"Instead of a coverage target, let's ask in review: if this broke, would a test tell us?"`,
        `"Testing isn't an option we can cut; let's cut scope instead."`
      ],
      sources: [
        `Mike Cohn, *Succeeding with Agile* (Addison-Wesley, 2009), the test pyramid`,
        `Ham Vocke, "The Practical Test Pyramid" (martinfowler.com, 2018)`,
        `John Micco, "Flaky Tests at Google and How We Mitigate Them" (Google Testing Blog, 2016)`,
        `Ken Schwaber and Jeff Sutherland, *The Scrum Guide* (2020), the Definition of Done`
      ],
      related: ['scenario:flaky-builds-ignored', 'lesson:definition-of-done', 'term:test-pyramid', 'term:flaky-test', 'term:goodharts-law', 'tool:techdebt']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'incidents', track: 'eng', minutes: 7,
      title: 'Incidents: run the response, then learn without blame',
      summary: 'Severity levels, the roles in an incident, why you stop the impact before you look for the cause, how to keep people informed, and how a blameless postmortem stops the next one.',
      keywords: ['incident', 'outage', 'production issue', 'sev1', 'severity', 'incident commander', 'mitigate', 'rollback', 'postmortem', 'blameless', 'root cause'],
      body: `## When something breaks
An incident is anything that hurts customers or puts them at risk, and needs a coordinated response now. The way it goes wrong is predictable: ten people debug in one channel, nobody decides, the lead takes over the keyboard, a rollback waits while people hunt for the root cause, and the business hears nothing for an hour.

## Declare it, with a severity
Agree severity levels with the business before you need them. A common shape: **SEV1** when customers cannot pay, log in or use a core feature; **SEV2** when a core feature is broken for some customers with a workaround; **SEV3** for something small. Declare early: lowering the severity later costs nothing, while declaring late is how small incidents grow.

## Roles
Google's SRE practice separates the roles, as fire services do:
- **Incident commander:** decides and coordinates. Often the lead, and never the person typing the fix.
- **Ops lead:** does the hands-on work and says out loud what they are trying.
- **Communications lead:** keeps support, managers and the business informed on a fixed rhythm.
- **Scribe:** keeps the timeline: times, what was tried, what was decided.

## Mitigate first, diagnose later
Customers care that it stops, not why it started. Roll back the last release, switch off the feature flag, fail over or add capacity first; find the root cause afterwards. "What changed?" solves most incidents: deploys, configuration, flags, traffic, a dependency.

## Communicate on a rhythm
Send a first update within about 15 minutes, even if you know little, and then on a fixed rhythm (every 30 minutes for a SEV1), with the time of the next update. Silence is what brings managers into the channel to ask, which slows the fix.

## Learn without blame
Within a few days, write a **blameless postmortem**: what happened, the impact in numbers, the timeline, the causes in the system, and actions with owners and dates. John Allspaw, then at Etsy, put the reason simply: if people are punished for mistakes, they stop telling you what really happened, and you lose the facts you need to prevent the next one. "Human error" is where the investigation starts, not where it ends.

The [[playbook:incident]] runs the first hours by the clock; the [[tool:postmortem]] writes the review.`,
      analogy: `An incident commander is a load balancer with a health check: it doesn't serve requests itself, it routes work to the right place and notices when a node is overloaded. Put the load balancer on a worker node and, under load, nobody is routing.`,
      mistakes: [
        `The lead grabbing the keyboard and abandoning the commander role.`,
        `Searching for the root cause while customers still cannot pay.`,
        `No updates for an hour, then a flood of "any update?" messages.`,
        `Postmortems that name a person, or end with "be more careful".`,
        `Postmortem actions nobody owns, so the same incident comes back.`
      ],
      say: [
        `"Declaring a SEV1. I'm incident commander; Anil, you lead the fix; Divya, you own updates."`,
        `"Roll back first, find the cause after. Customers can't pay right now."`,
        `"Update 3, 10:45: rollback done, payments recovering. Next update at 11:15."`
      ],
      sources: [
        `Betsy Beyer, Chris Jones, Jennifer Petoff and Niall Richard Murphy (eds.), *Site Reliability Engineering* (O'Reilly, 2016), chapters 14 "Managing Incidents" and 15 "Postmortem Culture: Learning from Failure"`,
        `John Allspaw, "Blameless PostMortems and a Just Culture" (Etsy Code as Craft, 2012)`,
        `Sidney Dekker, *The Field Guide to Understanding 'Human Error'* (3rd edition, CRC Press, 2014)`,
        `PagerDuty, "Incident Response" documentation (response.pagerduty.com)`
      ],
      related: ['playbook:incident', 'tool:postmortem', 'scenario:production-down-friday', 'scenario:same-incident-twice', 'scenario:junior-broke-production', 'phrase:eng-incident-roles', 'phrase:eng-incident-mitigate', 'phrase:eng-incident-update', 'term:incident-commander', 'term:postmortem']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'on-call', track: 'eng', minutes: 6,
      title: 'On-call that does not burn people out',
      summary: 'A fair rotation, alerts worth waking up for, runbooks, handovers between time zones, and fixing the causes of pages so on-call gets quieter instead of heavier.',
      keywords: ['on-call', 'on call', 'pager', 'rotation', 'alerts', 'alerting', 'runbook', 'toil', 'burnout', 'follow the sun', 'escalation', 'comp off'],
      body: `## Why it matters to a lead
On-call is where reliability meets people's lives. Done badly, the same two seniors take every page, sleep badly for months, and leave. Done well, pages are rare, everyone can handle them, and each incident makes the system a little better.

## A fair rotation
- **Everyone who changes the system is on the rotation**, with a primary and a secondary to escalate to. New people shadow first.
- **A week at a time** is common; never one person "always on".
- **Recognise it.** Many Indian companies pay an on-call allowance or give comp-off after a night of pages; whatever your company does, make sure it actually happens.
- **Follow the sun** with onsite and offshore teams where you can: each side covers its own daytime, with a written handover at the change.

## Alerts worth waking up for
Rob Ewaschuk's rule at Google: page a human only for something **urgent, real and needing a person to act**. Alert on what users feel (payments failing, pages slow), not on every cause (CPU at 80%). Every page should be actionable; if the response is "ignore it", delete or downgrade the alert.

## Runbooks and handovers
Each common alert gets a runbook: what it means, what to check first, how to roll back, who to call. The handover at the end of a shift lists open issues, recent changes and anything flaky.

## Keep the load in check
Google's SRE book caps on-call work so that engineers spend most of their time on engineering, and aims for no more than about two incidents in a 12-hour shift: beyond that, there is no time to handle them well and follow up. Track pages per week. When the load rises, the fix is engineering time to remove the causes, not more stamina.

## Toil
Toil is manual, repetitive work a machine could do: restarting a job by hand every night, copying data for a report. It grows with the system unless someone automates it. Put the worst toil in the backlog like any other work.`,
      analogy: `Alerts are logs at ERROR level. If every second line in the log is an ERROR, nobody reads them, and the real failure scrolls past. Alert fatigue is the same bug, with a person's sleep on the other end.`,
      mistakes: [
        `One "hero" who takes every page because they know the system best.`,
        `Alerts on causes (CPU, disk) that wake people up for nothing.`,
        `No runbooks, so every page needs the one person who knows.`,
        `Promised comp-off or allowance that never actually appears.`,
        `Never fixing the cause of repeat pages, so on-call gets heavier each quarter.`
      ],
      say: [
        `"From next week, everyone who deploys joins the rotation, after two weeks of shadowing. Asha, you'll be the secondary, not the only one."`,
        `"This alert fired 14 times last month and nobody acted on it. Let's delete it, or make it say what to do."`,
        `"Last week was six pages at night for Divya. She takes Monday off, and the top two alerts go into this sprint."`
      ],
      sources: [
        `Betsy Beyer and others (eds.), *Site Reliability Engineering* (O'Reilly, 2016), chapters 5 "Eliminating Toil" and 11 "Being On-Call"`,
        `Rob Ewaschuk, "My Philosophy on Alerting" (Google, 2013)`,
        `Google, *The Site Reliability Workbook* (O'Reilly, 2018), chapter 8 "On-Call"`
      ],
      related: ['scenario:on-call-one-hero', 'scenario:working-late-every-night', 'playbook:incident', 'term:toil', 'term:runbook', 'term:burnout', 'lesson:incidents']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ci-cd', track: 'eng', minutes: 6,
      title: 'CI/CD: small changes, shipped often and safely',
      summary: 'What continuous integration and delivery really ask of a team, why small batches are safer than big releases, feature flags, and the difference between deploying and releasing.',
      keywords: ['ci', 'cd', 'ci/cd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'pipeline', 'trunk based development', 'feature flags', 'release', 'deploy', 'build'],
      body: `## Integration is a habit, not a tool
Continuous integration means everyone merges small changes into the main branch **at least daily**, and an automated build and tests check each one. Having Jenkins is not CI; branches that live for three weeks and merge in a painful week are the opposite of it. Trunk-based development, with short-lived branches of a day or two, is how most high-performing teams work.

## Continuous delivery
Jez Humble and David Farley's *Continuous Delivery* sets the goal: the main branch is **always releasable**, and releasing is a business decision, not an engineering event. Continuous deployment goes one step further: every change that passes the pipeline goes to production automatically.

## Why small batches are safer
A release with 200 changes that breaks is hard to diagnose and hard to roll back. A release with one change that breaks is obvious and quick to undo. The *Accelerate* research found that teams deploying more often also had **fewer failures and faster recovery**: speed and stability go together, not against each other.

## A fast pipeline
Kent Beck's rule of thumb from Extreme Programming is a ten-minute build. When the pipeline takes an hour, people batch changes and stop waiting for it. Watch the pipeline time like a product metric, and fix flaky tests at once.

## Deploy is not release
- **Deploy:** the code is on production servers.
- **Release:** users can see the feature.
Feature flags separate the two: deploy the code switched off, turn it on for staff, then 10% of users, then everyone, and switch it off in seconds if something goes wrong. Remove each flag once the feature is fully out, or they pile up into their own kind of debt.

## What the lead does
Protect the habits: small pull requests, reviews within a day, a green main branch that is everybody's job, and releases that are boring. A Friday-evening release freeze is a symptom: it means releases are scary, which is the thing to fix.`,
      analogy: `Small batches are to releases what small transactions are to databases: a short transaction holds few locks, conflicts rarely and rolls back cheaply. A release with three weeks of changes is a transaction that has held every lock in the building.`,
      mistakes: [
        `Long-lived branches merged in one painful week before the release.`,
        `A pipeline that takes an hour, so people stop running it.`,
        `A red main branch that stays red because "someone is looking at it".`,
        `Big, rare releases planned as events, with a war room.`,
        `Feature flags that are never removed.`
      ],
      say: [
        `"Let's merge to main every day, behind a flag if it isn't finished. Smaller merges, fewer surprises."`,
        `"Main has been red for two hours. Until it's green, nobody merges; who can help Anil fix it?"`,
        `"We deploy it switched off on Tuesday, turn it on for staff on Wednesday, and for 10% of customers on Thursday."`
      ],
      sources: [
        `Jez Humble and David Farley, *Continuous Delivery* (Addison-Wesley, 2010)`,
        `Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate* (IT Revolution, 2018)`,
        `Martin Fowler, "Continuous Integration" (martinfowler.com, 2006, revised 2024)`,
        `Pete Hodgson, "Feature Toggles (aka Feature Flags)" (martinfowler.com, 2017)`,
        `Kent Beck with Cynthia Andres, *Extreme Programming Explained* (2nd edition, Addison-Wesley, 2004), the ten-minute build`
      ],
      related: ['scenario:flaky-builds-ignored', 'scenario:big-bang-migration', 'term:trunk-based-development', 'term:feature-flag', 'lesson:dora-metrics', 'lesson:migrations']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dora-metrics', track: 'eng', minutes: 6,
      title: 'DORA metrics: measuring delivery without harming it',
      summary: 'The four measures from the Accelerate research, what they tell a team about itself, and why ranking people or teams by them destroys what they measure.',
      keywords: ['dora', 'dora metrics', 'accelerate', 'deployment frequency', 'lead time', 'change failure rate', 'time to restore', 'mttr', 'metrics', 'productivity', 'space framework'],
      body: `## Four measures of delivery
From years of surveys of thousands of teams, the DORA research programme (Nicole Forsgren, Jez Humble and Gene Kim, in *Accelerate*) found four measures that describe software delivery and go together with better business results:
- **Deployment frequency:** how often you release to production.
- **Lead time for changes:** from a commit to it running in production.
- **Change failure rate:** the share of releases that cause a failure needing a fix or a rollback.
- **Time to restore:** how long it takes to recover from a failed release. Recent DORA reports call it "failed deployment recovery time".

The first two measure **speed**, the last two **stability**. The research's key finding is that the best teams are good at both: speed and stability are not a trade-off.

## What they are for
They are a team's mirror: *"Our lead time is nine days, and most of it is waiting for review. What can we change?"* Measured over months, they show whether the team's improvements work. They are measured from tools (the pipeline, the incident log), not from people's reports.

## What they are not for
- **Not for ranking people.** Deployments are made by teams through pipelines, not by individuals. Rank people by deploys and you get tiny meaningless deploys, and people who stop helping each other.
- **Not for comparing teams.** A payments team and an internal-tools team face different risks. Compare a team with its own past.
- **Not as targets.** Goodhart's law: once deployment frequency is a target, people will raise it without delivering more.

## Beyond four numbers
Productivity has more sides than delivery. The SPACE framework (Forsgren and colleagues, 2021) adds satisfaction, performance, activity, communication and flow, and warns against judging developers by any single activity count, such as commits or lines of code.

## How to start
Measure the four for your team for a month, share them with the team first, pick one constraint (usually review wait or a slow pipeline), and look again in a month.`,
      analogy: `DORA metrics are like a service's latency and error rate: they tell you how the whole system behaves for its users. You would never decide which server is "lazy" from them, and you should not decide which developer is.`,
      mistakes: [
        `A league table of developers by deployments or commits.`,
        `Comparing two teams' numbers without their context.`,
        `Making a metric a target, then celebrating the number while delivery stays the same.`,
        `Measuring by asking people instead of reading the pipeline and the incident log.`,
        `Measuring speed and ignoring stability, or the other way round.`
      ],
      say: [
        `"DORA measures our delivery system, not people. Ranking people by it makes the numbers go up and the software get worse."`,
        `"Our lead time is nine days; six of those are waiting for review. That's the one thing I'd like us to fix this quarter."`,
        `"Let's compare ourselves with our own last quarter, not with the payments team."`
      ],
      sources: [
        `Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate: The Science of Lean Software and DevOps* (IT Revolution, 2018)`,
        `Google Cloud DORA, *Accelerate State of DevOps Report* (2023 and 2024 editions), dora.dev`,
        `Nicole Forsgren, Margaret-Anne Storey, Chandra Maddila, Thomas Zimmermann, Brian Houck and Jenna Butler, "The SPACE of Developer Productivity", *ACM Queue* 19(1), 2021`
      ],
      related: ['scenario:dora-league-table', 'scenario:velocity-comparison', 'phrase:eng-metrics-team', 'term:dora-metrics', 'term:lead-time-for-changes', 'term:change-failure-rate', 'term:mttr', 'term:goodharts-law']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'documentation', track: 'eng', minutes: 5,
      title: 'Documentation people actually use',
      summary: 'Which documents a team needs, the four kinds of documentation and why mixing them fails, keeping docs next to the code, and how to keep them from going stale.',
      keywords: ['documentation', 'docs', 'readme', 'runbook', 'wiki', 'confluence', 'diataxis', 'docs as code', 'onboarding docs', 'knowledge sharing'],
      body: `## The documents a team needs
Not everything needs writing down, but a few documents pay back many times:
- **A README** for each service: what it does, how to build, run and test it, who owns it.
- **Runbooks** for the alerts on-call will see.
- **Decision records** for the choices that are expensive to reverse ([[tool:adr]]).
- **Design docs** before big changes ([[tool:rfc]]).
- **An onboarding page** that a new joiner can follow on day one.

## Four kinds, kept apart
Daniele Procida's Diátaxis framework sorts documentation by what the reader needs:
- **Tutorials:** learning by doing, for a newcomer ("build and run it locally").
- **How-to guides:** steps for a task, for someone who knows the basics ("rotate the API key").
- **Reference:** facts to look up ("the configuration settings").
- **Explanation:** the why and the background ("why we use event sourcing here").
Most bad documentation mixes them: a reference page full of history, or a tutorial that stops to explain theory.

## Docs next to the code
Keep docs in the repository, in Markdown, reviewed in the same pull request as the change ("docs as code"). A document in a separate wiki that nobody updates is worse than none, because people trust it. Google's engineering book (*Software Engineering at Google*) treats documentation like code: it has owners, reviews and a freshness date.

## Keeping it alive
- **Change the doc in the same pull request** as the behaviour it describes.
- **Give each important page an owner** and a "last checked" date.
- **Ask the newest joiner** to fix the onboarding page: they are the only one who still sees its gaps.
- **Delete stale pages.** A wrong page costs more than a missing one.

## For a lead
Write the documents that save you repeated explanations. If you have explained something three times, it should be a page you can link.`,
      analogy: `A stale document is a cache with no expiry: it answers fast and confidently, with data that stopped being true months ago. Docs as code is cache invalidation: the document changes in the same commit as the truth.`,
      mistakes: [
        `A wiki written once at the start of the project and never touched again.`,
        `One giant page that is tutorial, reference and history at once.`,
        `Docs written as a separate task after the release, which never comes.`,
        `Explaining the same thing in chat every week instead of writing it once.`
      ],
      say: [
        `"Let's update the README in this same pull request; otherwise it's out of date the moment we merge."`,
        `"Karthik, you joined last week, so you're the best person to fix the onboarding page. What was wrong?"`,
        `"I've explained the release steps three times this month; I'll write a how-to today and link it."`
      ],
      sources: [
        `Daniele Procida, *Diátaxis: a systematic approach to technical documentation* (diataxis.fr)`,
        `Titus Winters, Tom Manshreck and Hyrum Wright (eds.), *Software Engineering at Google* (O'Reilly, 2020), chapter 10 "Documentation"`,
        `Write the Docs, "Docs as Code" (writethedocs.org)`
      ],
      related: ['tool:adr', 'tool:rfc', 'playbook:onboarding', 'scenario:why-did-we-choose-kafka', 'scenario:key-person-resigns', 'term:runbook', 'term:bus-factor']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ai-in-the-team', track: 'eng', minutes: 6,
      title: 'AI tools in the team: rules that keep quality',
      summary: 'Where AI coding assistants help and where they mislead, why the author owns every line, what not to paste into them, and how to keep juniors learning instead of copying.',
      keywords: ['ai', 'ai tools', 'copilot', 'chatgpt', 'claude', 'llm', 'ai generated code', 'ai pr', 'code review', 'policy', 'juniors', 'prompt'],
      body: `## Where they help, and where they mislead
AI coding assistants are good at boilerplate, test scaffolding, small scripts, mechanical changes and explaining unfamiliar code. They are weaker at the parts that need the whole context: design decisions, subtle concurrency and security problems, and code that has to fit what your system really does. They can write confident, plausible code that is wrong. For what this means for estimates, see [[lesson:estimating-with-ai]].

## Rule 1: the author owns every line
Whoever opens the pull request is responsible for all of it, however it was written. If they cannot explain a line, it is not ready to merge. This one rule removes most of the risk, and it is the same standard you already apply to code copied from Stack Overflow.

## Rule 2: review it as hard as any code
More code written faster means more code to review. Keep pull requests small, whatever produced them, and look harder at the things AI gets subtly wrong: error handling, security checks, concurrency, and libraries or functions that do not exist.

## Rule 3: know what must not be pasted
Client code, customer data, credentials and anything under an NDA must not go into tools your company has not approved. Many Indian service companies' client contracts forbid it outright. Make the rule explicit, with the approved tools named, rather than hoping people guess.

## Rule 4: juniors still have to learn
A junior who asks the assistant for every solution ships fast and learns slowly, then is stuck the first time the tool is wrong. Ask juniors to explain their changes in review, to write the first version of tricky logic themselves, and to use the assistant to explain code, not only to write it.

## Measure, don't assume
The evidence is mixed: a 2023 GitHub study found developers finished one well-defined task 56% faster with Copilot, while a 2025 METR trial found experienced developers working in their own large codebases were 19% slower, although they felt faster. Try the tools on your work, measure cycle time and defects for a few sprints, and decide from that.`,
      analogy: `An AI assistant is like a new library pulled in from the internet: useful, fast, and you are responsible for what it does in your system. You would never ship a dependency nobody on the team understands; the same goes for a function nobody on the team wrote or read.`,
      mistakes: [
        `Approving AI-written code you did not read, because it "looks right".`,
        `Huge AI-generated pull requests nobody can review properly.`,
        `Pasting client code or customer data into an unapproved tool.`,
        `Banning the tools outright instead of agreeing how to use them well.`,
        `Juniors who can produce code but cannot explain it.`
      ],
      say: [
        `"Walk me through what this does and why. If you can't explain a line, it isn't ready to merge, whoever wrote it."`,
        `"Approved tools only, and never client code or customer data in anything else. Here's the list."`,
        `"Let's measure it for three sprints, cycle time and bugs, before we decide what it changes."`
      ],
      sources: [
        `Sida Peng, Eirini Kalliamvakou, Peter Cihon and Mert Demirer, "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot" (arXiv 2302.06590, 2023)`,
        `METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (July 2025)`,
        `Google Cloud DORA, *Accelerate State of DevOps Report 2024*, the chapter on AI adoption`
      ],
      related: ['scenario:ai-pr-nobody-understands', 'scenario:ai-makes-it-faster', 'lesson:estimating-with-ai', 'lesson:code-review-culture', 'phrase:eng-ai-pr', 'phrase:ai-estimate']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'flow-wip', track: 'eng', minutes: 6,
      title: 'Flow: Kanban, WIP limits and Little\'s law',
      summary: 'Why a team with everything in progress finishes nothing, how a WIP limit works, the arithmetic behind it, and how to forecast from throughput instead of adding up estimates.',
      keywords: ['kanban', 'flow', 'wip', 'wip limit', 'work in progress', 'little\'s law', 'cycle time', 'throughput', 'lead time', 'multitasking', 'context switching', 'forecast'],
      body: `## Too much in progress
Look at a struggling team's board and you usually see the same thing: everyone has three or four items "in progress", nothing moves to Done for days, and stand-up is a list of things people are "still working on". Everyone is busy, and nothing finishes.

## Little's law
John Little proved in 1961 that in a stable system, **average work in progress = throughput × average cycle time**. So **cycle time = work in progress ÷ throughput**. A team that finishes 5 items a week with 20 in progress takes about 4 weeks per item. With 10 in progress and the same throughput, about 2 weeks. Nothing about effort changed; only how much was started. In practice the gain is bigger, because people juggling fewer items lose less time switching between them. See [[explainer:littles-law]].

## Kanban and WIP limits
Kanban, as David Anderson applied it to software, makes the work visible on a board and **limits the work in progress** in each column. When "In progress" is full, nobody starts something new: they help finish, review or unblock what is there. "Stop starting, start finishing."
- Start with a limit of about **one item per person** in progress, fewer if people pair.
- Count **review** and **waiting** as work in progress, because they are.
- When the limit is hit, the question at stand-up becomes *"What can we finish today?"*

## Measure flow
- **Cycle time:** from starting an item to Done. Watch its spread, not only its average.
- **Throughput:** items finished per week.
- **Age of items in progress:** an item that is three times older than the usual cycle time is stuck, whatever its status says.

## Forecast from throughput
With 30 items left and a throughput of 4 to 6 a week, the work takes about 5 to 8 weeks. Daniel Vacanti shows how to do this properly with a simulation over past weeks; even the simple version beats adding up estimates, because it already includes the meetings, reviews and interruptions that estimates forget.

Kanban fits teams with a steady flow of incoming work, such as support or platform teams, and its flow practices work inside Scrum Sprints too.`,
      analogy: `It is a connection pool. If every request grabs a connection and then waits on something else, the pool is "fully busy" while throughput collapses. Limiting concurrency so requests finish before new ones start gets more done, not less: that is a WIP limit.`,
      mistakes: [
        `Everyone with three or four items in progress, "to stay busy".`,
        `Not counting review and waiting as work in progress.`,
        `Starting new work when blocked, instead of helping finish something.`,
        `Forecasting by adding up estimates, which leaves out everything that isn't coding.`,
        `A WIP limit everyone ignores when it is inconvenient.`
      ],
      say: [
        `"We have 18 things in progress and we finish about 6 a week, so each takes three weeks. Let's finish before we start anything new."`,
        `"In progress is full. Before you pick up a new ticket, can you review Anil's pull request?"`,
        `"At our usual 4 to 6 items a week, the remaining 30 take about 5 to 8 weeks."`
      ],
      sources: [
        `John D. C. Little, "A Proof for the Queuing Formula: L = λW", *Operations Research* 9(3), 1961`,
        `David J. Anderson, *Kanban: Successful Evolutionary Change for Your Technology Business* (Blue Hole Press, 2010)`,
        `Daniel S. Vacanti, *Actionable Agile Metrics for Predictability* (2015)`,
        `Gerald M. Weinberg, *Quality Software Management, Volume 1: Systems Thinking* (Dorset House, 1992), on the cost of switching`
      ],
      related: ['explainer:littles-law', 'scenario:interruptions-eat-sprint', 'scenario:prs-wait-three-days', 'scenario:when-will-it-be-done', 'term:kanban', 'term:wip-limit', 'term:cycle-time', 'term:littles-law', 'term:throughput']
    }
  );
})(window.LELT);
