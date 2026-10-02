import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import {
  BookOpen, Check, X, Award, MapPin, Sparkles, HelpCircle,
  Search, Trash2, Navigation, RefreshCw,
  ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { Reveal } from '../components/motion';

const ITEM_RULES = [
  { keys: ['battery', 'batteries', 'aa', 'cell'], bin: 'Domestic Hazardous (Red Bin)', color: '#EF4444', tip: 'Never toss in household waste — tape the terminals and drop at a hazardous/e-waste counter.' },
  { keys: ['chip', 'chips', 'packet', 'wrapper', 'namkeen', 'crisp'], bin: 'Dry Recyclable (Blue Bin)', color: '#3B82F6', tip: 'Empty the contents, then fold the packet flat — layered foil packets need a recycling drop-off, not the blue bin, in most wards.' },
  { keys: ['tea', 'chai', 'coffee', 'leaf'], bin: 'Wet / Organic (Green Bin)', color: '#10B981', tip: 'Tea leaves, coffee grounds and used bags are compostable. Remove the staple first.' },
  { keys: ['medicine', 'tablet', 'expiry', 'pharma', 'syrup'], bin: 'Domestic Hazardous (Red Bin)', color: '#EF4444', tip: 'Return unused medicine to a pharmacy take-back box — never the household bin.' },
  { keys: ['e-waste', 'ewaste', 'phone', 'charger', 'cable', 'laptop', 'circuit'], bin: 'E-Waste Collection Point', color: '#8B5CF6', tip: 'Book a certified e-waste pickup — circuit boards leach lead and cadmium in landfill.' },
  { keys: ['plastic', 'container', 'tub', 'mug', 'straw'], bin: 'Dry Recyclable (Blue Bin)', color: '#3B82F6', tip: 'Rinse, crush to save space, and keep caps on so small parts do not escape the stream.' },
  { keys: ['glass', 'bottle', 'jar'], bin: 'Dry Recyclable (Blue Bin)', color: '#3B82F6', tip: 'Rinse and remove the cap (caps are a different plastic stream). Broken glass: wrap in newspaper and label it.' },
  { keys: ['paper', 'newspaper', 'cardboard', 'carton', 'magazine'], bin: 'Dry Recyclable (Blue Bin)', color: '#3B82F6', tip: 'Keep it dry — wet paper contaminates the whole bale. Flatten cartons.' },
  { keys: ['sanitary', 'pad', 'diaper', 'tissue', 'wipe'], bin: 'Domestic Hazardous (Red Bin)', color: '#EF4444', tip: 'Bag it separately and seal it — never mix with recyclables.' },
  { keys: ['diya', 'idol', 'ganesha', 'immersion', 'paint'], bin: 'Special Handling', color: '#F59E0B', tip: 'Use an eco-friendly immersion tank / paint collection drive — chemicals must not enter drains.' },
  { keys: ['banana', 'peel', 'vegetable', 'food', 'leftover', 'kitchen', 'organic', 'garden'], bin: 'Wet / Organic (Green Bin)', color: '#10B981', tip: 'Compostable at source. Cut large pieces small so the pile aerates.' },
  { keys: ['metal', 'can', 'tin', 'foil', 'utensil'], bin: 'Dry Recyclable (Blue Bin)', color: '#3B82F6', tip: 'Crush cans to save space; sharp edges should be folded in or taped.' },
  { keys: ['shoe', 'cloth', 'clothes', 'textile', 'rag'], bin: 'Clothing / Textile Bank', color: '#06B6D4', tip: 'Wearables go to a clothing bank; torn textiles become cleaning rags.' },
  { keys: ['construction', 'rubble', 'brick', 'cement', 'debris'], bin: 'Construction Debris Yard', color: '#64748B', tip: 'C&D waste has its own tip — never dump it in community bins.' },
  { keys: ['bulb', 'tube', 'led', 'tube light'], bin: 'Domestic Hazardous (Red Bin)', color: '#EF4444', tip: 'Fluorescent tubes carry mercury vapour — handle with gloves, hand to an e-waste counter.' },
  { keys: ['mask', 'covid', 'bandage'], bin: 'Domestic Hazardous (Red Bin)', color: '#EF4444', tip: 'Seal used PPE in a bag and label it before binning.' },
];

const ICON_EMOJI = {
  apple: '🍏', food: '🥗', kitchen: '🍳', organic: '🍏', wet: '🍏', green: '🍏',
  box: '📦', package: '📦', dry: '📦', blue: '📦', paper: '📄', cardboard: '📄',
  cpu: '🔌', 'e-waste': '🔌', ewaste: '🔌', electronic: '🔌', plug: '🔌', phone: '📱',
  'alert-triangle': '⚠️', hazardous: '⚠️', red: '⚠️', danger: '⚠️', medical: '💊', battery: '🔋',
  hammer: '🧱', construction: '🧱', inert: '🧱', brick: '🧱',
  plastic: '🧴', glass: '🍾', metal: '🥫', textile: '👕', clothing: '👕',
  recycle: '♻️',
};

const FALLBACK_GUIDES = [
  {
    id: 1, name: 'Wet & Organic Waste (Green Bin)', color: '#10B981', icon: 'organic',
    description: 'Kitchen scraps, vegetable peels, leftovers, tea bags, garden trimmings.',
    what_belongs: ['Fruit & vegetable peels', 'Leftover food', 'Tea leaves & coffee grounds', 'Garden trimmings', 'Egg shells'],
    what_does_not: ['Plastic bags', 'Glass shards', 'Sanitary waste'],
    disposal_tips: 'Line the bin with newspaper, not plastic. Aerating the pile daily keeps odour and flies away.',
  },
  {
    id: 2, name: 'Dry & Recyclable Waste (Blue Bin)', color: '#3B82F6', icon: 'dry',
    description: 'Clean plastics, cardboard, papers, glass bottles, clean cans, packaging.',
    what_belongs: ['Rinsed plastic bottles', 'Newspaper & cardboard', 'Glass jars', 'Metal cans', 'Cartons'],
    what_does_not: ['Food-soiled paper', 'Diapers', 'Broken ceramics'],
    disposal_tips: 'Rinse and dry everything — one oily carton can contaminate an entire bale.',
  },
  {
    id: 3, name: 'Domestic Hazardous (Red Bin)', color: '#EF4444', icon: 'hazardous',
    description: 'Batteries, expired medicines, sanitary waste, chemical containers, tube lights.',
    what_belongs: ['Batteries', 'Expired medicines', 'Sanitary waste', 'Paint & chemicals', 'Tube lights'],
    what_does_not: ['Food waste', 'Paper', 'Recyclable plastic'],
    disposal_tips: 'Keep this stream sealed and separate. Hazardous items go to a take-back counter, not the curb.',
  },
];

const FALLBACK_POINTS = [
  { id: 1, name: 'Connaught Place Smart Depository', address: 'Block C, Radial Road 2, New Delhi', bin_type: 'E-Waste & Dry Recyclables', zone: 'Zone 1 - Central', fill_level: 42 },
  { id: 2, name: 'Lodhi Road Bio-Methanation Center', address: 'Near Lodhi Colony Flyover, New Delhi', bin_type: 'Organic Compost Drop-off', zone: 'Zone 2 - South', fill_level: 71 },
];


export default function AwarenessPage() {
  const [guides, setGuides] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [checking, setChecking] = useState(false);

  const [lookup, setLookup] = useState('');
  const [guideQuery, setGuideQuery] = useState('');
  const [pointQuery, setPointQuery] = useState('');
  const [openGuide, setOpenGuide] = useState(null);

  useEffect(() => {
    const fetchAwareness = async () => {
      try {
        const [gRes, qRes, pRes] = await Promise.all([
          api.get('/api/awareness/guides/').catch(() => ({ data: [] })),
          api.get('/api/awareness/quiz/').catch(() => ({ data: [] })),
          api.get('/api/awareness/collection-points/').catch(() => ({ data: [] })),
        ]);
        setGuides(gRes.data?.results || gRes.data || []);
        setQuizzes(qRes.data?.results || qRes.data || []);
        setPoints(pRes.data?.results || pRes.data || []);
      } catch (err) {
        console.error('Error fetching awareness data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAwareness();
  }, []);

  const shownGuides = guides.length > 0 ? guides : FALLBACK_GUIDES;
  const shownPoints = points.length > 0 ? points : FALLBACK_POINTS;
  const shownQuizzes = quizzes;

  const lookupResult = useMemo(() => {
    const q = lookup.trim().toLowerCase();
    if (q.length < 2) return null;
    const rule = ITEM_RULES.find(r => r.keys.some(k => q.includes(k)));
    if (rule) return { ...rule, matched: 'rule' };
    for (const g of shownGuides) {
      const belongs = Array.isArray(g.what_belongs) ? g.what_belongs : [];
      const hit = belongs.find(b => String(b || '').toLowerCase().includes(q) || q.includes(String(b || '').toLowerCase()));
      if (hit) {
        return { bin: g.name, color: g.color || '#10B981', tip: g.disposal_tips || g.description || '', matched: 'guide', hit };
      }
    }
    return { bin: 'No exact match yet', color: '#64748B', tip: 'Try a simpler keyword (e.g. "battery", "tea", "glass"), or check the stream guides below.', matched: 'none' };
  }, [lookup, shownGuides]);

  const filteredGuides = useMemo(() => {
    const q = guideQuery.trim().toLowerCase();
    if (!q) return shownGuides;
    return shownGuides.filter(g =>
      [g.name, g.title, g.category, g.description]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q)) ||
      (Array.isArray(g.what_belongs) && g.what_belongs.some(b => String(b).toLowerCase().includes(q)))
    );
  }, [guideQuery, shownGuides]);

  const filteredPoints = useMemo(() => {
    const q = pointQuery.trim().toLowerCase();
    if (!q) return shownPoints;
    return shownPoints.filter(p =>
      [p.name, p.address, p.zone, p.bin_type, p.type].filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [pointQuery, shownPoints]);

  const handleAnswer = async (optionIndex) => {
    if (selectedAnswer !== null || checking) return;
    const currentQ = shownQuizzes[currentQuizIndex];
    if (!currentQ) return;
    setSelectedAnswer(optionIndex);
    setChecking(true);

    let isCorrect = false;
    let correctIndex = null;
    let explanation = '';

    try {
      const res = await api.post(`/api/awareness/quiz/${currentQ.id}/check/`, {
        selected_option_index: optionIndex,
      });
      isCorrect = !!res.data?.is_correct;
      correctIndex = res.data?.correct_option_index;
      explanation = res.data?.explanation || '';
    } catch (e) {
      console.error('Quiz check failed:', e);
      correctIndex = null;   
    }

    setAnswerFeedback({ isCorrect, correctIndex, explanation, verified: correctIndex !== null });
    setChecking(false);

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      setQuizStreak(prev => {
        const next = prev + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setQuizStreak(0);
    }

    setTimeout(() => {
      if (currentQuizIndex + 1 < shownQuizzes.length) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerFeedback(null);
      } else {
        setQuizFinished(true);
      }
    }, explanation ? 2600 : 1700);
  };

  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setQuizScore(0);
    setQuizStreak(0);
    setBestStreak(0);
    setQuizFinished(false);
  };

  const quizPct = shownQuizzes.length
    ? Math.round((currentQuizIndex / shownQuizzes.length) * 100)
    : 0;
  const finalPct = shownQuizzes.length
    ? Math.round((quizScore / shownQuizzes.length) * 100)
    : 0;

  const stats = [
    { label: 'Waste streams', value: shownGuides.length, icon: BookOpen },
    { label: 'Quiz questions', value: shownQuizzes.length, icon: HelpCircle },
    { label: 'Drop-off points', value: shownPoints.length, icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-lime-400/40 to-leaf-500/25 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 -bottom-28 h-56 w-56 rounded-full bg-gradient-to-br from-leaf-500/25 to-cyan-400/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="eyebrow">Civic Education &amp; Circular Economy</span>
            <h1 className="h-section mt-3 text-ink-950">
              Know Your Waste &amp; Segregate Smartly
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Proper segregation at source eliminates 70% of municipal dump pileups. Ask where an item
              goes, learn the colour codes, take the civic quiz, and locate dry waste deposit centers.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-paper-2/70 px-4 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-lime-400 to-leaf-500 text-ink-950">
                    <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="stat-number text-lg font-semibold leading-none text-ink-900">{s.value}</span>
                  <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="h-card text-base text-ink-900">Where does it go?</h2>
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            type any household item
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder='Try "batteries", "tea leaves", "chip packet", "tube light"…'
            className="input pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['Battery', 'Tea leaves', 'Chip packet', 'Glass bottle', 'Medicine', 'E-waste', 'Banana peel', 'Tube light'].map(t => (
            <button
              key={t}
              onClick={() => setLookup(t)}
              className="chip hover:border-leaf-300 hover:bg-leaf-50 hover:text-leaf-700"
            >
              {t}
            </button>
          ))}
        </div>

        {lookupResult && (
          <div className="p-4 rounded-xl border flex items-start gap-3"
               style={{ borderColor: lookupResult.color, backgroundColor: `${lookupResult.color}12` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                 style={{ backgroundColor: lookupResult.color }}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide font-bold" style={{ color: lookupResult.color }}>
                Dispose in
              </div>
              <div className="font-bold text-sm text-slate-900">{lookupResult.bin}</div>
              <div className="text-xs text-slate-600 mt-1 leading-relaxed">{lookupResult.tip}</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Waste Stream Separation Standards
          </h2>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={guideQuery}
              onChange={(e) => setGuideQuery(e.target.value)}
              placeholder="Filter streams or items…"
              className="input w-full pl-9 sm:w-56"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(loading ? [] : filteredGuides).map((g, idx) => {
            const accent = g.color || ['#10B981', '#3B82F6', '#EF4444'][idx % 3];
            const belongs = Array.isArray(g.what_belongs) ? g.what_belongs : [];
            const rejects = Array.isArray(g.what_does_not) ? g.what_does_not : [];
            const emoji = ICON_EMOJI[String(g.icon || '').toLowerCase()] ||
                          ICON_EMOJI[String(g.name || '').toLowerCase().split(' ')[0]] || '♻️';
            const isOpen = openGuide === (g.id || g.slug || idx);
            return (
              <div key={g.id || g.slug || idx}
                   className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                   style={{ borderColor: `${accent}55` }}>
                <div className="p-5 space-y-2" style={{ backgroundColor: `${accent}0f` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-3xl">{emoji}</div>
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: accent }}>
                      {belongs.length || '—'} items
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{g.name || g.title || g.category}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{g.description || g.items}</p>
                </div>

                {isOpen && (
                  <div className="p-5 pt-3 space-y-3 text-xs">
                    {belongs.length > 0 && (
                      <div>
                        <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> What belongs here
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {belongs.map((b, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {String(b)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {rejects.length > 0 && (
                      <div>
                        <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-rose-600" /> Keep out
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rejects.map((b, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                              {String(b)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {g.disposal_tips && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                        <strong>Pro tip:</strong> {g.disposal_tips}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setOpenGuide(isOpen ? null : (g.id || g.slug || idx))}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-black/[0.05] bg-paper-2/40 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-paper-2 hover:text-ink-800"
                >
                  {isOpen ? 'Show less' : 'What goes in / disposal tips'}
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
          {loading && [1, 2, 3].map(i => (
            <div key={i} className="h-56 animate-pulse rounded-3xl border border-black/[0.05] bg-paper-2" />
          ))}
        </div>
        {!loading && filteredGuides.length === 0 && (
          <div className="rounded-2xl border border-black/[0.05] bg-paper-2/60 p-4 text-xs text-slate-600">
            No stream matches “{guideQuery}”. Clear the filter to see all {shownGuides.length} streams.
          </div>
        )}
      </div>

      <div className="card space-y-6 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="h-card text-base text-ink-900">Civic Waste IQ Quiz</h3>
            {shownQuizzes[currentQuizIndex]?.difficulty && !quizFinished && (
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {shownQuizzes[currentQuizIndex].difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-amber-600">
              <Zap className="w-3.5 h-3.5" /> streak {quizStreak}
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5" /> {quizScore} correct
            </span>
            {shownQuizzes.length > 0 && !quizFinished && (
              <span>Q {currentQuizIndex + 1}/{shownQuizzes.length}</span>
            )}
          </div>
        </div>

        {shownQuizzes.length > 0 && !quizFinished && (
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-leaf-500 transition-all duration-500"
                 style={{ width: `${quizPct}%` }} />
          </div>
        )}

        {shownQuizzes.length > 0 && !quizFinished ? (
          <div className="space-y-4 max-w-xl">
            <h4 className="font-bold text-slate-900 text-sm">{shownQuizzes[currentQuizIndex]?.question}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(shownQuizzes[currentQuizIndex]?.options || []).map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const fb = answerFeedback;
                const isCorrectOption = fb && fb.correctIndex === i;
                let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (isSelected) {
                  btnStyle = fb
                    ? (fb.isCorrect ? 'bg-emerald-500 text-white font-bold' : 'bg-rose-500 text-white font-bold')
                    : 'bg-emerald-100 border-emerald-400';
                } else if (isCorrectOption) {
                  btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-800 font-semibold';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null || checking}
                    className={`p-3 text-left border rounded-xl text-xs transition flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isSelected && (fb
                      ? (fb.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)
                      : <span className="text-xs font-bold text-slate-400">checking…</span>)}
                    {!isSelected && isCorrectOption && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
            {answerFeedback?.explanation && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-xs leading-relaxed">
                <strong>Explanation:</strong> {answerFeedback.explanation}
              </div>
            )}
            {answerFeedback && answerFeedback.verified === false && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                Couldn't verify with the server — the next question will load shortly.
              </div>
            )}
          </div>
        ) : quizFinished ? (
          <div className="p-6 text-center space-y-3">
            <div className="mx-auto w-24 h-24 relative">
              <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="#10B981" strokeWidth="10" fill="none"
                        strokeLinecap="round" strokeDasharray={`${finalPct * 2.64} 264`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-emerald-600">
                {finalPct}%
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {finalPct >= 80 ? 'Civic Cleanliness Champion! 🎉' : finalPct >= 50 ? 'Solid effort! 🌿' : 'Keep learning ♻️'}
            </div>
            <p className="text-sm text-slate-600">
              You scored <strong>{quizScore}</strong> out of {shownQuizzes.length}
              {bestStreak > 0 && <> · best streak <strong>{bestStreak}</strong></>}
            </p>
            <button
              onClick={restartQuiz}
              className="btn-primary btn-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <strong>Bonus Tip:</strong> Always rinse beverage containers before disposing into the dry waste
            bin to prevent flies and odor!
            <button onClick={() => setCurrentQuizIndex(0)}
                    className="ml-2 underline font-bold text-emerald-700">
              load questions
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" /> Authorized Public Drop-Off Centers
          </h2>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={pointQuery}
              onChange={(e) => setPointQuery(e.target.value)}
              placeholder="Search zone, name, type…"
              className="input w-full pl-9 sm:w-56"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(loading ? [] : filteredPoints).map((pt, i) => {
            const fill = Number.isFinite(pt.fill_level) ? pt.fill_level : null;
            const fillColor = fill == null ? '#94A3B8' : fill < 60 ? '#10B981' : fill < 85 ? '#F59E0B' : '#EF4444';
            const hasCoords = pt.latitude != null && pt.longitude != null;
            return (
              <div key={pt.id || i} className="card space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{pt.name}</span>
                  {pt.is_active === false ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      INACTIVE
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OPEN
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{pt.address}</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    {pt.bin_type || pt.type || 'General Material Recovery'}
                  </span>
                  {pt.zone && (
                    <span className="text-xs text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      {pt.zone}
                    </span>
                  )}
                </div>

                {fill != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Capacity used</span><span style={{ color: fillColor }}>{fill}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{ width: `${Math.min(fill, 100)}%`, backgroundColor: fillColor }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">{pt.code && `Code ${pt.code}`}</span>
                  {hasCoords ? (
                    <a
                      href={`https://www.google.com/maps?q=${pt.latitude},${pt.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Directions
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <MapPin className="w-3.5 h-3.5" /> On-map
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {loading && [1, 2].map(i => (
            <div key={i} className="h-40 animate-pulse rounded-3xl border border-black/[0.05] bg-paper-2" />
          ))}
        </div>
        {!loading && filteredPoints.length === 0 && (
          <div className="rounded-2xl border border-black/[0.05] bg-paper-2/60 p-4 text-xs text-slate-600">
            No drop-off center matches “{pointQuery}”.
          </div>
        )}
      </div>
    </div>
  );
}
