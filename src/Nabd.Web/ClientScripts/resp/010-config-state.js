  const DATA = 'data/';
  const API = '/api/resp-chat';
  const RESP = new Set(['URTI', 'Viral pharyngitis', 'Acute laryngitis', 'Bronchitis', 'Acute rhinosinusitis',
    'Chronic rhinosinusitis', 'Allergic sinusitis', 'Whooping cough', 'Sarcoidosis',
    'Bronchospasm / acute asthma exacerbation', 'Acute COPD exacerbation / infection', 'Pneumonia', 'Influenza',
    'Tuberculosis', 'Bronchiectasis', 'Bronchiolitis', 'Pulmonary neoplasm', 'Pulmonary embolism',
    'Spontaneous pneumothorax', 'Epiglottitis', 'Croup', 'Larygospasm']);
  const NAMES = {
    M: ['أحمد', 'محمد', 'خالد', 'عمر', 'يوسف', 'سامر', 'حسن', 'علي', 'زيد', 'فراس', 'إبراهيم', 'مهند'],
    F: ['سارة', 'ليلى', 'ريم', 'هبة', 'دينا', 'نور', 'رنا', 'لينا', 'مريم', 'سلمى', 'رهف', 'آية']
  };

  let M = null, POOL = null, T = null, L = null, CL = null;
  let evIndex = null, members = null, heads = null, loading = null;
  const S = { pt: null, tok: null, asked: new Set(), derived: new Set(), steps: [], exam: false, done: false, seen: new Set(), caseNo: 0 };

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // Isolated left-to-right so "<0.1%" keeps its order inside Arabic text.
  const pct = p => '⁦' + (p >= 0.995 ? '>99' : p < 0.001 ? '<0.1' : p * 100 >= 10 ? Math.round(p * 100) : (p * 100).toFixed(1)) + '%⁩';
  const CHILD = 6; // below this age the mother answers for the child
  const ageAr = n => n < 1 ? 'أقل من سنة' : n === 1 ? 'سنة واحدة' : n === 2 ? 'سنتان' : n <= 10 ? n + ' سنوات' : n + ' سنة';

