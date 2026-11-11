  /* ---------- phase8 2026-11-07: the start briefing ---------- */
  // What to do, who is in the room and the trainee's role, from the case file and the track. Never the diagnosis
  // and never which tests are indicated. Real pages only: the Node harness never sees it.
  function briefTrack() {
    try {
      const u = (typeof authState !== 'undefined' && authState.user) || null;
      return u && typeof nbTrackOf === 'function' ? nbTrackOf(u) : null;
    } catch (e) { return null; }
  }
  // nurse mode 2026-11-07: the role switch, usable only before the session starts.
  function roleSwitch() {
    const nurseOn = E.role === 'nurse';
    if (!canSwitch()) return `<p class="er-role-now"><b>دوري في الغرفة:</b> ${nurseOn ? 'ممرض/ة' : 'طبيب'}. <span class="er-small">يتغيّر الدور قبل بدء الجلسة فقط.</span></p>`;
    return `<div class="er-role-sw" role="radiogroup" aria-label="دوري في الغرفة"><span class="er-role-l">دوري في الغرفة:</span><button type="button" role="radio" data-role="doctor" aria-checked="${!nurseOn}" tabindex="${nurseOn ? -1 : 0}">طبيب</button><button type="button" role="radio" data-role="nurse" aria-checked="${nurseOn}" tabindex="${nurseOn ? 0 : -1}">ممرض/ة</button><span class="er-small">يتغيّر الدور قبل بدء الجلسة فقط.</span></div>`;
  }
  function briefHtmlNurse() {
    const c = E.c, p = c.patient, comp = c.companion || {}, nurseName = (c.nurse && c.nurse.name) || '', N = E.nurse, F = N.sex === 'F';
    return `<div class="er-pane er-brief" role="dialog" aria-modal="true" aria-labelledby="er-brief-h" aria-describedby="er-brief-now">
      <header class="er-brief-top">
        <h3 id="er-brief-h">حالتك في غرفة الطوارئ</h3>
        <p class="er-brief-who"><span class="er-brief-bed">${esc(c.bed)}</span><b>${esc(p.name)}</b>، ${esc(p.age)} سنة</p>
      </header>
      ${roleSwitch()}
      <section class="er-brief-now" id="er-brief-now"><h4>ما تعرفه الآن</h4><p>${esc(p.arrival)}</p></section>
      <section><h4>من معك في الغرفة</h4><ul class="er-brief-people">
        <li><i data-who="p" aria-hidden="true"></i><span><b>المريض</b>: ${esc(p.name)}</span></li>
        ${comp.name ? `<li><i data-who="c" aria-hidden="true"></i><span><b>المرافق</b>: ${esc(comp.name)}${comp.rel ? ` (${esc(comp.rel)})` : ''}</span></li>` : ''}
        <li><i data-who="d" aria-hidden="true"></i><span><b>المشرفة التمريضية ${esc(nurseName)}</b>: استلمت المريض في الفرز وسلّمتك إياه، وتبقى خلفك؛ تسألها إذا احترت، وتعلّمك أولويات التمريض، ولا تعطيك التشخيص.</span></li>
        <li><i data-who="n" aria-hidden="true"></i><span><b>${F ? 'الطبيبة المقيمة' : 'الطبيب المقيم'} ${esc(N.doc)}</b>: ${F ? 'مشغولة بمريض آخر، وترد على الهاتف أو تحضر حين تتصل بها. هي من تعطي الأوامر الطبية.' : 'مشغول بمريض آخر، ويرد على الهاتف أو يحضر حين تتصل به. هو من يعطي الأوامر الطبية.'}</span></li>
      </ul></section>
      <section><h4>دورك</h4><p>أنت ممرض/ة الطوارئ المسؤول/ة عن هذا السرير. تقيّم المريض بطريقة ABCDE، وتراقب المونيتور، وتتعرّف على التدهور، وتبلّغ الطبيب برسالة SBAR واضحة، وتنفّذ أوامره بأمان، ثم تسلّم الحالة.</p></section>
      <section class="er-brief-scope"><h4>نطاق صلاحياتك <small>(حسب بروتوكولات الطوارئ المعتادة، وقد تختلف بين المستشفيات)</small></h4>
        <p><b>تستطيع وحدك:</b> التقييم الكامل والقصة ومنها الحساسية والأدوية، قياس العلامات الحيوية وإعادتها، وضعية المريض، الأكسجين عند انخفاض الإشباع وفق البروتوكول، تركيب كانيولا، سحب عينات الدم، تسجيل تخطيط القلب، سكر الدم الشعري، ذروة الجريان، والاتصال بالطبيب أو طلب فريق الإنعاش.</p>
        <p><b>تحتاج أمر طبيب:</b> الأدوية، السوائل الوريدية، الفحوصات المخبرية، والتصوير. (بعض المستشفيات تعتمد أوامر دائمة لأدوية معيّنة؛ هذه الغرفة تطلب أمراً لكل دواء.)</p>
      </section>
      <section><h4>ما المطلوب منك</h4><ol class="er-brief-steps">
        <li>استلم المريض وقيّمه بطريقة ABCDE، واسأل عن الحساسية والأدوية.</li>
        <li>قِس العلامات الحيوية وأعد قياسها، وانتبه لأي تدهور.</li>
        <li>ابدأ ما يسمح به نطاقك دون انتظار.</li>
        <li>اتصل بالطبيب حين تستدعي الحالة ذلك، وقدّم له رسالة SBAR بالأرقام.</li>
        <li>نفّذ أوامر الطبيب من قائمة «أوامر الطبيب»، وتحقق من الحساسية قبل كل دواء، وأعد التقييم بعد كل تدخل.</li>
        <li>حين تنتهي اضغط «سلّم الحالة» واكتب التسليم بصيغة SBAR، ثم اقرأ تقريرك.</li>
      </ol></section>
      <section class="er-brief-tips"><h4>نصائح قصيرة</h4><ul>
        <li>اكتب ما تفعله بصيغة المتكلم: <span data-no-terms>«بقيس الضغط»، «ركّبت كانيولا»، «بتصل بالدكتور»</span>.</li>
        <li>نادِ الشخص باسمه ليعرف أنك تكلمه.</li>
        <li>تظهر قائمة أوامر الطبيب في «Labs» يسار المحادثة بعد أن يعطيك أوامره، وعددها على الزر.</li>
        <li>تسير ساعة الحالة مع الوقت الحقيقي، لكن أثر العلاج وتغيّر حالة المريض يظهران أسرع من الواقع.</li>
        <li>زر «عرض التعليمات» أعلى الغرفة يعيد هذه النافذة متى شئت.</li>
      </ul></section>
      <p class="er-small">للتدريب فقط. الحالات لم يراجعها طبيب بعد.</p>
      <footer class="er-pane-f er-brief-f"><button type="button" class="p" id="er-brief-go">ابدأ الجلسة</button></footer>
    </div>`;
  }
  function briefHtml() {
    if (NM()) return briefHtmlNurse();
    const c = E.c, p = c.patient, comp = c.companion || {}, nurseName = (c.nurse && c.nurse.name) || '';
    const role = briefTrack() === 'nursing'
      ? 'أنت تتولى في هذه الغرفة دور المسؤول عن الحالة (يناديك الفريق «دكتور»)، وتركيزك: التقييم المنهجي ABCDE، قراءة المونيتور والإنذار المبكر، السؤال عن الحساسية والأدوية قبل أي دواء، ومتابعة الاستجابة بعد كل إجراء، ثم تسليم الحالة بصيغة SBAR.'
      : 'أنت الطبيب المقيم المناوب، والحالة مسؤوليتك من الاستقبال حتى التسليم.';
    return `<div class="er-pane er-brief" role="dialog" aria-modal="true" aria-labelledby="er-brief-h" aria-describedby="er-brief-now">
      <header class="er-brief-top">
        <h3 id="er-brief-h">حالتك في غرفة الطوارئ</h3>
        <p class="er-brief-who"><span class="er-brief-bed">${esc(c.bed)}</span><b>${esc(p.name)}</b>، ${esc(p.age)} سنة</p>
      </header>
      ${roleSwitch()}
      <section class="er-brief-now" id="er-brief-now"><h4>ما تعرفه الآن</h4><p>${esc(p.arrival)}</p></section>
      <section><h4>من معك في الغرفة</h4><ul class="er-brief-people">
        <li><i data-who="p" aria-hidden="true"></i><span><b>المريض</b>: ${esc(p.name)}</span></li>
        ${comp.name ? `<li><i data-who="c" aria-hidden="true"></i><span><b>المرافق</b>: ${esc(comp.name)}${comp.rel ? ` (${esc(comp.rel)})` : ''}</span></li>` : ''}
        <li><i data-who="n" aria-hidden="true"></i><span><b>الممرضة${nurseName ? ' ' + esc(nurseName) : ''}</b>: تنفّذ طلباتك وتقرأ لك المونيتور.</span></li>
        <li><i data-who="d" aria-hidden="true"></i><span><b>المشرف</b>: تسأله إذا احترت، ولا يعطيك التشخيص.</span></li>
      </ul></section>
      <section><h4>دورك</h4><p>${esc(role)}</p></section>
      <section><h4>ما المطلوب منك</h4><ol class="er-brief-steps">
        <li>اسأل المريض والمرافق عن القصة والأعراض والحساسية والأدوية. اكتب بالعربية أو باللهجة كما تتكلم عادة.</li>
        <li>افحص المريض، واطلب الفحوصات من «Labs» يسار المحادثة (زر «Labs» على الهاتف) أو بالكتابة في المحادثة.</li>
        <li>اطلب العلاج من الممرضة باسم الدواء والجرعة والطريق.</li>
        <li>راقب المونيتور («Vitals» يسار المحادثة) واستجابة المريض بعد كل إجراء.</li>
        <li>حين تنتهي اضغط «سلّم الحالة» واكتب التشخيص والوجهة والتسليم بصيغة SBAR.</li>
        <li>اقرأ تقريرك في النهاية لتعرف ما أحسنت فيه وما يجب أن يتغير.</li>
      </ol></section>
      <section class="er-brief-tips"><h4>نصائح قصيرة</h4><ul>
        <li>نادِ الشخص باسمه ليعرف أنك تكلمه.</li>
        <li>تسير ساعة الحالة مع الوقت الحقيقي، لكن أثر العلاج وتغيّر حالة المريض يظهران أسرع من الواقع.</li>
        <li>الفحص خارج الاستطباب يظهر بالأصفر، وستُسأل عن تبريره عند التسليم.</li>
        <li>زر «عرض التعليمات» أعلى الغرفة يعيد هذه النافذة متى شئت.</li>
      </ul></section>
      <p class="er-small">للتدريب فقط. الحالات لم يراجعها طبيب بعد.</p>
      <footer class="er-pane-f er-brief-f"><button type="button" class="p" id="er-brief-go">ابدأ الجلسة</button></footer>
    </div>`;
  }
