/*
 * journal.js - the reflection journal's prompts (js/views/tools/journal.js): questions to write
 * about when you don't know where to start. "Suggest a prompt" goes round the groups in turn and
 * skips the prompts used in your recent entries.
 *
 *   U.data.journalGroups = [{id, title}]
 *   U.data.journalPrompts = [{id, group, q, habit: an optional behaviour id from data/assessment.js}]
 */
(function (U) {
  'use strict';
  U.data.journalGroups = [
    { id: 'decisions', title: 'Decisions and commitments' },
    { id: 'people', title: 'People' },
    { id: 'delivery', title: 'Delivery and meetings' },
    { id: 'influence', title: 'Your manager and other teams' },
    { id: 'yourself', title: 'You' }
  ];

  U.data.journalPrompts = [
    { id: 'd-said-yes', group: 'decisions', habit: 'comms-no', q: 'What did you say yes to this week that you should have answered with a trade-off?' },
    { id: 'd-on-the-spot', group: 'decisions', habit: 'pm-no-on-the-spot', q: 'Where did you give a date or an estimate on the spot? What would you say next time?' },
    { id: 'd-differently', group: 'decisions', habit: 'arch-tradeoffs', q: 'Which decision this week would you make differently, knowing what you know now?' },
    { id: 'd-slow', group: 'decisions', q: 'Which decision took longer than it needed to? Was it a one-way door or a two-way door?' },

    { id: 'p-did-myself', group: 'people', habit: 'lead-delegate', q: 'Where did you do work this week that someone on your team should have done?' },
    { id: 'p-feedback-held', group: 'people', habit: 'people-feedback', q: 'What feedback did you hold back this week, and why?' },
    { id: 'p-praise', group: 'people', habit: 'people-praise', q: 'Who did something worth praising this week? Did you tell them, specifically?' },
    { id: 'p-quiet', group: 'people', habit: 'people-safety', q: 'Who on the team have you heard least from lately? What might be going on for them?' },

    { id: 'v-surprise', group: 'delivery', habit: 'pm-bad-news', q: 'What surprised you this week, and when could you have seen it coming?' },
    { id: 'v-standup', group: 'delivery', habit: 'scrum-standup', q: 'Which piece of work looked fine in the stand-up but was actually stuck?' },
    { id: 'v-meeting', group: 'delivery', habit: 'comms-meetings', q: 'Which meeting ended without a decision, and what would have made it end with one?' },
    { id: 'v-estimate', group: 'delivery', habit: 'pm-range', q: 'Where was an estimate furthest from what happened? What did the breakdown miss?' },

    { id: 'i-heard-elsewhere', group: 'influence', habit: 'pm-bad-news', q: 'Did your manager hear anything about your team from someone else before they heard it from you?' },
    { id: 'i-other-team', group: 'influence', habit: 'lead-influence', q: 'Which other team did you need something from? What did you do to make their yes easy?' },
    { id: 'i-pressure', group: 'influence', habit: 'lead-shield', q: 'What pressure from above reached you this week, and what did you pass on to the team?' },
    { id: 'i-outcome', group: 'influence', habit: 'lead-visible', q: 'What did your team achieve this week that your manager should know about, with a number?' },

    { id: 'y-mistake', group: 'yourself', habit: 'lead-own', q: 'What mistake did you make this week, and how quickly did you say so?' },
    { id: 'y-proud', group: 'yourself', q: 'What are you proudest of this week, and why did it work?' },
    { id: 'y-calendar', group: 'yourself', q: 'Which meeting could you have skipped, sent someone else to, or replaced with a written note?' },
    { id: 'y-energy', group: 'yourself', q: 'Which part of the week gave you energy, and which part drained it?' }
  ];
})(window.LELT);
