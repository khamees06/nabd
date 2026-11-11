using Nabd.Domain.Cases;
using Nabd.Domain.Catalog;
using Nabd.Domain.Common;

namespace Nabd.Domain.Simulation;

/// <summary>
/// One trainee managing one patient: the clinical state of an emergency-room simulation and the rules that move it.
/// </summary>
/// <remarks>
/// <para>
/// This is the clinical core of the legacy ER room (er.js: vitalsAt, modsNow, live, netRate, tick, stageCheck,
/// give, harm, submitTest and the cuff), moved here rule for rule. Its behaviour is pinned by golden-master
/// traces recorded from the legacy code; any change that alters a number must be a deliberate, reviewed change of
/// the clinical model.
/// </para>
/// <para>
/// The session knows nothing about text, the screen or the network. Understanding what the trainee wrote, checking
/// a dose, and deciding that an order is unsafe happen outside; the session receives the outcome as a command.
/// </para>
/// </remarks>
public sealed class SimulationSession
{
    /// <summary>Simulated seconds per real second.</summary>
    public const double Pace = 1;

    /// <summary>Even a well-treated patient in the resuscitation room keeps this much risk.</summary>
    public const double RiskFloor = 20;

    private const double CuffEveryMinutes = 2;
    private const double CuffWhenSickMinutes = 1;
    private const double RiskLogEveryMinutes = 0.25;
    private const double MonitorRefreshMinutes = 0.12;
    private const double DefaultRampMinutes = 0.2;

    private readonly OrderedDictionary<string, InterventionRecord> _interventions = new(StringComparer.Ordinal);
    private readonly OrderedDictionary<string, OrderedTest> _tests = new(StringComparer.Ordinal);
    private readonly List<RiskSlowing> _slowings = [];
    private readonly List<VitalModifier> _modifiers = [];
    private readonly List<HarmRecord> _harms = [];
    private readonly List<string> _unneededOrders = [];
    private readonly List<string> _lateTests = [];
    private readonly HashSet<string> _harmfulOrders = new(StringComparer.Ordinal);
    private readonly HashSet<string> _historyObtained = new(StringComparer.Ordinal);
    private readonly HashSet<string> _examinationsDone = new(StringComparer.Ordinal);
    private readonly List<RiskPoint> _riskHistory = [];
    private readonly List<(double At, Action Run)> _pending = [];
    private readonly List<SessionEvent> _events = [];

    private double _riskLoggedAt;
    private double _monitorRefreshedAt = -1;
    private double _cuffDueAt;
    private (double At, double RiskAtOrder)? _responseDue;

    private SimulationSession(SessionId id, ClinicalCase clinicalCase, ClinicalCatalog catalog, TraineeRole role)
    {
        Id = id;
        Case = clinicalCase;
        Catalog = catalog;
        Role = role;
        Risk = clinicalCase.Risk.Start;
        _riskHistory.Add(new RiskPoint(0, Risk));
    }

    /// <summary>Identity of the session.</summary>
    public SessionId Id { get; }

    /// <summary>The case being played.</summary>
    public ClinicalCase Case { get; }

    /// <summary>The catalog of interventions and tests the session was started with.</summary>
    public ClinicalCatalog Catalog { get; }

    /// <summary>The role the trainee plays.</summary>
    public TraineeRole Role { get; }

    /// <summary>Simulated minutes since the case began.</summary>
    public double SimulatedMinutes { get; private set; }

    /// <summary>The patient's risk, 0 to 100. At 100 the patient arrests.</summary>
    public double Risk { get; private set; }

    /// <summary>The stage the trainee has been told about. It follows the risk up at once and down only after a real deterioration.</summary>
    public ClinicalStage Stage { get; private set; }

    /// <summary>The worst stage reached so far.</summary>
    public ClinicalStage HighestStage { get; private set; }

    /// <summary>True while the patient is in unstable ventricular tachycardia.</summary>
    public bool InVentricularTachycardia { get; private set; }

    /// <summary>Simulated minute at which ventricular tachycardia first appeared, if it did.</summary>
    public double? VentricularTachycardiaAt { get; private set; }

    /// <summary>The latest blood pressure the cuff measured. The cuff cycles; it is not continuous.</summary>
    public BloodPressureReading Cuff { get; private set; }

    /// <summary>True once the temperature has been measured.</summary>
    public bool TemperatureKnown { get; private set; }

