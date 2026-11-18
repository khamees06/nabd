# Nabd Clinical Simulator — v1.5 Forearm Contact

## تدريب لمس الساعد

- افتح **تدريب لمس الساعد** من نافذة غرفة العمليات. انقر على جلد رسغ المريض الأيسر لتمتد اليد وتثبت القبضة. حرّك الماوس للأعلى أو اسحب بإصبعك، وانقر ثانية للإفلات.
- استخدم زر الماوس الأيمن أو **تغيير النظر** على اللمس. يبقى الرسغ عند آخر هدف أثناء النظر وتبدأ حركة المؤشر التالية من موضعها.
- اطلب **مساندة المشرف** وهو بجانب التخت. عندما تظهر رسالة الإسناد، أفلت قبضتك لتجربة بقاء الساعد في وضعه ثم اضغط **إنهاء المساندة**. يعيد زر **إعادة وضع الساعد** التمرين.
- يحتفظ التمرين بالقبضة بالنسبة إلى عظمة الرسغ. تفحص مجسّمات Rapier التقريبية حركة الكف والأصابع أمام الذراع والتخت. الحركة الحركية للمفاصل تعمل عبر نموذج المريض الحالي. استعمال مسار التصادم محدّد بتمرين الساعد.
- مصدر هذه النسخة هو مشروع v1.2 الذي يحتوي أطلس الأعضاء. مجسّم العظام وتمرين الكسر من v1.4 يحتاجان دمج مصدر v1.4.
- Rapier 0.21.0 مرفق مع المعاينة المستقلة. [الترخيص](vendor/rapier/LICENSE).


## عرض التشريح الداخلي

- اضغط **التشريح الداخلي** من نافذة المحاكاة. تظهر طبقة الأعضاء داخل جسم المريض الشفاف. حرّك زاوية النظر واختر المجموعة والعضو. يتيح **عزل العضو** رؤية البنى المحجوبة.
- الأطلس يضم 35 بنية أو مجموعة من الرأس والصدر والبطن والحوض. من قائمة **الهضمي** اختر **الزائدة الدودية** أو **الأعور** أو **مسراق الزائدة**. بإمكانك ترجع لعرض الجميع بزر **العرض الكامل**.
- وضع المنظار يعرض أجزاء البطن من نفس الأطلس المثبّت داخل المريض. تحديد عضو أو عزله في عرض التشريح لا يغيّر ما تعرضه شاشة المنظار.
- التركيب مبني على أطلس مرجعي مواءم لمجسّم المريض. هذه المرحلة تعرض شكل الأعضاء وعلاقاتها المكانية. خصائص النسيج مثل الحركة والتشوّه والتفاعل مع الأدوات تحتاج نمذجة منفصلة.

ترخيص الأصول وتفاصيلها في [assets/anatomy/PROVENANCE.md](assets/anatomy/PROVENANCE.md).

## محطة المنظار v1.1

## تجربة محطة المنظار

1. اختر **منظار تدريبي** من قائمة الأداة. اضغط **الصينية**، ثم انقر على مقبض المنظار حتى تثبت القبضة.
2. افتح **منطقة البطن**. وجّه رأس المنظار إلى حلقة التدريب، ثم استخدم **أدخل الأداة**. تنتقل شاشتا المحطة معًا من الانتظار إلى الصورة المباشرة عندما يدخل الرأس ضمن الحقل الافتراضي.
3. اضغط **انظر إلى الشاشة**. تظل وقفتك وقبضتك ثابتتين. جرّب تحديد إحدى البنى من الحقل، ثم جرّب الدوران والسحب من الأزرار الموجودة في عرض الشاشة. مفاتيح R/V للعمق وZ/X للدوران.
4. اضغط **ارجع إلى الحقل** لاستئناف توجيه المنظار بالماوس أو اللمس. اسحب الأداة بالكامل ثم أفلتها.

المشهد الداخلي نموذج هندسي تدريبي ومعالمه البصرية تجريبية. شغّل ملف المعاينة المستقل بمتصفح يدعم WebGL 2، أو شغّل المشروع عبر `npm install` ثم `npm run dev`.

## أساس الإصدار v1.0

**Baseline:** v0.22  
**Release:** v1.0 Foundation  
**Engine:** Existing Three.js r180 runtime  
**Status:** Architecture and session-observability foundation

Nabd is an interactive 3D clinical and surgical training environment. This foundation release starts from the complete v0.22 VS Code project. It preserves the existing visual identity, room, patient, staff, equipment, instruments, camera views and training workflows while organizing the existing code into clearer domain modules.

## What changed in v1.0

### 1. Architecture and module organization

The previous runtime has been retained as `src/app/NabdRuntime.js`; `src/engine.js` is now the small HTML entry point. Existing domain code has been moved into dedicated folders, and compatibility re-exports remain at the previous paths.

