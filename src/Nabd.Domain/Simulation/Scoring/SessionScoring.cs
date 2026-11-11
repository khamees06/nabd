using Nabd.Domain.Common;

namespace Nabd.Domain.Simulation.Scoring;

/// <summary>What the trainee wrote at handover, already graded.</summary>
/// <param name="Destination">Where the trainee sends the patient (icu, hdu, cath, ward, home).</param>
/// <param name="Diagnosis">How the stated diagnosis was graded.</param>
/// <param name="StatesSituation">The handover states the situation.</param>
/// <param name="GivesBackground">The handover gives the background.</param>
/// <param name="GivesAssessment">The handover gives an assessment with numbers.</param>
/// <param name="MakesRecommendation">The handover makes a recommendation.</param>
/// <param name="ClaimsTreatmentNotGiven">The handover claims a treatment nobody gave.</param>
/// <param name="GradedByService">True when the understanding service graded it; false when it was matched by word.</param>
public sealed record HandoverAssessment(
    string Destination,
    DiagnosisGrade Diagnosis,
    bool StatesSituation,
    bool GivesBackground,
    bool GivesAssessment,
    bool MakesRecommendation,
    bool ClaimsTreatmentNotGiven,
    bool GradedByService);

/// <summary>How the stated diagnosis compares with the case.</summary>
public enum DiagnosisGrade
{
    /// <summary>Not the diagnosis.</summary>
    Wrong = 0,

    /// <summary>Near it.</summary>
    Close = 1,

    /// <summary>The diagnosis.</summary>
    Right = 2,
}

/// <summary>How the trainee spoke with the patient and the relative.</summary>
/// <param name="Introduced">Introduced themself.</param>
/// <param name="Explained">Explained what was being done.</param>
/// <param name="ShowedEmpathy">Showed empathy.</param>
/// <param name="RudeRemarks">Number of rude remarks.</param>
/// <param name="JargonRemarks">Number of times jargon was used with the patient or the relative.</param>
public sealed record CommunicationRecord(bool Introduced, bool Explained, bool ShowedEmpathy, int RudeRemarks, int JargonRemarks);

/// <summary>Whether the chosen destination is right for the patient.</summary>
public enum DestinationVerdict
{
    /// <summary>Not the right place, but not unsafe.</summary>
    Wrong = 0,

    /// <summary>The right place.</summary>
    Right = 1,

    /// <summary>An unsafe place for this patient.</summary>
    Dangerous = 2,
}

/// <summary>Whether a time-critical step or test happened, and when.</summary>
public enum TimelinessState
{
    /// <summary>Never happened.</summary>
    Missed = 0,

    /// <summary>Happened after its time.</summary>
    Late = 1,

    /// <summary>Happened in time.</summary>
    OnTime = 2,
}

/// <summary>One time-critical step or test in the safety score.</summary>
/// <param name="Id">The intervention or test.</param>
/// <param name="State">Whether and when it happened.</param>
/// <param name="AtMinute">Simulated minute at which it happened; null when missed.</param>
public sealed record SafetyItem(string Id, TimelinessState State, double? AtMinute);

/// <summary>The score of a doctor-role session, out of 100, in its six parts.</summary>
/// <param name="Total">The whole score, rounded.</param>
/// <param name="Safety">Patient safety, 0 to 40.</param>
/// <param name="Diagnosis">Diagnosis, 0 to 15.</param>
/// <param name="Tests">Use of tests, 0 to 15.</param>
/// <param name="History">History and examination, 0 to 10.</param>
/// <param name="Communication">Communication, 0 to 10.</param>
/// <param name="Handover">Handover, 0 to 10.</param>
/// <param name="SafetyItems">The time-critical steps and tests behind the safety part.</param>
/// <param name="MissedTests">Indicated tests that were never ordered.</param>
/// <param name="Destination">The verdict on the destination; null when there was no handover.</param>
public sealed record SessionScore(
    double Total,
    double Safety,
    double Diagnosis,
    double Tests,
    double History,
    double Communication,
    double Handover,
    IReadOnlyList<SafetyItem> SafetyItems,
    IReadOnlyList<string> MissedTests,
    DestinationVerdict? Destination);

