/*
 * lessons-pm.js - the Project management track: estimates, status and bad news, dependencies,
 * stakeholders, risks, release planning and interruptions.
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-pm.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'estimate-target-commitment', track: 'pm', minutes: 6,
      title: 'Estimate, target, commitment: three different numbers',
      summary: 'Most arguments about dates are three different numbers being mixed up. Learn to tell them apart, and to say which one you are giving.',
      keywords: ['estimate', 'target', 'commitment', 'deadline', 'promise', 'planning fallacy', 'outside view', 'mcconnell'],
      body: `## Three numbers that sound the same
- An **estimate** is a prediction: how long the work will take, given what you know today. It is a range with assumptions. It can't be negotiated down; only its inputs can change (less scope, more people, fewer risks).
- A **target** is what the business wants: *"live before the festive sale"*. It is a wish, often for a good reason, decided by someone who owns the business priority.
- A **commitment** is a promise: what you agree to deliver, by when, after comparing the estimate with the target.

## Where it goes wrong
The trouble starts when one is passed off as another. A manager asks *"Can we do it in six weeks?"*, which is a target, and the team hears a request for an estimate. You say *"about eight weeks"*, an estimate, and the slide in the leadership deck says *"Committed: 8 weeks"*. Or the target becomes the estimate: *"We need it by 1 December, so plan for 1 December."*

## When the estimate and the target don't match
Don't bend the estimate to fit the target. That only hides the gap until it shows up as a missed date. Change the inputs instead: a smaller first release, a later date, other work paused. Steve McConnell puts it this way: the main job of an estimate is not to predict the future, but to find out whether a target is realistic enough to be managed towards.

The commitment is what you agree after that conversation, and it is usually nearer the cautious end of your range (P85, not P50).

## Say which one you are giving
Label your numbers out loud:
- *"My estimate is 8 to 11 weeks, most likely 9."*
- *"If you need a commitment, I'll give you one by Friday, after a two-day spike."*
- *"The target is 1 December. To hit it, here is what we'd leave out."*

## Why your own estimates run optimistic
People estimate their own work optimistically even when they know similar work ran late before. Daniel Kahneman and Amos Tversky called this the **planning fallacy**. The cure is the **outside view**: before you trust your breakdown, ask how long the last similar piece of work actually took.`,
      analogy: `It is the difference between a load test, an SLA and an SLO. The load test result (the estimate) is what the system can do. The business's wish (the target) is the SLA they'd like. The SLO you publish (the commitment) comes after comparing the two. If the load test says 800 requests a second and the business wants 2,000, you don't edit the load test report; you add capacity, cut features, or change the promise.`,
      mistakes: [
        `Giving a gut number "just for planning", then finding it in a deck as a commitment. Every number you say out loud is a number you'll be held to.`,
        `Lowering an estimate because the person asking looks unhappy. The work doesn't shrink; only the warning does.`,
        `Treating the target as the estimate: planning backwards from the date with no check on whether the work fits.`,
        `Committing to the most likely value (P50). Half of all projects then finish late by definition.`
      ],
      say: [
        `"That's my estimate: 8 to 11 weeks. If you need a commitment, I'll come back by Friday with one I can stand behind."`,
        `"The target is 1 December. The estimate says February. Here is what fits by December."`,
        `"Last time a change like this took us six weeks, not the three we planned. I've used that, not my gut."`
      ],
      sources: [
        `Steve McConnell, *Software Estimation: Demystifying the Black Art* (Microsoft Press, 2006), chapter 1, "What Is an Estimate?"`,
        `Daniel Kahneman, *Thinking, Fast and Slow* (Farrar, Straus and Giroux, 2011), chapter 23, "The Outside View"`
      ],
      related: ['scenario:estimate-becomes-commitment', 'scenario:one-week-ask', 'tool:estimate', 'explainer:cone-of-uncertainty', 'phrase:estimate-not-commitment']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'why-estimate', track: 'pm', minutes: 6,
      title: 'Why estimate at all?',
      summary: 'Estimates exist to support decisions. Know which decisions need one, when a rough size is enough, and when to forecast from data instead.',
      keywords: ['why estimate', 'noestimates', 'no estimates', 'forecast', 'throughput', 'decision', 't-shirt size', 'spike'],
      body: `## Estimates are for decisions
Nobody needs an estimate for its own sake. Someone needs to decide something:
- **Is it worth doing?** A feature worth ₹10 lakh that costs ₹50 lakh of team time is not.
- **Which first?** Two features of equal value: the cheaper one goes first.
- **When can we tell customers, sales or marketing?**
- **Do we need more people, or less scope?**

Before you estimate, ask *"What will this number decide?"* If the answer is "nothing", a rough size or no estimate at all may be the right answer. If a deal or a launch depends on it, it deserves a breakdown.

## The #NoEstimates argument
Woody Zuill, Vasco Duarte and others argue that much estimation is waste: teams spend hours sizing stories that would have been finished in that time. Their alternative: slice the work into small pieces of roughly similar size, finish them steadily, and **forecast from throughput**, the number of items finished per week.

They have a point, and it is not "never answer the question *when?*". It is "answer it from data where you can".

## Forecast from data when you have it
If your team finishes 6 to 9 items a week and 40 items are left, the work will take roughly 5 to 7 weeks. That forecast took a minute, it is based on what actually happened, and it already includes meetings, reviews and support. A Monte Carlo simulation over the last few months of throughput does the same thing more carefully (see [[explainer:monte-carlo]]).

This works only when the items are sliced small and the backlog is reasonably complete. For a new kind of work with no history, you still need a breakdown.

## Match the effort to the decision
- **Roadmap and "should we even do this?"**: T-shirt sizes (S, M, L, XL) in a quick meeting.
- **A date someone will plan around**: a breakdown with three-point estimates ([[tool:estimate]]).
- **A big unknown**: a **spike**, a short timeboxed piece of work to learn enough to estimate.
- **Work already flowing**: forecast from throughput.`,
      analogy: `An estimate is like logging. Log lines that someone reads during an incident are worth every byte; log lines nobody reads are cost and noise. Before adding detail to an estimate, ask who will read it and what they will decide with it.`,
      mistakes: [
        `Estimating everything to the same precision: two-hour task breakdowns for a roadmap item that may never be built.`,
        `Refusing to estimate on principle when a real decision (a contract, a launch date) needs a number.`,
        `Forecasting from throughput when items vary wildly in size: one "item" is a button, the next is a payment integration.`,
        `Never comparing estimates with what actually happened, so the team never gets better at it.`
      ],
      say: [
        `"What will this number help you decide? That tells me how precise it needs to be."`,
        `"We've finished 6 to 9 items a week for two months; with 40 left, that's 5 to 7 weeks."`,
        `"I can't size this honestly yet. Give us a 3-day spike and I'll give you a range you can plan on."`
      ],
      sources: [
        `Vasco Duarte, *NoEstimates: How to Measure Project Progress Without Estimating* (Oikosofy, 2015)`,
        `Daniel S. Vacanti, *When Will It Be Done?* (ActionableAgile Press, 2020), on forecasting from throughput with Monte Carlo simulation`,
        `Steve McConnell, *Software Estimation* (Microsoft Press, 2006), on matching estimation effort to its purpose`
      ],
      related: ['scenario:dev-refuses-estimates', 'explainer:monte-carlo', 'lesson:release-planning', 'tool:estimate']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'estimating-with-ai', track: 'pm', minutes: 7,
      title: 'Estimating when the team uses AI tools',
      summary: 'AI coding assistants speed up some work and not the rest. What the evidence says so far, and how to estimate without guessing a magic discount.',
      keywords: ['ai', 'copilot', 'ai tools', 'llm', 'estimate', 'faster', 'half the time', 'metr', 'dora', 'amdahl', 'productivity'],
      body: `## Where AI tools help, and where they don't
AI coding assistants are good at some parts of the work: boilerplate, test scaffolding, mechanical migrations, small scripts, explaining unfamiliar code. They help much less with the parts that decide most delivery dates:
- understanding what is actually needed, and the questions to the PM;
- design decisions and trade-offs;
- **code review**: more code written faster is more code to review;
- integration with other systems, and waiting on other teams;
- debugging subtle production problems;
- testing, security review and release.

## What the evidence says so far
The research is young, and it doesn't all point the same way:
- **METR, 2025.** In a randomised trial, 16 experienced open-source developers did 246 real tasks in projects they knew well. With AI tools allowed, the tasks took **19% longer**. Before starting, the developers expected to be 24% faster; afterwards, they still believed they had been about 20% faster. The authors are careful: it is one study, with early-2025 tools, on experts in familiar code.
- **DORA, 2024.** In Google's large survey, more AI adoption went with better documentation and faster code reviews, but also with slightly lower delivery throughput (about 1.5% per 25% more adoption) and lower delivery stability (about 7.2%). These are associations in survey data, not proof of cause.

Two lessons follow. People's *feeling* of speed is not a measurement. And individual coding speed is not delivery speed.

## How to estimate
1. **Don't apply a discount to the whole estimate.** "AI, so half the time" assumes the whole job is typing code.
2. **Apply a speed-up only to the coding share of tasks** where your team has seen it, and leave reviews, testing, waiting and meetings as they are.
3. **Measure for two or three sprints.** Compare similar tasks with and without the tools: cycle time, review time, bugs found later.
4. **Update your numbers from what you measured,** and tell your manager what you measured.

## Why the gain is smaller than it feels
If writing code is 30% of the time a feature takes, then even doubling coding speed saves only 15% overall. The rest of the work doesn't get faster because one part did.`,
      analogy: `It is Amdahl's law. If 30% of a program's run time is in one function and you make that function twice as fast, the program gets about 15% faster, not 50%. AI tools speed up one stage of delivery; the date is set by the whole pipeline, including the stages they don't touch.`,
      mistakes: [
        `Halving an estimate because "we have AI now", with no measurement behind it.`,
        `Trusting how fast the team feels. In the METR study, developers felt faster while measuring slower.`,
        `Forgetting that faster code generation means more code to review, test and maintain.`,
        `Refusing to use the tools at all, or to measure them. The honest position is "let's find out for our work".`
      ],
      say: [
        `"AI speeds up the coding part, which is about a third of this. Reviews, testing and the bank's sandbox don't get faster. So I'd expect 10 to 15% off, not half."`,
        `"Let's measure it for two sprints on similar tasks, and then I'll update the estimate with real numbers."`
      ],
      sources: [
        `METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (July 2025)`,
        `Google Cloud DORA, *Accelerate State of DevOps Report 2024*, the chapter on AI adoption`,
        `Gene Amdahl, "Validity of the single processor approach to achieving large scale computing capabilities" (AFIPS conference, 1967): Amdahl's law`
      ],
      related: ['scenario:ai-makes-it-faster', 'phrase:ai-estimate', 'tool:estimate', 'lesson:estimate-target-commitment']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'rag-and-bad-news', track: 'pm', minutes: 6,
      title: 'RAG status and bad news early',
      summary: 'What Green, Amber and Red should mean, why "watermelon" reports happen, and how to give bad news early without sounding like panic.',
      keywords: ['rag', 'red amber green', 'status', 'bad news', 'watermelon', 'escalation', 'amber', 'early warning', 'steering committee'],
      body: `## What the colours should mean
- **Green**: the date holds without help from anyone.
- **Amber**: the date holds only if something specific happens, such as another team delivering by Wednesday.
- **Red**: the date will be missed unless someone decides something or helps.

Amber and Red are not grades. They are requests: *this is what I need to stay on track*. An Amber with no ask is only a worry.

## Watermelon reports
A **watermelon** project is green outside and red inside: every status report says Green until, suddenly, it is Red. It happens because Amber feels like admitting failure, because the lead hopes to catch up quietly, or because a manager asked for it to "stay Green for now". The cost: when the truth comes out, the people who could have helped have run out of options, and they stop trusting the colours.

## The day you know is the day you tell
The cost of bad news grows every day you hold it. On day 2, your manager can still move scope, add a person or warn a customer. On day 20, all that is left is apologising. Leads who raise problems early, with options, are trusted more, not less.

## How to give bad news
1. **The bottom line first.** *"Refunds will miss 20 November; the realistic date is 27 November."*
2. **The cause, in one sentence.** No long story, no blame.
3. **The impact.** What moves, for whom.
4. **Options, with your recommendation.**
5. **The ask.** The decision or help you need, from whom, by when.

## When someone asks you to keep it Green
Say what the colour means and what the risk is, privately, with an option: *"I can't call it Green while it depends on Platform delivering by Wednesday. I'll call it Amber with the fix: if Platform confirms by Tuesday, it goes back to Green."* If they still insist, you have done your job by saying it clearly and in writing.`,
      analogy: `A status colour is a health check. If /health returns 200 while the database is down, the load balancer keeps sending traffic to a dead node. A watermelon report is a health check that lies. A truthful Amber is a degraded-but-up signal that lets the system route around the trouble while there is still time.`,
      mistakes: [
        `Reporting Green while a known blocker could move the date: the watermelon.`,
        `Waiting to be sure before raising a risk. By the time you are sure, the options are gone.`,
        `Giving bad news as a long story that ends, three paragraphs later, with the new date.`,
        `Amber or Red with no ask, so the reader can only worry.`
      ],
      say: [
        `"Bottom line: refunds move from 20 to 27 November. The bank's sandbox arrived a week late. Two options: drop partial refunds from the first release and keep the 20th, or keep scope and ship the 27th. I recommend the first."`,
        `"It's Amber, not Red: it holds if Platform confirms the endpoint by Tuesday. Can you raise it with Rohan today?"`
      ],
      sources: [
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), chapter 3, on the tech lead and project communication`,
        `Kent Beck, *Extreme Programming Explained* (2nd edition, Addison-Wesley, 2004), on courage and early feedback as values`
      ],
      related: ['tool:status', 'scenario:bad-news-early', 'scenario:keep-it-green', 'phrase:status-bad-news', 'term:watermelon']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'managing-dependencies', track: 'pm', minutes: 7,
      title: 'Dependencies on other teams',
      summary: 'Find them early, agree them in writing with a named person and a date, reduce how much they can hurt you, and escalate jointly when you must.',
      keywords: ['dependency', 'dependencies', 'other team', 'cross-team', 'critical path', 'escalation', 'contract test', 'stub', 'blocked'],
      body: `## Find them on day one
Most late projects are late waiting for something they don't control: an API from another team, an approval, an environment, data, a vendor. At kickoff, ask of every piece of the work: *what do we need that we don't own?* Write each one down with the team, a named person, and the date you need it.

## Know which ones decide your date
The **critical path** is the longest chain of work that must happen in order. A dependency on it moves your date day for day; one off it has slack. Spend your attention on the ones on the critical path.

## Make yes easy
The other team has its own priorities, and helping you is extra work. Make it easy:
- ask for **the smallest thing that unblocks you**, not your whole wish list;
- say **why it matters**, and connect it to **their** goals where you honestly can;
- give a **needed-by date**, with the reason for it;
- **offer help**: a short session to explain the need, a draft of the API contract, or even a pull request to their code if they welcome it.

## Agree it in writing
A "yes" in a corridor is easily forgotten by both sides. Follow up the same day: *what, by when, who*, and ask them to reply "agreed". Put it in your RAID log ([[tool:raid]]).

## Reduce the damage a late dependency can do
- **Agree the contract first** (the request and response), then build against a **stub**, so your work doesn't wait for theirs.
- **Contract tests** (for example with Pact) catch it early when their side and yours disagree.
- **Feature flags** let you ship your part and switch it on when theirs arrives.

## Escalate early, jointly, as a decision
If the date is at risk and talking hasn't solved it, go to both managers **together with the other team's lead**: the facts, the dates, the impact, two or three options, and the decision you need. A joint escalation asks for a choice between priorities; a solo one sounds like a complaint.`,
      analogy: `A dependency on another team is a remote call to a service with no SLA. Treat it the same way: a timeout (the needed-by date), a retry with backoff (the polite follow-up), a fallback or circuit breaker (the stub or workaround), and observability (the written status). Code that calls a remote service with none of these is the code that hangs in production.`,
      mistakes: [
        `Saying "waiting on the Platform team" instead of "waiting on Kiran, needed by Wednesday".`,
        `Asking for everything at once instead of the smallest thing that unblocks you.`,
        `Waiting for the dependency before starting your own work, instead of building against an agreed contract and a stub.`,
        `Escalating alone, by email, after the date has passed.`
      ],
      say: [
        `"Kiran, we need the refund endpoint by Wed 11 Nov to make the festive sale. The smallest version that unblocks us is just the refund call; reporting can follow. Does that date work?"`,
        `"Summary of today: Platform delivers the refund endpoint by Wed 11 Nov; Kiran owns it; we build against the agreed contract meanwhile. Please reply 'agreed' if that's right."`
      ],
      sources: [
        `Matthew Skelton and Manuel Pais, *Team Topologies* (IT Revolution, 2019), on team interaction modes and reducing dependencies between teams`,
        `James E. Kelley and Morgan R. Walker, "Critical-path planning and scheduling" (Eastern Joint Computer Conference, 1959)`,
        `[Pact documentation](https://docs.pact.io/): consumer-driven contract testing`
      ],
      related: ['tool:dependencies', 'scenario:team-never-replies', 'scenario:dependency-slips', 'phrase:dep-written-ask', 'term:critical-path']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'stakeholders', track: 'pm', minutes: 6,
      title: 'Stakeholders: who to keep close, and how',
      summary: 'Find everyone who can stop, change or is affected by your work, decide how to keep each one involved, and make one person accountable for each decision.',
      keywords: ['stakeholder', 'stakeholders', 'power interest', 'mendelow', 'raci', 'communication plan', 'managing up', 'sponsor'],
      body: `## Who your stakeholders are
A stakeholder is anyone who can **stop** your work, **change** it, or is **affected** by it. On a typical product team: the Product Manager, your engineering manager, other engineering teams, QA, security, support, finance, compliance, operations, and sometimes customers or partners.

The dangerous ones are the stakeholders nobody listed. The compliance reviewer who first sees the feature at user acceptance testing. The support team that learns about the change from angry customers. Ask early: *who would be upset to hear about this on launch day?*

## The power and interest grid
Place each person by **power** (can they change the plan or the date?) and **interest** (how much does it affect them?). This is often called Mendelow's matrix:
- **High power, high interest: manage closely.** Involve them in decisions; talk every week.
- **High power, low interest: keep satisfied.** A short summary each month; ask before big changes.
- **Low power, high interest: keep informed.** The regular status update; invite them to the demo.
- **Low power, low interest: monitor.** Release notes are enough.

## RACI: who decides
For each important decision or piece of work, mark who is:
- **Responsible**: does the work;
- **Accountable**: owns the decision, and there is **exactly one**;
- **Consulted**: asked before the decision;
- **Informed**: told after it.

Two Accountable people means no owner. Ten Consulted people means decisions take weeks.

## A simple communication plan
For each stakeholder: what they need to know, how (chat, email, meeting, demo), and how often. Write it down once; it saves you from deciding again every week, and from forgetting someone.

## Your manager is a stakeholder too
Managing up is not politics. It is giving your manager what they need to do their job: no surprises, early warnings, the decisions only they can make, and the outcomes they can report upwards.`,
      analogy: `Stakeholders are the consumers of your API. Some can break you (power), some depend on you heavily (interest). You announce a breaking change differently to each, and you never let the one that can break you find out from a failed deploy. A stakeholder you forgot is an undocumented consumer: you only find it when you change something and it breaks.`,
      mistakes: [
        `Listing only the people you work with every day, and missing compliance, security, support or finance until launch.`,
        `Giving every stakeholder the same weekly update, so the important ones skim it and the minor ones drown in it.`,
        `A RACI with two Accountable people, or none.`,
        `Treating the Product Manager or your manager as an obstacle instead of a partner who also needs to look good.`
      ],
      say: [
        `"Before we build, a 15-minute check: here are the three refund rules we are assuming. Anything we've got wrong?"`,
        `"For this decision, Neha is accountable, Priya and Kiran are consulted, and Support gets told once it's made. Does that match how you see it?"`
      ],
      sources: [
        `Aubrey L. Mendelow, "Environmental scanning: the impact of the stakeholder concept" (International Conference on Information Systems, 1981), the origin of the power and interest grid`,
        `Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, on stakeholder engagement and the responsibility assignment (RACI) matrix`
      ],
      related: ['tool:dependencies', 'scenario:forgotten-stakeholder', 'term:raci', 'term:power-interest-grid', 'term:stakeholder']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'risks-raid', track: 'pm', minutes: 7,
      title: 'Risks, and the RAID log',
      summary: 'Tell a risk from an issue, score it, choose a response, and keep a RAID log that the team reviews in fifteen minutes a week.',
      keywords: ['risk', 'risks', 'raid', 'raid log', 'risk register', 'issue', 'assumption', 'mitigation', 'likelihood', 'impact', 'bus factor'],
      body: `## Risk or issue?
- A **risk** might happen: *the bank's sandbox may be late*.
- An **issue** is happening now: *the bank's sandbox is late*.

A risk managed early is cheap. The same thing discovered as an issue is expensive. That is the whole case for a risk log.

## RAID: four lists in one
- **R**isks: what might go wrong.
- **A**ssumptions: what you are taking as true without proof. *Finance won't change the rules.* Every assumption is a risk in disguise, so write down how and when you will check it.
- **I**ssues: what is going wrong now.
- **D**ependencies: what you need from others (see [[lesson:managing-dependencies]]).

## Scoring
Rate **likelihood** and **impact** from 1 to 5 and multiply. A score of 15 or more is high; 5 to 12 medium; below 5 low. The numbers are rough; their job is to make you spend attention on the biggest risks first, and to show when a risk is growing.

## Four responses
For each risk, choose on purpose:
- **Avoid** it: change the plan so it can't happen (don't depend on the new library).
- **Reduce** it: make it less likely or less harmful (pair a second person on the settlement job).
- **Transfer** it: make someone else carry it (the vendor's contract covers the delay).
- **Accept** it: decide to live with it, and know what you'll do if it happens.

"Monitor it" is not a response. Nothing changes while you watch.

## Every risk needs an owner, an action and a date
An owner who agreed to own it, a next action someone can do, and a date to do it or to review it. Without those, the log is a list of worries.

## The weekly review: 15 minutes
Once a week, with the team: close what's done, update scores, add what's new, move anything that happened from Risk to Issue, and pick the top three for your status update.

## Common risks on software teams
One person who knows a critical system (a low **bus factor**); a date that depends on another team or a vendor; technology the team hasn't used; an environment that is slow or shared; requirements that are still moving; a compliance or security review late in the plan.`,
      analogy: `A RAID log is a test suite for your plan. Each risk is a failure scenario you thought of before it happened; the mitigation is the fix; the weekly review is CI. A plan with no risks written down is code with no tests: it looks fine until it meets reality.`,
      mistakes: [
        `Writing "monitor closely" as the mitigation.`,
        `Risks with no owner, or owned by "the team", which means nobody.`,
        `A log written at kickoff and never opened again.`,
        `Keeping risks out of the status update to avoid looking negative, then reporting them as issues.`
      ],
      say: [
        `"One risk I want on the record: only Sameer knows the settlement job. I'd like Divya to pair with him this sprint. It costs about two days and removes the risk."`,
        `"Top three risks this week: the bank sandbox (high, mitigation in progress), the settlement job knowledge (medium, pairing started), the shared staging database (issue, ticket raised)."`
      ],
      sources: [
        `Tom DeMarco and Timothy Lister, *Waltzing with Bears: Managing Risk on Software Projects* (Dorset House, 2003)`,
        `Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, on risk response strategies`
      ],
      related: ['tool:raid', 'scenario:key-person-resigns', 'scenario:keep-it-green', 'term:raid-log', 'term:bus-factor']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'release-planning', track: 'pm', minutes: 7,
      title: 'Release planning: from a backlog to dates',
      summary: 'Turn a backlog and your team\'s history into a date range, decide what fits by a fixed date, and keep the buffer where it helps.',
      keywords: ['release planning', 'release', 'roadmap', 'forecast', 'burn-up', 'fixed date', 'fixed scope', 'buffer', 'critical chain', 'mvp'],
      body: `## From a backlog to a range of dates
1. **Size the backlog roughly**, in points or in item counts, with the team.
2. **Take your real pace from the last few sprints**: the lowest, the average and the highest.
3. **Divide.** 120 points left at 20 to 30 points a sprint is 4 to 6 sprints.
4. **Add the growth you know will come.** Backlogs grow as people learn: if yours grew 10% last quarter, plan for it.
5. **Say it as a range**, with what it assumes, and update it every sprint.

A **burn-up chart** shows this well: one line for work done, one for total scope. When scope grows, everyone can see it, instead of the date moving for no visible reason.

## Fixed date: what fits?
When the date can't move (a regulation, a sale, a conference), turn the question around: *what will we have by then?* Using your slowest and fastest recent pace, split the ordered backlog into three groups:
- **Will have**: fits even at the slow pace.
- **Might have**: fits only at the fast pace.
- **Won't have**: doesn't fit either way.

Put the must-haves in the first group. If they don't fit, you need that conversation now, not two weeks before the date.

## Fixed scope: when?
When the scope can't move, give the date as a range from the same arithmetic, and commit to the cautious end.

## Where the buffer goes
Padding every task quietly doesn't work: work expands to fill the time available, and people start late when they know there is slack. Keep the safety **at the end of the plan**, visible, as one shared buffer. Eliyahu Goldratt called this a project buffer, in *Critical Chain*. Watch how fast it is being used up.

## Smaller releases
The best way to reduce the risk of a big release is to make it smaller: release the most valuable slice first, learn from real use, and release again.`,
      analogy: `Release planning is capacity planning for servers. You forecast load as a range from past traffic, you keep headroom for the whole system rather than inside every request, and you re-plan as real traffic arrives. Nobody sizes a cluster from one optimistic number and never looks at it again.`,
      mistakes: [
        `Dividing the backlog by your best sprint ever.`,
        `Forgetting that the backlog grows, so the date moves "for no reason".`,
        `Hiding padding inside each estimate instead of one visible buffer at the end.`,
        `A fixed date and a fixed scope, with no group of "might have" items to absorb surprises.`
      ],
      say: [
        `"At our slowest pace we finish these 8 items by the date; at our fastest, 11. Items 12 to 15 won't make it either way. Are the must-haves all in the first 8?"`,
        `"The plan has two weeks of buffer at the end. We've used four days of it so far; I'll report it each week."`
      ],
      sources: [
        `Mike Cohn, *Agile Estimating and Planning* (Prentice Hall, 2005), the chapters on release planning and planning for fixed dates`,
        `Eliyahu M. Goldratt, *Critical Chain* (North River Press, 1997), on project buffers`,
        `[The Scrum Guide, November 2020](https://scrumguides.org/scrum-guide.html): burn-downs and burn-ups as forecasting practices`
      ],
      related: ['scenario:when-will-it-be-done', 'scenario:fixed-regulatory-date', 'explainer:burn-down', 'tool:capacity', 'term:burn-up']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'interruptions', track: 'pm', minutes: 6,
      title: 'Interruptions and unplanned work',
      summary: 'Measure how much of the sprint goes to unplanned work, protect focus with an interrupt rotation, plan for the rest, and fix the sources.',
      keywords: ['interruptions', 'unplanned work', 'support', 'context switching', 'focus', 'goalie', 'on-call', 'interrupt rotation', 'ad hoc'],
      body: `## Measure it first
Teams usually underestimate how much time goes to unplanned work: production support, "quick questions", urgent requests from other teams, bugs from the last release. For two sprints, label every unplanned ticket (and log the untracked ones roughly). When teams measure it, the share is usually higher than anyone guessed, and it often explains why sprints keep missing.

## Why it hurts more than the hours suggest
Every switch costs time to get back into the work. Gerald Weinberg's rule of thumb: each extra project you juggle costs about 20% of your time in switching, so with three on the go only about 60% of the day does real work. Research by Gloria Mark and colleagues found that people who are interrupted work faster to make up for it, at the cost of more stress and frustration.

## Protect focus: an interrupt rotation
Instead of everyone being interruptible, **one person per sprint takes all the interrupts**: support tickets, questions, small urgent fixes. Teams call it support duty, the shield or the goalie. The rest of the team plans and works with fewer switches. Google's SRE teams describe the same idea for operations work. Rotate it, so everyone learns the systems and nobody burns out.

## Plan for what's left
If you measured 25% unplanned work, plan the sprint at 75% of capacity, and say why. That is not padding; it is the honest number.

## Triage: "urgent enough to change the sprint?"
For each new request: can it wait for the next sprint? If not, what does it replace? The Product Owner decides the trade-off; you make it visible ([[tool:prioritise]]).

## Fix the sources
Look at what the interrupts were. The same support question twice a week needs a runbook or a self-service answer. A noisy alert needs fixing or removing. Recurring "quick requests" from one team may need a proper agreement with that team.`,
      analogy: `A CPU that services every interrupt on every core thrashes its caches; real systems pin interrupt handling to one core so the others keep their working set warm. An interrupt rotation is IRQ affinity for a team: one person handles the interrupts, everyone else keeps their context.`,
      mistakes: [
        `Planning sprints at full capacity while a third of the time goes to support.`,
        `Saying yes to every "quick thing" yourself, so the lead becomes the team's bottleneck.`,
        `Giving the interrupt duty to the newest person permanently.`,
        `Handling the same interrupt every week without fixing its cause.`
      ],
      say: [
        `"Arjun is on support duty this sprint; I've added it to his queue. If it's urgent enough to stop the sprint, tell me what it replaces."`,
        `"Over the last two sprints, 30% of our time went to unplanned work. I'd like to plan at 70% and spend one sprint fixing the three biggest sources."`
      ],
      sources: [
        `Gerald M. Weinberg, *Quality Software Management, Volume 1: Systems Thinking* (Dorset House, 1992), on the cost of switching between projects`,
        `Betsy Beyer and others (eds.), *Site Reliability Engineering* (O'Reilly, 2016), chapter 29, "Dealing with Interrupts"`,
        `Gloria Mark, Daniela Gudith and Ulrich Klocke, "The cost of interrupted work: more speed and stress" (CHI conference, 2008)`
      ],
      related: ['scenario:interruptions-eat-sprint', 'tool:capacity', 'tool:prioritise', 'term:interrupt-rotation']
    }
  );
})(window.LELT);
