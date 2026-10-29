/*
 * plan90.js - the 30-60-90 day plan builder's suggestions (js/views/tools/plan90.js).
 *
 *   U.data.plan90Kinds = [{id: learn|people|deliver|improve, title, why}]
 *   U.data.plan90Bank = [{id, phase: 1 (days 1-30) | 2 (31-60) | 3 (61-90), kind, what,
 *                         measure: what "done" means, why, link: the page that helps ('tool:id'...)}]
 *
 * The first 30 days are for learning and meeting people (Michael Watkins, The First 90 Days); the
 * builder checks that the plan starts that way.
 */
(function (U) {
  'use strict';
  U.data.plan90Kinds = [
    { id: 'learn', title: 'Learn', why: 'Understand the people, the system and the work before you change them.' },
    { id: 'people', title: 'People', why: 'Relationships with the team, your manager and the people you depend on.' },
    { id: 'deliver', title: 'Deliver', why: 'Results the business can see: the work you were made lead to land.' },
    { id: 'improve', title: 'Improve', why: 'Changes to how the team works, made once you know why things are the way they are.' }
  ];

  U.data.plan90Bank = [
    /* ---------- days 1 to 30: learn and meet ---------- */
    { id: 'p1-oneonones', phase: 1, kind: 'people', link: 'tool:oneonone',
      what: 'Hold a first 1:1 with everyone on the team',
      measure: 'A 1:1 with every person by day 15, with the same three questions and notes',
      why: 'People talk most openly to a new lead. Asking everyone the same questions shows the patterns.' },
    { id: 'p1-manager-success', phase: 1, kind: 'people', link: 'lesson:first-90-days',
      what: 'Agree with your manager what success at day 90 looks like',
      measure: 'Three outcomes for day 90, written down and agreed with your manager by day 10',
      why: 'You will be judged against expectations; knowing them early is the cheapest way to meet them.' },
    { id: 'p1-stakeholders', phase: 1, kind: 'people', link: 'tool:dependencies',
      what: 'Meet the Product Owner and the leads you depend on',
      measure: 'A 30-minute conversation with each, and a stakeholder map, by day 20',
      why: 'The people who can block your work are easier to work with once you know their goals.' },
    { id: 'p1-architecture', phase: 1, kind: 'learn', link: 'lesson:c4-model',
      what: 'Learn the architecture and its riskiest parts',
      measure: 'A one-page sketch of the main services and their dependencies, checked with a senior developer, by day 20',
      why: 'You cannot judge estimates, risks or designs in a system you cannot picture.' },
    { id: 'p1-incidents', phase: 1, kind: 'learn', link: 'tool:postmortem',
      what: 'Read the last five incidents and their postmortems',
      measure: 'The repeating causes listed, and the on-call load known (pages a week), by day 15',
      why: 'Incidents show where the system and the process are weakest, faster than any document.' },
    { id: 'p1-commitments', phase: 1, kind: 'learn', link: 'tool:raid',
      what: 'Find out what has been promised, to whom and by when',
      measure: 'Every open commitment listed with its owner and date, and shared with your manager by day 20',
      why: 'The promises made before you arrived are now yours. Better to find them than to be surprised by them.' },
    { id: 'p1-watch-meetings', phase: 1, kind: 'learn', link: 'playbook:sprint-planning',
      what: 'Watch the team\'s meetings before changing any',
      measure: 'Each Scrum event attended once, with notes on what works, by day 21',
      why: 'A ritual that looks wasteful may exist for a reason you have not seen yet.' },
    { id: 'p1-pick-win', phase: 1, kind: 'improve', link: 'lesson:first-90-days',
      what: 'Choose one early win the team asked for',
      measure: 'One small change named by several people in your 1:1s, agreed with the team by day 30',
      why: 'An early win the team chose builds your credibility and is their win too.' },

    /* ---------- days 31 to 60: contribute ---------- */
    { id: 'p2-early-win', phase: 2, kind: 'improve', link: 'playbook:retrospective',
      what: 'Deliver the early win',
      measure: 'The change in place, and reviewed at a retrospective, by day 50',
      why: 'Finishing one change properly earns the right to make the next, bigger one.' },
    { id: 'p2-working-agreement', phase: 2, kind: 'improve', link: 'term:working-agreement',
      what: 'Write a working agreement with the team',
      measure: 'Norms for the stand-up, reviews and on-call agreed in writing by the whole team by day 45',
      why: 'Rules the team wrote are rules the team keeps, and they replace "the lead said so".' },
    { id: 'p2-status-rhythm', phase: 2, kind: 'deliver', link: 'tool:status',
      what: 'Set a status rhythm with your manager and stakeholders',
      measure: 'A weekly status sent every Friday for four weeks running',
      why: 'A predictable update is how your manager stops having to ask.' },
    { id: 'p2-delegate', phase: 2, kind: 'people', link: 'tool:delegate',
      what: 'Delegate one area that only you know',
      measure: 'Someone else owns it, with a brief and agreed check-ins, by day 60',
      why: 'An area only you know makes you the bottleneck and the single point of failure.' },
    { id: 'p2-release', phase: 2, kind: 'deliver', link: 'tool:estimate',
      what: 'Land the next release on its date',
      measure: 'The release shipped on the date agreed at planning, or moved with two weeks\' notice',
      why: 'Delivery is what you were made lead for. Early warning counts as much as the date.' },
    { id: 'p2-rhythm', phase: 2, kind: 'people', link: 'tool:oneonone',
      what: 'Keep a regular 1:1 rhythm with everyone',
      measure: 'No 1:1 overdue in the planner for four weeks in a row',
      why: 'The first 1:1s open the door; the regular ones are where problems surface while they are small.' },
    { id: 'p2-risks', phase: 2, kind: 'deliver', link: 'tool:raid',
      what: 'Keep a risk log for the main project',
      measure: 'A RAID log reviewed every week, with an owner and an action on each open risk',
      why: 'Risks written down early are cheap; the same risks found late are incidents and missed dates.' },
    { id: 'p2-feedback', phase: 2, kind: 'people', link: 'tool:feedback',
      what: 'Give each person one piece of specific feedback',
      measure: 'Praise or a change, in private, for everyone on the team by day 60',
      why: 'Specific feedback early sets the norm that feedback is normal, not a warning sign.' },

    /* ---------- days 61 to 90: lead ---------- */
    { id: 'p3-plan', phase: 3, kind: 'deliver', link: 'tool:prioritise',
      what: 'Own the team\'s plan for next quarter',
      measure: 'A quarterly plan with goals and date ranges, agreed with the Product Owner by day 85',
      why: 'By day 90 the plan should be yours, with trade-offs you can explain.' },
    { id: 'p3-outcome-note', phase: 3, kind: 'deliver', link: 'lesson:visible-impact',
      what: 'Send your manager a monthly note of outcomes',
      measure: 'Two monthly notes with numbers sent by day 90',
      why: 'Your manager has to describe your team\'s results to people who never see them.' },
    { id: 'p3-tech-debt', phase: 3, kind: 'improve', link: 'tool:techdebt',
      what: 'Make the case for the biggest piece of tech debt',
      measure: 'A business case with its payback sent to the person who decides, by day 80',
      why: 'Tech debt gets time when it is a business decision with numbers, not a request to refactor.' },
    { id: 'p3-growth', phase: 3, kind: 'people', link: 'lesson:growth-conversations',
      what: 'Agree a growth goal with each person',
      measure: 'A written growth goal for everyone, discussed in a 1:1, by day 90',
      why: 'Growth that nobody asks about turns into a resignation that nobody expected.' },
    { id: 'p3-decisions', phase: 3, kind: 'improve', link: 'tool:adr',
      what: 'Start recording important decisions',
      measure: 'Three decision records written and kept next to the code by day 90',
      why: 'Decisions made on calls are forgotten; written ones stop the same debate from coming back.' },
    { id: 'p3-review', phase: 3, kind: 'people', link: 'lesson:managing-up',
      what: 'Review the 90 days with your manager',
      measure: 'A conversation on the three outcomes agreed at the start, and goals for the next 90 days agreed',
      why: 'Closing the loop on what you agreed turns a first impression into a track record.' },
    { id: 'p3-reflect', phase: 3, kind: 'learn', link: 'tool:journal',
      what: 'Reflect on what you have learned as a lead',
      measure: 'A journal entry every week for the last four weeks, and the self-assessment retaken',
      why: 'Experience teaches only when you stop to look at it.' },
    { id: 'p3-delivery-numbers', phase: 3, kind: 'improve', link: 'lesson:dora-metrics',
      what: 'Measure how the team delivers',
      measure: 'Lead time and change failure rate measured for the last month and shared at the Sprint Review',
      why: 'A baseline lets you show what your changes did, instead of saying they helped.' }
  ];
})(window.LELT);