/// <summary>A reason a session is failed whatever its score: a score cannot buy back a harmed patient.</summary>
public enum FailureReason
{
    /// <summary>The patient arrested.</summary>
    CardiacArrest,

    /// <summary>The patient was sent somewhere unsafe.</summary>
    DangerousDestination,

    /// <summary>A serious harm reached the patient.</summary>
    PatientHarmed,

    /// <summary>A time-critical step never happened.</summary>
    KeyStepMissed,

    /// <summary>The ventricular tachycardia was left untreated.</summary>
    VentricularTachycardiaUntreated,

    /// <summary>The collapse was left without its rescue treatment.</summary>
    CollapseUntreated,

    /// <summary>The anaphylaxis was left untreated.</summary>
    AnaphylaxisUntreated,

    /// <summary>No test was ordered at all.</summary>
    NoTestOrdered,

    /// <summary>The diagnosis was graded wrong by the understanding service.</summary>
    WrongDiagnosis,
}

/// <summary>Whether the session is passed, and if not, why.</summary>
/// <param name="Passed">True when the score reaches 70 and nothing fails the session outright.</param>
/// <param name="Failures">The reasons that fail it outright.</param>
public sealed record SessionVerdict(bool Passed, IReadOnlyList<FailureReason> Failures);

/// <summary>
/// Scores a finished doctor-role session. The rules are the legacy ones (er.js: score, dispoCheck, fell and the
/// failure list in conclude), kept number for number.
/// </summary>
public static class SessionScorer
{
    /// <summary>The score needed to pass.</summary>
    public const double PassMark = 70;

    /// <summary>Whether a destination is right for the patient as the session left them.</summary>
    public static DestinationVerdict JudgeDestination(SimulationSession session, string destination)
    {
        ArgumentNullException.ThrowIfNull(session);
        var rule = session.Case.Disposition;
        if (rule.Dangerous.Contains(destination)) return DestinationVerdict.Dangerous;
        var right = session.HasCollapsed ? session.Case.Collapse!.Destination : rule.Right;
        return destination == right || (!session.HasCollapsed && rule.AlsoAcceptable.Contains(destination))
            ? DestinationVerdict.Right
            : DestinationVerdict.Wrong;
    }

    /// <summary>Scores the session. <paramref name="handover"/> is null when the patient arrested before any handover.</summary>
    public static SessionScore Score(SimulationSession session, HandoverAssessment? handover, CommunicationRecord communication)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(communication);
        var c = session.Case;

        var safety = new List<SafetyItem>();
        foreach (var step in c.Care.Where(s => s.IsKey))
        {
            var done = session.RecordSatisfying(step.ActionId);
            safety.Add(new SafetyItem(step.ActionId, done is null ? TimelinessState.Missed : InTime(done.FirstAt, step.DueByMinute), done?.FirstAt));
        }

        foreach (var expected in c.ExpectedResults.Where(r => r.DueByMinute is not null and not 0))
        {
            var test = session.TestOf(expected.TestId);
            safety.Add(new SafetyItem(expected.TestId, test is null ? TimelinessState.Missed : InTime(test.AtMinute, expected.DueByMinute), test?.AtMinute));
        }

        var per = 40.0 / Math.Max(1, safety.Count);
        DestinationVerdict? place = handover is null ? null : JudgeDestination(session, handover.Destination);
        double safe = 0;
        foreach (var item in safety) safe += item.State == TimelinessState.OnTime ? per : item.State == TimelinessState.Late ? per / 2 : 0;
        safe = safe - session.Harms.Count * 10 - Math.Min(9, session.WrongDoseCount * 3) - session.UnneededOrders.Count * 2 - (place == DestinationVerdict.Dangerous ? 10 : 0);
        if (session.Outcome == SessionOutcome.Arrest) safe = Math.Min(safe, 10);
        safe = Numbers.Clamp(safe, 0, 40);