    /// <summary>The anaphylactic reaction, when a drug the patient is allergic to was given.</summary>
    public Anaphylaxis? Anaphylaxis { get; private set; }

    /// <summary>True once an allergic reaction has happened in front of the team.</summary>
    public bool AllergicReactionSeen { get; private set; }

    /// <summary>Doses the nurse had to reject.</summary>
    public int WrongDoseCount { get; private set; }

    /// <summary>True once the session has ended, by handover or by arrest.</summary>
    public bool IsOver { get; private set; }

    /// <summary>How the session ended; null while it is running.</summary>
    public SessionOutcome? Outcome { get; private set; }

    /// <summary>Interventions carried out, in the order they were first given.</summary>
    public IReadOnlyList<InterventionRecord> Interventions => [.. _interventions.Values];

    /// <summary>Tests ordered, in order.</summary>
    public IReadOnlyList<OrderedTest> Tests => [.. _tests.Values];

    /// <summary>Treatments slowing the rise of risk.</summary>
    public IReadOnlyList<RiskSlowing> RiskSlowings => _slowings;

    /// <summary>Treatments changing the vital signs.</summary>
    public IReadOnlyList<VitalModifier> VitalModifiers => _modifiers;

    /// <summary>Harms that reached the patient.</summary>
    public IReadOnlyList<HarmRecord> Harms => _harms;

    /// <summary>Orders given with no indication that changed nothing, by their report label.</summary>
    public IReadOnlyList<string> UnneededOrders => _unneededOrders;

    /// <summary>Tests ordered after the step they should have come before.</summary>
    public IReadOnlyList<string> LateTests => _lateTests;

    /// <summary>Interventions that reached the patient as a harm.</summary>
    public IReadOnlyCollection<string> HarmfulOrders => _harmfulOrders;

    /// <summary>History facts the trainee obtained.</summary>
    public IReadOnlyCollection<string> HistoryObtained => _historyObtained;

    /// <summary>Examinations the trainee did.</summary>
    public IReadOnlyCollection<string> ExaminationsDone => _examinationsDone;

    /// <summary>The risk curve, sampled for the report.</summary>
    public IReadOnlyList<RiskPoint> RiskHistory => _riskHistory;

    /// <summary>What happened in the session, in order. Read by the application layer; never by the rules here.</summary>
    public IReadOnlyList<SessionEvent> Events => _events;

    /// <summary>Starts a session: the patient arrives and the cuff takes its first reading.</summary>
    public static SimulationSession Start(SessionId id, ClinicalCase clinicalCase, ClinicalCatalog catalog, TraineeRole role)
    {
        ArgumentNullException.ThrowIfNull(clinicalCase);
        ArgumentNullException.ThrowIfNull(catalog);
        var session = new SimulationSession(id, clinicalCase, catalog, role);
        session.RefreshMonitor();
        return session;
    }

    /* ---------- reading the state ---------- */

    /// <summary>True when the intervention has been carried out.</summary>
    public bool HasDone(string actionId) => _interventions.ContainsKey(actionId);

    /// <summary>The record of an intervention, or null when it has not been carried out.</summary>
    public InterventionRecord? RecordOf(string actionId) => _interventions.GetValueOrDefault(actionId);

    /// <summary>The record that satisfies a step: calling intensive care also counts as calling the senior.</summary>
    public InterventionRecord? RecordSatisfying(string actionId) =>
        RecordOf(actionId) ?? (actionId == "call_senior" ? RecordOf("call_icu") : null);

    /// <summary>The ordered test, or null when it was not ordered.</summary>
    public OrderedTest? TestOf(string testId) => _tests.GetValueOrDefault(testId);

    /// <summary>Key steps of the case that have not been done.</summary>
    public IReadOnlyList<CareStep> MissingKeySteps() =>
        [.. Case.Care.Where(step => step.IsKey && RecordSatisfying(step.ActionId) is null)];

    /// <summary>
    /// True once the case's planned collapse has happened: the patient reached the critical stage, or was given
    /// the rescue treatment.
    /// </summary>
    public bool HasCollapsed =>
        Case.Collapse is not null && (HighestStage >= ClinicalStage.Critical || HasDone(Case.Collapse.RescueActionId));

