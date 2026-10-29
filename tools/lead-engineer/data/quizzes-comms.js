/*
 * quizzes-comms.js - the questions at the end of each Communication lesson, keyed by lesson id
 * (same format as quizzes.js: {q, choices, answer: index of the right choice, why}).
 */
(function (U) {
  'use strict';
  U.data.quizzes = U.data.quizzes || {};
  Object.assign(U.data.quizzes, {

    'bluf-writing': [
      { q: 'Your manager will read your message on a phone between meetings. Where does the decision you need go?',
        choices: ['In the first line, with the date', 'In the last line, after the background', 'In an attachment', 'In a follow-up message'], answer: 0,
        why: 'Busy readers often stop after a line or two. Bottom line first: what you need and by when; the background after.' },
      { q: 'Which subject line is best?',
        choices: ['"Decision needed by Wed: ship refunds without batching?"', '"Update"', '"Quick question"', '"Refunds"'], answer: 0,
        why: 'A subject line with the ask and the date tells the reader what to do and how soon, before they open the message.' },
      { q: 'You need two unrelated things from your manager. What works best?',
        choices: ['Two messages, one ask each', 'One long message with both', 'Both, in the next 1:1', 'The bigger one, and hope they remember the other'], answer: 0,
        why: 'One message, one ask. The second ask in a message is the one that gets forgotten.' },
      { q: 'In Barbara Minto\'s SCQA, what is the A, and why does it matter most?',
        choices: ['The Answer: the message is built around it', 'The Appendix: the details at the end', 'The Audience: who will read it', 'The Actions: the to-do list'], answer: 0,
        why: 'Situation, Complication, Question, Answer. The first three set up the question; your answer is the point of the message.' }
    ],

    'clarifying-questions': [
      { q: 'You find 7 gaps in a PRD on Monday. What do you do?',
        choices: ['Group them and ask in one go, early', 'Send each one as you find it', 'Guess, and estimate on your guesses', 'Wait for the kickoff and ask then'], answer: 0,
        why: 'Grouped questions asked early respect the PM\'s time and get answered while changing course is still cheap.' },
      { q: 'Which question is easiest for a busy PM to answer?',
        choices: ['"Is 95% of searches under 300 ms at peak the target?"', '"What do you mean by fast?"', '"Is fast really needed?"', '"How fast should it be, roughly?"'], answer: 0,
        why: 'A proposal needs only a yes or a different number. Open questions make the other person invent the answer on the spot.' },
      { q: 'What does "Sorry, this might be a silly question" do to a good question?',
        choices: ['Tells people to take it lightly', 'Makes it more polite and more important', 'Makes people listen more carefully', 'Nothing: it is only politeness'], answer: 0,
        why: 'An apology signals that the question is a cost. A reason ("so I build the right thing") signals that it matters.' },
      { q: 'Why play an answer back in your own words?',
        choices: ['To catch a misunderstanding in seconds instead of weeks', 'To show you were listening', 'To slow the meeting down', 'Because the PM asked you to'], answer: 0,
        why: 'Playing it back exposes any gap between what was said and what you understood, while it is still cheap to fix.' }
    ],

    'requirements-prd': [
      { q: 'Which of these is a testable requirement?',
        choices: ['"95% of searches return in under 300 ms at 200 searches a second."', '"Search must be fast."', '"Search must be fast and scalable."', '"Search should feel instant."'], answer: 0,
        why: 'It has a number, a measure and a load. The others leave the decision to whoever builds it.' },
      { q: 'A PRD says "support all payment methods". What is the best question?',
        choices: ['"Which methods exactly, and which does the first release need?"', '"Is that really needed?"', '"Can we do it later?"', 'None: build every method you can find'], answer: 0,
        why: '"All" hides a list nobody has written down. Ask for the list and the part the first release needs.' },
      { q: 'Why does an "out of scope" list matter?',
        choices: ['It is the cheapest way to stop scope growing', 'It makes the PRD shorter', 'The Scrum Guide requires one', 'It replaces the estimate'], answer: 0,
        why: 'Saying what the first release will not do settles many future arguments before they start.' },
      { q: 'You think a requirement is unnecessary, but you don\'t fully understand it yet. What first?',
        choices: ['Clarify it, then challenge it', 'Challenge it straight away', 'Leave it out of the estimate quietly', 'Build it and see'], answer: 0,
        why: 'A challenge before understanding sounds like pushback. Understand it first; then you can propose something simpler with confidence.' }
    ],

    'positive-no': [
      { q: 'In William Ury\'s "Yes! No. Yes?", what is the first yes for?',
        choices: ['The interest you are protecting', 'Agreeing to the request', 'Being polite before refusing', 'The other person\'s idea'], answer: 0,
        why: 'Start with what matters to you ("I want the release to be safe"). It makes the no understandable rather than personal.' },
      { q: 'What should follow a no?',
        choices: ['A proposal: what you can do, or when', 'A long explanation of every reason', 'Nothing: a no is a no', 'An apology'], answer: 0,
        why: 'The final "Yes?" keeps the relationship and the work moving: an alternative, a date, or the trade-off to choose.' },
      { q: 'A manager asks for a new feature mid-sprint. Which reply is a good "not now"?',
        choices: ['"Not this sprint, unless something comes out. Which one would you move?"', '"Sure, we\'ll squeeze it in."', '"No, the sprint is locked."', '"I\'ll check and let you know."'], answer: 0,
        why: 'It makes the trade-off visible and lets the person who owns the priority decide.' },
      { q: 'You argued against a decision, and your manager decided anyway. What now?',
        choices: ['Commit fully, and raise any new facts as new facts', 'Comply slowly, so they see you were right', 'Keep arguing in every meeting', 'Work around the decision quietly'], answer: 0,
        why: 'Disagree and commit: say it clearly once, then support the decision.' }
    ],

    'meetings-decisions': [
      { q: 'Which is the best purpose for a meeting invite?',
        choices: ['"Decide: Redis or the database for the price cache"', '"Discuss caching"', '"Sync on search"', '"Catch-up"'], answer: 0,
        why: 'A purpose written as a decision tells people what to prepare, and when the meeting is done.' },
      { q: 'Who should usually speak last in a decision meeting?',
        choices: ['The most senior person', 'The newest person', 'The person who called the meeting', 'Whoever disagrees most'], answer: 0,
        why: 'Seniority anchors everyone else. Hearing the quieter people first gets you their real views.' },
      { q: 'A meeting can\'t decide because data is missing. What is a good close?',
        choices: ['Decide what will let you decide: who gets the data, by when, and when you decide', '"Let\'s take it offline"', 'Book another meeting next week to discuss it again', 'Let the most senior person guess'], answer: 0,
        why: 'Even without the decision, the meeting can end with an owner, a date and the next decision point.' },
      { q: 'Why add "reply by Wednesday if anything here is wrong" to the meeting summary?',
        choices: ['So silence means agreement and the decision isn\'t reopened later', 'To get more replies', 'To make the summary sound polite', 'Because nobody reads summaries'], answer: 0,
        why: 'A date for objections closes the decision. Without one, anyone who missed the meeting can reopen it at any time.' }
    ],

    'async-time-zones': [
      { q: 'Your client in London is offline when you hit a question at 6 pm in India. What is best?',
        choices: ['A self-contained written question with the context, the options and the date you need an answer', '"Hi, are you there?"', 'Wait for the next call', 'Decide yourself and don\'t mention it'], answer: 0,
        why: 'A message that stands alone gets answered in one round, not three. "Are you there?" costs a day.' },
      { q: 'An offshore developer says "yes" to the client on a call, but the date is impossible. What does Erin Meyer\'s work suggest may be going on?',
        choices: ['"Yes" can mean "I heard you" in a high-context, hierarchical setting', 'The developer is being dishonest', 'The client misheard', 'Nothing: yes always means yes'], answer: 0,
        why: 'In high-context and hierarchical cultures, "yes" can be politeness. Agree what yes means, and make it safe to say "I\'m not sure".' },
      { q: 'What are the few overlap hours across time zones best used for?',
        choices: ['Decisions, disagreements and sensitive topics', 'Reading status updates aloud', 'Nothing in particular', 'Code reviews only'], answer: 0,
        why: 'Live time is scarce across time zones. Spend it on what needs talking, and send status in writing.' },
      { q: 'Why prefer public channels over private messages for cross-team questions?',
        choices: ['The answer helps everyone who has the same question', 'Private messages are against the rules', 'They are faster', 'Managers can watch them'], answer: 0,
        why: 'Answers in public build a searchable record, and stop knowledge living in two heads.' }
    ],

    'difficult-conversations': [
      { q: 'Stone, Patton and Heen describe three conversations inside every difficult conversation. Which three?',
        choices: ['What happened, feelings, and identity', 'Facts, figures and dates', 'Past, present and future', 'Problem, cause and fix'], answer: 0,
        why: 'Behind the facts are feelings, and questions of identity ("am I competent?"). Handling those makes the facts easier to settle.' },
      { q: 'A disagreement turns tense. What is a good first move?',
        choices: ['Restate the goal you share', 'Repeat your point more firmly', 'Bring in your manager', 'Change the subject'], answer: 0,
        why: 'Crucial Conversations: restore mutual purpose first. "We both want refunds live without breaking checkout."' },
      { q: 'Which opening is best for questioning a principal engineer\'s design?',
        choices: ['"I see a risk with the shared database; here is what I saw. Am I missing something?"', '"This design won\'t work."', '"Everyone thinks this is a bad idea."', 'Saying nothing, and building it your way'], answer: 0,
        why: 'The fact first, your conclusion offered tentatively, and an invitation to correct you.' },
      { q: 'Two teams can\'t agree, and both leads are stuck. What next?',
        choices: ['Raise it together to the people who can decide, with the options', 'Each lead escalates separately to their own manager', 'The bigger team wins', 'Keep debating until one side gives up'], answer: 0,
        why: 'A joint escalation asks for a decision; two separate escalations look like a fight.' }
    ],

    'senior-audiences': [
      { q: 'You have ten minutes with a VP. How do you open?',
        choices: ['The bottom line, and the decision you need', 'The architecture, and how you got here', 'The team\'s velocity chart', 'A summary of every risk'], answer: 0,
        why: 'Senior people want the status, the decision they must make, and whether they can trust you. Lead with that, then go as deep as they ask.' },
      { q: 'A director asks for a number you don\'t have. What do you say?',
        choices: ['"I don\'t know; I\'ll send it by 5 pm today."', 'Your best guess, said as if it were exact', '"That\'s not my area."', '"Roughly, it\'s fine."'], answer: 0,
        why: 'A precise "I don\'t know" with a time sounds senior; a confident wrong number is remembered.' },
      { q: 'How do you explain tech debt to a business leader?',
        choices: ['By its business effect: risk, the speed of future changes, customers', 'With the coupling metrics', 'By naming the design patterns involved', 'You don\'t: it is an engineering matter'], answer: 0,
        why: 'Translate it into what they decide with: "every change to payments risks checkout; three weeks makes the next ten changes faster".' },
      { q: 'What should a steering committee update end with?',
        choices: ['What was decided and what happens next, confirmed in writing', 'Thanks and goodbye', 'A request for more meetings', 'The full risk register'], answer: 0,
        why: 'If nothing was decided, it was a status update that could have been an email.' }
    ]
  });
})(window.LELT);
