using Microsoft.Extensions.Logging;
using Nabd.Application.Abstractions.Data;
using Nabd.Application.Abstractions.Simulation;
using Nabd.Application.Common;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;

namespace Nabd.Application.Simulation;

/*
 * The server-side use cases of a simulation session. Each is one small class with one HandleAsync method:
 * it loads what it needs through a port, asks the domain model to do the work, and returns a view.
 * No clinical rule lives here.
 *
 * Status in this phase: these use cases are complete and tested, and the domain model under them reproduces the
 * legacy ER room exactly (golden masters). The browser-side room does not call them yet; it still runs the legacy
 * client engine. Moving the room onto them is the next migration step (docs/migration-map.md).
 */

/// <summary>Starts a session for a case.</summary>
/// <param name="CaseId">The case to play.</param>
/// <param name="Role">The trainee's role.</param>
public sealed record StartSimulationSessionCommand(string CaseId, TraineeRole Role);

/// <summary>Use case: start a simulation session.</summary>
public sealed class StartSimulationSession(IClinicalCaseRepository cases, ISimulationSessionStore sessions, ILogger<StartSimulationSession> logger)
{
    /// <summary>Starts the session and returns what the trainee sees at the start.</summary>
    public async Task<Result<SessionSnapshot>> HandleAsync(StartSimulationSessionCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (string.IsNullOrWhiteSpace(command.CaseId)) return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, "A case id is required.");
        var clinicalCase = await cases.FindAsync(command.CaseId, cancellationToken).ConfigureAwait(false);
        if (clinicalCase is null) return Result<SessionSnapshot>.Failure(ErrorKind.NotFound, "Unknown case.");
        var catalog = await cases.GetCatalogAsync(cancellationToken).ConfigureAwait(false);
        var session = SimulationSession.Start(SessionId.New(), clinicalCase, catalog, command.Role);
        if (!await sessions.TryAddAsync(new SessionEntry(session), cancellationToken).ConfigureAwait(false))
        {
            return Result<SessionSnapshot>.Failure(ErrorKind.Unavailable, "Too many sessions are running. Try again shortly.");
        }

        logger.LogInformation("Simulation session {SessionId} started for case {CaseId} as {Role}", session.Id, clinicalCase.Id, command.Role);
        return Result<SessionSnapshot>.Success(SessionSnapshot.Of(session));
    }
}

/// <summary>Moves a session forward in time.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="ElapsedSeconds">Real seconds that passed, at most <see cref="AdvanceSimulation.MaximumSeconds"/> per call.</param>
public sealed record AdvanceSimulationCommand(string SessionId, double ElapsedSeconds);

/// <summary>Use case: let simulated time pass.</summary>
public sealed class AdvanceSimulation(ISimulationSessionStore sessions)
{
    /// <summary>The longest stretch of time one call may cover.</summary>
    public const double MaximumSeconds = 120;

    /// <summary>The clock moves in steps of this many seconds, the pace at which the golden masters were recorded.</summary>
    public const double StepSeconds = 0.1;

    /// <summary>Advances the clock in small steps so that delayed effects and stage changes happen at their time.</summary>
    public async Task<Result<SessionSnapshot>> HandleAsync(AdvanceSimulationCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        if (double.IsNaN(command.ElapsedSeconds) || command.ElapsedSeconds < 0 || command.ElapsedSeconds > MaximumSeconds)
        {
            return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, $"Elapsed seconds must be between 0 and {MaximumSeconds}.");
        }

        var entry = await sessions.FindSessionAsync(command.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<SessionSnapshot>.Failure(ErrorKind.NotFound, "Unknown session.");
        lock (entry.Gate)
        {
            // Whole steps only; the rest is kept for the next call. (The small allowance is for floating point:
            // 0.3 / 0.1 is a hair under 3 and must still be three steps.)
            var total = entry.UnusedSeconds + command.ElapsedSeconds;
            var steps = (int)Math.Floor(total / StepSeconds + 1e-9);
            entry.UnusedSeconds = Math.Max(0, total - steps * StepSeconds);
            for (var i = 0; i < steps && !entry.Session.IsOver; i++) entry.Session.Tick(StepSeconds);
            return Result<SessionSnapshot>.Success(SessionSnapshot.Of(entry.Session));
        }
    }
}

