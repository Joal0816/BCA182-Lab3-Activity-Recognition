import { useState, useEffect, useRef } from 'react';
import { Activity, Footprints, Zap, History, Radio, Cpu, Layers, Smartphone, Sparkles } from 'lucide-react';

interface Prediction {
  device_id: string;
  ts: string;
  activity: 'walk' | 'run';
  confidence: number;
  prob_walk: number;
  prob_run: number;
  model_version: string;
  source?: string;
}

interface MotionSample {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
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

  // Phone IMU Real-time live testing state
  const [phoneTracking, setPhoneTracking] = useState(false);
  const [currentAccel, setCurrentAccel] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [currentGyro, setCurrentGyro] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const samplesBuffer = useRef<MotionSample[]>([]);

  // Request & enable Phone Accelerometer / Gyroscope
  const enablePhoneSensors = async () => {
    if (typeof window === 'undefined') return;

    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      // @ts-expect-error iOS 13+ permission request
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-expect-error iOS permission request
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') return;
      } catch (err) {
        console.error('Motion permission error:', err);
        return;
      }
    }

    setPhoneTracking(true);
  };

  const stopPhoneSensors = () => {
    setPhoneTracking(false);
  };

  // Device motion event handler
  useEffect(() => {
    if (!phoneTracking) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      const rot = event.rotationRate;

      const ax = (acc?.x || 0) / 9.80665; // convert m/s^2 to g
      const ay = (acc?.y || 0) / 9.80665;
      const az = (acc?.z || 0) / 9.80665;

      const gx = ((rot?.alpha || 0) * Math.PI) / 180; // convert deg/s to rad/s
      const gy = ((rot?.beta || 0) * Math.PI) / 180;
      const gz = ((rot?.gamma || 0) * Math.PI) / 180;

      setCurrentAccel({ x: ax, y: ay, z: az });
      setCurrentGyro({ x: gx, y: gy, z: gz });

      samplesBuffer.current.push({ ax, ay, az, gx, gy, gz });

      // Once 10 samples (~1s window) collected, post to ML API
      if (samplesBuffer.current.length >= 10) {
        const windowData = samplesBuffer.current.slice(0, 10);
        samplesBuffer.current = [];

        fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-ingest-token': 'demo-token' },
          body: JSON.stringify({
            device_id: 'phone-browser-01',
            seq: Date.now(),
            samples: windowData
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.prediction) {
              const pred: Prediction = {
                device_id: 'phone-imu',
                ts: new Date().toISOString(),
                activity: data.prediction.activity,
                confidence: data.prediction.confidence,
                prob_walk: data.prediction.prob_walk,
                prob_run: data.prediction.prob_run,
                model_version: data.prediction.model_version,
                source: 'phone_live_sensor'
              };
              setLatest(pred);
              setHistory(prev => [pred, ...prev.slice(0, 19)]);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [phoneTracking]);

  // Polling cloud predictions when phone tracking is off
  useEffect(() => {
    if (phoneTracking) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/predictions/latest');
        if (res.ok) {
          const data = await res.json();
          setLatest(data);
          setHistory(prev => [data, ...prev.slice(0, 19)]);
        }
      } catch {
        // Fallback simulation
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [phoneTracking]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-zinc-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              Kinesis OS
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono">BCA 182 — Real-Time IoT Activity Recognition</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phoneTracking ? (
            <button
              onClick={stopPhoneSensors}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 text-red-300 border border-red-800/60 text-xs font-mono flex items-center gap-2 hover:bg-red-900 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 animate-pulse text-red-400" />
              Stop Phone Sensors
            </button>
          ) : (
            <button
              onClick={enablePhoneSensors}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-xs font-mono flex items-center gap-2 hover:bg-cyan-900/60 transition-colors shadow-sm shadow-cyan-500/20"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              Test on Phone Gyro
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span className="text-zinc-300">{phoneTracking ? 'PHONE IMU' : 'CLOUD STREAM'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Detection Hero Card */}
        <section className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between mb-8">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400" /> Active Movement Classification
              </span>
              <span className="text-xs font-mono text-zinc-500">Node: {latest.device_id}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 my-6">
              <div
                className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                  latest.activity === 'run'
                    ? 'bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 shadow-xl shadow-amber-500/10'
                    : 'bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-500/10'
                }`}
              >
                {latest.activity === 'run' ? (
                  <Zap className="w-16 h-16 animate-bounce" />
                ) : (
                  <Footprints className="w-16 h-16 animate-pulse" />
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="text-4xl sm:text-6xl font-bold tracking-tight uppercase text-white font-mono">
                  {latest.activity}
                </div>
                <p className="text-sm text-zinc-400 font-mono">
                  Confidence Score: <span className="text-zinc-200 font-semibold">{(latest.confidence * 100).toFixed(1)}%</span>
                </p>
                {phoneTracking && (
                  <p className="text-xs text-cyan-400 font-mono flex items-center gap-1 justify-center sm:justify-start">
                    <Sparkles className="w-3.5 h-3.5" /> Streaming live from your phone sensor
                  </p>
                )}
              </div>
            </div>

            {/* Live Sensor Oscilloscope gauges when phone tracking */}
            {phoneTracking && (
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-zinc-800/60 font-mono text-xs">
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase mb-1">Live Accel (g)</div>
                  <div className="text-zinc-300">
                    X: {currentAccel.x.toFixed(2)} | Y: {currentAccel.y.toFixed(2)} | Z: {currentAccel.z.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <div className="text-zinc-500 text-[10px] uppercase mb-1">Live Gyro (rad/s)</div>
                  <div className="text-zinc-300">
                    X: {currentGyro.x.toFixed(2)} | Y: {currentGyro.y.toFixed(2)} | Z: {currentGyro.z.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Posterior Probability Bars */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-800/60 font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>P(WALK)</span>
                  <span className="text-zinc-200">{(latest.prob_walk * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${latest.prob_walk * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>P(RUN)</span>
                  <span className="text-zinc-200">{(latest.prob_run * 100).toFixed(1)}%</span>
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
              <div className="text-sm font-medium text-zinc-200">ISM43362 / Web API</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">HTTPS & Serial JSON</div>
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
