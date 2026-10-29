/*
 * reading.js - the reading list (#/reading, js/views/reading.js): books, articles and guides behind
 * the lessons, by track. Five are marked "start here" for a new lead.
 *
 *   {id, track, kind: 'book'|'article'|'guide'|'paper', title, author, year (first published),
 *    why: why a lead should read it, take: what to take from it, start: true for the first five,
 *    url: only for what is free to read online}
 *
 * Ticks ("I have read it") are kept in "lelt.reading" as {read: {id: 'YYYY-MM-DD'}}.
 */
(function (U) {
  'use strict';
  U.data.reading = [
    /* ---------- leadership ---------- */
    { id: 'managers-path', track: 'leadership', kind: 'book', title: 'The Manager\'s Path', author: 'Camille Fournier', year: 2017, start: true,
      why: 'Written by a former CTO for engineers moving into leading, one rung at a time: mentor, tech lead, manager and beyond.',
      take: 'The chapter on the tech lead: balancing your own code with the team\'s, project communication, and managing up.' },
    { id: 'high-output-management', track: 'leadership', kind: 'book', title: 'High Output Management', author: 'Andrew S. Grove', year: 1983, start: true,
      why: 'The book that made "a manager\'s output is the output of the team" the standard view, from the man who ran Intel.',
      take: 'Managerial leverage, 1:1s as the other person\'s meeting, and how to make meetings and decisions earn their time.' },
    { id: 'first-90-days', track: 'leadership', kind: 'book', title: 'The First 90 Days', author: 'Michael D. Watkins', year: 2003, start: true,
      why: 'The standard guide to starting any leadership role: what to learn first, and how to avoid the classic early mistakes.',
      take: 'The STARS situations, early wins, and the five conversations to have with your new manager.' },
    { id: 'influence-without-authority', track: 'leadership', kind: 'book', title: 'Influence Without Authority', author: 'Allan R. Cohen and David L. Bradford', year: 1990,
      why: 'Most of a lead\'s work depends on people who do not report to them. This is the practical model for that.',
      take: 'Influence as exchange, and the "currencies" people value: inspiration, task, position, relationship, personal.' },
    { id: 'becoming-the-boss', track: 'leadership', kind: 'article', title: 'Becoming the Boss', author: 'Linda A. Hill (Harvard Business Review)', year: 2007,
      why: 'A short article on why new managers struggle, from years of following them through their first year.',
      take: 'The beliefs to unlearn: that the title gives authority, that control is the goal, that smooth running is the job.' },
    { id: 'managing-your-boss', track: 'leadership', kind: 'article', title: 'Managing Your Boss', author: 'John J. Gabarro and John P. Kotter (Harvard Business Review)', year: 1980,
      why: 'The classic on the relationship with your manager as a two-way dependency, not a chain of command.',
      take: 'Understand their goals and pressures, match their working style, keep them informed, and use their time well.' },
    { id: 'brag-document', track: 'leadership', kind: 'article', title: 'Get your work recognized: write a brag document', author: 'Julia Evans', year: 2019,
      url: 'https://jvns.ca/blog/brag-documents/',
      why: 'A practical answer to "I worked hard all year and nobody noticed".',
      take: 'A running list of what you did and why it mattered, kept every week or two, and shared with your manager.' },
    { id: 'makers-schedule', track: 'leadership', kind: 'article', title: 'Maker\'s Schedule, Manager\'s Schedule', author: 'Paul Graham', year: 2009,
      url: 'https://paulgraham.com/makersschedule.html',
      why: 'Two pages that explain why one meeting can ruin a developer\'s afternoon, and why a lead feels pulled both ways.',
      take: 'Protect half-day blocks for making; cluster meetings so others can keep theirs.' },
    { id: 'staff-engineer', track: 'leadership', kind: 'book', title: 'Staff Engineer: Leadership Beyond the Management Track', author: 'Will Larson', year: 2021,
      why: 'For leads who want to stay technical: how senior engineers lead through influence, writing and sponsorship.',
      take: 'Writing strategy, managing technical quality, staying aligned with authority, and being visible.' },

    /* ---------- people ---------- */
    { id: 'radical-candor', track: 'people', kind: 'book', title: 'Radical Candor', author: 'Kim Scott', year: 2017, start: true,
      why: 'How to be direct and kind at the same time, from a former manager at Google and Apple.',
      take: 'Care personally and challenge directly; ask for criticism before you give it; praise specifically.' },
    { id: 'resilient-management', track: 'people', kind: 'book', title: 'Resilient Management', author: 'Lara Hogan', year: 2019,
      why: 'Short and practical: meeting your team, mentoring and coaching, setting expectations, and looking after yourself.',
      take: 'The feedback equation (observation, impact, question), and building a "Voltron" of people who support you.' },
    { id: 'five-dysfunctions', track: 'people', kind: 'book', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', year: 2002,
      why: 'A short story about a leadership team that fails, and why: a useful lens for any team that avoids conflict.',
      take: 'Absence of trust, fear of conflict, lack of commitment, avoidance of accountability, inattention to results.' },
    { id: 'coaching-habit', track: 'people', kind: 'book', title: 'The Coaching Habit', author: 'Michael Bungay Stanier', year: 2016,
      why: 'Seven questions that turn a lead who gives answers into one who grows people. Very short.',
      take: '"What\'s on your mind?", "And what else?", and staying curious a little longer before giving advice.' },
    { id: 'thanks-for-the-feedback', track: 'people', kind: 'book', title: 'Thanks for the Feedback', author: 'Douglas Stone and Sheila Heen', year: 2014,
      why: 'The other half of feedback: how to hear it without defending yourself, from the authors of Difficult Conversations.',
      take: 'Separate appreciation, coaching and evaluation, and notice the triggers that make you reject what you hear.' },
    { id: 'fearless-organization', track: 'people', kind: 'book', title: 'The Fearless Organization', author: 'Amy C. Edmondson', year: 2018,
      why: 'The research on psychological safety, by the person who named it, with what leaders do to build it.',
      take: 'Safety and high standards together; frame work as learning; respond to bad news with thanks.' },

    /* ---------- project management ---------- */
    { id: 'software-estimation', track: 'pm', kind: 'book', title: 'Software Estimation: Demystifying the Black Art', author: 'Steve McConnell', year: 2006, start: true,
      why: 'The most practical book on estimating software, by the author who made the cone of uncertainty famous.',
      take: 'Estimates, targets and commitments are different things; count before you judge; always give a range.' },
    { id: 'mythical-man-month', track: 'pm', kind: 'book', title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', year: 1975,
      why: 'Fifty years old and still right about why adding people to a late project makes it later.',
      take: 'Brooks\'s law, the growing cost of communication in bigger teams, and conceptual integrity.' },
    { id: 'waltzing-with-bears', track: 'pm', kind: 'book', title: 'Waltzing with Bears: Managing Risk on Software Projects', author: 'Tom DeMarco and Timothy Lister', year: 2003,
      why: 'A short, readable case that ignoring risk is the riskiest plan of all.',
      take: 'Keep a risk list you actually use, show uncertainty as a range of dates, and dare to say a date is not certain.' },
    { id: 'product-development-flow', track: 'pm', kind: 'book', title: 'The Principles of Product Development Flow', author: 'Donald G. Reinertsen', year: 2009,
      why: 'Where cost of delay and CD3 come from. Dense, and it changes how you see queues and priorities.',
      take: 'Put a number on the cost of delay; queues are the hidden cost of product work; work in smaller batches.' },

    /* ---------- communication ---------- */
    { id: 'pyramid-principle', track: 'comms', kind: 'book', title: 'The Pyramid Principle: Logic in Writing and Thinking', author: 'Barbara Minto', year: 1987,
      why: 'The consultants\' method for writing that busy people read: the answer first, then the reasons.',
      take: 'The answer at the top, the arguments under it, the facts under those; SCQA to open a longer message.' },
    { id: 'crucial-conversations', track: 'comms', kind: 'book', title: 'Crucial Conversations: Tools for Talking When Stakes Are High', author: 'Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler', year: 2002,
      why: 'For the conversations where opinions differ, stakes are high and emotions run strong: most of a lead\'s hard ones.',
      take: 'Start with what you really want, make it safe (mutual purpose, mutual respect), and state your path tentatively.' },
    { id: 'positive-no', track: 'comms', kind: 'book', title: 'The Power of a Positive No', author: 'William Ury', year: 2007,
      why: 'How to say no to a senior person without damaging the relationship, from the co-author of Getting to Yes.',
      take: 'Yes to the interest you protect, a clear no, then a yes to a proposal that keeps things moving.' },
    { id: 'getting-to-yes', track: 'comms', kind: 'book', title: 'Getting to Yes', author: 'Roger Fisher and William Ury', year: 1981,
      why: 'The classic on negotiating without giving in or fighting: deadlines, scope and priorities are all negotiations.',
      take: 'Focus on interests, not positions; invent options for mutual gain; know your best alternative.' },

    /* ---------- Scrum and agile ---------- */
    { id: 'scrum-guide', track: 'scrum', kind: 'guide', title: 'The Scrum Guide', author: 'Ken Schwaber and Jeff Sutherland', year: 2020,
      url: 'https://scrumguides.org/scrum-guide.html',
      why: 'The short text that defines Scrum. Many arguments about Scrum end when someone reads it.',
      take: 'The three accountabilities, the five events and their timeboxes, and what is not in it: story points, velocity, the three questions.' },
    { id: 'agile-retrospectives', track: 'scrum', kind: 'book', title: 'Agile Retrospectives: Making Good Teams Great', author: 'Esther Derby and Diana Larsen', year: 2006,
      why: 'The source of the five-stage retrospective in the playbook, with activities for every stage.',
      take: 'Set the stage, gather data, generate insights, decide what to do, close the retrospective.' },
    { id: 'agile-estimating', track: 'scrum', kind: 'book', title: 'Agile Estimating and Planning', author: 'Mike Cohn', year: 2005,
      why: 'Story points and velocity used well: as a team\'s planning tool, not a target or a league table.',
      take: 'Relative estimates, release planning from velocity ranges, and re-planning as you learn.' },

    /* ---------- engineering ---------- */
    { id: 'accelerate', track: 'eng', kind: 'book', title: 'Accelerate', author: 'Nicole Forsgren, Jez Humble and Gene Kim', year: 2018,
      why: 'The research behind the four DORA measures: what high-performing delivery teams do differently.',
      take: 'Deployment frequency, lead time, change failure rate and time to restore, and the practices that move them.' },
    { id: 'sre-book', track: 'eng', kind: 'book', title: 'Site Reliability Engineering: How Google Runs Production Systems', author: 'Betsy Beyer, Chris Jones, Jennifer Petoff and Niall Richard Murphy (eds.)', year: 2016,
      url: 'https://sre.google/sre-book/table-of-contents/',
      why: 'Free to read online. The chapters on SLOs, on-call, incidents and postmortems are the basis of the incident playbook.',
      take: 'Error budgets, blameless postmortems, managing incidents with clear roles, and reducing toil.' },
    { id: 'code-review-guide', track: 'eng', kind: 'guide', title: 'Code Review Developer Guide', author: 'Google Engineering Practices', year: 2019,
      url: 'https://google.github.io/eng-practices/',
      why: 'How a very large engineering organisation keeps reviews fast and useful. Short pages, free to read.',
      take: 'Approve when the change improves the code\'s health; respond within a working day; small changes.' },
    { id: 'legacy-code', track: 'eng', kind: 'book', title: 'Working Effectively with Legacy Code', author: 'Michael C. Feathers', year: 2004,
      why: 'For the codebase every team inherits: how to change code that has no tests, safely.',
      take: 'Legacy code is code without tests; find seams, add characterisation tests, then change it in small steps.' },

    /* ---------- architecture ---------- */
    { id: 'ddia', track: 'arch', kind: 'book', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', year: 2017,
      why: 'The best single book on the trade-offs behind databases, queues and distributed systems.',
      take: 'Reliability, scalability and maintainability as explicit goals, and the trade-offs behind every storage and messaging choice.' },
    { id: 'fundamentals-architecture', track: 'arch', kind: 'book', title: 'Fundamentals of Software Architecture', author: 'Mark Richards and Neal Ford', year: 2020,
      why: 'A broad, practical tour of what an architect does, and of the common architecture styles.',
      take: 'Architecture characteristics (the quality requirements), the trade-offs between styles, and recording decisions.' },
    { id: 'team-topologies', track: 'arch', kind: 'book', title: 'Team Topologies', author: 'Matthew Skelton and Manuel Pais', year: 2019,
      why: 'Conway\'s law turned into a design method: shape teams for the architecture you want.',
      take: 'Stream-aligned, platform, enabling and complicated-subsystem teams, and the three ways teams interact.' },
    { id: 'documenting-decisions', track: 'arch', kind: 'article', title: 'Documenting Architecture Decisions', author: 'Michael Nygard', year: 2011,
      url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',
      why: 'The short blog post that started architecture decision records. The decision record builder follows it.',
      take: 'Title, status, context, decision and consequences, one decision per record, kept with the code.' },
    { id: 'building-microservices', track: 'arch', kind: 'book', title: 'Building Microservices', author: 'Sam Newman', year: 2015,
      why: 'The balanced guide to when microservices help and when a modular monolith is the better choice. Read the second edition (2021).',
      take: 'Model services around the business, own their data, and do not split before you understand the domain.' }
  ];
})(window.LELT);
