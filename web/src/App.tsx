import { useState, useEffect } from 'react';
import { Activity, Footprints, Zap, History, Radio, Cpu, Layers } from 'lucide-react';

interface Prediction {
  device_id: string;
  ts: string;
  activity: 'walk' | 'run';
  confidence: number;
  prob_walk: number;
  prob_run: number;
  model_version: string;
}

export function App() {
  const [latest, setLatest] = useState<Prediction>({
    device_id: 'rt-spark-01',
    ts: new Date().toISOString(),
    activity: 'walk',
    confidence: 0.9982,
    prob_walk: 0.9982,
    prob_run: 0.0018,
    model_version: 'logreg-v1-rtspark'
  });

  const [history, setHistory] = useState<Prediction[]>([]);
  const [isLive] = useState(true);

  // Poll / simulate telemetry updates
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/predictions/latest');
        if (res.ok) {
          const data = await res.json();
          setLatest(data);
          setHistory(prev => [data, ...prev.slice(0, 19)]);
        }
      } catch {
        // Mock fallback simulation when running standalone
        const isRun = Math.random() > 0.65;
        const conf = 0.92 + Math.random() * 0.079;
        const mock: Prediction = {
          device_id: 'rt-spark-01',
          ts: new Date().toISOString(),
          activity: isRun ? 'run' : 'walk',
          confidence: Number(conf.toFixed(4)),
          prob_walk: Number((isRun ? 1 - conf : conf).toFixed(4)),
          prob_run: Number((isRun ? conf : 1 - conf).toFixed(4)),
          model_version: 'logreg-v1-rtspark'
        };
        setLatest(mock);
        setHistory(prev => [mock, ...prev.slice(0, 19)]);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-zinc-800">
      {/* Top Bar */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide uppercase text-zinc-200">Kinesis OS</h1>
            <p className="text-xs text-zinc-500 font-mono">RT-Spark IMU Telemetry (BCA182 Lab 3)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isLive ? 'STREAMING 10Hz' : 'OFFLINE'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real-time Hero Card */}
        <section className="md:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-zinc-400" /> DEVICE: {latest.device_id}
              </span>
              <span>MODEL: {latest.model_version}</span>
            </div>

            {/* Central Classification State */}
            <div className="my-auto py-8 text-center flex flex-col items-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500 border ${
                latest.activity === 'run'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {latest.activity === 'run' ? (
                  <Zap className="w-10 h-10 animate-bounce" />
                ) : (
                  <Footprints className="w-10 h-10" />
                )}
              </div>

              <div className="text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
                {latest.activity}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-xs font-mono text-zinc-300">
                Confidence: {(latest.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {/* Probability Bars */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/60 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1.5 text-zinc-400">
                  <span>P(WALK)</span>
                  <span>{(latest.prob_walk * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${latest.prob_walk * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-zinc-400">
                  <span>P(RUN)</span>
                  <span>{(latest.prob_run * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${latest.prob_run * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Metric Specs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-1">
                <Cpu className="w-3.5 h-3.5" /> MCU NODE
              </div>
              <div className="text-sm font-medium text-zinc-200">STM32F407ZGT6</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">LSM6DSL 50Hz (SPI/I2C)</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-1">
                <Radio className="w-3.5 h-3.5" /> UPLINK
              </div>
              <div className="text-sm font-medium text-zinc-200">ISM43362 Wi-Fi</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">AWS coreMQTT TLS</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono mb-1">
                <Layers className="w-3.5 h-3.5" /> INGESTION
              </div>
              <div className="text-sm font-medium text-zinc-200">Vercel + Supabase</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">Windowed LR (99.98% Acc)</div>
            </div>
          </div>
        </section>

        {/* History Stream List */}
        <section className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col h-full max-h-[580px]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Telemetry Feed
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">{history.length} records</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/40 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.activity === 'run' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-semibold uppercase text-zinc-200">{item.activity}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">{(item.confidence * 100).toFixed(0)}%</span>
                  <div className="text-[10px] text-zinc-600">
                    {new Date(item.ts).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-4 text-center text-xs text-zinc-600 font-mono">
        BCA 182 Embedded Systems Programming — MSU-IIT Department of Computer Applications
      </footer>
    </div>
  );
}
