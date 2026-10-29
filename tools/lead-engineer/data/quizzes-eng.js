/*
 * quizzes-eng.js - the questions at the end of each Engineering leadership lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'code-review-culture': [
      { q: 'Microsoft\'s study of code review found its biggest benefit was…',
        choices: ['Sharing knowledge and awareness of the code', 'Finding most of the bugs', 'Enforcing a code style', 'Checking who wrote the code'], answer: 0,
        why: 'Bacchelli and Bird found reviews catch fewer defects than expected and do more for knowledge transfer, which is why a slow review hurts so much.' },
      { q: 'Google\'s guideline for when to approve a change is…',
        choices: ['When it clearly improves the overall health of the code, even if not perfect', 'When it is exactly how the reviewer would write it', 'When it has no comments left at all', 'When two seniors have approved it'], answer: 0,
        why: 'Better, not perfect. Perfectionism in review is a tax on everyone\'s speed.' },
      { q: 'A 2,000-line pull request has been waiting three days. What helps most for the future?',
        choices: ['Smaller pull requests and a team rule for how fast reviews start', 'Assigning it to the most senior reviewer', 'Approving big pull requests without review', 'Reviewing only on Fridays'], answer: 0,
        why: 'Review quality drops sharply with size, and waiting breeds bigger pull requests. Small and fast go together.' },
      { q: 'Why label a review comment as "nit" or "blocking"?',
        choices: ['So the author can tell what must change from what is taste', 'To show the reviewer is senior', 'Because tools require it', 'To make the review longer'], answer: 0,
        why: 'Conventional Comments labels separate risk from preference, so authors act on the right things and do not feel every comment is a demand.' }
    ],

    'tech-debt': [
      { q: 'In Ward Cunningham\'s metaphor, what is the "interest" on technical debt?',
        choices: ['The extra effort on every later change in that area', 'The cost of the cloud servers', 'The time spent in meetings about it', 'The ugliness of the code'], answer: 0,
        why: 'Debt costs you through interest: each change in that area takes longer until you repay it. Ugly code nobody changes costs little.' },
      { q: 'Which ask is most likely to get time for tech debt from a Product Owner?',
        choices: ['"Three days on flaky tests saves 12 hours a sprint; it pays back in two sprints."', '"We need a sprint to refactor."', '"The code is a mess."', '"Best practice says we should modernise."'], answer: 0,
        why: 'Time, money and risk are what a Product Owner weighs. Engineering words name the work, not the gain.' },
      { q: '"We ship now and clean up after the sale" is which kind of debt in Fowler\'s quadrant?',
        choices: ['Prudent and deliberate', 'Reckless and deliberate', 'Prudent and accidental', 'Reckless and accidental'], answer: 0,
        why: 'A conscious trade-off with a plan to repay is prudent and deliberate, as long as the repayment really happens.' },
      { q: 'Which item should usually wait?',
        choices: ['One that takes a year to pay back and is low risk', 'One that pays back in two sprints', 'One only a single person can change, at high risk', 'One that causes an incident a month'], answer: 0,
        why: 'Fix fast paybacks and high risks first; a slow, low-risk item delays the ones that pay back quickly.' }
    ],

    'quality-testing': [
      { q: 'In the test pyramid, which kind of test should you have most of?',
        choices: ['Fast unit tests', 'End-to-end tests through the whole system', 'Manual tests before each release', 'Load tests'], answer: 0,
        why: 'Many cheap unit tests, fewer integration tests, and a few end-to-end tests for the journeys that matter most.' },
      { q: 'Why is a coverage target a poor goal?',
        choices: ['People can raise it with tests that check nothing', 'Coverage cannot be measured', 'High coverage always slows the build', 'Testers dislike it'], answer: 0,
        why: 'Goodhart\'s law. Coverage shows what is untested; as a target it gets gamed. Ask "if this broke, would a test tell us?"' },
      { q: 'A test fails at random on the same code. What should happen first?',
        choices: ['Quarantine it with an owner and a date to fix it', 'Re-run the build until it passes', 'Delete all the integration tests', 'Ignore it until the release'], answer: 0,
        why: 'Flaky tests teach people to ignore red builds. Move it out of the blocking run and fix it, fast.' }
    ],

    'incidents': [
      { q: 'During an incident, what is the lead\'s usual role?',
        choices: ['Incident commander: decide and coordinate, not type the fix', 'The person typing the fix, because they are senior', 'An observer who waits for the postmortem', 'The person who finds out who caused it'], answer: 0,
        why: 'Separate the roles. When the commander is typing, nobody is watching the whole picture.' },
      { q: 'Payments started failing right after a release. What comes first?',
        choices: ['Roll back the release to stop the impact', 'Find the root cause before changing anything', 'Write the postmortem', 'Wait for the next release'], answer: 0,
        why: 'Mitigate first, diagnose later. Customers need it to stop; the cause can be found afterwards.' },
      { q: 'You know little 15 minutes in. Should you send an update?',
        choices: ['Yes: what is affected, what you are doing, and when the next update comes', 'No: wait until you know the cause', 'Only if a manager asks', 'Only after it is fixed'], answer: 0,
        why: 'Silence brings everyone into the channel to ask. A short update on a fixed rhythm keeps them out.' },
      { q: 'Why are postmortems blameless?',
        choices: ['People share what really happened only when they will not be punished for it', 'Because nobody is ever at fault', 'To protect senior engineers', 'Because blame is against company policy'], answer: 0,
        why: 'Blame makes people hide facts, and the next incident takes longer to understand. "Human error" is where the investigation starts.' }
    ],

    'on-call': [
      { q: 'What should page a person at night?',
        choices: ['Something urgent, real and needing a human to act, such as payments failing', 'CPU above 80% on one server', 'Every warning in the logs', 'A nightly job that took a minute longer'], answer: 0,
        why: 'Page on symptoms users feel, and make every page actionable. Alerts nobody acts on train people to ignore pages.' },
      { q: 'One senior takes almost every page because they know the system best. What fixes it?',
        choices: ['A rotation with runbooks and shadowing, so everyone can handle pages', 'Paying the senior more', 'Turning off the alerts', 'Letting the senior decide when they are on call'], answer: 0,
        why: 'Spread the knowledge and the load. A hero on-call is a bus factor of one and a burnout waiting to happen.' },
      { q: 'What is "toil"?',
        choices: ['Manual, repetitive work a machine could do', 'Any work done at night', 'Work on new features', 'Time spent in meetings'], answer: 0,
        why: 'Google\'s SRE book defines toil as manual, repetitive, automatable work that grows with the system. Automate the worst of it.' }
    ],

    'ci-cd': [
      { q: 'What does continuous integration ask of a team?',
        choices: ['Merging small changes into the main branch at least daily, with automated checks', 'Owning a CI server', 'A release every evening', 'Long feature branches merged before each release'], answer: 0,
        why: 'CI is a habit, not a tool. Long-lived branches merged in a painful week are its opposite.' },
      { q: 'The Accelerate research found that teams that deploy more often…',
        choices: ['Also have fewer failures and recover faster', 'Have more failures', 'Have the same stability as others', 'Need more testers'], answer: 0,
        why: 'Speed and stability go together: small, frequent changes are easier to test, diagnose and roll back.' },
      { q: 'What is the difference between deploying and releasing?',
        choices: ['Deploying puts code on the servers; releasing lets users see the feature', 'There is none', 'Releasing happens before deploying', 'Deploying is only for databases'], answer: 0,
        why: 'Feature flags separate the two, so you can deploy switched off and release to users step by step.' }
    ],

    'dora-metrics': [
      { q: 'Which are the four DORA measures?',
        choices: ['Deployment frequency, lead time for changes, change failure rate, time to restore', 'Velocity, story points, burn-down, capacity', 'Lines of code, commits, pull requests, bugs', 'Uptime, CPU, memory, latency'], answer: 0,
        why: 'Two measure speed and two measure stability. The research found the best teams are good at both.' },
      { q: 'Your manager wants to rank developers by deployments. What do you say?',
        choices: ['DORA measures the team\'s delivery system; ranking people by it makes the numbers go up and the software worse', 'Good idea, as long as it is monthly', 'Rank them by commits instead', 'Only rank the juniors'], answer: 0,
        why: 'Deployments are team outcomes through pipelines. As individual targets they get gamed and stop people helping each other.' },
      { q: 'What should you compare a team\'s DORA numbers with?',
        choices: ['The same team\'s numbers last quarter', 'The best team in the company', 'An industry league table', 'The numbers the manager would like'], answer: 0,
        why: 'Teams face different risks and work. The metrics are a mirror for a team\'s own improvement.' }
    ],

    'documentation': [
      { q: 'In Diátaxis, a page of configuration settings to look up is…',
        choices: ['Reference', 'A tutorial', 'A how-to guide', 'Explanation'], answer: 0,
        why: 'Reference is facts to look up. Mixing it with history or step-by-step teaching makes it harder to use.' },
      { q: 'What does "docs as code" mean?',
        choices: ['Docs live in the repository and change in the same pull request as the code', 'Docs are written in a programming language', 'Code comments replace all documentation', 'Docs are generated by AI'], answer: 0,
        why: 'Reviewed with the change, the doc stays true. A separate wiki nobody updates is worse than none.' },
      { q: 'Who is best placed to fix the onboarding page?',
        choices: ['The newest joiner', 'The longest-serving engineer', 'HR', 'Nobody: it never changes'], answer: 0,
        why: 'Newcomers are the only ones who still see the gaps. Ask them to fix it while it is fresh.' }
    ],

    'ai-in-the-team': [
      { q: 'A developer opens a pull request mostly written by an AI assistant. Who is responsible for it?',
        choices: ['The author, for every line', 'The AI tool\'s vendor', 'The reviewer only', 'Nobody, since a tool wrote it'], answer: 0,
        why: 'The author owns every line, however it was written. If they cannot explain it, it is not ready to merge.' },
      { q: 'What must not be pasted into an unapproved AI tool?',
        choices: ['Client code, customer data, credentials or anything under an NDA', 'Public documentation', 'Your own test names', 'An open-source library\'s README'], answer: 0,
        why: 'Many client contracts forbid it, and data leaks are hard to undo. Name the approved tools explicitly.' },
      { q: 'What do the studies of AI coding tools suggest so far?',
        choices: ['The effect depends on the task and the context, so measure on your own work', 'Every team is twice as fast', 'They always slow people down', 'They have no effect at all'], answer: 0,
        why: 'One study found a well-defined task 56% faster; another found experts in large familiar codebases 19% slower. Measure, do not assume.' }
    ],

    'flow-wip': [
      { q: 'A team finishes 5 items a week and has 20 in progress. By Little\'s law, how long does each item take on average?',
        choices: ['About 4 weeks', 'About 1 week', 'About 20 weeks', 'It cannot be known'], answer: 0,
        why: 'Cycle time = work in progress ÷ throughput = 20 ÷ 5 = 4 weeks.' },
      { q: 'With the same throughput, what is the quickest way to make items finish sooner?',
        choices: ['Have fewer items in progress at once', 'Start more items in parallel', 'Ask people to work longer hours', 'Estimate more carefully'], answer: 0,
        why: 'Halve the work in progress and, at the same throughput, cycle time halves. Less switching often raises throughput too.' },
      { q: 'The "In progress" column is at its WIP limit. What should someone with nothing to do pick up?',
        choices: ['Help finish, review or unblock an item already in progress', 'A new item from the backlog', 'Nothing until the limit is raised', 'Their own side project'], answer: 0,
        why: '"Stop starting, start finishing." The limit turns idle time into finishing work.' },
      { q: 'Why can forecasting from throughput beat adding up estimates?',
        choices: ['Throughput already includes the reviews, meetings and interruptions that estimates forget', 'Estimates are always wrong by half', 'Throughput never changes', 'It needs no data'], answer: 0,
        why: 'Past throughput measures what the team really finished, with everything else included.' }
    ]
  });
})(window.LELT);
