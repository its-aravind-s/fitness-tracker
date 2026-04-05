const DB_NAME = 'FitTrackerDB';
const DB_VERSION = 2;

const db = {
  instance: null,

  async init() {
    if (this.instance) return this.instance;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.instance = request.result;
        resolve(this.instance);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('daily')) {
          db.createObjectStore('daily', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('prs')) {
          db.createObjectStore('prs', { keyPath: 'exercise' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('measurements')) {
          db.createObjectStore('measurements', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
      };
    });
  },

  async get(store, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.instance.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async set(store, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.instance.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(store) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.instance.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async delete(store, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.instance.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clear(store) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.instance.transaction(store, 'readwrite');
      const req = tx.objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

const DEFAULT_MEAL_PLAN = [
  {s:'morning', time:'4:50 am',      title:'Wake up + black coffee',     sub:'Caffeine peaks at 5 am',              tag:'wake',  ord:1},
  {s:'morning', time:'5:00 am',      title:'5g creatine monohydrate',    sub:'With water before cardio',            tag:'supp',  ord:2},
  {s:'morning', time:'5:00–5:50 am', title:'Incline walking',            sub:'Fasted cardio — low intensity fat burn', tag:'cardio', ord:3},
  {s:'morning', time:'5:50 am',      title:'Banana',                     sub:'Fast carb before strength training',  tag:'food',  ord:4},
  {s:'morning', time:'6:00–7:30 am', title:'Strength training',          sub:'Log in the Workout tab',              tag:'gym',   ord:5},
  {s:'morning', time:'7:30 am',      title:'Whey protein + banana/juice',sub:'Post-workout: protein + fast carb',   tag:'food',  ord:6},
  {s:'meals',   time:'8:30 am',      title:'Breakfast',                  sub:'Sweet potato + eggs + egg whites',    tag:'meal',  ord:7},
  {s:'supps',   time:'8:30 am',      title:'Vitamin D + B12',            sub:'Fat-soluble — take with breakfast',   tag:'supp',  ord:8},
  {s:'meals',   time:'11:00 am',     title:'Mid-morning snack',          sub:'Buttermilk + peanuts + fruit',        tag:'meal',  ord:9},
  {s:'meals',   time:'1:00 pm',      title:'Lunch',                      sub:'Chicken + veg + red rice + curd',     tag:'meal',  ord:10},
  {s:'supps',   time:'1:00 pm',      title:'Fish oil + multivitamin',    sub:'Take with your largest meal',         tag:'supp',  ord:11},
  {s:'meals',   time:'4:00 pm',      title:'Afternoon snack',            sub:'Greek yogurt or paneer + nuts',       tag:'meal',  ord:12},
  {s:'evening', time:'7:30 pm',      title:'Dinner',                     sub:'Egg omelette + red rice + veg/salad', tag:'meal',  ord:13},
  {s:'supps',   time:'9:30 pm',      title:'ZMA',                        sub:'30–60 min after dinner, empty stomach',tag:'supp', ord:14},
];

const DEFAULT_SPLIT = {
  1:{name:'Legs — quad focus',badge:'badge-leg',ex:[
    {n:'Barbell back squat',sets:4,reps:'6–8'},
    {n:'Bulgarian split squat',sets:3,reps:'8–10 each'},
    {n:'Leg press',sets:3,reps:'10–12'},
    {n:'Leg extension',sets:3,reps:'12–15'},
    {n:'Standing calf raise',sets:4,reps:'12–15'},
  ]},
  2:{name:'Push — chest, shoulders, triceps',badge:'badge-push',ex:[
    {n:'Flat barbell bench press',sets:4,reps:'6–8'},
    {n:'Incline dumbbell press',sets:3,reps:'8–10'},
    {n:'Cable fly (low to high)',sets:3,reps:'12–15'},
    {n:'Seated dumbbell OHP',sets:3,reps:'8–10'},
    {n:'Lateral raise',sets:4,reps:'15–20'},
    {n:'Overhead tricep extension',sets:3,reps:'10–12'},
    {n:'Tricep pushdown (rope)',sets:3,reps:'12–15'},
  ]},
  3:{name:'Legs — hamstring & glute focus',badge:'badge-leg',ex:[
    {n:'Romanian deadlift',sets:4,reps:'6–8'},
    {n:'Hack squat / leg press',sets:3,reps:'8–10'},
    {n:'Seated leg curl',sets:4,reps:'10–12'},
    {n:'Hip thrust (barbell)',sets:3,reps:'10–12'},
    {n:'Cable kickback',sets:3,reps:'15 each'},
    {n:'Seated calf raise',sets:4,reps:'12–15'},
  ]},
  4:{name:'Pull — back, rear delts, biceps',badge:'badge-pull',ex:[
    {n:'Weighted pull-up / lat pulldown',sets:4,reps:'6–8'},
    {n:'Barbell bent-over row',sets:4,reps:'6–8'},
    {n:'Seated cable row',sets:3,reps:'10–12'},
    {n:'Single-arm dumbbell row',sets:3,reps:'10–12 each'},
    {n:'Reverse pec deck / face pull',sets:3,reps:'15–20'},
    {n:'Incline dumbbell curl',sets:3,reps:'10–12'},
    {n:'Hammer curl',sets:3,reps:'10–12'},
  ]},
  5:{name:'Arms + shoulders + core',badge:'badge-arms',ex:[
    {n:'EZ-bar curl',sets:4,reps:'8–10'},
    {n:'Concentration curl',sets:3,reps:'12–15 each'},
    {n:'Close-grip bench press',sets:4,reps:'8–10'},
    {n:'Skull crusher (EZ bar)',sets:3,reps:'10–12'},
    {n:'Lateral raise + face pull superset',sets:3,reps:'15+15'},
    {n:'Cable crunch',sets:3,reps:'15–20'},
    {n:'Ab wheel rollout',sets:3,reps:'10–12'},
    {n:'Hanging knee/leg raise',sets:3,reps:'12–15'},
  ]},
};

const DEFAULT_VEG_PLAN = {
  1: { vegs: 'Carrot + Broccoli', qty: '50 g + 50 g', method: 'Steam', time: 'Carrot 8 min, Broccoli 4 min' },
  2: { vegs: 'Spinach + Green Beans', qty: '50 g + 50 g', method: 'Blanch + Steam', time: 'Spinach 30–60 sec, Beans 6 min' },
  3: { vegs: 'Beetroot + Capsicum', qty: '50 g + 50 g', method: 'Pressure cook + Light fry', time: 'Beetroot 2 whistles, Capsicum 2–3 min' },
  4: { vegs: 'Carrot + Mushroom', qty: '50 g + 50 g', method: 'Steam + Light fry', time: 'Carrot 8 min, Mushroom 3 min' },
  5: { vegs: 'Broccoli + Capsicum', qty: '50 g + 50 g', method: 'Steam + Light fry', time: 'Broccoli 4 min, Capsicum 2–3 min' },
  6: { vegs: 'Spinach + Beetroot', qty: '50 g + 50 g', method: 'Blanch + Pressure cook', time: 'Spinach 30–60 sec, Beetroot 2 whistles' },
  0: { vegs: 'Green Beans + Mushroom', qty: '50 g + 50 g', method: 'Steam + Light fry', time: 'Beans 6 min, Mushroom 3 min' },
};

const KEY_LIFTS = ['Barbell back squat','Romanian deadlift','Flat barbell bench press','Weighted pull-up / lat pulldown','Barbell bent-over row','Hip thrust (barbell)','Close-grip bench press','Seated leg curl'];

let app = {
  offset: 0,
  mealPlan: null,
  split: null,
  settings: null,

  async init() {
    await db.init();
    await this.loadSettings();
    this.mealPlan = this.settings?.mealPlan || [...DEFAULT_MEAL_PLAN];
    this.split = this.settings?.split || JSON.parse(JSON.stringify(DEFAULT_SPLIT));
  },

  async loadSettings() {
    this.settings = await db.get('settings', 'main') || {
      key: 'main',
      theme: 'dark',
      weekStart: 1,
      weightUnit: 'kg',
      bodyWeight: null,
      mealPlan: null,
      split: null
    };
  },

  async saveSettings() {
    this.settings.mealPlan = this.mealPlan;
    this.settings.split = this.split;
    await db.set('settings', this.settings);
  },

  getDate(off = this.offset) {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return d;
  },

  dateKey(off = this.offset) {
    return this.getDate(off).toISOString().slice(0, 10);
  },

  dayOf(off = this.offset) {
    return this.getDate(off).getDay();
  },

  async getDayData(key) {
    const data = await db.get('daily', key);
    return data || { date: key, checks: {}, sets: {} };
  },

  async saveDayData(key, data) {
    await db.set('daily', { ...data, date: key });
  },

  fmtDate(off = this.offset) {
    const d = this.getDate(off);
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const prefix = off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : off === -1 ? 'Yesterday' : '';
    const main = prefix || days[d.getDay()];
    const sub = (prefix ? days[d.getDay()] + ', ' : '') + d.getDate() + ' ' + months[d.getMonth()];
    return { main, sub, full: d.toISOString().slice(0, 10) };
  },

  async getWorkoutHistory() {
    const all = await db.getAll('daily');
    return all.filter(d => Object.keys(d.sets || {}).length > 0).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getMeasurements() {
    return (await db.getAll('measurements')).sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveMeasurement(date, data) {
    await db.set('measurements', { date, ...data });
  },

  async getPRs() {
    const all = await db.getAll('prs');
    const prs = {};
    all.forEach(p => prs[p.exercise] = p);
    return prs;
  },

  async updatePR(exercise, kg, reps, date) {
    const vol = kg * reps;
    const existing = await db.get('prs', exercise);
    if (!existing || vol > existing.vol) {
      await db.set('prs', { exercise, kg, reps, vol, date });
      return true;
    }
    return false;
  },

  async exportData() {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      daily: await db.getAll('daily'),
      prs: await db.getAll('prs'),
      measurements: await db.getAll('measurements'),
      goals: await db.getAll('goals'),
      settings: this.settings
    };
    return JSON.stringify(data, null, 2);
  },

  async importData(json) {
    try {
      const data = JSON.parse(json);
      if (!data.daily) throw new Error('Invalid backup format');
      
      for (const d of data.daily) await db.set('daily', d);
      for (const p of data.prs || []) await db.set('prs', p);
      for (const m of data.measurements || []) await db.set('measurements', m);
      for (const g of data.goals || []) await db.set('goals', g);
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings, key: 'main' };
        await this.saveSettings();
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  async clearAll() {
    await db.clear('daily');
    await db.clear('prs');
    await db.clear('measurements');
    await db.clear('settings');
    await db.clear('goals');
    this.mealPlan = [...DEFAULT_MEAL_PLAN];
    this.split = JSON.parse(JSON.stringify(DEFAULT_SPLIT));
    this.settings = null;
    await this.loadSettings();
  },

  async getWeeklySummary() {
    const all = await db.getAll('daily');
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0,0,0,0);
    const weekKey = monday.toISOString().slice(0,10);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().slice(0,10));
    }

    let workouts = 0, totalVolume = 0, mealsCompleted = 0, totalMeals = 0;
    const daysDone = [];
    weekDays.forEach((dk, idx) => {
      const day = all.find(d => d.date === dk);
      if (!day) { daysDone.push(false); return; }
      const hasSets = Object.keys(day.sets || {}).length > 0;
      const hasCompletedSets = Object.values(day.sets || {}).some(sets => sets.some(s => s.done));
      if (hasSets && hasCompletedSets) { workouts++; daysDone.push(true); } else { daysDone.push(false); }
      Object.values(day.sets || {}).forEach(sets => {
        sets.forEach(s => { if (s.done && s.kg && s.reps) totalVolume += parseFloat(s.kg) * parseInt(s.reps); });
      });
      const checks = day.checks || {};
      const mealChecks = Object.keys(checks).filter(k => k.startsWith('m'));
      mealsCompleted += mealChecks.filter(k => checks[k]).length;
      totalMeals += this.mealPlan ? this.mealPlan.length : 0;
    });

    return { workouts, totalVolume: Math.round(totalVolume), mealsCompleted, totalMeals, daysDone, weekDays };
  },

  async getGoals() {
    return (await db.getAll('goals')).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async saveGoal(goal) {
    if (!goal.id) goal.id = 'g_' + Date.now();
    if (!goal.createdAt) goal.createdAt = new Date().toISOString();
    await db.set('goals', goal);
    return goal;
  },

  async deleteGoal(id) {
    await db.delete('goals', id);
  },

  async computeGoalProgress(goal) {
    if (goal.type === 'lift') {
      const pr = await db.get('prs', goal.exercise);
      if (!pr) return 0;
      return Math.min(100, Math.round((pr.kg / goal.targetValue) * 100));
    }
    if (goal.type === 'weight') {
      const measurements = await this.getMeasurements();
      if (measurements.length === 0) return 0;
      const latest = measurements[0].weight;
      if (!latest) return 0;
      const startWeight = goal.startValue || latest;
      const target = goal.targetValue;
      if (startWeight === target) return 100;
      const progress = Math.abs(latest - startWeight) / Math.abs(target - startWeight) * 100;
      return Math.min(100, Math.round(progress));
    }
    if (goal.type === 'workout_count') {
      const history = await this.getWorkoutHistory();
      return Math.min(100, Math.round((history.length / goal.targetValue) * 100));
    }
    if (goal.type === 'streak') {
      const all = await db.getAll('daily');
      const workoutDates = all.filter(d => Object.values(d.sets || {}).some(sets => sets.some(s => s.done))).map(d => d.date);
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        if (workoutDates.includes(d.toISOString().slice(0,10))) streak++;
        else if (i > 0) break;
      }
      return Math.min(100, Math.round((streak / goal.targetValue) * 100));
    }
    return 0;
  },

  async getAchievements() {
    const history = await this.getWorkoutHistory();
    const prs = await this.getPRs();
    const measurements = await this.getMeasurements();
    const all = await db.getAll('daily');

    const workoutDates = history.map(h => h.date).sort();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (workoutDates.includes(d.toISOString().slice(0,10))) streak++;
      else if (i > 0) break;
    }

    let totalVolume = 0;
    history.forEach(h => {
      Object.values(h.sets || {}).forEach(sets => {
        sets.forEach(s => { if (s.done && s.kg && s.reps) totalVolume += parseFloat(s.kg) * parseInt(s.reps); });
      });
    });

    let totalMealsChecked = 0;
    all.forEach(d => {
      const checks = d.checks || {};
      totalMealsChecked += Object.keys(checks).filter(k => k.startsWith('m') && checks[k]).length;
    });

    const prCount = Object.keys(prs).length;

    const defs = [
      { id: 'first_workout', icon: '💪', name: 'First Rep', desc: 'Complete your first workout', check: () => history.length >= 1 },
      { id: 'five_workouts', icon: '🔥', name: 'Getting Started', desc: 'Complete 5 workouts', check: () => history.length >= 5 },
      { id: 'twenty_workouts', icon: '⚡', name: 'Consistent', desc: 'Complete 20 workouts', check: () => history.length >= 20 },
      { id: 'fifty_workouts', icon: '🏆', name: 'Dedicated', desc: 'Complete 50 workouts', check: () => history.length >= 50 },
      { id: 'hundred_workouts', icon: '👑', name: 'Centurion', desc: 'Complete 100 workouts', check: () => history.length >= 100 },
      { id: 'first_pr', icon: '🥇', name: 'Record Breaker', desc: 'Set your first PR', check: () => prCount >= 1 },
      { id: 'five_prs', icon: '📈', name: 'PR Machine', desc: 'Set 5 different PRs', check: () => prCount >= 5 },
      { id: 'streak_3', icon: '🔥', name: 'Hat Trick', desc: '3-day workout streak', check: () => streak >= 3 },
      { id: 'streak_7', icon: '💎', name: 'Iron Week', desc: '7-day workout streak', check: () => streak >= 7 },
      { id: 'streak_30', icon: '🌟', name: 'Unstoppable', desc: '30-day workout streak', check: () => streak >= 30 },
      { id: 'volume_10k', icon: '🏋️', name: 'Heavy Lifter', desc: 'Lift 10,000 kg total volume', check: () => totalVolume >= 10000 },
      { id: 'volume_100k', icon: '🦾', name: 'Iron Giant', desc: 'Lift 100,000 kg total volume', check: () => totalVolume >= 100000 },
      { id: 'volume_1m', icon: '🗿', name: 'Titan', desc: 'Lift 1,000,000 kg total volume', check: () => totalVolume >= 1000000 },
      { id: 'first_measure', icon: '📏', name: 'Self Aware', desc: 'Record your first measurement', check: () => measurements.length >= 1 },
      { id: 'meals_50', icon: '🥗', name: 'Clean Eater', desc: 'Complete 50 meal checks', check: () => totalMealsChecked >= 50 },
      { id: 'meals_200', icon: '🍽️', name: 'Nutrition Pro', desc: 'Complete 200 meal checks', check: () => totalMealsChecked >= 200 },
    ];

    return defs.map(d => ({ ...d, earned: d.check() }));
  },

  scheduleReminders() {
    if (!this.settings?.reminders?.enabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const reminders = this.settings.reminders;
    const now = new Date();
    const check = (timeStr, msg) => {
      if (!timeStr) return;
      const [h, m] = timeStr.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      const diff = target - now;
      if (diff > 0 && diff < 86400000) {
        setTimeout(() => {
          new Notification('FitTracker', { body: msg, icon: 'icons/icon-192.png' });
        }, diff);
      }
    };
    if (reminders.workout) check(reminders.workoutTime, '🏋️ Time for your workout!');
    if (reminders.meals) check(reminders.mealTime, '🥗 Don\'t forget your meals!');
    if (reminders.supplements) check(reminders.suppTime, '💊 Time for supplements!');
  },

  getStats() {
    return db.getAll('daily').then(all => {
      const withWorkouts = all.filter(d => Object.keys(d.sets || {}).length > 0);
      const workoutDates = withWorkouts.map(d => d.date).sort();
      
      let streak = 0;
      const today = new Date().toISOString().slice(0, 10);
      if (workoutDates.includes(today)) streak = 1;
      
      for (let i = 1; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (workoutDates.includes(k)) streak++;
        else if (i > 0) break;
      }
      
      return {
        totalWorkouts: withWorkouts.length,
        prCount: Object.keys(this.getPRs()).length,
        streak
      };
    });
  }
};

function svgCheck(white = true) {
  return `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="${white ? '#000' : '#00e676'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,6 4.5,9 10.5,3"/></svg>`;
}
