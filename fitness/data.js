/* Match Fit program content: exercises, workouts, yoga and stretch flows, food.
 * Plain data so the plan can be edited without touching app logic.
 */
window.MF_DATA = (function () {
  'use strict';

  // name / cue can be a string or {gym, home}
  var EX = {
    chairSquat: { name: { gym: 'Goblet box squat', home: 'Chair squat' }, cue: 'Sit back until you touch the bench or chair, then stand up tall. Hold a dumbbell at your chest once it feels easy.', q: 'goblet box squat' },
    gobletSquat: { name: 'Goblet squat', cue: 'Dumbbell held at your chest. Sit down between your heels, knees follow your toes, chest stays up.', q: 'goblet squat' },
    squatP3: { name: { gym: 'Leg press or goblet squat', home: 'Goblet squat, 2 second pause' }, cue: { gym: 'Leg press: feet shoulder width, lower until knees reach about 90 degrees, push through the whole foot.', home: 'Pause 2 seconds at the bottom, then drive up. Slow and controlled beats heavy.' }, q: 'goblet squat pause' },
    splitSquat: { name: 'Supported split squat', cue: 'Long stance, hold a rail or wall. Drop the back knee straight down, push up through the front heel.', q: 'split squat' },
    reverseLunge: { name: 'Dumbbell reverse lunge', cue: 'Step back, lower the back knee toward the floor, push through the front foot to return.', q: 'dumbbell reverse lunge' },
    bulgarian: { name: 'Bulgarian split squat', cue: 'Back foot on a bench. Front foot far enough forward that your knee stays over your foot. Hold a wall if needed.', q: 'bulgarian split squat' },
    lateralLunge: { name: 'Lateral lunge', cue: 'Step wide, sit into one hip, keep the other leg straight. Builds the side to side strength you use on court.', q: 'lateral lunge' },

    pushP1: { name: { gym: 'Machine chest press', home: 'Incline push-up' }, cue: { gym: 'Handles at mid chest. Press out, pause, come back slowly.', home: 'Hands on a bench or table edge. Body in one straight line, lower your chest to the edge.' }, q: 'incline push up' },
    pushP2: { name: { gym: 'Dumbbell bench press', home: 'Push-up, knees down is fine' }, cue: { gym: 'Feet planted, shoulder blades pulled back. Lower the dumbbells to chest level, press up.', home: 'Hands a bit wider than shoulders, elbows at about 45 degrees, chest to the floor.' }, q: 'push up' },
    pushP3: { name: { gym: 'Dumbbell bench press', home: 'Push-up, 3 seconds down' }, cue: { gym: 'Same as before, a little heavier. Lower for a slow count of 2.', home: 'Take 3 slow seconds to lower, then push up normally.' }, q: 'dumbbell bench press' },
    shoulderPress: { name: 'Seated dumbbell shoulder press', cue: 'Back supported, ribs down. Press straight up without arching your lower back.', q: 'seated dumbbell shoulder press' },
    standPress: { name: 'Standing dumbbell shoulder press', cue: 'Squeeze glutes and brace your stomach, press overhead, do not lean back.', q: 'standing dumbbell shoulder press' },
    halfKneelPress: { name: 'Half-kneeling one-arm press', cue: 'One knee down, squeeze that side glute, press one dumbbell overhead. Each side.', q: 'half kneeling single arm press' },

    rowP1: { name: { gym: 'Seated cable row', home: 'One-arm dumbbell row, each side' }, cue: 'Pull your elbow toward your back pocket, pause, lower slowly. Shoulders away from your ears.', q: 'one arm dumbbell row' },
    oneArmRow: { name: 'One-arm dumbbell row', cue: 'Hand and knee on a bench, flat back. Pull the dumbbell to your hip. Each side.', q: 'one arm dumbbell row' },
    chestRow: { name: { gym: 'Chest-supported dumbbell row', home: 'One-arm dumbbell row' }, cue: 'Chest on an incline bench (or hand on bench at home). Pull to your ribs, squeeze shoulder blades.', q: 'chest supported dumbbell row' },
    pulldown: { name: { gym: 'Lat pulldown', home: 'Bent-over reverse fly' }, cue: { gym: 'Pull the bar to your upper chest, elbows down and back. Control it up.', home: 'Hinge forward, light dumbbells, raise arms out wide with a soft elbow. Squeeze your upper back.' }, q: 'lat pulldown' },

    gluteBridge: { name: 'Glute bridge', cue: 'Feet flat, push through your heels, squeeze glutes hard at the top for 1 second.', q: 'glute bridge' },
    rdl: { name: 'Dumbbell Romanian deadlift', cue: 'Soft knees, push hips back, dumbbells slide down your thighs, back flat. Stop when you feel the hamstrings.', q: 'dumbbell romanian deadlift' },
    hipThrust: { name: { gym: 'Hip thrust, back on a bench', home: 'Single-leg glute bridge' }, cue: { gym: 'Upper back on the bench, dumbbell or bar on hips. Drive up, chin tucked, pause at the top.', home: 'One foot down, the other leg up. Push through the heel, hips level. Each side.' }, q: 'hip thrust' },

    calfRaise: { name: 'Standing calf raise', cue: 'Rise up, pause, take 3 seconds to lower. Protects your Achilles on court.', q: 'standing calf raise' },
    slCalf: { name: 'Single-leg calf raise', cue: 'Hold a wall, one foot at a time, full range, slow down. Each side.', q: 'single leg calf raise' },
    extRot: { name: { gym: 'Cable external rotation', home: 'Side-lying dumbbell external rotation' }, cue: 'Elbow pinned to your side, rotate the forearm outward. Light weight. Keeps your serving shoulder healthy.', q: 'shoulder external rotation exercise' },
    farmer: { name: 'Farmer carry', cue: 'Heavy dumbbells or two loaded shopping bags. Walk tall with slow steps, shoulders down.', q: 'farmer carry' },

    deadBug: { name: 'Dead bug', cue: 'Lower back pressed into the floor. Reach opposite arm and leg away slowly, return, switch.', q: 'dead bug exercise' },
    sidePlankKnee: { name: 'Side plank, knees down', cue: 'Elbow under shoulder, knees bent, hips lifted in a straight line. Each side.', q: 'side plank knees' },
    plank: { name: 'Plank', cue: 'Elbows under shoulders, squeeze glutes, do not let the hips sag.', q: 'plank' },
    pallof: { name: { gym: 'Pallof press', home: 'Bird dog' }, cue: { gym: 'Stand side-on to a cable at chest height. Press the handle straight out and resist the twist.', home: 'On all fours, reach opposite arm and leg long, hold 2 seconds, switch.' }, q: 'pallof press' },
    plankTaps: { name: 'Plank shoulder taps', cue: 'High plank, feet wide. Tap the opposite shoulder while keeping your hips still.', q: 'plank shoulder taps' }
  };

  function it(ex, sets, reps) { return { ex: ex, sets: sets, reps: reps }; }

  var WARMUP = 'Warm up 5 minutes: 2 minutes brisk walk or bike, 10 bodyweight squats, 10 arm circles each way, 10 glute bridges.';

  var STRENGTH = {
    1: {
      A: { title: 'Strength A', minutes: 30, rest: '60 to 90 sec', items: [
        it('chairSquat', 3, '10'), it('pushP1', 3, '8-12'), it('rowP1', 3, '10-12'),
        it('gluteBridge', 2, '12-15'), it('calfRaise', 2, '15'), it('deadBug', 2, '6 each side')
      ] },
      B: { title: 'Strength B', minutes: 30, rest: '60 to 90 sec', items: [
        it('splitSquat', 3, '8 each side'), it('shoulderPress', 3, '10'), it('pulldown', 3, '10-12'),
        it('rdl', 3, '10'), it('extRot', 2, '15 each side'), it('sidePlankKnee', 2, '20-30 sec each side')
      ] }
    },
    2: {
      A: { title: 'Strength A', minutes: 40, rest: '90 sec', items: [
        it('gobletSquat', 3, '8-12'), it('pushP2', 3, '8-12'), it('oneArmRow', 3, '10 each side'),
        it('rdl', 3, '10'), it('slCalf', 2, '10 each side'), it('plank', 3, '30-40 sec')
      ] },
      B: { title: 'Strength B', minutes: 40, rest: '90 sec', items: [
        it('reverseLunge', 3, '8 each side'), it('standPress', 3, '8-12'), it('pulldown', 3, '10-12'),
        it('hipThrust', 3, '10-12'), it('extRot', 2, '15 each side'), it('pallof', 3, '8 each side'),
        it('farmer', 3, '30 m')
      ] }
    },
    3: {
      A: { title: 'Strength A', minutes: 45, rest: '90 to 120 sec on the first three', items: [
        it('squatP3', 4, '8-10'), it('pushP3', 4, '8-12'), it('chestRow', 4, '10'),
        it('rdl', 3, '8-10'), it('lateralLunge', 2, '8 each side'), it('plankTaps', 3, '10 each side')
      ] },
      B: { title: 'Strength B', minutes: 45, rest: '90 sec', items: [
        it('bulgarian', 3, '8 each side'), it('halfKneelPress', 3, '8-10 each side'), it('pulldown', 3, '10-12'),
        it('hipThrust', 3, '10-12'), it('extRot', 2, '15 each side'), it('farmer', 4, '40 m'),
        it('pallof', 3, '10 each side')
      ] },
      C: { title: 'Bonus circuit', minutes: 20, rest: '90 sec between rounds', circuit: 3, items: [
        it('gobletSquat', 1, '10'), it('pushP2', 1, '8-10'), it('oneArmRow', 1, '10 each side'),
        it('gluteBridge', 1, '15'), it('deadBug', 1, '8 each side')
      ] }
    }
  };

  var PHASES = {
    1: { name: 'Easy start', weeks: 'Weeks 1 to 4', effort: 'End every set feeling you could do about 3 more reps.', note: 'Learn the moves. Weeks 1 and 2 use 2 sets, weeks 3 and 4 use 3 sets.' },
    2: { name: 'Build', weeks: 'Weeks 5 to 8', effort: 'End every set with about 2 reps left.', note: 'Harder versions of each move. Go up in weight once the top of the rep range feels easy.' },
    3: { name: 'Steady', weeks: 'Weeks 9 to 12', effort: 'End every set with 1 or 2 reps left. Never grind out a rep.', note: 'More sets on the big moves, plus an optional 20 minute circuit. Still not high intensity.' }
  };

  // Guided flows. side: true runs the pose once per side.
  function p(name, secs, cue, side) { return { name: name, secs: secs, cue: cue, side: !!side }; }

  var FLOWS = {
    yogaA: { title: 'Yoga: hips and back', kind: 'yoga', blurb: 'Loosens the hips, lower back and glutes that tennis tightens.', steps: [
      p('Seated breathing', 60, 'Sit tall. Breathe in for 4, out for 6.'),
      p('Cat-cow', 60, 'On all fours. Round your back as you breathe out, arch as you breathe in.'),
      p("Child's pose", 60, 'Knees wide, arms long, sink your hips back.'),
      p('Downward dog', 45, 'Bend your knees as much as you need. Pedal the heels slowly.'),
      p('Low lunge', 45, 'Back knee down, hips forward, chest tall. Opens the front of the hip.', true),
      p('Half split', 45, 'From low lunge, shift hips back, front leg straight, toes up.', true),
      p('Figure-4 on your back', 60, 'Ankle over the opposite knee, pull the bottom leg toward you.', true),
      p('Thread the needle', 45, 'On all fours, slide one arm under and rest that shoulder down.', true),
      p('Lying twist', 45, 'Knees to one side, arms wide, look the other way.', true),
      p('Happy baby', 45, 'Hold your feet or shins, rock gently side to side.'),
      p('Legs up the wall', 120, 'Hips close to the wall, legs up, arms relaxed.'),
      p('Rest', 120, 'Lie flat, eyes closed, let your breathing slow down.')
    ] },
    yogaB: { title: 'Yoga: shoulders and hamstrings', kind: 'yoga', blurb: 'Opens the shoulders and hamstrings and trains balance.', steps: [
      p('Cat-cow', 60, 'Move slowly with your breath to wake up the spine.'),
      p('Easy sun salutations', 180, 'Reach up, fold with soft knees, half lift, step back, cobra, downward dog, step forward. 3 slow rounds.'),
      p('Warrior II', 30, 'Front knee over ankle, arms long, look past your front hand.', true),
      p('Triangle', 30, 'Front leg straight, hand on your shin, top arm to the sky.', true),
      p('Tree pose', 30, 'Foot on calf or thigh, never the knee. A hand on the wall is fine.', true),
      p('Standing forward fold', 45, 'Knees soft, let your head hang heavy.'),
      p('Puppy pose', 45, 'From all fours, walk the hands forward and let the chest sink.'),
      p('Sphinx', 60, 'Lie on your front, forearms down, lift the chest gently.'),
      p('Cross-body shoulder stretch', 30, 'Pull one arm across your chest at shoulder height.', true),
      p('Seated forward fold', 60, 'Towel around your feet, long spine, lean forward from the hips.'),
      p('Bridge holds', 90, '3 rounds: 20 seconds up, 10 seconds down.'),
      p('Reclined butterfly', 60, 'On your back, soles together, knees fall open.'),
      p('Rest', 120, 'Lie flat, eyes closed, breathe slowly.')
    ] },
    warmup: { title: 'Tennis warm-up', kind: 'warmup', blurb: 'Before you hit. Gets the legs and shoulder ready.', steps: [
      p('Light jog or skipping', 120, 'Easy pace around the court.'),
      p('Leg swings, front to back', 30, 'Hold the fence, swing loosely.', true),
      p('Leg swings, side to side', 30, 'Face the fence, swing across your body.', true),
      p('Walking lunge with a twist', 45, 'Lunge forward, rotate toward the front leg.'),
      p('Arm circles', 30, 'Small to big, forward then backward.'),
      p('Shadow swings', 60, 'Slow forehands, backhands and serves with the racket.'),
      p('Side shuffles', 30, 'Low and quick along the baseline.'),
      p('Split-step hops', 30, 'Small hops, land ready on the balls of your feet.')
    ] },
    stretch: { title: 'Stretch after tennis', kind: 'stretch', blurb: 'Ten minutes straight after playing. Calves, hips, shoulder, forearm.', steps: [
      p('Calf stretch at a wall', 45, 'Back leg straight, heel down, lean in.', true),
      p('Kneeling hip flexor stretch', 45, 'Back knee down, squeeze that glute, hips forward.', true),
      p('Standing quad stretch', 30, 'Hold your ankle, knees together, stand tall.', true),
      p('Hamstring stretch', 45, 'Heel on a low step or bench, lean forward with a flat back.', true),
      p('Figure-4 glute stretch', 45, 'Seated or lying, ankle over the opposite knee.', true),
      p('Cross-body shoulder stretch', 30, 'Pull your arm across your chest.', true),
      p('Doorway chest stretch', 45, 'Forearms on the door frame, step through gently.'),
      p('Forearm stretch', 30, 'Arm straight, pull fingers back, then down. Helps prevent tennis elbow.', true)
    ] },
    morning: { title: 'Morning 5', kind: 'stretch', blurb: 'Five minutes of mobility. Any day, especially rest days.', steps: [
      p('Cat-cow', 60, 'Slow, with your breath.'),
      p("World's greatest stretch", 30, 'Lunge, elbow to the inside of the front foot, then rotate that arm to the sky.', true),
      p('Hip circles', 30, 'Hands on hips, big slow circles both ways.'),
      p('Open book', 30, 'Lie on your side, knees bent, open the top arm across to the floor behind you.', true),
      p('Deep squat hold', 60, 'Hold a door frame, sit low, chest up.')
    ] }
  };

  var FOOD_RULES = [
    { t: 'Protein first', d: 'A palm or more at every meal, about 40 g, four times a day.' },
    { t: 'Half the plate green', d: 'Vegetables or salad fill half the plate at lunch and dinner.' },
    { t: 'Carbs follow activity', d: 'A bigger portion of rice, potatoes or pasta on tennis days, a smaller one on rest days.' },
    { t: 'Drink water, not calories', d: 'Beer is out. Sparkling water, zero drinks, coffee and tea are in.' },
    { t: 'Two treat meals a week', d: 'Pizza, pasta or fries, planned ahead and eaten without guilt.' }
  ];

  var SWAPS = [
    { t: 'Pizza', d: 'Thin crust with a protein topping like chicken, ham or tuna. Eat a big salad first, then 3 slices, or share. Skip extra cheese and garlic dip.' },
    { t: 'Pasta', d: '80 to 100 g dry pasta (a fist when cooked), add 150 g chicken, tuna, shrimp or lean mince. Tomato sauce rather than cream, extra vegetables.' },
    { t: 'French fries', d: 'Air-fryer or oven fries from 200 g potatoes with a spray of oil, next to a lean protein. At restaurants: small portion, no mayo.' },
    { t: 'Beer', d: 'Sparkling water with lemon, or alcohol-free beer (about 100 kcal per 500 ml). Every beer you skip saves about 200 kcal.' },
    { t: 'Bread', d: 'You already eat little. Keep it that way. One slice of wholegrain with breakfast is fine.' },
    { t: 'Evening snacking', d: 'Greek yogurt or cottage cheese with berries. Lots of protein, keeps you full until bed.' }
  ];

  var MEALS = [
    { when: 'Breakfast', items: [
      { n: '3 eggs, tomatoes and cucumber, 1 slice of bread', k: 400, p: 25 },
      { n: 'Greek yogurt 250 g, berries, 30 g oats', k: 350, p: 30 },
      { n: 'Oats 50 g cooked with a scoop of whey and a banana', k: 430, p: 32 }
    ] },
    { when: 'Lunch', items: [
      { n: 'Chicken bowl: 150 g chicken, big salad, 150 g rice or potatoes', k: 600, p: 50 },
      { n: 'Shopska salad with grilled chicken breast', k: 550, p: 50 },
      { n: 'Tuna, white beans, red onion and greens', k: 500, p: 45 }
    ] },
    { when: 'Dinner', items: [
      { n: 'Salmon, boiled potatoes, green vegetables', k: 650, p: 40 },
      { n: 'Lean steak, big salad, small potatoes', k: 650, p: 55 },
      { n: 'Chicken stir-fry with vegetables and rice', k: 600, p: 45 },
      { n: '3 kebapcheta with salad instead of fries', k: 600, p: 32 }
    ] },
    { when: 'Snacks', items: [
      { n: 'Protein shake in water', k: 120, p: 24 },
      { n: 'Cottage cheese 200 g', k: 170, p: 22 },
      { n: 'Skyr or protein yogurt 200 g', k: 125, p: 22 },
      { n: 'Apple and a small handful of nuts', k: 180, p: 4 }
    ] }
  ];

  var TENNIS_FUEL = [
    '2 to 3 hours before: a normal meal with carbs and protein.',
    'Under an hour before: a banana is enough.',
    'During: water. Add electrolytes when it is hot or you play over 90 minutes.',
    'Within 2 hours after: protein plus carbs. A shake and a banana works.'
  ];

  // Quick-log presets: k = kcal, p = protein g. Typical values, not lab exact.
  var FOODS = [
    { g: 'Protein', n: '3 eggs', k: 215, p: 19 },
    { g: 'Protein', n: 'Chicken breast 150 g', k: 250, p: 46 },
    { g: 'Protein', n: 'Salmon 150 g', k: 310, p: 33 },
    { g: 'Protein', n: 'Lean steak 200 g', k: 420, p: 56 },
    { g: 'Protein', n: 'Tuna can, drained', k: 130, p: 28 },
    { g: 'Protein', n: 'Shrimp 150 g', k: 150, p: 36 },
    { g: 'Protein', n: 'Greek yogurt 200 g', k: 145, p: 20 },
    { g: 'Protein', n: 'Skyr 200 g', k: 125, p: 22 },
    { g: 'Protein', n: 'Cottage cheese 200 g', k: 170, p: 22 },
    { g: 'Protein', n: 'Protein shake', k: 120, p: 24 },
    { g: 'Protein', n: 'Turkey or ham 100 g', k: 110, p: 18 },
    { g: 'Protein', n: '3 kebapcheta', k: 500, p: 30 },
    { g: 'Carbs and sides', n: 'Rice 150 g cooked', k: 195, p: 4 },
    { g: 'Carbs and sides', n: 'Potatoes 250 g', k: 215, p: 5 },
    { g: 'Carbs and sides', n: 'Oats 50 g', k: 190, p: 7 },
    { g: 'Carbs and sides', n: 'Pasta 100 g dry', k: 355, p: 13 },
    { g: 'Carbs and sides', n: 'Bread, 1 slice', k: 80, p: 3 },
    { g: 'Carbs and sides', n: 'Banana', k: 105, p: 1 },
    { g: 'Carbs and sides', n: 'Apple', k: 95, p: 0 },
    { g: 'Carbs and sides', n: 'Berries 150 g', k: 70, p: 1 },
    { g: 'Carbs and sides', n: 'Big salad, light dressing', k: 120, p: 3 },
    { g: 'Carbs and sides', n: 'Shopska salad', k: 300, p: 10 },
    { g: 'Carbs and sides', n: 'Nuts 30 g', k: 180, p: 6 },
    { g: 'Carbs and sides', n: 'Olive oil 1 tbsp', k: 120, p: 0 },
    { g: 'Treats', n: 'Pizza, 1 slice', k: 285, p: 12, treat: true },
    { g: 'Treats', n: 'Whole pizza', k: 900, p: 36, treat: true },
    { g: 'Treats', n: 'Restaurant pasta plate', k: 850, p: 30, treat: true },
    { g: 'Treats', n: 'Fries, medium', k: 340, p: 4, treat: true },
    { g: 'Treats', n: 'Beer 500 ml', k: 215, p: 2, treat: true },
    { g: 'Treats', n: 'Alcohol-free beer 500 ml', k: 100, p: 1 },
    { g: 'Treats', n: 'Glass of wine', k: 125, p: 0, treat: true },
    { g: 'Treats', n: 'Chocolate 50 g', k: 270, p: 4, treat: true }
  ];

  return {
    EX: EX, STRENGTH: STRENGTH, PHASES: PHASES, FLOWS: FLOWS, WARMUP: WARMUP,
    FOOD_RULES: FOOD_RULES, SWAPS: SWAPS, MEALS: MEALS, TENNIS_FUEL: TENNIS_FUEL, FOODS: FOODS,
    yt: function (q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' proper form'); }
  };
})();
