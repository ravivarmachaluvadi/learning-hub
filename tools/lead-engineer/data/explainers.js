/*
 * explainers.js - ideas you understand faster by moving something and watching what happens.
 * Each has a picture you can change, drawn by js/views/explainers/<track>.js, which registers
 * LELT.explainers[id] = {render(container)}.
 *
 *   {id, track, title, summary, keywords, intro (Markdown, above the picture),
 *    after (Markdown, below it: what it means for a lead), sources: [Markdown], related: ['tool:id', ...]}
 */
(function (U) {
  'use strict';
  U.data.explainers = U.data.explainers || [];
  U.data.explainers.push(

    {
      id: 'cone-of-uncertainty', track: 'pm',
      title: 'The cone of uncertainty',
      summary: 'Why an early estimate can be off by four times either way, and what actually narrows the range.',
      keywords: ['cone', 'cone of uncertainty', 'estimate', 'range', 'early estimate', 'mcconnell', 'boehm', 'uncertainty'],
      intro: `At the very start of a project, even a skilled estimate can be off by a factor of four in either direction: the real effort can land anywhere from a quarter to four times the number. As decisions get made (what to build, how it looks, how it works), the range narrows. Drawn over time, the range looks like a cone lying on its side.

Barry Boehm described the pattern in 1981; Steve McConnell named it and made it famous. Pick a phase and an estimate, and see the range a careful estimator should give at that point.`,
      after: `## What it means for you as a lead
- **Early estimates are ranges, and wide ones.** A single number at the idea stage claims a precision nobody has. "6 to 24 weeks, most likely about 10" is honest; "10 weeks" is a guess dressed up as a fact.
- **The cone does not narrow by itself.** It narrows when decisions are made: scope agreed, design reviewed, a spike done. If nothing has been decided, an estimate made a month later is as uncertain as the first one.
- **Say when the range will narrow, and why.** *"After the design review on Thu 12 Nov I can give you a range within 25%."* That turns uncertainty into a plan.
- **The cone is the best case.** McConnell's point is that skilled estimators can do this well; teams that don't break the work down do worse.

## A caution about the numbers
The exact multipliers (4x, 2x, 1.5x...) come from a small number of studies, and Laurent Bossavit argues the evidence behind them is thinner than often claimed. Treat the cone as a shape to remember, not a law to quote.`,
      sources: [
        `Steve McConnell, *Software Estimation: Demystifying the Black Art* (Microsoft Press, 2006), chapter 4, the source of the ranges used here`,
        `Barry Boehm, *Software Engineering Economics* (Prentice Hall, 1981)`,
        `Construx (McConnell's company), "The Cone of Uncertainty"`,
        `Laurent Bossavit, *The Leprechauns of Software Engineering* (Leanpub), chapter 2, a critique of the evidence`
      ],
      related: ['tool:estimate', 'scenario:estimate-from-one-line', 'lesson:estimate-target-commitment', 'term:cone-of-uncertainty']
    },

    {
      id: 'iron-triangle', track: 'pm',
      title: 'The iron triangle: scope, date, people',
      summary: 'Fix all three corners and something else gives: usually quality, quietly. Find the lever before you agree.',
      keywords: ['iron triangle', 'triple constraint', 'scope', 'time', 'cost', 'resources', 'quality', 'trade-off', 'fixed date', 'fixed scope'],
      intro: `Every project trades three things: **scope** (what you build), **the date**, and **people** (the team, or the money that pays for it). Quality sits in the middle. Change one corner and at least one other has to move. Fix all three, and the only thing left to give is quality: fewer tests, skipped reviews, shortcuts nobody writes down.

The idea is usually credited to Martin Barnes, a British project manager, in 1969. Mark each corner as fixed or flexible and read what follows.`,
      after: `## What it means for you as a lead
- **When someone fixes the date and the scope, ask which corner can move.** Out loud, early, and without drama: *"With the date and the scope both fixed, what gives is testing. I don't recommend that. Which of these can move?"*
- **Scope is usually the cheapest lever.** A smaller first slice by the date, and the rest after, keeps the date and the quality. Agile methods such as DSDM fix time and people and let scope flex on purpose.
- **People is the most expensive lever, and the slowest.** New people take weeks to help and slow the team meanwhile: see [[explainer:brooks-law]].
- **Quality is not a corner you trade openly.** If it is the only thing left to give, say so, so that whoever decides does it knowingly.

The [[tool:deadline]] turns this into a reply with options.`,
      sources: [
        `Martin Barnes, *Time and Cost in Contract Control* (course, 1969), commonly credited as the origin of the triangle`,
        `Project Management Institute, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)*, on competing constraints`,
        `Agile Business Consortium, *DSDM Agile Project Framework*, the chapter on MoSCoW prioritisation: fix time and people, let scope flex`
      ],
      related: ['tool:deadline', 'scenario:fixed-regulatory-date', 'scenario:one-week-ask', 'term:iron-triangle']
    },

    {
      id: 'brooks-law', track: 'pm',
      title: 'Brooks\'s law: why more people can make it later',
      summary: 'Every person you add means more pairs to keep in sync, and time spent teaching. See the paths grow and the date move.',
      keywords: ['brooks', 'brooks law', 'mythical man-month', 'more people', 'add people', 'communication paths', 'team size', 'late project'],
      intro: `In 1975 Fred Brooks, who had managed IBM's OS/360 project, wrote: *"Oversimplifying outrageously, we state Brooks's Law: Adding manpower to a late software project makes it later."*

Two reasons. New people need time before they help, and that time comes from the people who must teach them. And every person added means more people to keep in sync: a team of **n** people has **n(n − 1) / 2** pairs who may need to talk. Drag the slider to see the pairs grow.`,
      after: `## What it means for you as a lead
- **When someone offers more people late, say what it costs and when they would help.** *"Three more people would take about three weeks to get up to speed, and slow us down meanwhile. They'd help the next release; for this one, cutting scope gets us there sooner."*
- **Early, and on work that splits cleanly, more people do help.** A separate component with a clear interface is a good first task for newcomers. A tangled change in the middle of the system is not.
- **Better ways to speed up a late project:** cut or reorder scope, remove distractions from the current team (on-call, other projects), and unblock waiting on other teams.
- **The model here is generous.** It assumes newcomers work at full speed after ramp-up, and ignores the extra coordination. Real projects usually do worse.

The [[tool:deadline]] uses the same model for its "more people" option.`,
      sources: [
        `Frederick P. Brooks Jr., *The Mythical Man-Month: Essays on Software Engineering* (Addison-Wesley, 1975; anniversary edition 1995), chapter 2, "The Mythical Man-Month"`
      ],
      related: ['scenario:more-people-late', 'tool:deadline', 'explainer:iron-triangle', 'term:brooks-law']
    },

    {
      id: 'monte-carlo', track: 'pm',
      title: 'A Monte Carlo estimate, one roll at a time',
      summary: 'Play a small project hundreds of times with realistic random durations, and watch P50 and P85 appear.',
      keywords: ['monte carlo', 'simulation', 'p50', 'p85', 'percentile', 'probabilistic', 'forecast', 'estimate', 'pert', 'three-point'],
      intro: `A Monte Carlo estimate plays the project many times. In each play, every task takes a random but realistic time: somewhere between its best and worst case, most often near its likely value. Add the tasks up and you have one possible project. Do it thousands of times and count: by which day did half the plays finish (**P50**)? By which day did 85% finish (**P85**)?

Below are three tasks, in days. Roll once to see one possible project; then roll a hundred, then ten thousand, and watch the shape appear.`,
      after: `## Reading the result
- **P50 is a coin flip.** Half the simulated projects finished later. Share it as "most likely", never as the promise.
- **P85 is a date you can plan on.** Most teams commit to P85 or P90 and say so: *"I'd plan on 18 November; it could be as early as the 12th."*
- **The total is later than the sum of the likely values.** The likely values here add up to 11 days, yet P50 is about 12 and P85 about 14.5. Tasks rarely finish much early, but they can finish very late, and those long tails add up. This is why adding up "most likely" numbers produces plans that are almost always late.
- **It is only as good as the task list.** A forgotten task, such as testing or waiting on another team, is missing from every one of the 10,000 plays. The breakdown matters more than the maths.

The [[tool:estimate]] runs the same simulation on your own tasks, with a fixed seed so the same input gives the same answer.`,
      sources: [
        `Troy Magennis, *Forecasting and Simulating Software Development Projects* (Focused Objective, 2011)`,
        `Daniel S. Vacanti, *When Will It Be Done? Lean-Agile Forecasting to Answer Your Customers' Most Important Question* (ActionableAgile Press, 2020)`,
        `D. G. Malcolm, J. H. Roseboom, C. E. Clark and W. Fazar, "Application of a technique for research and development program evaluation", *Operations Research* 7(5), 1959: the original PERT paper`
      ],
      related: ['tool:estimate', 'lesson:why-estimate', 'scenario:estimate-becomes-commitment', 'term:monte-carlo']
    },

    {
      id: 'burn-down', track: 'pm',
      title: 'Reading a burn-down chart',
      summary: 'Five shapes a Sprint burn-down takes, what each usually means, and the question to ask at the next stand-up.',
      keywords: ['burn-down', 'burndown', 'burn down', 'chart', 'sprint', 'progress', 'burn-up', 'scope change', 'flat line'],
      intro: `A burn-down chart shows the work left in a Sprint, day by day. The straight line is the ideal pace: the same amount finished every day, reaching zero on the last day. Nobody follows it exactly, and that is fine. The shape of the real line is what tells you something.

Pick a pattern to see what it usually means and what to ask.`,
      after: `## How to use it
- **A burn-down shows that something is off, not what.** Use it to ask a better question at the stand-up, not to give an answer.
- **Look at it on day 3 or 4, not day 9.** A problem you see early still has options: split a story, swap one out with the Product Owner, unblock a review.
- **Never use it to judge people.** If the line becomes a target, people close tickets early and split work to make the line look good, and the chart stops telling the truth (Goodhart's law).
- **When scope changes a lot, a burn-up is clearer.** It draws the work done and the total scope as two lines, so added work is visible instead of hidden.

The 2020 Scrum Guide mentions burn-downs only as one of several ways to forecast progress; it does not require them.`,
      sources: [
        `[The Scrum Guide, November 2020](https://scrumguides.org/scrum-guide.html), Ken Schwaber and Jeff Sutherland: burn-downs, burn-ups and cumulative flow as forecasting practices`,
        `Mike Cohn, *Agile Estimating and Planning* (Prentice Hall, 2005), on release and iteration burn-down charts`
      ],
      related: ['lesson:points-velocity', 'scenario:flat-burndown', 'scenario:interruptions-eat-sprint', 'term:burn-down', 'term:burn-up']
    },

    /* ---------- batch 4: people ---------- */
    {
      id: 'tuckman', track: 'people',
      title: 'How teams form: Tuckman\'s stages',
      summary: 'Forming, storming, norming, performing, adjourning: what each stage looks like, what the team needs from you, and why a new joiner sends a team back to the start.',
      keywords: ['tuckman', 'forming storming norming performing', 'team stages', 'team development', 'storming', 'new team', 'team formation', 'adjourning'],
      intro: `In 1965 the psychologist Bruce Tuckman read about fifty studies of small groups and saw the same pattern: groups go through stages before they work well together. He named four: **forming, storming, norming, performing**. In 1977, with Mary Ann Jensen, he added a fifth, **adjourning**, for when the group breaks up.

The stages matter to a lead because each one needs something different from you: direction at first, then help with conflict, then room. Pick a stage, step through them, and see what happens when someone joins.`,
      after: `## What it means for you as a lead
- **Storming is not failure.** Arguments about how to review code or who decides the design mean people care enough to disagree. Your job is to keep the conflict about the work, not the people, and to turn the agreements into a written working agreement.
- **Change the team and you go back to forming.** A new joiner, a person leaving, a new lead (you, perhaps), a merger with another team. A strong team moves through the stages faster, but it still moves through them. Plan for a slower Sprint after a big change.
- **Lead differently in each stage.** Direct when people are new and unsure; facilitate when they disagree; step back when they perform. The [[explainer:situational-leadership]] explainer is the same idea for one person and one task.
- **Say the stage out loud.** "We're in the storming bit, and that's normal" takes the heat out of a hard retro.

## A caution
Tuckman's model came from reviewing studies, mostly of therapy and training groups, not from measuring work teams. Real teams do not always follow the stages in order, and Connie Gersick's research on project teams found a different pattern: long stable periods with one big shift around the halfway point of their deadline. Use the stages as a vocabulary, not a timetable.`,
      sources: [
        `Bruce W. Tuckman, "Developmental sequence in small groups", *Psychological Bulletin* 63(6), 1965`,
        `Bruce W. Tuckman and Mary Ann C. Jensen, "Stages of small-group development revisited", *Group & Organization Studies* 2(4), 1977, which added adjourning`,
        `Connie J. G. Gersick, "Time and transition in work teams: toward a new model of group development", *Academy of Management Journal* 31(1), 1988`
      ],
      related: ['scenario:merged-team-storming', 'lesson:psychological-safety', 'term:working-agreement', 'term:tuckman', 'playbook:onboarding']
    },

    {
      id: 'situational-leadership', track: 'people',
      title: 'Situational leadership: one person, one task',
      summary: 'Set someone\'s competence and commitment for one task and see the style that fits: directing, coaching, supporting or delegating, and the delegation level that matches.',
      keywords: ['situational leadership', 'hersey blanchard', 'slii', 'leadership style', 'directing', 'coaching', 'supporting', 'delegating', 'competence', 'commitment', 'development level'],
      intro: `Paul Hersey and Ken Blanchard argued in 1969 that there is no single best way to lead: the right style depends on the person **and the task**. Blanchard's later version (SLII) describes a person's "development level" on a task by two things, their **competence** (can they do it?) and their **commitment** (confidence and motivation: do they want to, and do they believe they can?). Each level calls for a different mix of direction and support.

The key word is *task*. Your strongest backend developer may need clear direction the first time they lead a client call. Move the two sliders for one person and one task.`,
      after: `## What it means for you as a lead
- **Diagnose the task, not the person.** "Anil is senior, so I'll leave him alone" fails when the task is new to him. Ask: has this person done *this* before, and do they feel ready for it?
- **The dip is normal.** People who are new and keen (D1) often lose confidence once they see how hard the work is (D2). That is the moment for more support, not less: explain why, encourage, and keep giving direction.
- **Over-supervising is as costly as under-supervising.** Directing an expert feels like distrust; delegating to a beginner feels like being thrown in. Both are common, and the [[tool:delegate]] flags them.
- **Tell them which style you are using, and why.** "This is new for you, so I'll be quite hands-on this week, and step back as it gets familiar." People accept close support much better when they know it is temporary.

The delegation levels shown here are a rough match from this tool to Jurgen Appelo's seven levels; they are not part of Hersey and Blanchard's model.

## A caution
Situational leadership is widely taught and easy to use, but the research behind it is mixed: a 2009 study by Gregory Thompson and Robert Vecchio, for example, found only partial support for its predictions. Treat it as a useful habit of asking "what does this person need for this task?", not as a law.`,
      sources: [
        `Paul Hersey and Kenneth H. Blanchard, "Life cycle theory of leadership", *Training and Development Journal* 23(5), 1969`,
        `Ken Blanchard, Patricia Zigarmi and Drea Zigarmi, *Leadership and the One Minute Manager* (William Morrow, 1985), the source of SLII and the four development levels`,
        `Gregory Thompson and Robert P. Vecchio, "Situational leadership theory: a test of three versions", *The Leadership Quarterly* 20(5), 2009`,
        `Jurgen Appelo, *Management 3.0: Leading Agile Developers, Developing Agile Leaders* (Addison-Wesley, 2011), on the seven delegation levels`
      ],
      related: ['tool:delegate', 'lesson:delegation-levels', 'scenario:delegated-task-wrong', 'scenario:you-dont-trust-me', 'term:situational-leadership']
    },

    /* ---------- batch 5: engineering and architecture ---------- */
    {
      id: 'littles-law', track: 'eng',
      title: 'WIP and Little\'s law',
      summary: 'Why starting less finishes more: with the same throughput, halving the work in progress halves how long each item takes.',
      keywords: ['little\'s law', 'littles law', 'little', 'wip', 'work in progress', 'wip limit', 'cycle time', 'throughput', 'lead time', 'kanban', 'flow', 'context switching', 'multitasking'],
      intro: `In 1961 John Little proved that in any stable system, the average number of items inside it equals the rate they come out times the average time each one spends inside: **work in progress = throughput × cycle time**. Turn it round and it says something every lead needs: **cycle time = work in progress ÷ throughput**.

If your team finishes 5 items a week and has 20 in progress, each item takes about 4 weeks from start to finish, however hard everyone works. Start fewer, and each one finishes sooner. Move the sliders; then switch on the cost of switching between tasks, and see why the effect is even stronger in practice.`,
      after: `## What it means for you as a lead
- **"Stop starting, start finishing."** The quickest way to get an item done sooner is usually to start fewer items, not to push harder.
- **Set a WIP limit** on the board's "In progress" column: about one item per person, or fewer when people pair. When the column is full, people help finish something instead of starting something new.
- **Watch the age of items in progress.** An item that has been in progress for three times the usual cycle time is stuck, whatever the stand-up says.
- **Forecast with it.** With 30 items in the backlog and 5 finished a week, the backlog takes about 6 weeks. That is a better answer to "when will it be done?" than adding up estimates.

## A caution about the numbers
Little's law is a proven theorem, but it describes averages over a stable period: it will not tell you when one particular item finishes, and it needs items of roughly similar size. The cost of switching uses Gerald Weinberg's rule of thumb from *Quality Software Management*: with two projects at once a person loses about 20% of their time to switching, with three about 40%. It comes from his experience, not from a controlled study, so treat it as the direction of the effect, not its exact size.`,
      sources: [
        `John D. C. Little, "A Proof for the Queuing Formula: L = λW", *Operations Research* 9(3), 1961`,
        `Daniel S. Vacanti, *Actionable Agile Metrics for Predictability* (2015), on Little's law, cycle time and WIP limits for software teams`,
        `David J. Anderson, *Kanban: Successful Evolutionary Change for Your Technology Business* (Blue Hole Press, 2010)`,
        `Gerald M. Weinberg, *Quality Software Management, Volume 1: Systems Thinking* (Dorset House, 1992), the rule of thumb for the cost of switching`
      ],
      related: ['lesson:flow-wip', 'term:wip-limit', 'term:cycle-time', 'term:littles-law', 'scenario:interruptions-eat-sprint', 'tool:capacity']
    },

    {
      id: 'conways-law', track: 'arch',
      title: 'Conway\'s law: teams and the system',
      summary: 'How you split the teams decides how many teams one change must pass through. Try a feature and an upgrade under two ways of organising.',
      keywords: ['conway', 'conway\'s law', 'conways law', 'inverse conway', 'team topologies', 'stream-aligned', 'team structure', 'org design', 'communication paths', 'handoffs', 'socio-technical'],
      intro: `In 1968 Melvin Conway observed that "organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations." Put simply: teams build what they can easily talk about. Where two teams rarely talk, the system grows a boundary between their parts; where one change needs three teams, it needs three teams every time.

Below is a small product: checkout, refunds and the catalogue, each with a screen, a service and its data. Choose how the teams are split and what has to change, then count the teams involved and the conversations between them, n(n-1)/2, the same arithmetic as in [[explainer:brooks-law]].`,
      after: `## What it means for you as a lead
- **Look at where changes queue.** If most features wait in another team's backlog, the team split is fighting the work. That is a design problem, not a people problem.
- **Teams by product area** ("stream-aligned" teams, in *Team Topologies*) finish features alone, which is why most product companies use them. They pay on cross-cutting work, such as an upgrade every team must do.
- **Teams by layer** (front end, back end, database) are strong in their layer and slow at features: every feature becomes a relay race with handoffs.
- **The inverse Conway manoeuvre:** to get the architecture you want, shape the teams first. Splitting a monolith into services that no single team can own rarely works.
- **Give cross-cutting work an owner**, such as a platform team, so upgrades and security fixes do not fall between the product teams.

## A caution
This is a model with three product areas and two team designs; real organisations mix them, and clear boundaries matter more than any one rule. Conway's law describes a strong tendency, not a law of physics, though a 2012 study by Alan MacCormack, John Rusnak and Carliss Baldwin found the "mirroring" it predicts in real software.`,
      sources: [
        `Melvin E. Conway, "How Do Committees Invent?", *Datamation*, April 1968`,
        `Matthew Skelton and Manuel Pais, *Team Topologies* (IT Revolution, 2019), on stream-aligned and platform teams and the inverse Conway manoeuvre`,
        `Alan MacCormack, John Rusnak and Carliss Baldwin, "Exploring the duality between product and organizational architectures", *Research Policy* 41(8), 2012`,
        `Martin Fowler, "Conway's Law", on martinfowler.com`
      ],
      related: ['lesson:conways-law', 'lesson:monolith-microservices', 'term:conways-law', 'term:inverse-conway', 'scenario:split-into-microservices', 'explainer:brooks-law']
    }
  );
})(window.LELT);
