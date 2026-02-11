// Retro sound effects via Web Audio API
const RetroSound = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(fn) {
    if (!enabled) return;
    try { fn(getCtx()); } catch (_) {}
  }

  return {
    get enabled() { return enabled; },
    set enabled(v) { enabled = v; },

    // Short blip for UI interactions
    click() {
      play((ac) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(800, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        osc.connect(gain).connect(ac.destination);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.05);
      });
    },

    // Processing / generating sound — ascending arpeggio
    generate() {
      play((ac) => {
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "square";
          const t = ac.currentTime + i * 0.06;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.07, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          osc.connect(gain).connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.08);
        });
      });
    },

    // Completion — power-up fanfare
    complete() {
      play((ac) => {
        const melody = [
          [392, 0.0],  // G4
          [523, 0.1],  // C5
          [659, 0.2],  // E5
          [784, 0.3],  // G5
          [1047, 0.45], // C6
          [784, 0.55], // G5
          [1047, 0.65], // C6
        ];
        melody.forEach(([freq, offset]) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "square";
          const t = ac.currentTime + offset;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain).connect(ac.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      });
    },

    // Style switch — quick sweep
    styleSwitch() {
      play((ac) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
        osc.connect(gain).connect(ac.destination);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.1);
      });
    },

    // Download — coin collect
    download() {
      play((ac) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(988, ac.currentTime);       // B5
        osc.frequency.setValueAtTime(1319, ac.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.08, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
        osc.connect(gain).connect(ac.destination);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.18);
      });
    },
  };
})();