/// <summary>Carries out an intervention the case plans for, or one that has no effect in this case.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="ActionId">The intervention, by its catalog id.</param>
/// <param name="Dose">The dose as it was said.</param>
/// <param name="Amount">The dose as a number in the intervention's base unit; 0 when it has none.</param>
/// <param name="Titration">Whether this changes a treatment that is already running.</param>
public sealed record ExecuteInterventionCommand(string SessionId, string ActionId, string Dose = "", double Amount = 0, Titration Titration = Titration.None);

/// <summary>Use case: carry out an intervention.</summary>
/// <remarks>
/// The effect comes from the case, never from the caller. Whether an order is unsafe (a wrong dose, an allergy, a
/// treatment given too early) is still decided by the legacy client in this phase; an order it judged harmful is
/// reported through <see cref="ReportHarmfulOrder"/>.
/// </remarks>
public sealed class ExecuteIntervention(ISimulationSessionStore sessions)
{
    /// <summary>Applies the intervention and returns the session as the trainee now sees it.</summary>
    public async Task<Result<SessionSnapshot>> HandleAsync(ExecuteInterventionCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var entry = await sessions.FindSessionAsync(command.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<SessionSnapshot>.Failure(ErrorKind.NotFound, "Unknown session.");
        lock (entry.Gate)
        {
            var session = entry.Session;
            if (session.IsOver) return Result<SessionSnapshot>.Failure(ErrorKind.Conflict, "The session has ended.");
            if (session.Catalog.Intervention(command.ActionId) is null) return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, "Unknown intervention.");
            if (!double.IsFinite(command.Amount) || command.Amount is < 0 or > 1_000_000) return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, "The amount is not valid.");
            var step = session.Case.CareFor(command.ActionId);
            var effect = step is null ? CareEffect.None : new CareEffect(step.RiskSlowing, step.OnsetMinutes, step.OxygenSaturationGain, step.Effect);
            session.ApplyIntervention(new InterventionOrder(command.ActionId, Text.Limit(command.Dose, 60), "good", command.Amount, command.Titration), effect);
            // Measuring the temperature makes it known. (The legacy room says so a moment later, as part of the
            // nurse's answer; here the measurement and its result are one step.)
            if (command.ActionId == "temp") session.NoteTemperatureMeasured();
            return Result<SessionSnapshot>.Success(SessionSnapshot.Of(session));
        }
    }
}

/// <summary>Reports an order that was judged harmful and given anyway.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="ActionId">The intervention, by its catalog id.</param>
/// <param name="Dose">The dose as it was said.</param>
/// <param name="Harm">What the harm does.</param>
/// <param name="Allergic">True when the patient is allergic to the drug.</param>
public sealed record ReportHarmfulOrderCommand(string SessionId, string ActionId, string Dose, HarmProfile Harm, bool Allergic);

/// <summary>Use case: a harmful order reaches the patient.</summary>
public sealed class ReportHarmfulOrder(ISimulationSessionStore sessions)
{
    /// <summary>Applies the harm and returns the session as the trainee now sees it.</summary>
    public async Task<Result<SessionSnapshot>> HandleAsync(ReportHarmfulOrderCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var entry = await sessions.FindSessionAsync(command.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<SessionSnapshot>.Failure(ErrorKind.NotFound, "Unknown session.");
        lock (entry.Gate)
        {
            var session = entry.Session;
            if (session.IsOver) return Result<SessionSnapshot>.Failure(ErrorKind.Conflict, "The session has ended.");
            if (session.Catalog.Intervention(command.ActionId) is null) return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, "Unknown intervention.");
            var harm = command.Harm;
            if (harm is null
                || !InRange(harm.Risk, 0, 100) || !InRange(harm.AllergyRisk, 0, 100)
                || !InRange(harm.RiskSlowing, 0, 20) || !InRange(harm.OnsetMinutes, 0, 60))
            {
                return Result<SessionSnapshot>.Failure(ErrorKind.Invalid, "The harm is not valid.");
            }

            session.ApplyHarm(command.ActionId, Text.Limit(command.Dose, 60), harm with { Label = harm.Label is null ? null : Text.Limit(harm.Label, 120) }, command.Allergic);
            return Result<SessionSnapshot>.Success(SessionSnapshot.Of(session));
        }
    }

