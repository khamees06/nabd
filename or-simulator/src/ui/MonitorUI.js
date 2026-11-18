const width = 960;
const height = 540;
const color = { ecg: '#6bf1a0', spo2: '#62d6f5', co2: '#f5d46e', resp: '#d3bcfa' };

const gaussian = (x, center, scale) => Math.exp(-((x - center) ** 2) / (scale * scale));
const cycle = (time, seconds) => ((time / seconds) % 1 + 1) % 1;

function ecg(time) {
  const p = cycle(time, 60 / 74);
  return 0.14 * gaussian(p, 0.18, 0.037) - 0.16 * gaussian(p, 0.34, 0.014)
    + 0.9 * gaussian(p, 0.36, 0.012) - 0.27 * gaussian(p, 0.392, 0.018)
    + 0.27 * gaussian(p, 0.63, 0.077);
}

function pleth(time) {
  const p = cycle(time - 0.18, 60 / 74);
  return 0.8 * gaussian(p, 0.30, 0.18) + 0.30 * gaussian(p, 0.54, 0.095);
}

function smoothstep(value, min, max) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

function capnogram(time) {
  const p = cycle(time, 60 / 14);
  const rise = smoothstep(p, 0.27, 0.38);
  const fall = 1 - smoothstep(p, 0.83, 0.89);
  return rise * fall * (0.56 + 0.29 * p);
}

function respiration(time) {
  return (1 - Math.cos(cycle(time + 0.65, 60 / 14) * Math.PI * 2)) * 0.43;
}

function dataAt(seconds) {
  return {
    hr: 74 + Math.round(Math.sin(seconds * 0.28)),
    spo2: 99,
    co2: 35 + Math.round(Math.sin(seconds * 0.14)),
    rr: 14,
    pressure: '118/74',
    temperature: '36.7',
  };
}

function paint(ctx, time, data) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#07131d';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#122332';
  ctx.fillRect(0, 0, width, 49);
  ctx.fillRect(0, 468, width, 72);
  ctx.fillStyle = '#dce9f2';
  ctx.font = '600 19px system-ui';
  ctx.fillText('NABD / PATIENT MONITOR', 22, 31);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9fdccc';
  ctx.font = '600 17px system-ui';
  ctx.fillText('SIMULATION   •   OR 07', width - 20, 30);
  ctx.textAlign = 'left';

  const rows = [
    { label: 'ECG II', unit: 'HR  bpm', value: data.hr, wave: ecg, color: color.ecg },
    { label: 'PLETH', unit: 'SpO₂  %', value: data.spo2, wave: pleth, color: color.spo2 },
    { label: 'CO₂', unit: 'EtCO₂  mmHg', value: data.co2, wave: capnogram, color: color.co2 },
    { label: 'RESP', unit: 'RR  /min', value: data.rr, wave: respiration, color: color.resp },
  ];
  rows.forEach((row, i) => {
    const y = 53 + i * 103;
    const start = 21;
    const end = 712;
    ctx.strokeStyle = '#173044';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = start; x <= end; x += 34) { ctx.moveTo(x, y + 29); ctx.lineTo(x, y + 93); }
    for (let gy = y + 30; gy <= y + 92; gy += 21) { ctx.moveTo(start, gy); ctx.lineTo(end, gy); }
    ctx.stroke();
    ctx.fillStyle = row.color;
    ctx.font = '600 16px system-ui';
    ctx.fillText(row.label, start, y + 19);
    ctx.strokeStyle = row.color;
    ctx.lineWidth = 2.7;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let x = start; x <= end; x += 1.4) {
      const v = row.wave(time - 7.4 * (end - x) / (end - start));
      const traceY = y + 82 - v * 52;
      if (x === start) ctx.moveTo(x, traceY); else ctx.lineTo(x, traceY);
    }
    ctx.stroke();

    ctx.fillStyle = row.color;
    ctx.font = '600 16px system-ui';
    ctx.fillText(row.unit, 742, y + 22);
    ctx.font = '650 54px system-ui';
    ctx.fillText(String(row.value), 741, y + 81);
  });
  ctx.fillStyle = '#b2c3d2';
  ctx.font = '600 15px system-ui';
  ctx.fillText('NIBP   mmHg', 22, 493);
  ctx.fillText('TEMP   °C', 333, 493);
  ctx.fillStyle = '#e4eef4';
  ctx.font = '620 33px system-ui';
  ctx.fillText(data.pressure, 22, 526);
  ctx.fillText(data.temperature, 333, 526);
  ctx.fillStyle = '#7e9bad';
  ctx.font = '600 15px system-ui';
  ctx.fillText('DEMO SIGNALS', 742, 515);
}

export function createVitals({ CanvasTexture, SRGBColorSpace, LinearFilter }) {
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const context = source.getContext('2d', { alpha: false });
  const texture = new CanvasTexture(source);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;

  const dialog = document.getElementById('vitals-dialog');
  const display = document.getElementById('vitals-display');
  const mirror = display.getContext('2d', { alpha: false });
  let lastDraw = -Infinity;
  let lastText = '';
  let values = dataAt(0);
  let started;

  function update(now, inRoom, reducedMotion) {
    if (!inRoom && !dialog.open) return false;
    if (reducedMotion && lastDraw !== -Infinity) return false;
    if (now - lastDraw < 82) return false;
    if (started === undefined) started = now;
    lastDraw = now;
    const seconds = reducedMotion ? 0 : (now - started) / 1000;
    values = dataAt(seconds);
    paint(context, seconds, values);
    texture.needsUpdate = true;
    if (dialog.open) {
      mirror.drawImage(source, 0, 0);
      const description = `نبض ${values.hr} في الدقيقة، تشبع الأكسجين ${values.spo2} بالمئة، ضغط ${values.pressure}، معدل التنفس ${values.rr} في الدقيقة، ثاني أكسيد الكربون ${values.co2} ملم زئبق، الحرارة ${values.temperature} مئوية.`;
      if (description !== lastText) {
        display.setAttribute('aria-label', description);
        lastText = description;
      }
    }
    return true;
  }

  function show() {
    if (dialog.open) return;
    dialog.showModal();
    mirror.drawImage(source, 0, 0);
    lastDraw = -Infinity;
  }

  update(0, true, false);
  return { texture, show, update, dialog, getValues: () => ({ ...values }) };
}
