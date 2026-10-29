/*
 * scenarios-people-2.js - people management scenarios added in batch 4: the first 1:1s, cancelled
 * 1:1s, the peer who wanted your job, missed commitments, a harsh reviewer, a design argument that
 * got personal, a resignation, a new joiner with nothing ready, a rating conversation, burnout,
 * delegated work gone wrong, "you don't trust me", feedback for an older colleague, "when will I be
 * promoted?", a junior who broke production, a merged team storming, a family emergency in release
 * week, and "the interesting work always goes to Divya".
 *
 * Same entry format as scenarios-pm.js (see the top of that file). Each decision has 3 or 4 options
 * and exactly one "best"; meters move from -2 to +2 per choice.
 */
(function (U) {
  'use strict';
  U.data.scenarios = U.data.scenarios || [];
  U.data.scenarios.push(

    /* ------------------------------------------------------------------ */
    {
      id: 'first-one-on-ones',
      track: 'people',
      title: `Your first round of 1:1s`,
      summary: `Promoted from the team a week ago, you start 1:1s with your former peers, and the first one turns into a status update in two minutes. Practise making the meeting theirs.`,
      keywords: ['1:1', 'one on one', 'first 1:1', 'new lead', 'former peers', 'status meeting', 'agenda', 'promoted'],
      role: `You were made lead of your team of six last week. Until then you were one of them.`,
      setting: `Monday, your first 1:1 with Sameer, a senior developer you have worked beside for three years. You booked 30 minutes.`,
      stakes: `If the 1:1s become status meetings now, they will stay that way. Sameer is a friend: get it wrong and he feels managed by a peer, or you lose the one place you would hear what he really thinks.`,
      start: 'open',
      steps: {
        open: {
          lines: [{ who: 'Sameer', say: `So... the refund API is about 70% done, the tests are in progress, and the review should be done soon. Anything else you need?` }],
          prompt: 'What do you do?',
          options: [
            { text: `"Thanks, I've seen that on the board. I'd like these 30 minutes to be yours: how things are for you, what's in your way, where you want to go. What's on your mind?"`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'load',
              result: `Sameer laughs: "Okay, that's new." He pauses, then says something he would never have said in a stand-up.` },
            { text: `Ask sharper questions about the refund API: what exactly is left, and the dates.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'load',
              result: `You get a better status update and 20 minutes pass. Useful for the project, but he leaves thinking 1:1s are status meetings. In the last five minutes you ask how he is, and something comes out.` },
            { text: `"Great. Let's go through your tickets on the board too."`,
              grade: 'poor', meters: { delivery: 1, team: -1 }, next: 'load',
              result: `The 1:1 becomes a ticket review. At the very end, almost as he is leaving, he mentions something else.` },
            { text: `Use the time to share your plans for the team and how you feel about the new role.`,
              grade: 'poor', meters: { team: -1 },
              result: `It felt friendly, and you filled the half hour. But it was your meeting, not his, and you learned nothing about how he is.` }
          ]
        },
        load: {
          lines: [{ who: 'Sameer', say: `Honestly? I'm doing most of the code reviews. Everyone tags me. I don't get to my own work until 9 pm.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Thank you for telling me. What would a fair share look like? Let's agree one change to try this Sprint, write it down, and check it in our next 1:1."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `You agree that reviews rotate, with two juniors added as second reviewers. Next Monday you open the 1:1 by checking it. He notices that you did.` },
            { text: `"I'll remind everyone in stand-up to share the reviews."`,
              grade: 'ok', meters: { team: 1 },
              result: `A general reminder changes little: people keep tagging Sameer because he is fastest. Without a concrete change and a check, it fades in a week.` },
            { text: `"That's what being senior means, unfortunately."`,
              grade: 'poor', meters: { team: -2 },
              result: `He stops raising problems with you. You heard something important and filed it away.` },
            { text: `"Me too! When I was doing reviews..." and tell him how you coped.`,
              grade: 'poor', meters: { team: -1 },
              result: `Empathy turned into your story. He leaves feeling heard for a minute and with no plan.` }
          ]
        }
      },
      debrief: {
        points: [
          `A 1:1 is their meeting. Say so out loud the first time, especially with people who used to be your peers.`,
          `Status lives on the board. When a 1:1 starts with status, thank them and move on to them.`,
          `When they raise a problem, agree one concrete change, write it down with a date, and open the next 1:1 by checking it.`,
          `Former peers watch whether the role changed you. Listening more, not talking more, passes the test.`
        ],
        script: `> "Thanks, I've seen that on the board. I'd like these 30 minutes to be yours: how things are for you, what's in your way, where you want to go. What's on your mind?"`,
        analogy: `A 1:1 that drifts into status is a health check that only returns 200: a response, but it tells you nothing about the memory leak or the thread pool running out.`
      },
      links: ['tool:oneonone', 'lesson:one-on-ones', 'phrase:oneone-their-agenda', 'phrase:oneone-open']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'cancelled-one-on-ones',
      track: 'people',
      title: `"It's fine, I know you're busy"`,
      summary: `You have cancelled your 1:1s three weeks running during a crunch, and a developer says it is fine. Practise recovering before trust quietly drains away.`,
      keywords: ['1:1', 'cancelled 1:1', 'crunch', 'busy', 'release', 'early warning', 'trust', 'one on one'],
      role: `You lead a team of seven during a release crunch.`,
      setting: `The payments release is in nine days. You have cancelled your weekly 1:1s for three weeks "to focus on delivery". In the corridor, Divya stops you.`,
      stakes: `The 1:1s were where you heard about problems early. Three weeks without them, during the most stressful part of the project, is exactly when problems hide.`,
      start: 'corridor',
      steps: {
        corridor: {
          lines: [{ who: 'Divya', say: `No worries about our 1:1s, I know you're busy. It's fine.` }],
          prompt: 'What do you do?',
          options: [
            { text: `"Thanks, but it isn't fine; I shouldn't have dropped them, especially now. Can we do 20 minutes today at 4? I'm putting them all back this week."`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'restore',
              result: `Divya looks surprised, then relieved. At 4 pm she tells you something she has been sitting on.` },
            { text: `"Thanks for understanding. We'll restart them after the release."`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'surprise',
              result: `It sounds reasonable, and it means nine more days without the one conversation where problems come out.` },
            { text: `Cancel them until the release, and send the team a daily status form instead.`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'surprise',
              result: `The form collects ticket numbers and "on track". It cannot collect what people are afraid to say.` }
          ]
        },
        restore: {
          lines: [{ narrate: `At 4 pm, Divya opens up.` }, { who: 'Divya', say: `The bank's sandbox has failed every afternoon for a week. I've been retesting at night. I didn't want to add to your problems.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Thank her, then take the problem off her plate: escalate to the bank today with dates, put it in the RAID log, and tell her the night shifts stop: "Your nights aren't the plan."`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `The bank fixes its sandbox by Thursday. A release risk you did not know about now has an owner and a date, and Divya sleeps.` },
            { text: `"Thanks for powering through. Keep me posted."`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `You praised the heroics, so she keeps doing them, and the cause stays her problem alone.` },
            { text: `"Why didn't you raise this in stand-up?"`,
              grade: 'poor', meters: { team: -2 },
              result: `A fair question, asked at the worst moment: it punishes the first honest thing she has said in three weeks.` }
          ]
        },
        surprise: {
          lines: [{ narrate: `Five days before the release, Divya tells the stand-up that the bank's sandbox has failed for two weeks and her tests are not done. She has been retesting at night.` }],
          prompt: 'What now?',
          options: [
            { text: `Thank her for raising it, escalate to the bank today, move the status to Amber with a new test plan, put the 1:1s back this week, and own it: "I dropped our 1:1s. That's on me."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 },
              result: `You lose a few days but keep the release honest. The team notices that you called it your mistake.` },
            { text: `"Why are we only hearing about this now?"`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `Everyone learns that bad news gets punished. The next problem will arrive even later.` },
            { text: `Escalate to the bank, and ask the team to work the weekend to catch up.`,
              grade: 'ok', meters: { delivery: 1, team: -2 },
              result: `The tests get done and the team is exhausted. The cause, a lead who stopped listening, is unchanged.` }
          ]
        }
      },
      debrief: {
        points: [
          `Cancelled 1:1s say "you are the first thing I drop". Move them, shorten them, but do not cancel them, least of all in a crunch.`,
          `"It's fine, I know you're busy" is politeness, not permission.`,
          `In a crunch, people hide problems to protect you. The 1:1 is where they come out.`,
          `When someone finally raises a problem, thank them before anything else.`
        ],
        script: `> "Thanks, but it isn't fine; I shouldn't have dropped our 1:1s, especially now. Can we do 20 minutes today at 4? I'm putting them all back this week."`,
        analogy: `Cancelling 1:1s in a crunch is switching off monitoring during a traffic spike to save CPU: you go blind exactly when problems are most likely.`
      },
      links: ['lesson:one-on-ones', 'tool:oneonone', 'phrase:oneone-move-not-cancel', 'tool:raid']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'peer-wanted-the-role',
      track: 'leadership',
      title: `The peer who wanted your job`,
      summary: `Rahul, a senior developer who also applied to be lead, challenges you in front of the team. Practise turning a rival into an ally without pulling rank.`,
      keywords: ['peer', 'former peer', 'new lead', 'rival', 'authority', 'challenge', 'promoted', 'senior developer'],
      role: `You were made lead of the payments team a month ago. Rahul, a senior developer on the team, applied for the role too.`,
      setting: `Sprint Planning. You propose splitting the refund story into two. Rahul answers in front of everyone.`,
      stakes: `Rahul is the strongest engineer on the team and knows the system best. Turn this into a power struggle and the team splits; ignore it and your authority wears away one meeting at a time.`,
      start: 'meeting',
      steps: {
        meeting: {
          lines: [{ who: 'Rahul', say: `We tried that last year. It didn't work. Maybe ask the people who've been here longer.` }],
          prompt: 'What do you do in the meeting?',
          options: [
            { text: `"That's useful history. What went wrong last time?" Listen, use what holds up, agree the plan, and ask Rahul for 20 minutes after the meeting.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 1 }, next: 'private',
              result: `Rahul explains a real problem with the shared ledger tables. The split changes and the plan gets better. The room relaxes.` },
            { text: `"I'm the lead now, and this is the plan."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'private',
              result: `You win the moment and lose the room. Rahul goes quiet, and so does everyone who agrees with him.` },
            { text: `Drop your proposal and do it Rahul's way, to keep the peace.`,
              grade: 'ok', meters: { team: -1 }, next: 'private',
              result: `Peace for today, but the team has learned who really decides. It will happen again.` }
          ]
        },
        private: {
          lines: [{ narrate: `After the meeting.` }, { who: 'Rahul', say: `Look, I've been here five years. I know this system better than anyone. It's hard watching someone else decide.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"That's fair, and you do know it better than anyone. I'd like you to own the technical direction of payments: design reviews, the architecture. I'll take planning and people. When you disagree with me, I want to hear it, first in private if you can." Agree to check in a month.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 2 },
              result: `Rahul thinks about it and agrees. His challenges move to your 1:1s, and in meetings he becomes your strongest supporter.` },
            { text: `"I understand. Let's both be professional about it."`,
              grade: 'ok', meters: { team: -1 },
              result: `Polite, and nothing changes. He hears "be quiet".` },
            { text: `Ask your manager to tell Rahul to accept the decision.`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `Your manager backs you, and Rahul now knows you could not handle it yourself.` }
          ]
        }
      },
      debrief: {
        points: [
          `Ask about the history before you defend the plan: the challenger often knows something real.`,
          `Never pull rank in public. Authority that has to be announced is already weak.`,
          `Name the situation privately and honestly; it is awkward for both of you.`,
          `Give a strong peer real ownership that plays to their strengths, and agree how disagreements get raised.`
        ],
        script: `> "You do know this system better than anyone. I'd like you to own the technical direction of payments, and when you disagree with me, I want to hear it, first in private if you can."`,
        analogy: `A senior engineer who challenges you is a strict code reviewer: annoying in the moment, and the reason the design is better. Give them the reviewer's role formally and the challenges become useful.`
      },
      links: ['lesson:receiving-feedback', 'lesson:hard-conversations', 'phrase:feedback-receive', 'scenario:architect-disagree']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'missed-commitments',
      track: 'people',
      title: `Three missed commitments in a row`,
      summary: `Arjun, usually dependable, has missed three dates this month and your manager has noticed. Practise finding the cause before deciding what to do.`,
      keywords: ['missed deadlines', 'underperformance', 'struggling', 'performance', 'personal problem', 'support', 'diagnose', 'reliable'],
      role: `You lead a team of six.`,
      setting: `Arjun has been on the team for two years and was always dependable. This month he missed three commitments: the settlement report, a bug fix and a review.`,
      stakes: `The settlement report blocks Finance. Push hard on a problem you do not understand and you may lose a good developer; do nothing and the team carries his work.`,
      start: 'notice',
      steps: {
        notice: {
          lines: [{ who: 'Priya, your manager', say: `Arjun's dropped three things this month. What's going on with him?` }],
          prompt: 'What do you tell Priya, and what do you do?',
          options: [
            { text: `"I don't know yet, and I'd rather find out than guess. I'm talking to him today, and I'll come back to you with a plan for the settlement report by tomorrow."`,
              grade: 'best', meters: { trust: 1, team: 1 }, next: 'talk',
              result: `Priya is satisfied with a date for the plan. You book 30 minutes with Arjun for that afternoon.` },
            { text: `"He's slacking. I'll put him on notice."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'talk',
              result: `You judged before asking, and told your manager a story you may have to take back.` },
            { text: `"I'll take the settlement report off him and give it to Divya."`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'talk',
              result: `It protects Finance but treats the symptom, and Arjun notices his work being moved without a word. You still need to talk to him.` }
          ]
        },
        talk: {
          lines: [{ narrate: `You meet privately.` }, { who: 'Arjun', say: `Yeah, I know. Sorry. It's just been a lot.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Three of the four things this month went past their dates, and Finance is waiting on the report. That's not like you. What's been going on?" Then listen.`,
              grade: 'best', meters: { team: 2 }, next: 'reason',
              result: `Specific facts and a real question. He takes a breath and tells you.` },
            { text: `"You need to give me realistic dates."`,
              grade: 'ok', meters: { team: -1 }, next: 'reason',
              result: `True, but it skips the question. He nods and says what he thinks you want to hear. Only when you ask how he is does the real story come out.` },
            { text: `"It's affecting the team. I need you to step up."`,
              grade: 'poor', meters: { team: -2 }, next: 'reason',
              result: `"Step up" is a judgment with no handle on it. He gets defensive, then quiet, and only later tells you why.` }
          ]
        },
        reason: {
          lines: [{ who: 'Arjun', say: `My mother had surgery three weeks ago. I've been at the hospital most evenings and working at night to catch up. I didn't want special treatment.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Thank him for telling you, and change the work: two weeks of lighter load, the settlement report moved to Divya with Arjun reviewing, the leave he is entitled to, and a short check-in every Friday. Tell Priya only what she needs: "A family situation; here is the plan for the report."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Arjun takes three days off and is back to his usual reliability within a month. He tells others how you handled it.` },
            { text: `"I'm so sorry. Let me know if you need anything."`,
              grade: 'ok', meters: { delivery: -1, team: 1 },
              result: `Kind, but vague. He will not ask, and the dates keep slipping because nothing about the work changed.` },
            { text: `"I understand, but the report still has to be done by Friday."`,
              grade: 'poor', meters: { delivery: 1, team: -2 },
              result: `He works through the night and gets it done. Then he starts looking for a kinder lead.` }
          ]
        }
      },
      debrief: {
        points: [
          `Diagnose before acting: skill, will or circumstances. When a reliable person suddenly slips, look for a circumstance.`,
          `Open privately with specific facts and a real question.`,
          `When the cause is personal, change the work, not only your words: lighter load, cover, leave, a check-in.`,
          `Tell your manager what they need for the work, not the person's private details.`
        ],
        script: `> "Three of the four things this month went past their dates, and Finance is waiting. That's not like you. What's been going on?"`,
        analogy: `A reliable service that suddenly starts timing out rarely grew bad code overnight. Look at what changed around it: the load, a dependency, the infrastructure.`
      },
      links: ['lesson:struggling-performer', 'tool:oneonone', 'phrase:feedback-ask-first', 'scenario:working-late-every-night']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'harsh-reviewer',
      track: 'people',
      title: `The reviewer everyone avoids`,
      summary: `Vikram writes excellent code and brutal review comments, and juniors now ask anyone but him. Practise feedback for someone whose work is excellent.`,
      keywords: ['code review', 'harsh', 'feedback', 'brilliant jerk', 'review comments', 'juniors', 'tone', 'senior developer'],
      role: `You lead a team of seven.`,
      setting: `Vikram, your most experienced developer, leaves review comments like "This is wrong. Did you even run it?" and "Junior mistake." Karthik, two months in, now asks others to review his code, and his pull requests wait two days for someone else.`,
      stakes: `Vikram's reviews catch real bugs. But juniors are hiding their code from the best reviewer on the team, and Karthik has started to look unhappy.`,
      start: 'approach',
      steps: {
        approach: {
          lines: [{ narrate: `You read Vikram's last ten review comments. Six of them are right about the code and harsh about the person.` }],
          prompt: 'How do you start?',
          options: [
            { text: `A private conversation with Vikram, with two of his comments, their effect, and a question.`,
              grade: 'best', meters: { team: 2 }, next: 'talk',
              result: `You book 30 minutes and bring the two comments, word for word.` },
            { text: `Post in the team channel: "Reminder: keep code reviews respectful."`,
              grade: 'poor', meters: { team: -1 }, next: 'talk',
              result: `Everyone knows who it is about, Vikram included, who is now embarrassed and defensive. You still have to talk to him.` },
            { text: `Tell Karthik to ignore the tone and learn from the content.`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'talk',
              result: `Karthik tries. Vikram's next comment on his code makes it worse, and you decide to talk to Vikram after all.` }
          ]
        },
        talk: {
          lines: [{ narrate: `In the 1:1 with Vikram.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"On Karthik's pull request on Tuesday you wrote 'Junior mistake, did you even run it?'. The bug you found was real. Since then Karthik has asked others to review his code, and his last two pull requests waited two days. I want juniors to seek out your reviews, not avoid them. How do you see it?"`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'reply',
              result: `Specific, fair to the quality of his review, and clear about the effect. He frowns, and answers.` },
            { text: `"Your attitude in reviews is a problem. People find you arrogant."`,
              grade: 'poor', meters: { team: -2 }, next: 'reply',
              result: `Two labels and some hearsay. He spends the meeting arguing that he is just honest.` },
            { text: `"Could you be a bit nicer in reviews?"`,
              grade: 'ok', meters: { team: 1 }, next: 'reply',
              result: `Too vague to act on and too soft to register. "Sure," he says, and then pushes back anyway.` }
          ]
        },
        reply: {
          lines: [{ who: 'Vikram', say: `I'm just being honest. If the code's bad, I say so. We're not here to be friends.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Agreed on honesty: keep every point about the code. What I'm asking is to change how it lands: comment on the code, not the person, and say why. 'This runs a query per item; batching avoids N+1' teaches; 'junior mistake' doesn't. Will you try it for two weeks? I'll check in with you."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Vikram grumbles, then tries. Two weeks later Karthik asks Vikram to review a tricky change, and you thank Vikram for it, specifically.` },
            { text: `"Fine, but please try to be gentler."`,
              grade: 'ok', meters: { team: -1 },
              result: `You accepted his idea that kindness and honesty are opposites. Nothing changes.` },
            { text: `"If this continues, it will affect your rating."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `A threat in the first conversation. He complies on the surface and resents it underneath.` }
          ]
        }
      },
      debrief: {
        points: [
          `Excellent work does not buy an exemption from how you treat people; the cost shows up in other people's work.`,
          `Use situation, behaviour and impact, with the impact on someone else: "his pull requests waited two days".`,
          `Separate honesty about the code from judgment of the person. Keep the first; drop the second.`,
          `Ask for one specific, visible change, and agree when you will check it.`
        ],
        script: `> "On Tuesday you wrote 'junior mistake' on Karthik's pull request. The bug was real; since then he has avoided your reviews and his pull requests wait two days. Keep every point about the code. Comment on the code, not the person, and say why."`,
        analogy: `A reviewer who is right but harsh is a linter that reports real errors with insults in the message: people switch it off. Fix the message format and keep the rules.`
      },
      links: ['tool:feedback', 'lesson:feedback-sbi', 'phrase:feedback-specific', 'lesson:psychological-safety']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'design-argument',
      track: 'people',
      title: `The design argument that got personal`,
      summary: `Two developers' disagreement about caching has moved from the pull request into sarcasm in the team channel. Practise moving a conflict from the people to the problem.`,
      keywords: ['conflict', 'design argument', 'disagreement', 'team conflict', 'pull request', 'sarcasm', 'mediation', 'decision'],
      role: `You lead a team of six.`,
      setting: `Asha wants Redis for the price cache; Sameer wants an in-memory cache with a short expiry. The pull request has forty comments. This morning Sameer wrote in the team channel: "Some of us actually measure things before adding infrastructure." Asha replied with a thumbs-down.`,
      stakes: `The price feature is blocked until the cache is decided. Two of your best people have stopped talking to each other, and others are picking sides.`,
      start: 'first',
      steps: {
        first: {
          lines: [{ narrate: `The channel has gone quiet. Two people reacted to Sameer's message with laughing emojis.` }],
          prompt: 'What do you do first?',
          options: [
            { text: `Talk to each of them privately today, to understand their position and how they feel, before bringing them together.`,
              grade: 'best', meters: { team: 2 }, next: 'together',
              result: `Asha feels mocked in front of the team; Sameer feels nobody looks at his numbers. Both care about the feature.` },
            { text: `Reply in the channel: "Guys, let's keep it professional."`,
              grade: 'poor', meters: { team: -1 }, next: 'together',
              result: `A public telling-off for both, which neither thinks they deserve. The tension moves to private messages, and you still have to bring them together.` },
            { text: `Decide yourself: Redis. Close the discussion on the pull request.`,
              grade: 'ok', meters: { delivery: 1, team: -1 },
              result: `The feature moves. Sameer stops arguing, and stops offering ideas in design reviews. The decision was fine; the way it was made cost you.` }
          ]
        },
        together: {
          lines: [{ narrate: `You meet both of them.` }, { who: 'Sameer', say: `She wants a whole Redis cluster for one feature. It's over-engineering.` }, { who: 'Asha', say: `And he hasn't looked at what happens when we run three instances.` }],
          prompt: 'How do you run it?',
          options: [
            { text: `"You both want the price page fast and correct; you disagree on how. Put both options on one page: latency, cost, three instances, operating effort. Write it together by Wednesday; we decide on Thursday, with Rahul breaking the tie if you still disagree. And in the channel, comments are about designs, not people, both ways."`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Writing it together makes each understand the other's case. They choose the in-memory cache now, with a trigger to move to Redis at three instances. Sameer apologises for his comment without being asked.` },
            { text: `Let them argue it out in the room until one gives in.`,
              grade: 'ok', meters: { team: -1 },
              result: `The louder one wins. The other leaves resentful, and the next design review is tense.` },
            { text: `"I don't care who's right, just stop fighting."`,
              grade: 'poor', meters: { team: -2 },
              result: `You made the disagreement itself the problem. Healthy conflict goes underground with the unhealthy kind.` }
          ]
        }
      },
      debrief: {
        points: [
          `Disagreeing about design is healthy; making it personal is not. Deal with the second without suppressing the first.`,
          `Talk to each person separately first, then together about the problem.`,
          `Turn opinions into a written comparison against shared criteria, and agree how and when the decision is made.`,
          `Set one rule for behaviour that is the same for both.`
        ],
        script: `> "You both want the price page fast and correct; you disagree on how. Put both options on one page by Wednesday, and we decide on Thursday. Comments are about designs, not people, both ways."`,
        analogy: `Two engineers arguing in comments are two services retrying against each other: every response triggers another, and the load only grows. You need a circuit breaker: stop, step out, change the protocol.`
      },
      links: ['lesson:hard-conversations', 'phrase:care-conflict', 'scenario:architect-disagree', 'explainer:tuckman']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'star-resigns',
      track: 'people',
      title: `Your best developer resigns`,
      summary: `Asha hands in her notice: sixty days, a better offer. Practise the conversation itself: listening instead of bargaining or guilt, and what you do next.`,
      keywords: ['resignation', 'resign', 'resigns', 'notice period', 'counter-offer', 'attrition', 'leaving', 'handover', 'knowledge transfer'],
      role: `You lead a team of six.`,
      setting: `Friday, 5 pm. Asha, your strongest developer, asks for ten minutes and tells you she has accepted an offer from a product company. Her notice period is sixty days.`,
      stakes: `Asha owns the reconciliation service and mentors two juniors. The next ten minutes decide whether she leaves as an ally or warns her friends away, and the team will hear how it went.`,
      start: 'told',
      steps: {
        told: {
          lines: [{ who: 'Asha', say: `I've accepted an offer. My notice period is sixty days. I wanted you to hear it from me first.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Thank you for telling me directly. I'm sorry to lose you, and glad for you. Can I ask what made you decide? I'd like to understand, not to argue."`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'why',
              result: `Asha relaxes. She had expected a hard conversation, and she tells you the real reason.` },
            { text: `"After everything we did for you? We're in the middle of a release."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'why',
              result: `Guilt. She stays polite, and decides she was right to leave. When you ask why later, she answers carefully.` },
            { text: `"What would it take for you to stay? I'll get HR to match it."`,
              grade: 'ok', meters: { team: -1 }, next: 'why',
              result: `You bargained before you listened, and promised something that is not yours to give. She tells you anyway.` }
          ]
        },
        why: {
          lines: [{ who: 'Asha', say: `The money is better, but it's more than that. I've done the same reconciliation work for two years. I asked about the architecture work last year, and nothing happened.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Say it plainly: "That's fair, and I should have acted on it." Tell her you will let your manager and HR know in case they want to talk about it, without promising anything, and agree the next steps: your manager and HR on Monday, the team told together on Tuesday, a handover plan by the end of next week.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 }, next: 'handover',
              result: `Asha thanks you for being straight. HR offers more money; she declines, warmly. The team hears the news from both of you on Tuesday.` },
            { text: `"The architecture work is coming next quarter. Would you reconsider?"`,
              grade: 'ok', meters: { trust: -1 }, next: 'handover',
              result: `A vague promise she has heard before. She declines politely.` },
            { text: `"Well, the grass isn't always greener."`,
              grade: 'poor', meters: { trust: -1, team: -1 }, next: 'handover',
              result: `Dismissive. She stops talking openly with you for the rest of her notice period.` }
          ]
        },
        handover: {
          lines: [{ narrate: `Monday. HR confirms her last day. You plan the next sixty days.` }],
          prompt: 'How do you hand over the reconciliation service?',
          options: [
            { text: `List with Asha everything only she knows and name a new owner for each; from week three, Karthik runs the month-end job while Asha watches and corrects. Put the knowledge risk in the RAID log.`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `By her last week, Karthik has run month-end twice. The first month-end after she leaves is quiet.` },
            { text: `Ask Asha to write a handover document in her last two weeks.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `She writes thirty pages and nobody reads them. The first month-end after she leaves goes wrong at step seven.` },
            { text: `Stop giving her meaningful work, and sort out the handover nearer the end.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `She feels sidelined for two months, the team sees how leavers are treated, and the handover is rushed.` }
          ]
        }
      },
      debrief: {
        points: [
          `Listen first: thank them, ask why, do not argue. The people who stay watch how you treat the people who leave.`,
          `Counter-offers are your manager's and HR's call. Never promise one, and remember they rarely fix why someone is leaving.`,
          `The real reason is feedback about the job, and often about you.`,
          `Hand over by doing, starting weeks before the last day.`
        ],
        script: `> "Thank you for telling me directly. I'm sorry to lose you, and glad for you. Can I ask what made you decide? I'd like to understand, not to argue."`,
        analogy: `A resignation is a postmortem you did not ask for: the outage has already happened. Blame makes the report worse; listening tells you what to fix before the next one.`
      },
      links: ['playbook:offboarding', 'scenario:key-person-resigns', 'lesson:onboarding-offboarding', 'phrase:care-resignation', 'tool:raid']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'new-joiner-nothing-ready',
      track: 'people',
      title: `Monday morning, and nothing is ready`,
      summary: `A new developer starts today. There is no laptop, no access, and you forgot to arrange a buddy. Practise rescuing the first week.`,
      keywords: ['onboarding', 'new joiner', 'new hire', 'first day', 'first week', 'buddy', 'laptop', 'access'],
      role: `You lead a team of six, and you have hired your first developer.`,
      setting: `Monday, 9:45 am. Meera, a developer with three years' experience, arrives for her first day. IT says her laptop arrives on Wednesday, and access requests take three days. You meant to arrange a buddy last week.`,
      stakes: `Meera chose your team over another offer. Her first week will tell her how the team works.`,
      start: 'arrive',
      steps: {
        arrive: {
          lines: [{ who: 'Meera', say: `Hi! HR said to find you. What should I start with?` }],
          prompt: 'What do you do right now?',
          options: [
            { text: `Be honest and make the day useful: "Welcome! I have to own this: your laptop comes on Wednesday, which is our mistake. Today, meet the team, and Divya will show you the product and the system on her machine." Then ask Divya to be her buddy, with time taken off her Sprint work, and chase IT yourself.`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'week',
              result: `Meera laughs at the honesty. By lunch she has met everyone and seen a refund go through the system end to end.` },
            { text: `Send her the wiki link and ask her to read the documentation until the laptop comes.`,
              grade: 'poor', meters: { team: -2 }, next: 'week',
              result: `Three days alone with out-of-date pages. She texts a friend: "Not sure about this place."` },
            { text: `Apologise, and ask her to shadow you in your meetings today.`,
              grade: 'ok', meters: { team: 1 }, next: 'week',
              result: `Better than reading, but your meetings are planning and stakeholder calls. She learns how busy you are, not how the team works.` }
          ]
        },
        week: {
          lines: [{ narrate: `Wednesday. The laptop has arrived, and the project builds after a day of fixing the setup page.` }],
          prompt: 'What do you aim for by Friday?',
          options: [
            { text: `A small real change in production by Friday, paired with Divya, and a first 1:1 where you ask what was confusing, and ask her to fix the setup page while it is fresh.`,
              grade: 'best', meters: { delivery: 1, team: 2 },
              result: `Meera ships a fix to an error message on Friday. In the 1:1 she lists five broken steps in the setup page, and fixes them the next week. The next joiner sets up in half a day.` },
            { text: `Give her a big feature, so she learns by doing.`,
              grade: 'ok', meters: { delivery: -1, team: -1 },
              result: `A big task in a codebase she has seen for two days. She struggles alone for a week and hesitates to ask.` },
            { text: `Let her keep reading the code until she feels ready.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `Reading never makes anyone feel ready. By week three she has shipped nothing and feels useless.` }
          ]
        }
      },
      debrief: {
        points: [
          `What is ready on day one teaches a new joiner how the team works. Prepare a week ahead: laptop, access, buddy, calendar.`,
          `When something is not ready, own it, and make the day useful anyway: people, product, pairing.`,
          `Aim for a small, real change in production in the first week.`,
          `A new joiner sees the gaps in your setup page that everyone else stopped seeing. Ask them to fix one.`
        ],
        script: `> "Welcome! I have to own this: your laptop comes on Wednesday, which is our mistake. Today, meet the team, and Divya will show you the product on her machine. By Friday, I'd like you to ship one small change with her."`,
        analogy: `A new joiner is a fresh machine running your install script: every step that fails is a bug in the script, not in the machine. Fix the script while the failure is still visible.`
      },
      links: ['playbook:onboarding', 'lesson:onboarding-offboarding', 'scenario:quiet-junior', 'phrase:help-ask-early']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'rating-conversation',
      track: 'people',
      title: `"Meets expectations" when she expected more`,
      summary: `Appraisal season: Tanvi expects "exceeds", and the rating is "meets". Practise giving news someone will not like, with facts and a path forward.`,
      keywords: ['appraisal', 'rating', 'performance review', 'bell curve', 'calibration', 'bad news', 'meets expectations', 'hike'],
      role: `You lead a team of six. It is appraisal season, and ratings are calibrated across teams on a curve.`,
      setting: `Tanvi worked long hours this year and delivered her features. The calibration gave her "meets expectations". She has told colleagues she expects "exceeds". You meet her in ten minutes.`,
      stakes: `Tanvi is good and works hard. Handle this badly and she disengages or leaves; soften it into nothing and she will not know what "exceeds" takes.`,
      start: 'open',
      steps: {
        open: {
          lines: [{ narrate: `Tanvi sits down, smiling.` }],
          prompt: 'How do you open?',
          options: [
            { text: `In the first two sentences: "Your rating this cycle is 'meets expectations'. I know you were hoping for more, so I want to explain why, and what 'exceeds' would take next cycle."`,
              grade: 'best', meters: { trust: 2 }, next: 'react',
              result: `Her smile goes. It hurts, but it is clear, and she can hear the rest.` },
            { text: `Ten minutes on what went well, and the rating at the end.`,
              grade: 'poor', meters: { trust: -1, team: -1 }, next: 'react',
              result: `She relaxes, then the rating lands as a betrayal. She remembers nothing good you said.` },
            { text: `"The calibration committee decided; it wasn't my call."`,
              grade: 'poor', meters: { trust: -2 }, next: 'react',
              result: `Even if partly true, you disowned your own team's rating. She wonders why you did not fight for her.` }
          ]
        },
        react: {
          lines: [{ who: 'Tanvi', say: `I worked every weekend for the refund launch. Divya got "exceeds" and she leaves at six every day. How is that fair?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"You did work very hard on the refund launch, and I saw it. The rating is about impact at your level, not hours. I won't discuss anyone else's rating, but I will show you exactly what 'exceeds' looks like for you."`,
              grade: 'best', meters: { trust: 1, team: 1 }, next: 'plan',
              result: `She is still upset, but she is listening, and she asks the question that matters.` },
            { text: `"Divya's work was just better."`,
              grade: 'poor', meters: { team: -2 }, next: 'plan',
              result: `A comparison with a colleague, and a vague one. Now it is personal between Tanvi and Divya.` },
            { text: `"I agree it doesn't seem fair. I'll see if I can get it changed."`,
              grade: 'ok', meters: { trust: -1 }, next: 'plan',
              result: `A promise you probably cannot keep, which becomes a second disappointment.` }
          ]
        },
        plan: {
          lines: [{ who: 'Tanvi', say: `So what would "exceeds" actually take?` }],
          prompt: 'What do you do?',
          options: [
            { text: `Write a growth plan together: two goals at the next level's bar (lead a design, mentor the new joiner), the work that builds them, and a check every month in your 1:1s. And say you will stop praising weekend work as if it were the goal.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Tanvi leaves disappointed but clear. Six months later she has led the settlement design, and her mid-year review says so, with specifics.` },
            { text: `"Just keep doing what you're doing, and it'll come."`,
              grade: 'ok', meters: { team: -1 },
              result: `What she is doing earned "meets". Without a concrete plan, next year ends the same way.` },
            { text: `"Work on your visibility."`,
              grade: 'poor', meters: { team: -1 },
              result: `Vague advice that sounds like "talk more in meetings". She does not know what to change.` }
          ]
        }
      },
      debrief: {
        points: [
          `Say the rating in the first two sentences, then explain it.`,
          `Acknowledge the effort and the feelings, and explain that ratings measure impact, not hours.`,
          `Never compare with a named colleague, and never disown the rating.`,
          `End with a written plan for what the next level takes, and check it every month.`
        ],
        script: `> "Your rating this cycle is 'meets expectations'. I know you hoped for more, so I want to explain why, and show you exactly what 'exceeds' would take next cycle."`,
        analogy: `A rating conversation is a failed build with a clear log: the result first, then the failing checks, then what to change. Nobody wants to scroll through ten screens of passing tests to find the one that failed.`
      },
      links: ['lesson:hard-conversations', 'lesson:growth-conversations', 'phrase:care-rating', 'term:forced-distribution']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'working-late-every-night',
      track: 'people',
      title: `Online at midnight, every night`,
      summary: `Rahul has worked past midnight for weeks, snapped at a tester, and broke checkout with an unchecked change. Practise noticing burnout and acting on it, not praising it.`,
      keywords: ['burnout', 'overwork', 'working late', 'stress', 'wellbeing', 'workload', 'incident', 'support rotation'],
      role: `You lead a team of seven.`,
      setting: `Rahul, your most dependable senior developer, has committed code after midnight most nights for a month. Yesterday he snapped at Kavya, the tester, in a review. This morning he deployed a configuration change without the usual check, and checkout broke for ten minutes.`,
      stakes: `Rahul is the person you rely on most. This incident was small; the next one may not be.`,
      start: 'notice',
      steps: {
        notice: {
          lines: [{ narrate: `In the incident channel, someone writes: "Rahul, why wasn't this checked?"` }],
          prompt: 'What do you do first?',
          options: [
            { text: `In the channel: "Thanks for the fast fix. We'll look at how the check got skipped in a blameless review on Thursday." Then message Rahul privately for 20 minutes today.`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'talk',
              result: `The channel calms down. Rahul replies "ok" to your message, and comes.` },
            { text: `In the channel: "Rahul, please be more careful."`,
              grade: 'poor', meters: { team: -2 }, next: 'talk',
              result: `Public blame on an exhausted person. Now he is exhausted and humiliated, and you still need to talk to him.` },
            { text: `Add a mandatory check to the pipeline, and say nothing to Rahul.`,
              grade: 'ok', meters: { delivery: 1 }, next: 'talk',
              result: `A good fix to the process. But the cause, a person running on empty, is untouched, so you talk to him as well.` }
          ]
        },
        talk: {
          lines: [{ who: 'Rahul', say: `I'm fine. There's just a lot to do. Someone has to get it done.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I've seen your commits after midnight most nights this month, and you're the person I rely on most, so I'm worried. What's on your plate right now?" Then go through the list together.`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'plate',
              result: `He hesitates, then lists it all. It is longer than you knew.` },
            { text: `"Your dedication is amazing. Just be more careful with deployments."`,
              grade: 'poor', meters: { delivery: -1, team: -1 }, next: 'plate',
              result: `You praised what is burning him out and blamed him for the result. Later you ask what he is working on.` },
            { text: `"Take a day off this week."`,
              grade: 'ok', meters: { team: 1 }, next: 'plate',
              result: `A day off helps for a day. You ask what will be waiting for him when he is back.` }
          ]
        },
        plate: {
          lines: [{ narrate: `Rahul's list: the payments migration, every production support question, the reviews nobody else will do, and a client call at 11 pm twice a week.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Share it out: a support rotation so production questions go to whoever is on duty, reviews shared with two others, the 11 pm call moved into his day or rotated, and the migration date replanned with the Product Owner if needed. Agree that he stops at 9 pm, and check it in your 1:1s.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `It takes two Sprints to settle. The migration slips by a week, which you report honestly. Rahul's commits move back into daylight, and his reviews get kinder.` },
            { text: `Ask him to prioritise and drop what he can.`,
              grade: 'ok', meters: { team: -1 },
              result: `He cannot: every item feels like someone's urgent request. Without you making the trade-off, nothing drops.` },
            { text: `Promise to hire someone next quarter.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `Help that arrives in four months, if at all. Until then the load stays exactly where it is.` }
          ]
        }
      },
      debrief: {
        points: [
          `Late nights, irritability and careless mistakes together are a warning, not dedication.`,
          `Never blame a tired person in public. Fix the process blamelessly, and talk to them privately.`,
          `Ask about the load with specifics, then take things off the plate yourself: rotations, sharing, replanning.`,
          `Do not praise overwork: people repeat what you praise.`
        ],
        script: `> "I've seen your commits after midnight most nights this month, and you're the person I rely on most, so I'm worried. What's on your plate right now? Let's take some of it off."`,
        analogy: `A server pinned at 100% CPU does not need praise for its uptime; it needs load shedding before it falls over.`
      },
      links: ['lesson:struggling-performer', 'phrase:care-burnout', 'tool:oneonone', 'term:burnout', 'scenario:interruptions-eat-sprint']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'delegated-task-wrong',
      track: 'people',
      title: `The task you delegated came back wrong`,
      summary: `You gave Anil a feature with "you decide how" and no check-ins. The day before the demo, it is not what Finance asked for. Practise recovering without taking the work back.`,
      keywords: ['delegation', 'delegate', 'check-ins', 'abdication', 'outcome', 'demo', 'brief', 'take it back'],
      role: `You lead a team of six.`,
      setting: `Two weeks ago you told Anil: "Can you own the bulk refund upload? You decide how." No check-ins. It is Thursday, the day before the demo to Finance. Anil shows you his work: a CSV upload with no validation, and none of the error report Finance asked for.`,
      stakes: `The demo is tomorrow and Anil is proud of his work. Take it over and you finish it tonight, and Anil learns that your delegation is temporary.`,
      start: 'see',
      steps: {
        see: {
          lines: [{ who: 'Anil', say: `Here it is! You can upload any CSV, and it creates the refunds.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Start with what works, then compare it with the goal together: "The upload works end to end, good. Let's check it against what Finance asked for: what happens with a bad row?" Let him find the gap.`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'gap',
              result: `Anil uploads a file with a wrong order number. It creates a refund for the wrong customer. He goes pale.` },
            { text: `"This isn't what Finance needs. I'll fix it tonight."`,
              grade: 'poor', meters: { delivery: 1, team: -2 },
              result: `You finish at 2 am, and the demo works. Anil sees his work replaced overnight, and the next time you delegate, he waits to be told exactly what to do.` },
            { text: `"Where's the validation? Where's the error report?"`,
              grade: 'ok', meters: { team: -1 }, next: 'gap',
              result: `Fair questions, asked like an accusation. He gets defensive.` }
          ]
        },
        gap: {
          lines: [{ who: 'Anil', say: `I didn't know Finance wanted an error report. You said I could decide how to build it.` }],
          prompt: 'What do you say?',
          options: [
            { text: `Own your part: "You're right. I said you decide, and I never gave you Finance's requirements or set any check-ins. That's on me." Then agree the plan: demo the upload tomorrow, honestly, with "validation and the error report next week"; and for the rest, a clear brief with what "done" means, and check-ins on Monday and Wednesday.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `The demo goes well; Finance likes seeing early work. Anil delivers the validation and the report the next week, after two check-ins. Your next brief to him has an outcome and dates from the start.` },
            { text: `"You should have asked."`,
              grade: 'poor', meters: { team: -2 },
              result: `Partly true, but you set it up with no outcome and no check-ins. He learns to take nothing on without written instructions.` },
            { text: `Move the demo back a week without telling Finance why.`,
              grade: 'ok', meters: { trust: -1, delivery: -1 },
              result: `Finance is annoyed by a last-minute delay, and Anil feels his work was hidden.` }
          ]
        }
      },
      debrief: {
        points: [
          `"You decide" with no outcome and no check-ins is abdication, not delegation.`,
          `A brief says what "done" means, by when, how much they decide, and when you will check in.`,
          `When delegated work goes wrong, own your part first, and do not take the work back.`,
          `An early, honest demo of partial work beats a late surprise.`
        ],
        script: `> "You're right: I said you decide, and I never gave you Finance's requirements or set any check-ins. That's on me. Let's write down what done means, and check in on Monday and Wednesday."`,
        analogy: `Delegating without check-ins is deploying without monitoring: it may work, but if it does not, you hear about it from the customer. Check-ins are the alerts you agreed on before the release.`
      },
      links: ['tool:delegate', 'lesson:delegation-levels', 'phrase:delegate-level', 'phrase:delegate-no-rescue', 'scenario:doing-it-myself']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'you-dont-trust-me',
      track: 'people',
      title: `"It feels like you don't trust me"`,
      summary: `A senior developer tells you that you re-check every decision she makes. Practise taking feedback about your own micromanaging.`,
      keywords: ['micromanage', 'micromanaging', 'trust', 'receive feedback', 'delegation', 'rewrite', 'senior developer', 'former engineer'],
      role: `You lead a team of six. Before you became lead, you were its strongest developer.`,
      setting: `In your 1:1, Divya, a senior developer who owns the settlement service, says it straight.`,
      stakes: `Divya is good and knows it. Defend yourself and she stops giving you feedback, while you keep hovering until she leaves.`,
      start: 'said',
      steps: {
        said: {
          lines: [{ who: 'Divya', say: `Can I be honest? You re-review every decision I make on settlements. Yesterday you rewrote my retry logic without asking. It feels like you don't trust me.` }],
          prompt: 'What do you say first?',
          options: [
            { text: `"Thank you for telling me; that can't have been easy. Can you give me another example, so I understand how it looks from your side?"`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'reflect',
              result: `She looks relieved that it did not turn into an argument, and gives you one.` },
            { text: `"I rewrote it because it had a bug."`,
              grade: 'poor', meters: { team: -2 }, next: 'reflect',
              result: `Maybe it did. But you just proved her point, and showed her that feedback gets argued with. She gives you another example anyway, more coldly.` },
            { text: `"Sorry, I'll stop."`,
              grade: 'ok', meters: { team: 1 }, next: 'reflect',
              result: `A quick apology without understanding. She doubts it will last, and adds another example.` }
          ]
        },
        reflect: {
          lines: [{ who: 'Divya', say: `Like last week: I chose the batch size for the settlement job, and you changed it in the pull request without a comment.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Agree a clear level for her decisions on settlements: she decides, and tells you the important ones; you raise concerns as review comments with reasons, never silent rewrites; and you will ask in a month whether it feels different. Then actually stop.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 2 },
              result: `It is hard for a week. The next time you would do something differently, you ask a question in the review instead. A month later Divya says it feels different, and the settlement service is in good shape.` },
            { text: `"I'll try to be more hands-off."`,
              grade: 'ok', meters: { team: 1 },
              result: `Good intentions, no agreement. The next time you see her code, the old habit wins.` },
            { text: `"I'm accountable for the service, so I need to check."`,
              grade: 'poor', meters: { trust: -1, team: -2 },
              result: `Accountable, yes; but checking is not rewriting. Divya concludes nothing will change, and starts looking.` }
          ]
        }
      },
      debrief: {
        points: [
          `When someone gives you feedback, thank them and ask for an example before anything else.`,
          `Former top engineers often micromanage the area they know best. Notice it in yourself.`,
          `Agree an explicit delegation level for each area, and how you will raise concerns: questions with reasons, not silent rewrites.`,
          `Close the loop: ask later whether it feels different.`
        ],
        script: `> "Thank you for telling me; that can't have been easy. Can you give me another example? … Let's agree: on settlements you decide and tell me the big ones, and I raise concerns as review comments with reasons, never silent rewrites."`,
        analogy: `Silently rewriting someone's code is force-pushing over their branch: allowed by the tools, and guaranteed to stop them trusting the repository.`
      },
      links: ['lesson:receiving-feedback', 'lesson:delegation-levels', 'tool:delegate', 'phrase:feedback-receive', 'explainer:situational-leadership']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'feedback-to-older-senior',
      track: 'people',
      title: `Feedback for someone twenty years your senior`,
      summary: `Ramesh, a developer much older and more experienced than you, merges without tests, and the juniors copy him. Practise feedback across a hierarchy without losing respect either way.`,
      keywords: ['feedback', 'senior', 'older', 'hierarchy', 'respect', 'tests', 'standards', 'reorg'],
      role: `You lead a team of seven. After a reorg, Ramesh, a developer with 18 years' experience and much older than you, now reports to you.`,
      setting: `Ramesh is respected and fast. He has merged three changes this month without tests: "I've done this for 18 years." Two juniors have started doing the same.`,
      stakes: `In your office, correcting an elder can feel disrespectful, and the team values Ramesh's goodwill. But untested changes are spreading, and the juniors are copying him.`,
      start: 'hesitate',
      steps: {
        hesitate: {
          lines: [{ narrate: `You catch yourself drafting a message about tests to the whole team, so that you do not have to talk to Ramesh.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Delete the draft. Talk to Ramesh privately, respectfully, with specifics, and ask for his view first.`,
              grade: 'best', meters: { trust: 1, team: 1 }, next: 'talk',
              result: `You ask him for a coffee.` },
            { text: `Send the team message about "everyone" writing tests.`,
              grade: 'poor', meters: { team: -1 }, next: 'talk',
              result: `Everyone knows it is about Ramesh, who is offended to be addressed indirectly. The juniors add tests; Ramesh does not. You have to talk to him after all.` },
            { text: `Let it go: he is senior, and his code rarely breaks.`,
              grade: 'poor', meters: { delivery: -1, team: -1 },
              result: `Two weeks later a junior's untested change breaks the refund report. "Ramesh doesn't write tests either."` }
          ]
        },
        talk: {
          lines: [{ narrate: `Over coffee with Ramesh.` }],
          prompt: 'How do you raise it?',
          options: [
            { text: `"Ramesh, I'd value your advice on something. Three of your changes this month went in without tests, and Karthik and Meera have started doing the same; Meera's broke the refund report on Tuesday. Your code is solid, but they copy what you do. How do you think we should handle tests on this team?"`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'reply',
              result: `Asked for advice, with facts, he takes it seriously.` },
            { text: `"The rules apply to everyone, whatever their experience."`,
              grade: 'poor', meters: { team: -2 }, next: 'reply',
              result: `A lecture from a younger lead. He hears disrespect and digs in, though he concedes one point.` },
            { text: `"Could you maybe add some tests, when you have time?"`,
              grade: 'ok', meters: { delivery: -1 }, next: 'reply',
              result: `So soft he can agree and change nothing. He shrugs, and says something revealing.` }
          ]
        },
        reply: {
          lines: [{ who: 'Ramesh', say: `Hmm. I didn't think the juniors were watching that closely. My code doesn't need tests, but I see the point.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"They watch you more than anyone. Would you set the standard: tests on everything you merge? And would you pair with Meera on testing the refund report this week? It would mean more coming from you."`,
              grade: 'best', meters: { trust: 1, delivery: 2, team: 2 },
              result: `Ramesh likes being asked to lead. His next pull requests have tests, and he runs a short session on testing legacy code. The juniors follow.` },
            { text: `"Great, so please write tests from now on."`,
              grade: 'ok', meters: { delivery: 1 },
              result: `He agrees, a little stiffly. It works, but you missed the chance to make him the person who sets the standard.` },
            { text: `"Your code needs tests too, actually."`,
              grade: 'poor', meters: { team: -2 },
              result: `You won the point and lost the man.` }
          ]
        }
      },
      debrief: {
        points: [
          `Age and hierarchy make feedback to a senior person feel risky. Respect is in how you say it, not in whether you say it.`,
          `Talk privately, with specifics and the effect on others, and ask for their view and advice.`,
          `A team-wide message sent to avoid one conversation offends that person and changes nothing.`,
          `Senior people often respond best to being asked to set the standard.`
        ],
        script: `> "I'd value your advice on something. Three of your changes this month went in without tests, and the juniors have started copying it; Meera's broke the refund report. How do you think we should handle tests on this team?"`,
        analogy: `A senior engineer's habits are the team's default configuration: everyone inherits them. Change the default and every instance changes with it, so start there.`
      },
      links: ['lesson:feedback-sbi', 'tool:feedback', 'phrase:feedback-private', 'scenario:architect-disagree']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'when-will-i-be-promoted',
      track: 'people',
      title: `"When will I be promoted?"`,
      summary: `Anil asks for a promotion date in your 1:1, and a committee decides, not you. Practise a career conversation that is honest and still useful.`,
      keywords: ['promotion', 'career', 'career ladder', 'growth plan', 'senior', 'ambition', 'appraisal', 'growth'],
      role: `You lead a team of six. Promotions are decided once a year, in April, by a committee, against a career ladder.`,
      setting: `In your 1:1, Anil, a mid-level developer for three years, asks directly. A friend of his has just been promoted at another company.`,
      stakes: `Anil is solid and ambitious. Give him a vague answer or a promise you cannot keep, and he may follow his friend.`,
      start: 'ask',
      steps: {
        ask: {
          lines: [{ who: 'Anil', say: `I've been mid-level for three years. When will I be promoted to senior?` }],
          prompt: 'What do you say?',
          options: [
            { text: `"I can't promise a date, because a committee decides in April. What I can do is show you exactly what senior looks like here, tell you honestly where you are, and help you get there. Shall we start today?"`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'gap',
              result: `Anil is a little deflated by "no promise", and interested in the rest.` },
            { text: `"You'll definitely get it in April."`,
              grade: 'poor', meters: { trust: -2 }, next: 'gap',
              result: `A promise you do not control. If the committee says no, you have broken it. You open the ladder together anyway.` },
            { text: `"Promotions aren't really up to me. Keep doing good work."`,
              grade: 'ok', meters: { trust: -1, team: -1 }, next: 'gap',
              result: `True and useless: he hears "nobody is looking out for me". Later in the 1:1, you open the ladder together.` }
          ]
        },
        gap: {
          lines: [{ narrate: `You open the career ladder together. Senior here means leading the design of a feature, reviewing others' work well, and mentoring.` }, { who: 'Anil', say: `I deliver my features well. I've never led a design.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Be honest about the gap and build a plan: he leads the design of bulk refunds next quarter, mentors Meera, and you review progress every month in your 1:1s and write down the evidence for the committee.`,
              grade: 'best', meters: { trust: 1, delivery: 1, team: 2 },
              result: `Anil leads the design with your support. By April the committee has specific evidence, and whatever it decides, he knows exactly where he stands.` },
            { text: `"Just take on more responsibility."`,
              grade: 'ok', meters: { team: -1 },
              result: `"More responsibility" is not a plan, so nothing specific changes.` },
            { text: `"Honestly, you're not close." And leave it there.`,
              grade: 'poor', meters: { team: -2 },
              result: `Honest, but with no path it is only discouraging.` }
          ]
        }
      },
      debrief: {
        points: [
          `Never promise a promotion, or a date, that you do not control.`,
          `Make the path visible: the career ladder, where they stand, and the gap, honestly.`,
          `Turn the gap into specific work, such as a design to lead and someone to mentor, with monthly check-ins.`,
          `Collect evidence through the year; committees decide on facts, not memories.`
        ],
        script: `> "I can't promise a date; a committee decides in April. What I can do is show you what senior looks like here, tell you honestly where you are, and help you get there. Shall we start today?"`,
        analogy: `A promotion is a release behind a checklist you do not own. You cannot promise the release date, but you can show the checklist and make sure every item has evidence before the gate.`
      },
      links: ['lesson:growth-conversations', 'phrase:care-promotion', 'tool:oneonone', 'term:career-ladder', 'term:growth-plan']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'junior-broke-production',
      track: 'people',
      title: `The junior who broke production`,
      summary: `Karthik's change took refunds down for 40 minutes, and the incident channel is looking for someone to blame. Practise a blameless response that keeps people reporting problems.`,
      keywords: ['incident', 'blameless', 'postmortem', 'mistake', 'junior', 'production', 'psychological safety', 'blame'],
      role: `You lead the team.`,
      setting: `Wednesday, 3 pm. A change from Karthik, the newest developer, disabled refunds for 40 minutes. It had passed review. In the incident channel a senior developer writes: "Who approved this? Juniors shouldn't be deploying payment changes."`,
      stakes: `Karthik is mortified. How you handle the next hour decides whether people on this team report problems quickly, or hide them.`,
      start: 'channel',
      steps: {
        channel: {
          lines: [{ narrate: `Refunds are working again. Karthik has gone very quiet.` }],
          prompt: 'What do you post in the channel?',
          options: [
            { text: `"Refunds are back; thanks to everyone who helped. We'll hold a blameless review tomorrow at 11: what made this possible, not who. Karthik, thanks for spotting it and rolling back fast."`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'karthik',
              result: `The blame stops. A minute later, Karthik messages you privately.` },
            { text: `"Karthik, please be more careful with payment changes."`,
              grade: 'poor', meters: { team: -2 }, next: 'karthik',
              result: `Public blame. Everyone learns that whoever causes an incident gets named. Karthik messages you, shaken.` },
            { text: `Say nothing in the channel, and deal with it privately.`,
              grade: 'ok', meters: { team: -1 }, next: 'karthik',
              result: `The senior's comment stands unanswered, and the channel reads your silence as agreement. Karthik messages you.` }
          ]
        },
        karthik: {
          lines: [{ who: 'Karthik', say: `I'm so sorry. I should have tested it more. I understand if I shouldn't touch payments any more.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Thanks for owning it, and for rolling back fast; that was the right call. It passed review and our tests, so the system let it through, not just you. Tomorrow we'll find what to change. And yes, you'll keep working on payments."`,
              grade: 'best', meters: { team: 2 }, next: 'review',
              result: `Karthik exhales. He comes to the review ready to help, not to defend himself.` },
            { text: `"It's fine, these things happen."`,
              grade: 'ok', meters: { team: 1 }, next: 'review',
              result: `Kind, but it skips what matters to him: that the system let it through, and that he keeps his work.` },
            { text: `"Let's have you pair with a senior on everything for a while."`,
              grade: 'poor', meters: { delivery: -1, team: -2 }, next: 'review',
              result: `It sounds supportive and feels like a demotion. He hears "you're not trusted".` }
          ]
        },
        review: {
          lines: [{ narrate: `Thursday's blameless review. The timeline shows the change switched off a feature flag in the wrong environment, the reviewer never saw the configuration file, and no test covers refunds with that flag off.` }],
          prompt: 'What actions come out of it?',
          options: [
            { text: `Fix the system: a test for refunds with the flag off, configuration changes shown in the review diff, and a deployment check for payment flags, each with an owner and a date. Karthik owns the test.`,
              grade: 'best', meters: { delivery: 2, team: 1 },
              result: `Three small fixes close the gap. Karthik writes the test and shows it at the next review. Two weeks later, a senior's change is caught by the same check.` },
            { text: `"Everyone must test more carefully."`,
              grade: 'ok', meters: { delivery: -1 },
              result: `An appeal, not an action. Nothing in the system changes.` },
            { text: `Only seniors may deploy payment changes from now on.`,
              grade: 'poor', meters: { delivery: -1, team: -2 },
              result: `A rule that blames juniors, slows the team, and does not touch the real gap: the missing test.` }
          ]
        }
      },
      debrief: {
        points: [
          `In the first hour, protect the person in public, and promise a blameless review.`,
          `A change that passed review and tests is a failure of the system, not of one person.`,
          `Blameless reviews ask what made the mistake easy; their actions change the system, with owners and dates.`,
          `How you treat the first incident decides whether people report the next one quickly.`
        ],
        script: `> "Refunds are back; thanks, everyone. We'll hold a blameless review tomorrow at 11: what made this possible, not who. Karthik, thanks for spotting it and rolling back fast."`,
        analogy: `Blaming the person who triggered an outage is like deleting the log that recorded the error: the next failure is just as likely, and now nobody will tell you about it.`
      },
      links: ['lesson:psychological-safety', 'phrase:care-mistake-blameless', 'term:postmortem', 'term:psychological-safety', 'scenario:quiet-junior']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'merged-team-storming',
      track: 'people',
      title: `Two teams merged, and nobody agrees`,
      summary: `Three developers from another team joined yours, and arguments about branches, reviews and the stand-up are slowing everything. Practise leading a team through storming.`,
      keywords: ['team merge', 'reorg', 'storming', 'tuckman', 'working agreement', 'conflict', 'new team members', 'velocity drop'],
      role: `You lead a team that has just grown from five to eight: three developers joined from the mobile team after a reorg.`,
      setting: `Week three after the merge. The newcomers want short-lived branches and pairing; your original team uses long branches and reviews in its own time. Stand-ups run long with arguments, and two pull requests were reverted after a fight about branching.`,
      stakes: `Velocity has dropped by a third. The newcomers feel like guests; the original team feels invaded. Your manager is asking questions.`,
      start: 'manager',
      steps: {
        manager: {
          lines: [{ who: 'Priya, your manager', say: `Velocity's down a third since the merge. Was this a mistake?` }],
          prompt: 'What do you tell her?',
          options: [
            { text: `"Not a mistake; it's a normal stage. A merged team argues about how to work before it settles. I expect two more Sprints at lower velocity, and here's my plan to get through it faster."`,
              grade: 'best', meters: { trust: 2 }, next: 'team',
              result: `Priya is reassured by the honesty and the plan, and asks to see velocity again in a month.` },
            { text: `"The new people are slowing us down."`,
              grade: 'poor', meters: { trust: -1, team: -2 }, next: 'team',
              result: `You blamed the newcomers to your manager. It will get back to them.` },
            { text: `"Give it time; it'll settle."`,
              grade: 'ok', meters: { trust: -1 }, next: 'team',
              result: `Probably true, but there is no plan, and Priya is not reassured.` }
          ]
        },
        team: {
          lines: [{ narrate: `You need the team to agree how it works.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Run a working-agreement session: each disputed practice (branching, reviews, the stand-up time) gets both versions on the board; the team agrees one for the next two Sprints as an experiment; you write it down and review it at the retro.`,
              grade: 'best', meters: { delivery: 1, team: 2 }, next: 'holdout',
              result: `The session is noisy and productive. The agreement fits on one page, and both groups recognise something of theirs in it.` },
            { text: `Decide yourself: everyone works the original team's way.`,
              grade: 'poor', meters: { delivery: 1, team: -2 }, next: 'holdout',
              result: `Quick, and the newcomers conclude they have been taken over. They comply and disengage.` },
            { text: `Let each group keep its own way.`,
              grade: 'ok', meters: { delivery: -1, team: -1 }, next: 'holdout',
              result: `No more fights, and no team: two groups in one stand-up, and merge pain every Sprint.` }
          ]
        },
        holdout: {
          lines: [{ narrate: `Two weeks later, Sameer from the original team still uses long branches: "The new way doesn't work for my kind of changes."` }],
          prompt: 'What do you do?',
          options: [
            { text: `Talk to Sameer privately: hear what does not work for his changes, ask him to bring it to the retro as a change to the agreement, and to follow the agreement until then.`,
              grade: 'best', meters: { delivery: 1, team: 2 },
              result: `At the retro, Sameer's point about database migrations leads to an exception the whole team agrees. He follows the agreement because he helped shape it.` },
            { text: `Let it slide; he's senior.`,
              grade: 'ok', meters: { team: -1 },
              result: `Others notice that the agreement is optional for seniors. Two more people drift back to their old ways.` },
            { text: `Call him out in the stand-up for ignoring the agreement.`,
              grade: 'poor', meters: { team: -2 },
              result: `A public correction of a senior at a fragile moment. The split between old and new grows deeper.` }
          ]
        }
      },
      debrief: {
        points: [
          `Conflict after a merge or a big change is a normal stage, storming, not proof of failure. Say so, with a plan.`,
          `Turn disputes about how the team works into a written working agreement, tried as an experiment and reviewed at the retro.`,
          `Do not impose one group's way: the other group hears "you were taken over".`,
          `When someone ignores the agreement, talk privately, and channel their objection into changing it.`
        ],
        script: `> "It's not a mistake; it's a normal stage. A merged team argues about how to work before it settles. I expect two more Sprints at lower velocity, and here's my plan to get through it faster."`,
        analogy: `Merging two teams is merging two long-lived branches: conflicts are expected, not a sign the merge was wrong. You resolve them one at a time, agree the result, and run the tests again.`
      },
      links: ['explainer:tuckman', 'term:working-agreement', 'lesson:hard-conversations', 'scenario:retro-silent']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'family-emergency-in-crunch',
      track: 'people',
      title: `A family emergency in release week`,
      summary: `Two days before a release, your only tester's father is taken to hospital. Practise putting the person first and still covering the work.`,
      keywords: ['family emergency', 'personal', 'leave', 'release', 'tester', 'single point of failure', 'empathy', 'crunch'],
      role: `You lead a team of six. Kavya is the team's only tester.`,
      setting: `Tuesday evening, two days before Thursday's release. Kavya calls: her father has been admitted to hospital in her home town, a night's journey away.`,
      stakes: `Kavya is the only person who knows the regression test plan, and the release matters to the business. What you say now she will remember for years, and so will the team.`,
      start: 'call',
      steps: {
        call: {
          lines: [{ who: 'Kavya', say: `My father's in hospital. I need to go home tonight. I'm so sorry, I know it's release week.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Go. Family first, and don't apologise. Is there anything I can do? When you get a minute before you leave, just tell me where the test plan is. We'll handle the rest."`,
              grade: 'best', meters: { trust: 1, team: 2 }, next: 'cover',
              result: `Kavya cries a little, thanks you, and sends the link from the station.` },
            { text: `"Of course. Could you join the release call on Thursday from there?"`,
              grade: 'poor', meters: { team: -2 }, next: 'cover',
              result: `She says yes, because saying no feels impossible, and spends Thursday on a release call in a hospital corridor.` },
            { text: `"Okay. Can you hand over everything properly before you go?"`,
              grade: 'ok', meters: { delivery: 1, team: -1 }, next: 'cover',
              result: `Reasonable on paper. In practice she spends two hours writing a handover instead of catching her train.` }
          ]
        },
        cover: {
          lines: [{ narrate: `Kavya has gone. You have the link to her test plan.` }],
          prompt: 'How do you cover the release?',
          options: [
            { text: `Tell the Product Owner and your manager plainly: the release goes on Thursday with the core regression run by Divya and Arjun from Kavya's plan, or moves to Monday if the run finds anything serious; ask them to choose. And do not contact Kavya.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 1 },
              result: `They choose Thursday with the core run. Divya and Arjun find one issue, fixed by Wednesday night. The release is uneventful, and Kavya comes back the next week to a kind message from the team.` },
            { text: `Release as planned, and trust the developers to test enough.`,
              grade: 'ok', meters: { delivery: -1 },
              result: `Without a plan, each developer tests their own change and nobody runs the checks across features. A small bug reaches customers.` },
            { text: `Message Kavya on Wednesday "just to check one thing" about the plan, and again on Thursday.`,
              grade: 'poor', meters: { team: -2 },
              result: `Each message pulls her back to work at the hospital. She answers every one, and she remembers it.` }
          ]
        }
      },
      debrief: {
        points: [
          `In a personal emergency, put the person first, out loud, and do not make them apologise.`,
          `Ask only for the minimum (where is the plan?), then leave them alone. "Just one thing" is never one thing.`,
          `Make the trade-off visible to the people who own it: release with a smaller test run, or move the date.`,
          `A single person holding critical knowledge is a risk to fix before the next emergency: cross-train.`
        ],
        script: `> "Go. Family first, and don't apologise. When you get a minute, just tell me where the test plan is. We'll handle the rest, and nobody will call you."`,
        analogy: `A single tester who knows the regression plan is a single point of failure. You do not fix it during the outage by paging the failed node; you fail over, and add redundancy afterwards.`
      },
      links: ['phrase:care-personal', 'lesson:psychological-safety', 'tool:raid', 'term:bus-factor']
    },

    /* ------------------------------------------------------------------ */
    {
      id: 'interesting-work-favouritism',
      track: 'people',
      title: `"You always give Divya the interesting work"`,
      summary: `A developer tells you the good projects always go to the same person. Practise checking whether it is true, and making the way you assign work fair and visible.`,
      keywords: ['favouritism', 'favoritism', 'fair', 'interesting work', 'stretch', 'assignment', 'growth', 'bias'],
      role: `You lead a team of six.`,
      setting: `In your 1:1, Arjun says it quietly.`,
      stakes: `Arjun is solid, and quieter than Divya. If he is right, you have been building one person's career and stalling the others'. If he is wrong, he still believes it, and others may too.`,
      start: 'said',
      steps: {
        said: {
          lines: [{ who: 'Arjun', say: `Can I say something? The interesting work always goes to Divya. The payment gateway, the new search, the architecture review. I get the bug fixes.` }],
          prompt: 'What do you say?',
          options: [
            { text: `"Thank you for telling me. I want to look at that honestly, not defend myself. Let me check what has gone to whom over the last six months, and I'll come back to you on Friday."`,
              grade: 'best', meters: { trust: 2, team: 1 }, next: 'check',
              result: `Arjun looks surprised that you did not argue. You open the Sprint history that evening.` },
            { text: `"Divya's just more experienced with that kind of work."`,
              grade: 'poor', meters: { team: -2 }, next: 'check',
              result: `Possibly true, and exactly the reasoning that keeps it true forever: nobody else ever gets the experience. Still, his words stay with you, and you look at the history.` },
            { text: `"I'll give you the next big project."`,
              grade: 'ok', meters: { team: 1 }, next: 'check',
              result: `A quick fix that treats it as one person's complaint, not a pattern, and you have not checked whether he is right. You look at the history.` }
          ]
        },
        check: {
          lines: [{ narrate: `You go through the last six months. Divya led four of the five largest pieces of work. Each time, you picked her because she was free and you knew she would deliver.` }],
          prompt: 'What do you do?',
          options: [
            { text: `Tell Arjun he was right, and change how work is given out: list the upcoming stretch work at planning, ask who wants it and why, rotate it on purpose with support (Divya as reviewer, not owner), and give Arjun the next design with a clear brief.`,
              grade: 'best', meters: { trust: 2, delivery: 1, team: 2 },
              result: `The next design goes to Arjun, with Divya reviewing. It takes a little longer, and it is good. Divya finally gets time for the architecture work she wanted, and two others ask for stretch work at planning.` },
            { text: `Give Arjun the next big piece, but keep assigning work the way you always have.`,
              grade: 'ok', meters: { team: 1 },
              result: `Arjun is happy, and the pattern stays. Six months later someone else raises the same thing.` },
            { text: `Decide it was a coincidence, and say nothing more.`,
              grade: 'poor', meters: { trust: -2, team: -2 },
              result: `Arjun took a risk to raise it, and heard nothing back. He stops raising things with you.` }
          ]
        }
      },
      debrief: {
        points: [
          `When someone says work is assigned unfairly, check the facts before you defend yourself, and come back when you said you would.`,
          `"They're more experienced" keeps it that way: experience comes from the work.`,
          `Make stretch work visible and ask who wants it; rotate it on purpose, with support.`,
          `The safe choice for this Sprint (the person you know will deliver) is often the wrong choice for the team.`
        ],
        script: `> "Thank you for telling me. I want to look at it honestly, not defend myself. I'll check what has gone to whom over the last six months and come back to you on Friday."`,
        analogy: `Always sending the hardest requests to the same node is a load balancer with a favourite: it works until that node goes down, and the rest of the cluster has never been tested under load.`
      },
      links: ['lesson:growth-conversations', 'lesson:praise-and-credit', 'phrase:care-fair-work', 'tool:delegate', 'lesson:receiving-feedback']
    }
  );
})(window.LELT);
