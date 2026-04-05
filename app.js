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

const DEFAULT_FRUIT_PLAN = {
  1: { fruit: 'Apple',               qty: '1 medium',             bestTime: '11:00 am', period: 'Mid-morning',  benefit: 'Digestion + fiber' },
  2: { fruit: 'Banana',              qty: '1 medium',             bestTime: '7:30 am',  period: 'Post workout', benefit: 'Energy + potassium' },
  3: { fruit: 'Papaya',              qty: '150 g',                bestTime: '9:00 am',  period: 'After breakfast', benefit: 'Digestion + fat loss' },
  4: { fruit: 'Orange / Sweet lime', qty: '1 medium',             bestTime: '11:00 am', period: 'Mid-morning',  benefit: 'Immunity + Vitamin C' },
  5: { fruit: 'Pomegranate',         qty: '1 small bowl (100 g)', bestTime: '4:00 pm',  period: 'Afternoon',    benefit: 'Blood flow + recovery' },
  6: { fruit: 'Watermelon',          qty: '150–200 g',            bestTime: '4:00 pm',  period: 'Afternoon',    benefit: 'Hydration + light calories' },
  0: { fruit: 'Guava',               qty: '1 medium',             bestTime: '9:00 am',  period: 'Morning',      benefit: 'High fiber + Vitamin C' },
};

const EXERCISE_META = {
  // ── LEGS ──
  'Barbell back squat':        { muscle:'Quads',     type:'Compound', group:'legs',  icon:'squat' },
  'Bulgarian split squat':     { muscle:'Quads',     type:'Compound', group:'legs',  icon:'lunge' },
  'Leg press':                 { muscle:'Quads',     type:'Compound', group:'legs',  icon:'legpress' },
  'Leg extension':             { muscle:'Quads',     type:'Isolation', group:'legs', icon:'legext' },
  'Standing calf raise':       { muscle:'Calves',    type:'Isolation', group:'calves', icon:'calf' },
  'Seated calf raise':         { muscle:'Calves',    type:'Isolation', group:'calves', icon:'calf' },
  'Romanian deadlift':         { muscle:'Hamstrings', type:'Compound', group:'legs', icon:'deadlift' },
  'Hack squat / leg press':    { muscle:'Quads',     type:'Compound', group:'legs',  icon:'legpress' },
  'Seated leg curl':           { muscle:'Hamstrings', type:'Isolation', group:'legs', icon:'legcurl' },
  'Hip thrust (barbell)':      { muscle:'Glutes',    type:'Compound', group:'glutes', icon:'hipthrust' },
  'Cable kickback':            { muscle:'Glutes',    type:'Isolation', group:'glutes', icon:'kickback' },
  // ── PUSH ──
  'Flat barbell bench press':  { muscle:'Chest',     type:'Compound', group:'chest', icon:'bench' },
  'Incline dumbbell press':    { muscle:'Upper Chest', type:'Compound', group:'chest', icon:'incline' },
  'Cable fly (low to high)':   { muscle:'Chest',     type:'Isolation', group:'chest', icon:'fly' },
  'Seated dumbbell OHP':       { muscle:'Shoulders', type:'Compound', group:'shoulders', icon:'ohp' },
  'Lateral raise':             { muscle:'Side Delts', type:'Isolation', group:'shoulders', icon:'lateral' },
  'Overhead tricep extension': { muscle:'Triceps',   type:'Isolation', group:'arms', icon:'tricep' },
  'Tricep pushdown (rope)':    { muscle:'Triceps',   type:'Isolation', group:'arms', icon:'pushdown' },
  // ── PULL ──
  'Weighted pull-up / lat pulldown': { muscle:'Lats', type:'Compound', group:'back', icon:'pullup' },
  'Barbell bent-over row':     { muscle:'Back',      type:'Compound', group:'back', icon:'row' },
  'Seated cable row':          { muscle:'Back',      type:'Compound', group:'back', icon:'row' },
  'Single-arm dumbbell row':   { muscle:'Back',      type:'Compound', group:'back', icon:'row' },
  'Reverse pec deck / face pull': { muscle:'Rear Delts', type:'Isolation', group:'shoulders', icon:'facepull' },
  'Incline dumbbell curl':     { muscle:'Biceps',    type:'Isolation', group:'arms', icon:'curl' },
  'Hammer curl':               { muscle:'Biceps',    type:'Isolation', group:'arms', icon:'curl' },
  // ── ARMS + CORE ──
  'EZ-bar curl':               { muscle:'Biceps',    type:'Isolation', group:'arms', icon:'curl' },
  'Concentration curl':        { muscle:'Biceps',    type:'Isolation', group:'arms', icon:'curl' },
  'Close-grip bench press':    { muscle:'Triceps',   type:'Compound', group:'arms', icon:'bench' },
  'Skull crusher (EZ bar)':    { muscle:'Triceps',   type:'Isolation', group:'arms', icon:'tricep' },
  'Lateral raise + face pull superset': { muscle:'Shoulders', type:'Isolation', group:'shoulders', icon:'lateral' },
  'Cable crunch':              { muscle:'Abs',       type:'Isolation', group:'core', icon:'crunch' },
  'Ab wheel rollout':          { muscle:'Core',      type:'Compound', group:'core', icon:'crunch' },
  'Hanging knee/leg raise':    { muscle:'Lower Abs', type:'Isolation', group:'core', icon:'legraise' },
};

