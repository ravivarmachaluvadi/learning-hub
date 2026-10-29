/*
 * oneonone.js - the question bank for the 1:1 planner (js/views/tools/oneonone.js).
 *
 *   U.data.oneOnOneGroups    = [{id, title, why: what this kind of question is for}]
 *   U.data.oneOnOneQuestions = [{id, group, q}]
 *
 * "Suggest questions" picks from three groups, rotating, and always includes a growth question when
 * none of the last three 1:1s had one; it skips anything asked in the last four. The planner's
 * "no growth topic" check looks for the group id "growth".
 *
 * The questions are written for this tool, after the advice in Andy Grove's High Output Management
 * (the 1:1 is the other person's meeting), Camille Fournier's The Manager's Path, Julie Zhuo's The
 * Making of a Manager and Lara Hogan's Resilient Management.
 */
(function (U) {
  'use strict';
  U.data.oneOnOneGroups = [
    { id: 'open', title: 'Opening', why: 'Starts the 1:1 on their agenda, not yours.' },
    { id: 'workload', title: 'Workload and wellbeing', why: 'Finds overload and stress before they turn into a resignation or a mistake.' },
    { id: 'blockers', title: 'What gets in the way', why: 'Finds what slows them down that they would not raise in a stand-up.' },
    { id: 'growth', title: 'Growth and career', why: 'Keeps the 1:1 about where they are going, not only this week. Ask one at least once a month.' },
    { id: 'feedback-you', title: 'Feedback for you', why: 'Lets them tell you what to change. Ask often, and thank them for every answer.' },
    { id: 'team', title: 'The team and how we work', why: 'Hears what they see in the team that you do not.' },
    { id: 'new', title: 'For someone new', why: 'For the first three months: settling in, what is confusing, who they know.' },
    { id: 'change', title: 'After a change or a hard week', why: 'For a reorg, an incident, a missed date, a hard release, or news from home.' }
  ];

  U.data.oneOnOneQuestions = [
    /* opening */
    { id: 'open-mind', group: 'open', q: 'What is on your mind this week?' },
    { id: 'open-first', group: 'open', q: 'What would you like to talk about first?' },
    { id: 'open-best', group: 'open', q: 'What was the best part of your week, and the worst?' },
    { id: 'open-energy', group: 'open', q: 'What gave you energy this week, and what drained it?' },
    { id: 'open-useful', group: 'open', q: 'What would make this half hour useful for you?' },

    /* workload and wellbeing */
    { id: 'load-scale', group: 'workload', q: 'On a scale of 1 to 5, how is your workload right now? What would move it one step?' },
    { id: 'load-hours', group: 'workload', q: 'Have you worked late or at the weekend lately? What caused it?' },
    { id: 'load-drop', group: 'workload', q: 'If you could drop one thing from your plate, what would it be?' },
    { id: 'load-stress', group: 'workload', q: 'What is worrying you at the moment, at work or outside it, that I should know about?' },
    { id: 'load-time-off', group: 'workload', q: 'When did you last take a proper break? Is any leave coming up I should plan for?' },

    /* what gets in the way */
    { id: 'block-slow', group: 'blockers', q: 'What slowed you down this week that you did not mention in stand-up?' },
    { id: 'block-wait', group: 'blockers', q: 'What are you waiting on from someone else, and since when?' },
    { id: 'block-unclear', group: 'blockers', q: 'Is anything on your plate unclear: what to build, why, or by when?' },
    { id: 'block-tool', group: 'blockers', q: 'Which tool, process or meeting wastes the most of your time?' },
    { id: 'block-help', group: 'blockers', q: 'What could I do this week that would help you most?' },

    /* growth and career */
    { id: 'grow-year', group: 'growth', q: 'Where would you like to be in a year? What would you like to be doing more of?' },
    { id: 'grow-skill', group: 'growth', q: 'Which skill would you most like to build next, and what work would build it?' },
    { id: 'grow-stretch', group: 'growth', q: 'Which piece of upcoming work would stretch you in a way you would enjoy?' },
    { id: 'grow-promotion', group: 'growth', q: 'What do you think stands between you and the next level? Shall we write down what it would take?' },
    { id: 'grow-proud', group: 'growth', q: 'What work from the last few months are you proudest of?' },
    { id: 'grow-learn', group: 'growth', q: 'What have you learned recently that surprised you?' },
    { id: 'grow-goal-check', group: 'growth', q: 'How is your goal going? What is the next small step, and how can I help with it?' },

    /* feedback for you */
    { id: 'fb-change', group: 'feedback-you', q: 'What is one thing I could do differently that would help you?' },
    { id: 'fb-stop', group: 'feedback-you', q: 'Is there anything I do that gets in your way, and that I should stop?' },
    { id: 'fb-meeting', group: 'feedback-you', q: 'Are these 1:1s useful? What would make them more useful?' },
    { id: 'fb-decision', group: 'feedback-you', q: 'Was there a decision I made lately that did not make sense to you?' },
    { id: 'fb-hear', group: 'feedback-you', q: 'What do you think I do not hear about the team, because people do not tell me?' },

    /* the team and how we work */
    { id: 'team-change', group: 'team', q: 'If you could change one thing about how this team works, what would it be?' },
    { id: 'team-thanks', group: 'team', q: 'Who on the team helped you lately, and do they know?' },
    { id: 'team-safe', group: 'team', q: 'Do you feel you can say "I don\'t know" or "I made a mistake" in our team? When did you last hold back?' },
    { id: 'team-meetings', group: 'team', q: 'Which of our meetings is the least useful, and why?' },
    { id: 'team-quality', group: 'team', q: 'Where are we cutting corners that will hurt us later?' },

    /* for someone new */
    { id: 'new-surprise', group: 'new', q: 'What has surprised you most since you joined?' },
    { id: 'new-confusing', group: 'new', q: 'What is still confusing: the code, the product, or who does what?' },
    { id: 'new-people', group: 'new', q: 'Who have you met so far, and who should you meet next?' },
    { id: 'new-ask', group: 'new', q: 'When you got stuck this week, who did you ask? Did it feel easy to ask?' },
    { id: 'new-docs', group: 'new', q: 'Which document was wrong or missing when you needed it? Could you fix it while it is fresh?' },

    /* after a change or a hard week */
    { id: 'change-how', group: 'change', q: 'How are you feeling about what happened?' },
    { id: 'change-heard', group: 'change', q: 'What have you heard about the change, and what questions do you still have?' },
    { id: 'change-need', group: 'change', q: 'What do you need from me over the next couple of weeks?' },
    { id: 'change-learn', group: 'change', q: 'Looking back, what would you do the same, and what would you do differently?' }
  ];
})(window.LELT);