    /// <summary>A finite number within the limits; "not a number" and infinity are never accepted.</summary>
    private static bool InRange(double value, double low, double high) => double.IsFinite(value) && value >= low && value <= high;
}

/// <summary>Orders a test.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="TestId">The test, by its catalog id.</param>
/// <param name="ReasonGrade">How the reason given with the order was judged: "good", "weak" or "ungraded".</param>
public sealed record RequestMedicalTestCommand(string SessionId, string TestId, string ReasonGrade = "ungraded");

/// <summary>What ordering a test returns. The indication is not part of it: the trainee learns it in the report.</summary>
/// <param name="TestId">The test.</param>
/// <param name="OrderedAtMinute">Simulated minute at which it was ordered.</param>
/// <param name="Session">The session as the trainee now sees it.</param>
public sealed record MedicalTestReceipt(string TestId, double OrderedAtMinute, SessionSnapshot Session);

/// <summary>Use case: order a medical test.</summary>
public sealed class RequestMedicalTest(ISimulationSessionStore sessions)
{
    private static readonly string[] ReasonGrades = ["good", "weak", "ungraded"];

    /// <summary>Orders the test. Ordering the same test again returns the first order.</summary>
    public async Task<Result<MedicalTestReceipt>> HandleAsync(RequestMedicalTestCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var entry = await sessions.FindSessionAsync(command.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<MedicalTestReceipt>.Failure(ErrorKind.NotFound, "Unknown session.");
        lock (entry.Gate)
        {
            var session = entry.Session;
            if (session.IsOver) return Result<MedicalTestReceipt>.Failure(ErrorKind.Conflict, "The session has ended.");
            if (session.Catalog.Test(command.TestId) is null) return Result<MedicalTestReceipt>.Failure(ErrorKind.Invalid, "Unknown test.");
            if (!ReasonGrades.Contains(command.ReasonGrade)) return Result<MedicalTestReceipt>.Failure(ErrorKind.Invalid, "Unknown reason grade.");
            var test = session.OrderTest(command.TestId, command.ReasonGrade);
            return Result<MedicalTestReceipt>.Success(new MedicalTestReceipt(test.TestId, test.AtMinute, SessionSnapshot.Of(session)));
        }
    }
}

/// <summary>Ends a session with the trainee's handover.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="Handover">The graded handover; null when the session already ended in an arrest.</param>
/// <param name="Communication">How the trainee communicated.</param>
/// <param name="HistoryObtained">History facts the trainee obtained, by finding id.</param>
/// <param name="ExaminationsDone">Examinations the trainee did, by finding id.</param>
/// <param name="RejectedDoses">How many doses the nurse had to reject.</param>
/// <param name="TestNotes">What happened to ordered tests afterwards: a result misread, a written justification accepted.</param>
public sealed record CompleteSimulationCommand(
    string SessionId,
    HandoverAssessment? Handover,
    CommunicationRecord Communication,
    IReadOnlyList<string>? HistoryObtained = null,
    IReadOnlyList<string>? ExaminationsDone = null,
    int RejectedDoses = 0,
    IReadOnlyList<TestNote>? TestNotes = null);

/// <summary>What happened to an ordered test after it was ordered.</summary>
/// <param name="TestId">The test.</param>
/// <param name="ReadWrongly">True when the trainee misread the result.</param>
/// <param name="JustificationAccepted">True when a written justification for a test outside the indication was accepted.</param>
public sealed record TestNote(string TestId, bool ReadWrongly = false, bool JustificationAccepted = false);

/// <summary>Use case: complete a simulation.</summary>
public sealed class CompleteSimulation(ISimulationSessionStore sessions, ILogger<CompleteSimulation> logger)
{
    private static readonly string[] Destinations = ["icu", "hdu", "cath", "ward", "home"];