const GROUP_COLORS = {
  legs:      { bg: 'rgba(68,138,255,0.1)',  border: 'rgba(68,138,255,0.25)', color: '#448aff', gradient: 'linear-gradient(135deg,#448aff,#2979ff)' },
  chest:     { bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)', color: '#00e676', gradient: 'linear-gradient(135deg,#00e676,#00c853)' },
  back:      { bg: 'rgba(255,196,0,0.1)',   border: 'rgba(255,196,0,0.25)', color: '#ffc400', gradient: 'linear-gradient(135deg,#ffc400,#ffab00)' },
  shoulders: { bg: 'rgba(224,64,251,0.1)',  border: 'rgba(224,64,251,0.25)', color: '#e040fb', gradient: 'linear-gradient(135deg,#e040fb,#d500f9)' },
  arms:      { bg: 'rgba(255,112,67,0.1)',  border: 'rgba(255,112,67,0.25)', color: '#ff7043', gradient: 'linear-gradient(135deg,#ff7043,#ff5722)' },
  glutes:    { bg: 'rgba(38,198,218,0.1)',  border: 'rgba(38,198,218,0.25)', color: '#26c6da', gradient: 'linear-gradient(135deg,#26c6da,#00bcd4)' },
  calves:    { bg: 'rgba(141,110,99,0.1)',  border: 'rgba(141,110,99,0.25)', color: '#8d6e63', gradient: 'linear-gradient(135deg,#8d6e63,#795548)' },
  core:      { bg: 'rgba(255,23,68,0.1)',   border: 'rgba(255,23,68,0.25)', color: '#ff1744', gradient: 'linear-gradient(135deg,#ff1744,#d50000)' },
};

