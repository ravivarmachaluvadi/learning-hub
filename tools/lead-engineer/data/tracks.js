/*
 * tracks.js - the seven areas of a lead engineer's job. Every lesson, scenario, tool and behaviour
 * in the self-assessment belongs to one of them.
 *
 *   {id, name, short: label for badges and the radar chart, summary}
 */
(function (U) {
  'use strict';
  U.data.tracks = [
    { id: 'pm', name: 'Project management', short: 'Projects',
      summary: 'Deadlines, estimates, status updates, priorities, dependencies on other teams, and risks.' },
    { id: 'comms', name: 'Communication', short: 'Communication',
      summary: 'Asking questions with confidence, writing messages that get answers, saying no, and giving bad news.' },
    { id: 'scrum', name: 'Scrum and agile', short: 'Scrum',
      summary: 'The minimum Scrum a lead needs: the roles, the events and how to run them, the artifacts, and the numbers.' },
    { id: 'people', name: 'People management', short: 'People',
      summary: '1:1s, feedback, helping someone who is stuck or struggling, and building a team that speaks up.' },
    { id: 'leadership', name: 'Leadership and influence', short: 'Leadership',
      summary: 'Moving from engineer to lead: delegating, being visible, influencing people who do not report to you.' },
    { id: 'eng', name: 'Engineering leadership', short: 'Engineering',
      summary: 'Code review culture, tech debt, quality, incidents, delivery metrics, and AI tools in the team.' },
    { id: 'arch', name: 'Software architecture', short: 'Architecture',
      summary: 'Design docs and decision records, trade-offs, non-functional requirements, and evolving a system safely.' }
  ];
})(window.LELT);
