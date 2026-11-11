using Nabd.Domain.Common;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;

namespace Nabd.Application.Simulation;

/// <summary>
/// What a trainee may see of a running session: what the bedside monitor and the room show. The patient's risk,
/// the rate at which it moves and the rules behind them never leave the server.
/// </summary>
/// <param name="SessionId">The session.</param>
/// <param name="CaseId">The case being played.</param>
/// <param name="Role">The trainee's role.</param>
/// <param name="SimulatedMinutes">Simulated minutes since the case began.</param>
/// <param name="Stage">How sick the patient is, as announced in the room.</param>
/// <param name="HeartRate">Heart rate on the monitor.</param>
/// <param name="RespiratoryRate">Respiratory rate on the monitor.</param>
/// <param name="OxygenSaturation">SpO2 on the monitor.</param>
/// <param name="CuffSystolic">Systolic pressure of the latest cuff reading.</param>
/// <param name="CuffDiastolic">Diastolic pressure of the latest cuff reading.</param>
/// <param name="CuffTakenAtMinute">Simulated minute of the latest cuff reading.</param>
/// <param name="Temperature">Body temperature, once it has been measured; null before.</param>
/// <param name="InVentricularTachycardia">True while the monitor shows ventricular tachycardia.</param>
/// <param name="InterventionsDone">Interventions carried out, by catalog id, in order.</param>
/// <param name="TestsOrdered">Tests ordered, by catalog id, in order.</param>
/// <param name="IsOver">True once the session has ended.</param>
/// <param name="Outcome">How it ended; null while it runs.</param>
public sealed record SessionSnapshot(
    string SessionId,
    string CaseId,
    TraineeRole Role,
    double SimulatedMinutes,
    ClinicalStage Stage,
    int HeartRate,
    int RespiratoryRate,
    int OxygenSaturation,
    int CuffSystolic,
    int CuffDiastolic,
    double CuffTakenAtMinute,
    double? Temperature,
    bool InVentricularTachycardia,
    IReadOnlyList<string> InterventionsDone,
    IReadOnlyList<string> TestsOrdered,
    bool IsOver,
    SessionOutcome? Outcome)
{
    /// <summary>Builds the snapshot of a session as it is now.</summary>
    public static SessionSnapshot Of(SimulationSession session)
    {
        ArgumentNullException.ThrowIfNull(session);
        var v = session.CurrentVitals();
        return new SessionSnapshot(
            session.Id.ToString(),
            session.Case.Id,
            session.Role,
            session.SimulatedMinutes,
            session.Stage,
            (int)Math.Floor(v.HeartRate + 0.5),
            (int)Math.Floor(v.RespiratoryRate + 0.5),
            (int)Math.Floor(Math.Clamp(v.OxygenSaturation, 40, 100) + 0.5),
            (int)session.Cuff.Systolic,
            (int)session.Cuff.Diastolic,
            session.Cuff.TakenAt,
            session.TemperatureKnown ? session.Case.Temperature : null,
            session.InVentricularTachycardia,
            [.. session.Interventions.Select(i => i.ActionId)],
            [.. session.Tests.Select(t => t.TestId)],
            session.IsOver,
            session.Outcome);
    }
}

/// <summary>The report of a finished doctor-role session.</summary>
/// <param name="Snapshot">The session as it ended.</param>
/// <param name="Score">The score in its six parts.</param>
/// <param name="Verdict">Passed or failed, and why.</param>
/// <param name="Harms">Harms that reached the patient, by their report label.</param>
/// <param name="UnneededOrders">Orders with no indication that changed nothing.</param>
/// <param name="WrongDoseCount">Doses the nurse had to reject.</param>
/// <param name="RiskCurve">The risk curve of the session, for the report's chart.</param>
public sealed record SessionReport(
    SessionSnapshot Snapshot,
    SessionScore Score,
    SessionVerdict Verdict,
    IReadOnlyList<string> Harms,
    IReadOnlyList<string> UnneededOrders,
    int WrongDoseCount,
    IReadOnlyList<RiskPoint> RiskCurve)
{
    /// <summary>Builds the report of a finished session.</summary>
    public static SessionReport Of(SimulationSession session, HandoverAssessment? handover, CommunicationRecord communication)
    {
        ArgumentNullException.ThrowIfNull(session);
        if (!session.IsOver) throw new DomainException("A report is written once the session has ended.");
        var score = SessionScorer.Score(session, handover, communication);
        return new SessionReport(
            SessionSnapshot.Of(session),
            score,
            SessionScorer.Judge(session, score, handover),
            [.. session.Harms.Select(h => h.Label)],
            session.UnneededOrders,
            session.WrongDoseCount,
            session.RiskHistory);
    }
}
