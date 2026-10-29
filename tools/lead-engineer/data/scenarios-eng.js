/*
 * scenarios-eng.js - engineering leadership scenarios: running an incident, postmortem actions that
 * never happened, slow reviews, tech debt, flaky builds, AI-written code, a hero on-call and a
 * league table of developers. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'production-down-friday',
      track: 'eng',
      title: `Production is down at 6:40 on a Friday`,
      summary: `Card payments are failing, four people are debugging four theories, and your manager wants to know what is going on. Practise running the incident instead of fixing it.`,
      keywords: ['incident', 'outage', 'production down', 'sev1', 'rollback', 'incident commander', 'friday release', 'payments failing'],
      role: `You lead the payments team of seven.`,
      setting: `Friday, 6:40 pm. A release went out at 6:15. Payment success has dropped from 99% to 70%. The team channel has 40 new messages, and four developers are each chasing a different theory. Your manager, Priya, has just messaged: "What's happening?"`,
      stakes: `Every minute, about 100 customers fail to pay during the evening peak. Handle it well and it is a 30-minute blip; handle it badly and it runs into the night.`,
      start: 'first',
      steps: {
        first: {
          lines: [{ who: 'Anil', say: `I think it's the bank's API.` }, { who: 'Divya', say: `No, it's the new retry logic.` }, { who: 'Karthik', say: `Should I restart the pods?` }],
          prompt: 'What do you do first?',
          options: [
            { text: `Declare a SEV1 in a new incident channel, say you are incident commander, name Divya to lead the fix and Karthik to keep the timeline, and ask one question: "What changed at 6:15?"`,
              grade: 'best', meters: { delivery: 2, team: 1 }, next: 'rollback',
              result: `Four voices become one plan. Within a minute Divya points out that the 6:15 release changed the retry logic.` },
            { text: `Open your laptop and start reading the logs yourself: you know the payment code best.`,
              grade: 'poor', meters: { delivery: -1, team: -1 }, next: 'rollback',
              result: `For 15 minutes nobody is deciding anything. Four theories keep running side by side, and Priya's question goes unanswered.` },
            { text: `Reply to Priya first with everything you know, then join the debugging.`,
              grade: 'ok', meters: { trust: 1, delivery: -1 }, next: 'rollback',
              result: `Priya is reassured, but the channel is still four people with four theories and nobody choosing between them.` }
          ]
        },
        rollback: {
          lines: [{ who: 'Divya', say: `The 6:15 release changed the retry logic. I'm 70% sure that's it, but I haven't found the bug yet.` }],
          prompt: 'What do you decide?',
          options: [
            { text: `"Roll back the 6:15 release now. If payments recover, we find the bug on Monday, with the logs."`,
              grade: 'best', meters: { delivery: 2, trust: 1 }, next: 'update',
              result: `The rollback takes six minutes. Payment success is back to 99% by 6:58.` },
            { text: `"Let's find the exact bug first, so we fix it properly."`,
              grade: 'poor', meters: { delivery: -2, trust: -1 },
              result: `Forty minutes later Divya finds it, and the fix needs a new release at 8 pm. Customers failed to pay the whole time; a rollback would have stopped it in six minutes.` },
            { text: `"Restart all the payment pods and see if it clears."`,
              grade: 'ok', meters: { delivery: -1 }, next: 'update',
              result: `The restart buys ten quiet minutes, then the errors return. You roll back at 7:10.` }
          ]
        },
        update: {
          lines: [{ narrate: `Priya has messaged again, and support says customers are calling.` }],
          prompt: 'What do you send, and to whom?',
          options: [
            { text: `In the incident channel, to Priya and to support: "Update 2, 7:00: card payments failed for about 30% of customers from 6:15. We rolled back the 6:15 release and payments are normal again. Watching for 30 minutes; next update at 7:30. Postmortem by Wednesday."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `Support can answer customers, Priya forwards it to her manager unchanged, and nobody joins the channel to ask.` },
            { text: `A private message to Priya: "Fixed, will explain on Monday."`,
              grade: 'ok', meters: { trust: -1 },
              result: `It is fixed, but support still does not know what to tell customers, and Priya has nothing to give her own manager.` },
            { text: `Nothing yet: you would rather wait until you know the root cause.`,
              grade: 'poor', meters: { trust: -2 },
              result: `Priya joins the call at 7:20 asking what happened, and her manager calls her. Silence made a fixed incident feel like an open one.` }
          ]
        }
      },
      debrief: {
        points: [
          `In an incident, the lead's job is usually to run it, not to fix it: declare it, name the roles, and ask "what changed?"`,
          `Mitigate first, diagnose later. A rollback that stops the impact in six minutes beats a perfect fix in forty.`,
          `Send an update early and on a rhythm: what is affected, what you are doing, when the next update comes.`,
          `Let the people closest to the code do the hands-on work. A lead at the keyboard leaves nobody watching the whole picture.`
        ],
        script: `> "Declaring a SEV1. I'm incident commander; Divya, you lead the fix; Karthik, keep the timeline. What changed at 6:15? … We roll back now and find the bug on Monday. … Update 2: card payments failed for about 30% of customers from 6:15; rolled back; next update at 7:30."`,
        analogy: `An incident commander is the circuit breaker in front of a failing service: it does not fix the service, it stops the damage spreading and gives the people fixing it room to work.`
      },
      links: ['playbook:incident', 'lesson:incidents', 'tool:postmortem', 'phrase:eng-incident-roles', 'phrase:eng-incident-mitigate', 'phrase:eng-incident-update']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'same-incident-twice',
      track: 'eng',
      title: `The same outage, two months later`,
      summary: `The settlement job failed again, exactly as in August. The postmortem had five actions; none were done. Practise making postmortem actions actually happen.`,
      keywords: ['postmortem', 'action items', 'repeat incident', 'follow up', 'blameless', 'settlement', 'incident review', 'owners'],
      role: `You lead the team that owns settlements.`,
      setting: `The nightly settlement job failed at 2 am and merchants were paid a day late, just as in August. The August postmortem listed five actions. Looking now, you see none were done: they sat in a document, with "Team" as the owner.`,
      stakes: `Merchants were paid late twice. Your manager, Priya, will ask why the postmortem changed nothing, and the team half-expects to be blamed.`,
      start: 'priya',
      steps: {
        priya: {
          lines: [{ who: 'Priya', say: `This is the second time. Didn't we do a postmortem on exactly this?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"We did, and we didn't do its actions. That's on me: they had no owners or dates, and they never made it into a sprint. Tomorrow I'll bring you the two actions that would have prevented this, with owners and dates, in this sprint."`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'plan',
              result: `Owning it plainly lands better than any explanation. Priya asks only for the plan.` },
            { text: `"The team was supposed to do them, but they were busy with features."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'plan',
              result: `It is true, and it sounds like blame. The team hears that you put it on them; Priya hears that nobody owns follow-ups.` },
            { text: `"Yes, but the trigger was different this time."`,
              grade: 'ok', meters: { trust: -1 }, next: 'plan',
              result: `Technically right, and it reads as a dodge. Priya asks again what changed after August.` }
          ]
        },
        plan: {
          lines: [{ narrate: `You have the August document open. Its five actions: "Improve monitoring", "Add retries", "Better documentation", "Be more careful with config changes", "Review the job's design".` }],
          prompt: 'What do you do with them?',
          options: [
            { text: `Rewrite the two that would have stopped tonight's failure as checkable actions with one owner and a date each ("Page on-call if settlement has not finished by 4 am: Kiran, by Friday"), drop the vague ones, put both in this sprint with the Product Owner's agreement, and check them at the next two stand-ups.`,
              grade: 'best', meters: { delivery: 2, trust: 1 },
              result: `Both are done within eight days. The next failure, in December, pages Kiran at 4:05 am, and merchants are paid on time.` },
            { text: `Assign all five to people, worded as they are, with a date next month.`,
              grade: 'ok', meters: { delivery: 1 },
              result: `Better than "Team", but "improve monitoring" and "be more careful" can never be finished. Two get done; three quietly expire again.` },
            { text: `Write a new postmortem with ten actions this time, to be thorough.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `Ten actions with no priority is a longer wish list. Nothing reaches the sprint, and the team feels the review was about volume, not change.` }
          ]
        }
      },
      debrief: {
        points: [
          `A postmortem is only as good as its actions, and an action is real only with one owner, a date and a place in the backlog.`,
          `A few actions that change the system beat many that ask people to be careful.`,
          `When the follow-up failed, own it as the lead, then fix the process, not the people.`,
          `Check open postmortem actions at a regular meeting until they are done.`
        ],
        script: `> "We did a postmortem and didn't do its actions; that's on me. Here are the two that would have prevented tonight, each with an owner and a date, in this sprint. I'll report on them at Friday's review."`,
        analogy: `A postmortem without owned actions is a caught exception that is logged and swallowed: you know something went wrong, and the program carries on exactly as before.`
      },
      links: ['tool:postmortem', 'lesson:incidents', 'phrase:eng-blameless-action', 'phrase:mistake-own', 'playbook:incident']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'prs-wait-three-days',
      track: 'eng',
      title: `Pull requests wait three days for review`,
      summary: `Pull requests wait three days for a first review, the two seniors say they are too busy, and juniors have started opening huge ones "so we only wait once". Practise fixing the review flow.`,
      keywords: ['code review', 'pull requests', 'review time', 'cycle time', 'bottleneck', 'seniors', 'small prs', 'reviewers'],
      role: `You lead a team of eight: two seniors and six mid-level and junior developers.`,
      setting: `Cycle time has crept up to nine days. Looking closer, most of it is pull requests waiting: three days on average for a first review, almost always by Vikram or Asha, the two seniors. Juniors now open 1,500-line pull requests "so we only wait once".`,
      stakes: `Delivery is slowing, the seniors feel overloaded, and the juniors learn nothing from rubber-stamped mega-reviews.`,
      start: 'diagnose',
      steps: {
        diagnose: {
          lines: [{ who: 'Vikram', say: `I'd love to review faster, but I'm also building the bank integration. Something has to give.` }],
          prompt: 'What do you propose to the team?',
          options: [
            { text: `A team rule: first response within four working hours; everyone reviews, juniors too, with a senior also approving payments and security changes; pull requests under about 400 lines; the review queue as the first item at stand-up. You start by reviewing two today.`,
              grade: 'best', meters: { delivery: 2, team: 2 }, next: 'pushback',
              result: `Spreading reviews and shrinking pull requests attack both causes at once.` },
            { text: `Ask the two seniors to block two hours every evening for reviews.`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'pushback',
              result: `Reviews speed up a little, and the seniors start resenting their evenings. The bottleneck is still two people.` },
            { text: `Install a bot that reminds reviewers after 24 hours.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'pushback',
              result: `Reminders help at the margin, but the same two people are still the only reviewers, and the pull requests are still huge.` }
          ]
        },
        pushback: {
          lines: [{ who: 'Karthik', say: `Should juniors really approve code? What if we miss something?` }],
          prompt: 'How do you answer?',
          options: [
            { text: `"Reviewing is how you learn the code, and two reviewers see more than one. For payments and security a senior also approves; elsewhere your review counts. Ask questions in reviews: they are useful comments too."`,
              grade: 'best', meters: { team: 2, delivery: 1 },
              result: `Within a month the first review arrives in hours, Karthik catches a real bug in Asha's code, and cycle time falls from nine days to five.` },
            { text: `"Fair point. Juniors can comment, but only seniors approve."`,
              grade: 'ok', meters: { team: -1 },
              result: `Safer-sounding, and the seniors are still the bottleneck for every merge. Waiting falls a little, not much.` },
            { text: `"Don't worry, the tests will catch anything."`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `It dismisses a fair worry and treats review as a formality. Quality slips in the next release.` }
          ]
        }
      },
      debrief: {
        points: [
          `Review waiting is often the biggest, most fixable part of cycle time. Measure it before guessing.`,
          `Two seniors reviewing everything is a bottleneck and a single point of failure. Spread reviews across the team.`,
          `Small pull requests are reviewed faster and better; huge ones get rubber-stamped.`,
          `Juniors learn the code by reviewing it. Pair them with seniors on the risky areas.`
        ],
        script: `> "New rule from today: first response to a pull request within four working hours, everyone reviews, and pull requests stay under about 400 lines. Payments and security also need a senior. I'll start with two reviews this morning."`,
        analogy: `Two seniors reviewing everything is a service with two worker threads and a growing queue. A reminder bot is monitoring on the queue; more reviewers are more workers, and smaller pull requests are lighter jobs.`
      },
      links: ['lesson:code-review-culture', 'lesson:flow-wip', 'phrase:eng-review-fast', 'phrase:eng-review-blocking', 'explainer:littles-law']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'no-time-for-tech-debt',
      track: 'eng',
      title: `"We don't have time for tech debt"`,
      summary: `Your Product Owner has said no to "a sprint for refactoring" three times. Practise making the case in time, money and risk instead.`,
      keywords: ['tech debt', 'technical debt', 'refactor', 'product owner', 'business case', 'payback', '20%', 'roadmap'],
      role: `You lead the team building the merchant dashboard.`,
      setting: `Neha, the Product Owner, has turned down your request for "a sprint to refactor the payments module" for the third time. Meanwhile flaky tests, manual deployment steps and a settlement job only Sameer understands keep slowing everything down.`,
      stakes: `Ask the same way again and you will get the same answer, and the slowdown will be blamed on the team.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Neha', say: `I hear you, but customers don't see refactoring. The roadmap is full. Why should this beat the reporting feature?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Fair question. I'll measure for two weeks: how many hours each problem costs us a sprint, and what fixing it would cost. If the numbers don't beat the reporting feature, I'll drop it."`,
              grade: 'best', meters: { trust: 2, delivery: 1 }, next: 'numbers',
              result: `You turned an argument about principle into an experiment Neha can agree to.` },
            { text: `"Because the code is a mess, and best practice says we must keep it clean."`,
              grade: 'poor', meters: { trust: -1, team: -1 },
              result: `Neha says no for the fourth time. "Clean" and "best practice" are reasons for engineers; she cannot weigh them against a feature.` },
            { text: `"Just give us 20% of each sprint and trust us."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 }, next: 'numbers',
              result: `Neha agrees to try 10% for one sprint, reluctantly, and asks what she will get for it. You realise you need numbers anyway.` }
          ]
        },
        numbers: {
          lines: [{ narrate: `Two weeks later you have the numbers. Flaky tests: about 12 hours lost a sprint, 3 days to fix. Manual deployment steps: about 10 hours, 5 days. The settlement job: 6 hours, plus the risk when Sameer is away, 8 days. The old PDF library: 2 hours, 10 days.` }],
          prompt: 'What do you ask for?',
          options: [
            { text: `"20% of each sprint for three sprints, fastest payback first: flaky tests, deployments, then the settlement job. It pays back within a few sprints, and after that we gain about three developer-days every sprint. The PDF library waits. I'll show the hours saved at each Sprint Review."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 },
              result: `Neha agrees on the spot and adds the Sprint Review check herself. Three sprints later the team ships the reporting feature a week early.` },
            { text: `"All four items, starting with the PDF library, because it is the oldest."`,
              grade: 'ok', meters: { trust: 1, delivery: -1 },
              result: `Neha agrees, and the first sprint goes on the slowest payback. By the time the flaky tests are fixed, she is asking where the gains are.` },
            { text: `"A two-month rewrite of the payments module, so we fix everything at once."`,
              grade: 'poor', meters: { trust: -2, delivery: -2 },
              result: `Two months with nothing for customers, the riskiest way to repay debt. Neha takes it to her manager, who says no.` }
          ]
        }
      },
      debrief: {
        points: [
          `"Refactoring" names the work; a Product Owner decides on time, money and risk. Translate.`,
          `Measure first: two weeks of hours lost turns an opinion into a business case.`,
          `Fix the fastest paybacks first, and leave slow, low-risk items for later.`,
          `Ask for a steady share of each sprint, and show the result at every review.`
        ],
        script: `> "Flaky tests cost us about 12 hours a sprint, and three days fixes them. With 20% of each sprint for three sprints, fastest payback first, the time saved pays back the time spent within a few sprints. I'll show you the hours saved at each review."`,
        analogy: `Asking for "time to refactor" is a pull request with no description: nobody can approve it. With the problem, the measurement and the expected result, the same change gets merged.`
      },
      links: ['tool:techdebt', 'lesson:tech-debt', 'phrase:eng-debt-share', 'phrase:write-plain-business', 'scenario:simple-change-three-weeks']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'flaky-builds-ignored',
      track: 'eng',
      title: `"Just re-run it"`,
      summary: `The build fails at random so often that the team re-runs it without looking, and a real failure slipped through. Practise restoring trust in the build.`,
      keywords: ['flaky tests', 'flaky', 'build', 'ci', 're-run', 'red build', 'quality', 'testing', 'pipeline'],
      role: `You lead a team of six.`,
      setting: `About one build in four fails on tests that pass when re-run, so "just re-run it" has become the team's reflex. Yesterday a real failure in the refund calculation was re-run until it went green with the flaky tests, and it reached staging. The testers found it this morning.`,
      stakes: `If the build is noise, it protects nothing. The next real failure may reach customers.`,
      start: 'now',
      steps: {
        now: {
          lines: [{ who: 'Anil', say: `Honestly, everyone just re-runs it. Some of those tests have been flaky for months.` }],
          prompt: 'What do you do this week?',
          options: [
            { text: `Treat flaky tests as an emergency: list every test that failed and then passed on the same code in the last two weeks, quarantine them out of the blocking run today, give each an owner and a date to fix or delete it, and put the flaky rate on the sprint board.`,
              grade: 'best', meters: { delivery: 2, team: 1 }, next: 'owner',
              result: `By Wednesday the blocking build can be trusted: when it is red, something is really wrong.` },
            { text: `Tell the team to stop re-running builds and to investigate every failure.`,
              grade: 'poor', meters: { delivery: -2, team: -2 }, next: 'owner',
              result: `Without fixing the flaky tests, that means hours of investigating noise every day. Within a week people quietly re-run again.` },
            { text: `Raise the pipeline's automatic retries to three.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `The build goes green more often, and hides real failures even better. The next refund bug sails through.` }
          ]
        },
        owner: {
          lines: [{ who: 'Neha', say: `Fixing tests isn't on the roadmap. How long will this take?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"About four developer-days over two sprints. Today re-runs cost us around five hours a week, and yesterday's refund bug nearly reached customers. I'll fit it into our tech-debt share, so nothing on the roadmap moves."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `Neha agrees. Six weeks later builds fail one time in thirty, and every red build gets looked at.` },
            { text: `"It's necessary engineering work; trust me on this one."`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `She lets it go this once, without understanding why. Next time you ask for time, you start from zero again.` },
            { text: `"We'll do it in our spare time."`,
              grade: 'poor', meters: { team: -2 },
              result: `There is no spare time. The fixes drag on for months, done in the evenings by two frustrated people.` }
          ]
        }
      },
      debrief: {
        points: [
          `A build that fails at random trains people to ignore it, and then it catches nothing.`,
          `Quarantine flaky tests the day you find them, with an owner and a date; never normalise "just re-run it".`,
          `More automatic retries hide the real failures too.`,
          `Make the case for fixing tests in hours lost and near-misses, like any other tech debt.`
        ],
        script: `> "From today, any test that fails and then passes on the same code goes into quarantine, with an owner and a date. The blocking build only has tests we trust, so red means really red."`,
        analogy: `Flaky tests are a smoke alarm that goes off whenever someone makes toast. After a month nobody gets up when it beeps, and that is the day the kitchen is on fire.`
      },
      links: ['lesson:quality-testing', 'lesson:ci-cd', 'tool:techdebt', 'phrase:influence-propose', 'term:flaky-test']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'ai-pr-nobody-understands',
      track: 'eng',
      title: `A 2,000-line AI-written pull request`,
      summary: `A junior opens a huge pull request written mostly by an AI assistant, and cannot explain parts of it. Practise setting a standard for AI-written code without banning the tools.`,
      keywords: ['ai', 'ai generated code', 'copilot', 'pull request', 'code review', 'junior', 'standards', 'ai tools', 'ownership'],
      role: `You lead a team of seven.`,
      setting: `Karthik, eight months into his first job, opened a 2,000-line pull request for the refund export. It works in his tests. When Asha asks in review why it retries three times with no back-off, he says: "The AI wrote that part. I think it's fine?" Two other juniors have started working the same way.`,
      stakes: `Code nobody understands is code nobody can fix at 2 am. Handle it badly and the juniors hide their tool use, or stop using a useful tool altogether.`,
      start: 'pr',
      steps: {
        pr: {
          lines: [{ who: 'Asha', say: `I can't review 2,000 lines properly, and he can't explain half of it. Can we just ban AI tools for juniors?` }],
          prompt: 'What do you do?',
          options: [
            { text: `Talk to Karthik privately, without blame: the tools are fine, and the author owns every line. Ask him to split the pull request into four and walk you through each part before review, rewriting anything he cannot explain. Then agree the rule with the whole team.`,
              grade: 'best', meters: { team: 2, delivery: 1 }, next: 'rule',
              result: `Karthik is relieved it is not a reprimand. Splitting it, he finds two bugs himself.` },
            { text: `Ban AI coding tools for everyone below senior.`,
              grade: 'poor', meters: { team: -2, delivery: -1 }, next: 'rule',
              result: `The juniors keep using them and stop mentioning it. You lose the chance to set a standard.` },
            { text: `Ask Asha to review it anyway, as carefully as she can.`,
              grade: 'ok', meters: { delivery: -1, team: -1 }, next: 'rule',
              result: `Asha spends a day on it, misses part of it, and Karthik learns that a big pull request is somebody else's problem.` }
          ]
        },
        rule: {
          lines: [{ narrate: `You bring it to the team retrospective.` }],
          prompt: 'What rule do you propose?',
          options: [
            { text: `"Use any tool on the approved list. Whoever opens the pull request owns every line and can explain it; pull requests stay small; and client code or customer data never goes into an unapproved tool. In review, anyone can ask 'walk me through this', whoever wrote it."`,
              grade: 'best', meters: { team: 2, delivery: 2, trust: 1 },
              result: `The team agrees in ten minutes. Pull requests shrink, the juniors ask better questions, and review time drops.` },
            { text: `"Mark AI-written code with a comment, so reviewers know."`,
              grade: 'ok', meters: { delivery: 1 },
              result: `It helps reviewers look harder, but it does not make the author own the code, and the labels soon stop being used.` },
            { text: `"Use AI as much as you can; speed is what matters this quarter."`,
              grade: 'poor', meters: { delivery: -2, trust: -1 },
              result: `More code, faster, that fewer people understand. The next incident takes three hours to diagnose.` }
          ]
        }
      },
      debrief: {
        points: [
          `The author owns every line, however it was written. If they cannot explain it, it is not ready.`,
          `Keep pull requests small, whatever produced them; huge ones get rubber-stamped.`,
          `Banning the tools pushes their use into hiding; agreed standards keep the quality.`,
          `Make the data rule explicit: no client code or customer data in unapproved tools.`
        ],
        script: `> "The tools are fine; you own every line. Split this into four, and walk me through each part before review. If you can't explain a line, rewrite it until you can."`,
        analogy: `AI-written code is like a dependency pulled in from the internet: useful and fast, and you are responsible for what it does in production. Nobody would ship a library that no one on the team has read.`
      },
      links: ['lesson:ai-in-the-team', 'lesson:code-review-culture', 'phrase:eng-ai-pr', 'scenario:ai-makes-it-faster']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'on-call-one-hero',
      track: 'eng',
      title: `One person takes every page`,
      summary: `Asha, your most experienced engineer, has handled almost every night-time page for six months, and today she asked to come off on-call. Practise building a rotation the whole team can carry.`,
      keywords: ['on-call', 'on call', 'pager', 'burnout', 'rotation', 'alerts', 'runbook', 'hero', 'follow the sun', 'nights'],
      role: `You lead the payments team: five engineers in Pune and two in London.`,
      setting: `Asha has taken 31 of the last 40 night-time pages, because "she knows the system". Most were the same three alerts; two were real problems. This morning she said quietly: "I can't keep doing nights. I'm exhausted." Your two London colleagues are awake while Pune sleeps.`,
      stakes: `Lose Asha and you lose the person who knows the system best. Push others into on-call unprepared and the next incident runs for hours.`,
      start: 'asha',
      steps: {
        asha: {
          lines: [{ who: 'Asha', say: `I'm sorry. I know nobody else knows the settlement code.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"You've carried this for six months; thank you, and I'm sorry I let it go on this long. From tonight you're off nights for two weeks. I'll set up a proper rotation, and I'd like your help writing the runbooks so it doesn't depend on you."`,
              grade: 'best', meters: { team: 2, trust: 1 }, next: 'fix',
              result: `Asha looks relieved, and agrees to spend two afternoons on runbooks.` },
            { text: `"Can you hold on for one more month? We're in the middle of a release."`,
              grade: 'poor', meters: { team: -2 }, next: 'fix',
              result: `She agrees, and starts interviewing elsewhere the same week.` },
            { text: `"Of course. I'll take the nights myself for now."`,
              grade: 'ok', meters: { team: 1, delivery: -1 }, next: 'fix',
              result: `Kind, and you have just moved the hero problem to yourself, with less knowledge of the code.` }
          ]
        },
        fix: {
          lines: [{ narrate: `You look at the pages: 22 of the 40 came from three alerts, and nobody acted on 18 of those.` }],
          prompt: 'What do you set up?',
          options: [
            { text: `Fix or delete the three noisy alerts first; write runbooks for the top five; start a weekly rotation with a primary and a secondary, and two weeks of shadowing for newcomers; let London cover their daytime, which is Pune's night, with a written handover; and make sure the on-call allowance or comp-off really happens.`,
              grade: 'best', meters: { delivery: 2, team: 2 },
              result: `Night pages fall from 40 in six months to 9 in the next three, and five people now handle them. Asha rejoins the rotation, once every five weeks.` },
            { text: `Put everyone on a weekly rotation from Monday, as things are.`,
              grade: 'ok', meters: { delivery: -1, team: 1 },
              result: `Fairer, but the same noisy alerts now wake five people instead of one, and without runbooks they still phone Asha.` },
            { text: `Raise the alert thresholds so that fewer alerts fire.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `Fewer pages, including the two real ones. The next settlement failure is found by merchants in the morning.` }
          ]
        }
      },
      debrief: {
        points: [
          `A hero on-call is a single point of failure and a burnout waiting to happen. Thank them, then remove the dependency.`,
          `Fix the alerts first: page only for what is urgent, real and needs a person.`,
          `Runbooks, shadowing and a primary-plus-secondary rotation spread the load safely.`,
          `With onsite and offshore teams, let each side cover its own daytime, with a written handover.`
        ],
        script: `> "You've carried nights for six months; thank you. You're off nights from today. Let's fix the three noisy alerts, write runbooks for the top five, and start a rotation with London covering your night."`,
        analogy: `A hero on-call is a service with one replica that also takes all the traffic. It works until it doesn't, and then it fails at night. Replicas (a rotation), good health checks (alerts) and a runbook make it survivable.`
      },
      links: ['lesson:on-call', 'phrase:care-burnout', 'scenario:working-late-every-night', 'playbook:incident', 'term:toil']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'dora-league-table',
      track: 'eng',
      title: `DORA metrics per developer`,
      summary: `Your manager wants a monthly league table of developers by deployments and commits. Practise saying no to a harmful metric and offering a useful one.`,
      keywords: ['metrics', 'productivity', 'league table', 'commits', 'deployments', 'ranking', 'performance', 'goodhart'],
      role: `You lead a team of nine.`,
      setting: `Priya, your manager, has been reading about DORA metrics. She wants a dashboard ranking each developer by deployments, commits and lines changed, reviewed in a monthly meeting, "to see who is really contributing".`,
      stakes: `A league table would reward tiny deployments and discourage reviewing, pairing and helping. But Priya's real worry, that she cannot see the team's impact, is fair.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya', say: `It's objective data. Why wouldn't we use it?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I'd like better visibility too. DORA measures the team's delivery system, not individuals: deployments go through one pipeline, and the person who reviews or unblocks gets no commit for it. Ranked by commits, people will make more, smaller commits and help each other less. Can I show you our team's four DORA numbers every month instead, with what we are doing about the worst one?"`,
              grade: 'best', meters: { trust: 2, team: 2 }, next: 'offer',
              result: `Priya pauses. "OK. But I still need to know who is doing well." You agree to talk about that separately.` },
            { text: `"Sure, I'll set it up."`,
              grade: 'poor', meters: { trust: 1, team: -2 }, next: 'offer',
              result: `Within two months commits per person double, reviews slow down and nobody pairs. The numbers look great; delivery does not change.` },
            { text: `"That's a bad idea. Developers will hate it."`,
              grade: 'ok', meters: { trust: -1 }, next: 'offer',
              result: `True, and it sounds like protecting the team from scrutiny. Priya's worry is left unanswered.` }
          ]
        },
        offer: {
          lines: [{ who: 'Priya', say: `So how do I know who is performing?` }],
          prompt: 'What do you offer?',
          options: [
            { text: `"From what each person delivers and how: the outcomes they owned, the quality, how they help others, from their work, their reviews and their peers. I'll bring you that for each person at the quarterly review, with examples. The numbers stay at team level."`,
              grade: 'best', meters: { trust: 2, team: 1 },
              result: `Priya agrees. Over the quarter the team dashboard shows lead time falling from nine days to five, and she starts sharing it upwards.` },
            { text: `"Let's use velocity per person instead."`,
              grade: 'ok', meters: { team: -1 },
              result: `Velocity has the same problem, with inflation on top. Story points start to grow.` },
            { text: `"You'll have to trust my judgement."`,
              grade: 'poor', meters: { trust: -2 },
              result: `It asks for trust without giving her anything she can see or pass on.` }
          ]
        }
      },
      debrief: {
        points: [
          `DORA metrics describe a team's delivery system; they are not measures of individuals.`,
          `Ranking people by activity counts (commits, deployments, lines) makes the counts rise and the software worse: Goodhart's law.`,
          `Take the manager's worry seriously: offer team metrics with actions, and evidence about individuals from their work.`,
          `Compare a team with its own past, not with other teams.`
        ],
        script: `> "DORA measures our delivery system, not people. Ranked by commits, people commit more and help less. Can I bring you our four team numbers every month, with what we're doing about the worst one? For individuals, I'll bring outcomes and examples each quarter."`,
        analogy: `Ranking developers by commits is like ranking microservices by how many log lines they write: the noisiest one wins, and it tells you nothing about which one serves users.`
      },
      links: ['lesson:dora-metrics', 'phrase:eng-metrics-team', 'scenario:velocity-comparison', 'scenario:invisible-work', 'term:goodharts-law']
    }
  );
})(window.LELT);
