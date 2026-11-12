# Images added by the V6.3 refinement of the landing

Built by `tools/migration/landing-v6/build-v63-images.mjs` (fixed crops, WebP quality 82). The pixel size of each
file is the size written in the markup, checked by `LandingV6Tests`. The public footer's «مصادر الصور» section
says the same.

## Screens of Nabd itself

Taken from a real session of the ER training room in this application (asthma case, demo account «زيد
العبداللات», understanding services off so the room answered in its offline mode), driven by
`tools/migration/landing-v6/capture-er-session.js`. The questions and orders were typed into the room; the
replies, the blood gas result and the report are what the room produced. The case content is fictional training
material that a physician has not reviewed yet. No licence question: they are screenshots of this project.

| File | Pixels | Where | Moment |
|---|---|---|---|
| `showcase-er-room.webp` | 1280 × 800 | The laptop screen | First treatments given (1280×800 window) |
| `step-1-briefing.webp` | 640 × 480 | Step 01 | The case briefing and the choice of role |
| `step-2-talk.webp` | 640 × 480 | Step 02 | Two questions and the patient's answers |
| `step-3-workup.webp` | 640 × 480 | Step 03 | The blood gas result |
| `step-4-report.webp` | 640 × 480 | Step 04 | The report after the handover |

## Photos (Wikimedia Commons; already shipped by the application, see `../../CREDITS.txt`)

| File | Pixels | Where | Source and licence |
|---|---|---|---|
| `campus-just.webp` | 640 × 400 | Partnership section | "Jordan University of Science and Technology tour 2025 (7).jpg", Aroobhj, **CC0 1.0**, own work uploaded by the photographer (https://commons.wikimedia.org/wiki/File:Jordan_University_of_Science_and_Technology_tour_2025_(7).jpg). Cropped from `img/v9/aud-uni.jpg` (640 × 420, the size the application ships; a larger original exists on Commons). Subject: the towers of King Abdullah University Hospital on the JUST campus (the photographer's caption on Commons is «مستشفى الملك عبدالله المؤسس»; the file is also in the Commons category "King Abdullah University Hospital"); the page says so in the caption and the alt text. Shown as an illustration; it does not state or imply a partnership |
| `why-critical-cases.webp` | 640 × 400 | «لماذا صممنا نبض؟», card 1 | "Monitor theo dõi bệnh nhân.jpg", Huynhvn, CC0 (from `img/nc/sepsis.jpg`) |
| `why-safe-practice.webp` | 640 × 400 | «لماذا صممنا نبض؟», card 2 | "Progressive Skills Training at LRMC (9659121).jpg", Travis Jones, public domain (from `img/v9/solution2.jpg`). The source describes trauma-care skills training; the alt text says «تدريب عملي على رعاية مصاب» |
| `why-feedback.webp` | 640 × 400 | «لماذا صممنا نبض؟», card 3 | "Reserve Citizen Airmen build partnerships in operating room (8948178).jpg", U.S. Air Force photo by Maj. Stephani Schafer, public domain (from `img/or/checklist.jpg`). Two operating-room nurses reviewing a list on the wall (the source describes it as the list of the day's patients; the alt text says «قائمة», not «قائمة تحقّق») |

## Replaced during V6.3

A first version used "Jordan University Hospital building.jpg" (Commons, tagged CC BY-SA 4.0) for the partnership
section. The review found that its Commons page names the hospital as author and its website as source, with no
permission record: the file was copied from the website by a third party, so the licence rests on the uploader's
word. It was replaced by the CC0 JUST photo above, whose uploader is the photographer. The application still ships
the older `img/v9/jordan.jpg` (legacy, credited in `../../CREDITS.txt`); its provenance has the same weakness
(docs/next-phase-backlog.md).

Display: the photos are shown with a light colour grade (CSS filter and gradient); the files themselves are only
cropped and resized.
