import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, CheckCircle, Users, Building2 } from 'lucide-react'

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
              <Users className="text-white h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-bold text-lg leading-tight tracking-tight">QueueLess</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Enterprise</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Platform</a>
            <a href="#solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">How it works</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 transition-colors">Sign in</Link>
          <Link to="/register" className="btn-primary py-2 px-5 text-sm">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </nav>
)

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative bg-white pt-24 pb-32 overflow-hidden">
    {/* Grid Background Effect */}
    <div className="absolute inset-0 bg-grid-slate [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10"></div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">Version 4.2 now live</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
          The Operating System for <span className="text-blue-600">Modern Patient Flow.</span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
          QueueLess provides the infrastructure to eliminate physical waiting rooms. Real-time token tracking, multi-branch analytics, and automated staff allocation in one unified platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary py-3.5 px-8 text-base w-full sm:w-auto">
            Deploy QueueLess
          </Link>
          <a href="#how-it-works" className="btn-white py-3.5 px-8 text-base w-full sm:w-auto flex items-center justify-center gap-2">
            View Live Demo <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Product Preview Mockup */}
      <div className="relative max-w-5xl mx-auto">
        <div className="dashboard-mockup">
          <div className="dashboard-header">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            </div>
            <div className="bg-slate-800/80 px-4 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-700/50">
              admin.queueless.io/dashboard/real-time
            </div>
            <div className="w-12"></div>
          </div>
          <div className="p-8 bg-slate-900">
            <div className="grid grid-cols-12 gap-6 uppercase tracking-wider font-bold text-[10px] text-slate-500 mb-6 pb-6 border-b border-slate-800">
              <div className="col-span-3">Department</div>
              <div className="col-span-2 text-center">Active Tokens</div>
              <div className="col-span-3 text-center">Avg. Wait Time</div>
              <div className="col-span-2 text-center">Efficiency</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="space-y-6">
              {[
                { dept: 'Cardiology Center', tokens: '24', wait: '12m 30s', eff: '98%', status: 'Optimum', color: 'text-emerald-500' },
                { dept: 'General Medicine', tokens: '142', wait: '42m 15s', eff: '84%', status: 'High Load', color: 'text-amber-500' },
                { dept: 'Diagnostic Imaging', tokens: '08', wait: '04m 20s', eff: '99%', status: 'Optimum', color: 'text-emerald-500' },
              ].map((row) => (
                <div key={row.dept} className="grid grid-cols-12 gap-6 items-center text-sm">
                  <div className="col-span-3 text-white font-semibold">{row.dept}</div>
                  <div className="col-span-2 text-center text-slate-300 font-mono">{row.tokens}</div>
                  <div className="col-span-3 text-center text-slate-300 font-mono">{row.wait}</div>
                  <div className="col-span-2 text-center">
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: row.eff }}></div>
                    </div>
                  </div>
                  <div className={`col-span-2 text-right text-[11px] font-bold ${row.color}`}>{row.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Floating Metrics */}
        <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 hidden lg:block transform -rotate-2">
          <p className="label-micro mb-2">Live Efficiency</p>
          <p className="text-3xl font-black text-slate-900">94.2%</p>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-1">
             <ArrowRight className="h-3 w-3 -rotate-45" /> +12% from avg.
          </div>
        </div>
      </div>
    </div>
  </section>
)