    /// <summary>Hands the patient over, scores the session and returns its report.</summary>
    public async Task<Result<SessionReport>> HandleAsync(CompleteSimulationCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var entry = await sessions.FindSessionAsync(command.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<SessionReport>.Failure(ErrorKind.NotFound, "Unknown session.");
        if (command.Communication is null) return Result<SessionReport>.Failure(ErrorKind.Invalid, "The communication record is required.");
        if (command.Handover is not null && !Destinations.Contains(command.Handover.Destination)) return Result<SessionReport>.Failure(ErrorKind.Invalid, "Unknown destination.");
        if (command.RejectedDoses is < 0 or > 100) return Result<SessionReport>.Failure(ErrorKind.Invalid, "The number of rejected doses is not valid.");
        if ((command.HistoryObtained?.Count ?? 0) > 200 || (command.ExaminationsDone?.Count ?? 0) > 200 || (command.TestNotes?.Count ?? 0) > 100)
        {
            return Result<SessionReport>.Failure(ErrorKind.Invalid, "Too many items.");
        }

        lock (entry.Gate)
        {
            var session = entry.Session;
            if (session.Role != TraineeRole.Doctor) return Result<SessionReport>.Failure(ErrorKind.Invalid, "Only the doctor's room is scored on the server in this phase.");
            if (entry.Communication is not null) return Result<SessionReport>.Failure(ErrorKind.Conflict, "The session was already completed.");
            if (!session.IsOver && command.Handover is null) return Result<SessionReport>.Failure(ErrorKind.Invalid, "A handover is required while the patient is alive.");
            if ((command.TestNotes ?? []).Any(n => n is null || session.TestOf(n.TestId) is null)) return Result<SessionReport>.Failure(ErrorKind.Invalid, "A note names a test that was not ordered.");
            // Only findings the case has are kept: an id is never stored just because a caller sent it.
            var known = session.Case.Findings.Select(f => f.Id).ToHashSet(StringComparer.Ordinal);
            foreach (var id in (command.HistoryObtained ?? []).Where(known.Contains)) session.RecordHistory(id);
            foreach (var id in (command.ExaminationsDone ?? []).Where(known.Contains)) session.RecordExamination(id);
            for (var i = 0; i < command.RejectedDoses; i++) session.RecordWrongDose();
            foreach (var note in command.TestNotes ?? []) session.AnnotateTest(note.TestId, note.ReadWrongly, note.JustificationAccepted);
            // An arrest ended the session before any handover: the handover written afterwards does not count.
            var handover = session.IsOver ? null : command.Handover;
            session.HandOver();
            entry.Handover = handover;
            entry.Communication = command.Communication;
            var report = SessionReport.Of(session, handover, command.Communication);
            logger.LogInformation("Simulation session {SessionId} completed: {Outcome}, score {Score}, passed {Passed}", session.Id, session.Outcome, report.Score.Total, report.Verdict.Passed);
            return Result<SessionReport>.Success(report);
        }
    }
}

/// <summary>Asks for the report of a completed session.</summary>
/// <param name="SessionId">The session.</param>
public sealed record GenerateSessionReportQuery(string SessionId);

/// <summary>Use case: generate the report of a session.</summary>
public sealed class GenerateSessionReport(ISimulationSessionStore sessions)
{
    /// <summary>Returns the report of a session that was completed.</summary>
    public async Task<Result<SessionReport>> HandleAsync(GenerateSessionReportQuery query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        var entry = await sessions.FindSessionAsync(query.SessionId, cancellationToken).ConfigureAwait(false);
        if (entry is null) return Result<SessionReport>.Failure(ErrorKind.NotFound, "Unknown session.");
        lock (entry.Gate)
        {
            if (entry.Communication is null) return Result<SessionReport>.Failure(ErrorKind.Conflict, "The session has not been completed.");
            return Result<SessionReport>.Success(SessionReport.Of(entry.Session, entry.Handover, entry.Communication));
        }
    }
}

/// <summary>Limits on what a caller may send.</summary>
internal static class Text
{
    public static string Limit(string? text, int length) => text is null ? "" : text.Length <= length ? text : text[..length];
}

/// <summary>Shared lookup: a session by the id the client sent.</summary>
internal static class SessionStoreExtensions
{
    public static async Task<SessionEntry?> FindSessionAsync(this ISimulationSessionStore sessions, string? id, CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(id, "N", out var guid)) return null;
        return await sessions.FindAsync(new SessionId(guid), cancellationToken).ConfigureAwait(false);
    }
}
