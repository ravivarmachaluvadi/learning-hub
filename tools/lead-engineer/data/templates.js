/*
 * templates.js - the message templates (js/views/tools/templates.js, #/tools/templates?t=<id>).
 *
 *   {id, title, summary, when (Markdown), keywords,
 *    fields: [{key, label, ph: placeholder, req: true when required, date: true when every line needs
 *              a day, lines: rows for a list (one item per line), options: [[value, label]] for a choice}],
 *    body: the text, with {{key}} where a field goes,
 *    sample: {key: value} (the "Load the example" values), parts: [{title, why}], related: [...]}
 *
 * How the body is filled (see fill() in the tool):
 *   - an empty required field shows as [its label];
 *   - a line whose optional field is empty is left out, and so is a block (lines between blank
 *     lines) whose every field line was left out;
 *   - a line that is only a prefix and a list field ("- {{goals}}", "1. {{options}}") becomes one
 *     line per item, numbered on from the prefix's number.
 */
(function (U) {
  'use strict';
  U.data.templates = [

    /* ------------------------------------------------------------------ */
    {
      id: 'kickoff',
      title: 'Project kickoff',
      summary: 'The invitation and one-page brief for a kickoff: why, goals with a measure, non-goals, who does what, milestones, risks, and the decisions to make in the room.',
      when: 'Send it two or three days before the kickoff meeting, to everyone who will build, decide or support the work.',
      keywords: ['kickoff', 'kick-off', 'project start', 'project brief', 'charter', 'non-goals', 'new project'],
      fields: [
        { key: 'project', label: 'Project', ph: 'Customer refunds in the app', req: true },
        { key: 'when', label: 'Kickoff date and time', ph: 'Thu 12 Nov, 11:00 to 12:00', req: true, date: true },
        { key: 'problem', label: 'Why we are doing this', ph: 'The problem, for whom, and what it costs today', req: true, lines: 2 },
        { key: 'goals', label: 'Goals, each with how we will know', ph: 'Refund calls to support drop from 1,200 to under 400 a week by 31 Jan', req: true, lines: 3 },
        { key: 'nongoals', label: 'Not in this project', ph: 'One per line: what we deliberately leave out', req: true, lines: 2 },
        { key: 'scope', label: 'The first release', ph: 'One item per line', req: true, lines: 3 },
        { key: 'team', label: 'Who does what', ph: 'Neha: Product Owner, decides scope and priorities', req: true, lines: 4 },
        { key: 'milestones', label: 'Milestones, each with a date', ph: 'Refund rules signed off: Fri 20 Nov', req: true, date: true, lines: 3 },
        { key: 'risks', label: 'Risks we already know about', ph: 'Each with what we are doing about it (optional)', lines: 2 },
        { key: 'ways', label: 'How we will work', ph: 'Sprint length, stand-up time, where questions and decisions go (optional)', lines: 3 },
        { key: 'decisions', label: 'Decisions we need in the meeting', ph: 'One question per line', req: true, lines: 2 }
      ],
      body: `Subject: Kickoff: {{project}}, {{when}}

Hi all,

We start {{project}} with a one-hour kickoff on {{when}}. Please read this page before we meet; it takes five minutes. The meeting is for your questions and for the decisions at the end, not for reading slides.

Why we are doing this
{{problem}}

Goals, and how we will know we got there
- {{goals}}

Not in this project
- {{nongoals}}

The first release
- {{scope}}

Who does what
- {{team}}

Milestones
- {{milestones}}

Risks we already know about
- {{risks}}

How we will work
- {{ways}}

Agenda
1. Why, and the goals (10 min)
2. Scope and non-goals: your questions (15 min)
3. Who does what, and how we will work (10 min)
4. Milestones and risks (15 min)
5. The decisions below (10 min)

Decisions we need in the meeting
- {{decisions}}

If you can't come, reply with your questions before the meeting and I'll bring them.`,
      sample: {
        project: 'Customer refunds in the app',
        when: 'Thu 12 Nov, 11:00 to 12:00',
        problem: 'Customers must call support to get a refund, and wait 2 days on average.\nSupport takes about 1,200 refund calls a week.',
        goals: 'Refund calls to support drop from 1,200 to under 400 a week by 31 Jan\nCustomers see their refund decision on screen within 2 seconds',
        nongoals: 'Partial refunds\nRefunds for cash-on-delivery orders',
        scope: 'Whole-order refunds from the app, to the original payment method\nCards, UPI and wallets (3 payment methods)\nAgent approval for refunds above 10,000 rupees',
        team: 'Neha: Product Owner, decides scope and priorities\nYou: lead engineer, owns the technical plan and the dates\nKiran: Platform lead, builds the refund endpoint\nDeepa: Finance controller, signs off the refund rules',
        milestones: 'Refund rules signed off by Finance: Fri 20 Nov\nRefund endpoint on staging: Fri 4 Dec\nLive for 10% of customers: Mon 14 Dec',
        risks: 'The bank sandbox may be late: Kiran asks the bank for a date in writing by Fri 13 Nov\nOnly Sameer knows the settlement job: Divya pairs with him from Mon 16 Nov',
        ways: 'Two-week Sprints from Mon 16 Nov\nStand-up at 10:00; Sprint Review every second Thursday at 15:00\nQuestions in the project channel; decisions written in the decision log',
        decisions: 'Who approves refunds above 10,000 rupees: support agents or Finance?\nDo we keep the old refund form running until the rollout ends?'
      },
      parts: [
        { title: 'Sent before the meeting', why: 'People who have read the brief ask better questions, and the hour goes on decisions instead of slides.' },
        { title: 'Why, and goals with a measure', why: 'A measurable goal settles scope arguments later: "does this help refund calls drop?"' },
        { title: 'Non-goals', why: 'Saying what the project will not do is the cheapest scope control there is.' },
        { title: 'Who does what', why: 'Names and what each person decides, not just job titles. People need to know whom to ask.' },
        { title: 'Milestones with dates', why: 'Dates on the first page turn a plan into something people can check.' },
        { title: 'Decisions at the end', why: 'A kickoff that ends with decisions made is one people remember, and come to next time.' }
      ],
      related: ['scenario:skip-the-kickoff', 'lesson:meetings-decisions', 'tool:dependencies', 'term:non-goals']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'escalation',
      title: 'Escalation',
      summary: 'Ask the people above you for a decision you can\'t make between you: the question and the date first, the options and your recommendation, the background last.',
      when: 'Send it when talking directly has not settled it, ideally together with the other person, and early enough that every option is still open.',
      keywords: ['escalation', 'escalate', 'decision needed', 'blocked', 'joint escalation', 'manager decision'],
      fields: [
        { key: 'to', label: 'To', ph: 'Rohan and Priya', req: true },
        { key: 'decision', label: 'The decision you need, as a question', ph: 'Should Platform build the refund endpoint this sprint?', req: true },
        { key: 'by', label: 'Decided by', ph: 'Wed 11 Nov, 5 pm', req: true, date: true },
        { key: 'impact', label: 'If nobody decides by then', ph: 'Refunds miss the festive sale on Fri 20 Nov.', req: true },
        { key: 'options', label: 'The options, each with what it costs', ph: 'One option per line', req: true, lines: 3 },
        { key: 'recommend', label: 'Your recommendation, and why', ph: 'Option 1: ...', req: true },
        { key: 'background', label: 'Background: two or three facts', ph: 'One fact per line', req: true, lines: 3 },
        { key: 'together', label: 'Raised together with', ph: 'Kiran (Platform lead) (optional)' }
      ],
      body: `Subject: Decision needed by {{by}}: {{decision}}

Hi {{to}},

We need your decision by {{by}}: {{decision}}
If it is not decided by then: {{impact}}

{{together}} and I are raising this together, so that you can decide quickly.

The options
1. {{options}}

We recommend: {{recommend}}

Background
- {{background}}

Reply here, or I can set up 15 minutes today. We will both go with what you decide.

Thanks,`,
      sample: {
        to: 'Rohan and Priya',
        decision: 'Should Platform build the refund endpoint this sprint, ahead of the gateway migration?',
        by: 'Wed 11 Nov, 5 pm',
        impact: 'Refunds miss the festive sale on Fri 20 Nov.',
        options: 'Platform builds it this sprint; the gateway migration moves by one week.\nWe build a temporary adapter on our side in 4 days; refunds move to Tue 24 Nov, after the sale.\nNothing changes; refunds ship in December.',
        recommend: 'Option 1: one week on the migration costs less than refunds missing the sale.',
        background: 'Refunds need the refund endpoint on the payment gateway.\nKiran\'s team planned it for December, after the gateway migration.\nWe asked on Mon 2 Nov; Kiran and I agree it needs your call.',
        together: 'Kiran (Platform lead)'
      },
      parts: [
        { title: 'The decision and the date in the subject', why: 'A busy manager decides from the subject line and the first two lines. Put the question and the date there.' },
        { title: 'What happens if nobody decides', why: 'The cost of waiting makes an escalation urgent without making it a complaint.' },
        { title: 'Raised together', why: 'Sent jointly with the other lead, it asks for a decision. Sent alone, it reads as blame.' },
        { title: 'Options and a recommendation', why: 'Options show you did the thinking; a recommendation makes it easy to say yes.' },
        { title: 'Background last', why: 'Facts for anyone who wants them, after the ask instead of before it.' }
      ],
      related: ['tool:dependencies', 'scenario:team-never-replies', 'phrase:dep-escalate', 'term:escalation']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dependency-request',
      title: 'Request to another team',
      summary: 'Ask a team that does not report to you for something you need: one person, the smallest exact ask, the date, why it matters to both of you, and a date to confirm.',
      when: 'Send it the day you find the dependency, not the week you need it. The [[tool:dependencies]] writes this for every dependency in your list.',
      keywords: ['dependency request', 'request', 'other team', 'cross-team', 'ask for help', 'dependency'],
      fields: [
        { key: 'person', label: 'To (one person)', ph: 'Kiran', req: true },
        { key: 'team', label: 'Their team', ph: 'Platform', req: true },
        { key: 'project', label: 'Your project', ph: 'customer refunds', req: true },
        { key: 'need', label: 'What you need: the smallest thing that unblocks you', ph: 'the refund endpoint on the payment gateway', req: true },
        { key: 'by', label: 'Needed by', ph: 'Fri 4 Dec', req: true, date: true },
        { key: 'impact', label: 'If it is late', ph: 'refunds miss the year-end sale.', req: true },
        { key: 'theirs', label: 'Why it helps them', ph: 'Their own goal it serves (optional)' },
        { key: 'offer', label: 'What you will do to make it easy', ph: 'A contract, a walkthrough, a test environment (optional)' },
        { key: 'confirm', label: 'Please confirm by', ph: 'Wed 11 Nov', req: true, date: true }
      ],
      body: `Subject: Request from {{project}}: {{need}} by {{by}}

Hi {{person}},

I lead the {{project}} work. We need {{need}} from {{team}} by {{by}}.

Why it matters: if it is late, {{impact}}
It helps your side too: {{theirs}}
To make it easy: {{offer}}

Could you confirm by {{confirm}} whether {{by}} works, or tell me which date does? Once we agree, I'll write it in our channel so neither of us has to remember it.

Thanks!`,
      sample: {
        person: 'Kiran',
        team: 'Platform',
        project: 'customer refunds',
        need: 'the refund endpoint on the payment gateway',
        by: 'Fri 4 Dec',
        impact: 'refunds miss the year-end sale.',
        theirs: 'refunds would be the first real user of the new gateway, which is your goal for this quarter.',
        offer: 'we have written the API contract, and Divya can walk your team through it in 15 minutes.',
        confirm: 'Wed 11 Nov'
      },
      parts: [
        { title: 'One person, not a team', why: 'A request to "the platform team" belongs to nobody. Write to one person who can say yes.' },
        { title: 'The smallest exact ask', why: 'A small, exact ask gets a yes; "help with the integration" gets a meeting.' },
        { title: 'Why it matters, and why it helps them', why: 'People make room for what they understand. Link your ask to their own goals.' },
        { title: 'A date to confirm by', why: 'It turns a request into an agreement with a date, and shows early whether you will need to escalate.' },
        { title: 'Written down', why: 'A "yes" in a corridor is easy to forget. A written one is a plan.' }
      ],
      related: ['tool:dependencies', 'scenario:team-never-replies', 'lesson:managing-dependencies', 'phrase:dep-written-ask']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'weekly-status',
      title: 'Weekly status to stakeholders',
      summary: 'The Friday email: the colour and the bottom line first, what was done, risks with owners, numbers, decisions needed, and next week with dates.',
      when: 'Every week, on the same day, to the people who need to know but are not in your stand-ups. For one detailed project update, the [[tool:status]] checks every line.',
      keywords: ['weekly status', 'weekly report', 'weekly update', 'status email', 'stakeholder update', 'friday update'],
      fields: [
        { key: 'project', label: 'Project', ph: 'Customer refunds', req: true },
        { key: 'week', label: 'Week ending', ph: 'Fri 13 Nov', req: true, date: true },
        { key: 'rag', label: 'Status', req: true,
          options: [['', '-'], ['GREEN', 'Green: the date holds without help'], ['AMBER', 'Amber: holds only if something specific happens'], ['RED', 'Red: will be missed unless someone decides or helps']] },
        { key: 'headline', label: 'The bottom line, in one sentence', ph: 'Live on Mon 14 Dec if Platform delivers by Fri 4 Dec.', req: true },
        { key: 'highlights', label: 'Done this week', ph: 'Facts someone could check, one per line', req: true, lines: 3 },
        { key: 'risks', label: 'Risks and issues, each with an owner and a date', ph: 'One per line (optional)', lines: 2 },
        { key: 'metrics', label: 'Numbers', ph: 'Points done, open bugs, usage (optional)', lines: 2 },
        { key: 'decisions', label: 'Decisions needed, with who and by when', ph: 'One per line (optional)', lines: 2 },
        { key: 'next', label: 'Next week, each with a date', ph: 'Refund screen ready for review: Wed 18 Nov', req: true, date: true, lines: 3 }
      ],
      body: `Subject: {{project}}: weekly status for the week ending {{week}}: {{rag}}

Hi all,

{{rag}}: {{headline}}

Done this week
- {{highlights}}

Risks and issues
- {{risks}}

Numbers
- {{metrics}}

Decisions needed
- {{decisions}}

Next week
- {{next}}

Corrections or questions: reply to this email.`,
      sample: {
        project: 'Customer refunds',
        week: 'Fri 13 Nov',
        rag: 'AMBER',
        headline: 'Live for everyone on Mon 14 Dec if Platform delivers the refund endpoint by Fri 4 Dec; Kiran confirms that by Wed 18 Nov.',
        highlights: 'Refund rules signed off by Finance (Mon 9 Nov)\nRefund API merged and running on staging (PR #412)\nRefund screen designs agreed with support',
        risks: 'Refund endpoint not started on the Platform side: owner Kiran, decision by Wed 18 Nov\nStaging down about 2 hours a day: owner Arjun, our own test database by Fri 20 Nov',
        metrics: 'Sprint 14: 34 of 36 points done\nOpen bugs: 3, none blocking',
        decisions: 'Neha: partial refunds in the first release or the second? Needed by Tue 17 Nov',
        next: 'Refund screen ready for review: Wed 18 Nov\nEnd-to-end tests against the stub: Fri 20 Nov'
      },
      parts: [
        { title: 'The colour and the bottom line first', why: 'Most readers stop after the first line. It should say whether to worry, and why.' },
        { title: 'Done, as facts', why: '"Merged", "signed off", "running on staging": things a reader could check.' },
        { title: 'Risks with owners and dates', why: 'A risk with an owner and a date is being managed; without them it is a worry.' },
        { title: 'Decisions needed', why: 'The part your manager can act on. Name who decides and by when.' },
        { title: 'Next week, with dates', why: 'Next week\'s email can then say what happened against what you said.' }
      ],
      related: ['tool:status', 'lesson:rag-and-bad-news', 'lesson:bluf-writing', 'phrase:status-bluf']
    }
  ];
})(window.LELT);
