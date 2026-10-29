/*
 * docs.js - the sections of the documents the builders write: the design doc (js/views/tools/rfc.js),
 * the decision record (adr.js) and the postmortem (postmortem.js).
 *
 *   U.data.docSections[toolId] = [{key, title: the heading in the document, req: true when the
 *                                  document always has it, ph: what to write (the placeholder while
 *                                  it is empty), why: why the section is there}]
 *
 * The document always shows every required section under its heading, with "[ph]" while it is
 * empty, so a reader can see what is missing; an optional section appears once it has something in
 * it. The tests prove both, for an empty document and for each example.
 */
(function (U) {
  'use strict';
  U.data.docSections = {

    rfc: [
      { key: 'problem', title: 'Context and problem', req: true, ph: 'What is wrong today, for whom, and what it costs',
        why: 'Reviewers judge a design against the problem. A design doc that opens with the solution invites an argument about taste instead of a check against the need.' },
      { key: 'goals', title: 'Goals', req: true, ph: 'What will be true when this works, with a number where you can',
        why: 'Goals are the test every option is held to. Without them, the review compares designs by who argues best.' },
      { key: 'nonGoals', title: 'Non-goals', req: true, ph: 'What this design deliberately does not do',
        why: 'Saying what is out stops the review from growing the scope, and tells readers what not to worry about.' },
      { key: 'nfrs', title: 'Quality requirements', req: true, ph: 'Speed, load, availability, security and cost, each with a number',
        why: 'Speed, load, availability, security and cost decide the architecture more than the features do, and only a number can be designed and tested for.' },
      { key: 'proposal', title: 'Proposed design', req: true, ph: 'How it works: the main parts, the data and the flow',
        why: 'The design itself: the parts, the data, the flow and the interfaces, at the level a reviewer needs to find the problems.' },
      { key: 'alternatives', title: 'Alternatives considered', req: true, ph: 'At least two other options, one of them doing nothing, and why not',
        why: 'An option compared with nothing cannot be judged. "Do nothing" is always an option, and naming what you turned down saves the review re-inventing it.' },
      { key: 'risks', title: 'Risks and trade-offs', req: true, ph: 'What could go wrong, and what this design gives up',
        why: 'Every design gives something up. Writing it down first is cheaper than a reviewer finding it, and far cheaper than production finding it.' },
      { key: 'rollout', title: 'Rollout and rollback', req: true, ph: 'How it reaches users in steps, and how to undo it',
        why: 'Most outages start with a change. A plan that ships in steps and can be undone in minutes turns a bad surprise into a small one.' },
      { key: 'questions', title: 'Open questions', req: false, ph: 'What you still need answered, and by whom',
        why: 'Questions written down get answered in the review; questions kept in your head get answered in production.' }
    ],

    adr: [
      { key: 'context', title: 'Context', req: true, ph: 'The situation and the forces at play: why a decision is needed now',
        why: 'The reader in a year does not know what you knew. The context is what lets them judge whether the decision still holds.' },
      { key: 'drivers', title: 'Decision drivers', req: true, ph: 'The criteria the options were judged against',
        why: 'The criteria make the choice explainable: "we chose Kafka because replay mattered more than simplicity" can be checked; "Kafka is better" cannot.' },
      { key: 'options', title: 'Options considered', req: true, ph: 'Each option, with what is good and bad about it',
        why: 'The options you turned down are the first thing a newcomer suggests. Writing down why not saves the team from having the same debate again.' },
      { key: 'decision', title: 'Decision', req: true, ph: 'We will ...',
        why: 'One clear sentence in the active voice, "We will…", says what was decided and that the team owns it.' },
      { key: 'consequences', title: 'Consequences', req: true, ph: 'What becomes easier, and what becomes harder or costs more',
        why: 'Every decision has a cost. Writing down the bad consequences you accepted is what makes the record honest, and tells the next person what to watch.' },
      { key: 'revisit', title: 'When we would revisit this', req: false, ph: 'The change in facts that would reopen it',
        why: 'A decision is right for its facts. Naming the facts that would change it lets people reopen it for a reason, not a preference.' }
    ],

    postmortem: [
      { key: 'summary', title: 'Summary', req: true, ph: 'What happened, in two or three sentences',
        why: 'Most readers read only this. It says what broke, for how long, why, and that it is fixed.' },
      { key: 'impact', title: 'Impact', req: true, ph: 'Who was affected, how many, for how long, and what it cost',
        why: 'The size of the impact decides how much the actions deserve. "Many customers" cannot be weighed against a feature; "4,200 failed payments" can.' },
      { key: 'timeline', title: 'Timeline', req: true, ph: 'Each moment with its time: when it started, when we knew, what we did',
        why: 'Times show where the minutes went: finding out, deciding, or fixing. That is where the best actions come from.' },
      { key: 'causes', title: 'Root cause and contributing factors', req: true, ph: 'How the system and the process let this happen, not who',
        why: 'Incidents rarely have one cause. The factors that let a normal mistake reach customers are what the actions should change.' },
      { key: 'detection', title: 'How we found out', req: true, ph: 'Alert, dashboard, customer, support: how and when',
        why: 'If customers told you first, the most valuable action is the one that would have told you sooner.' },
      { key: 'wentWell', title: 'What went well', req: true, ph: 'What worked and should be kept',
        why: 'What worked under pressure is worth keeping on purpose, and saying it keeps the review from feeling like a trial.' },
      { key: 'wentWrong', title: 'What went wrong', req: true, ph: 'What made it worse or slower',
        why: 'The steps that slowed the response are as fixable as the bug, and often cheaper.' },
      { key: 'lucky', title: 'Where we got lucky', req: false, ph: 'What could have made it much worse',
        why: 'Luck is a risk you have not fixed yet. Naming it finds the next incident before it happens.' },
      { key: 'actions', title: 'Action items', req: true, ph: 'Each with what changes, an owner and a date',
        why: 'An action with no owner and no date is a wish. Actions that change the system, not people\'s carefulness, are what stop a repeat.' }
    ]
  };
})(window.LELT);
