/*
 * quizzes.js - the questions at the end of each lesson, keyed by lesson id.
 *
 *   U.data.quizzes[lessonId] = [{q, choices: [...], answer: index of the right choice, why}]
 *
 * The choices are shuffled on screen, so the right answer can sit anywhere in the list here.
 * A question you miss comes back in the review (js/views/quiz.js).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'scrum-in-one-page': [
      { q: 'According to the 2020 Scrum Guide, which of these is part of Scrum?',
        choices: ['The Sprint Goal', 'Story points', 'Velocity', 'The three stand-up questions'], answer: 0,
        why: 'The Sprint Goal is the commitment that goes with the Sprint Backlog. Story points, velocity and the three questions are practices teams add; the 2020 guide doesn\'t mention them.' },
      { q: 'What is the commitment that goes with the Increment?',
        choices: ['The Definition of Done', 'The Product Goal', 'The Sprint Goal', 'The release date'], answer: 0,
        why: 'Product Backlog → Product Goal; Sprint Backlog → Sprint Goal; Increment → Definition of Done.' },
      { q: 'Your team designs in Sprint 1, builds in Sprint 2 and tests in Sprint 3. What\'s wrong?',
        choices: ['It\'s a mini-waterfall: each Sprint should produce a usable, tested Increment', 'Nothing, as long as each Sprint is two weeks',
          'The Sprints are too short', 'Testing should be done by a separate team'], answer: 0,
        why: 'Scrum relies on a usable Increment every Sprint, so you can inspect real results and adapt. Splitting design, build and test across Sprints delays all feedback to the end.' },
      { q: 'What is the longest a Sprint can be?',
        choices: ['One month', 'Two weeks', 'Six weeks', 'As long as the work needs'], answer: 0,
        why: 'Sprints are fixed-length events of one month or less. Many teams use two weeks, but the guide only sets the upper limit.' }
    ],

    'scrum-accountabilities': [
      { q: 'Who decides how much work fits into a Sprint?',
        choices: ['The Developers', 'The Product Owner', 'The engineering manager', 'The lead engineer'], answer: 0,
        why: 'The Developers select the items and create the Sprint Backlog, because they know their capacity. The Product Owner decides the order, not how much fits.' },
      { q: 'Three managers each want their feature first. Who orders the Product Backlog?',
        choices: ['The Product Owner', 'The most senior manager', 'The managers vote', 'The Scrum Master'], answer: 0,
        why: 'The Product Owner is one person, accountable for ordering the backlog. Others influence it by convincing the Product Owner.' },
      { q: 'Who can cancel a Sprint?',
        choices: ['Only the Product Owner', 'The Scrum Master', 'The engineering manager', 'Any team member'], answer: 0,
        why: 'The 2020 Scrum Guide: "Only the Product Owner has the authority to cancel the Sprint." It happens only if the Sprint Goal becomes obsolete.' },
      { q: 'Where does a "lead engineer" fit in the Scrum Guide?',
        choices: ['It isn\'t a Scrum accountability; a lead is usually one of the Developers', 'It\'s another name for the Scrum Master',
          'It\'s the Product Owner\'s deputy', 'It replaces the Scrum Master in large teams'], answer: 0,
        why: 'The guide has three accountabilities only. Leads usually work as Developers with extra duties, and sometimes also act as Scrum Master; keep the hats separate.' }
    ],

    'sprint-planning': [
      { q: 'Which three topics does Sprint Planning address?',
        choices: ['Why is this Sprint valuable, what can be Done, and how will it get done', 'Yesterday, today and blockers',
          'Scope, cost and time', 'Design, build and test'], answer: 0,
        why: 'Topic one is why (the Sprint Goal), topic two is what (the items selected), topic three is how (the plan to get them Done).' },
      { q: 'The team finished 36, 41 and 38 points in the last three Sprints. Two people are on leave for 3 days each. Your manager asks for 60. What\'s the best plan?',
        choices: ['About 32 to 35, with stretch items listed separately', '60, to stretch the team', '45, as a compromise', '38, the average, regardless of leave'], answer: 0,
        why: 'Plan from the team\'s real past delivery, adjusted for this Sprint\'s capacity. Stretch items let the team pull more if it finishes early, without promising them.' },
      { q: 'Why does the Sprint Goal matter more than the list of stories?',
        choices: ['It lets the team decide what to drop or swap when things change, without losing what matters', 'Managers report it upward',
          'The Scrum Guide forbids changing stories', 'It\'s used to calculate velocity'], answer: 0,
        why: 'Plans change during a Sprint. A single objective gives the team a way to make trade-offs; a flat list of stories doesn\'t.' }
    ],

    'daily-scrum': [
      { q: 'According to the 2020 Scrum Guide, what is the Daily Scrum for?',
        choices: ['Inspecting progress toward the Sprint Goal and adapting the plan', 'Reporting status to the lead', 'Answering the three questions', 'Solving technical problems together'], answer: 0,
        why: 'It\'s for the Developers to inspect progress toward the Sprint Goal. The three questions were removed from the guide in 2020, and problem-solving belongs after the stand-up.' },
      { q: 'Anil has said "still working on the map, no blockers" for three days, on a 2-day story. What\'s the best response?',
        choices: ['Ask, curiously, what\'s left and what would help it move, and offer to take it after stand-up', 'Say "OK, next" to keep the stand-up short',
          'Ask him, in front of everyone, what he has actually done', 'Wait for the Sprint Review'], answer: 0,
        why: 'Repeated identical updates are a signal. A curious question plus an offer of help makes it easy to admit being stuck; an accusation makes people hide it.' },
      { q: 'Two developers start a 10-minute design debate in the stand-up. What do you do?',
        choices: ['Park it: name it, name who needs to be there, and take it right after the stand-up', 'Let them finish; it\'s important', 'Decide it on the spot', 'Cancel the stand-up'], answer: 0,
        why: 'The stand-up spots problems; it doesn\'t solve them. Parking keeps it to 15 minutes and still gives the topic proper time.' },
      { q: 'Which structure focuses a stand-up on finishing work?',
        choices: ['Walking the board from right to left, starting with the items closest to done', 'Going round in alphabetical order',
          'Each person listing everything they did yesterday', 'The lead reading out every ticket'], answer: 0,
        why: 'Starting with the items nearest to done asks "what does it take to finish this?" before anyone starts something new.' }
    ],

    'refinement-stories': [
      { q: 'Who sizes Product Backlog items, according to the Scrum Guide?',
        choices: ['The Developers who will do the work', 'The Product Owner', 'The lead engineer', 'The Scrum Master'], answer: 0,
        why: 'The 2020 guide: "The Developers who will be doing the work are responsible for the sizing." The Product Owner can help them understand and choose trade-offs.' },
      { q: 'Which is the most useful acceptance criterion for "search should be fast"?',
        choices: ['95% of searches return in under 300 ms at 200 searches a second', 'Search must be fast', 'Search should feel instant', 'Search will be optimised'], answer: 0,
        why: 'Only the first can be tested. A number with a load turns a vague wish into a decision the Product Owner can accept or change.' },
      { q: 'What does the S in INVEST stand for, and why?',
        choices: ['Small: it should fit comfortably in one Sprint', 'Simple: it must be easy to build', 'Specific: it must name the developer', 'Signed: the Product Owner must approve it'], answer: 0,
        why: 'Small items finish inside a Sprint, give feedback sooner and are easier to estimate. Big items should be split, by user flow or rule rather than by layer.' }
    ],

    'definition-of-done': [
      { q: 'An item has its code merged but no tests. Can it be presented as Done at the Sprint Review?',
        choices: ['No: work that doesn\'t meet the Definition of Done isn\'t presented as done; it goes back to the Product Backlog', 'Yes, if the code is merged',
          'Yes, if the Product Owner agrees', 'Only if tests are added before the release'], answer: 0,
        why: 'The 2020 Scrum Guide: if an item doesn\'t meet the Definition of Done, it can\'t be released or even presented at the Sprint Review.' },
      { q: 'When is the pressure to bend the Definition of Done usually highest?',
        choices: ['Just before a demo or a release, when shortcuts cost the most', 'At the start of a Sprint', 'During refinement', 'Never, in a senior team'], answer: 0,
        why: 'Deadlines create the pressure, and changes rushed to production without their checks are exactly the ones that cause incidents.' },
      { q: 'Which retro question helps raise the Definition of Done?',
        choices: ['What escaped to production last Sprint, and what would have caught it?', 'Who wrote the bug?', 'How can we skip testing next time?', 'Can we lower the bar to go faster?'], answer: 0,
        why: 'Each escaped problem points to one check worth adding. Adding one item at a time raises quality without stopping the team.' }
    ],

    'review-and-retro': [
      { q: 'What is the main difference between the Sprint Review and the Retrospective?',
        choices: ['The Review inspects what was built, with stakeholders; the Retro inspects how the team works', 'The Review is for managers, the Retro for developers',
          'They are the same meeting', 'The Retro is optional'], answer: 0,
        why: 'Both inspect and adapt: the Review looks at the product and the backlog; the Retrospective looks at people, processes, tools and the Definition of Done.' },
      { q: 'Nobody speaks in your retro. What\'s the best first change?',
        choices: ['Silent writing on a shared board, then group and vote, and go first with your own mistake', 'Fill the silence with your own list',
          'Ask why nobody cares', 'End early'], answer: 0,
        why: 'Silent writing lets quiet people contribute and stops loud people dominating. Your own mistake, first, makes honesty safe.' },
      { q: 'How many actions should a retro usually produce?',
        choices: ['One or two, each with an owner and a date, checked at the next retro', 'As many as possible', 'None; the discussion is enough', 'One per person'], answer: 0,
        why: 'A few owned, checked actions actually happen. A long list without owners teaches the team that retros change nothing.' }
    ],

    'points-velocity': [
      { q: 'Team A\'s velocity is 70 and Team B\'s is 38. What can you conclude?',
        choices: ['Nothing about productivity: each team sizes its own work, so the numbers are in different units', 'Team A is nearly twice as productive',
          'Team B is underperforming', 'Team A should share its estimates with Team B'], answer: 0,
        why: 'Points are relative within a team. Comparing velocities across teams is comparing prices in two currencies.' },
      { q: 'What happens when velocity becomes a target?',
        choices: ['Estimates inflate and nothing more is delivered', 'The team gets faster', 'Quality improves', 'Planning gets more accurate'], answer: 0,
        why: 'Goodhart\'s law: when a measure becomes a target, it stops being a good measure. The easiest way to raise velocity is to estimate higher.' },
      { q: 'A Sprint burn-down is flat for 8 days, then drops to zero on the last day. What does it most likely mean?',
        choices: ['Work isn\'t finished until the end: stories are too big, or "done" is declared late', 'The team is ahead of plan', 'Scope was added', 'The chart is broken'], answer: 0,
        why: 'The line only drops when items are Done. A flat line followed by a cliff means nothing finished until the last day, which hides risk all Sprint.' },
      { q: 'Which four measures compare delivery fairly across teams?',
        choices: ['Deployment frequency, lead time for changes, change failure rate, time to restore service', 'Velocity, story points, hours and commits',
          'Lines of code, pull requests, tickets and bugs', 'Burn-down, burn-up, velocity and capacity'], answer: 0,
        why: 'These are the four DORA measures from the Accelerate research. They mean the same thing in every team, so they can be compared.' }
    ]
  });
})(window.LELT);
