// Writes the Razor partial views of the V6.2 landing from the pieces cut by convert-markup.mjs, applying the
// integration decisions recorded in docs/ui-integration-map.md:
//   - section IDs get the "nl-" prefix (#about -> #nl-about), so they cannot meet an application ID;
//   - the header keeps the IDs the legacy client binds (public-header, public-brand-btn, public-login-btn,
//     public-register-btn); its mobile menu has its own IDs and never opens the signed-in sidebar;
//   - every sign-in/registration button opens the application's existing sign-in (openAuthModal);
//   - the footer keeps site-footer, footer-guest-links, footer-app-links and the signed-in links;
//   - each region carries start/end markers that the baseline tests use.
// Kept as the record of how the views were produced; the views have been edited by hand since, so running
// it again would overwrite those edits. Use it only to regenerate from a new prototype version.
//
// usage: node tools/migration/landing-v6/build-partials.mjs <fragments-folder> <Nabd.Web folder>
import fs from 'node:fs';
import path from 'node:path';

const [, , fragDir, webDir] = process.argv;
const read = name => fs.readFileSync(path.join(fragDir, name), 'utf8');
const IDS = [['home', 'nl-home'], ['about', 'nl-about'], ['specialties', 'nl-specialties'], ['method', 'nl-method'], ['audience', 'nl-audience'],
  ['experience', 'nl-experience'], ['institutions-section', 'nl-institutions-section'], ['institutions', 'nl-institutions'], ['join', 'nl-join'],
  ['heroTitle', 'nl-hero-title'], ['specialtiesTitle', 'nl-specialties-title'], ['experienceTitle', 'nl-experience-title'], ['methodTitle', 'nl-method-title'], ['aboutTitle', 'nl-about-title']];
const ids = s => IDS.reduce((t, [a, b]) => t.split(`id="${a}"`).join(`id="${b}"`).split(`href="#${a}"`).join(`href="#${b}"`).split(`aria-labelledby="${a}"`).join(`aria-labelledby="${b}"`), s)
  .split('href="#contact"').join('href="#site-footer"')
  .split('data-auth-open=').join('data-nl-auth=')
  .split('data-modal=').join('data-nl-dialog=')
  // Not an official national academy: the brand line says what the platform is (docs/ui-integration-audit.md).
  .split('الأكاديمية الوطنية للمحاكاة السريرية').join('أكاديمية المحاكاة السريرية');
const region = (name, body, indent = '') => `${indent}<!-- nabd:region ${name} (design V6.2; see docs/ui-integration-map.md) -->\n${body.trim()}\n${indent}<!-- /nabd:region ${name} -->`;
const write = (rel, text) => { const f = path.join(webDir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); console.log('wrote', rel, text.length); };

/* ---------- header ---------- */
let header = ids(read('header.html'))
  .replace('<a class="nl-skip-link" href="#mainContent">', '<a class="nl-skip-link" href="#main-container">')
  .replace('<header class="nl-site-header">', '<header id="public-header" class="nabd-landing nl-site-header">')
  .replace('<a aria-label="نَبْض — الصفحة الرئيسية" class="nl-brand" href="#nl-home">', '<a id="public-brand-btn" aria-label="نَبْض — الصفحة الرئيسية" class="nl-brand" href="#nl-home">')
  .replace('id="mainNav"', 'id="public-main-nav"')
  .replace('<button class="nl-btn nl-btn-outline-light" data-nl-auth="login" type="button">', '<button id="public-login-btn" class="nl-btn nl-btn-outline-light" type="button">')
  .replace('<button class="nl-btn nl-btn-copper" data-nl-auth="register" type="button">', '<button id="public-register-btn" class="nl-btn nl-btn-copper" type="button">')
  .replace('aria-controls="mainNav"', 'aria-controls="public-main-nav"')
  .replace('id="menuToggle"', 'id="public-menu-toggle"');
// The skip link sits inside the header so that it disappears with the header after sign-in.
header = header.replace(/^(<a class="nl-skip-link"[^\n]*\n)(<header[^\n]*\n)/, '$2$1');
write('Views/Shared/Layout/_PublicHeader.cshtml', region('public-header', header, '  '));

