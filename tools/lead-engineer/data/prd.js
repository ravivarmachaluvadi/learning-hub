/*
 * prd.js - the PRD question generator's question groups and its bank of questions every PRD should
 * answer (js/views/tools/prd.js). The vague-word rules themselves are in data/lint-rules.js ("prd").
 *
 *   U.data.prdGroups = [{id, title}]               in the order the message lists them
 *   U.data.prdBank   = [{id, group, ask, look, rule}]
 *     look  a regular expression (case-insensitive): when it matches the PRD, the PRD probably
 *           answers the question already, so the tool does not mark it "not found"
 *     rule  for the three gaps the checks report: the id of its check in data/tool-checks.js
 */
(function (U) {
  'use strict';
  U.data.prdGroups = [
    { id: 'why', title: 'Why, for whom, and how we will know' },
    { id: 'scope', title: 'Scope: what is in and what is out' },
    { id: 'behaviour', title: 'Behaviour: what exactly happens' },
    { id: 'numbers', title: 'Numbers: speed, load and limits' },
    { id: 'reliability', title: 'Reliability and security' },
    { id: 'experience', title: 'Look and feel' },
    { id: 'decisions', title: 'Open decisions, rollout and dates' }
  ];

  U.data.prdBank = [
    { id: 'problem', group: 'why', rule: 'prd-no-problem',
      ask: 'What problem does this solve, for whom, and what happens today without it?',
      look: '\\b(?:problem|pain|because|so that|in order to|today,? (?:customers|users|agents)|currently|goal|why)\\b' },
    { id: 'measure', group: 'why', rule: 'prd-no-measure',
      ask: 'How will we know it worked: which number moves, from what to what, by when?',
      look: '\\b(?:success|metric|measured?|kpi|target|reduce|increase|drop|grow|improve|conversion|rate)\\b[^.\\n]{0,60}\\d|\\d[^.\\n]{0,60}\\b(?:success|metric|kpi|reduce|increase|drop|grow|improve|conversion|rate)\\b' },
    { id: 'users', group: 'why',
      ask: 'Who exactly uses it: which customers, agents or roles, and about how many?',
      look: '\\b(?:persona|roles?|segment|agents?|admins?|merchants?|sellers?|as an? \\w+)\\b' },
    { id: 'analytics', group: 'why',
      ask: 'What do we need to measure from day one: which events or reports?',
      look: '\\b(?:analytics|tracking|events?|dashboard|reports?|reporting)\\b' },
    { id: 'out-of-scope', group: 'scope', rule: 'prd-no-scope',
      ask: 'What is out of scope for the first release?',
      look: '\\b(?:out of scope|not in scope|non-goals?|not included|won\'t|will not|later release|second release|phase 2|not part of)\\b' },
    { id: 'edge-cases', group: 'behaviour',
      ask: 'What happens on the unhappy paths: no network, a timeout, a duplicate request, missing data?',
      look: '\\b(?:time ?outs?|retry|retries|duplicates?|offline|no network|unhappy path|error messages?|edge cases?)\\b' },
    { id: 'existing-data', group: 'behaviour',
      ask: 'What happens to existing data and work in progress: is there a migration?',
      look: '\\b(?:migrat\\w*|existing (?:data|orders|customers|refunds|records)|backfill|in progress|history)\\b' },
    { id: 'permissions', group: 'reliability',
      ask: 'Who may see and do this, and who must not?',
      look: '\\b(?:permissions?|roles?|only (?:support|agents|admins|the customer)|access|approve[sd]?|approval)\\b' },
    { id: 'rollout', group: 'decisions',
      ask: 'How does it roll out: everyone at once, a percentage of users, behind a feature flag? Who decides when to go wider?',
      look: '\\b(?:roll ?out|feature flag|toggle|pilot|beta|canary|gradual)\\b|\\d+ ?% of (?:users|customers|traffic)' },
    { id: 'support', group: 'decisions',
      ask: 'Who answers customer questions about it, and what do support and operations need on day one?',
      look: '\\b(?:support team|support agents|helpdesk|operations|ops team|runbook|faq|training)\\b' },
    { id: 'date', group: 'decisions',
      ask: 'Is there a date this must meet, and what happens if it is late?',
      look: '\\b(?:launch|release|go[- ]live|deadline|live|by)\\b[^.\\n]{0,40}\\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|\\d{1,2}(?:st|nd|rd|th)?)' }
  ];
})(window.LELT);
