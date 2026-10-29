/*
 * playbooks.js - step-by-step guides for the meetings a lead runs, shown by js/views/playbooks.js
 * under the Tools tab (#/playbooks/<id>). The lessons explain the ideas; a playbook is what you open
 * ten minutes before the meeting.
 *
 *   {id, track, title, summary, keywords, start: 'HH:MM' (a usual start time),
 *    scales: true when the agenda grows with the Sprint length, monthMax: the Scrum Guide's limit for
 *    a one-month Sprint, in minutes,
 *    purpose (Markdown), who (Markdown), prep: [Markdown],
 *    agenda: [{title, minutes: for a two-week Sprint (multiples of 10 when it scales), do (Markdown),
 *              say: a line to say (optional), format: true for the step a retro format changes}],
 *    after: the text to send afterwards, with [placeholders],
 *    mistakes: [Markdown], sources: [Markdown], related: ['lesson:id', ...],
 *    formats: [{id, title, when, columns: [{title, prompt}]}] (the retrospective only)}
 *
 * A scaling agenda is multiplied by weeks / 2, so a one-week Sprint halves it and a one-month
 * Sprint doubles it.
 *
 * A timeline playbook (kind: 'timeline', for onboarding and offboarding) is a plan over weeks, not a
 * meeting. Instead of start, scales and minutes it has
 *   dates: [{id, label, offset: the default, in working days from today (or from the date named in
 *            `from`), monday: true to move the default on to a Monday, hint}], prepTitle,
 *   agenda: [{anchor: a date id, at: working days from that date (0 = the date itself, negative =
 *             before it), when: 'Day 1', title, do, say}]
 * and its "after" is the message to the team.
 *
 * An incident playbook (kind: 'incident') runs by the clock from the minute something broke:
 *   severities: [{id, title, means, who: who is called, update: minutes between stakeholder updates}],
 *   agenda: [{at: minutes after it started (in order), when: 'By minute 5', title, do, say,
 *             update: true on the step that sends the first update}],
 *   update: the stakeholder update with [Placeholders], followup (Markdown: after the impact stops),
 * and its "after" is the all-clear message.
 */
