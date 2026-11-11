    function nbNews2(v) {
      const sbp = parseInt(String(v.bp).split('/')[0], 10);
      const rr = v.rr, sp = v.spo2, hr = v.hr, t = v.temp;
      let s = 0;
      s += rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
      s += sp <= 91 ? 3 : sp <= 93 ? 2 : sp <= 95 ? 1 : 0;
      s += sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
      s += hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3;
      s += v.avpu && v.avpu !== 'A' ? 3 : 0;
      s += t <= 35 ? 3 : t <= 36 ? 1 : t <= 38 ? 0 : t <= 39 ? 1 : 2;
      return s;
    }