    /// <summary>What the treatments given so far have done to the vital signs at this moment.</summary>
    private (double Spo2, double Hr, double Rr, double Sbp, double Dbp) TreatmentShift()
    {
        double spo2 = 0, hr = 0, rr = 0, sbp = 0, dbp = 0;
        foreach (var m in _modifiers)
        {
            var f = Numbers.Clamp((SimulatedMinutes - m.FromMinute) / (m.RampMinutes == 0 ? DefaultRampMinutes : m.RampMinutes), 0, 1);
            spo2 += m.OxygenSaturation * f;
            hr += m.HeartRate * f;
            rr += m.RespiratoryRate * f;
            sbp += m.SystolicPressure * f;
            dbp += m.DiastolicPressure * f;
        }

        return (spo2, hr, rr, sbp, dbp);
    }

    /// <summary>The vital signs right now: the untreated signs at the current risk, moved by the treatments given.</summary>
    public VitalSigns CurrentVitals()
    {
        var v = Case.VitalsAt(Risk);
        var m = TreatmentShift();
        var spo2 = Math.Min(99, v.OxygenSaturation + Numbers.Clamp(m.Spo2, -10, 10));
        // In ventricular tachycardia nothing but a shock moves the heart.
        var hr = InVentricularTachycardia
            ? v.HeartRate
            : m.Hr < 0
                ? Math.Max(v.HeartRate + Numbers.Clamp(m.Hr, -30, 0), Math.Min(v.HeartRate, 60))
                : v.HeartRate + Numbers.Clamp(m.Hr, 0, 30);
        var rr = m.Rr < 0
            ? Math.Max(v.RespiratoryRate + Numbers.Clamp(m.Rr, -10, 0), Math.Min(v.RespiratoryRate, 14))
            : v.RespiratoryRate + m.Rr;
        var sbp = v.SystolicPressure + Numbers.Clamp(m.Sbp, -40, 35);
        var dbp = v.DiastolicPressure + Numbers.Clamp(m.Dbp, -20, 18);
        return new VitalSigns(hr, sbp, dbp, rr, spo2);
    }

    /// <summary>Points of risk gained per simulated minute right now (negative while the patient improves).</summary>
    public double NetRiskRate()
    {
        var rate = Case.Risk.RatePerMinute;
        foreach (var slowing in _slowings)
        {
            if (SimulatedMinutes >= slowing.FromMinute) rate -= slowing.PointsPerMinute;
        }

        // Neither settles on its own, whatever else has been given.
        if (Anaphylaxis is { IsTreated: false }) rate = Math.Max(rate, 0) + 3;
        if (InVentricularTachycardia) rate = Math.Max(rate, Case.Risk.RatePerMinute);
        // Supportive care holds the patient; only treating the cause turns him round.
        var hold = Case.Risk.Hold;
        if (hold is not null && !HasDone(hold.UntilActionId) && Risk <= hold.AtRisk) rate = Math.Max(rate, 0);
        return rate;
    }

    /// <summary>
    /// The systolic pressure the patient would have without treatment, or the cuff's reading when that is lower.
    /// A pressor holding the number up does not mean the pressure is holding.
    /// </summary>
    public double UntreatedSystolicPressure() => Math.Min(Case.VitalsAt(Risk).SystolicPressure, Cuff.Systolic);

    /* ---------- time ---------- */

    /// <summary>Moves the session forward by real elapsed seconds (at most two per call, as one screen frame).</summary>
    public void Tick(double elapsedSeconds)
    {
        if (IsOver) return;
        BeginTick(elapsedSeconds);
        ReassessStage();
        EndTick();
    }

    /// <summary>First part of a tick: time and risk advance, the monitor refreshes, delayed effects that are due happen.</summary>
    internal void BeginTick(double elapsedSeconds)
    {
        if (IsOver) return;
        var dt = Math.Max(0, Math.Min(2, elapsedSeconds));
        var rate = NetRiskRate();
        var step = dt * Pace / 60;
        SimulatedMinutes += step;
        Risk = Numbers.Clamp(Risk + rate * step, RiskFloor, 100);
        if (SimulatedMinutes - _riskLoggedAt >= RiskLogEveryMinutes)
        {
            _riskHistory.Add(new RiskPoint(SimulatedMinutes, Risk));
            _riskLoggedAt = SimulatedMinutes;
        }

        if (SimulatedMinutes - _monitorRefreshedAt >= MonitorRefreshMinutes)
        {
            RefreshMonitor();
            _monitorRefreshedAt = SimulatedMinutes;
        }

        var due = _pending.Where(p => SimulatedMinutes >= p.At).ToList();
        foreach (var p in due)
        {
            _pending.Remove(p);
            p.Run();
        }
    }

