/*
 * quizzes-pm.js - the questions at the end of each Project management lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'estimate-target-commitment': [
      { q: 'Your manager says: "Leadership wants this live by 1 December." What is that?',
        choices: ['A target', 'An estimate', 'A commitment', 'A forecast'], answer: 0,
        why: 'It is what the business wants, for its own reasons. Whether it is realistic is what your estimate is for; what you promise after comparing the two is the commitment.' },
      { q: 'Your estimate is 8 to 11 weeks; the target is 6. What should change?',
        choices: ['The inputs: less scope, more time, or other work paused', 'The estimate, to 6 weeks', 'Nothing: commit to 6 and work harder', 'The estimate, to 11 weeks, to be safe'], answer: 0,
        why: 'An estimate is a prediction; lowering it doesn\'t make the work smaller. Change what goes into it, then commit to what you can stand behind.' },
      { q: 'Which number should a commitment usually be closest to?',
        choices: ['The cautious end of the range (around P85)', 'The most likely value (P50)', 'The best case', 'Whatever the target is'], answer: 0,
        why: 'Committing to P50 means half of all projects finish late by definition. A commitment has room for the things that go wrong.' },
      { q: 'What is the "outside view" in estimation?',
        choices: ['Checking how long similar work actually took before', 'Asking another team to estimate your work', 'Estimating from the customer\'s point of view', 'Adding 50% to every estimate'], answer: 0,
        why: 'Kahneman\'s cure for the planning fallacy: before trusting your own breakdown, look at what happened on comparable work.' }
    ],

    'why-estimate': [
      { q: 'What is the first question to ask before estimating something?',
        choices: ['What will this number help someone decide?', 'How many story points is it?', 'Who will do the work?', 'What is the deadline?'], answer: 0,
        why: 'Estimates exist to support decisions. The decision tells you how precise the estimate needs to be, or whether it is needed at all.' },
      { q: 'Your team finishes 6 to 9 small items a week, and 40 similar items are left. A reasonable forecast?',
        choices: ['About 5 to 7 weeks', 'Exactly 5 weeks', 'Impossible to say without estimating each item', '40 days'], answer: 0,
        why: '40 / 9 is about 4.5 and 40 / 6 is about 6.7: roughly 5 to 7 weeks. Forecasting from throughput uses what actually happened, meetings and support included.' },
      { q: 'When does forecasting from throughput work poorly?',
        choices: ['When the items vary wildly in size', 'When the team is small', 'When you use Scrum', 'When the backlog is ordered'], answer: 0,
        why: 'Counting items assumes they are roughly similar. If one item is a button and the next is a payment integration, the count tells you little.' },
      { q: 'You can\'t size a piece of work honestly because nobody has used the technology. What helps most?',
        choices: ['A short, timeboxed spike to learn enough', 'A larger buffer', 'Asking for a T-shirt size', 'Refusing to estimate'], answer: 0,
        why: 'A spike buys information. After it, you can give a range people can plan on.' }
    ],

    'estimating-with-ai': [
      { q: 'In METR\'s 2025 trial, what happened when experienced developers could use AI tools on familiar projects?',
        choices: ['Tasks took about 19% longer, though they felt faster', 'Tasks took half the time', 'Tasks took about 24% less time', 'There was no measurable difference in time or perception'], answer: 0,
        why: 'They expected a 24% speed-up and believed afterwards they had been about 20% faster, but measured slower. One study, early-2025 tools, experts in familiar code; the lesson is to measure, not to trust the feeling.' },
      { q: 'Coding is about 30% of the time a feature takes. AI tools double coding speed. Roughly how much sooner is the feature done?',
        choices: ['About 15%', 'About 50%', 'About 30%', 'About 60%'], answer: 0,
        why: 'Amdahl\'s law: 30% becomes 15%, so the total goes from 100% to 85%. The parts the tools don\'t touch (reviews, testing, waiting) set most of the date.' },
      { q: 'A manager says: "With AI it should take half the time." Best response?',
        choices: ['Explain which part AI speeds up, give an adjusted range, and offer to measure it for two sprints',
          'Agree and halve the estimate', 'Say AI tools don\'t help at all', 'Ask the manager to estimate it'], answer: 0,
        why: 'Neither a blind discount nor a flat no. Separate the coding share from the rest, and replace opinions with a measurement.' }
    ],

    'rag-and-bad-news': [
      { q: 'What does Amber mean in a useful status report?',
        choices: ['The date holds only if something specific happens', 'The team is working hard', 'We are a little behind but will catch up', 'The project has failed'], answer: 0,
        why: 'Amber names a condition and comes with an ask: the help or decision that would turn it Green.' },
      { q: 'What is a "watermelon" project?',
        choices: ['Green on every report, red inside', 'A project with too many stakeholders', 'A project split into many small parts', 'A project that is Red for a long time'], answer: 0,
        why: 'Reports stay Green until it is suddenly Red, and by then the people who could have helped have no options left.' },
      { q: 'You learn on Tuesday that the release will slip a week. When do you tell your manager?',
        choices: ['Tuesday, with the cause, the impact, options and your recommendation', 'At Friday\'s status meeting', 'After you have tried to catch up for a few days', 'When you are completely sure'], answer: 0,
        why: 'The day you know is the day you tell. Each day you wait removes options from the people who could help.' },
      { q: 'In a bad-news message, what comes first?',
        choices: ['The bottom line: what moves, to when', 'An apology', 'The full history of what happened', 'Who caused the problem'], answer: 0,
        why: 'Bottom line first, then the cause in one sentence, the impact, the options and the ask.' }
    ],

    'managing-dependencies': [
      { q: 'Which dependency deserves your attention first?',
        choices: ['One on the critical path', 'The one with the biggest team', 'The oldest one', 'The one with the friendliest contact'], answer: 0,
        why: 'A delay on the critical path moves your date day for day; one off it has slack.' },
      { q: 'Which request is easiest for another team to say yes to?',
        choices: ['The smallest thing that unblocks you, with a date and why it matters to them', 'Everything you will need this quarter, in one list', 'A ticket in their backlog with no date', 'A request through your manager to theirs'], answer: 0,
        why: 'Small, specific, dated, and connected to their own goals. And offer help.' },
      { q: 'How can you keep working while the other team\'s API isn\'t ready?',
        choices: ['Agree the contract, build against a stub, and add contract tests', 'Wait, and start when it is ready', 'Build your own version of their API', 'Skip the integration tests'], answer: 0,
        why: 'An agreed contract plus a stub decouples your work from their date; contract tests catch it early if the two sides drift apart.' },
      { q: 'Talking hasn\'t solved it and the date is at risk. How do you escalate?',
        choices: ['Together with the other team\'s lead, to both managers, with options and the decision needed', 'Alone, to your manager, explaining that they let you down', 'To their manager directly, without telling them', 'In the public project channel'], answer: 0,
        why: 'A joint escalation asks for a choice between priorities. A solo one reads as a complaint and costs you the relationship.' }
    ],

    'stakeholders': [
      { q: 'Someone with high power over your project but little interest in it. How do you keep them involved?',
        choices: ['Keep them satisfied: a short summary now and then, and ask before big changes', 'Manage them closely with weekly meetings', 'Send them every status update', 'Nothing; they are not interested'], answer: 0,
        why: 'They can change your plan, so don\'t surprise them, but don\'t flood them either.' },
      { q: 'What is wrong with a RACI that has two people marked Accountable?',
        choices: ['Two owners means no clear owner of the decision', 'Nothing, if both are senior', 'There must also be two Responsible people', 'Accountable people should be Informed instead'], answer: 0,
        why: 'Exactly one person is accountable for each decision. Others can be consulted.' },
      { q: 'What question helps find the stakeholders you forgot?',
        choices: ['Who would be upset to hear about this on launch day?', 'Who attends our stand-up?', 'Who is the most senior person in the company?', 'Who approved the budget?'], answer: 0,
        why: 'Compliance, support, finance and security are often missed until they block a release.' }
    ],

    'risks-raid': [
      { q: 'The bank\'s sandbox is late, and your testing was due to start today. Is that a risk or an issue?',
        choices: ['An issue: it is happening now', 'A risk: it might affect the date', 'An assumption', 'A dependency, so neither'], answer: 0,
        why: 'A risk might happen; an issue is happening. When a risk happens, move it to Issue and act on it.' },
      { q: 'Likelihood 3, impact 5. What is the score, and roughly how serious?',
        choices: ['15: high', '8: medium', '15: medium', '35: very high'], answer: 0,
        why: 'Likelihood times impact: 3 x 5 = 15. In this tool, 15 or more is high.' },
      { q: 'Which of these is a real risk response?',
        choices: ['Pair a second person on the settlement job this sprint', 'Monitor the situation closely', 'Escalate if needed', 'Hope the key person stays'], answer: 0,
        why: 'A response changes something: it avoids, reduces, transfers or consciously accepts the risk. Watching changes nothing.' },
      { q: 'Why do assumptions belong in the same log as risks?',
        choices: ['Every assumption is a risk that it turns out false, so it needs a check', 'They don\'t; assumptions are facts', 'So the log looks complete', 'Because the PMBOK requires it'], answer: 0,
        why: 'An unchecked assumption is a risk nobody is managing. Write down how and when you will check it.' }
    ],

    'release-planning': [
      { q: '120 points left; your last sprints did 20, 24 and 30 points. A fair forecast?',
        choices: ['About 4 to 6 sprints', 'Exactly 4 sprints', 'Exactly 5 sprints', '6 sprints at most'], answer: 0,
        why: '120 / 30 = 4 and 120 / 20 = 6. Give the range, not the best case.' },
      { q: 'The date is fixed by a regulation. What is the useful planning question?',
        choices: ['What will we have by then, at our slow and fast pace?', 'How many people do we need to do everything?', 'Can we work weekends?', 'When will everything be done?'], answer: 0,
        why: 'With a fixed date, scope is the variable. Split the ordered backlog into will have, might have and won\'t have, and check the must-haves are in the first group.' },
      { q: 'Where should the safety margin in a plan go?',
        choices: ['At the end of the plan, visible, as one shared buffer', 'Hidden inside every task estimate', 'Nowhere: buffers are padding', 'Into the first sprint'], answer: 0,
        why: 'Hidden padding gets used up (work expands to fill the time); one visible buffer at the end protects the date, and you can watch it being used.' }
    ],

    'interruptions': [
      { q: 'Sprints keep missing and the team says "support work". What do you do first?',
        choices: ['Label and measure unplanned work for two sprints', 'Ask the team to work longer hours', 'Stop doing support work', 'Reduce the sprint length'], answer: 0,
        why: 'You can\'t plan for what you haven\'t measured. The number usually surprises people.' },
      { q: 'What is an interrupt rotation?',
        choices: ['One person per sprint handles all interrupts, so the others can focus', 'Everyone takes interrupts in turn every hour', 'Interrupts are only handled on Fridays', 'The lead handles every interrupt'], answer: 0,
        why: 'One "goalie" absorbs the interrupts; the rest of the team keeps its context. Rotate it so nobody burns out.' },
      { q: 'You measured that 25% of the team\'s time goes to unplanned work. How do you plan the next sprint?',
        choices: ['At about 75% of capacity, and say why', 'At full capacity, to push the team', 'At 50%, to be safe', 'At full capacity, but stop all support'], answer: 0,
        why: 'Planning at the honest number isn\'t padding. Then work on reducing the sources.' }
    ]
  });
})(window.LELT);