/* ---------- landing view ---------- */
const hero = ids(read('hero.html'));
const value = ids(read('value-strip.html'));
const overview = ids(read('overview.html'));
const specStart = overview.indexOf('<section aria-labelledby="nl-specialties-title"');
const expStart = overview.indexOf('<section aria-labelledby="nl-experience-title"');
const expEnd = overview.lastIndexOf('</section>', overview.lastIndexOf('</section>') - 1) + '</section>'.length;
const specialties = overview.slice(specStart, expStart).trim();
const showcase = overview.slice(expStart, expEnd).trim();
const overviewShell = overview.slice(0, specStart).trim();
const method = ids(read('method.html'));
const about = ids(read('about.html'));
const institutions = ids(read('institutions.html'));
const cta = ids(read('final-cta.html'))
  // The second action goes to the institutions section itself rather than to a dialog.
  .replace('<button class="nl-btn nl-btn-outline-light" data-nl-dialog="academic" type="button">للمؤسسات التعليمية</button>', '<a class="nl-btn nl-btn-outline-light" href="#nl-institutions">للمؤسسات التعليمية</a>');
const dialog = ids(read('modal.html'))
  .replace('<div aria-hidden="true" class="nl-modal-backdrop" id="modalBackdrop" role="presentation">', '<div aria-hidden="true" class="nabd-landing nl-modal-backdrop" id="nl-dialog" role="presentation">')
  .replace('aria-describedby="modalMessage" aria-labelledby="modalTitle"', 'aria-describedby="nl-dialog-message" aria-labelledby="nl-dialog-title"')
  .replace('id="modalTitle"', 'id="nl-dialog-title"').replace('id="modalClose"', 'id="nl-dialog-close"')
  .replace('id="modalMessage"', 'id="nl-dialog-message"').replace('id="prototypeNote"', 'id="nl-dialog-note"').replace('id="modalOk"', 'id="nl-dialog-ok"');

const P = name => `@await Html.PartialAsync("~/Views/Home/Landing/${name}.cshtml")`;
write('Views/Home/Landing/_Hero.cshtml', hero.trim());
write('Views/Home/Landing/_ValueStrip.cshtml', value.trim());
write('Views/Home/Landing/_Specialties.cshtml', specialties);
write('Views/Home/Landing/_SimulationShowcase.cshtml', showcase);
write('Views/Home/Landing/_Overview.cshtml', `${overviewShell}\n${P('_Specialties')}\n${P('_SimulationShowcase')}\n</div>\n</section>`);
write('Views/Home/Landing/_Method.cshtml', method.trim());
write('Views/Home/Landing/_About.cshtml', about.trim());
write('Views/Home/Landing/_Institutions.cshtml', institutions.trim());
write('Views/Home/Landing/_FinalCta.cshtml', cta.trim());
write('Views/Home/Landing/_LandingDialog.cshtml', dialog.trim());
write('Views/Home/Landing/_LandingView.cshtml', region('landing', `<!-- =======================================================
         VIEW 0: PUBLIC LANDING PAGE (INDEX). The legacy client shows this view to guests (showOnlySection('index')).
         ======================================================= -->
    <section id="view-index" class="nl-index-view">
      <div class="nabd-landing nl-landing">
${['_Hero', '_ValueStrip', '_Overview', '_Method', '_About', '_Institutions', '_FinalCta', '_LandingDialog'].map(P).join('\n')}
      </div>
      <!-- The level quiz is closed (scope.css); script.js still writes into this box. -->
      <div id="nb-quiz-main" hidden></div>
    </section>`, '    '));

/* ---------- footer ---------- */
let footer = ids(read('footer.html'))
  .replace('<footer class="nl-site-footer" id="contact">', '<footer id="site-footer" class="nabd-landing nl-site-footer">');
const quick = footer.match(/<div class="nl-footer-col"><h3>روابط سريعة<\/h3>[\s\S]*?<\/div>/)[0];
const info = footer.match(/<div class="nl-footer-col"><h3>معلومات<\/h3>[\s\S]*?<\/div>/)[0];
const app = `<div id="footer-app-links" class="hidden nl-footer-links">
<div class="nl-footer-col"><h3>مساحة التدريب</h3><button type="button" data-foot-app="home" class="foot-app-link">الرئيسية</button><button type="button" id="foot-er-btn">غرفة الطوارئ العشوائية</button><button type="button" onclick="nbOpenER()">غرفة الطوارئ</button><button type="button" data-foot-app="coach" class="foot-app-link">المدرب السريري</button><button type="button" data-foot-app="profile" class="foot-app-link">ملفي الشخصي</button></div>
<div class="nl-footer-col"><h3>طبيعة النموذج</h3><span>نموذج أولي تعليمي وتوضيحي</span><span>لطلبة الطب والتمريض</span><span>لا يُغني عن البروتوكولات السريرية المعتمدة</span></div>
</div>`;
footer = footer.replace(quick + '\n' + info, `<div id="footer-guest-links" class="nl-footer-links">\n${quick}\n${info}\n</div>\n${app}`);
write('Views/Shared/Layout/_SiteFooter.cshtml', region('site-footer', footer, '  '));
