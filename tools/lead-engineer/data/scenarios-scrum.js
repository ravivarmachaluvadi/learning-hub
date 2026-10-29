/*
 * scenarios-scrum.js - Scrum scenarios: the stand-up, sprint planning under pressure, a silent
 * retro, velocity comparisons and the Definition of Done. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'standup-move-on',
      track: 'scrum',
      title: `"Same as yesterday, no blockers"`,
      summary: `For the third day, a developer gives the same update on a 2-day story. Practise the follow-up question instead of "OK, next".`,
      keywords: ['stand-up', 'standup', 'daily scrum', 'follow up', 'stuck', 'no blockers', 'same update', 'move on'],
      role: `You lead the team and run its daily stand-up; there's no separate Scrum Master.`,
      setting: `Day 6 of a 10-day sprint. Six developers, 15 minutes.`,
      stakes: `The sprint goal is "Customers can track their order on a map". The map story belongs to Anil, and it was estimated at 2 days.`,
      start: 'standup',
      steps: {
        standup: {
          lines: [
            { who: 'Anil, developer', say: `Yesterday I worked on the tracking map. Today I'll continue on the tracking map. No blockers.` },
            { narrate: `It's the third day Anil has said exactly this.` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `Ask one short, friendly follow-up: "Thanks, Anil. It's been 3 days on a 2-day story; what's left, and what would help it move? Shall we take 5 minutes after stand-up with Sameer?"`,
              grade: 'best', meters: { delivery: 2, team: 1 }, next: 'after',
              result: `Anil pauses, then says, "Yes, actually, that would help." A curious question, with help offered, makes it easy to admit being stuck.` },
            { text: `"OK, thanks. Next: Divya."`,
              grade: 'poor', meters: { delivery: -2, team: -1 }, next: 'day9',
              result: `The stand-up stays short, and the most important signal of the day goes unheard.` },
            { text: `"Anil, this is the third day you've said the same thing. What have you actually done?"`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'after',
              result: `The right concern, the wrong place and tone. In front of the team it sounds like an accusation; Anil goes red, and everyone learns that being stuck gets you questioned in public.` },
            { text: `Message Anil privately after the stand-up: "How's the map going?"`,
              grade: 'ok', meters: { delivery: 1 }, next: 'after',
              result: `Kind, and private is fine, but "how's it going?" invites "fine". Ask what's left and offer help. And a story stuck for 3 days is the team's problem too: the stand-up is where the team should notice it.` }
          ]
        },
        after: {
          lines: [{ narrate: `After stand-up, Anil admits that the map library doesn't work through the company proxy. He's been trying configurations for 3 days and didn't want to admit he was stuck.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Thank him for saying it, pair him with Sameer (who fixed a proxy problem last year) for the next hour, and check back at 3 pm. Later, without naming Anil, suggest a team rule: "Stuck for more than half a day? Say so at stand-up."`,
              grade: 'best', meters: { delivery: 2, team: 2 },
              result: `Sameer and Anil fix it in 40 minutes. The team agrees the half-day rule at the next retro; over the following weeks, people start saying "I'm stuck" out loud.` },
            { text: `Fix it yourself tonight so the sprint is safe.`,
              grade: 'poor', meters: { delivery: 1, team: -2 },
              result: `The sprint is safe, and Anil learns that being stuck means the lead takes your work away. Next time he'll hide it longer.` },
            { text: `Tell him to raise a ticket with the network team.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Maybe part of the fix, but a ticket can take days, and there's someone on your own team who has solved this before.` }
          ]
        },
        day9: {
          lines: [{ narrate: `Day 9. Anil says, "Still on the map. A small issue with the proxy." The sprint review is tomorrow, and the sprint goal won't be met.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Swarm: you and Sameer pair with Anil now, and you tell the Product Owner today that the goal is at risk. In the retro, look at why a 3-day block went unnoticed, without blaming Anil.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `The goal may still slip, but nobody is surprised at the review, and the retro gives the team a chance to fix how it notices stuck work.` },
            { text: `Mark the story as carried over and say nothing until the review.`,
              grade: 'poor', meters: { trust: -2, delivery: -1 },
              result: `The Product Owner finds out in front of stakeholders. Nobody learns anything about why the sprint failed.` },
            { text: `Tell Anil, in front of everyone, that he should have said so earlier.`,
              grade: 'poor', meters: { team: -2 },
              result: `True, and pointless now. It also teaches everyone else to hide problems more carefully.` }
          ]
        }
      },
      debrief: {
        points: [
          `The Daily Scrum is for the developers to inspect progress toward the Sprint Goal, not a round of reports to the lead. Listen for work that isn't moving.`,
          `"Same as yesterday, no blockers" two days running is a signal. Ask: What's left? What would help it move? What do you need from me?`,
          `Ask with curiosity, not accusation. People hide being stuck when being stuck feels like failing.`,
          `Take the detail out of the stand-up: "let's take 5 minutes after, with Sameer". Keep the stand-up to 15 minutes.`,
          `Make asking for help normal: agree a team rule such as "stuck for half a day? Say so."`
        ],
        script: `> "Thanks, Anil. It's been 3 days on a 2-day story. What's left, and what would help it move? Let's take 5 minutes right after stand-up with Sameer."`,
        analogy: `"Still working on it, no blockers" for three days is a heartbeat with no progress counter: the process is alive, but is it doing anything? A good stand-up checks progress (what moved), not just liveness (who's here).`
      },
      links: ['lesson:daily-scrum', 'phrase:standup-followup', 'phrase:standup-blocker', 'scenario:standup-runs-long', 'scenario:quiet-junior']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'standup-runs-long',
      track: 'scrum',
      title: `The stand-up that became a design meeting`,
      summary: `Two developers start a design debate 12 minutes into stand-up while others wait. Practise the parking lot.`,
      keywords: ['stand-up', 'standup', 'daily scrum', 'too long', 'parking lot', 'debate', 'timebox', '15 minutes'],
      role: `You lead the team and run its stand-up.`,
      setting: `Stand-up starts at 10:00. It's 10:12, and three people haven't spoken yet.`,
      stakes: `Sameer and Divya are debating whether to cache product prices in Redis or in the database. The other four are waiting; one has joined from a client site and must leave at 10:15.`,
      start: 'debate',
      steps: {
        debate: {
          lines: [
            { who: 'Sameer', say: `Redis is the obvious choice for a cache, the database will never keep up during the sale…` },
            { who: 'Divya', say: `But then prices can be stale for minutes. Finance will kill us if a customer pays the old price…` }
          ],
          prompt: 'What do you do?',
          options: [
            { text: `"This is an important one, so let's give it proper time: Sameer, Divya and I right after stand-up. Who's next?" Write it in the parking lot.`,
              grade: 'best', meters: { delivery: 1, team: 1 }, next: 'parking',
              result: `The last three updates take 2 minutes. One of them is a blocker that would otherwise have been missed.` },
            { text: `Let them finish; it's a good technical discussion.`,
              grade: 'poor', meters: { delivery: -1, team: -2 }, next: 'late',
              result: `It is a good discussion. It just isn't a stand-up any more.` },
            { text: `Decide on the spot: "Use Redis. Moving on."`,
              grade: 'ok', meters: { delivery: 1, team: -2 },
              result: `The stand-up moves on, but you shut down a real design question in ten seconds, and Divya's point about stale prices may be the one that matters. People stop raising concerns when they're overruled this fast.` },
            { text: `Cancel the rest of the stand-up and ask everyone to post updates in chat.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `The debate wins, the team loses its 15 minutes together, and chat updates are read by nobody.` }
          ]
        },
        parking: {
          lines: [{ narrate: `After stand-up, the three of you talk for 20 minutes. The question is real: the price cache affects every checkout.` }],
          prompt: 'How do you close it?',
          options: [
            { text: `Agree that Divya writes a one-page comparison (latency, staleness, cost) by tomorrow, the three of you decide on Thursday, and the decision goes in the team's decision log.`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `A small, fast process for a decision that matters: written options, a decision date, and a record. Divya's concern gets a fair hearing, and so does Sameer's.` },
            { text: `Let Sameer decide, as the most senior.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Quick, and Sameer may be right, but seniority isn't a reason. Divya learns that her concerns lose by default.` },
            { text: `Leave it open; it'll come up again.`,
              grade: 'poor', meters: { delivery: -2 },
              result: `It will come up again: in next week's stand-up.` }
          ]
        },
        late: {
          lines: [{ narrate: `10:25. The debate ends without a decision. Two people had to leave for other meetings before giving their update, and one of them was blocked.` }],
          prompt: 'What do you change?',
          options: [
            { text: `Propose to the team: a strict 15-minute timebox, a visible parking lot, and a rule that any discussion longer than a minute gets parked. Ask the team to agree it, so it's their rule, not yours.`,
              grade: 'best', meters: { delivery: 1, team: 2 },
              result: `The team agrees it in the retro. Next time it's Sameer himself who says "park it".` },
            { text: `Make the stand-up 30 minutes.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `The debates expand to fill the extra time, and everyone loses 15 more minutes a day.` },
            { text: `Ask the two of them to keep debates for after the stand-up next time.`,
              grade: 'ok', meters: { team: 1 },
              result: `Helps with this pair, but it's a team habit. Without an agreed rule, the next debate will do the same.` }
          ]
        }
      },
      debrief: {
        points: [
          `The Daily Scrum is 15 minutes (2020 Scrum Guide). Its job is to spot problems, not to solve them.`,
          `Park anything longer than a minute: name it, name who needs to be there, and do it right after.`,
          `A parking lot only works if it's visible and actually happens. Write it down, and stay behind for it.`,
          `Don't decide design questions on the spot to save time. Give the decision a small, quick process: a one-page comparison and a decision date.`,
          `Let the team own the rules of its stand-up. Rules people agree to are rules they keep.`
        ],
        script: `> "This one matters, so let's give it proper time. Sameer, Divya and I will take it right after stand-up. Parking lot: price cache, Redis or the database. Who's next?"`,
        analogy: `A stand-up is a health check endpoint, not a debugging session. If your health check starts doing real work, every caller waits behind it and timeouts cascade. Keep it fast; move the diagnosis to a separate call.`
      },
      links: ['lesson:daily-scrum', 'phrase:standup-park', 'phrase:meeting-outcome', 'scenario:standup-move-on', 'term:parking-lot']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'sprint-planning-overcommit',
      track: 'scrum',
      title: `"Let's be ambitious: 60 points"`,
      summary: `Your manager wants 60 points in a sprint when the team finishes about 38. Practise planning from data under pressure.`,
      keywords: ['sprint planning', 'overcommit', 'capacity', 'velocity', 'stretch', 'ambitious', 'manager pressure', 'points'],
      role: `You lead the team, in sprint planning with Neha (the Product Owner) and the developers.`,
      setting: `Over the last three sprints the team finished 38, 41 and 36 points. Two developers are on leave for 3 days each this sprint.`,
      stakes: `Neha has a launch in 3 weeks. Priya, your manager, is attending planning today.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Priya, your manager', say: `Let's be ambitious this sprint. The team can stretch to 60, right?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Let's look at the numbers first. We've finished 36 to 41 points in each of the last three sprints, and we have 6 fewer developer-days this time, so 32 to 35 is realistic. Neha, which 35 points matter most for the launch? We can list the next 10 as stretch, if we finish early."`,
              grade: 'best', meters: { trust: 2, delivery: 2, team: 1 }, next: 'goal',
              result: `The data makes the point so you don't have to argue. Priya nods: "Fair, and list the stretch items." Neha starts choosing.` },
            { text: `"OK, we'll stretch to 60."`,
              grade: 'poor', meters: { trust: -1, delivery: -2, team: -2 }, next: 'end',
              result: `Everyone leaves planning happy. The plan has 60 points of work and about 35 points of people.` },
            { text: `"The team decides what it can do; managers shouldn't push points."`,
              grade: 'ok', meters: { trust: -2, team: 1 },
              result: `The principle is right: in Scrum, the developers select how much they take on. But said like this, in front of the team, it embarrasses Priya. Let the data make the point for you.` },
            { text: `"Let's say 45, as a compromise."`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `Splitting the difference between your data and a wish isn't planning. You'll still miss, just by less.` }
          ]
        },
        goal: {
          lines: [{ narrate: `Neha picks 35 points for the launch.` }],
          prompt: 'What else does a good sprint plan need before the team commits?',
          options: [
            { text: `A one-sentence Sprint Goal ("Customers can pay with saved cards at checkout") so the team can trade stories mid-sprint without losing what matters, and a check that every story has acceptance criteria.`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `With a goal, a surprise on day 5 becomes a quick decision ("drop the stretch story, keep the goal") instead of a crisis.` },
            { text: `Assign every story to a developer now, so everyone knows their work.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `Some teams do this, but assigning everything up front stops people swarming on what's most important when something gets stuck. Let developers pull work; the goal is shared.` },
            { text: `Nothing else. The list of stories is the plan.`,
              grade: 'poor', meters: { delivery: -1 },
              result: `Without a goal, every story looks equally important when something has to give.` }
          ]
        },
        end: {
          lines: [
            { narrate: `The sprint ends with 39 points done out of 60. Three stories are half-finished.` },
            { who: 'Priya', say: `Why did the team miss the sprint?` }
          ],
          prompt: 'What do you say?',
          options: [
            { text: `"The team delivered 39, which is our normal pace even with two people on leave. The miss was in planning: I agreed to 60 when our data said 35. Next sprint I'll plan from our numbers, with stretch items listed separately."`,
              grade: 'best', meters: { trust: 2, team: 2 },
              result: `You protected the team from a false story about their performance, and owned your part. Priya agrees to plan from data next time.` },
            { text: `"The team was slow this sprint."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `They weren't: 39 is their normal pace. Blaming them for your plan is unfair, and they'll hear about it.` },
            { text: `"There were a lot of unexpected issues."`,
              grade: 'ok', meters: { trust: -1 },
              result: `Vague, and not the real reason. Priya will plan 60 again next sprint.` }
          ]
        }
      },
      debrief: {
        points: [
          `Plan from data: the work the team actually finished in recent sprints, adjusted for leave and holidays.`,
          `In Scrum, the developers select how much they can take on. A manager's wish is a target, not a plan.`,
          `Answer pressure with numbers and a choice: "Realistic is 35; which 35 matter most?"`,
          `Agree a one-sentence Sprint Goal. It lets the team trade stories mid-sprint without losing what matters.`,
          `List stretch items separately. Finishing early and pulling more feels better than missing a target nobody believed in.`
        ],
        script: `> "Our last three sprints finished 36 to 41 points, and we have 6 fewer developer-days this time, so 32 to 35 is realistic. Neha, which 35 points matter most for the launch? We'll keep the next 10 as stretch."`,
        analogy: `Sizing a sprint is like sizing a thread pool: set it from measured throughput, not from the load you wish it could take. Overcommit and you get queueing and context switching, and throughput goes down.`
      },
      links: ['lesson:sprint-planning', 'lesson:points-velocity', 'phrase:planning-data', 'scenario:velocity-comparison']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'retro-silent',
      track: 'scrum',
      title: `The silent retro`,
      summary: `You ask "what went well, what didn't?" and nobody speaks. Practise running a retrospective people actually take part in.`,
      keywords: ['retro', 'retrospective', 'silent', 'nobody speaks', 'psychological safety', 'actions', 'improvement'],
      role: `You lead the team and facilitate its retrospective; there's no Scrum Master.`,
      setting: `The sprint missed its goal. You ask, "So, what went well and what didn't?" Silence. Three of the six people have their cameras off.`,
      stakes: `The team has real problems: unclear stories, a flaky test suite, and pull requests waiting days for review. If nobody speaks, nothing changes, and the next sprint will look the same.`,
      start: 'silence',
      steps: {
        silence: {
          lines: [{ narrate: `Ten seconds of silence feels like a minute.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Change the format: 3 minutes of silent writing on a shared board (Start / Stop / Continue), anonymous notes allowed, then group them and vote on the top two. Go first yourself: "I said yes to too many stories at planning."`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'topic',
              result: `Twenty-three notes in three minutes. People who never speak in meetings write some of the most useful ones.` },
            { text: `Fill the silence yourself: list what you think went wrong.`,
              grade: 'poor', meters: { team: -2 },
              result: `Now it's your retro, not theirs. The team nods, agrees with the lead, and keeps the real problems to themselves.` },
            { text: `Ask each person in turn to say one thing.`,
              grade: 'ok', meters: { team: 1 }, next: 'topic',
              result: `Everyone speaks, which beats silence, but people put on the spot say safe things ("communication could be better"). Silent writing first gets more honest input. Still, one note stands out.` },
            { text: `End the retro early; people seem busy.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `The team learns that retros don't matter. The same problems will be there next sprint.` }
          ]
        },
        topic: {
          lines: [{ narrate: `The top-voted note: "PRs wait 2 to 3 days for review." Everyone knows reviews pile up with Sameer, the most senior developer, who is on the call.` }],
          prompt: 'How do you handle it?',
          options: [
            { text: `Talk about the system, not the person: "What would get PRs reviewed within a day?" Let the team propose (any two developers can approve, smaller PRs, a daily review slot) and agree one change, with an owner and a date to check it.`,
              grade: 'best', meters: { delivery: 2, team: 2 }, next: 'actions',
              result: `Sameer himself suggests that anyone can approve routine PRs. The bottleneck is fixed without anyone being blamed in public.` },
            { text: `"Sameer, you need to review faster."`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'actions',
              result: `Public blame in a retro makes this the last honest retro. If Sameer's habits need feedback, that's a private 1:1.` },
            { text: `Skip it; it's sensitive.`,
              grade: 'ok', meters: { delivery: -1, team: -1 }, next: 'actions',
              result: `It's the team's top-voted problem. Skipping it tells them that voting doesn't matter.` }
          ]
        },
        actions: {
          lines: [{ narrate: `Ten minutes left.` }],
          prompt: 'How do you end the retro?',
          options: [
            { text: `Pick at most 2 actions, each with an owner and a check date, put them on the next sprint's board, and open the next retro by checking them.`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `Two weeks later, the next retro opens with: "Did PRs get reviewed within a day? Mostly yes." The team sees that retros change things.` },
            { text: `Record all 9 improvement ideas as actions.`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `Nine actions means none get done. The team will notice at the next retro.` },
            { text: `Send the notes to everyone and move on.`,
              grade: 'poor', meters: { delivery: -1 },
              result: `Notes without owners are a list of complaints in a shared folder.` }
          ]
        }
      },
      debrief: {
        points: [
          `Silence in a retro usually means it doesn't feel safe or doesn't feel worth it. Change the format before blaming the people.`,
          `Start with silent writing, then group and vote. Quiet people contribute; loud people don't dominate.`,
          `Go first with your own mistake. If the lead can admit one, others can.`,
          `Discuss the system ("how do PRs get reviewed within a day?"), never a person, in a group. Personal feedback belongs in a 1:1.`,
          `Leave with 1 or 2 actions, each with an owner, on the next sprint's board. Check them at the start of the next retro.`
        ],
        script: `> "Let's try something different. Take 3 minutes to write on the board, silently: what should we start, stop and continue? Anonymous is fine. I'll go first: I said yes to too many stories at planning, and I'll stop doing that."`,
        analogy: `A retro is a blameless postmortem for the sprint. You'd never run an incident review by asking "whose fault?", because people would hide the facts and the system would never improve.`
      },
      links: ['lesson:review-and-retro', 'phrase:retro-first', 'phrase:mistake-postmortem', 'scenario:vague-updater']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'velocity-comparison',
      track: 'scrum',
      title: `"Why is your velocity half of theirs?"`,
      summary: `A new director compares your team's velocity with another team's. Practise explaining what velocity is for, and offering a fair alternative.`,
      keywords: ['velocity', 'story points', 'compare teams', 'productivity', 'metrics', 'dora', 'director'],
      role: `You lead Team Phoenix.`,
      setting: `A monthly review with Rahul, a new director. Team Falcon shows a velocity of 70 points a sprint; yours is 38.`,
      stakes: `Rahul wants a simple way to compare teams. Your team will hear how this conversation went.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Rahul, director', say: `Falcon does 70 points a sprint and you do 38. Why is your team half as productive?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Points aren't comparable between teams: each team sizes its own work, so 70 and 38 are in different units, like prices in rupees and dollars. To compare delivery, I'd use things both teams measure the same way: how often we release, how long a change takes to reach customers, and how often releases fail. I can bring those for both teams next week."`,
              grade: 'best', meters: { trust: 2, team: 2 }, next: 'measures',
              result: `You corrected the misunderstanding without attacking Falcon, and offered something better. Rahul is interested: he wanted comparison, not points specifically.` },
            { text: `"We'll try to increase our velocity."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'inflate',
              result: `You accepted the comparison as valid, and set velocity as a target.` },
            { text: `"Our stories are harder than theirs."`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `Possibly true, but it sounds defensive and can't be proven with points. Rahul files it under "excuses".` },
            { text: `"Falcon inflates its points."`,
              grade: 'poor', meters: { trust: -2 },
              result: `Even if it's true, attacking another team in a review makes you look like the problem.` }
          ]
        },
        measures: {
          lines: [{ who: 'Rahul', say: `OK. But I still need something to show leadership.` }],
          prompt: 'What do you offer?',
          options: [
            { text: `"Let's use four delivery measures for every team: how often we deploy, the time from commit to production, the share of deployments that cause a failure, and the time to recover. Plus, for each team, the outcomes it delivered this quarter. That's a fair comparison."`,
              grade: 'best', meters: { trust: 2, delivery: 1 },
              result: `These are the four DORA measures from the *Accelerate* research. Rahul adopts them for all teams, and points go back to being a planning tool.` },
            { text: `"Each team can present what it shipped."`,
              grade: 'ok', meters: { trust: 1 },
              result: `Outcomes matter most, but leadership will also want something consistent across teams. Add a few shared measures.` },
            { text: `"There's no way to measure engineering productivity."`,
              grade: 'poor', meters: { trust: -2 },
              result: `It sounds like you don't want to be measured. Rahul will pick a measure himself, probably points.` }
          ]
        },
        inflate: {
          lines: [{ narrate: `Next sprint, the team (who heard about the comparison) estimates everything higher. Velocity jumps to 55. Nothing more is delivered.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Tell Rahul plainly: the points went up because the estimates went up, not because more was delivered. Propose the delivery measures instead.`,
              grade: 'best', meters: { trust: 2 },
              result: `An awkward conversation that makes you the most trusted lead in the room. When a measure becomes a target, it stops being a good measure; you just showed Rahul why.` },
            { text: `Present the 55 as an improvement.`,
              grade: 'poor', meters: { trust: -2 },
              result: `It's not true, and when Rahul notices nothing more shipped, every number you give him becomes suspect.` },
            { text: `Quietly ask the team to go back to the old way of estimating.`,
              grade: 'ok', meters: { trust: -1, team: 1 },
              result: `The numbers become honest again, but Rahul still believes points measure productivity. The next lead will face the same comparison.` }
          ]
        }
      },
      debrief: {
        points: [
          `Story points are a team's own planning tool. Each team sizes its own work, so points can't be compared between teams.`,
          `When velocity becomes a target, it inflates: estimates grow and nothing more is delivered (Goodhart's law).`,
          `Velocity and story points aren't in the Scrum Guide; they're one way of forecasting, nothing more.`,
          `Offer measures that work across teams: deployment frequency, lead time for changes, change failure rate and time to restore service (the four DORA measures), plus the outcomes delivered.`,
          `Defend your team without attacking the other team.`
        ],
        script: `> "Points aren't comparable across teams: each team sizes its own work, so 70 and 38 are in different units. If we want to compare delivery, let's use what both teams measure the same way: how often we release, how long a change takes to reach customers, and how often a release fails. I'll bring those for both teams next week."`,
        analogy: `Comparing velocity across teams is like comparing two services' "units of work per second" when each defines its own unit. Compare what's measured the same way everywhere, like latency and error rate.`
      },
      links: ['lesson:points-velocity', 'term:velocity', 'term:dora-metrics', 'scenario:sprint-planning-overcommit']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'not-done-at-review',
      track: 'scrum',
      title: `"It's basically done, let's demo it"`,
      summary: `The Product Owner wants to demo and close a story that has no tests yet. Practise holding the Definition of Done under pressure.`,
      keywords: ['definition of done', 'done', 'sprint review', 'demo', 'not done', 'tests', 'quality'],
      role: `You lead the team, preparing for tomorrow's sprint review.`,
      setting: `The "Order cancellation" story has its code merged, but there are no tests for the refund edge cases, and it hasn't been deployed to the test environment.`,
      stakes: `Neha, the Product Owner, promised a stakeholder a demo of order cancellation.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Neha, Product Owner', say: `Cancellation is basically done, right? Let's demo it tomorrow and mark it done. The stakeholders are expecting it.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Not yet: it doesn't meet our Definition of Done. The refund edge cases have no tests and it isn't on the test environment. In the review, let's say plainly where it stands and that it'll be Done in the first 2 days of next sprint. I'd rather say that than find a refund bug in production."`,
              grade: 'best', meters: { trust: 2, delivery: 2 }, next: 'review',
              result: `Neha is disappointed, but she'd rather explain a two-day delay than a double refund. You helped her with what to tell the stakeholders.` },
            { text: `"Sure, mark it done; we'll add the tests later."`,
              grade: 'poor', meters: { trust: -1, delivery: -2 }, next: 'bug',
              result: `"Later" for tests usually means never, and this is payment code.` },
            { text: `"Let's demo it, with a warning that it's not finished."`,
              grade: 'ok', meters: { trust: 1 }, next: 'review',
              result: `Honest, which is the main thing. But the 2020 Scrum Guide says work that doesn't meet the Definition of Done isn't presented at the review: a demo invites feedback and expectations on something that may still change. Talk about progress; demo only Done work. Neha agrees to just describe it.` },
            { text: `Rush the tests tonight and deploy at midnight so it can be demoed.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `Tests written at midnight to hit a demo test the happy path. The team is exhausted for the review, and the edge cases are still untested.` }
          ]
        },
        review: {
          lines: [
            { narrate: `In the review, Neha explains that cancellation will be ready next Tuesday.` },
            { who: 'A stakeholder', say: `Why isn't it done? It looked nearly finished last week.` }
          ],
          prompt: 'Who answers, and how?',
          options: [
            { text: `You add one sentence: "The code is written; we found refund cases that need tests, and we don't ship payment changes without them. It'll be in production by Tue 17 Nov."`,
              grade: 'best', meters: { trust: 2 },
              result: `One sentence, a reason anyone understands, and a date. The stakeholder nods; "we don't ship payment changes without tests" is hard to argue with.` },
            { text: `Let Neha handle it alone; it's her review.`,
              grade: 'ok', meters: { trust: -1 },
              result: `The Product Owner leads the review, but you're the one who can give the technical reason in a sentence. Silence leaves her defending a decision you made together.` },
            { text: `Explain the refund edge cases in technical detail for five minutes.`,
              grade: 'poor', meters: { trust: -1 },
              result: `The stakeholders' eyes glaze over. Detail is for anyone who asks afterwards; the answer is one sentence and a date.` }
          ]
        },
        bug: {
          lines: [{ narrate: `Cancellation is marked done. Next sprint, a customer cancels an order paid partly by gift card and is refunded twice. Finance escalates.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Fix it first. Then, in the retro, agree to hold the Definition of Done even under demo pressure, and add "tests for payment edge cases" to it explicitly.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `The bug is fixed in a day, and the team's Definition of Done gets stronger exactly where it was weak.` },
            { text: `Blame QA for missing it.`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `QA never saw it: it skipped the test environment. Blame hides the real cause, which was the decision to mark it done.` },
            { text: `Fix it quietly and move on.`,
              grade: 'ok', meters: { trust: -1, delivery: 1 },
              result: `The bug is gone, but nothing changes. The next demo will bring the same pressure and the same shortcut.` }
          ]
        }
      },
      debrief: {
        points: [
          `"Done" means it meets the Definition of Done: tested, reviewed, deployable. "Basically done" isn't done.`,
          `In the 2020 Scrum Guide, work that doesn't meet the Definition of Done isn't released or presented at the Sprint Review; it goes back to the Product Backlog.`,
          `Hold the Definition of Done hardest when the pressure is highest: that's when shortcuts cause production bugs.`,
          `Help the Product Owner tell stakeholders the truth: where it stands, why, and when it'll be Done.`
        ],
        script: `> "It's not Done yet: the refund edge cases have no tests and it isn't on the test environment. Let's tell the stakeholders where it stands and that it'll be in production by Tuesday. I'd rather say that than find a double refund in production."`,
        analogy: `Marking a story done without tests is merging to main with a red build "because the demo is tomorrow". It moves the cost from today to an incident later, with interest.`
      },
      links: ['lesson:definition-of-done', 'lesson:review-and-retro', 'term:definition-of-done']
    }
  );
})(window.LELT);