const EX_SVGS = {
  squat:    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="27" y="2" width="10" height="4" rx="2" fill="currentColor" opacity=".3"/><circle cx="32" cy="14" r="6" fill="currentColor" opacity=".6"/><path d="M26 22h12l2 14h-4l-1 12h-2l1-12h-4l1 12h-2l-1-12h-4z" fill="currentColor" opacity=".5"/><path d="M22 36l4-2 2 10-6 4z" fill="currentColor" opacity=".4"/><path d="M42 36l-4-2-2 10 6 4z" fill="currentColor" opacity=".4"/><rect x="14" y="6" width="36" height="3" rx="1.5" fill="currentColor" opacity=".25"/></svg>`,
  lunge:    `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="12" r="6" fill="currentColor" opacity=".6"/><path d="M30 20h4l1 10 6 12h-4l-5-10-5 10h-4l6-12z" fill="currentColor" opacity=".5"/><path d="M38 42l4 8h-4l-2-6z" fill="currentColor" opacity=".4"/><path d="M22 42l-2 8h4l2-6z" fill="currentColor" opacity=".4"/></svg>`,
  legpress: `<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="40" width="48" height="4" rx="2" fill="currentColor" opacity=".2"/><path d="M20 28c0-3 2-5 5-5h14c3 0 5 2 5 5v12H20z" fill="currentColor" opacity=".15"/><circle cx="32" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M28 22h8l1 8-3 6h-4l-3-6z" fill="currentColor" opacity=".5"/><path d="M24 36l-2 4h4z" fill="currentColor" opacity=".4"/><path d="M40 36l2 4h-4z" fill="currentColor" opacity=".4"/></svg>`,
  legext:   `<svg viewBox="0 0 64 64" fill="none"><rect x="16" y="30" width="20" height="14" rx="3" fill="currentColor" opacity=".15"/><circle cx="26" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M24 24h4v10h-4z" fill="currentColor" opacity=".4"/><path d="M28 34l14-2v4l-14 2z" fill="currentColor" opacity=".5"/><circle cx="44" cy="35" r="3" fill="currentColor" opacity=".3"/></svg>`,
  calf:     `<svg viewBox="0 0 64 64" fill="none"><rect x="20" y="48" width="24" height="6" rx="2" fill="currentColor" opacity=".2"/><circle cx="32" cy="12" r="5" fill="currentColor" opacity=".6"/><path d="M29 18h6v16h-6z" fill="currentColor" opacity=".4"/><path d="M28 34h8v14h-8z" fill="currentColor" opacity=".5"/><path d="M30 44l-2 8h2z" fill="currentColor" opacity=".3"/><path d="M34 44l2 8h-2z" fill="currentColor" opacity=".3"/></svg>`,
  deadlift: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="10" r="5" fill="currentColor" opacity=".6"/><path d="M28 16h8l2 14-4 4h-4l-4-4z" fill="currentColor" opacity=".4"/><rect x="12" y="42" width="40" height="4" rx="2" fill="currentColor" opacity=".3"/><path d="M26 30l-2 12h4z" fill="currentColor" opacity=".4"/><path d="M38 30l2 12h-4z" fill="currentColor" opacity=".4"/><circle cx="10" cy="44" r="5" fill="currentColor" opacity=".15"/><circle cx="54" cy="44" r="5" fill="currentColor" opacity=".15"/></svg>`,
  legcurl:  `<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="20" width="32" height="10" rx="3" fill="currentColor" opacity=".15"/><circle cx="22" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M18 20h8v10h-8z" fill="currentColor" opacity=".4"/><path d="M26 30l12 10v-4l-12-8z" fill="currentColor" opacity=".5"/><circle cx="40" cy="42" r="3" fill="currentColor" opacity=".3"/></svg>`,
  hipthrust:`<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="32" width="20" height="12" rx="3" fill="currentColor" opacity=".15"/><circle cx="20" cy="24" r="5" fill="currentColor" opacity=".6"/><path d="M18 30h4l10-6v4l-10 6z" fill="currentColor" opacity=".5"/><path d="M32 28l12 1v3l-12-1z" fill="currentColor" opacity=".4"/><rect x="30" y="24" width="20" height="4" rx="2" fill="currentColor" opacity=".3"/></svg>`,
  kickback: `<svg viewBox="0 0 64 64" fill="none"><circle cx="20" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M18 24h4l2 12h-8z" fill="currentColor" opacity=".4"/><path d="M22 36l16-4v4l-16 4z" fill="currentColor" opacity=".5"/></svg>`,
  bench:    `<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="30" width="48" height="4" rx="2" fill="currentColor" opacity=".2"/><rect x="18" y="34" width="4" height="14" rx="1" fill="currentColor" opacity=".15"/><rect x="42" y="34" width="4" height="14" rx="1" fill="currentColor" opacity=".15"/><circle cx="32" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M28 24h8v6h-8z" fill="currentColor" opacity=".4"/><path d="M22 22l-6-8h4l6 8z" fill="currentColor" opacity=".3"/><path d="M42 22l6-8h-4l-6 8z" fill="currentColor" opacity=".3"/><rect x="10" y="12" width="44" height="3" rx="1.5" fill="currentColor" opacity=".25"/></svg>`,
  incline:  `<svg viewBox="0 0 64 64" fill="none"><path d="M16 44l10-20h12l10 20z" fill="currentColor" opacity=".1"/><circle cx="32" cy="16" r="5" fill="currentColor" opacity=".6"/><path d="M28 22h8l1 8h-10z" fill="currentColor" opacity=".4"/><path d="M20 16l-6-6h4l6 6z" fill="currentColor" opacity=".3"/><path d="M44 16l6-6h-4l-6 6z" fill="currentColor" opacity=".3"/><rect x="10" y="8" width="44" height="3" rx="1.5" fill="currentColor" opacity=".25"/></svg>`,
  fly:      `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="16" r="5" fill="currentColor" opacity=".6"/><path d="M28 22h8v8h-8z" fill="currentColor" opacity=".4"/><path d="M16 18c4 4 8 8 12 8" stroke="currentColor" stroke-width="2.5" opacity=".5" stroke-linecap="round"/><path d="M48 18c-4 4-8 8-12 8" stroke="currentColor" stroke-width="2.5" opacity=".5" stroke-linecap="round"/></svg>`,
  ohp:      `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M29 24h6v14h-6z" fill="currentColor" opacity=".4"/><path d="M24 24l-4-14h4l4 14z" fill="currentColor" opacity=".4"/><path d="M40 24l4-14h-4l-4 14z" fill="currentColor" opacity=".4"/><rect x="14" y="6" width="36" height="3" rx="1.5" fill="currentColor" opacity=".3"/><circle cx="12" cy="8" r="3" fill="currentColor" opacity=".15"/><circle cx="52" cy="8" r="3" fill="currentColor" opacity=".15"/></svg>`,
  lateral:  `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M29 20h6v16h-6z" fill="currentColor" opacity=".4"/><path d="M28 24l-14 2v-3l14-2z" fill="currentColor" opacity=".5"/><path d="M36 24l14 2v-3l-14-2z" fill="currentColor" opacity=".5"/><circle cx="12" cy="27" r="3" fill="currentColor" opacity=".3"/><circle cx="52" cy="27" r="3" fill="currentColor" opacity=".3"/></svg>`,
  tricep:   `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M29 20h6v12h-6z" fill="currentColor" opacity=".4"/><path d="M30 20l-2-10h4z" fill="currentColor" opacity=".4"/><path d="M34 20l2-10h-4z" fill="currentColor" opacity=".4"/><circle cx="30" cy="8" r="2" fill="currentColor" opacity=".3"/><circle cx="34" cy="8" r="2" fill="currentColor" opacity=".3"/></svg>`,
  pushdown: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M29 20h6v10h-6z" fill="currentColor" opacity=".4"/><path d="M28 26l-2 14h4l2-10z" fill="currentColor" opacity=".45"/><path d="M36 26l2 14h-4l-2-10z" fill="currentColor" opacity=".45"/><rect x="24" y="12" width="16" height="2" rx="1" fill="currentColor" opacity=".2"/></svg>`,
  pullup:   `<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="4" width="48" height="4" rx="2" fill="currentColor" opacity=".3"/><circle cx="32" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M29 24h6v14h-6z" fill="currentColor" opacity=".4"/><path d="M24 8l4 10h-4z" fill="currentColor" opacity=".35"/><path d="M40 8l-4 10h4z" fill="currentColor" opacity=".35"/></svg>`,
  row:      `<svg viewBox="0 0 64 64" fill="none"><circle cx="24" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M22 24h4l4 10h-12z" fill="currentColor" opacity=".4"/><path d="M28 28l18-4v3l-18 4z" fill="currentColor" opacity=".5"/><circle cx="48" cy="23" r="3" fill="currentColor" opacity=".3"/></svg>`,
  facepull: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="16" r="5" fill="currentColor" opacity=".6"/><path d="M29 22h6v12h-6z" fill="currentColor" opacity=".4"/><path d="M28 26l-10-6v3l10 6z" fill="currentColor" opacity=".45"/><path d="M36 26l10-6v3l-10 6z" fill="currentColor" opacity=".45"/></svg>`,
  curl:     `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="14" r="5" fill="currentColor" opacity=".6"/><path d="M29 20h6v14h-6z" fill="currentColor" opacity=".4"/><path d="M28 28c-4-8-6-10-6-14h3c0 3 2 5 5 12z" fill="currentColor" opacity=".5"/><path d="M36 28c4-8 6-10 6-14h-3c0 3-2 5-5 12z" fill="currentColor" opacity=".5"/><circle cx="21" cy="13" r="2.5" fill="currentColor" opacity=".3"/><circle cx="43" cy="13" r="2.5" fill="currentColor" opacity=".3"/></svg>`,
  crunch:   `<svg viewBox="0 0 64 64" fill="none"><circle cx="22" cy="18" r="5" fill="currentColor" opacity=".6"/><path d="M14 36c0-4 4-8 8-12l6 4c-4 4-6 6-6 8z" fill="currentColor" opacity=".4"/><path d="M30 28l14 4v-3l-14-4z" fill="currentColor" opacity=".5"/><rect x="10" y="38" width="44" height="3" rx="1.5" fill="currentColor" opacity=".15"/></svg>`,
  legraise: `<svg viewBox="0 0 64 64" fill="none"><rect x="26" y="4" width="4" height="20" rx="2" fill="currentColor" opacity=".2"/><circle cx="28" cy="28" r="5" fill="currentColor" opacity=".6"/><path d="M26 34h4v8h-4z" fill="currentColor" opacity=".4"/><path d="M28 42l10-14h-3l-9 12z" fill="currentColor" opacity=".5"/><path d="M28 42l-10-14h3l9 12z" fill="currentColor" opacity=".5"/></svg>`,
};

function getExMeta(name) {
  return EXERCISE_META[name] || { muscle: 'General', type: 'Exercise', group: 'core', icon: 'squat' };
}

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
