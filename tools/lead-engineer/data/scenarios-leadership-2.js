/*
 * scenarios-leadership-2.js - more leadership scenarios (batch 6): the first week as a lead, a
 * manager who wants updates every hour, getting peer teams to agree, pressure from above, a
 * decision argued for weeks, and a calendar full of meetings. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'first-week-as-lead',
      track: 'leadership',
      title: `Your first week as the lead`,
      summary: `Promoted on Monday over people you sat beside last week, with a manager who wants changes quickly. Practise listening before you change things.`,
      keywords: ['first week', 'new lead', 'first 90 days', 'promoted', 'promotion', 'former peers', 'listening tour', 'early win', 'changes'],
      role: `You were made lead of the Payments team on Monday. Until Friday you were one of its five developers.`,
      setting: `Monday, 10 am. Priya, your manager, has just announced the change in the team channel. You already have ideas: the stand-up runs 30 minutes, code reviews take three days, and nobody writes tests for the settlement job.`,
      stakes: `The team's trust in you as lead, and Priya's view of whether promoting you was right. Sameer and Divya have been on the team longer than you.`,
      start: 'monday',
      steps: {
        monday: {
          lines: [{ who: 'Priya, your manager', say: `Congratulations! This team needs a shake-up. I'd like to see changes quickly.` }],
          prompt: 'What do you do in your first week?',
          options: [
            { text: `Tell the team you'll spend two weeks listening: a 1:1 with each person, with the same three questions (what must we keep, what gets in your way, what would you change first). Ask Priya what would make her say, at day 90, that it went well. Leave the stand-up and reviews as they are for now.`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'listen',
              result: `The team relaxes. Sameer, who expected you to start giving orders, tells you more in his 1:1 than he has said in a year. Priya's answer is specific: fewer missed dates, and reviews that do not block releases.` },
            { text: `Announce three changes in Tuesday's stand-up: a 10-minute stand-up, reviews within a day, and tests required for the settlement job.`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'pushback',
              result: `The changes are reasonable. The way they arrive is not: on day two, with no conversation. Sameer goes quiet, and Divya asks in the team channel who decided this.` },
            { text: `Carry on as before: take your usual tickets, and let the leading happen around the coding.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Comfortable, and a missed chance. The first weeks are when people expect change and talk most openly. By the time you look up, the team has decided you are "the same, with more meetings".` },
            { text: `Send the team a long message about your vision for the team and the values you want it to have.`,
              grade: 'ok', meters: { team: -1, trust: 1 },
              result: `Priya likes it. The team reads a vision written before you asked them anything, and wonders what it means for Monday. A vision lands better after you have listened.` }
          ]
        },
        listen: {
          lines: [{ narrate: `Ten 1:1s later, the pattern is clear. Everyone dislikes the 30-minute stand-up, three people mention reviews that take days, and Sameer says the settlement job has no tests "because nobody ever gave us time".` }],
          prompt: 'What is your first change?',
          options: [
            { text: `Share what you heard with the team and propose the one change everyone named: a 15-minute stand-up with a parking lot, starting Monday, reviewed in the retro two weeks later. Ask Sameer to scope tests for the settlement job for the next Sprint Planning.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `An early win the team asked for, and credit for Sameer's point. The stand-up ends on time on Monday, and people notice.` },
            { text: `Fix all three at once, since everyone agrees on the problems.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Everyone agreed on the problems, not on the fixes. Three changes in one week means none is done properly, and the review rule quietly lapses.` },
            { text: `Start with the change you care most about: a new branching strategy.`,
              grade: 'poor', meters: { team: -2 },
              result: `Nobody mentioned branching. Your first change tells the team that their answers in the 1:1s did not count.` }
          ]
        },
        pushback: {
          lines: [{ who: 'Divya', say: `Can I ask who decided this? Some of us have been here five years. It would have been nice to be asked.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"You're right, and I'm sorry: I should have asked first. Let's pause all three. I'll have a 1:1 with everyone this week, and we'll choose together in Friday's retro which one to try first."`,
              grade: 'best', meters: { trust: 1, team: 2 },
              result: `Owning it quickly takes the heat out. Friday's retro picks the stand-up change, and Divya proposes the review rule herself.` },
            { text: `"I'm the lead now, and Priya wants changes."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `You used your title and your manager as the reason. The changes will happen on paper; the trust won't.` },
            { text: `"Fair point. Let's discuss it in the retro."`,
              grade: 'ok', meters: { team: 1 },
              result: `Calmer, but vague: the changes stay in place until Friday without anyone agreeing to them, and you haven't said what you would do differently.` }
          ]
        }
      },
      debrief: {
        points: [
          `The first weeks are for learning: a 1:1 with everyone, the same three questions, and notes. People talk most openly to a new lead.`,
          `Ask your manager what success at day 90 looks like before you decide what to change.`,
          `Pick an early win the team named, not the one you care about most. It becomes their win and your credibility.`,
          `Promoted over former peers? Ask, don't announce. Authority comes from trust, not from the title.`,
          `If you get it wrong, own it quickly, pause, and ask.`
        ],
        script: `> "For the next two weeks I'll mostly listen. I'd like a 1:1 with each of you, with three questions: what's going well that we must keep, what gets in your way, and what you'd change first. I'll share what I heard, and one change to try, in the retro on the 15th."`,
        analogy: `A new lead is a new engineer on a legacy system with production traffic. You read the code and the incident history, talk to the people on call, and ship one small, safe fix before you touch the architecture.`
      },
      links: ['lesson:first-90-days', 'tool:plan90', 'tool:oneonone', 'lesson:engineer-to-lead', 'phrase:lead-listen-first', 'scenario:peer-wanted-the-role']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'manager-wants-daily-updates',
      track: 'leadership',
      title: `The manager who wants an update every hour`,
      summary: `After a missed date, your manager messages "status?" four times a day. Practise restoring confidence instead of fighting "micromanagement".`,
      keywords: ['managing up', 'micromanagement', 'micromanaging', 'status', 'updates', 'manager', 'trust', 'no surprises', 'polling'],
      role: `You lead a team of six building the loyalty-points feature.`,
      setting: `Last sprint the team missed a date promised to a customer by four days, and Priya, your manager, heard about it from the account manager. Since then she messages you three or four times a day: "status?", "any update?", "are we on track?"`,
      stakes: `Your time, the team's focus (you have started asking them for updates to answer her), and Priya's trust in you.`,
      start: 'ping',
      steps: {
        ping: {
          lines: [
            { narrate: `It is 3 pm. This is Priya's third message today.` },
            { who: 'Priya, your manager', say: `Any update on loyalty points? Are we on track for Friday?` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Answer the question, then ask for 15 minutes: "I can tell the last slip worried you, and that's fair. What would you need from me to stop worrying? Could I send you a five-line note every day at 5 pm, and call you the moment anything changes?"`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'agree',
              result: `Priya admits the account manager embarrassed her in front of her own boss. She agrees to the 5 pm note, and the pings stop the next day.` },
            { text: `Ask the team for a status every time she asks, and forward it to her.`,
              grade: 'poor', meters: { trust: 1, team: -2 }, next: 'drain',
              result: `Priya gets quick answers. The team gets interrupted three times a day and starts to feel watched.` },
            { text: `Reply "On track!" each time, and carry on.`,
              grade: 'ok', meters: { trust: -1 }, next: 'drain',
              result: `Friendly, and it gives her nothing she can check. "On track" is what you said last sprint too.` },
            { text: `Tell her you feel micromanaged, and ask her to trust you.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Honest, and it lands badly: the last slip is exactly why she doesn't. Trust comes back from evidence, not from asking for it.` }
          ]
        },
        agree: {
          lines: [{ narrate: `A week of 5 pm notes later. On Wednesday morning, a dependency on the CRM team slips by two days, which puts Friday at risk.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Call Priya now, before the 5 pm note: what slipped, what it means for Friday, two options (ship without the CRM sync and add it on Tuesday, or move everything to Tuesday), and your recommendation.`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `Priya chooses to ship without the sync, and tells the account manager herself. Two weeks later she suggests the daily note could be weekly.` },
            { text: `Put it in the 5 pm note as usual.`,
              grade: 'ok', meters: { trust: -1 },
              result: `It keeps the rhythm, but you agreed to call when anything changes. A risk to the very date she cares about is exactly that.` },
            { text: `Ask the team to work late to make up the two days, and say nothing.`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `If it works, nobody knows there was a risk. If it doesn't, Priya hears about a slip from the account manager again.` }
          ]
        },
        drain: {
          lines: [{ narrate: `Two weeks on, the pings have not stopped. You spend about an hour a day collecting and relaying status, and two of your 1:1s have slipped.` }],
          prompt: 'What do you change?',
          options: [
            { text: `Ask Priya for 15 minutes to fix the rhythm: ask what worries her, agree a daily note at a fixed time plus a call for anything urgent, and stop polling the team. They keep the board up to date by 4 pm instead.`,
              grade: 'best', meters: { trust: 1, team: 2 },
              result: `Priya agrees. Pinging was her only way to feel in control; a predictable note works better for both of you.` },
            { text: `Block your calendar so you can't answer messages before 4 pm.`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `You protect your time, and Priya feels ignored, so she escalates to your skip-level manager. The cause is her confidence, not your calendar.` },
            { text: `Keep going; it will calm down eventually.`,
              grade: 'poor', meters: { team: -1, delivery: -1 },
              result: `It rarely does by itself. Every slow answer looks like a new reason to worry.` }
          ]
        }
      },
      debrief: {
        points: [
          `Constant requests for status usually mean lost confidence. Restore the confidence and the requests stop; complaining about micromanagement rarely works.`,
          `Agree a rhythm and a format: a short note at a fixed time, and a call when something important changes. Then keep to it perfectly.`,
          `No surprises: your manager should never hear bad news about your team from someone else.`,
          `Bring a risk with options and a recommendation, so your manager decides instead of worrying.`,
          `Don't pass the polling on to the team. Use the board, and protect their focus.`
        ],
        script: `> "I can tell the last slip worried you, and that's fair. Could I send you a five-line note every day at 5 pm, and call you the moment anything changes? Let's try it for two weeks and see if it gives you what you need."`,
        analogy: `A manager pinging you every hour is a client polling an endpoint because it has no other way to know when things change. Give it a webhook (the call when something changes) and a scheduled report, and the polling stops.`
      },
      links: ['lesson:managing-up', 'tool:status', 'phrase:lead-update-rhythm', 'scenario:bad-news-early', 'scenario:invisible-work']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'adopt-the-standard',
      track: 'leadership',
      title: `Getting four teams to agree on one standard`,
      summary: `Your director wants every backend team on one logging and tracing standard, and you have no authority over three of them. Practise influence without authority.`,
      keywords: ['influence', 'influence without authority', 'peers', 'other teams', 'standard', 'buy-in', 'architecture review', 'pre-wiring', 'logging', 'tracing'],
      role: `You lead the Orders team. After an outage that took six hours to trace across services, your director asked you to get the four backend teams onto one way of doing structured logging and tracing.`,
      setting: `The other three teams do not report to you. Their leads are Kiran (Platform), Meera (Payments) and Joseph (Catalogue), and each is busy with their own quarter's goals.`,
      stakes: `How long the next cross-service incident takes to trace, and your standing with three peers you will work with for years.`,
      start: 'approach',
      steps: {
        approach: {
          lines: [{ narrate: `You have written a two-page proposal: one logging library, a trace id on every request, and a shared dashboard. The architecture review is in two weeks.` }],
          prompt: 'How do you start?',
          options: [
            { text: `Meet each lead one to one first. Ask what their team is measured on and what the last outage cost them, show how the standard helps that (Meera's team was paged for six hours), ask what would make it hard for them, and change the proposal where they are right.`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'objection',
              result: `Kiran wants the library in the platform's service template, which makes adoption almost free. Meera wants it before the festive sale. By the review, the proposal is partly theirs.` },
            { text: `Present the proposal at the architecture review, with the director there, and ask for a decision.`,
              grade: 'poor', meters: { trust: -1, delivery: -1 }, next: 'review-fight',
              result: `Three leads see the proposal for the first time in front of their director. They do what surprised people do: look for problems.` },
            { text: `Email the proposal to all three and ask for comments by Friday.`,
              grade: 'ok', meters: { delivery: -1 }, next: 'objection',
              result: `A written proposal is good; asking busy people for comments by email usually gets silence. One reply arrives: "Looks fine, no time this quarter."` },
            { text: `Ask the director to tell the teams to adopt it.`,
              grade: 'poor', meters: { trust: -2 },
              result: `It happens on paper. Each team does the minimum, and three leads remember that you went over their heads.` }
          ]
        },
        objection: {
          lines: [{ who: 'Joseph, Catalogue lead', say: `I like it, honestly. But my team has a migration due in March. Adding a logging change now means something slips, and it's my head on the line, not yours.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"That's fair. What if Catalogue adopts after your March migration, and my team does the integration work in your codebase, with your team reviewing? Your new services can start with the library from day one, which costs you nothing extra."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `Joseph agrees: you made his yes cheap and kept his date safe. At the review, he speaks for the proposal.` },
            { text: `"The director wants all four teams on it this quarter."`,
              grade: 'poor', meters: { trust: -2 },
              result: `You used authority you don't have, borrowed from someone who isn't in the room. Joseph agrees in the meeting and quietly does nothing.` },
            { text: `"OK, Catalogue can skip it."`,
              grade: 'ok', meters: { delivery: -1 },
              result: `It keeps the peace and leaves a hole: the next incident through the Catalogue service will be as hard to trace as the last one.` }
          ]
        },
        'review-fight': {
          lines: [{ who: 'Meera, Payments lead', say: `This is the first I'm hearing of it. Why should my team change libraries the week before the festive sale?` }],
          prompt: 'What do you do?',
          options: [
            { text: `"You're right, you should have heard it first, and I'm sorry. Let's not decide today. I'll meet each of you this week and bring back a version that fits your timelines."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `It costs two weeks and saves the proposal. One to one, you find that Meera's real worry is the sale, and you agree that Payments adopts in January.` },
            { text: `Ask the director to decide anyway.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `The director decides. Three leads now oppose you as well as the standard.` },
            { text: `Defend the proposal point by point.`,
              grade: 'ok', meters: { trust: -1 },
              result: `Each point you win makes the room more defensive. A surprised group argues about the surprise, not the content.` }
          ]
        }
      },
      debrief: {
        points: [
          `Influence without authority is exchange: find what each person values and is measured on, and shape your ask so it moves their goal too.`,
          `Talk to people one by one before the big meeting. A proposal first heard in a review gets attacked; one shaped together gets supported.`,
          `Make yes cheap: phase it, do some of the work yourself, fit their dates.`,
          `Never borrow authority you don't have ("the director wants it"), and don't go over a peer's head before talking to them.`,
          `Change the proposal when they are right. It becomes partly theirs.`
        ],
        script: `> "Joseph, I know March is tight for you. What if Catalogue adopts after your migration, and my team does the integration work in your codebase, with your team reviewing? New services can start with the library from day one, which costs you nothing extra."`,
        analogy: `Getting four teams onto one standard is a library migration across repositories you don't own. You don't force-push to their main branch; you open a pull request that is easy to merge, offer to do the work, and fit their release schedule.`
      },
      links: ['lesson:influence-without-authority', 'lesson:managing-dependencies', 'scenario:team-never-replies', 'phrase:lead-their-goal', 'phrase:influence-help']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'pressure-from-above',
      track: 'leadership',
      title: `The director's angry call on Friday evening`,
      summary: `An audit has moved a week earlier and your director wants the team working the weekend. Practise absorbing the pressure and passing on the plan.`,
      keywords: ['pressure', 'director', 'escalation', 'weekend work', 'overtime', 'shield', 'audit', 'deadline moved', 'panic', 'protect the team'],
      role: `You lead the team building the new merchant onboarding flow, due on 4 Dec.`,
      setting: `Friday, 6:30 pm. Rakesh, your director, calls: the bank's compliance audit has moved forward a week, the onboarding flow must be ready for it, and he is angry that the team "isn't moving fast enough".`,
      stakes: `The audit, the team's weekend, and whether the team trusts you with bad news.`,
      start: 'call',
      steps: {
        call: {
          lines: [{ who: 'Rakesh, your director', say: `The audit is on 27 Nov now, not 4 Dec. I need onboarding done for it. Get the team working this weekend if that's what it takes.` }],
          prompt: 'What do you say to Rakesh?',
          options: [
            { text: `"Understood: the audit date is fixed. Let me work out what fits by the 27th and come back to you by noon on Monday with options. Can you tell me which parts the auditors will actually look at?"`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'monday',
              result: `Rakesh calms down a little: he has a time, and a question that shows you are taking it seriously. It turns out the auditors need the KYC checks and the audit log, not the dashboard.` },
            { text: `"Yes, I'll get the team in this weekend."`,
              grade: 'poor', meters: { trust: 1, team: -2, delivery: -1 }, next: 'weekend',
              result: `Rakesh is pleased. Now you have to tell the team, at 6:45 pm on a Friday.` },
            { text: `"That's not possible; we planned for 4 Dec."`,
              grade: 'ok', meters: { trust: -2 },
              result: `Perhaps true, and it answers a fixed audit date with a flat no. Rakesh will escalate, and you have lost the chance to shape the answer.` }
          ]
        },
        monday: {
          lines: [{ narrate: `Monday, 10 am. With the auditors needing only the KYC checks and the audit log, those fit by the 25th; the dashboard and bulk upload move to 11 Dec. Rakesh has agreed. Now you need to tell the team.` }],
          prompt: 'How do you tell the team?',
          options: [
            { text: `In the stand-up: "The bank's audit moved to the 27th. Here's what I agreed with Rakesh: the KYC checks and the audit log by the 25th; the dashboard and bulk upload move to 11 Dec. No weekend work. Here's how I'd split it. What am I missing?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `The team hears what changed, what it means and what has been protected. Divya spots a risk in the audit log you had missed, early enough to fix.` },
            { text: `Forward Rakesh's Friday message to the team channel with "We need to speed up."`,
              grade: 'poor', meters: { team: -2, delivery: -1 },
              result: `The team gets the anger without the plan. Two people start working evenings without being asked, and one of them breaks the build on Wednesday.` },
            { text: `Quietly re-plan the sprint yourself and move tickets around without explaining.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `The plan is right, and the team doesn't know why their work changed. They will guess, and the guess will be worse than the truth.` }
          ]
        },
        weekend: {
          lines: [{ narrate: `Saturday. Four of the six come in; two cancel family plans to do it. By Sunday evening the onboarding flow is closer, the dashboard is half-done, and nobody has asked what the auditors actually need.` }],
          prompt: 'What now?',
          options: [
            { text: `Stop the weekend work. On Monday, ask Rakesh which parts the auditors will look at, re-plan around them, and tell the team plainly: "I agreed to the weekend too quickly. That was my mistake, and it won't be the plan again."`,
              grade: 'best', meters: { trust: 1, team: 2 },
              result: `The team respects the honesty. The auditors' list turns out to be short, and the work fits without another weekend.` },
            { text: `Plan the next weekend too.`,
              grade: 'poor', meters: { team: -2, delivery: -1 },
              result: `Tired people make mistakes. By the second weekend, the bug count is rising faster than the features.` },
            { text: `Give the team a day off next week to make up for it.`,
              grade: 'ok', meters: { team: 1 },
              result: `Kind, and it doesn't fix the cause: nobody has asked what the audit needs, so the plan is still "everything, faster".` }
          ]
        }
      },
      debrief: {
        points: [
          `Absorb the emotion and pass on the information: what changed, what it means for us, what we will do.`,
          `Don't answer pressure on the spot. Give a time ("by noon on Monday") and ask the question that shrinks the problem: what exactly is needed by the date?`,
          `Weekend work is a loan against next month, not a plan. Offer scope and date options instead.`,
          `Never forward anger to the team channel. Tell the team calmly, with the reasons and the plan, and ask what you have missed.`,
          `If you said yes too quickly, say so, and change course.`
        ],
        script: `> "The audit date is fixed, so let me work out what fits by the 27th and come back to you by noon on Monday with options. Which parts will the auditors actually look at? That's what I'll plan around."`,
        analogy: `A lead is a buffer with backpressure between a bursty upstream and a steady consumer. It smooths spikes into a rate the team can process, and when the queue really is too long, it pushes back upstream instead of crashing the consumers.`
      },
      links: ['lesson:shielding-the-team', 'lesson:positive-no', 'scenario:saying-no-to-manager', 'phrase:lead-shield-context', 'tool:deadline']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'the-one-way-door',
      track: 'leadership',
      title: `Three weeks arguing about a library`,
      summary: `Two seniors have argued for three weeks over an HTTP client that could be swapped in a day. Practise sorting one-way doors from two-way doors, and disagree and commit.`,
      keywords: ['decision', 'decisions', 'one-way door', 'two-way door', 'disagree and commit', 'analysis paralysis', 'library choice', 'design argument', 'who decides'],
      role: `You lead a team of seven building a new notifications service in Spring Boot.`,
      setting: `For three weeks, every design meeting has ended in the same argument: which HTTP client library to use for calling the SMS and email providers. Both candidates work. The argument between Arjun and Sameer is now personal.`,
      stakes: `The service is already a week behind, and the team is splitting into two camps.`,
      start: 'stuck',
      steps: {
        stuck: {
          lines: [
            { who: 'Arjun', say: `We can't pick a client until we've benchmarked both properly. That's another week.` },
            { who: 'Sameer', say: `We benchmarked them already. Arjun just doesn't like the answer.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Ask the team: "If we pick wrong, what does it cost to change later?" The client sits behind one interface in one module, so about a day. Then: "This is a two-way door. Sameer's recommendation stands, we decide today, and we look again in a month with real data. Arjun, what would you want measured to know if it was the wrong choice?"`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 1 }, next: 'commit',
              result: `The heat drops once everyone sees how small the decision is. Arjun asks for latency and error-rate metrics on the provider calls, which is a good idea anyway.` },
            { text: `Agree to another week of benchmarks, to be fair to both.`,
              grade: 'poor', meters: { delivery: -2, team: -1 }, next: 'week-later',
              result: `Fair, and expensive: a week of benchmarks on a decision that costs a day to reverse.` },
            { text: `Pick one yourself to end the argument.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'commit',
              result: `It ends the argument, leaves the losing side feeling unheard, and teaches the team nothing about how to decide the next one.` },
            { text: `Put it to a team vote.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'commit',
              result: `Quick, but a vote turns a technical question into a popularity contest, and the losing camp is now a named minority.` }
          ]
        },
        commit: {
          lines: [{ narrate: `The decision is made. Two days later, Arjun raises it again in the team channel: "Still think we're making a mistake."` }],
          prompt: 'What do you do?',
          options: [
            { text: `Reply to him privately: "I hear you, and your concern is in the decision record, with the metrics you suggested. We review it on the 15th. Until then I need you fully behind it. Can I count on that?"`,
              grade: 'best', meters: { trust: 1, team: 2 },
              result: `Arjun agrees. Being written down, with a review date, was what he needed; he didn't need to win.` },
            { text: `Reopen the debate in the next design meeting.`,
              grade: 'poor', meters: { delivery: -2, team: -1 },
              result: `Every reopened decision teaches the team that the way to win is to keep arguing.` },
            { text: `Ignore the message.`,
              grade: 'ok', meters: { team: -1 },
              result: `The disagreement goes underground. Arjun's next objection will arrive in a code review, not the channel.` }
          ]
        },
        'week-later': {
          lines: [{ narrate: `The new benchmarks show a 3% difference, well inside the noise. The argument carries on, now about how the benchmarks were run.` }],
          prompt: 'What now?',
          options: [
            { text: `Stop the analysis: "Both are good enough, and we can change this in a day. Sameer's choice, decided today, reviewed in a month with production data. Arjun's concerns go into the decision record."`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `Late, and right. The team ships the first provider integration that week.` },
            { text: `Ask for a third library to be evaluated.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `The decision gets bigger as it gets later. This is how teams spend a month on a day's choice.` },
            { text: `Ask the architect to decide.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `It ends it, and teaches the team that they cannot decide a two-way door by themselves.` }
          ]
        }
      },
      debrief: {
        points: [
          `Ask early: if we're wrong, what does it cost to undo? Most decisions are two-way doors: decide quickly, and review.`,
          `Save the long analysis for one-way doors: a primary database, a contract, a public API.`,
          `Say who decides and how: a recommendation, input from everyone, one decider, a date.`,
          `Disagree and commit only works if people were heard: write the objection down, with a review date.`,
          `Don't reopen a decision because someone keeps arguing. Reopen it when the facts change.`
        ],
        script: `> "If we pick wrong, it costs about a day to swap, because it's behind one interface. So this is a two-way door. Sameer's recommendation stands, we decide today, and we review it on the 15th with real latency and error data. Arjun, your concern goes into the decision record."`,
        analogy: `A two-way-door decision is a change behind a feature flag: ship it, watch the metrics, flip it back if you're wrong. A week of benchmarks first is like load-testing a config change you can revert in seconds.`
      },
      links: ['lesson:making-decisions', 'tool:adr', 'scenario:design-argument', 'phrase:lead-two-way-door', 'term:one-way-door']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'calendar-full-of-meetings',
      track: 'leadership',
      title: `32 hours of meetings`,
      summary: `Next week has 32 hours of meetings out of 40, reviews are waiting and a design doc is due. Practise auditing your calendar instead of working every evening.`,
      keywords: ['calendar', 'meetings', 'too many meetings', 'time management', 'focus time', 'deep work', 'decline', 'delegate', 'overtime', 'evenings'],
      role: `You have been the lead for three months.`,
      setting: `Sunday evening. Next week's calendar has 32 hours of meetings out of 40. Your 1:1s keep getting moved, three pull requests have waited for your review since Wednesday, and the design doc for next quarter is due on Friday.`,
      stakes: `Your 1:1s, the team's reviews, the design doc, and your evenings.`,
      start: 'sunday',
      steps: {
        sunday: {
          lines: [{ narrate: `You open the calendar for the week and count the meetings again.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Go through each meeting. Keep the ones that need you; send Divya to the two integration syncs (she knows that area and will bring back two lines); propose a written note instead of the weekly status call; decline two where you only listen. Block Tuesday and Thursday mornings for reviews and the design doc.`,
              grade: 'best', meters: { delivery: 2, team: 2 }, next: 'push',
              result: `Twelve hours come back. Divya is pleased to represent the team, and the organiser of the status call agrees to try a written note for a month.` },
            { text: `Do the reviews and the design doc in the evenings.`,
              grade: 'poor', meters: { delivery: 1, team: -1 }, next: 'tired',
              result: `It works for a week. Then the team notices your late-night commits and starts to think that is what is expected.` },
            { text: `Cancel your 1:1s this week to make room.`,
              grade: 'ok', meters: { delivery: 1, team: -2 },
              result: `The 1:1s are the one meeting that belongs to your team, and the first one you cut. Two weeks later, you hear about a resignation you would have heard about in a 1:1.` },
            { text: `Decline everything except your own team's meetings.`,
              grade: 'ok', meters: { team: 1, trust: -2 },
              result: `You protect your time and vanish from the cross-team meetings where decisions about your team are made. Two get made without you.` }
          ]
        },
        push: {
          lines: [{ who: 'Neha, a programme manager', say: `I saw you declined Wednesday's steering call. I really need you there; the director likes to see the leads.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I'd like to keep my mornings for the design doc this week. Could I send you two lines before the call with our status and risks, and join only for the part about release dates? If anything needs a decision from me, I'll be there."`,
              grade: 'best', meters: { trust: 1, delivery: 1 },
              result: `Neha agrees. She needed the information for the director, not your presence for the full hour.` },
            { text: `"Fine, I'll come."`,
              grade: 'poor', meters: { delivery: -1 },
              result: `Every meeting you can't say no to takes a little more of the time you blocked. By Friday, the design doc is late.` },
            { text: `Send Divya instead, without telling Neha.`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `A good choice of person, sent the wrong way: Neha is surprised in front of the director. Agree a replacement with the organiser first.` }
          ]
        },
        tired: {
          lines: [
            { narrate: `Three weeks of evening work later, you are tired and the design doc was rushed.` },
            { who: 'Karthik, in your 1:1', say: `Can I ask something? Are we expected to work late too? I see your commits at midnight.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Tell him clearly: "No, and I shouldn't be either. That's a planning problem, and I'm fixing it." Then audit next week's calendar: delegate, decline, and block time for reviews and design.`,
              grade: 'best', meters: { team: 2, delivery: 1 },
              result: `Saying it out loud matters: the team copies what you do, not what you say. The following week your evenings are your own again.` },
            { text: `Tell him it's only until things calm down.`,
              grade: 'poor', meters: { team: -2 },
              result: `Things rarely calm down by themselves. Karthik hears "yes, for now", and starts working late too.` },
            { text: `Start stopping at 7 pm, without changing anything else.`,
              grade: 'ok', meters: { team: 1, delivery: -1 },
              result: `Better for you, but the meetings haven't moved, so the reviews and the design doc simply wait longer.` }
          ]
        }
      },
      debrief: {
        points: [
          `Your calendar is a set of choices. Audit it: keep what needs you, send someone from the team (a growth chance for them), replace status meetings with notes, decline the rest.`,
          `Block time for deep work (reviews, design, writing) as if it were a meeting, and defend it.`,
          `Never cut 1:1s first. They are where you hear about problems while they are small.`,
          `Offer an alternative when you decline: two lines before the call, or only the part that needs you.`,
          `The team copies your hours. Working every evening is a planning problem, not dedication.`
        ],
        script: `> "I'd like to keep my mornings for the design doc this week. Could I send you two lines before the call with our status and risks, and join just for the part about release dates? If anything needs a decision from me, I'll be there."`,
        analogy: `A calendar that services every interrupt at once is a CPU that never finishes its long-running jobs. Reserve time slices for the important work, batch the interrupts, and hand off what another core can run.`
      },
      links: ['lesson:your-calendar', 'lesson:interruptions', 'tool:prioritise', 'phrase:lead-skip-meeting', 'scenario:working-late-every-night']
    }
  );
})(window.LELT);