    /// <summary>
    /// Second part of a tick: the stage follows the risk. Getting worse is announced at once; getting better is an
    /// event only after a real deterioration.
    /// </summary>
    internal void ReassessStage()
    {
        if (IsOver) return;
        var now = Case.StageAt(Risk);
        InVentricularTachycardia = Case.VentricularTachycardiaWhenCritical && now == ClinicalStage.Critical;
        if (now <= Stage)
        {
            if (now < Stage && Stage >= ClinicalStage.Urgent)
            {
                Stage = now;
                // The nurse says which numbers moved, so the cuff measures now.
                TakeCuffReading();
                Raise(new StageChanged(SimulatedMinutes, now, Improved: true));
            }

            return;
        }

        Stage = now;
        if (now > HighestStage) HighestStage = now;
        if (InVentricularTachycardia && VentricularTachycardiaAt is null) VentricularTachycardiaAt = SimulatedMinutes;
        if (now >= ClinicalStage.Urgent) TakeCuffReading();
        if (Case.StageCues.TryGetValue(now, out var cue) && cue.NamesMeasuredSigns) TakeCuffReading();
        Raise(new StageChanged(SimulatedMinutes, now, Improved: false));
    }

    /// <summary>Last part of a tick: at a risk of 100 the patient arrests and the session ends.</summary>
    internal void EndTick()
    {
        if (IsOver) return;
        if (Risk >= 100) Arrest();
    }

    /* ---------- the monitor ---------- */

    /// <summary>The cuff measures when its cycle is due: every two minutes, every minute once the patient is sick.</summary>
    private void RefreshMonitor()
    {
        if (SimulatedMinutes < _cuffDueAt) return;
        var v = CurrentVitals();
        Cuff = new BloodPressureReading(Numbers.Round(v.SystolicPressure), Numbers.Round(v.DiastolicPressure), SimulatedMinutes);
        _cuffDueAt = SimulatedMinutes + (Stage >= ClinicalStage.Urgent ? CuffWhenSickMinutes : CuffEveryMinutes);
    }

    /// <summary>
    /// Once a treatment has had time to work, the nurse reads the numbers again. Treatments given close together
    /// are answered together: one reading, after the last of them has ramped in.
    /// </summary>
    private void ExpectResponseTo(double rampMinutes)
    {
        var at = SimulatedMinutes + rampMinutes + 0.1;
        if (_responseDue is { } open)
        {
            _responseDue = open with { At = Math.Max(open.At, at) };
            return;
        }

        _responseDue = (at, Risk);
        _pending.Add((at, ReadAfterTreatment));
    }

    private void ReadAfterTreatment()
    {
        if (IsOver || _responseDue is not { } due) return;
        if (SimulatedMinutes < due.At - 0.001)
        {
            _pending.Add((due.At, ReadAfterTreatment));
            return;
        }

        _responseDue = null;
        // A dying patient's numbers can fall on their own: that is no credit to the treatment, and nobody reads them out.
        if (Stage < ClinicalStage.Critical && Risk <= due.RiskAtOrder + 2) TakeCuffReading();
    }

    /// <summary>The cuff measures now, whatever its cycle: someone at the bedside asked for the pressure.</summary>
    public void TakeCuffReading()
    {
        _cuffDueAt = 0;
        RefreshMonitor();
    }

    /// <summary>The temperature has been measured.</summary>
    public void NoteTemperatureMeasured()
    {
        TemperatureKnown = true;
        RefreshMonitor();
    }

    /* ---------- interventions ---------- */