        double dx = handover is null ? 0 : handover.Diagnosis == DiagnosisGrade.Right ? 15 : handover.Diagnosis == DiagnosisGrade.Close ? 8 : 0;

        double tests = 15;
        foreach (var t in session.Tests)
        {
            // An accepted written justification takes back the penalty for a test outside the indication; a harmful test stays.
            tests -= t.Indication == TestIndication.Harmful ? 6 : t.Indication == TestIndication.NotIndicated ? (t.JustificationAccepted ? 0 : 3) : 0;
            if (t.ReasonGrade is not ("good" or "ungraded") && t.Indication != TestIndication.NotIndicated && t.Indication != TestIndication.Harmful) tests -= 1.5;
            if (t.ReadWrongly) tests -= 2;
        }

        // Staying out of the scanner in shock is the right call, not a missed test.
        var missed = c.ExpectedResults
            .Where(r => r.Indication == TestIndication.Indicated && session.TestOf(r.TestId) is null && !(r.WhenShocked is not null && session.HasCollapsed))
            .Select(r => r.TestId)
            .ToList();
        tests = Numbers.Clamp(tests - missed.Count * 3, 0, 15);

        var reds = c.Findings.Where(f => f.IsRedFlag).ToList();
        var got = reds.Count(f => session.HistoryObtained.Contains(f.Id) || session.ExaminationsDone.Contains(f.Id));
        var history = reds.Count > 0 ? 10.0 * got / reds.Count : 10;

        var comm = Numbers.Clamp(
            (communication.Introduced ? 2 : 0) + (communication.Explained ? 4 : 0) + (communication.ShowedEmpathy ? 2 : 0)
            + (communication.RudeRemarks != 0 ? 0 : 2) - communication.JargonRemarks,
            0,
            10);

        var hand = handover is null
            ? 0
            : Numbers.Clamp(
                (handover.StatesSituation ? 1.5 : 0) + (handover.GivesBackground ? 1.5 : 0) + (handover.GivesAssessment ? 1.5 : 0)
                + (handover.MakesRecommendation ? 1.5 : 0) + (place == DestinationVerdict.Right ? 4 : 0) - (handover.ClaimsTreatmentNotGiven ? 3 : 0),
                0,
                10);

        var total = Numbers.Round(safe + dx + tests + history + comm + hand);
        return new SessionScore(total, safe, dx, tests, history, comm, hand, safety, missed, place);
    }

    /// <summary>Whether the session is passed. Some events fail it whatever the score.</summary>
    public static SessionVerdict Judge(SimulationSession session, SessionScore score, HandoverAssessment? handover)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(score);
        var fails = new List<FailureReason>();
        if (session.Outcome == SessionOutcome.Arrest) fails.Add(FailureReason.CardiacArrest);
        if (score.Destination == DestinationVerdict.Dangerous) fails.Add(FailureReason.DangerousDestination);
        if (session.Harms.Any(h => h.Risk >= 8)) fails.Add(FailureReason.PatientHarmed);
        if (score.SafetyItems.Any(i => i.State == TimelinessState.Missed)) fails.Add(FailureReason.KeyStepMissed);
        if (handover is not null)
        {
            if (session.InVentricularTachycardia) fails.Add(FailureReason.VentricularTachycardiaUntreated);
            if (session.HasCollapsed && !session.HasDone(session.Case.Collapse!.RescueActionId)) fails.Add(FailureReason.CollapseUntreated);
            if (session.Anaphylaxis is { IsTreated: false }) fails.Add(FailureReason.AnaphylaxisUntreated);
            if (session.Tests.Count == 0) fails.Add(FailureReason.NoTestOrdered);
            // Without the service the diagnosis is matched by word, which is too blunt to fail anyone on.
            if (handover.Diagnosis == DiagnosisGrade.Wrong && handover.GradedByService) fails.Add(FailureReason.WrongDiagnosis);
        }

        return new SessionVerdict(score.Total >= PassMark && fails.Count == 0, fails);
    }

    private static TimelinessState InTime(double at, double? dueBy) =>
        dueBy is { } by && at <= by ? TimelinessState.OnTime : TimelinessState.Late;
}
