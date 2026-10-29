/*
 * scenarios-people.js - people management scenarios: a developer whose updates are vague, and a
 * quiet junior who struggles alone. Format: see scenarios-pm.js.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'vague-updater',
      track: 'people',
      title: `The developer whose updates say nothing`,
      summary: `A capable developer always says "should be done soon", and the team can't plan around her work. Practise feedback that changes the habit without humiliating anyone.`,
      keywords: ['vague updates', 'poor updates', 'feedback', '1:1', 'one on one', 'developer', 'communication', 'dates'],
      role: `You lead a team of six.`,
      setting: `Divya, a capable mid-level developer, gives updates like "working on the payment stuff, should be done soon". Others have started complaining that they can't plan around her work.`,
      stakes: `Divya's code is good. Handle this badly and she feels singled out; ignore it and the team stops trusting her updates.`,
      start: 'where',
      steps: {
        where: {
          lines: [{ narrate: `Anil mentions, a bit irritated, that he waited two days for Divya's payment work before he could start the integration.` }],
          prompt: 'Where do you start?',
          options: [
            { text: `In your next 1:1, in private: describe one specific example and its effect, and ask for her view first.`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'open',
              result: `Private, specific and curious: the three things that make feedback land.` },
            { text: `In stand-up, when she next says "should be done soon", ask in front of everyone: "When exactly?"`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'public',
              result: `You get a date, and Divya gets embarrassed in front of her peers.` },
            { text: `Send the whole team a message about how to write good updates.`,
              grade: 'ok', meters: { team: 1 }, next: 'open',
              result: `Raising the standard for everyone is useful, and it avoids singling anyone out, but a general message rarely changes one person's habit. Divya may not even see herself in it. You still need the 1:1.` },
            { text: `Do nothing: her code is good, and that's what matters.`,
              grade: 'poor', meters: { delivery: -2, team: -1 },
              result: `Good code nobody can plan around delays everyone else. And Anil learns that raising a problem with you changes nothing.` }
          ]
        },
        open: {
          lines: [{ narrate: `You're in the 1:1 with Divya.` }],
          prompt: 'How do you open the conversation?',
          options: [
            { text: `"In Tuesday's stand-up you said the payment work would be done soon, and Anil waited two days to start the integration because he couldn't plan around it. I want your updates to help people plan. What makes it hard to give a date?"`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'reason',
              result: `A specific moment, its effect on someone, what you want, and a real question. Divya can't argue with Tuesday, and she doesn't feel attacked.` },
            { text: `"Your updates are always vague. You need to be more professional."`,
              grade: 'poor', meters: { team: -2 }, next: 'reason',
              result: `"Always" and "professional" are judgments, not facts. Divya gets defensive and spends the conversation disagreeing with the label instead of hearing the problem.` },
            { text: `"Could you be a bit more specific in your updates?"`,
              grade: 'ok', meters: { team: 1 }, next: 'reason',
              result: `Polite, but so soft that it's easy to agree and change nothing. Without an example and its effect, she can't see why it matters.` }
          ]
        },
        reason: {
          lines: [{ who: 'Divya', say: `Honestly, I don't like giving a date and then missing it. Last year my old lead shouted at me in front of a client for missing one.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"That sounds rough, and it won't happen here. A date with a range is fine, and changing it early is fine: 'Thursday, maybe Friday if the bank's API misbehaves; I'll know by Wednesday.' What I need is the earliest warning, not a perfect guess." Then agree to try it for two weeks and check in.`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `The vagueness was fear, not carelessness, and you removed the fear. Two weeks later her updates have dates and ranges, and she flags a slip a day early.` },
            { text: `"I understand, but you still need to give dates."`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `True, but it skips over what she just told you. Without making a missed date safe, she'll keep hedging.` },
            { text: `"That was your old lead; it's not relevant now."`,
              grade: 'poor', meters: { team: -2 },
              result: `It's very relevant: it's the reason. Dismissing it tells her this lead doesn't listen either.` }
          ]
        },
        public: {
          lines: [{ narrate: `Divya goes quiet: "Soon. Wednesday, I guess." After stand-up she messages you: "Did I do something wrong?"` }],
          prompt: 'What do you reply?',
          options: [
            { text: `"No, and I'm sorry if that felt like I was putting you on the spot. Can we talk for 15 minutes today? I'd like to understand what makes dates hard, and agree how updates can help the team plan."`,
              grade: 'best', meters: { delivery: 1, team: 1 },
              result: `You repaired it quickly and moved the real conversation to where it belongs: private.` },
            { text: `"It's just that your updates are always vague."`,
              grade: 'poor', meters: { team: -2 },
              result: `Now she's been criticised twice, once in public and once with a label.` },
            { text: `"Nothing, don't worry about it."`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Kind, but now nothing changes, and she still doesn't know what you expect.` }
          ]
        }
      },
      debrief: {
        points: [
          `Correct a person in private; set team standards in public.`,
          `Use a specific example and its effect on others ("Anil waited two days") instead of a label ("you're always vague").`,
          `Ask before you tell: "What makes it hard to give a date?" The reason is often fear, not carelessness.`,
          `Make honest uncertainty safe: a range, plus an early warning when it changes, beats a confident guess.`,
          `Agree one small change and a time to check how it's going.`
        ],
        script: `> "In Tuesday's stand-up you said the payment work would be done soon, and Anil waited two days because he couldn't plan around it. I want your updates to help people plan. What makes it hard to give a date? A range is fine, and so is changing it early."`,
        analogy: `A label like "you're vague" is a stack trace with no line numbers: maybe true, but nobody can fix it. A specific example with its effect ("Tuesday; Anil waited two days") is the line number.`
      },
      links: ['phrase:feedback-specific', 'phrase:feedback-ask-first', 'phrase:feedback-private', 'scenario:standup-move-on', 'tool:status']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'quiet-junior',
      track: 'people',
      title: `The junior who never asks`,
      summary: `A new graduate says "no blockers" every day but rewrote a small change three times. Practise making it safe and cheap to ask for help.`,
      keywords: ['junior', 'new joiner', 'fresher', 'quiet', 'ask for help', 'stuck', 'mentoring', 'onboarding'],
      role: `You lead the team.`,
      setting: `Karthik joined two months ago, straight from college. He says "No blockers" every day. Today you notice his pull request for a small validation change was opened 4 days after he started, and his commits show he rewrote it three times.`,
      stakes: `Karthik is capable but quiet. If he keeps struggling alone he'll be slow, unhappy, and may leave within the year. Push too hard and he may withdraw further.`,
      start: 'notice',
      steps: {
        notice: {
          lines: [{ narrate: `The validation change was estimated at half a day.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Ask him for a quick chat, curious rather than critical: "I saw you rewrote the validation three times; that's real effort. What was tricky about it?"`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'talk',
              result: `Starting with the effort he put in, not the time it took, makes it safe for him to be honest.` },
            { text: `Give his next task to someone faster.`,
              grade: 'poor', meters: { delivery: 1, team: -2 },
              result: `Faster this sprint. Karthik learns nothing, feels sidelined, and starts updating his CV.` },
            { text: `Say it in stand-up: "Karthik, please ask if you're stuck!"`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'talk',
              result: `The message is right, but saying it in front of everyone may embarrass him. He nods, and asks nothing. Later you take him aside.` },
            { text: `Approve the PR and say nothing; he'll learn on his own.`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `He may, slowly and alone. Four days for half a day's work is a pattern worth a five-minute conversation.` }
          ]
        },
        talk: {
          lines: [{ who: 'Karthik', say: `I didn't want to disturb the seniors with simple questions. Everyone looked busy, and I thought I should figure it out myself.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Make asking normal and cheap: "Asking is part of the job. Rule of thumb: stuck for more than an hour, ask." Make Divya his go-to person for a month, and in stand-up, ask for help yourself sometimes, so he sees it's normal.`,
              grade: 'best', meters: { delivery: 2, team: 2 },
              result: `A clear rule, a named person, and seniors visibly asking for help. Within two weeks Karthik's PRs arrive in a day, with better questions in them.` },
            { text: `"You should always ask if you're stuck."`,
              grade: 'ok', meters: { team: 1 },
              result: `True, but "always ask" is easy to say and hard for a new, quiet person to do. Give a concrete rule (one hour), a named person to ask, and show that seniors ask too.` },
            { text: `"Seniors are busy; try Stack Overflow first."`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `You just confirmed his fear. He'll keep struggling alone, now with your permission.` }
          ]
        }
      },
      debrief: {
        points: [
          `"No blockers" from a new joiner often means "I don't know I'm allowed to have blockers". Look for other signals: slow PRs, rewrites, late-night commits.`,
          `Open with curiosity about the work, not criticism of the speed.`,
          `Make asking cheap: a time rule ("stuck for an hour? ask"), a named buddy, and seniors (you included) asking for help in public.`,
          `Juniors who struggle alone are slow and unhappy; juniors who ask grow fast. The difference is mostly the team's culture, which you set.`
        ],
        script: `> "I saw you rewrote the validation three times; that's real effort. What was tricky about it? … Here's a rule for this team: stuck for more than an hour, ask. Divya is your go-to person this month, and nobody here thinks asking is a nuisance."`,
        analogy: `A junior who never asks is a thread spinning on a lock it can't get: 100% busy and making no progress. A one-hour rule is the timeout that makes it back off and ask for the resource.`
      },
      links: ['phrase:help-ask-early', 'phrase:oneone-open', 'scenario:standup-move-on', 'lesson:daily-scrum']
    }
  );
})(window.LELT);