    /// <summary>
    /// Carries out an intervention: records it, and applies what the case says it does to the risk and to the
    /// vital signs. A repeat adds the share the catalog allows; a repeat of the same amount of a treatment that
    /// only helps when increased adds nothing.
    /// </summary>
    public void ApplyIntervention(InterventionOrder order, CareEffect effect)
    {
        ArgumentNullException.ThrowIfNull(order);
        ArgumentNullException.ThrowIfNull(effect);
        var definition = Catalog.Intervention(order.ActionId)
            ?? throw new DomainException($"Unknown intervention '{order.ActionId}'.");
        var id = order.ActionId;
        var previous = RecordOf(id);
        var amount = order.Amount;
        _interventions[id] = previous is null
            ? new InterventionRecord(id, SimulatedMinutes, SimulatedMinutes, 1, order.Dose, order.Grade, amount, amount)
            : previous with
            {
                Count = previous.Count + 1,
                LastAt = SimulatedMinutes,
                Dose = order.Dose.Length > 0 ? order.Dose : previous.Dose,
                TotalAmount = previous.TotalAmount + amount,
                LargestAmount = Math.Max(previous.LargestAmount, amount),
            };
        Raise(new InterventionGiven(SimulatedMinutes, id, order.Dose));

        if (id == "bp_repeat") TakeCuffReading();

        // More of the same adds something; saying the same flow again does not. Turning a drip up is more of it.
        var repeat = definition.Repeat;
        var higher = previous is null
            || repeat is not { OnlyMoreAdds: true }
            || amount > previous.LargestAmount
            || (Role == TraineeRole.Doctor && order.Titration == Titration.Up);
        var share = previous is null ? 1 : repeat?.AgainShare ?? 0;
        var gain = higher ? effect.RiskSlowing * share : 0;
        if (gain != 0) _slowings.Add(new RiskSlowing(id, SimulatedMinutes + effect.OnsetMinutes, gain));

        var fx = (definition.Effect ?? VitalEffect.None).OverlaidWith(effect.Effect);
        if (id == "oxygen" && effect.OxygenSaturationGain is { } spo2Gain && spo2Gain != 0) fx = fx with { OxygenSaturation = spo2Gain };
        if (higher && share != 0 && fx.ChangesAnything)
        {
            var ramp = fx.RampMinutes is { } r && r != 0 ? r : DefaultRampMinutes;
            _modifiers.Add(new VitalModifier(
                id,
                SimulatedMinutes + 0.03,
                ramp,
                Scaled(fx.OxygenSaturation, share),
                Scaled(fx.HeartRate, share),
                Scaled(fx.RespiratoryRate, share),
                Scaled(fx.SystolicPressure, share),
                Scaled(fx.DiastolicPressure, share)));
            ExpectResponseTo(ramp);
        }

        if (id == "adrenaline" && Anaphylaxis is { IsTreated: false } reaction)
        {
            Anaphylaxis = reaction with { TreatedAt = SimulatedMinutes };
            After(0.15, () =>
            {
                Risk = Numbers.Clamp(Risk - 18, 0, 100);
                TakeCuffReading();
            });
        }

        if (id == "shock" && InVentricularTachycardia)
        {
            After(0.1, () =>
            {
                Risk = Case.Risk.Critical - 5;
                Stage = ClinicalStage.Urgent;
                InVentricularTachycardia = false;
                _cuffDueAt = 0;
                ReassessStage();
                RefreshMonitor();
                Raise(new RhythmRestored(SimulatedMinutes));
            });
        }
    }

    /// <summary>
    /// A harmful order reaches the patient. An order with no indication that carries no risk is only noted; any
    /// other raises the risk a moment later. A drug the patient is allergic to can start anaphylaxis, which
    /// leaves time to treat it: the risk it adds stops short of arrest.
    /// </summary>
    public void ApplyHarm(string actionId, string dose, HarmProfile profile, bool allergic)
    {
        ArgumentNullException.ThrowIfNull(profile);
        var definition = Catalog.Intervention(actionId) ?? throw new DomainException($"Unknown intervention '{actionId}'.");
        // Kept apart from the interventions done: a trap earns no step.
        _harmfulOrders.Add(actionId);
        if (allergic) AllergicReactionSeen = true;
        // Given too early it still works, and it cannot be given twice.
        if (profile.CountsAsDone)
        {
            _interventions[actionId] = new InterventionRecord(actionId, SimulatedMinutes, SimulatedMinutes, 1, dose, "early", 0, 0);
            if (profile.RiskSlowing != 0) _slowings.Add(new RiskSlowing(actionId, SimulatedMinutes + profile.OnsetMinutes, profile.RiskSlowing));
        }

        if (profile.OffCase && profile.Risk == 0)
        {
            _unneededOrders.Add(profile.Label ?? definition.ArabicName);
            return;
        }

        var label = allergic ? definition.ArabicName + " رغم الحساسية" : profile.Label ?? definition.ArabicName;
        var risk = allergic
            ? (profile.AllergyRisk != 0 ? profile.AllergyRisk : 18)
            : (profile.Risk != 0 ? profile.Risk : 12);
        _harms.Add(new HarmRecord(SimulatedMinutes, label, risk));
        var anaphylaxis = allergic && profile.CausesAnaphylaxis;
        After(0.3, () =>
        {
            Risk = Numbers.Clamp(Risk + risk, 0, anaphylaxis ? Math.Max(Risk, 88) : 100);
            if (anaphylaxis && Anaphylaxis is null) Anaphylaxis = new Anaphylaxis(SimulatedMinutes, null);
            TakeCuffReading();
            Raise(new PatientHarmed(SimulatedMinutes, actionId, label, risk));
        });
    }

