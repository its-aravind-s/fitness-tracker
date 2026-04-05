const DB_NAME = 'FitTrackerDB';
const DB_VERSION = 1;

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
  {s:'morning', time:'4:50 am', title:'Wake up + black coffee', sub:'Caffeine peaks at 5 am'},
  {s:'morning', time:'5:00 am', title:'5g creatine monohydrate', sub:'With water before cardio'},
  {s:'morning', time:'5:00–5:50', title:'Incline walking', sub:'Fasted cardio — low intensity fat burn'},
  {s:'morning', time:'5:50 am', title:'Banana', sub:'Fast carb before strength training'},
  {s:'morning', time:'6:00–7:30', title:'Strength training', sub:'Log in the Workout tab'},
  {s:'morning', time:'7:30 am', title:'Whey protein + banana/juice', sub:'Post-workout: protein + fast carb'},
  {s:'supps', time:'Breakfast', title:'Vitamin D + B12', sub:'Fat-soluble — always take with food'},
  {s:'supps', time:'Lunch', title:'Fish oil + multivitamin', sub:'With your largest meal'},
  {s:'supps', time:'Before bed', title:'ZMA', sub:'30–60 min after dinner, empty stomach'},
  {s:'meals', time:'8:30–9:00 am', title:'Breakfast', sub:'Sweet potato + eggs + egg whites'},
  {s:'meals', time:'11:00 am', title:'Mid-morning snack', sub:'Buttermilk + peanuts + fruit'},
  {s:'meals', time:'1:00 pm', title:'Lunch', sub:'Chicken + veg + red rice + curd'},
  {s:'meals', time:'4:00 pm', title:'Afternoon snack', sub:'Greek yogurt or paneer + nuts'},
  {s:'evening', time:'7:30–8:00 pm', title:'Dinner', sub:'Egg omelette + red rice + veg/salad'},
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
      version: 1,
      exportDate: new Date().toISOString(),
      daily: await db.getAll('daily'),
      prs: await db.getAll('prs'),
      measurements: await db.getAll('measurements'),
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
    this.mealPlan = [...DEFAULT_MEAL_PLAN];
    this.split = JSON.parse(JSON.stringify(DEFAULT_SPLIT));
    this.settings = null;
    await this.loadSettings();
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
