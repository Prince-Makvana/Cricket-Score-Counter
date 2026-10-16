import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Users, BarChart2, Smartphone, Shield, ChevronRight, Star, Zap, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Live Scoring',
    description: 'Score every delivery in real-time. Wides, no-balls, extras, and wickets handled automatically.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Create and save teams and players. Reuse them across multiple matches.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart2,
    title: 'Detailed Statistics',
    description: 'Full scorecards with batting, bowling, partnerships, fall of wickets, and over history.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Designed for phones first. Big scoring buttons you can tap during a real match.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Shield,
    title: 'Works Offline',
    description: 'No internet needed after loading. All data saved locally in your browser.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: Zap,
    title: 'Undo & Correct',
    description: 'Made a mistake? Undo the last ball instantly. All stats recalculated automatically.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app">
      {/* Hero */}
      <section className="gradient-hero min-h-[100vh] flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10" style={{background:'radial-gradient(circle, #22c55e, transparent)'}} />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-10" style={{background:'radial-gradient(circle, #f59e0b, transparent)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{background:'radial-gradient(circle, #16a34a, transparent)'}} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-green-400 text-sm font-medium mb-6 border" style={{borderColor:'rgba(34,197,94,0.3)'}}>
            <Star className="w-3.5 h-3.5 fill-current" />
            The #1 Cricket Scoring App for Weekend Matches
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center shadow-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black text-white">
              Cricket<span className="text-green-400">Mate</span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-3 font-light">
            Score Every Ball. Own Every Moment.
          </p>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-10">
            The complete cricket scoring solution for your weekend matches.
            Track runs, wickets, overs, extras, and player stats — all in one place, offline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              id="hero-start-match"
              className="btn-gold text-lg px-8 py-4 rounded-xl shadow-xl"
              onClick={() => navigate('/match/setup')}
            >
              <Trophy className="w-5 h-5" />
              Start New Match
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              id="hero-dashboard"
              className="btn-secondary text-lg px-8 py-4 rounded-xl text-white border-white/20"
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[['100%', 'Free'], ['Offline', 'Ready'], ['No', 'Server']].map(([val, label]) => (
              <div key={label} className="glass rounded-xl p-3 text-center">
                <div className="text-xl font-black text-white">{val}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* Live scoreboard preview */}
      <section className="py-20 px-4" style={{background:'#0a0f1e'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">
              Real-Time <span className="text-green-400">Scoreboard</span>
            </h2>
            <p className="text-gray-400">Everything you need to know at a glance</p>
          </div>

          {/* Mock scoreboard */}
          <div className="card rounded-2xl overflow-hidden" style={{background:'#111827', borderColor:'#1f2937'}}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{background:'linear-gradient(135deg,#0f4c1e,#1a2f0a)'}}>
              <div>
                <div className="text-xs text-green-400 font-semibold uppercase tracking-widest">LIVE · 1st Innings</div>
                <div className="text-white font-black text-3xl mt-1">87/3</div>
                <div className="text-green-300 text-sm">Mumbai Strikers</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">Overs</div>
                <div className="text-white font-bold text-2xl">9.4 / 20</div>
                <div className="text-gray-400 text-xs mt-1">CRR: 8.70</div>
              </div>
            </div>

            {/* Batters */}
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Batting</div>
              <div className="space-y-2">
                {[{name:'V. Sharma *', runs:42, balls:28, sr:'150.0', bold:true},{name:'R. Kumar', runs:19, balls:15, sr:'126.7', bold:false}].map(b => (
                  <div key={b.name} className="flex items-center justify-between p-2 rounded-lg" style={{background:'#1f2937'}}>
                    <div className="flex items-center gap-2">
                      {b.bold && <span className="striker-badge">ON STRIKE</span>}
                      <span className={`text-sm font-medium ${b.bold ? 'text-white' : 'text-gray-300'}`}>{b.name}</span>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div><div className="text-white font-bold text-sm">{b.runs}</div><div className="text-gray-500 text-xs">runs</div></div>
                      <div><div className="text-gray-300 text-sm">{b.balls}</div><div className="text-gray-500 text-xs">balls</div></div>
                      <div><div className="text-green-400 text-sm">{b.sr}</div><div className="text-gray-500 text-xs">SR</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current over */}
            <div className="px-4 pb-4">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">This Over</div>
              <div className="flex gap-2">
                {['1','0','4','6','W','1'].map((b, i) => (
                  <div key={i} className={`over-ball text-xs font-bold ${
                    b === 'W' ? 'bg-red-500/20 text-red-400 border-red-400' :
                    b === '4' ? 'bg-blue-500/20 text-blue-400 border-blue-400' :
                    b === '6' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400' :
                    'text-gray-400 border-gray-600'
                  }`}>{b}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-app">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-black text-app mb-4">
              Everything You Need to <span className="text-green-600">Score Cricket</span>
            </h2>
            <p className="text-app-secondary max-w-xl mx-auto">
              Built for real cricket matches, not just demos. Every rule, every edge case, handled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="card card-hover p-6 rounded-2xl">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-app font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-app-secondary text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4" style={{background:'linear-gradient(135deg,#0f1033,#0d2e10)'}}>
        <div className="max-w-3xl mx-auto text-center">
          <Trophy className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">
            Ready to Start Scoring?
          </h2>
          <p className="text-gray-300 mb-8">Set up your match in under 2 minutes. No account required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-gold text-lg px-10 py-4 rounded-xl" onClick={() => navigate('/match/setup')}>
              <Trophy className="w-5 h-5" />
              Start New Match
            </button>
            <button className="btn-secondary text-lg px-10 py-4 rounded-xl text-white border-white/20" onClick={() => navigate('/dashboard')}>
              Open Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-app py-10 px-4 border-t border-app">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-500" />
              <span className="font-bold text-app">CricketMate</span>
              <span className="text-app-muted text-sm">© 2025</span>
            </div>
            <div className="flex gap-6">
              {['About', 'Help', 'Privacy'].map(link => (
                <a key={link} href="#" className="text-app-secondary hover:text-app text-sm transition-colors">{link}</a>
              ))}
            </div>
            <div className="flex items-center gap-2 text-app-muted text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              All data stored locally in your browser
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