    /// <summary>A step that needs no dose and has no effect of its own is noted as done (help was called).</summary>
    public void MarkDone(string actionId)
    {
        if (HasDone(actionId)) return;
        _interventions[actionId] = new InterventionRecord(actionId, SimulatedMinutes, SimulatedMinutes, 1, "", "good", 0, 0);
    }

    /// <summary>The nurse checks the temperature or reads the monitor herself.</summary>
    public void RecordBedsideCheck(string actionId)
    {
        var previous = RecordOf(actionId);
        _interventions[actionId] = previous is null
            ? new InterventionRecord(actionId, SimulatedMinutes, SimulatedMinutes, 1, "", "good", 0, 0)
            : previous with { Count = previous.Count + 1, LastAt = SimulatedMinutes };
        if (actionId == "temp") NoteTemperatureMeasured();
        else TakeCuffReading();
    }

    /// <summary>The nurse rejected a dose.</summary>
    public void RecordWrongDose() => WrongDoseCount++;

    /// <summary>The trainee obtained a history fact.</summary>
    public void RecordHistory(string findingId) => _historyObtained.Add(findingId);

    /// <summary>The trainee did an examination.</summary>
    public void RecordExamination(string findingId) => _examinationsDone.Add(findingId);

    /* ---------- tests ---------- */

    /// <summary>
    /// Orders a test. Its indication is judged at this moment: some tests are fine until the patient is in shock
    /// and dangerous after. A dangerous test costs the patient at once.
    /// </summary>
    public OrderedTest OrderTest(string testId, string reasonGrade)
    {
        if (_tests.TryGetValue(testId, out var have)) return have;
        var expected = Case.ResultFor(testId);
        // Some tests are fine until the patient crashes.
        var shocked = expected?.WhenShocked is not null && UntreatedSystolicPressure() < 90;
        var indication = shocked ? expected!.WhenShocked!.Value : expected?.Indication ?? TestIndication.NotIndicated;
        if (expected?.BeforeActionId is { } before && HasDone(before)) _lateTests.Add(testId);
        var test = new OrderedTest(testId, SimulatedMinutes, reasonGrade, indication);
        _tests[testId] = test;
        if (indication == TestIndication.Harmful) Risk = Numbers.Clamp(Risk + 6, 0, 100);
        Raise(new TestOrdered(SimulatedMinutes, testId, indication));
        return test;
    }

    /// <summary>Notes how the trainee read a result, or that a written justification was accepted.</summary>
    public void AnnotateTest(string testId, bool readWrongly, bool justificationAccepted)
    {
        if (!_tests.TryGetValue(testId, out var test)) throw new DomainException($"Test '{testId}' was not ordered.");
        _tests[testId] = test with { ReadWrongly = readWrongly, JustificationAccepted = justificationAccepted };
    }

    /* ---------- ending ---------- */

    /// <summary>
    /// The trainee hands the patient over. The patient is stable when the risk is below the first threshold and
    /// no key step is missing. A session that already ended (an arrest) is left as it is.
    /// </summary>
    public void HandOver()
    {
        if (IsOver) return;
        Outcome = Risk < Case.Risk.Watch && MissingKeySteps().Count == 0 ? SessionOutcome.Stable : SessionOutcome.Unstable;
        Close();
    }

    private void Arrest()
    {
        if (IsOver) return;
        Outcome = SessionOutcome.Arrest;
        Raise(new PatientArrested(SimulatedMinutes));
        Close();
    }

    private void Close()
    {
        IsOver = true;
        _riskHistory.Add(new RiskPoint(SimulatedMinutes, Risk));
    }

    private void After(double minutes, Action run) => _pending.Add((SimulatedMinutes + minutes, run));

    private void Raise(SessionEvent e) => _events.Add(e);

    private static double Scaled(double? value, double share) => value is { } v && v != 0 ? v * share : 0;
}