- `src/core/` — event bus, scene lifecycle, performance sampling and workstation navigation.
- `src/patient/` — patient surface interaction/deformation.
- `src/staff/` — staff rig, gloves, hands and existing instrument models.
- `src/interaction/` — pointer, target picking, grip, release and privacy filtering.
- `src/instruments/` — existing instrument kinematics, endoscope feed and centralized instrument metadata.
- `src/simulation/` — session lifecycle and structured event log.
- `src/ui/` — vital monitor and opt-in developer diagnostics.

### 2. Session event logging

Events are stored in memory for the current training session. Starting a new session clears the previous event log. Resetting a session clears its events. Nothing is sent to an external service.

Recorded events include:

- `simulation_started`, `simulation_stage_changed`, `simulation_completed`
- `instrument_selected`, `instrument_picked`, `instrument_released`, `instrument_pick_failed`
- `hand_changed`, `camera_changed`, `patient_interaction`, `endoscope_moved`
- `checklist_item_completed`, `interaction_error`

From the browser developer console, the current API is available as:

```js
window.NabdSimulation.getState()
window.NabdSimulation.getEvents()
window.NabdSimulation.exportEvents()
window.NabdSimulation.clear()
```

### 3. Instrument configuration

The existing four instrument types are configured centrally: `grasper`, `scissors`, `needleHolder`, and `scope`. Existing instrument lengths, current depth-control availability and the existing grip anchor are preserved. No new clinical function has been invented.

### 4. Scene and performance diagnostics

Scene rendering and resize calls pass through `SceneManager`. Open the app with `?debug=1` to show a small developer overlay with FPS, frame time, draw calls, triangle count, geometry count, texture count and session event count. Browser heap usage is shown only where supported.

### 5. Asset integrity and delivery

`assets/asset-manifest.json` records each asset's relative path, byte size and SHA-256 hash. The GLB assets have not been recompressed or altered. The project includes a standalone HTML preview builder that embeds the original assets and runtime.

## Run the simulator

### Option A — dependency-free local server

Requires Node.js 20 or newer; no `npm install` is required for this route:

```bash
npm run serve
```

Open `http://127.0.0.1:4173`. For developer diagnostics, open `http://127.0.0.1:4173/?debug=1`.

On Windows, double-click `start-dev.bat` to start the same local server.

### Option B — Vite development and production build

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

### Standalone HTML preview

```bash
npm run preview:standalone
```

Output: `dist/Nabd-Clinical-Simulator-v1.5-Preview.html`.

### Tests

```bash
npm test
```

## Existing interaction controls retained from v0.22

| Action | Control |
|---|---|
| Select work point | **تحديد نقطة العمل** then click a visible, non-protected patient surface |
| Change view while holding | Right mouse drag; on touch, enable **تغيير النظر** then drag |
| Move around bedside | W/A/S/D or arrow keys |
| Zoom during work | Mouse wheel or + / - |
| Aim scope | Move pointer around the selected remote centre while holding it |
| Insert/retract scope | Mouse wheel, depth buttons, R/V |
| Axial roll | Z/X or roll buttons |
| Grab/release | Click to grab; click again to release; F keyboard alternative |
| Select hand | Q / E or left/right hand buttons |
| Cancel safely | Escape |

## Preserved v0.22 systems

- Operating room scene, patient rig, supervisor/staff models and gloves.
- Operating table, surgical-light pendant and anesthesia workstation assets.
- First-person trainee view, room overview and existing camera presets.
- Existing patient positioning and joint manipulation.
- Existing bedside movement, hand selection and pointer/grip path.
- Existing four instruments and their current selection/grab workflow.
- Existing vital monitor, training checklist and scenario stages.
- Existing laparoscopic depth controls and endoscope render-target feed.

## Known limitations — not solved by this foundation release

1. The existing Three.js runtime is still a large composition file. v1.0 introduces real module boundaries but does not rewrite the entire renderer and scene runtime.
2. One active bedside grip is supported at a time; simultaneous two-hand instrument manipulation is not implemented.
3. Existing general contact and abdominal surface deformation are retained; this is not a complete rigid-body or volumetric soft-tissue physics solver.
4. Endoscope movement uses the existing training remote-centre constraint, not a physical trocar or tissue-force model.
5. Endoscope internal anatomy remains illustrative training geometry, not clinically validated anatomy.
6. Workstation movement follows the existing bed perimeter path, not free room locomotion with full obstacle avoidance.
7. Event records are in-memory only; backend synchronization is not configured.
8. No before/after FPS improvement is claimed. Use `?debug=1` to collect runtime metrics on the target device.
9. Browser and device compatibility beyond the tested Chromium configurations still needs verification.

See `docs/Nabd-v1.0-Foundation-Report.md`, `docs/Nabd-v1.0-Architecture.md`, `docs/Nabd-v1.0-Functionality-Audit.md`, and `docs/Nabd-v1.0-Change-Log.md` for implementation details and validation scope.
