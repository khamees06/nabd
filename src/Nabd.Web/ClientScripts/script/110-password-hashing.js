    function nbPasswordSalt() {
      if (!window.crypto?.getRandomValues) throw new Error('تعذر إنشاء كلمة المرور بهذا المتصفح.');
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    async function nbPasswordDigest(password, saltHex) {
      if (!window.crypto?.subtle) throw new Error('ميزة التحقق من كلمة المرور غير متاحة بهذا المتصفح.');
      const salt = new Uint8Array((saltHex.match(/.{2}/g) || []).map(pair => parseInt(pair, 16)));
      const key = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
      return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
    }

