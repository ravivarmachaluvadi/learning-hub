/*
 * assessment.js - the 30 behaviours rated in the self-assessment ("Start here", js/views/assess.js).
 * Each is something a strong lead does every week, written so you can rate it from 1 (rarely) to
 * 5 (almost always). A track's score is the average of its behaviours.
 *
 *   {id, track, text}
 */
(function (U) {
  'use strict';
  U.data.assessment = [
    { id: 'pm-no-on-the-spot', track: 'pm', text: 'When asked for a deadline, I take time to break the work down before committing.' },
    { id: 'pm-range', track: 'pm', text: 'I give estimates as a range with assumptions, not a single number.' },
    { id: 'pm-status-date', track: 'pm', text: 'My status updates say what is done, what comes next with dates, and what I need.' },
    { id: 'pm-bad-news', track: 'pm', text: 'I raise risks and delays the day I find them, before anyone asks.' },
    { id: 'pm-dependencies', track: 'pm', text: 'I agree dependencies with other teams in writing, with dates and owners.' },

    { id: 'comms-ask', track: 'comms', text: 'I ask clarifying questions about requirements early, without apologising.' },
    { id: 'comms-bluf', track: 'comms', text: 'I put the bottom line first in messages and emails.' },
    { id: 'comms-no', track: 'comms', text: 'I can say no to my manager by showing the trade-off, instead of agreeing to everything.' },
    { id: 'comms-meetings', track: 'comms', text: 'My meetings end with decisions, owners and dates.' },
    { id: 'comms-playback', track: 'comms', text: 'I play back what I heard to check I understood, before acting on it.' },

    { id: 'scrum-standup', track: 'scrum', text: 'In stand-up, I notice work that is not moving and ask a follow-up question.' },
    { id: 'scrum-planning', track: 'scrum', text: 'I plan sprints from the team\'s actual past delivery, not from wishes.' },
    { id: 'scrum-dod', track: 'scrum', text: 'I hold the Definition of Done even when a demo or a release is close.' },
    { id: 'scrum-retro', track: 'scrum', text: 'Our retros produce one or two actions with owners, and we check them.' },

    { id: 'people-oneone', track: 'people', text: 'I hold regular 1:1s that are about the other person, not about status.' },
    { id: 'people-feedback', track: 'people', text: 'I give specific feedback in private, with an example and its effect.' },
    { id: 'people-praise', track: 'people', text: 'I praise good work specifically, and in public.' },
    { id: 'people-safety', track: 'people', text: 'People on my team say when they are stuck, without me having to dig.' },

    { id: 'lead-delegate', track: 'leadership', text: 'I delegate important work, with a clear outcome and check-ins, instead of doing it myself.' },
    { id: 'lead-visible', track: 'leadership', text: 'My manager knows the outcomes my team delivered, with numbers.' },
    { id: 'lead-own', track: 'leadership', text: 'When I make a mistake, I say so quickly and explain what I will change.' },
    { id: 'lead-shield', track: 'leadership', text: 'I absorb pressure from above instead of passing it straight to the team.' },
    { id: 'lead-influence', track: 'leadership', text: 'I get help from people who do not report to me by connecting my ask to their goals.' },

    { id: 'eng-review', track: 'eng', text: 'Pull requests on my team get reviewed within a day.' },
    { id: 'eng-debt', track: 'eng', text: 'I make the business case for fixing tech debt, with its cost and value.' },
    { id: 'eng-incident', track: 'eng', text: 'After an incident, we run a blameless review and follow up on its actions.' },
    { id: 'eng-ai', track: 'eng', text: 'I know where AI tools speed up my team\'s work and where they do not, and estimate accordingly.' },

    { id: 'arch-docs', track: 'arch', text: 'I write down important technical decisions and their reasons (a design doc or a decision record).' },
    { id: 'arch-nfr', track: 'arch', text: 'I turn vague quality requirements (fast, scalable, secure) into numbers before designing.' },
    { id: 'arch-tradeoffs', track: 'arch', text: 'When choosing between designs, I compare them against clear criteria and explain the trade-off.' }
  ];
})(window.LELT);
