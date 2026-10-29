/*
 * lessons-leadership.js - the Leadership track: from engineer to lead, the first 90 days, managing
 * up, influence without authority, making impact visible, owning mistakes, taking pressure without
 * passing on panic, making decisions, your calendar, and reflection.
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-leadership.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'engineer-to-lead', track: 'leadership', minutes: 7,
      title: 'From engineer to lead: what changes',
      summary: 'Why the habits that made you a strong engineer can hold you back as a lead, what your output is now, and how to split your week between building and leading.',
      keywords: ['engineer to lead', 'new lead', 'tech lead', 'first time lead', 'promotion', 'player coach', 'leverage', 'grove', 'linda hill', 'pacesetting', 'output'],
      body: `## Your output has changed
Andy Grove, who ran Intel, put it in one line in *High Output Management* (1983): a manager's output is the output of their team, plus the output of the teams they influence. As a senior engineer you were judged on what you built. As a lead you are judged on what the team builds, and on how well it will build next quarter. A day spent unblocking three people can be worth more than a day of your own code, even though it feels as if you did nothing.

## The beliefs new leads start with
Linda Hill of Harvard Business School followed new managers through their first year. In "Becoming the Boss" (*Harvard Business Review*, 2007) she describes the beliefs most of them start with, and why they fail:
- *"My title gives me authority."* It gives you very little. People follow you because they trust your judgement and your character, and that has to be earned with each person.
- *"I must control my team."* Control gets compliance, not commitment. Your job is to set the direction and the conditions, then let people do the work.
- *"I should build a good relationship with each person, one by one."* You also have to build a team: shared goals, norms, and a way to disagree.
- *"My job is to keep things running smoothly."* It is also to change what needs changing, which is rarely smooth.

## The pacesetter trap
Strong engineers often lead by example: "watch how fast I do it, and keep up". Daniel Goleman's study of leadership styles ("Leadership That Gets Results", *Harvard Business Review*, 2000) found that this **pacesetting** style, and the **coercive** "do it because I say so", did the most harm to a team's climate. Pacesetting works for a short push with a highly skilled team; over months, people stop thinking and wait for you.

## Splitting your week
Most leads still write some code. A useful starting rule:
- Keep your own coding **off the critical path**: tooling, spikes, small fixes, reviews. If your code is what everyone waits for, your meetings now block the team twice.
- Protect two or three blocks a week for deep work, and give the rest to people: 1:1s, reviews, unblocking, planning.
- At the end of each week, ask *"What did the team ship that it could not have without me?"* rather than *"What did I build?"*

Paul Graham's essay "Maker's Schedule, Manager's Schedule" (2009) explains why this feels hard: a maker needs half-days without interruption, and a manager's day is cut into hours. A lead lives in both. See [[lesson:your-calendar]].

## In an Indian workplace
Two things make the change harder: being promoted over people you sat beside for years, and a hierarchy that expects the lead to have every answer. You do not have to. *"I don't know yet; Divya knows that code best, let's ask her"* earns more respect than a confident guess, and it tells the team that their knowledge counts.`,
      analogy: `Moving from engineer to lead is moving from writing the code to running the pipeline that ships it. You stop measuring your own throughput and start measuring the whole pipeline's, which you raise mostly by removing bottlenecks. Sometimes the bottleneck is you.`,
      mistakes: [
        `Taking the hardest ticket every sprint, so the team waits on the person who is also in every meeting.`,
        `Measuring your week by the code you wrote, and feeling guilty about the time spent unblocking others.`,
        `Using your title to settle a technical argument instead of the reasons.`,
        `Treating former peers either exactly as before or suddenly as subordinates; both damage trust.`,
        `Setting the pace by working late, so the team believes that is what is expected.`
      ],
      say: [
        `"I'll keep my own coding to tooling and reviews this sprint, so I'm never the one you're waiting on."`,
        `"I don't know yet. Divya knows that part best; let's ask her."`,
        `"What's slowing you down that I could remove this week?"`
      ],
      sources: [
        `Andrew S. Grove, *High Output Management* (1983), on a manager's output and managerial leverage`,
        `Linda A. Hill, "Becoming the Boss", *Harvard Business Review*, January 2007`,
        `Daniel Goleman, "Leadership That Gets Results", *Harvard Business Review*, March-April 2000`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), the chapter on the tech lead`,
        `Paul Graham, "Maker's Schedule, Manager's Schedule" (paulgraham.com, July 2009)`
      ],
      related: ['scenario:doing-it-myself', 'scenario:first-week-as-lead', 'scenario:peer-wanted-the-role', 'tool:plan90', 'phrase:lead-dont-know', 'term:managerial-leverage', 'term:pacesetting']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'first-90-days', track: 'leadership', minutes: 7,
      title: 'Your first 90 days as a lead',
      summary: 'Learn before you change: a 1:1 with everyone, the five conversations with your manager, one early win, and a 30-60-90 day plan you both agree.',
      keywords: ['first 90 days', '90 days', '30-60-90', 'new lead', 'new role', 'watkins', 'early win', 'quick win', 'stars', 'listening tour', 'onboarding as a lead'],
      body: `## Why the first months matter
Michael Watkins' *The First 90 Days* (2003, updated 2013) is about people starting a new leadership role. His central point: you are judged long before you have done much, so how you spend the first weeks shapes what people expect of you for a long time. Rushing to change things before you understand them is the most common way to fail. Waiting months before you do anything is the second.

## Learn before you change
In the first 30 days, your main job is to understand:
- **The people.** A 1:1 with everyone on the team, and with your manager, the Product Owner and the leads you depend on. Ask everyone the same three questions: *What is going well that we must not break? What gets in your way? If you were me, what would you change first?*
- **The system.** The architecture, its riskiest parts, the last few incidents and their postmortems, the on-call load.
- **The work.** What has been promised, to whom and by when; what is late; what the team is proud of.

Write down what you hear. The patterns across ten 1:1s are the best map you will get.

## Agree what success means
Watkins recommends five conversations with a new manager: the **situation** as each of you sees it; their **expectations**, and by when; the **resources** you have; your working **style** together (how often to update, what they want to hear about at once); and your own **development**. Most new leads have only the first. The second, *"What would make you say at day 90 that this went well?"*, is the most valuable question you can ask in your first week.

## Pick an early win
An early win is a visible improvement, small enough to finish in a few weeks, that the team wanted anyway: a flaky build fixed, a stand-up that ends on time, a release checklist. It earns the credibility you will need for bigger changes. Choose one the team named in your 1:1s, so it is their win too.

## Know which situation you are in
Watkins' STARS model names five situations: a **start-up**, a **turnaround** (things are failing), **accelerated growth**, a **realignment** (a team that does not yet see it needs to change), and **sustaining success** (a strong team you must not break). A turnaround needs fast decisions; sustaining success needs you to learn what makes the team work before you touch anything. Ask your manager which one they think it is; the answer often surprises new leads.

## A plan you can show
A 30-60-90 day plan writes this down: what you will learn in the first 30 days, what you will start to change by day 60, and what you will own by day 90, each with what "done" means. Shared with your manager, it turns their expectations into something you can both check. The [[tool:plan90]] builds one, with suggestions for each phase.`,
      analogy: `Joining as a lead is being handed a production system you did not build. You do not refactor it on day one. You read the code, the logs and the incident history, talk to the people on call, and ship one small, safe, visible fix before you touch the architecture.`,
      mistakes: [
        `Announcing a new process in the first week, before you know why the old one exists.`,
        `Spending the first month only on delivery, with no 1:1s with the team.`,
        `Never asking your manager what success at day 90 looks like.`,
        `Choosing an early win that matters to you but not to the team.`,
        `Treating a strong team as a turnaround, and breaking what worked.`
      ],
      say: [
        `"For the next two weeks I'll mostly listen. I'll share what I've heard, and one change to try, by the 15th."`,
        `"What would make you say, at day 90, that this went well?"`,
        `"What's going well here that I must not break?"`
      ],
      sources: [
        `Michael D. Watkins, *The First 90 Days*, updated and expanded edition (Harvard Business Review Press, 2013), on early wins, the STARS model and the five conversations with your boss`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017)`,
        `Lara Hogan, *Resilient Management* (A Book Apart, 2019), on getting to know your team`
      ],
      related: ['tool:plan90', 'scenario:first-week-as-lead', 'tool:oneonone', 'lesson:managing-up', 'phrase:lead-listen-first', 'phrase:lead-success-90', 'term:thirty-sixty-ninety', 'term:early-win', 'term:stars-model']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'managing-up', track: 'leadership', minutes: 7,
      title: 'Managing up: working well with your manager',
      summary: 'No surprises, updates in the rhythm they need, options instead of problems, and what to do when a worried manager starts asking for updates every hour.',
      keywords: ['managing up', 'manager', 'boss', 'no surprises', 'micromanagement', 'micromanaging', 'updates', 'gabarro', 'kotter', 'options not problems', 'escalate'],
      body: `## What it is, and is not
Managing up is not flattery or office politics. John Gabarro and John Kotter, in "Managing Your Boss" (*Harvard Business Review*, 1980), described it as consciously working with your manager to get the best results for you, for them and for the company. Your manager depends on you as much as you depend on them: they need accurate information, early warnings, and a team that delivers.

## No surprises
The rule most managers name first: they must never hear bad news about your team from someone else. A slip, a production issue, an unhappy stakeholder: tell them first, briefly, with what you are doing about it. *"Heads-up: checkout will be about a week late. Here's why, and two options. I'll send the details by 4 pm."*

## Learn how they want to work
Every manager is different, so ask instead of guessing:
- **How often, and in what form,** do they want updates? A Friday note, a thread, the weekly 1:1?
- **What do they want to hear about at once,** and what can wait for the weekly note?
- **Which decisions** do they want to make, and which can you make and tell them about?
- **What are they measured on?** Their goals tell you which of your problems they will care about.

## Bring options, not only problems
"The API is late" hands your manager a problem. "The API is late; we can cut the export feature or move the date by a week; I recommend cutting export" hands them a decision, which is what they are for. Do the thinking first, recommend one option, and let them choose.

## Make your team's work visible
Your manager has to describe your team's results to people who never see them. A short monthly note of outcomes, with numbers, makes that easy for them. See [[lesson:visible-impact]].

## When your manager wants updates every hour
After a missed date, many managers start asking for updates several times a day. Pushing back on "micromanagement" rarely works; restoring their confidence does. Ask what they need and why, agree a rhythm and a format (*"a five-line note every day at 5 pm, and a call the moment anything changes"*), keep to it perfectly for two weeks, then suggest relaxing it.

## In an Indian workplace
Hierarchy can make it feel rude to ask your manager how they like to work, or to disagree with them. Asking is a sign that you take the job seriously, not disrespect. Disagree in private, with your reasons and an option; once the decision is made, support it in public.`,
      analogy: `Your manager is a downstream service that depends on your data. If you send it late, or only when it asks, it starts polling you every minute. Publish on a known schedule, and push an alert the moment something important changes, and the polling stops.`,
      mistakes: [
        `Letting your manager hear about a slip from a stakeholder first.`,
        `Bringing a problem with no options and no recommendation.`,
        `Guessing how often they want updates instead of asking.`,
        `Fighting "micromanagement" instead of restoring the confidence that would end it.`,
        `Disagreeing in a group meeting, or agreeing in the room and complaining afterwards.`
      ],
      say: [
        `"Heads-up before you hear it elsewhere: checkout is about a week late. Two options and my recommendation by 4 pm."`,
        `"How would you like updates from me: how often, and what do you want to hear about at once?"`,
        `"I'd have chosen differently, and here's why. If you still prefer this, I'll make it work."`
      ],
      sources: [
        `John J. Gabarro and John P. Kotter, "Managing Your Boss", *Harvard Business Review*, January-February 1980`,
        `Michael D. Watkins, *The First 90 Days* (Harvard Business Review Press, 2013), the five conversations with your new boss`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on managing up`
      ],
      related: ['scenario:manager-wants-daily-updates', 'scenario:saying-no-to-manager', 'scenario:bad-news-early', 'phrase:lead-update-rhythm', 'phrase:visible-ask-manager', 'lesson:visible-impact', 'term:managing-up']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'influence-without-authority', track: 'leadership', minutes: 7,
      title: 'Influence without authority',
      summary: 'Getting help from people who do not report to you: find what they value, build trust before you need it, and prepare a decision before the meeting.',
      keywords: ['influence', 'influence without authority', 'persuade', 'peer', 'other teams', 'cohen', 'bradford', 'currencies', 'trust equation', 'cialdini', 'pre-wiring', 'buy-in'],
      body: `## Most of your work needs people who do not report to you
The platform team, the architect, QA, the Product Owner, another lead: your plans depend on people you cannot direct. Allan Cohen and David Bradford's *Influence Without Authority* (first published 1990) argues that influence at work is mostly **exchange**: people help those who help them, with things each side values.

## Find what they value
Cohen and Bradford call the things people value **currencies**, and sort them into five groups:
- **Inspiration:** a cause they care about ("this removes the outage your team was paged for twice").
- **Task:** resources, help, information, a faster path to their own goal.
- **Position:** recognition, visibility, being seen as the expert.
- **Relationship:** being understood, included, treated as a partner.
- **Personal:** gratitude, ownership, the chance to learn something they want to learn.

Before you ask, find out what the other person is measured on and what worries them. An ask is easiest to say yes to when it moves their goal too.

## Build trust before you need it
David Maister, Charles Green and Robert Galford's *The Trusted Advisor* (2000) writes trust as an equation: **credibility plus reliability plus intimacy, divided by self-orientation**. You raise it by knowing your subject, doing what you said you would, and being someone people can be open with. You lower it, more than any other way, by seeming to care only about your own goal. Help other teams when it costs you little, and keep every small promise.

## Prepare the decision before the meeting
A proposal that people first hear in a big meeting tends to get attacked, because surprised people look for problems. Talk to the key people one by one first ("pre-wiring"): hear their concerns, change the proposal where they are right, and ask what they would need to support it. The meeting then confirms what you have already agreed.

## Shortcuts that backfire
Robert Cialdini's research (*Influence*, 1984) shows how reciprocity, consistency, social proof, authority, liking and scarcity move people. They work, and they are easy to abuse: false urgency, or "everyone else has agreed", wins once and costs you the relationship. Use the honest versions: real deadlines, real examples, and help given first.

## In an Indian workplace
It is tempting to borrow authority ("the director wants this") or to go to the other lead's manager first. Both get a yes on paper and quiet resistance in practice. Talk to the person first, in private, and keep the escalation for when a date has really passed; see [[lesson:managing-dependencies]].`,
      analogy: `Influence without authority is calling an API you don't own. You can't change its code, so you read its contract: what it accepts, what it returns, what it is rate-limited on. Then you shape your request to fit, and you don't spam it.`,
      mistakes: [
        `Asking for help only when you need it, from people you never help.`,
        `Arguing from your own goal ("my deadline") instead of theirs.`,
        `Surprising people with a proposal in a big meeting.`,
        `Going to their manager before talking to them.`,
        `Inventing urgency or agreement to win a yes.`
      ],
      say: [
        `"What's your team measured on this quarter? I'd like this to help that, not compete with it."`,
        `"Before I take this to the architecture review, I'd value your concerns. What would you need to support it?"`,
        `"You helped us with the load test last month. Can I return the favour on your migration?"`
      ],
      sources: [
        `Allan R. Cohen and David L. Bradford, *Influence Without Authority* (Wiley, first published 1990), on exchange and currencies`,
        `David H. Maister, Charles H. Green and Robert M. Galford, *The Trusted Advisor* (Free Press, 2000), the trust equation`,
        `Robert B. Cialdini, *Influence: The Psychology of Persuasion* (1984; new and expanded edition 2021)`
      ],
      related: ['scenario:adopt-the-standard', 'scenario:team-never-replies', 'lesson:managing-dependencies', 'phrase:lead-their-goal', 'phrase:influence-help', 'term:influence-currencies', 'term:trust-equation', 'term:pre-wiring']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'visible-impact', track: 'leadership', minutes: 6,
      title: 'Making your team\'s impact visible',
      summary: 'Busy is not impact. Turn effort into outcomes with numbers and names, keep a brag document, send a monthly note, and credit the team specifically.',
      keywords: ['visibility', 'impact', 'outcomes', 'brag document', 'performance review', 'appraisal', 'monthly update', 'credit', 'recognition', 'self-promotion', 'promotion'],
      body: `## Busy is not impact
In review season, "I was online till midnight" and "I reviewed most of the pull requests" describe effort. Impact is what changed because of it: the incidents that stopped, the release that shipped a month earlier, the junior developer who now owns a service. Your manager has to describe your work to people who never see it. Give them the words.

## Outcomes, with numbers and names
Turn an activity into an outcome by asking "so what?" until you reach something a business leader cares about:
- "Set up on-call and runbooks" becomes *"Incidents went from 6 a month to 2, and none lasted more than an hour."*
- "Reviewed pull requests faster" becomes *"Pull requests now wait under a day for review, down from three."*
- "Mentored Karthik" becomes *"Karthik went from his first pull request to owning the search filters."*

If you don't have the number, start measuring now. Two weeks of data beats a guess.

## Keep a brag document
Julia Evans' essay "Get your work recognized: write a brag document" (2019) suggests a running list of what you did, why it mattered and what you learned, updated every week or two. Nobody remembers six months of work in a review meeting, including you. Twenty minutes on a Friday is enough, and the [[tool:journal]] can hold the wins.

## A monthly note to your manager
Five lines a month: what the team shipped, what improved (with numbers), who did something worth recognising, what is at risk, and what you need. It takes ten minutes, and it turns the next review into a conversation about your next step instead of about what you did.

## Credit the team, and still say what changed
Visibility is not self-promotion. Name the people who did the work, publicly and specifically; a lead whose team is visibly growing is the lead who looks strongest. "The team did it" with no specifics, though, leaves your manager with nothing to say about the team or about you. Say what changed, who did it, and what part you played.

## Write decisions down
A decision made on a call and never written down is invisible, and it will be made again. Two lines in the team channel, or a decision record for bigger choices ([[tool:adr]]), shows the thinking behind the work.`,
      analogy: `Work nobody can see is a service with no metrics. It may run perfectly, but on the day someone has to cut costs, it looks like the safe one to switch off. Visibility is instrumentation, not vanity.`,
      mistakes: [
        `Describing effort (hours, meetings, tickets) instead of outcomes.`,
        `Waiting for the annual review to collect your achievements.`,
        `Saying "the team did it" with nothing specific, out of modesty.`,
        `Taking credit for the team's work, or mentioning yourself in every meeting.`,
        `Making decisions on calls and never writing them down.`
      ],
      say: [
        `"This month: incidents down from 6 to 2, reviews under a day, and Karthik now owns search filters. One risk: the payments vendor."`,
        `"Asha's rollback script let us undo Tuesday's release in two minutes; customers saw nothing."`,
        `"What would you want to be able to say about my team at the next review?"`
      ],
      sources: [
        `Julia Evans, "Get your work recognized: write a brag document" (jvns.ca, 2019)`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017)`,
        `Andrew S. Grove, *High Output Management* (1983), on measuring output rather than activity`
      ],
      related: ['scenario:invisible-work', 'phrase:visible-outcomes', 'phrase:visible-monthly', 'phrase:visible-credit', 'term:brag-document', 'tool:journal', 'tool:adr']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'owning-mistakes', track: 'leadership', minutes: 6,
      title: 'Owning mistakes, fast',
      summary: 'Say it first, say it fast, say what you will change. Own the team\'s mistakes to the outside world and fix them inside, without blame.',
      keywords: ['mistake', 'mistakes', 'own it', 'ownership', 'accountability', 'apology', 'extreme ownership', 'blame', 'saving face', 'admit', 'wrong call'],
      body: `## Why speed matters
A mistake you report yourself, early, with what you are doing about it, usually costs you a little trust and often earns some back. The same mistake discovered by someone else a week later costs far more, because now people wonder what else you have not told them. The rule is simple and hard: **say it first, say it fast, say what you will change.**

## The three parts
1. **What happened, plainly.** "I approved the release without the load test." No passive voice ("mistakes were made"), and no story about how busy you were.
2. **The effect.** "Checkout was slow for 40 minutes at the peak."
3. **What you are doing, and what you will change.** "It's rolled back. From now on no release goes out without the load test, and I've added it to the checklist."

Then stop. A long apology makes the mistake about you; a short one with a change makes it about the fix.

## Own the team's mistakes outside, fix them inside
When your team gets something wrong, you own it to the outside world: *"My team missed it; here's what we're doing."* You never name the developer to a stakeholder. Inside the team, you look at what in the system let it happen, without blame ([[lesson:incidents]]). Jocko Willink and Leif Babin's *Extreme Ownership* (2015) puts the strongest form of the point: a leader owns everything in their world, including what others got wrong, because the leader set the conditions.

## It makes the team safer
Amy Edmondson's early research in hospitals found that the better-led teams reported more errors, not fewer. They were not making more; they felt safer saying so. When a lead says *"I got that wrong"* out loud, the team learns that saying so is normal. A lead who never admits a mistake teaches the team to hide theirs.

## Not a show of guilt
Owning a mistake is not punishing yourself in public or promising "it will never happen again". A promise is not a change; a checklist step, an alert or a test is.

## In an Indian workplace
Saving face pulls hard, and admitting a mistake to a senior can feel like a career risk. In practice, the leads who are trusted with more are the ones whose bad news comes early. A short, calm *"That was my call, and it was wrong"* is rare enough to stand out.`,
      analogy: `Owning a mistake fast is failing fast in a system. A service that returns an error at once, with a clear message, is easy to work with. One that hides the failure, retries silently and corrupts data downstream is the one everyone stops trusting.`,
      mistakes: [
        `Waiting until you have fixed it before telling anyone.`,
        `Explaining why it was not really your fault before saying what happened.`,
        `Naming the developer who made the mistake to a stakeholder.`,
        `Promising "it will never happen again" instead of naming the change.`,
        `A long public apology that makes the mistake about your feelings.`
      ],
      say: [
        `"That was my call, and it was wrong. Here's what happened, what we've done, and what I'm changing."`,
        `"My team missed this. It's fixed, and we'll share what we're changing by Friday."`,
        `"I told you Thursday; it'll be Monday. That's on me: I didn't allow for the review."`
      ],
      sources: [
        `Amy C. Edmondson, "Learning from Mistakes Is Easier Said Than Done", *Journal of Applied Behavioral Science*, 1996; and *The Fearless Organization* (Wiley, 2018)`,
        `Jocko Willink and Leif Babin, *Extreme Ownership* (St. Martin's Press, 2015)`,
        `Betsy Beyer and others (eds.), *Site Reliability Engineering* (O'Reilly, 2016), "Postmortem Culture: Learning from Failure"`
      ],
      related: ['phrase:mistake-own', 'phrase:mistake-team-shield', 'phrase:mistake-correct-early', 'scenario:saying-no-to-manager', 'scenario:junior-broke-production', 'scenario:public-blame-channel', 'tool:postmortem']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'shielding-the-team', track: 'leadership', minutes: 6,
      title: 'Taking pressure without passing on panic',
      summary: 'When pressure arrives from above, absorb the emotion and pass on the information: what changed, what it means for us, and what we will do.',
      keywords: ['pressure', 'shield', 'shielding', 'umbrella', 'filter', 'escalation from above', 'director', 'panic', 'weekend work', 'reorg', 'stress', 'buffer'],
      body: `## Two bad extremes
When pressure arrives from above (a director angry about a date, a customer escalation, a rumour about a reorganisation), new leads tend to do one of two things:
- **Pass it straight through:** forward the angry email to the team channel, call an emergency meeting, ask for weekend work. The team gets the panic without the context, and stops thinking clearly.
- **Absorb all of it in silence:** tell the team nothing and carry it alone. The team is then surprised by decisions it could have helped with, and you burn out.

## A filter, not a wall
The useful middle is to **absorb the emotion and pass on the information**. Before you tell the team anything, work out:
- **What actually changed?** A new date, a new priority, a customer at risk, or only someone's mood?
- **What does it mean for us?** Which work moves, which stops.
- **What will we do?** Your proposal, or the options you need the team's help to weigh.

Then tell them calmly, with the reasons: *"The director is worried about the 4 Dec date because the bank's audit moved. Here's what I've agreed: we drop the export feature from this release, and evenings and weekends stay free."*

## Push back upwards with facts
Protecting the team often means saying no above you, with a trade-off rather than a complaint: what fits by the date, what doesn't, and the cost of each option ([[lesson:positive-no]]). "The team will work the weekend" is not a plan; it is a loan against next month, with interest paid in bugs and resignations.

## Don't hide what the team needs to know
People can handle bad news; they handle uncertainty and rumours badly. If a reorganisation, a budget cut or a hard deadline will affect them, tell them what you know, what you don't, and when you will know more. *"I don't know yet whether our team moves. I'll tell you by Friday, whatever the answer."*

## Look after yourself
Absorbing pressure has a cost. Lara Hogan's *Resilient Management* (2019) suggests building a "Voltron" of people you can turn to: a mentor, a peer lead, a coach, each for a different kind of help. Talk the pressure through with someone outside the team before you respond to it.`,
      analogy: `A good lead is a buffer with backpressure, not a pass-through pipe. Bursty traffic from upstream gets smoothed into a steady rate the team can process, and when the queue really is too long, the buffer pushes back upstream instead of dropping messages or crashing the consumers.`,
      mistakes: [
        `Forwarding an angry message to the team channel.`,
        `Promising weekend work to calm a senior down.`,
        `Keeping a change that affects the team secret until it lands.`,
        `Passing on the mood without the facts: "Leadership is unhappy."`,
        `Carrying all the pressure alone, with nobody to talk it through with.`
      ],
      say: [
        `"Here's what changed, what it means for us, and what I've agreed. What am I missing?"`,
        `"I don't know yet. I'll tell you by Friday, whatever the answer."`,
        `"We can hit 4 Dec without the export feature, or ship everything on the 18th. Weekends aren't an option I'll offer."`
      ],
      sources: [
        `Lara Hogan, *Resilient Management* (A Book Apart, 2019)`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017)`,
        `William Ury, *The Power of a Positive No* (Bantam, 2007)`
      ],
      related: ['scenario:pressure-from-above', 'scenario:saying-no-to-manager', 'scenario:working-late-every-night', 'lesson:positive-no', 'phrase:lead-shield-context', 'tool:deadline']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'making-decisions', track: 'leadership', minutes: 7,
      title: 'Making decisions as a lead',
      summary: 'One-way and two-way doors, deciding with enough rather than all the information, saying who decides, and disagree and commit.',
      keywords: ['decision', 'decisions', 'decide', 'one-way door', 'two-way door', 'type 1', 'type 2', 'bezos', 'disagree and commit', 'rapid', 'daci', 'who decides', 'analysis paralysis'],
      body: `## Most decisions can be undone
Jeff Bezos's 2015 letter to Amazon's shareholders splits decisions into two types. **Type 1** decisions are one-way doors: hard or impossible to reverse, such as choosing a primary database or signing a three-year contract. They deserve care and time. **Type 2** decisions are two-way doors: if you are wrong, you walk back through. Most decisions are Type 2, and the common mistake is to treat them like Type 1, with weeks of debate and a committee.

Before a debate starts, ask *"If we get this wrong, what does it cost to undo?"* A library behind an interface, a team process, a feature behind a flag: decide today, and put a date in the calendar to look again.

## Enough information, not all of it
Bezos's 2016 letter suggests that most decisions should be made with about 70% of the information you wish you had; waiting for 90% usually means deciding too slowly. For a one-way door, wait for more. For a two-way door, the cost of a slow decision is often bigger than the cost of a wrong one.

## Say who decides
Many arguments are really about who decides. Bain's **RAPID** (Paul Rogers and Marcia Blenko, "Who Has the D?", *Harvard Business Review*, 2006) names the roles: who **recommends**, who must **agree**, who **performs** the decision, who gives **input**, and the one person who **decides**. [[term:daci]] is a similar list. Say it at the start: *"Divya recommends, we all give input, and I decide by Thursday."*

## Disagree and commit
Once a decision is made, everyone, including those who argued against it, commits to making it work. That only works if they were heard first: ask the quiet people directly, write down the strongest objection, and say why you decided anyway. Then do not reopen the decision unless the facts change.

## Write it down
A decision that lives only in a call gets made again every month. A short note (what we decided, why, what we turned down, when we would look again), or a decision record for big ones ([[tool:adr]]), ends the loop.

## In an Indian workplace
Teams often wait for the most senior person to decide, even on two-way doors the team could decide itself. Pushing small decisions down, and saying so (*"This one is yours; tell me what you chose"*), is how a team learns to decide without you.`,
      analogy: `A Type 2 decision is a deploy behind a feature flag: ship it, watch the metrics, flip it back if you're wrong. A Type 1 decision is a migration that drops a column. You wouldn't hold a week of meetings for the first, or run the second on a Friday afternoon with no rollback plan.`,
      mistakes: [
        `Treating every decision as irreversible, so small choices take weeks.`,
        `Rushing a one-way door because the room is impatient.`,
        `Never saying who decides, so the loudest voice does.`,
        `Reopening a decision every time someone new disagrees.`,
        `Asking for objections only after the decision is made.`
      ],
      say: [
        `"If we're wrong, how hard is this to undo? If it's easy, let's decide today and look again in two weeks."`,
        `"Divya recommends, everyone gives input, and I'll decide by Thursday."`,
        `"I've heard the concern about latency, and I'm going ahead because of the cost. We'll look again in a month."`
      ],
      sources: [
        `Jeff Bezos, letters to Amazon shareholders: 2015 (Type 1 and Type 2 decisions) and 2016 (disagree and commit; deciding with about 70% of the information)`,
        `Paul Rogers and Marcia Blenko, "Who Has the D? How Clear Decision Roles Enhance Organizational Performance", *Harvard Business Review*, January 2006`,
        `Michael Nygard, "Documenting Architecture Decisions" (2011)`
      ],
      related: ['scenario:the-one-way-door', 'scenario:design-argument', 'tool:adr', 'phrase:lead-two-way-door', 'term:one-way-door', 'term:disagree-and-commit', 'term:rapid', 'lesson:rfcs-and-adrs']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'your-calendar', track: 'leadership', minutes: 6,
      title: 'Your calendar as a lead',
      summary: 'The maker\'s and the manager\'s schedule, a meeting audit, time blocked for deep work, and why the team copies your hours.',
      keywords: ['calendar', 'meetings', 'time management', 'focus', 'deep work', "maker's schedule", 'makers schedule', 'too many meetings', 'decline', 'busy', 'energy'],
      body: `## Where a lead's week goes
Ask a new lead where their week went and the answer is usually "meetings". Some are the job: 1:1s, planning, reviews, unblocking people. Many are not: meetings where you listen and say nothing, status calls a written note would replace, recurring meetings nobody remembers starting.

## Two kinds of schedule
Paul Graham's essay "Maker's Schedule, Manager's Schedule" (2009) explains the clash. A manager's day is cut into one-hour slots, and a meeting costs one slot. A maker, such as a developer, needs half-days, and one meeting in the middle of an afternoon can wreck it. Two things follow:
- **For you:** block two or three half-days a week for deep work (design, reviews, writing), and defend them like meetings.
- **For your team:** cluster their meetings, around the stand-up or on one afternoon, so developers keep long blocks. Cal Newport's *Deep Work* (2016) argues that unbroken focus is where the most valuable work gets done.

## Audit one week
Look at last week's calendar and mark each meeting:
- **It needs me, and I need it:** keep it.
- **It needs someone from my team, not me:** send them, and ask for two lines afterwards. It is a chance for them to grow, too.
- **It could be a written note:** propose one.
- **Nobody would miss it:** decline, politely.

Declining is easier with a reason and an alternative: *"I'll skip this one; Divya will bring back anything that needs me."*

## Important before urgent
Urgent things (messages, pings, small fires) crowd out the important ones (1:1s, planning, growing people, fixing the cause of the fires). Put the important things in the calendar first, as fixed blocks, and let the urgent ones fill the gaps. Andy Grove called the work that raises a team's output for months "high-leverage": a good 1:1, a clear plan, a well-written decision. It rarely feels urgent.

## Energy, not only time
Long days every day are not a badge; they are a planning problem, and the team copies them. Notice which work drains you and which restores you, and keep a fixed end to the day more often than not. See [[scenario:working-late-every-night]].`,
      analogy: `Your calendar is a CPU scheduler. If every interrupt is serviced at once, the long-running jobs (design, planning, growing people) never finish, and the machine thrashes on context switches. Reserve time slices for the important jobs and batch the interrupts.`,
      mistakes: [
        `Accepting every meeting invitation by default.`,
        `Scattering the team's meetings across the day, so nobody gets a long block.`,
        `Cancelling 1:1s first when the week gets busy.`,
        `Using evenings for the deep work the day had no room for.`,
        `Going to meetings "to stay informed" when a note would do.`
      ],
      say: [
        `"I'll skip this one; Divya will bring back anything that needs me."`,
        `"Could this weekly sync become a written update, and we meet only when there's a decision?"`,
        `"Tuesday and Thursday mornings are for design and reviews. If it's urgent, call me."`
      ],
      sources: [
        `Paul Graham, "Maker's Schedule, Manager's Schedule" (paulgraham.com, July 2009)`,
        `Cal Newport, *Deep Work* (Grand Central, 2016)`,
        `Andrew S. Grove, *High Output Management* (1983), on high-leverage activities`
      ],
      related: ['scenario:calendar-full-of-meetings', 'scenario:working-late-every-night', 'lesson:interruptions', 'lesson:meetings-decisions', 'tool:prioritise', 'phrase:lead-skip-meeting', 'term:makers-schedule', 'term:eisenhower-matrix']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'reflection-and-growth', track: 'leadership', minutes: 6,
      title: 'Reflection: learning from your own weeks',
      summary: 'Experience alone does not teach. Ten minutes a week with the After Action Review\'s four questions, a "next time" you can check, and feedback you ask for.',
      keywords: ['reflection', 'reflect', 'journal', 'after action review', 'aar', 'kolb', 'learning cycle', 'growth', 'self-improvement', 'ask for feedback', 'retrospective for yourself'],
      body: `## Experience alone does not teach
Two leads with the same five years can have learned very different amounts. The difference is usually reflection: stopping to ask what happened and why, and then changing something. David Kolb's learning cycle (*Experiential Learning*, 1984) describes it as four steps: an experience, reflecting on it, drawing a conclusion, and trying something new, which becomes the next experience. Skip the reflection and the cycle stops; you can repeat the same year five times.

## The After Action Review
The US Army's After Action Review (set out in *A Leader's Guide to After-Action Reviews*, 1993) asks four questions after any event:
1. What did we expect to happen?
2. What actually happened?
3. Why was there a difference?
4. What will we do next time?

It works for one person as well as for a team. Ten minutes on a Friday afternoon, about one thing from your week (a meeting, a decision, a conversation), is enough. The [[tool:journal]] is built around these four questions.

## Write the change, not the feeling
"I need to communicate better" changes nothing. "Before Sprint Planning, I'll send the PM the three open questions by Thursday" does. A good "next time" is a specific action you could check: what, when, and with whom. It is also about what **you** will do: "the PM should send requirements earlier" is a wish, not a plan.

## Write down the wins too
Reflection is not only for mistakes. What went well, and why, is what you want to repeat on purpose, and a journal of nothing but failures is a quick way to lose confidence. Aim for a mix.

## Ask for feedback on yourself
Your own view of your week has blind spots. Kim Scott (*Radical Candor*, 2017) suggests asking your team for criticism first, with a specific question, and rewarding it when you get it: *"What's one thing I could do, or stop doing, that would make it easier to work with me?"* Then wait through the silence. Douglas Stone and Sheila Heen's *Thanks for the Feedback* (2014) is about the harder half: hearing the answer without defending yourself. See [[lesson:receiving-feedback]].

## Check the habit, not the score
Retake the self-assessment every month or two, and play *A week as a lead* from the Scenarios page to compare how you rate yourself with what you choose under pressure. A lower score after a retake often means you have become more honest, not worse.`,
      analogy: `Reflection is a postmortem you run on yourself: blameless, about the system you work in and your own habits, with an action that has an owner (you) and a date. Without it, you fix the same incident every quarter.`,
      mistakes: [
        `Reflecting only when something goes badly.`,
        `Writing resolutions ("be more proactive") instead of actions.`,
        `Writing down what other people should do differently.`,
        `Keeping no record, so the lesson from March is forgotten by June.`,
        `Asking "any feedback for me?" and hearing "no, all good" every time.`
      ],
      say: [
        `"What's one thing I could do, or stop doing, that would make it easier to work with me?"`,
        `"Next time I'll send the open questions to the PM by Thursday, before planning."`,
        `"That went well because we agreed the rollback first. Let's keep doing that."`
      ],
      sources: [
        `Headquarters, Department of the Army, *A Leader's Guide to After-Action Reviews* (Training Circular 25-20, 1993)`,
        `David A. Kolb, *Experiential Learning: Experience as the Source of Learning and Development* (Prentice Hall, 1984)`,
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017), on asking for criticism`,
        `Douglas Stone and Sheila Heen, *Thanks for the Feedback* (Viking, 2014)`
      ],
      related: ['tool:journal', 'tool:plan90', 'lesson:receiving-feedback', 'phrase:lead-ask-feedback', 'term:after-action-review', 'scenario:invisible-work']
    }
  );
})(window.LELT);