(function (U) {
  'use strict';
  var GUIDE = 'https://scrumguides.org/scrum-guide.html';
  U.data.playbooks = [

    /* ------------------------------------------------------------------ */
    {
      id: 'sprint-planning', track: 'scrum', start: '10:00', scales: true, monthMax: 480,
      title: 'Sprint Planning',
      summary: 'Start the Sprint with one goal the team believes in and a forecast the data supports, in about two hours for a two-week Sprint.',
      keywords: ['sprint planning', 'planning meeting', 'sprint goal', 'agenda', 'forecast', 'capacity', 'playbook'],
      purpose: `Sprint Planning starts the Sprint. The Scrum Guide gives it three topics: **why** this Sprint is valuable (the Sprint Goal), **what** can be Done, and **how** the work will get done. It ends with a Sprint Backlog: the goal, the chosen items and the plan for the first days.

The ideas are in [[lesson:sprint-planning]]. This page is how to run the meeting.`,
      who: `The whole Scrum Team: the Product Owner, the Developers and the Scrum Master. The Product Owner brings the objective and the ordered backlog. **The Developers decide how much they take on**, because they do the work. Others can be invited to advise, such as a security expert or someone from a team you depend on.

As the lead you often facilitate: keep the time, put the numbers on the screen, and make sure the quiet people get a say in the forecast too.`,
      prep: [
        `This Sprint's capacity: leave, holidays, on-call and part-time people, from the [[tool:capacity|sprint capacity calculator]].`,
        `What the team finished in the last three Sprints (finished, not planned).`,
        `The top of the Product Backlog refined: acceptance criteria written and sized (see [[playbook:refinement|the refinement playbook]]).`,
        `The Product Owner's proposed objective for the Sprint, in one sentence.`,
        `For the top items, any dependency on another team, with the date they agreed ([[tool:dependencies|dependency map]]).`,
        `Last Retrospective's actions that need room in this Sprint.`
      ],
      agenda: [
        { title: 'Open: capacity and the objective', minutes: 10,
          do: `Show this Sprint's capacity next to the last three Sprints' results. The Product Owner proposes what would make this Sprint valuable.`,
          say: `"We have about 78% of a normal Sprint: Asha is on leave and Friday is a holiday. Neha, what would make these two weeks most valuable?"` },
        { title: 'Why: write the Sprint Goal', minutes: 20,
          do: `Agree one sentence that says what the Sprint achieves for a user or the business: not a list of tickets. Write it where everyone can see it for the rest of the meeting.`,
          say: `"If we finish only one thing this Sprint, what should it be? Let's write that down as the goal."` },
        { title: 'What: choose the items', minutes: 40,
          do: `The Developers take items in the Product Owner's order until they reach what the data supports. Name a few stretch items separately. Stop at the team's real capacity, not the number someone hopes for.`,
          say: `"We finished 36, 41 and 38 points, and we have 6 fewer developer-days. That's about 35. Which 35 serve the goal best?"` },
        { title: 'How: plan the first days', minutes: 40,
          do: `For each item, the Developers sketch the work needed to meet the Definition of Done: tasks of a day or less for the first days, including review, testing and release work. Spot anything that waits on another team.`,
          say: `"What's the first task on this one, and does any of it wait on someone outside the team?"` },
        { title: 'Close: read back and confirm', minutes: 10,
          do: `Read back the goal, the forecast, the risks and who is away. Ask each Developer how confident they are. A quiet "yes" is not agreement.`,
          say: `"Goal: saved cards at checkout. Forecast: 34 points. Risk: the bank's sandbox. On a scale of one to five, how confident is each of you in this plan?"` }
      ],
      after: `Sprint [number] plan, [first day] to [last day]

Sprint Goal: [one sentence]
Forecast: [points or items], from the last three Sprints ([n], [n], [n]) and [x]% of normal capacity
Stretch, if there is time: [items]
Risks: [risk], owner [name], next check [date]
Away: [who, which days]
Sprint Review: [day and time]`,
      mistakes: [
        `Starting from the tickets instead of the goal. The meeting turns into a ticket auction and nobody can say what the Sprint is for.`,
        `Letting the loudest or most senior voice set the number. The Developers forecast; the last three Sprints anchor them.`,
        `Planning to 100% of capacity. Interruptions, reviews and support take their share of every Sprint.`,
        `Running out of time before the "how", so the first morning starts with nobody sure what to pick up.`,
        `Skipping the read-back, so half the team leaves with a different idea of the goal.`
      ],
      sources: [
        `[The Scrum Guide 2020: Sprint Planning](${GUIDE}#sprint-planning), on the three topics and the eight-hour limit for a one-month Sprint`,
        `Mike Cohn, *Agile Estimating and Planning* (Prentice Hall, 2005), on planning from velocity and capacity`
      ],
      related: ['lesson:sprint-planning', 'tool:capacity', 'scenario:sprint-planning-overcommit', 'phrase:planning-data', 'phrase:capacity-planning']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'refinement', track: 'scrum', start: '15:00', scales: false,
      title: 'Backlog refinement',
      summary: 'Turn the next few weeks of backlog items into work the team understands, can size and can test, in a 60-minute session.',
      keywords: ['refinement', 'backlog refinement', 'grooming', 'acceptance criteria', 'sizing', 'splitting stories', 'playbook'],
      purpose: `Refinement turns rough backlog items into small, clear items with acceptance criteria and a size, ready for Sprint Planning. It is not one of the Scrum events: the Scrum Guide calls it an ongoing activity. Most teams still hold one or two sessions a week, because a fixed time makes sure it happens.

The ideas (user stories, INVEST, acceptance criteria) are in [[lesson:refinement-stories]].`,
      who: `The Product Owner, who explains the problem and answers questions (or brings someone who can), and **the Developers who will do the work, who size it**. A designer or tester often joins. Invite someone from another team only for the item that needs them, and only for that part of the session.`,
      prep: [
        `The Product Owner picks the items: enough for the next one or two Sprints, in order.`,
        `Each item has its problem and its user written down, even roughly. The "so that" matters more than the solution.`,
        `Run each item's text through the [[tool:prd|PRD question generator]] and bring the questions it raises.`,
        `Mock-ups, real examples or data the team will need to understand the item.`,
        `Your Definition of Ready, if the team uses one: a checklist, not a gate.`
      ],
      agenda: [
        { title: 'The goal and the items', minutes: 5,
          do: `The Product Owner says which goal these items serve, and which ones to cover today, in order.` },
        { title: 'Understand each item', minutes: 25,
          do: `For each item, the Product Owner explains the problem and the user; the team asks questions and turns vague words into examples and numbers. Give each item about eight minutes. If it needs more, it needs a spike or a session of its own.`,
          say: `"What problem does this solve for the user? Can you walk us through one real example?"` },
        { title: 'Acceptance criteria and splitting', minutes: 15,
          do: `Write the acceptance criteria together (Given, When, Then). Split anything bigger than half a Sprint by user flow or by business rule, not by layer.`,
          say: `"This is more than half a Sprint. Can we split it into 'earn points' and 'redeem points'?"` },
        { title: 'Size it', minutes: 10,
          do: `The Developers size each item. Big differences are the useful part: ask the highest and the lowest to explain, then size again.`,
          say: `"Divya says 3 and Arjun says 13. What does each of you know that the other doesn't?"` },
        { title: 'Close: ready, open, owners', minutes: 5,
          do: `Say which items are ready for planning and which still have open questions, each question with an owner and a date.`,
          say: `"Three items are ready. Search filters wait on Neha's answer about the brand list, by Wednesday."` }
      ],
      after: `Refinement, [date]

Ready for Sprint Planning:
- [item]: size [n], acceptance criteria agreed

Not ready yet:
- [item]: waiting on [question], [owner] answers by [date]

Split today:
- [old item] became [new item] and [new item]

Spikes agreed:
- [what we need to learn], [owner], at most [n] days`,
      mistakes: [
        `The Product Owner reads stories aloud while the team nods. Silence is not understanding: ask each person for an example or a question.`,
        `The lead sizes the items alone, or overrules the team's sizes.`,
        `Forty minutes on one item. Give each item a time limit, and turn what needs research into a spike.`,
        `Splitting by layer (a backend story and a frontend story), so neither half gives a user anything.`,
        `Leaving with open questions that nobody owns.`
      ],
      sources: [
        `[The Scrum Guide 2020: Product Backlog](${GUIDE}#product-backlog), on refinement as an ongoing activity and sizing by the Developers`,
        `Mike Cohn, *User Stories Applied* (Addison-Wesley, 2004)`,
        `Gojko Adzic, *Specification by Example* (Manning, 2011), on refining with concrete examples`
      ],
      related: ['lesson:refinement-stories', 'tool:prd', 'scenario:silent-refinement', 'scenario:vague-prd', 'phrase:ask-propose-number']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sprint-review', track: 'scrum', start: '15:00', scales: true, monthMax: 240,
      title: 'Sprint Review',
      summary: 'Show the Done work to the people who care about it, and decide together what to do next: a working session, not a presentation.',
      keywords: ['sprint review', 'demo', 'showcase', 'stakeholders', 'feedback', 'review meeting', 'playbook'],
      purpose: `The Sprint Review inspects what the Sprint produced, with the people who care about it, and decides what to do next. The Scrum Guide warns against treating it as a presentation: it is a working session, and the Product Backlog may change as a result.

The ideas are in [[lesson:review-and-retro]].`,
      who: `The Scrum Team and the stakeholders the Product Owner invites: users, support, sales, the business owner. The Product Owner leads and the Developers show their own work. Stakeholders give feedback; **the Product Owner decides** what changes in the backlog.`,
      prep: [
        `Only Done work, running somewhere people can try it. Unfinished work is discussed honestly, not demoed (see [[lesson:definition-of-done]]).`,
        `Each demo rehearsed once, on the real environment, with realistic data.`,
        `The right stakeholders invited a week ahead, told what they will see and what you want from them.`,
        `A few numbers worth showing: usage, errors, support tickets, progress toward the Product Goal.`,
        `One person to write down every piece of feedback, so the presenters can listen.`
      ],
      agenda: [
        { title: 'Open: the goal, what is Done, what is not', minutes: 10,
          do: `The Product Owner restates the Sprint Goal and says plainly what is Done and what is not.`,
          say: `"Our goal was saved cards at checkout, and that's Done. Partial refunds aren't: they need two more days, and here's why."` },
        { title: 'Show the Done work', minutes: 20,
          do: `The Developers who built it show it working, from the user's side. Mention the problems you hit and how you solved them, briefly.` },
        { title: 'Feedback', minutes: 10,
          do: `Ask the stakeholders specific questions. Write every request down. Don't argue with it, and don't promise anything on the spot.`,
          say: `"What would stop your team using this tomorrow?"` },
        { title: 'What next', minutes: 10,
          do: `Look at what has changed: usage, the market, the timeline, the budget. Discuss what is most valuable to do next and what that means for the release.` },
        { title: 'Close: backlog changes and dates', minutes: 10,
          do: `The Product Owner says what changes in the Product Backlog. Confirm any new dates, and who follows up on what.`,
          say: `"Two changes: saved UPI handles move up, and the PDF export moves after the sale. I'll send the summary today."` }
      ],
      after: `Sprint [number] Review, [date]

Sprint Goal: [goal]: [met or not met]
Done and shown: [items]
Not done: [item], because [reason]; new date [date]
Feedback we heard:
- [person]: [feedback]
Changes to the Product Backlog, decided by [Product Owner]: [changes]
Next Review: [day and time]`,
      mistakes: [
        `A slide deck instead of working software. Nobody can give real feedback on a screenshot.`,
        `Demoing work that isn't Done, so a stakeholder plans on it.`,
        `Arguing with feedback in the room, or promising a feature on the spot. Write it down; the Product Owner decides.`,
        `No stakeholders at all: a team showing its own work to itself.`,
        `The lead presents everything while the people who built it sit silent.`
      ],
      sources: [
        `[The Scrum Guide 2020: Sprint Review](${GUIDE}#sprint-review), on the working session and the four-hour limit for a one-month Sprint`,
        `Mike Cohn, *Succeeding with Agile: Software Development Using Scrum* (Addison-Wesley, 2009)`
      ],
      related: ['lesson:review-and-retro', 'scenario:review-hijacked', 'scenario:not-done-at-review', 'phrase:review-feedback-capture', 'term:sprint-review']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'retrospective', track: 'scrum', start: '16:00', scales: true, monthMax: 180,
      title: 'Sprint Retrospective',
      summary: 'Look at how the team worked and pick one or two changes worth making, with five formats to rotate so it never runs on autopilot.',
      keywords: ['retrospective', 'retro', 'retro formats', 'retro format', 'start stop continue', 'mad sad glad', '4ls', 'sailboat', 'timeline', 'playbook'],
      purpose: `The Retrospective ends the Sprint. The team looks at how the Sprint went for people, interactions, processes, tools and the Definition of Done, and picks the most useful changes. The agenda below follows the five stages Esther Derby and Diana Larsen describe: set the stage, gather data, generate insights, decide what to do, close.

The ideas are in [[lesson:review-and-retro]].`,
      who: `The Scrum Team only: the Product Owner, the Developers and the Scrum Master. Managers and stakeholders stay out unless the team invites them, because people speak less freely in front of whoever writes their appraisal. Anyone can facilitate, and rotating it helps. **The team decides** which actions to take.`,
      prep: [
        `Last Retrospective's actions, and whether they happened.`,
        `A few facts from the Sprint: planned and finished, incidents, interruptions, the burn-down.`,
        `A format for this Sprint (choose one above): Mad, Sad, Glad after a hard Sprint; the Timeline after an incident.`,
        `A board everyone can write on at the same time: Miro, Confluence, or sticky notes on a wall.`,
        `A room or call booked for the full time, without managers.`
      ],
      agenda: [
        { title: 'Set the stage, and check last time\'s actions', minutes: 10,
          do: `Say what this retro is for and how long it takes. Check last time's actions: done or not, and why. Ask for one word each on how the Sprint felt.`,
          say: `"Before we start: did last retro's two actions happen? Then one word each for this Sprint."` },
        { title: 'Gather data', minutes: 20, format: true,
          do: `Everyone writes silently on the board for five minutes, one idea per note, in this format's columns. Then read the notes aloud and group similar ones.`,
          say: `"Five minutes, silently, one idea per note. I'll put mine up first."` },
        { title: 'Generate insights', minutes: 10,
          do: `Each person gets three votes. Discuss the top two groups: why did this happen, and what made it easy to get wrong? Talk about the system, never a person.` },
        { title: 'Decide what to do', minutes: 10,
          do: `Choose at most two actions, each with one owner and a date, small enough to start next Sprint. Put them on the Sprint board, where the work is.`,
          say: `"Which one change would make the most difference next Sprint? Who owns it, and by when?"` },
        { title: 'Close', minutes: 10,
          do: `Read the actions back. Thank people for something specific. Ask how useful the retro was, from one to five, and what to change next time.` }
      ],
      after: `Retrospective, Sprint [number]

Last time's actions: [action]: [done or not done, and why]
Format: [format]
What we noticed (the top themes):
- [theme]
Actions for next Sprint:
1. [action], owner [name], by [date]
2. [action], owner [name], by [date]
We check these at the start of the next Retrospective.`,
      formats: [
        { id: 'start-stop-continue', title: 'Start, Stop, Continue',
          when: 'Quick and simple. A good first format for a team new to retros.',
          columns: [
            { title: 'Start', prompt: 'What should we begin doing?' },
            { title: 'Stop', prompt: 'What is not helping us and should end?' },
            { title: 'Continue', prompt: 'What works and should stay?' }
          ] },
        { id: 'mad-sad-glad', title: 'Mad, Sad, Glad',
          when: 'After a hard or emotional Sprint, when feelings need room before solutions.',
          columns: [
            { title: 'Mad', prompt: 'What frustrated you?' },
            { title: 'Sad', prompt: 'What disappointed you?' },
            { title: 'Glad', prompt: 'What made you happy?' }
          ] },
        { id: 'four-ls', title: '4 Ls',
          when: 'When you want what the team learned on the board, not only its problems.',
          columns: [
            { title: 'Liked', prompt: 'What did you enjoy?' },
            { title: 'Learned', prompt: 'What did you learn?' },
            { title: 'Lacked', prompt: 'What was missing?' },
            { title: 'Longed for', prompt: 'What do you wish we had?' }
          ] },
        { id: 'sailboat', title: 'Sailboat',
          when: 'When you want to look ahead at risks as well as back at the Sprint.',
          columns: [
            { title: 'Wind', prompt: 'What pushed us forward?' },
            { title: 'Anchors', prompt: 'What slowed us down?' },
            { title: 'Rocks', prompt: 'What risks lie ahead?' },
            { title: 'Island', prompt: 'Where are we trying to get to?' }
          ] },
        { id: 'timeline', title: 'Timeline',
          when: 'After an incident or a long Sprint, when people remember it differently.',
          columns: [
            { title: 'Events', prompt: 'What happened, and on which day?' },
            { title: 'Highs', prompt: 'Which moments went well?' },
            { title: 'Lows', prompt: 'Which moments went badly?' }
          ] }
      ],
      mistakes: [
        `The same format every Sprint, until people write the same notes on autopilot.`,
        `Nine actions and no owners, so none of them happen.`,
        `Never checking last time's actions, which teaches the team that retros change nothing.`,
        `Naming a person on the board. Feedback about one person belongs in a private 1:1.`,
        `The lead talks most. Write silently first, and speak last.`
      ],
      sources: [
        `[The Scrum Guide 2020: Sprint Retrospective](${GUIDE}#sprint-retrospective), on its purpose and the three-hour limit for a one-month Sprint`,
        `Esther Derby and Diana Larsen, *Agile Retrospectives: Making Good Teams Great* (Pragmatic Bookshelf, 2006), the source of the five stages`,
        `Norman L. Kerth, *Project Retrospectives: A Handbook for Team Reviews* (Dorset House, 2001), on keeping retros blameless`,
        `[Retromat](https://retromat.org), Corinna Baldauf's library of retrospective activities`
      ],
      related: ['lesson:review-and-retro', 'scenario:retro-silent', 'phrase:retro-first', 'term:retrospective']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'onboarding', track: 'people', kind: 'timeline',
      title: 'Onboarding a new joiner',
      summary: 'From a week before day one to the 90-day review: what to have ready, a first change shipped in week one, a buddy, and goals in writing, each step dated from their first day.',
      keywords: ['onboarding', 'new joiner', 'new hire', 'first day', 'first week', 'buddy', '30 60 90', 'joining', 'induction', 'playbook'],
      dates: [{ id: 'first', label: 'Their first day', offset: 5, monday: true }],
      prepTitle: 'Before they join',
      purpose: `A new joiner decides in the first weeks whether this team is a good place to be, and learns how it really works, from what is ready on day one and how fast they get to do real work. HR handles the company's part: documents, payroll, policies. **You own the team's part**: the code, the people, the first real change, and goals they can see.

Every step below is a working day counted from their first day. The ideas are in [[lesson:onboarding-offboarding]].`,
      who: `**You**, the lead, who meets them first on day one and holds a weekly 1:1. **A buddy** from the team, a peer rather than the most senior person, chosen for patience and given real time for it in the Sprint. **HR and IT** for the laptop, accounts and documents. The team, who review their first pull request quickly and kindly.`,
      prep: [
        `The laptop and every account requested, with who owns each request: IT, Security, the client. In many companies VPN and client access take days.`,
        `A buddy chosen, told why, and given time for it in the next two Sprints.`,
        `An onboarding page that is up to date: how to build, run, test and deploy; who is who; the product's words.`,
        `Three small "starter" tickets: real, safe, and touching the main parts of the system.`,
        `The first two weeks on their calendar: stand-up, your 1:1, a product walkthrough, an architecture session.`,
        `Added to the [[tool:oneonone|1:1 planner]], weekly, with "For someone new" questions ready.`
      ],
      agenda: [
        { anchor: 'first', at: -5, when: 'A week before', title: 'Get the basics ready',
          do: `Chase the laptop and access requests. Confirm the buddy. Put the first two weeks on their calendar. Check that the onboarding page still builds the project: try it yourself on a clean machine, or ask the last joiner.`,
          say: `"Divya, Karthik joins on Monday. Would you be his buddy for the first month? I've taken two points off your Sprint so you have the time."` },
        { anchor: 'first', at: -2, when: 'Two days before', title: 'Send a welcome message',
          do: `Tell them when and where to arrive (or the video link), who meets them, what to bring for HR, and what the first week looks like. A short, warm message cuts first-day nerves.`,
          say: `"Looking forward to Monday! I'll meet you at 10:00 at reception. This week: set up, learn the product, and ship one small change with Divya, your buddy."` },
        { anchor: 'first', at: 0, when: 'Day 1', title: 'Welcome, and set up',
          do: `Meet them first, before HR takes over the day. Introduce the team. The buddy pairs on setup until the project builds and runs locally. Lunch with the team. Say clearly what is expected this week, and that nothing more is.`,
          say: `"By Friday I'd like you to have one small change in production, with Divya. That's all we expect this week. Ask anything, any time: stuck for an hour means ask."` },
        { anchor: 'first', at: 1, when: 'Day 2', title: 'The product and the system',
          do: `An hour using the product as a customer would, then the system on one page: the main services, where the data lives, how a change reaches production. Give them the starter tickets.` },
        { anchor: 'first', at: 4, when: 'End of week 1', title: 'First change shipped, first 1:1',
          do: `Their first pull request merged and deployed. In the first 1:1, ask what was confusing and what was missing from the onboarding page, and ask them to fix one thing while it is fresh.`,
          say: `"What surprised you this week? What was wrong or missing in the onboarding page? You're the best person to fix it right now."` },
        { anchor: 'first', at: 9, when: 'End of week 2', title: 'A real story, with the buddy as reviewer',
          do: `They pick up a small story from the Sprint, join refinement and planning, and give their first estimate. The buddy reviews; you stay out of the details.` },
        { anchor: 'first', at: 19, when: 'Day 30', title: 'Agree the 60- and 90-day goals',
          do: `Write down two or three goals for day 60 and day 90, together. Ask for feedback on the onboarding itself. Introduce them to the people outside the team they will work with: the Product Owner, testers, the platform team.`,
          say: `"Let's write down what good looks like at 60 and 90 days, so we both know. And what would you change about how we brought you in?"` },
        { anchor: 'first', at: 39, when: 'Day 60', title: 'Owning something',
          do: `They own a small feature end to end, review other people's pull requests, and shadow the on-call rotation. Check the goals: on track, or what would help?` },
        { anchor: 'first', at: 59, when: 'Day 90', title: 'The 90-day review',
          do: `Go through the goals with facts. Many Indian companies end probation at three or six months; whatever yours is, nothing in this review should be a surprise, because the 1:1s already said it. Ask them to update the onboarding page for the next person.`,
          say: `"Here's where you are against the goals we wrote down on day 30. Nothing here should surprise you; if it does, that's on me."` }
      ],
      after: `Please welcome [name], who joins us on [day] as [role]. [One line about their background.]

[Buddy] is [name]'s buddy for the first month: [name], ask them anything, any time.
In the first week, [name] will set up, learn the product, and ship a first small change.

Say hello in [channel], and take them to lunch!`,
      mistakes: [
        `Nothing ready on day one: no laptop, no access, a day of reading. It tells the new joiner how the team works.`,
        `Leaving onboarding to HR. HR covers the company; the code, the people and the first impression are yours.`,
        `A buddy with no time set aside, who is then too busy to help.`,
        `Weeks before the first real change. A small change shipped in week one builds confidence and finds every broken step in the setup.`,
        `No written goals, so the probation review surprises one of you.`
      ],
      sources: [
        `Google re:Work, "Help new employees succeed", on the five actions in Google's checklist for managers of new hires: discuss the role, assign a peer buddy, help build a network, check in regularly for six months, and encourage open dialogue`,
        `Laszlo Bock, *Work Rules!* (Twelve, 2015), on the onboarding checklist sent to Google's managers before a new hire's first day`,
        `Talya N. Bauer, *Onboarding New Employees: Maximizing Success* (SHRM Foundation, 2010), on the four Cs: compliance, clarification, culture and connection`,
        `Michael D. Watkins, *The First 90 Days*, updated and expanded edition (Harvard Business Review Press, 2013), on early wins`
      ],
      related: ['lesson:onboarding-offboarding', 'scenario:new-joiner-nothing-ready', 'scenario:quiet-junior', 'tool:oneonone', 'phrase:help-ask-early', 'term:buddy']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'offboarding', track: 'people', kind: 'timeline',
      title: 'Offboarding: when someone leaves',
      summary: 'From the day they tell you to a week after they leave: listen first, tell the team well, move what only they know by doing it together, and say a good goodbye.',
      keywords: ['offboarding', 'resignation', 'resign', 'resigns', 'leaving', 'notice period', 'knowledge transfer', 'kt', 'handover', 'exit interview', 'last day', 'playbook'],
      dates: [
        { id: 'told', label: 'The day they told you', offset: 0 },
        { id: 'last', label: 'Their last working day', offset: 40, from: 'told', hint: 'Notice periods in India are often 30 to 90 days' }
      ],
      prepTitle: 'In the first days',
      purpose: `When someone resigns, three things are at stake: what only they know, the team's confidence, and the person themselves, who may work with you again, recommend you, or come back. How you treat people who leave is watched closely by the people who stay.

Steps are working days from the day they told you, or back from their last day. The ideas are in [[lesson:onboarding-offboarding]]; the knowledge risk is practised in [[scenario:key-person-resigns]].`,
      who: `**You**, who hears first and runs the plan. **Your manager and HR**, for the last day, the notice period, leave and any counter-offer, which is not yours alone to make. **The new owners** of each piece of their work, named and given time. **The person leaving**, who is still a member of the team until the last day.`,
      prep: [
        `Their notice period and leave balance from HR, so the last day is a real date.`,
        `A list of everything they own: services, scheduled jobs, scripts, dashboards, alerts, on-call, client contacts, work in progress.`,
        `A new owner for each item, who agreed, and has time for it in the Sprint.`,
        `The knowledge risk in the [[tool:raid|RAID log]], with an owner and a date.`,
        `Your questions for the exit conversation, written before you meet.`
      ],
      agenda: [
        { anchor: 'told', at: 0, when: 'The day they tell you', title: 'Listen first',
          do: `Thank them for telling you directly. Ask what made them decide, and listen without arguing or making them feel guilty. Do not promise a counter-offer; you may not be able to keep it. Agree who will be told, and when.`,
          say: `"Thank you for telling me first. Can I ask what made you decide? I'd like to understand, not to change your mind on the spot."` },
        { anchor: 'told', at: 1, when: 'The next day', title: 'Tell your manager and HR',
          do: `Confirm the last day: notice period, leave balance, any early release. If anyone wants to make a counter-offer, it is a decision for your manager and HR, made calmly, and it rarely fixes why people leave.` },
        { anchor: 'told', at: 2, when: 'Within three days', title: 'Tell the team, together',
          do: `Before the rumour does. Let them say it themselves if they want to. Then you say what happens next: who takes over what, and that there is a plan.`,
          say: `"Rahul has decided to move on; his last day is the 15th. We'll miss him. Here's the handover plan, and who picks up what."` },
        { anchor: 'told', at: 4, when: 'End of the first week', title: 'List what only they know',
          do: `Go through their work together: services, jobs, scripts, credentials, client contacts, on-call, half-finished work. Give each item a new owner and a date. Put the gaps in the RAID log.` },
        { anchor: 'last', at: -15, when: 'Three weeks before the last day', title: 'Hand over by doing',
          do: `The new owner does the work while the leaver watches and corrects, not the other way round. Pair on the next release or the next incident. Record short walkthroughs of anything run rarely, such as the month-end job.` },
        { anchor: 'last', at: -10, when: 'Two weeks before', title: 'Move the ownership',
          do: `On-call, code owners, alerts and runbooks, client contacts and access move to the new owners, and you announce it. From now on, questions go to the new owner first.` },
        { anchor: 'last', at: -5, when: 'The last week', title: 'The exit conversation, and thanks',
          do: `Ask what you should change: what they would fix about the team, the work, and you. Listen; do not defend. Plan the farewell. If they did good work, offer to be a reference.`,
          say: `"What's one thing I could have done differently as your lead? I'd really like to know."` },
        { anchor: 'last', at: -1, when: 'The day before', title: 'Access and loose ends',
          do: `Agree with IT that access ends at the end of the last day, not hours after the resignation. Personal files off the laptop. A way for the team to reach them with a question in the first weeks, if they are willing.` },
        { anchor: 'last', at: 0, when: 'The last day', title: 'A good goodbye',
          do: `A farewell with the team, and a specific thank you for what they built. Access ends at the end of the day.`,
          say: `"Thank you for the settlement service, and for teaching Asha how it works. You're welcome back any time."` },
        { anchor: 'last', at: 5, when: 'A week after', title: 'Check the gaps',
          do: `What broke, or turned out to be unknown? Update the runbooks, close or update the RAID item, and check that the new owners are not overloaded.` }
      ],
      after: `[Name] has decided to move on. Their last working day is [day].

Thank you, [name], for [something specific they built or did].

Handover: [new owner] takes over [area] from [day]; [new owner] takes [area]. The plan is in [link].
From [day], questions about [area] go to [new owner].`,
      mistakes: [
        `Treating the resignation as a betrayal: guilt, a cold shoulder, no more interesting work. The people who stay are watching.`,
        `A counter-offer made in a panic. It rarely fixes why they are leaving, and everyone notices what it took to get one.`,
        `A handover of documents in the last two days, which nobody reads. Hand over by doing, weeks before.`,
        `The team hearing it from the rumour mill first.`,
        `Cutting access in front of them the day they resign, or forgetting to cut it at all.`
      ],
      sources: [
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on managing people and handling departures`,
        `Dick Finnegan, *The Stay Interview* (AMACOM, 2015), on asking people why they stay before they decide to leave`,
        `The "bus factor": how many people could leave before a project stalls; see [[term:bus-factor]]`
      ],
      related: ['scenario:star-resigns', 'scenario:key-person-resigns', 'tool:raid', 'lesson:onboarding-offboarding', 'term:knowledge-transfer', 'term:bus-factor']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'incident', track: 'eng', kind: 'incident',
      title: 'Running an incident',
      summary: 'From the first alert to the all-clear: declare it, name a commander, stop the impact before you hunt for the cause, and update people on a fixed rhythm. Each step has its clock time from when it started.',
      keywords: ['incident', 'outage', 'production down', 'prod down', 'prod issue', 'p1', 'sev1', 'incident commander', 'war room', 'severity', 'rollback', 'major incident', 'playbook'],
      severities: [
        { id: 'sev1', title: 'SEV1: critical', update: 30,
          means: 'Customers cannot pay, log in or use a core feature, data may be lost or exposed, or a large client is down.',
          who: 'Page the on-call engineer and yourself; name an incident commander at once; your manager, support and the business owner hear in the first update.' },
        { id: 'sev2', title: 'SEV2: major', update: 60,
          means: 'A core feature is broken or very slow for some customers and there is a workaround, or a feature that is not core is down for everyone.',
          who: 'The on-call engineer and you, in an incident channel; support and your manager hear in the first update.' },
        { id: 'sev3', title: 'SEV3: minor', update: 240,
          means: 'Something small is broken or slow; few customers notice, or only internal tools are affected.',
          who: 'The on-call engineer, in working hours. No commander is needed unless it grows; raise the severity the moment it does.' }
      ],
      purpose: `An incident is when something customers rely on is broken or at risk, and normal work stops until it is fixed. The first hour decides most of the damage, and it is rarely lost to slow typing. It is lost to everyone debugging at once while nobody decides, to a rollback delayed while people look for the root cause, and to customers and managers hearing nothing.

**As the lead, your job is usually to run the incident, not to fix it.** Enter the time it started and the severity: every step below gets its clock time, and the updates are scheduled. The ideas are in [[lesson:incidents]].`,
      who: `**The incident commander** decides and coordinates: often you, as lead, but never the person typing the fix. **The ops lead** does the hands-on work and says out loud what they are trying. **The communications lead** sends the updates to support, your manager and the business, so the people fixing it are not interrupted. **A scribe** keeps the timeline in the channel: times, what was tried, what was decided.

In a small team one person can hold two roles, except commander and ops lead: while you are typing, you are not watching the whole picture. The roles come from Google's SRE practice, which borrowed them from the incident command system fire services use.`,
      prepTitle: 'Before an incident',
      prep: [
        `An on-call rotation everyone knows, with a phone that works at 3 am and a second person to escalate to (see [[lesson:on-call]]).`,
        `Severity levels written down and agreed with the business, so nobody argues about them at 10:05.`,
        `Runbooks for the five most common alerts: what it means, what to check first, how to roll back.`,
        `A rollback for every service that takes minutes and was tried in the last month, and feature flags around risky changes.`,
        `Dashboards that show what customers feel, such as payment success and login success, not only CPU and memory.`,
        `A place for incidents: a channel naming rule (#inc-date-name), the support contacts, and this page bookmarked.`
      ],
      agenda: [
        { at: 0, when: 'Minute 0', title: 'Acknowledge, and say you have it',
          do: `Acknowledge the page within five minutes, so it stops escalating, and say in the team channel that you are looking. Open the dashboard that shows what customers feel. Answer one question first: is it real, and is it still happening?`,
          say: `"I've got the payment alert. Looking now; I'll say within five minutes whether it's an incident."` },
        { at: 5, when: 'By minute 5', title: 'Declare it: severity, channel, commander',
          do: `If customers are affected, declare it: choose the severity from the table above, open an incident channel, and say who the commander is. Declaring early is cheap, because you can always lower the severity. Declaring late is what turns a small incident into a big one.`,
          say: `"Declaring a SEV1: card payments are failing. Channel is #inc-1103-payments. I'm incident commander; Anil, you lead the fix."` },
        { at: 10, when: 'By minute 10', title: 'Roles, and the first question: what changed?',
          do: `Name the communications lead and a scribe. Then ask the question that solves most incidents: what changed? Deployments, configuration, feature flags, traffic, a dependency, an expired certificate. Ask everyone else to stay out of the main thread unless they are asked.`,
          say: `"Divya, you own the updates to support and the business. Karthik, please keep the timeline. What changed in the last two hours?"` },
        { at: 15, when: 'By minute 15', title: 'The first update to stakeholders', update: true,
          do: `Send it even if you know little: what is affected, since when, what you are doing, and when the next update comes. Silence is what brings managers into the channel asking questions. Use the update message below, and keep the rhythm for your severity.`,
          say: `"Update 1, 10:17: card payments are failing for about 30% of customers since 10:02. We suspect the 09:50 release and are checking. Next update at 10:45."` },
        { at: 30, when: 'By minute 30', title: 'Mitigate first, diagnose later',
          do: `Stop the impact before you understand it: roll back the last release, switch the feature flag off, fail over, add capacity, or block the bad traffic. The root cause can wait for the postmortem; customers who cannot pay cannot. If the timing points at a release and you can roll it back, roll it back now.`,
          say: `"We roll back 4.18 now. If payments recover, we look for the cause afterwards. Any objection in the next two minutes?"` },
        { at: 60, when: 'By minute 60', title: 'Not mitigated? Widen the circle',
          do: `Still not mitigated after an hour: bring in the owners of what you depend on (the platform team, the payment provider, the database administrators), raise the severity if the impact has grown, and agree with the business what customers are told. Ask the commander's question: what would we try if we had to stop it in ten minutes?`,
          say: `"We're not mitigated after an hour. Kiran, can you get the provider's on-call engineer on the call? Divya, please ask support to put the notice in the app."` },
        { at: 120, when: 'By hour 2', title: 'Look after the people',
          do: `Long incidents make tired people make new mistakes. Every two hours, hand over any role someone has held too long, make sure people eat, and plan the night if it will run late: who sleeps now and takes over at 2 am. Across onsite and offshore teams, hand over between time zones on purpose, with the timeline.`,
          say: `"Anil, hand the fix to Sameer with a five-minute summary and take an hour off. I'll hand command to Kiran at 1 am."` }
      ],
      update: `Update [N], [Time]: [What is affected, and for whom], since [Time].
Impact: [How many customers or orders, roughly].
What we are doing: [Rolling back the 09:50 release, failing over, waiting on the provider].
Workaround: [What customers or support can do meanwhile, or "none yet"].
Next update: [Time], or sooner if anything changes.`,
      after: `Resolved, [Time]: [What was affected] has worked normally since [Time]. [One line on what we did.]
Impact: [How many, for how long].
Next: a blameless postmortem by [Day], shared with [Who]. Thank you, [Names], for [the specific help].`,
      followup: `When the impact has stopped, confirm it with data (the error rate back to normal for 30 minutes), send the all-clear below, and keep watching for an hour. Then **book the postmortem within five working days**, while people remember. The [[tool:postmortem|postmortem builder]] turns the incident channel into the document, with the time to detect and the time to mitigate.`,
      mistakes: [
        `Everyone debugging in the same channel, and nobody deciding.`,
        `The lead taking over the keyboard: the team loses its commander, and the person who knows the system feels pushed aside.`,
        `Hunting for the root cause while customers still cannot pay, when a rollback would have stopped it in five minutes.`,
        `No update for an hour, so managers join the call to ask for one, which slows the fix.`,
        `Declaring too late because nobody wants to "over-react". A SEV1 that turns out to be a SEV3 costs nothing.`,
        `Asking "who did this?" in the incident channel. People stop sharing what they saw.`
      ],
      sources: [
        `Betsy Beyer, Chris Jones, Jennifer Petoff and Niall Richard Murphy (eds.), *Site Reliability Engineering* (O'Reilly, 2016), chapter 14, "Managing Incidents": the roles, a live incident document and clear handovers`,
        `Betsy Beyer and others (eds.), *The Site Reliability Workbook* (O'Reilly, 2018), chapter 9, "Incident Response"`,
        `PagerDuty, "Incident Response" documentation (response.pagerduty.com): severity levels, the incident commander and the scribe`,
        `Atlassian, *Incident Management Handbook*: severity levels and communicating during an incident`
      ],
      related: ['tool:postmortem', 'lesson:incidents', 'lesson:on-call', 'scenario:production-down-friday', 'scenario:junior-broke-production', 'scenario:same-incident-twice', 'term:incident-commander', 'term:severity-level']
    }
  ];
})(window.LELT);
