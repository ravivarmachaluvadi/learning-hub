/*
 * lessons-scrum.js - the "Scrum, the minimum" track: what a lead engineer needs to know about
 * Scrum, checked against the 2020 Scrum Guide (scrumguides.org).
 *
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 *
 * The quiz for each lesson is in data/quizzes.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  var GUIDE = 'https://scrumguides.org/scrum-guide.html';
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'scrum-in-one-page', track: 'scrum', minutes: 6,
      title: 'Scrum in one page',
      summary: 'The whole framework on one page: why it exists, the team, the five events, the three artifacts, and what is not part of Scrum.',
      keywords: ['scrum', 'scrum guide', 'events', 'artifacts', 'pillars', 'values', 'overview', 'agile'],
      body: `## Why it exists
Scrum is a lightweight framework for complex work, where you can't know everything up front. Instead of one big plan, the work happens in short cycles called **Sprints**, each one month or less. Each Sprint ends with something usable (an **Increment**), so you can look at what you built and adjust the plan. The Scrum Guide calls this *empiricism*: decide based on what you observe, not on what you predicted.

## Three pillars and five values
- **Transparency**: the work and its progress are visible to everyone who needs to see them.
- **Inspection**: you look at the work and the progress often.
- **Adaptation**: you change course as soon as something is off.

The values are **Commitment, Focus, Openness, Respect and Courage**. They sound soft, but each one is what makes an event work: openness makes a stand-up honest; courage is what lets you say "this will slip".

## The team: three accountabilities
A Scrum Team is typically 10 people or fewer: one **Product Owner**, one **Scrum Master**, and the **Developers**. There are no sub-teams and no hierarchy inside it. See [[lesson:scrum-accountabilities]].

## Five events
- **The Sprint**: one month or less, a fixed length. A new Sprint starts as soon as the last one ends. It contains all the other events.
- **Sprint Planning**: at most 8 hours for a one-month Sprint, less for shorter ones. It answers why, what and how. See [[lesson:sprint-planning]].
- **Daily Scrum**: 15 minutes every working day, for the Developers to inspect progress toward the Sprint Goal. See [[lesson:daily-scrum]].
- **Sprint Review**: at most 4 hours for a one-month Sprint. The team and stakeholders inspect what was built and adapt the plan.
- **Sprint Retrospective**: at most 3 hours for a one-month Sprint. The team inspects how it works and picks improvements. See [[lesson:review-and-retro]].

## Three artifacts, each with a commitment
- **Product Backlog** → its commitment is the **Product Goal**, the long-term objective.
- **Sprint Backlog** → its commitment is the **Sprint Goal**, the single objective of the Sprint.
- **Increment** → its commitment is the **Definition of Done**, the quality bar every Increment meets. See [[lesson:definition-of-done]].

## What is not in Scrum
Story points, velocity, "the three stand-up questions", user stories and Jira are **practices teams add**; the 2020 Scrum Guide doesn't require any of them (it mentions burn-downs only as one way of forecasting). They can be useful. But when someone says "Scrum says we must use story points", it doesn't. See [[lesson:points-velocity]].

## Where you fit as a lead engineer
"Lead engineer" isn't a Scrum role. In most teams the lead is one of the Developers, with extra responsibility for technical decisions and for growing people. In many companies the lead also acts as Scrum Master. Know which hat you're wearing in each meeting.`,
      analogy: `Scrum is a feedback loop with a short period. A team that measures its output every two weeks and corrects course is a control loop sampling often: errors are caught while they're small. A year-long plan with no inspection is an open-loop system. It works only if nothing changes, and something always changes.`,
      mistakes: [
        `Treating Scrum as a set of meetings instead of a way to inspect and adapt. If nothing ever changes after a Review or a Retro, it's ceremony, not Scrum.`,
        `Believing story points, velocity and Jira *are* Scrum, and arguing about them as if they were rules.`,
        `**Mini-waterfall**: design in Sprint 1, build in Sprint 2, test in Sprint 3. Each Sprint should produce a usable, tested Increment.`,
        `Changing the Sprint length every Sprint. The fixed rhythm is what makes planning and measuring possible.`
      ],
      say: [
        `"The Scrum Guide doesn't require story points; they're a planning tool we chose. Let's keep them only if they help us plan."`,
        `"What did we learn this Sprint that should change the plan?"`
      ],
      sources: [`[The Scrum Guide, November 2020](${GUIDE}), Ken Schwaber and Jeff Sutherland`],
      related: ['lesson:scrum-accountabilities', 'scenario:sprint-planning-overcommit', 'term:empiricism']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'scrum-accountabilities', track: 'scrum', minutes: 6,
      title: 'Product Owner, Scrum Master, Developers: who decides what',
      summary: 'The three accountabilities in Scrum, what each one owns, and where a lead engineer and a manager fit.',
      keywords: ['product owner', 'scrum master', 'developers', 'roles', 'accountabilities', 'who decides', 'lead engineer'],
      body: `## Why it matters
Many arguments in a Scrum team are really about who decides. Who decides what gets built first? How much fits in a Sprint? How to build it? The Scrum Guide answers all three, and knowing the answers saves you a lot of arguing.

## The Product Owner: what, and in which order
The Product Owner is accountable for maximising the value of the product. They own the **Product Backlog**: they make sure items are clear, put them in order, and keep the backlog visible. The Product Owner is one person, not a committee. Anyone who wants the backlog changed has to convince the Product Owner.

Only the Product Owner can cancel a Sprint.

## The Developers: how, and how much fits
The Developers are the people who build the Increment: not only programmers, but testers, designers, anyone doing the work. They create the plan for the Sprint (the Sprint Backlog), they size the work, they hold themselves to the Definition of Done, and they adapt their plan every day toward the Sprint Goal.

So: the Product Owner decides **what is most valuable**; the Developers decide **how much they can do and how to do it**.

## The Scrum Master: making Scrum work
The Scrum Master is accountable for the team's effectiveness and for Scrum being understood and practised. They coach the team, help remove impediments, make sure events happen and stay within their timeboxes, and help the wider organisation understand Scrum. They are not the team's manager, and not a meeting secretary.

## Where you fit as a lead engineer
"Lead engineer" isn't one of the three. Usually you're one of the Developers, with extra duties: technical direction, reviews, unblocking people, growing juniors, and representing the team's technical view to managers. Many companies also ask the lead to act as Scrum Master.

That double role is where leads get into trouble. If you run the stand-up *and* you're the senior developer, the stand-up easily becomes a report to you. Keep the two hats separate: as facilitator, you make sure the Developers inspect their progress; as a developer, you're one voice among them.

## Your manager in all this
An engineering manager isn't a Scrum role either. They usually own people (hiring, growth, performance) and cross-team priorities. When a manager pushes for more points in a Sprint, remember that in Scrum the Developers decide how much they can take on, and use data to make that point gently ([[scenario:sprint-planning-overcommit]]).`,
      analogy: `The three accountabilities are separation of concerns. The Product Owner owns the *interface* (what the product does, in which order), the Developers own the *implementation* (how, and how much), and the Scrum Master owns the *runtime* (the process that keeps it healthy). Mix the concerns and you get the people version of a god class.`,
      mistakes: [
        `A Product Owner "committee": three managers each adding priorities. Value needs one person ordering the backlog.`,
        `The lead or the manager deciding how much fits in a Sprint. That belongs to the Developers.`,
        `Treating the Scrum Master as a meeting organiser or note-taker rather than a coach.`,
        `As a lead, letting the stand-up turn into a status report to you.`
      ],
      say: [
        `"Neha, you own the order of the backlog. If Vikram's request is worth more than what we planned, you decide what comes out."`,
        `"As a team, we'll decide how much fits once we've sized it."`
      ],
      sources: [
        `[The Scrum Guide 2020: Scrum Team](${GUIDE}#scrum-team)`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), the chapter on the tech lead`
      ],
      related: ['scenario:scope-creep-mid-sprint', 'scenario:sprint-planning-overcommit', 'lesson:sprint-planning']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sprint-planning', track: 'scrum', minutes: 7,
      title: 'Sprint Planning: why, what, how',
      summary: 'Plan a Sprint from data, not hope: the three topics, the Sprint Goal, capacity, and what to do when someone pushes for more.',
      keywords: ['sprint planning', 'sprint goal', 'capacity', 'commitment', 'overcommit', 'planning'],
      body: `## What it is
Sprint Planning starts the Sprint. The whole Scrum Team plans the work together. It's timeboxed to at most 8 hours for a one-month Sprint; for a two-week Sprint, about 2 hours is common. The Scrum Guide gives it three topics.

## Topic one: why is this Sprint valuable?
The Product Owner proposes how the Sprint could increase the product's value, and the whole team writes a **Sprint Goal**: one sentence saying what the Sprint achieves, such as *"Customers can pay with saved cards at checkout."* The goal must be agreed before planning ends.

The goal matters more than the list of stories. Things change during a Sprint; the goal is what lets the team decide which story to drop or swap without losing what matters.

## Topic two: what can be Done this Sprint?
The Developers select items from the Product Backlog. How many? The guide says the more the Developers know about their past performance, their upcoming capacity and their Definition of Done, the more confident their forecast will be. In practice:

1. Look at what the team actually finished in the last 3 Sprints (for example 36, 41 and 38 points, or 9, 11 and 10 stories).
2. Adjust for this Sprint's capacity: leave, holidays, on-call duty, a new joiner.
3. Take that much, in the Product Owner's order. List a few more as stretch, clearly separate.

## Topic three: how will the work get done?
For each selected item, the Developers plan the work needed to meet the Definition of Done, often by breaking it into tasks of a day or less. The goal, the items and this plan together make the **Sprint Backlog**.

## When someone pushes for more
A manager or Product Owner may say "let's be ambitious: 60 points". Answer with the data and a choice, not a refusal: *"We've finished 36 to 41 in each of the last three Sprints and have 6 fewer developer-days this time, so about 35 is realistic. Which 35 matter most?"* The numbers make the point so you don't have to argue.

## Check before the team commits
- Does every item have acceptance criteria the team understands?
- Is anything waiting on another team? If so, do you have a date from them?
- Does the plan include the testing, review and deployment work that the Definition of Done requires?`,
      analogy: `Sizing a Sprint is sizing a thread pool from measured throughput. Set it from what the system actually processes, not from the load you wish it could take. Overload the pool and you get queueing, context switching and timeouts, and real throughput goes *down*.`,
      mistakes: [
        `Planning a list of stories with no Sprint Goal. Without a goal, every story looks equally important when something has to give.`,
        `Committing to the number a manager wants instead of the number the data supports.`,
        `Ignoring leave, holidays and on-call duty when working out capacity.`,
        `Assigning every story to a person at planning, which stops the team swarming on what matters most.`,
        `Planning only the coding, and forgetting reviews, testing and deployment.`
      ],
      say: [
        `"Our last three Sprints finished 36 to 41 points, and we have 6 fewer developer-days. Let's plan 35 and keep the next 10 as stretch."`,
        `"What's the one sentence that says why this Sprint matters?"`
      ],
      sources: [
        `[The Scrum Guide 2020: Sprint Planning](${GUIDE}#sprint-planning)`,
        `Mike Cohn, *Agile Estimating and Planning* (Prentice Hall, 2005)`
      ],
      related: ['scenario:sprint-planning-overcommit', 'scenario:scope-creep-mid-sprint', 'phrase:planning-data', 'term:sprint-goal']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'daily-scrum', track: 'scrum', minutes: 7,
      title: 'Running the Daily Scrum (stand-up) well',
      summary: 'The 15 minutes that catch problems early, if you listen for work that is not moving and ask the right follow-up question.',
      keywords: ['daily scrum', 'stand-up', 'standup', 'daily standup', 'follow up', 'blockers', 'parking lot', '15 minutes'],
      body: `## What it's for
The Scrum Guide says the purpose of the Daily Scrum is *to inspect progress toward the Sprint Goal and adapt the Sprint Backlog as necessary*. It's a 15-minute event for the Developers, at the same time and place every working day, and the Developers can choose whatever structure they like.

Notice what it isn't: it isn't a status report to the lead or the manager, and it isn't the place to solve problems. Its job is to *spot* problems early, while they're cheap to fix.

## The "three questions" are optional
Many teams use "What did I do yesterday? What will I do today? Any blockers?" These questions were removed from the Scrum Guide in 2020. They often turn the stand-up into a list of activities ("I worked on X; today I'll continue on X") that hides whether anything is actually moving.

A stronger structure: **walk the board from right to left**. Start with the items closest to done and ask what's needed to finish them, then the items in progress, and new work last. This keeps everyone focused on finishing rather than starting.

## Listen for these signals
- The same update two days running: *"Still working on the tracking map."*
- An item older than its estimate: a 2-day story on day 4.
- "No blockers", from someone whose work hasn't moved.
- Vague words: *"almost done", "should be done soon", "some issues".*
- Someone who never speaks, or always says the same short sentence.

## Three follow-up questions
When you hear a signal, ask one short, curious question, not an accusation:

1. *"What's left on it?"*
2. *"What would help it move?"*
3. *"What do you need from me, or from anyone here?"*

If the answer needs more than a minute, **park it**: *"Let's take that right after stand-up: you, Sameer and me."* Write it in a visible parking lot, and make sure it happens.

## Keep it to 15 minutes
- Start on time, even if someone is late.
- Park any discussion longer than a minute.
- One conversation at a time; side debates go to the parking lot.
- End by checking the goal: *"Are we still on track for the Sprint Goal? Anything we should change?"*

## If you're the lead and the facilitator
Don't make it about you. Look at the board, not at people giving you reports. Ask the team, not yourself, whether the goal is at risk. And sometimes give your own update first, including what *you're* stuck on: it makes being stuck normal.`,
      analogy: `A stand-up should be a readiness probe, not a liveness probe. Liveness ("I'm here, I'm working on it") tells you the process is running. Readiness ("this item finishes today; this one is stuck on the proxy") tells you whether the system can actually deliver. Ask the questions that probe readiness.`,
      mistakes: [
        `Saying "OK, next" to the third identical update in a row. That's how a 2-day story becomes a missed Sprint.`,
        `Asking the follow-up as an accusation in front of the team ("What have you actually done?"). People hide being stuck when it feels like failing.`,
        `Letting a technical debate take over the stand-up while everyone else waits.`,
        `Turning it into a report to you or the manager, so the developers talk to you instead of to each other.`,
        `Skipping it "because everyone's busy". Busy teams need it most.`
      ],
      say: [
        `"It's been three days on a two-day story. What's left, and what would help it move?"`,
        `"This matters, so let's park it: Sameer, Divya and I, right after stand-up. Who's next?"`,
        `"Is anything slower than you expected, or waiting on someone?"`,
        `"Are we still on track for the Sprint Goal?"`
      ],
      sources: [
        `[The Scrum Guide 2020: Daily Scrum](${GUIDE}#daily-scrum)`,
        `Jason Yip, [It's Not Just Standing Up: Patterns for Daily Standup Meetings](https://martinfowler.com/articles/itsNotJustStandingUp.html) (martinfowler.com)`
      ],
      related: ['scenario:standup-move-on', 'scenario:standup-runs-long', 'scenario:quiet-junior', 'phrase:standup-followup']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'refinement-stories', track: 'scrum', minutes: 7,
      title: 'Refinement: turning wishes into work the team can build',
      summary: 'Backlog refinement, user stories, the INVEST checklist and acceptance criteria: how a vague request becomes something you can estimate and test.',
      keywords: ['refinement', 'grooming', 'user story', 'invest', 'acceptance criteria', 'given when then', 'definition of ready', 'backlog'],
      body: `## What refinement is
The Scrum Guide describes Product Backlog refinement as *the act of breaking down and further defining Product Backlog items into smaller, more precise items*: adding detail, an order and a size. It's ongoing, not a one-off. Many teams hold a weekly refinement session of about an hour.

The guide also says *the Developers who will be doing the work are responsible for the sizing*. The Product Owner explains and orders; the Developers size.

## User stories (a common practice, not a Scrum rule)
A user story describes a need from the user's point of view:

> As a **returning customer**, I want to **pay with a saved card**, so that **checkout takes seconds instead of a minute**.

The "so that" is the part people skip, and the most useful one: it names the problem, which lets you suggest a simpler solution.

## The INVEST checklist
A good backlog item is:
- **Independent**: it can be built and delivered without waiting for another item.
- **Negotiable**: the details can still be discussed; it isn't a contract.
- **Valuable**: it delivers something a user or the business cares about.
- **Estimable**: the team understands it well enough to size it.
- **Small**: it fits comfortably in one Sprint, ideally a few days.
- **Testable**: you can tell when it's done.

## Acceptance criteria
Acceptance criteria say when the story is done, from the user's point of view. A popular format is *Given / When / Then*:

> **Given** a customer with a saved Visa card, **when** they choose it at checkout and enter the CVV, **then** the payment completes and the confirmation shows the last 4 digits.

Write them before the Sprint starts. They're the questions you'd otherwise ask halfway through building it.

## Turning vague words into criteria
Requests are full of words like *fast, simple, all, smart, user-friendly, etc.* Each one hides a decision. In refinement, propose a concrete version the Product Owner can accept or change:

- "Fast" → *95% of searches return in under 300 ms at 200 searches a second.*
- "Support all filters" → *brand, price, rating, seller and delivery time: these 5.*
- "Handle typos" → *one wrong, missing or swapped letter still finds the product.*

## Definition of Ready (optional)
Some teams agree a "Definition of Ready": an item enters a Sprint only when it has acceptance criteria, a size, and no open dependency. It isn't in the Scrum Guide, and it can turn into a gate that slows everything down. Use it as a checklist, not a wall.`,
      analogy: `Refinement is writing the interface contract before the implementation. You wouldn't code against an API documented as "returns results, fast". Acceptance criteria are the types, the error cases and the SLA of a user story.`,
      mistakes: [
        `Skipping the "so that" and building the literal request instead of solving the problem.`,
        `Stories too big for a Sprint ("Build the loyalty module"). Split by user flow or by rule, not by layer (a backend story and a frontend story).`,
        `Letting vague words like "fast" or "all" into the Sprint without numbers.`,
        `The lead sizing stories alone. The people who'll do the work size it.`,
        `Using a Definition of Ready as a reason to refuse every story.`
      ],
      say: [
        `"What problem does this solve for the user? There may be a simpler way."`,
        `"By fast, do we mean 95% of searches under 300 ms at peak?"`,
        `"This is too big for one Sprint. Can we split it into 'earn points' and 'redeem points'?"`
      ],
      sources: [
        `[The Scrum Guide 2020: Product Backlog](${GUIDE}#product-backlog)`,
        `Bill Wake, *INVEST in Good Stories, and SMART Tasks* (xp123.com, 2003)`,
        `Mike Cohn, *User Stories Applied* (Addison-Wesley, 2004)`
      ],
      related: ['scenario:vague-prd', 'scenario:apologetic-question', 'phrase:ask-propose-number']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'definition-of-done', track: 'scrum', minutes: 6,
      title: 'The Definition of Done: what "done" really means',
      summary: 'One shared quality bar for every piece of work, why "basically done" is not done, and how to hold the line when the demo is tomorrow.',
      keywords: ['definition of done', 'dod', 'done', 'quality', 'increment', 'basically done', 'tests'],
      body: `## What it is
The Definition of Done is a formal description of the state of the Increment when it meets the quality the product needs. In the 2020 Scrum Guide it's the commitment that goes with the Increment: the moment an item meets the Definition of Done, an Increment is born.

If an item doesn't meet it, it **can't be released or even presented at the Sprint Review**. It goes back to the Product Backlog.

## What a typical one contains
For a Java service team, it might be:
- Code reviewed and merged to main.
- Unit and integration tests written and passing in CI, including the error and edge cases named in the acceptance criteria.
- Deployed to the test environment, with the acceptance criteria checked there.
- No new critical findings from static analysis or the security scan.
- API documentation and runbook updated if behaviour changed.
- A feature flag in place if it's risky to release all at once.

Write yours where the team sees it, and agree it as a team. If your company has an organisation-wide standard, that's the minimum; the team can add to it.

## Why "basically done" is dangerous
"The code's written, only the tests are left" usually means a third of the work is left, and it's the third that finds the bugs. Calling it done:
- hides work, so the next Sprint is overloaded;
- puts untested code in front of customers;
- teaches everyone that "done" is negotiable.

## Holding the line under pressure
The pressure to bend it comes at the worst moment: the day before a demo or a release. That's exactly when shortcuts cause production bugs. Hold it, and help the Product Owner tell stakeholders the truth: where the work stands, why, and when it'll be Done.

> "It's not Done yet: the refund edge cases have no tests. It'll be in production by Tuesday. I'd rather say that than find a double refund in production."

## Raising the bar over time
A good retro question: *"What escaped to production last Sprint, and what in our Definition of Done would have caught it?"* Adding one item at a time keeps the bar rising without slowing everything down at once.`,
      analogy: `The Definition of Done is the CI pipeline for work items. You wouldn't merge with a red build "because the demo is tomorrow". Marking a story done without its tests is the same thing, with the failure delayed until a customer finds it.`,
      mistakes: [
        `Saying "done, except testing". That isn't done.`,
        `A Definition of Done in a wiki nobody reads. If it isn't checked for each item, it doesn't exist.`,
        `Bending it before demos and releases, when shortcuts cost the most.`,
        `Each developer having a private idea of "done". The point is that it's shared.`
      ],
      say: [
        `"It doesn't meet our Definition of Done yet: the edge-case tests are missing. It'll be Done by Tuesday."`,
        `"What escaped to production last Sprint, and what should we add to our Definition of Done to catch it?"`
      ],
      sources: [`[The Scrum Guide 2020: Increment and Definition of Done](${GUIDE}#increment)`],
      related: ['scenario:not-done-at-review', 'term:definition-of-done', 'lesson:review-and-retro']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'review-and-retro', track: 'scrum', minutes: 7,
      title: 'Sprint Review and Retrospective',
      summary: 'The two events that close a Sprint: the Review inspects what was built, with stakeholders; the Retrospective inspects how the team works.',
      keywords: ['sprint review', 'retrospective', 'retro', 'demo', 'stakeholders', 'retro formats', 'actions', 'improvement'],
      body: `## The Sprint Review: inspect the product
The Sprint Review is the second-to-last event of the Sprint: at most 4 hours for a one-month Sprint, usually about an hour for two weeks. The Scrum Team presents the results of its work to key stakeholders, and together they discuss progress toward the Product Goal and what to do next. The Product Backlog may change as a result.

The guide warns against treating it as just a presentation. A good Review is a working session:
1. The Product Owner says what was planned, what's Done and what isn't.
2. The Developers show the Done work, live if possible, and mention problems they hit.
3. Stakeholders give feedback, and the group discusses what's most valuable next.
4. You agree changes to the backlog, the dates or the priorities.

Only Done work is shown as done ([[lesson:definition-of-done]]). Unfinished work can be discussed honestly, as progress.

## The Sprint Retrospective: inspect how you work
The Retrospective concludes the Sprint: at most 3 hours for a one-month Sprint, about an hour for two weeks. The team looks at how the Sprint went for people, interactions, processes, tools and its Definition of Done, and picks the most helpful changes. The most important improvements are made as soon as possible, and may even be added to the next Sprint Backlog.

## Getting people to speak
Silence in a retro usually means it doesn't feel safe, or doesn't feel worth it. Change the format:
- **Silent writing first**: 3 to 5 minutes, everyone writes notes on a shared board. Anonymous is fine.
- **Group and vote**: cluster similar notes; everyone gets 3 votes; discuss the top two.
- **Go first yourself**, with a mistake of your own.

## Five formats to rotate
- **Start / Stop / Continue**: simple and quick.
- **Mad / Sad / Glad**: good after an emotional Sprint.
- **4 Ls**: Liked, Learned, Lacked, Longed for.
- **Sailboat**: wind (what pushes us), anchors (what slows us), rocks (risks ahead).
- **Timeline**: draw the Sprint as a line and mark the highs and lows; good after an incident.

## Actions that actually happen
- Pick at most **2 actions**, each with **one owner** and **a date**.
- Put them on the next Sprint's board, where the work is.
- **Start the next retro by checking them.** A retro whose actions are never checked teaches the team that retros don't matter.

## Discuss the system, never a person
"PRs wait 3 days for review" is a system problem: talk about how PRs get reviewed. "Sameer reviews slowly" is personal feedback, and belongs in a private 1:1.`,
      analogy: `A retrospective is a blameless postmortem for the Sprint. An incident review that asks "whose fault?" makes people hide facts, and the system never improves. Ask "what made this easy to get wrong?" and you find causes you can fix.`,
      mistakes: [
        `A Review that's only a slide deck, with no stakeholders and no feedback.`,
        `Demoing work that isn't Done as if it were.`,
        `Retros that produce nine actions with no owners, so none get done.`,
        `Never checking the last retro's actions.`,
        `Discussing one person's performance in front of the team.`,
        `The lead doing most of the talking.`
      ],
      say: [
        `"Take 3 minutes to write, silently: what should we start, stop and continue? I'll go first."`,
        `"What would get every PR reviewed within a day?"`,
        `"Before we start: did last retro's two actions happen?"`
      ],
      sources: [
        `[The Scrum Guide 2020: Sprint Review and Sprint Retrospective](${GUIDE}#sprint-review)`,
        `Esther Derby and Diana Larsen, *Agile Retrospectives: Making Good Teams Great* (Pragmatic Bookshelf, 2006)`
      ],
      related: ['scenario:retro-silent', 'scenario:not-done-at-review', 'phrase:retro-first']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'points-velocity', track: 'scrum', minutes: 8,
      title: 'Story points, velocity and burn-down charts',
      summary: 'What these numbers are for (forecasting), what they are not for (comparing teams or judging people), how to estimate from a one-line request, and how to read a burn-down.',
      keywords: ['story points', 'velocity', 'burn-down', 'burndown', 'burn-up', 'estimate', 'estimation', 'forecast', 'planning poker'],
      body: `## First: these aren't in the Scrum Guide
The 2020 Scrum Guide doesn't mention story points or velocity, and mentions burn-downs only as one of several ways to forecast. They're practices many teams add: useful, if used for what they're good at.

## Story points
A story point is a *relative* size: "this is about twice as big as that". It blends effort, complexity and uncertainty. Teams often use a Fibonacci-like scale (1, 2, 3, 5, 8, 13) so that big items get visibly rough numbers, and play "planning poker" so everyone estimates at once and nobody anchors on the senior developer's number.

Why relative instead of hours? People are poor at estimating absolute time but fairly good at comparing: "is this bigger than the login screen?"

## Velocity
Velocity is the number of points a team completes (Done, per the Definition of Done) in a Sprint. Its one good use is **forecasting**: if a team finishes 36 to 41 points a Sprint and there are 200 points of backlog, the work is roughly 5 to 6 Sprints away.

Use a **range**, not an average. "36 to 41" is honest; "38.3" is false precision.

## What velocity is not
- **Not comparable between teams.** Each team sizes its own work; one team's 5 is another's 13. Comparing them is comparing prices in two currencies.
- **Not a productivity measure.** When velocity becomes a target, estimates grow and nothing more ships. This is Goodhart's law: when a measure becomes a target, it stops being a good measure.
- **Not for individuals.** Points per person encourage people to grab big items and stop helping each other.

If leadership wants to compare delivery across teams, offer the four DORA measures: deployment frequency, lead time for changes, change failure rate and time to restore service ([[term:dora-metrics]]).

## Estimating from a one-line request
Before a backlog exists, points don't help. Give a range with assumptions, from a quick breakdown:
1. List the parts (API, rules engine, checkout change, report, testing).
2. Give each a likely and a worst case.
3. Say where the uncertainty is, and how you'll reduce it (a spike).

> "8 to 14 weeks, most likely 10. The uncertainty is the checkout change; a 3-day spike will narrow it."

Early estimates are naturally wide, and they narrow as you learn ([[term:cone-of-uncertainty]]). That's normal, not failure.

## Reading a burn-down chart
A Sprint burn-down shows the work remaining (up the side) against the days of the Sprint (along the bottom), with an ideal straight line from the start down to zero.

- **Flat for days, then a cliff on the last day**: work isn't finished until the last moment. Stories are too big, or "done" is declared late. Split stories smaller.
- **The line goes up mid-Sprint**: work was added. Check whether something came out in exchange.
- **Always above the ideal line, and the gap growing**: the Sprint was overcommitted. Raise it at the Daily Scrum, early.
- **Well below the ideal line**: stories were overestimated, or the plan was too light. Pull in the stretch items.

A burn-**up** chart shows completed work rising toward a line for the total scope, so it makes scope changes visible, which a burn-down hides.`,
      analogy: `Velocity is a throughput metric in the team's own units. Like requests per second when every service defines its own "request", it's meaningful for capacity planning inside one system and meaningless across systems. Across teams, compare what's measured the same way everywhere: lead time and failure rates.`,
      mistakes: [
        `Comparing velocity between teams, or ranking teams by it.`,
        `Making velocity a target ("let's get to 50 points"): estimates inflate and nothing more ships.`,
        `Counting points for unfinished work. Only Done work counts.`,
        `Giving one number ("3 weeks") for a one-line request instead of a range with assumptions.`,
        `Tracking points per developer.`
      ],
      say: [
        `"Points aren't comparable across teams: each team sizes its own work. Let's compare release frequency and lead time instead."`,
        `"We finish 36 to 41 points a Sprint, so 200 points is 5 to 6 Sprints away."`,
        `"8 to 14 weeks, most likely 10; a 3-day spike will narrow it."`
      ],
      sources: [
        `[The Scrum Guide 2020](${GUIDE}): no mention of points or velocity; burn-downs listed as one forecasting practice`,
        `Mike Cohn, *Agile Estimating and Planning* (Prentice Hall, 2005)`,
        `Steve McConnell, *Software Estimation: Demystifying the Black Art* (Microsoft Press, 2006)`,
        `Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate* (IT Revolution, 2018)`
      ],
      related: ['scenario:velocity-comparison', 'scenario:estimate-from-one-line', 'scenario:sprint-planning-overcommit', 'term:velocity']
    }
  );
})(window.LELT);