// ─── Stats strip ──────────────────────────────────────────────────────────────
const Stats = () => (
  <section className="bg-slate-950 py-6 border-y border-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { value: '1.2M+', label: 'Monthly Tokens' },
          { value: '850+',   label: 'Branch Deployments' },
          { value: '64%',   label: 'Wait-time Reduction' },
          { value: '99.9%', label: 'Infrastructure Uptime' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <p className="text-xl font-black text-white tracking-tight font-mono">{value}</p>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─── How it works ─────────────────────────────────────────────────────────────
const HowItWorks = () => (
  <section id="how-it-works" className="py-32 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="label-micro mb-4 text-blue-600">The Workflow</h2>
        <h3 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Full-Cycle Patient Management</h3>
        <p className="text-lg text-slate-500">From remote registration to final consultation, QueueLess automates every touchpoint of the patient journey.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        {[
          { 
            step: '01', 
            title: 'Multichannel Intake', 
            desc: 'Patients register via QR at the branch or through your custom web portal. No apps, no friction.',
            ui: (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Input Stream</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            )
          },
          { 
            step: '02', 
            title: 'Smart Prioritization', 
            desc: 'Our engine assigns tokens based on department load, appointment type, and urgency levels.',
            ui: (
              <div className="mt-8 bg-slate-900 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Process Engine</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-mono text-white font-bold tracking-tighter">Q-452</span>
                  <span className="badge-status-success text-[9px]">Critical Priority</span>
                </div>
              </div>
            )
          },
          { 
            step: '03', 
            title: 'Live Synchronization', 
            desc: 'Real-time updates across staff dashboards and public displays via Low-Latency WebSockets.',
            ui: (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center mb-1">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400">Staff</span>
                </div>
                <div className="h-px w-8 bg-blue-200 dashed"></div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400">Public</span>
                </div>
              </div>
            )
          },
        ].map((item) => (
          <div key={item.step} className="relative group">
            <div className="text-6xl font-black text-slate-200/50 absolute -top-8 -left-4 group-hover:text-blue-100 transition-colors -z-10">{item.step}</div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.desc}</p>
            {item.ui}
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─── Use cases ────────────────────────────────────────────────────────────────
const UseCases = () => (
  <section id="solutions" className="py-32 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="label-micro mb-4 text-blue-600">Enterprise Solutions</h2>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Built for scale. Deployment-ready.</h3>
          <div className="space-y-10">
            {[
              { 
                title: 'Multi-Specialty Private Hospitals', 
                desc: 'Coordinate across 50+ departments with centralized SLA monitoring and staff efficiency heatmaps.',
                benefit: 'Reduction in patient complaints by 72%'
              },
              { 
                title: 'Government Health Centers', 
                desc: 'Handle extreme-load public OPDs with high-durability kiosk integration and offline-to-online sync.',
                benefit: 'Zero training required for walk-in patients'
              },
              { 
                title: 'Diagnostic & Lab Networks', 
                desc: 'Optimize sample collection flow and reduce phlebotomist idle time with predictive queueing.',
                benefit: '25% higher throughput per branch'
              }
            ].map((item) => (
              <div key={item.title}>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">{item.desc}</p>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-wider">
                  <CheckCircle className="h-3.5 w-3.5" /> {item.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4 pt-12">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
                <Building2 className="text-white h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900">Branch Central</p>
              <p className="text-xs text-slate-500 mt-1">Manage 400+ branches from one screen.</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl">
              <p className="text-3xl font-black mb-1 font-mono tracking-tighter">04ms</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. API Latency</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50">
              <p className="text-3xl font-black text-slate-900 mb-1 font-mono tracking-tighter">14k+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concurrent Users</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                <Users className="text-white h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900">RBAC Controls</p>
              <p className="text-xs text-slate-500 mt-1">Granular staff permissions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// ─── For staff ────────────────────────────────────────────────────────────────
const ForStaff = () => (
  <section className="py-32 bg-slate-950 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="order-2 lg:order-1">
          <div className="dashboard-mockup border-slate-700 shadow-blue-900/20">
            <div className="dashboard-header border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Active Terminal: Counter 04</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-500">OPD_V4_SECURE</span>
              </div>
            </div>
            <div className="p-6 bg-slate-900">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="label-micro text-slate-500 mb-1">Currently Serving</p>
                  <p className="text-4xl font-black text-white font-mono tracking-tighter">Q-452</p>
                </div>
                <div className="text-right">
                  <p className="label-micro text-slate-500 mb-1">Session Time</p>
                  <p className="text-xl font-mono text-blue-400 font-bold">14:22</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <p className="label-micro text-slate-500">Next in Queue</p>
                {[
                  { token: 'Q-453', name: 'Arjun Mehra', wait: '12m', type: 'Online' },
                  { token: 'Q-454', name: 'Saira Bakshi', wait: '15m', type: 'Walk-in' },
                  { token: 'Q-455', name: 'Vikram Singh', wait: '18m', type: 'Online' },
                ].map((p, i) => (
                  <div key={p.token} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                    <div className="flex items-center gap-3">
                       <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{p.token}</span>
                       <span className="text-xs font-semibold text-slate-200">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{p.type}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                  Call Next Patient <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-3 rounded-lg border border-slate-700 transition-all">
                  On Hold / Skip
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="label-micro mb-4 text-blue-500">Operational Precision</h2>
          <h3 className="text-4xl font-extrabold text-white mb-8 tracking-tight">The ultimate tool for your frontline staff.</h3>
          <div className="space-y-8">
            {[
              { 
                title: 'High-Velocity Controls', 
                desc: 'Optimize for speed with hotkeys and one-click token transitions. Zero lag, real-time sync across all terminals.' 
              },
              { 
                title: 'Intelligent Walk-in Handling', 
                desc: 'Issue sub-second tokens for offline patients. Automatically syncs with appointments to prevent lane blocking.' 
              },
              { 
                title: 'Dynamic Load Balancing', 
                desc: 'Automatically route patients to less busy counters within the same department to maintain peak efficiency.' 
              }
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

// ─── Trust bar ────────────────────────────────────────────────────────────────
const TrustBar = () => (
  <section className="bg-white py-24 border-t border-slate-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p className="label-micro text-slate-400 mb-12">Infrastructure trusted by regional leaders</p>
      <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 opacity-60">
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-slate-400 tracking-tighter">UP_HEALTH</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Public Sector</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-slate-400 tracking-tighter">MEDICOLATE</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Private Care</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-slate-400 tracking-tighter">PHARMACORE</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Diagnostics</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-slate-400 tracking-tighter">CITY_WELLNESS</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Wellness Center</span>
        </div>
      </div>
    </div>
  </section>
)

const FAQ = () => (
  <section className="py-32 bg-slate-50 border-t border-slate-100">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="label-micro mb-4 text-blue-600">Common Questions</h2>
        <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">Enterprise Infrastructure FAQs</h3>
      </div>
      
      <div className="space-y-6">
        {[
          { 
            q: "How does QueueLess handle multi-branch data synchronization?", 
            a: "All branches communicate with our central event engine via low-latency WebSockets. Data is persisted in real-time across a distributed cluster, ensuring consistent analytics and staff controls regardless of physical location." 
          },
          { 
            q: "Does it require physical hardware installation?", 
            a: "No. QueueLess is a cloud-first platform. You can run terminals on any existing tablet, laptop, or smartphone. We also provide standardized API endpoints for thermal printer and public display integration." 
          },
          { 
            q: "Is patient data encrypted and secure?", 
            a: "Absolutely. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are designed for compliance with modern healthcare privacy standards and implement granular Role-Based Access Control." 
          },
          { 
            q: "What happens if our branch internet goes offline?", 
            a: "The staff terminal includes a 'Local Cache' mode that allows queuing to continue locally. Once connection is restored, the data automatically reconciles with the central server." 
          }
        ].map((item) => (
          <div key={item.q} className="bg-white p-8 rounded-2xl border border-slate-200">
            <h4 className="text-lg font-bold text-slate-900 mb-3">{item.q}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Users className="text-white h-4.5 w-4.5" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">QueueLess</span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Enterprise patient flow and queue management infrastructure for modern healthcare providers. Reduce wait times by up to 65% with data-driven scheduling.
          </p>
          <div className="flex gap-4">
            {/* Social placeholders */}
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-blue-500 hover:text-white transition-all cursor-pointer">
              <span className="text-xs font-bold">𝕏</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-blue-500 hover:text-white transition-all cursor-pointer">
              <span className="text-xs font-bold">in</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-white text-xs font-bold mb-6 uppercase tracking-widest text-slate-200">Platform</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#features" className="hover:text-blue-400 transition-colors">Real-time Dashboard</a></li>
            <li><a href="#features" className="hover:text-blue-400 transition-colors">Wait-time Prediction</a></li>
            <li><a href="#features" className="hover:text-blue-400 transition-colors">Multi-branch Sync</a></li>
            <li><a href="#features" className="hover:text-blue-400 transition-colors">Compliance & Security</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold mb-6 uppercase tracking-widest text-slate-200">Solutions</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Public Hospitals</a></li>
            <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Private Clinics</a></li>
            <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Diagnostic Centers</a></li>
            <li><a href="#solutions" className="hover:text-blue-400 transition-colors">Corporate Wellness</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold mb-6 uppercase tracking-widest text-slate-200">Resources</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Case Studies</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Support Center</a></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 text-[13px]">
          <p>© {new Date().getFullYear()} QueueLess Infrastructure Ltd.</p>
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-300">All systems operational</span>
        </div>
      </div>
    </div>
  </footer>
)

const FinalCTA = () => (
  <section className="py-24 bg-blue-600 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
      <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">Ready to optimize your patient flow?</h2>
      <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto">Join 850+ medical centers already using QueueLess to provide a world-class waiting experience.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/register" className="bg-white text-blue-600 hover:bg-blue-50 py-4 px-10 rounded-xl font-bold text-lg shadow-xl transition-all w-full sm:w-auto">
          Get Started Now
        </Link>
        <button className="bg-blue-700 text-white hover:bg-blue-800 py-4 px-10 rounded-xl font-bold text-lg border border-blue-500 transition-all w-full sm:w-auto">
          Contact Enterprise Sales
        </button>
      </div>
    </div>
  </section>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const HomePage = () => (
  <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
    <Navbar />
    <Hero />
    <Stats />
    <HowItWorks />
    <UseCases />
    <ForStaff />
    <FAQ />
    <TrustBar />
    <FinalCTA />
    <Footer />
  </div>
)

export default HomePage
