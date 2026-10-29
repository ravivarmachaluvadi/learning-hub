/*
 * quizzes-arch.js - the questions at the end of each Software architecture lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'rfcs-and-adrs': [
      { q: 'What is the main difference between a design doc and a decision record?',
        choices: ['A design doc is written before building to get review; a decision record records a decision when it is made', 'They are the same document', 'A decision record is longer', 'A design doc is only for managers'], answer: 0,
        why: 'The design doc finds problems while they are cheap; the decision record tells the next person why, a year later.' },
      { q: 'An accepted decision record turns out to be wrong. What do you do?',
        choices: ['Write a new record that supersedes it, and link the two', 'Edit the old record to say something else', 'Delete the old record', 'Leave both and say nothing'], answer: 0,
        why: 'Accepted records are history. A new record keeps the reasoning of both decisions visible.' },
      { q: 'Which part of a decision record is most often missing, and most useful later?',
        choices: ['The bad consequences you accepted', 'The date', 'The title', 'The list of attendees'], answer: 0,
        why: 'Every decision has a cost. Writing it down tells the next person what was accepted on purpose and what to watch.' },
      { q: 'When is a design doc worth writing?',
        choices: ['When the change is expensive to reverse, crosses teams, or has real alternatives', 'For every bug fix', 'Only after the code is written', 'Only when a manager asks'], answer: 0,
        why: 'The value is in thinking and discussing before the expensive part. Small, reversible changes do not need one.' }
    ],

    'design-reviews': [
      { q: 'What is a premortem?',
        choices: ['Imagining the design has failed in six months and asking what went wrong', 'A review after an incident', 'A meeting to approve a budget', 'Testing in production'], answer: 0,
        why: 'Gary Klein\'s technique makes it safe to name risks, even in a senior person\'s design.' },
      { q: 'A design review ends with "let\'s discuss more". What was most likely missing?',
        choices: ['A named decider and a date', 'More slides', 'More reviewers', 'A longer meeting'], answer: 0,
        why: 'Reviewers advise; one person decides. Without a decider, discussion has no end.' },
      { q: 'Reviewing someone else\'s design, what is most useful?',
        choices: ['Questions that expose risks, with blocking concerns separated from preferences', 'Proposing your own design instead', 'Approving it to be polite', 'Commenting on their writing style'], answer: 0,
        why: 'Find the failure modes and say which concerns must be fixed. A redesign to your taste helps nobody.' }
    ],

    'nfrs-tradeoffs': [
      { q: 'Why give speed as a percentile ("95% under 800 ms") rather than an average?',
        choices: ['Averages hide the slow requests users remember', 'Percentiles are easier to compute', 'Averages are always higher', 'Percentiles never change'], answer: 0,
        why: 'A good average can hide a slow tail. Users remember the slow page, not the average.' },
      { q: 'The PRD says "it must be scalable". What do you do?',
        choices: ['Ask for numbers: load at the peak, and growth over the next year', 'Design for millions of users to be safe', 'Ignore it until later', 'Choose microservices'], answer: 0,
        why: 'Scalable to 100 users and to 10 million are different designs. Numbers first, then the design.' },
      { q: 'What does "everything in software architecture is a trade-off" mean for a design proposal?',
        choices: ['Say what each option gives up, not only what it gains', 'There is never a right answer, so pick at random', 'Avoid making decisions', 'Choose the option with the most features'], answer: 0,
        why: 'Naming the costs makes the choice honest, and tells people what would make you change it.' }
    ],

    'c4-model': [
      { q: 'In the C4 model, what is a "container"?',
        choices: ['A separately running thing, such as a service, an app or a database', 'Only a Docker container', 'A class in the code', 'A team'], answer: 0,
        why: 'A container is any runnable or data-storing unit. The word predates its Docker meaning in this model.' },
      { q: 'Which two C4 diagrams give most teams most of the value?',
        choices: ['System context and containers', 'Components and code', 'Code and deployment', 'Context and code'], answer: 0,
        why: 'Simon Brown\'s advice: the context and container diagrams explain the system to most readers.' },
      { q: 'What makes an arrow on an architecture diagram useful?',
        choices: ['A label saying what flows and how, such as "refund requests (HTTPS, JSON)"', 'A bright colour', 'Being as short as possible', 'Pointing both ways'], answer: 0,
        why: 'Unlabelled arrows let each reader imagine something different. Label every box and every line, and add a key.' }
    ],

    'monolith-microservices': [
      { q: 'What is the main thing microservices buy?',
        choices: ['Teams can change and release their part independently', 'Faster code by default', 'Lower cost for small teams', 'No need for testing'], answer: 0,
        why: 'Independence for teams is the prize. It comes with the cost of running a distributed system.' },
      { q: 'A team of six proposes twelve microservices for a new product. What is the best response?',
        choices: ['Start with a modular monolith and split where a clear boundary and a real need appear', 'Agree: microservices are the modern way', 'Make it twenty services to be safe', 'Ban services forever'], answer: 0,
        why: 'Fowler\'s "monolith first": twelve services for six people means everyone operates two, before the boundaries are known.' },
      { q: 'Which is a good signal that splitting out a service will pay?',
        choices: ['Two teams block each other\'s releases on one clear part with its own data', 'The code is old', 'A conference talk recommended it', 'The monolith uses Java'], answer: 0,
        why: 'Splits pay when they remove real waiting, or meet very different load or reliability needs, on a stable boundary.' }
    ],

    'migrations': [
      { q: 'What is the strangler fig approach?',
        choices: ['Moving one piece at a time to the new system, behind a routing layer, until the old one can be switched off', 'Rewriting everything, then switching over a weekend', 'Running the old system forever', 'Deleting the old system first'], answer: 0,
        why: 'Small, live, reversible steps. The old system shrinks until nothing uses it.' },
      { q: 'You need to rename a database column during a rolling deployment. What is safe?',
        choices: ['Add the new column, move reads and writes, and remove the old one in a later release', 'Rename it in one migration', 'Rename it at night', 'Ask users to log out first'], answer: 0,
        why: 'Expand and contract: the old version of the code may still be running and reading the old name.' },
      { q: 'What is a parallel run?',
        choices: ['Both systems process real traffic and the results are compared, while only the old one is used', 'Two teams building the same feature', 'Running tests in parallel', 'Releasing two versions to different countries'], answer: 0,
        why: 'Comparing results on real traffic finds the old system\'s unwritten rules before customers do.' }
    ],

    'api-versioning': [
      { q: 'What does Hyrum\'s law say?',
        choices: ['With enough users, every observable behaviour of an API will be depended on by somebody', 'APIs should never change', 'Every API needs a version number', 'Documentation is always out of date'], answer: 0,
        why: 'Even behaviour you never promised becomes a dependency. Check who relies on it before changing it.' },
      { q: 'Which change is usually backward compatible?',
        choices: ['Adding an optional field to a response', 'Renaming a field', 'Making an optional field required', 'Changing an error code'], answer: 0,
        why: 'Additions are usually safe; removing, renaming, tightening or changing meaning breaks consumers.' },
      { q: 'What makes a deprecation work?',
        choices: ['A written plan with a sunset date far enough out, a migration guide and help for each consumer', 'An announcement with no date', 'Switching the old version off next week', 'Leaving the old version forever'], answer: 0,
        why: 'A deprecation without a date is a wish; one with a week\'s notice is an outage. Give time and help.' },
      { q: 'What do consumer-driven contract tests do?',
        choices: ['Run what each consumer relies on in your pipeline, so a break fails your build first', 'Replace all unit tests', 'Test only the consumer\'s user interface', 'Sign a legal contract'], answer: 0,
        why: 'Each consumer publishes its expectations; your build checks them before you ship a break.' }
    ],

    'slos': [
      { q: 'How much failure does 99.9% allow over a 30-day month?',
        choices: ['About 43 minutes', 'About 4 minutes', 'About 7 hours', 'None'], answer: 0,
        why: '0.1% of 43,200 minutes is 43.2 minutes. 99.99% allows about 4 minutes; 99% about 7 hours.' },
      { q: 'What is the difference between an SLO and an SLA?',
        choices: ['An SLO is an internal target; an SLA is a contract with penalties, set looser than the SLO', 'They are the same', 'An SLA is internal; an SLO is a contract', 'An SLO is only for databases'], answer: 0,
        why: 'Keep the SLO tighter, so you see trouble before it costs money under the SLA.' },
      { q: 'The team has spent this month\'s error budget. Under a typical policy, what happens?',
        choices: ['Releases slow or stop, and the team works on reliability until it is back within the SLO', 'Nothing changes', 'The SLO is raised to hide it', 'The on-call engineer is blamed'], answer: 0,
        why: 'The policy, agreed in advance, settles speed against stability without an argument each time.' },
      { q: 'Where should an availability SLI be measured?',
        choices: ['Close to the user, such as the share of requests that succeed at the load balancer', 'On each server\'s CPU', 'By asking support', 'In the monthly report'], answer: 0,
        why: 'An SLI should reflect what users feel. A healthy CPU says nothing about failing payments.' }
    ],

    'conways-law': [
      { q: 'What does Conway\'s law say?',
        choices: ['Systems end up mirroring the communication structure of the organisation that builds them', 'Teams should never talk to each other', 'Every team needs its own database', 'Bigger teams build better systems'], answer: 0,
        why: 'Teams build what they can easily talk about; where they rarely talk, the system grows a boundary.' },
      { q: 'What is the inverse Conway manoeuvre?',
        choices: ['Designing the teams for the architecture you want, so the system follows', 'Ignoring team structure in architecture', 'Merging all teams into one', 'Changing the architecture and leaving the teams alone'], answer: 0,
        why: 'Change who owns what first; services that no single team can own rarely stay healthy.' },
      { q: 'In Team Topologies, which kind of team should most teams be?',
        choices: ['Stream-aligned: owning a flow of work end to end', 'Platform', 'Enabling', 'Complicated subsystem'], answer: 0,
        why: 'Most teams should deliver a flow of value end to end; the other kinds exist to support them.' }
    ]
  });
})(window.LELT);
