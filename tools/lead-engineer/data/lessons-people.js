/*
 * lessons-people.js - the People management track: 1:1s, feedback, praise and credit, asking for
 * feedback, delegating, psychological safety, career conversations, helping someone who struggles,
 * hard conversations, and people joining and leaving.
 *
 * Same entry format as lessons-scrum.js:
 *   {id, track, title, summary, minutes, keywords, body (Markdown), analogy (Markdown),
 *    mistakes: [Markdown], say: [Markdown], sources: [Markdown], related: ['scenario:id', ...]}
 * The quiz for each lesson is in data/quizzes-people.js under the lesson's id.
 */
(function (U) {
  'use strict';
  U.data.lessons = U.data.lessons || [];
  U.data.lessons.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'one-on-ones', track: 'people', minutes: 7,
      title: '1:1s: the meeting that belongs to them',
      summary: 'Why a lead holds regular 1:1s, how often, what goes on the agenda (not status), the questions that get past "no issues", and the one rule: move it, never cancel it.',
      keywords: ['1:1', '1:1s', 'one on one', 'one-on-one', 'one to one', 'check-in', 'agenda', 'questions', 'rhythm', 'grove'],
      body: `## What a 1:1 is for
A 1:1 is a regular, private conversation between you and one person on your team. Andy Grove, who ran Intel, put it plainly in *High Output Management*: the 1:1 is **the other person's meeting**, with the agenda and tone set by them. It is where you hear what no stand-up, board or dashboard will tell you: the blocker they were embarrassed to mention, the stress building at home, the career goal, the job offer they are thinking about.

## How often, and how long
- **Weekly, 30 minutes**, is the common rhythm for a team of up to about eight. Fortnightly is the least that keeps the conversation going; monthly 1:1s turn into catch-ups.
- **Same time each week.** A predictable slot lets people save topics for it instead of interrupting you, or saying nothing.
- **Move it; never cancel it.** People notice which meetings you protect. Three cancelled 1:1s say "you are the first thing I drop".
- For onsite and offshore teams, hold it in **their** working hours, not at 9 pm their time.

## Their agenda first, and not status
Ask a day ahead: *"Anything you'd like to talk about tomorrow?"* Start with their topics. Status belongs on the board and in the stand-up; if a 1:1 is "so, where are we on the refund API?", it has become a second stand-up and their topics never get a turn.

Michael Lopp describes three kinds of 1:1 you will meet: **the update** (they tell you things, which is fine but shallow), **the vent** (they need to be heard, not fixed: listen) and **the disaster** (something big is wrong: stop everything else). Know which one you are in.

## Questions that get past "no issues"
In many Indian offices, telling your lead about a problem can feel like admitting failure, so "Any issues?" gets "No issues." Ask specific, open questions instead:
- *"What slowed you down this week that you didn't mention in stand-up?"*
- *"On a scale of 1 to 5, how's your workload? What would move it one step?"*
- *"What's one thing I could do differently that would help you?"*
- *"Where would you like to be in a year?"*: ask about growth at least once a month, because people rarely raise it themselves.

Share something yourself first sometimes ("I'm finding the new release process slow too"); it makes honesty feel normal.

## Notes and actions
Write down what you agreed, with a date, and do **your** actions first. Open the next 1:1 with last time's actions. A promise from a 1:1 that quietly dies teaches people that 1:1s change nothing. Keep private notes private.

The [[tool:oneonone]] keeps the rhythm, the agenda, the actions and the history for each person.`,
      analogy: `The stand-up and the board are your dashboards: they show throughput. A 1:1 is the health check that catches the slow leaks no dashboard shows, such as stress, confusion, or a job offer, before they turn into an outage. You would not skip health checks because the dashboard looks green.`,
      mistakes: [
        `Turning the 1:1 into a status meeting about tickets.`,
        `Cancelling it whenever delivery is busy, which is exactly when people need it most.`,
        `Talking for most of it. Aim to listen for at least two thirds of the time.`,
        `"Any issues?" as the only question, and taking "no issues" as the answer.`,
        `Promising something in a 1:1 and forgetting it.`,
        `Never asking about growth, then being surprised by a resignation.`
      ],
      say: [
        `"This is your time. What would you like to talk about first?"`,
        `"What slowed you down this week that you didn't mention in stand-up?"`,
        `"I need to move our 1:1 to Thursday at 3. I don't want to skip it."`,
        `"Last time I promised to get you into the architecture review. Done: it's on Friday."`
      ],
      sources: [
        `Andrew S. Grove, *High Output Management* (Random House, 1983; Vintage, 1995), on the 1:1 as the subordinate's meeting`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on 1:1s for new managers`,
        `Michael Lopp, *Managing Humans* (Apress, 2007), on the update, the vent and the disaster`,
        `Julie Zhuo, *The Making of a Manager* (Portfolio, 2019), on 1:1 questions`
      ],
      related: ['tool:oneonone', 'scenario:first-one-on-ones', 'scenario:cancelled-one-on-ones', 'phrase:oneone-open', 'phrase:oneone-their-agenda', 'phrase:oneone-move-not-cancel', 'term:one-on-one']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'feedback-sbi', track: 'people', minutes: 7,
      title: 'Feedback that lands: situation, behaviour, impact',
      summary: 'Why "you\'re careless" changes nothing and "on Thursday the release went out without the migration" does. The SBI model, asking before telling, and one thing at a time.',
      keywords: ['feedback', 'sbi', 'situation behaviour impact', 'situation behavior impact', 'criticism', 'radical candor', 'give feedback', 'difficult feedback', 'judging words'],
      body: `## Why most feedback bounces
New leads tend to fail at feedback in one of two ways. Some say nothing, to keep the peace; Kim Scott calls this **ruinous empathy**, and it is the most common mistake: the person never learns, and finds out at appraisal time. Others say it as a judgment: *"You're careless," "Your attitude needs to change," "You always miss stand-up."* A judgment attacks who someone is, so they defend themselves instead of hearing what happened.

## Situation, behaviour, impact
The Center for Creative Leadership's **SBI** model keeps feedback about facts:
- **Situation:** one specific moment. *"In Tuesday's stand-up…"*
- **Behaviour:** what they did or said, what a camera would have recorded. *"…you said the payment work would be done soon…"*
- **Impact:** the effect, on the work or on people. *"…and Anil waited two days to start the integration, because he couldn't plan around it."*

Marshall Rosenberg drew the same line between an **observation** ("you joined at 10:20 on Monday and Wednesday") and an **evaluation** ("you're always late"). The observation can be discussed; the evaluation can only be denied.

## Ask, then say what you would like
Lara Hogan adds the step that turns feedback into a conversation: end with **a question or a request**. Ask first, because the reason is often not what you think: *"What makes it hard to give a date?"* Divya may say her last lead shouted at her for a missed date. That changes what you ask for: a range and an early warning, not more pressure. Then say the one visible thing you would like, and agree a day to look at it again.

## The habits around it
- **Private, for a change. Public, for praise.** In front of others, people protect their standing.
- **Soon.** Within days, while you both remember the moment. Feedback saved for the appraisal feels like an ambush.
- **One thing at a time.** Three points at once sounds like a case being built.
- **Not a sandwich.** Praise, criticism, praise teaches people to discount your praise and wait for the "but".
- **To someone senior or older**, the same model works, framed as a request for their view: *"Can I share something I noticed in the review? I'd like your take."*

Scott's summary is two dimensions: **care personally, and challenge directly**. Feedback without care is aggression; care without the challenge is ruinous empathy.

The [[tool:feedback]] checks your words for judging language before you say them.`,
      analogy: `"You're careless" is a failing test with no message: something is wrong, somewhere, good luck. SBI is a failure report with the input, the expected and the actual result, and the line number. Only one of them gets fixed.`,
      mistakes: [
        `Saying nothing to be kind, until the appraisal.`,
        `Labels and absolutes: "careless", "unprofessional", "you always".`,
        `Correcting someone in the stand-up or the team channel.`,
        `Telling before asking, so you fix the wrong problem.`,
        `The feedback sandwich, which buries the message and devalues your praise.`,
        `"Everyone thinks…": feedback you did not see yourself.`
      ],
      say: [
        `"Have you got 15 minutes today? There's something I'd like your view on."`,
        `"In Tuesday's stand-up you said 'soon', and Anil waited two days. What makes it hard to give a date?"`,
        `"What I'd like is a date or a range in each update, and an early warning when it moves. Shall we look at it again in two weeks?"`
      ],
      sources: [
        `Center for Creative Leadership, "Use Situation-Behavior-Impact (SBI) to Understand Intent" and related guides on the SBI model`,
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017), on caring personally, challenging directly, and ruinous empathy`,
        `Marshall B. Rosenberg, *Nonviolent Communication: A Language of Life* (PuddleDancer Press, 2003), on observations and evaluations`,
        `Lara Hogan, *Resilient Management* (A Book Apart, 2019), on the feedback equation: observation, impact, and a question or request`
      ],
      related: ['tool:feedback', 'scenario:vague-updater', 'scenario:harsh-reviewer', 'scenario:feedback-to-older-senior', 'phrase:feedback-specific', 'phrase:feedback-sbi-open', 'term:sbi', 'term:radical-candor', 'term:feedback-sandwich']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'praise-and-credit', track: 'people', minutes: 5,
      title: 'Praise and credit: specific, public, and passed on',
      summary: 'Specific praise tells people what to repeat. Give it in front of the people who matter to them, pass credit to the team when you are praised, and notice the work nobody sees.',
      keywords: ['praise', 'recognition', 'credit', 'thanks', 'appreciation', 'shout-out', 'visibility', 'motivation', 'invisible work'],
      body: `## Why "good job" is not enough
"Good job" feels kind and teaches nothing: it does not say what was good, so nobody knows what to do again. Specific praise uses the same shape as any feedback: the moment, what they did, its effect. *"The rollback script you wrote let us undo Friday's release in two minutes, so customers saw no errors."* Now everyone knows what good looks like.

## Where to give it
- **In front of the people who matter to them:** the team channel, the Sprint Review, their manager or yours. In many Indian companies the appraisal is decided in a room the developer is not in; praise that your manager has already heard is worth more there than praise only the developer heard.
- **Soon**, like all feedback.
- **Written down.** Keep a line in your notes, or the [[tool:feedback]] log. At appraisal time, memory favours the last month and the loudest people.

## Credit flows down
When your manager praises "your" release, pass it on, by name: *"Thank you. Asha and Rahul built the retry logic that made it work."* When something goes wrong, take the responsibility yourself. A lead who takes the credit and passes on the blame loses the team quickly, and the team always finds out.

## Notice the work nobody sees
Code reviews, mentoring a new joiner, fixing a flaky test, calming a client on a late call: work that keeps the team running and never shows on a burn-down. Name it. Teresa Amabile's research found that the thing that most lifts people's day at work is making progress on meaningful work; noticing progress, even small, is part of your job.

## Watch who gets praised
Praise tends to flow to the people who speak most, sit nearest, or share your time zone. Check your log every few weeks: is the quiet developer in it? The offshore half of the team?`,
      analogy: `Specific praise is a log line with context: "retry saved 312 orders during the vendor outage". "Good job" is a log line that says "something happened". Only one of them is useful when you read it back at appraisal time.`,
      mistakes: [
        `Generic praise ("great work, team") that names nobody and nothing.`,
        `Praise only in private, where it cannot help their reputation.`,
        `Accepting credit for the team's work, even by staying silent.`,
        `Praising only visible feature work, never reviews, mentoring or fixes.`,
        `Praise that always flows to the same two people.`
      ],
      say: [
        `"The rollback script you wrote let us undo the release in two minutes. Thank you."`,
        `"Thank you. Asha and Rahul built the retry logic that made it work."`,
        `"Shout-out to Karthik for reviewing eleven pull requests this Sprint, so nobody waited more than a day."`
      ],
      sources: [
        `Teresa Amabile and Steven Kramer, *The Progress Principle* (Harvard Business Review Press, 2011)`,
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017), on specific, sincere praise`,
        `Center for Creative Leadership, on using SBI for positive feedback`
      ],
      related: ['tool:feedback', 'scenario:invisible-work', 'scenario:interesting-work-favouritism', 'phrase:feedback-praise', 'phrase:praise-public-credit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'receiving-feedback', track: 'people', minutes: 5,
      title: 'Asking for feedback as a lead, and taking it well',
      summary: 'Your team will not tell you what you do wrong unless you ask, specifically and often, and react well the first time. How to ask, how to listen, and how to close the loop.',
      keywords: ['receive feedback', 'ask for feedback', 'feedback for you', 'defensive', 'upward feedback', 'skip-level', 'thanks for the feedback', 'triggers'],
      body: `## Why nobody tells you
The moment you became a lead, honest feedback about you got scarce. You now influence people's work, ratings and careers, and in a hierarchical office few people volunteer criticism of their lead. Silence does not mean you are doing well. It usually means nobody has been asked, or the last person who answered regretted it.

## Ask, specifically and often
"Any feedback for me?" gets "No, all good." Ask a question that assumes there is an answer:
- *"What's one thing I could do differently that would help you?"*
- *"Was there a decision I made this month that didn't make sense to you?"*
- *"What do I do that slows you down?"*

Ask in 1:1s, not in a group, and expect the first answers to be small. They are a test of how you react.

## Three triggers
Douglas Stone and Sheila Heen describe three reasons feedback stings: **truth triggers** (it seems wrong), **relationship triggers** (who is saying it, or how), and **identity triggers** (it shakes how you see yourself: "I am a fair lead"). Notice which one fired, and set it aside long enough to understand the point.

## When you hear it
1. **Thank them.** Every time, especially when it hurts. "Thanks for telling me" is the most important sentence; it decides whether you hear anything again.
2. **Ask for an example**, to understand, not to argue: *"Can you give me an example, so I see it the way you did?"*
3. **Do not defend or explain** in the moment. You can decide later what to do with it.
4. **Close the loop:** *"Last month you said I re-review your decisions. I've stopped; tell me if you still see it."* People keep giving feedback that visibly changes something.

## Other channels
Your manager can hold **skip-level** 1:1s with your team; anonymous team surveys catch what nobody will say to your face. Welcome both; do not try to find out who said what.`,
      analogy: `Feedback about you is a bug report from production. Arguing with the reporter does not fix the bug, and it stops anyone filing the next one. Asking for steps to reproduce it does both jobs.`,
      mistakes: [
        `"Any feedback for me?" as the only question.`,
        `Explaining why they are wrong in the same conversation.`,
        `Asking in a team meeting, where nobody will criticise the lead.`,
        `Trying to find out who wrote something in an anonymous survey.`,
        `Never saying what you changed, so people conclude it was pointless.`
      ],
      say: [
        `"What's one thing I could do differently that would help you?"`,
        `"Thanks for telling me. Can you give me an example, so I understand?"`,
        `"You told me I cut people off in design reviews. I've been working on it; tell me if you still see it."`
      ],
      sources: [
        `Douglas Stone and Sheila Heen, *Thanks for the Feedback: The Science and Art of Receiving Feedback Well* (Viking, 2014)`,
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017), on asking for criticism before giving it`,
        `Amy C. Edmondson, *The Fearless Organization* (Wiley, 2018)`
      ],
      related: ['scenario:you-dont-trust-me', 'scenario:peer-wanted-the-role', 'phrase:feedback-receive', 'term:skip-level']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'delegation-levels', track: 'people', minutes: 7,
      title: 'Delegating: an outcome, a level, and check-ins',
      summary: 'What to delegate, how to hand it over as a result instead of an activity, how much the person decides (seven levels), and check-ins that support without hovering.',
      keywords: ['delegate', 'delegation', 'delegation levels', 'delegation poker', 'monkey', 'hand over', 'ownership', 'micromanage', 'check-in', 'brief'],
      body: `## Why new leads hold on
"It's faster if I do it myself" is true once and false every time after. A lead who keeps the hard work becomes the bottleneck, the team stops learning, and the lead's own job (planning, people, the next quarter) does not get done. William Oncken and Donald Wass described the trap in 1974 as **"who's got the monkey?"**: every time someone brings you a problem and you say "let me look into it", the monkey jumps onto your back.

## What to delegate
Not only the boring work. Delegate what will **grow someone**: a bug in an area they want to learn, a design they can own, a client call they are ready for. Keep only what truly needs you, and say why.

## The brief: a result, not an activity
"Can you look into the GST bug?" hands over an activity that never ends. A brief hands over a result:
- **Done means:** *"multi-state invoices total correctly, with tests, deployed to staging."*
- **By when**, and **why them**.
- **Help:** a walkthrough, a person to ask, a document.
- **What to tell you straight away**, such as "if the fix needs a change to the invoice format".

## Seven levels of authority
Jurgen Appelo's point is that delegation is not "I decide" or "you decide", but seven steps between: **1 Tell, 2 Sell, 3 Consult, 4 Agree, 5 Advise, 6 Inquire, 7 Delegate**. Most delegation goes wrong on an unspoken level: they thought it was theirs to decide, you expected to be asked. Say it: *"You decide the fix; tell me what you chose (6). Changing the invoice format is my call after hearing you (3)."* The level can differ for each decision inside the same task.

## Match the level to the task, not the title
A senior developer new to the invoice service needs a lower level on that work than a junior who wrote it. See [[explainer:situational-leadership]]. Start lower and raise the level as they show they can.

## Check-ins, agreed up front
A check-in you both planned is support. One you call because you got nervous feels like distrust. Agree the rhythm in the brief: every two days for new work, weekly for familiar work, once halfway for an expert. When it goes wrong, ask questions (*"What would you try next? What do you need?"*); do not take it back. Taking it back teaches the person, and everyone watching, that delegation from you is temporary.

The [[tool:delegate]] writes the brief, with the level and the check-in dates.`,
      analogy: `Delegating without a level is calling an API with no contract: the caller thinks the callee validates the input, the callee thinks the caller did. Both are surprised in production. The delegation level is the contract, and the check-ins are the integration tests you agreed on before shipping.`,
      mistakes: [
        `Keeping every hard task because it is faster this time.`,
        `"Look into it": an activity with no finish line.`,
        `An unspoken level, so they decide something you expected to be asked about, or wait for permission they already had.`,
        `Sink or swim: level 7 on work they have never done.`,
        `Hovering: unplanned check-ins and re-reviewing every decision.`,
        `Taking the work back when it gets hard.`
      ],
      say: [
        `"Can you own the GST bug? Done means multi-state invoices total correctly, with tests, by Friday."`,
        `"You decide the fix; tell me what you chose and why. The invoice format is my call, after hearing your view."`,
        `"Let's check in on Wednesday and Friday, 15 minutes each. Tell me straight away if you're stuck for more than half a day."`
      ],
      sources: [
        `Jurgen Appelo, *Management 3.0: Leading Agile Developers, Developing Agile Leaders* (Addison-Wesley, 2011), and *Managing for Happiness* (Wiley, 2016), on the seven delegation levels, delegation poker and delegation boards`,
        `William Oncken Jr. and Donald L. Wass, "Management Time: Who's Got the Monkey?", *Harvard Business Review*, November–December 1974`,
        `Paul Hersey and Kenneth H. Blanchard, "Life cycle theory of leadership", *Training and Development Journal* 23(5), 1969`
      ],
      related: ['tool:delegate', 'explainer:situational-leadership', 'scenario:doing-it-myself', 'scenario:delegated-task-wrong', 'scenario:you-dont-trust-me', 'phrase:delegate-outcome', 'phrase:delegate-level', 'phrase:delegate-no-rescue', 'term:delegation-levels']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'psychological-safety', track: 'people', minutes: 6,
      title: 'Psychological safety: a team that says "I\'m stuck"',
      summary: 'What psychological safety is (and is not), why Google found it mattered most, and the everyday things a lead does that make it safe to ask, disagree and admit a mistake.',
      keywords: ['psychological safety', 'safe', 'speak up', 'blameless', 'mistakes', 'edmondson', 'project aristotle', 'fear', 'trust', 'learning'],
      body: `## What it is
Amy Edmondson defined **psychological safety** in 1999 as a shared belief that the team is safe for interpersonal risk-taking: that you will not be embarrassed or punished for asking a question, admitting a mistake, raising a concern or offering an idea. In her studies of hospital teams, the better teams *reported more* errors, not fewer, because people felt safe saying so.

When Google studied what made its teams effective (Project Aristotle, published in 2015), psychological safety came out as the most important of five factors, ahead of dependability, clear structure, meaning and impact.

## What it is not
It is not being nice, and it is not low standards. Edmondson draws a 2 x 2: high standards with low safety gives an **anxiety** zone (people hide problems); low standards with high safety gives a **comfort** zone; you want **high standards and high safety**, where people stretch and learn because failure is discussable.

## Why it is harder here
In many Indian workplaces, a junior questioning a senior can feel disrespectful, "yes" can mean "I heard you", and admitting you are stuck can feel like admitting you are not good enough. Silence is the default. The lead has to make speaking up visibly safe, repeatedly, before people believe it.

## What a lead does, every week
- **Frame work as learning:** *"This is new for all of us; we'll get things wrong, and I want to hear about them early."*
- **Show your own fallibility:** *"I might be missing something. What am I not seeing?"*
- **Ask specific questions** instead of "Any questions?": *"What's the part of this you're least sure about?"*
- **Speak last** in design discussions and estimates, so your view does not anchor everyone else's.
- **React well to bad news.** Thank the person who raises it. The first reaction to a mistake decides whether you hear about the next one.
- **Run blameless incident reviews:** ask what made the mistake easy to make, not who made it.`,
      analogy: `Psychological safety is the team's error-reporting pipeline. If logging an error gets you punished, people swallow exceptions: the system looks healthy right up until it crashes. A blameless review is the team keeping its logs on.`,
      mistakes: [
        `Asking "Any questions?" and taking silence as agreement.`,
        `Blaming a person in an incident review.`,
        `Giving your opinion first, then asking what others think.`,
        `Shooting the messenger: irritation when someone brings bad news.`,
        `Confusing safety with comfort and lowering the bar.`
      ],
      say: [
        `"What's the part of this you're least sure about?"`,
        `"Thank you for raising it now. It's much cheaper today than next week."`,
        `"What made this easy to get wrong? Let's fix that, not look for a person."`
      ],
      sources: [
        `Amy C. Edmondson, "Psychological safety and learning behavior in work teams", *Administrative Science Quarterly* 44(2), 1999`,
        `Amy C. Edmondson, *The Fearless Organization* (Wiley, 2018)`,
        `Google re:Work, "Guide: Understand team effectiveness" (Project Aristotle), 2015`
      ],
      related: ['scenario:junior-broke-production', 'scenario:quiet-junior', 'scenario:retro-silent', 'explainer:tuckman', 'phrase:care-mistake-blameless', 'phrase:care-safe-say', 'term:psychological-safety']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'growth-conversations', track: 'people', minutes: 6,
      title: 'Career conversations and growth plans',
      summary: 'People want to know where they are going. How to have a career conversation, write a simple growth plan, use stretch work, and talk about promotions without promising what you do not control.',
      keywords: ['career', 'growth', 'promotion', 'growth plan', 'idp', 'development plan', 'career ladder', 'stretch', 'appraisal', 'motivation'],
      body: `## Why it matters
People leave when they stop seeing a future where they are. In Indian IT, where a job change often brings a bigger raise than an appraisal, a developer who cannot see their next step will find one elsewhere. Career conversations are not a perk; they are how you keep good people and grow the team you need next year.

## Have the real conversation
Kim Scott describes a career conversation in three parts, over a few 1:1s:
1. **Their story:** what made them choose this work, and what they valued in past jobs.
2. **Their dreams:** where they would love to be at the peak of their career, whatever that is.
3. **The next 18 months:** what they could learn and do now that moves them towards it.

Not everyone wants to climb. Scott distinguishes people on a steep growth path from those who want to go deep and steady in what they do well. Both are valuable; the mistake is to treat the steady expert as a problem or to push everyone towards management.

## A simple growth plan
One page, written together:
- **One or two goals**, in their words: *"Lead a feature end to end by March."*
- **The work that builds them:** a stretch assignment, a design to own, a talk, a mentor.
- **How you will both know** it is working, and when you will look at it again.

Daniel Pink's three motivators, **autonomy, mastery and purpose**, are a useful check: does the plan give them more say, a skill to get better at, and a reason that matters?

## Promotions, honestly
- **Do not promise what you do not control.** "You'll be promoted in April" turns into a broken promise when the budget or the bell curve says no.
- **Show the ladder:** what the next level does that this one does not, with examples.
- **Collect evidence through the year**, not in the week before appraisal.
- **Explain the process** plainly, including forced ratings if your company uses them. People cope with an honest "not this cycle, and here's why" far better than a vague one.`,
      analogy: `A growth plan is a roadmap for a person: a target state, the next milestone, and the work that gets there. Without one, growth is like "we'll refactor it someday": everyone agrees, and nothing happens.`,
      mistakes: [
        `Never asking about careers until someone resigns.`,
        `Promising a promotion or a date you do not control.`,
        `Assuming everyone wants to become a manager.`,
        `A growth plan nobody looks at again.`,
        `Giving the stretch work to the same person every time.`
      ],
      say: [
        `"Where would you like to be in a year, or in five? Not what you think I want to hear."`,
        `"I can't promise a date, but I can show you what the next level looks like, and help you get there. Shall we write it down?"`,
        `"This design is a stretch for you, and that's why I'd like you to own it."`
      ],
      sources: [
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017), on career conversations and on steep and steady growth paths`,
        `Daniel H. Pink, *Drive: The Surprising Truth About What Motivates Us* (Riverhead, 2009)`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on career growth for engineers`
      ],
      related: ['scenario:when-will-i-be-promoted', 'scenario:interesting-work-favouritism', 'tool:oneonone', 'phrase:care-promotion', 'term:career-ladder', 'term:growth-plan']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'struggling-performer', track: 'people', minutes: 7,
      title: 'Helping someone who is struggling',
      summary: 'Missed commitments and slow work have many causes. Find out which before you act: skill, will or circumstances. Then clear expectations, a plan with support and dates, and honesty if it does not work.',
      keywords: ['underperformance', 'struggling', 'performance', 'low performer', 'pip', 'performance improvement plan', 'missed deadlines', 'support', 'set up to fail'],
      body: `## Diagnose before you act
When someone keeps missing commitments, the cause is usually one of three:
- **Skill:** they do not know how. The work is new, or harder than it looked.
- **Will:** they know how, but are not motivated: bored, overlooked, unhappy with the work or the team.
- **Circumstances:** something else entirely. Unclear expectations, a task that changed under them, too many interruptions, a health problem, a family situation.

Each needs a different response: teaching, a conversation about motivation, or removing the obstacle. Pressure fixes none of them.

## Check yourself first
Jean-François Manzoni and Jean-Louis Barsoux described the **set-up-to-fail syndrome**: a manager decides someone is weak, watches them more closely, gives them less interesting work and less room, and the person, feeling it, withdraws and performs worse, which seems to confirm the judgment. Before you act, ask: were my expectations clear? Did I give them the same support and the same kind of work as others?

## Have the conversation early
Not at appraisal time. Privately, with specific examples (the dates, the commitments, the effect), and a real question: *"Three of the last four tasks went past their dates. What's getting in the way?"* Then listen. The answer often changes the plan.

## Agree a plan, in writing
- **What good looks like**, concretely: *"Each task estimated with a range, and a warning the day it will slip."*
- **The support you will give:** pairing, a clearer task breakdown, fewer interruptions, time off.
- **Dates to look at it together**, weekly at first.

Write it down and share it, so you both have the same version.

## If it does not improve
Talk to your manager and HR early, before anything formal. A **performance improvement plan (PIP)** is a later, formal step with set goals and a deadline. In many Indian companies a PIP is seen as the first step out of the door, so use it only when you have genuinely tried support first, and make its goals achievable. Fairness matters beyond this person: the team is watching how you treat someone who struggles.`,
      analogy: `A failing service can mean bad code, bad configuration or a bad dependency. Restarting it harder fixes none of them; reading the logs tells you which one it is. Asking "what's getting in the way?" is reading the logs.`,
      mistakes: [
        `Waiting for the appraisal to raise it.`,
        `Assuming it is laziness without asking.`,
        `Watching more and helping less: the set-up-to-fail spiral.`,
        `A plan with no dates and no support, only expectations.`,
        `Jumping to a formal PIP as the first step.`
      ],
      say: [
        `"Three of the last four tasks went past their dates. What's getting in the way?"`,
        `"Here's what good looks like, here's the help I'll give, and let's look at it together every Friday for a month."`,
        `"I want this to work. If it's the wrong kind of work for you, tell me; we can look at that too."`
      ],
      sources: [
        `Jean-François Manzoni and Jean-Louis Barsoux, "The Set-Up-to-Fail Syndrome", *Harvard Business Review*, March–April 1998`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on handling underperformance`,
        `Kim Scott, *Radical Candor* (St. Martin's Press, 2017)`
      ],
      related: ['scenario:missed-commitments', 'scenario:working-late-every-night', 'scenario:vague-updater', 'tool:oneonone', 'tool:feedback', 'term:pip']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'hard-conversations', track: 'people', minutes: 6,
      title: 'Hard conversations: conflict, bad news and emotions',
      summary: 'A rating someone will not like, two developers in a personal fight, a person in tears. How to prepare, how to open, what to do with emotions, and how to end with a next step.',
      keywords: ['difficult conversation', 'hard conversation', 'conflict', 'bad news', 'emotions', 'crucial conversations', 'rating', 'mediation', 'disagreement'],
      body: `## Three conversations in one
Douglas Stone, Bruce Patton and Sheila Heen found that every difficult conversation is really three:
- **What happened:** who is right, who meant what, whose fault it is.
- **Feelings:** which nobody says, but which drive everything.
- **Identity:** what this says about me. Am I competent, fair, a good person?

Most people argue only the first. The conversation moves when you acknowledge the other two.

## Prepare
Write down your purpose (what a good outcome is for both of you), the facts, and their likely side of it. Separate **intent from impact**: what they did may have hurt without being meant to, and you do not know their intent.

## Open well
- **Bad news first, plainly**, in the first two sentences: *"Your rating this cycle is 'meets expectations'. I want to explain why, and what 'exceeds' would take."* Long warm-ups make people anxious and confuse the message.
- **A shared purpose** for conflict: *"You both want the design to be right."*
- **Contrast** when you might be misread (from *Crucial Conversations*): *"I don't want you to think I'm unhappy with your work. I do want to talk about how reviews feel to the juniors."*

## When feelings show up
Pause. Acknowledge what you see: *"This is clearly frustrating."* Do not rush to fix it or argue with it. Offer a break if needed. Silence is fine.

## Conflict between two people
Talk to each one separately first, to understand. Then together, about the problem, not the people: put both options and their trade-offs on one page, agree **how** you will decide and by when, and write the decision down. If the conflict is personal, name the behaviour you need from both, the same for both.

## End with a next step
Every hard conversation ends with what happens now: who does what, by when, and when you will talk again.`,
      analogy: `A hard conversation is an incident call. Stay calm, establish the facts, separate the symptom from the cause, agree the next action, and leave the blame out: it never fixed an outage, and it will not fix this either.`,
      mistakes: [
        `Avoiding it, and hoping it resolves itself.`,
        `Burying the bad news under five minutes of small talk.`,
        `Arguing about what happened and ignoring how people feel.`,
        `Telling two people in conflict to "sort it out between yourselves".`,
        `Ending with no next step.`
      ],
      say: [
        `"Your rating this cycle is 'meets expectations'. Let me explain why, and what 'exceeds' would take."`,
        `"You both want the design to be right. Let's put both options on one page and decide by Thursday."`,
        `"This is clearly frustrating. Take your time."`
      ],
      sources: [
        `Douglas Stone, Bruce Patton and Sheila Heen, *Difficult Conversations: How to Discuss What Matters Most* (Viking, 1999)`,
        `Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler, *Crucial Conversations: Tools for Talking When Stakes Are High* (McGraw-Hill, 2002)`
      ],
      related: ['scenario:design-argument', 'scenario:rating-conversation', 'scenario:harsh-reviewer', 'scenario:peer-wanted-the-role', 'phrase:care-conflict', 'phrase:care-rating']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'onboarding-offboarding', track: 'people', minutes: 6,
      title: 'People joining, people leaving',
      summary: 'The first weeks decide how a new joiner sees the team; the last weeks decide what you lose when someone leaves. Ready on day one, a first change in week one, and handover by doing.',
      keywords: ['onboarding', 'offboarding', 'new joiner', 'resignation', 'notice period', 'knowledge transfer', 'kt', 'bus factor', 'buddy', 'handover', 'leaving'],
      body: `## Joining: the first week teaches how the team works
A new joiner learns more from what happens in their first week than from any document. No laptop, no access and three days of reading tells them the team is disorganised. A buddy, a working setup and a small real change shipped by Friday tells them they matter and can contribute here.
- **Ready before day one:** laptop, accounts, access requests (some take days), a buddy with time set aside, a calendar for the first two weeks.
- **You meet them first** on day one; HR covers the company, you cover the team.
- **A small, real change in week one.** It builds confidence and tests every step of your setup; whatever breaks is a bug in your onboarding, not in them.
- **Goals in writing at day 30** for day 60 and day 90, so the probation review surprises nobody.
- **Ask what was confusing.** A new joiner sees the gaps in your documentation that everyone else has stopped seeing; ask them to fix one while it is fresh.

## Leaving: three things at stake
When someone resigns (and in India, notice periods of 30 to 90 days are common), three things are at stake: **what only they know**, **the team's confidence**, and **the person**, who may work with you again or send you their friends.
- **Listen first.** Thank them for telling you, ask why, and do not argue, guilt-trip or freeze them out.
- **Counter-offers** are your manager's and HR's call, and rarely fix why someone is leaving.
- **Tell the team early**, with them, and with a plan.
- **Hand over by doing.** List what only they know; the new owner does the work while the leaver watches, weeks before the last day. Documents written in the last two days are rarely read.
- **Say a good goodbye**, specifically, in front of the team.

The **bus factor** (how many people could leave before work stalls) is a risk to track before anyone resigns: pair, rotate and document so that no area lives in one head.

The [[playbook:onboarding]] and [[playbook:offboarding]] playbooks date every step from the days you enter.`,
      analogy: `Onboarding is the team's install script, and every new joiner is a fresh machine that tests it: whatever fails is a bug in the script. Offboarding is decommissioning a server: you move the traffic to the new one and watch it run before you pull the plug, not after.`,
      mistakes: [
        `Nothing ready on day one.`,
        `No buddy, or a buddy with no time for it.`,
        `Treating a resignation as betrayal.`,
        `Knowledge transfer as a pile of documents in the last week.`,
        `Letting the team hear about a departure from the rumour mill.`
      ],
      say: [
        `"By Friday I'd like you to have one small change in production, with Divya. That's all we expect this week."`,
        `"Thank you for telling me first. Can I ask what made you decide?"`,
        `"For the next three weeks, Asha runs the month-end job and you watch. Correct her, don't take over."`
      ],
      sources: [
        `Talya N. Bauer, *Onboarding New Employees: Maximizing Success* (SHRM Foundation, 2010)`,
        `Google re:Work, "Help new employees succeed", on Google's onboarding checklist for managers`,
        `Michael D. Watkins, *The First 90 Days*, updated and expanded edition (Harvard Business Review Press, 2013)`,
        `Camille Fournier, *The Manager's Path* (O'Reilly, 2017), on managing departures`
      ],
      related: ['playbook:onboarding', 'playbook:offboarding', 'scenario:new-joiner-nothing-ready', 'scenario:star-resigns', 'scenario:key-person-resigns', 'phrase:care-resignation', 'term:bus-factor', 'term:knowledge-transfer', 'term:notice-period']
    }
  );
})(window.LELT);
