using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Nabd.Application.Common;
using Nabd.Application.Simulation;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;
using Nabd.Infrastructure.Simulation;
using Nabd.Tests.Support;

namespace Nabd.Tests.Application;

/// <summary>The simulation use cases, run against the real cases and an in-memory session store.</summary>
public class SimulationUseCaseTests
{
    private readonly InMemorySimulationSessionStore _store = new(Options.Create(new SessionStoreOptions()), TimeProvider.System);

    private StartSimulationSession Start => new(TestData.CaseRepository, _store, NullLogger<StartSimulationSession>.Instance);

    private static readonly CommunicationRecord PoliteAndClear = new(Introduced: true, Explained: true, ShowedEmpathy: true, RudeRemarks: 0, JargonRemarks: 0);

    [Fact]
    public async Task A_session_starts_with_the_monitor_of_the_case_and_nothing_done()
    {
        var result = await Start.HandleAsync(new StartSimulationSessionCommand("sepsis", TraineeRole.Doctor));

        Assert.True(result.IsSuccess);
        var s = result.Value!;
        Assert.Equal("sepsis", s.CaseId);
        Assert.Equal(0, s.SimulatedMinutes);
        Assert.Equal(ClinicalStage.Calm, s.Stage);
        Assert.Equal((104, 60), (s.CuffSystolic, s.CuffDiastolic)); // the case's vital signs at its starting risk
        Assert.Null(s.Temperature); // not measured yet
        Assert.Empty(s.InterventionsDone);
        Assert.False(s.IsOver);
    }

    [Theory]
    [InlineData("", ErrorKind.Invalid)]
    [InlineData("no-such-case", ErrorKind.NotFound)]
    public async Task A_session_cannot_start_without_a_known_case(string caseId, ErrorKind expected)
    {
        var result = await Start.HandleAsync(new StartSimulationSessionCommand(caseId, TraineeRole.Doctor));
        Assert.Equal(expected, result.Error!.Kind);
    }

    [Theory]
    [InlineData("asthma")]
    [InlineData("sepsis")]
    [InlineData("pe")]
    [InlineData("stemi")]
    [InlineData("dka")]
    [InlineData("htn")]
    public async Task A_neglected_patient_arrests_at_the_minute_the_legacy_room_recorded(string caseId)
    {
        // The legacy trace of "nothing is done" ends in an arrest at a known simulated minute. The use cases, fed
        // the same clock steps, must end at exactly that minute.
        using var trace = JsonDocument.Parse(await File.ReadAllBytesAsync(Path.Combine(TestData.GoldenMasters("ErClinical"), $"neglect-{caseId}.json")));
        var legacyEnd = trace.RootElement.GetProperty("final").GetProperty("sim").GetDouble();

        var id = (await Start.HandleAsync(new StartSimulationSessionCommand(caseId, TraineeRole.Doctor))).Value!.SessionId;
        var advance = new AdvanceSimulation(_store);
        SessionSnapshot now;
        var guard = 0;
        do now = (await advance.HandleAsync(new AdvanceSimulationCommand(id, AdvanceSimulation.MaximumSeconds))).Value!;
        while (!now.IsOver && guard++ < 100);

        Assert.True(now.IsOver);
        Assert.Equal(SessionOutcome.Arrest, now.Outcome);
        Assert.Equal(ClinicalStage.Critical, now.Stage);
        Assert.True(legacyEnd == now.SimulatedMinutes, $"legacy arrest at {legacyEnd:R}, use cases at {now.SimulatedMinutes:R}");
    }

    [Fact]
    public async Task A_well_managed_case_is_handed_over_stable_and_passes()
    {
        var id = (await Start.HandleAsync(new StartSimulationSessionCommand("asthma", TraineeRole.Doctor))).Value!.SessionId;
        var advance = new AdvanceSimulation(_store);
        var give = new ExecuteIntervention(_store);
        var order = new RequestMedicalTest(_store);
        var clinicalCase = (await TestData.CaseRepository.FindAsync("asthma"))!;

        await advance.HandleAsync(new AdvanceSimulationCommand(id, 20));
        foreach (var step in clinicalCase.Care.Where(c => c.IsKey))
        {
            Assert.True((await give.HandleAsync(new ExecuteInterventionCommand(id, step.ActionId))).IsSuccess);
            await advance.HandleAsync(new AdvanceSimulationCommand(id, 10));
        }

        foreach (var test in clinicalCase.ExpectedResults.Where(r => r.Indication == TestIndication.Indicated))
        {
            Assert.True((await order.HandleAsync(new RequestMedicalTestCommand(id, test.TestId, "good"))).IsSuccess);
        }

        await advance.HandleAsync(new AdvanceSimulationCommand(id, 120));
        await advance.HandleAsync(new AdvanceSimulationCommand(id, 120));

        var handover = new HandoverAssessment(clinicalCase.Disposition.Right, DiagnosisGrade.Right, true, true, true, true, ClaimsTreatmentNotGiven: false, GradedByService: true);
        var redFlags = clinicalCase.Findings.Where(f => f.IsRedFlag).ToList();
        var complete = new CompleteSimulation(_store, NullLogger<CompleteSimulation>.Instance);
        var report = await complete.HandleAsync(new CompleteSimulationCommand(
            id, handover, PoliteAndClear,
            [.. redFlags.Where(f => !f.IsExamination).Select(f => f.Id)],
            [.. redFlags.Where(f => f.IsExamination).Select(f => f.Id)]));

        Assert.True(report.IsSuccess, report.Error?.Message);
        Assert.Equal(SessionOutcome.Stable, report.Value!.Snapshot.Outcome);
        Assert.Equal(100, report.Value.Score.Total);
        Assert.True(report.Value.Verdict.Passed);
        Assert.Empty(report.Value.Verdict.Failures);

        // The report can be read again, and a second completion is refused.
        var again = await new GenerateSessionReport(_store).HandleAsync(new GenerateSessionReportQuery(id));
        Assert.Equal(report.Value.Score.Total, again.Value!.Score.Total);
        Assert.Equal(ErrorKind.Conflict, (await complete.HandleAsync(new CompleteSimulationCommand(id, handover, PoliteAndClear))).Error!.Kind);
    }

    [Fact]
    public async Task Orders_are_refused_for_unknown_ids_and_after_the_session_has_ended()
    {
        var id = (await Start.HandleAsync(new StartSimulationSessionCommand("htn", TraineeRole.Doctor))).Value!.SessionId;
        var give = new ExecuteIntervention(_store);
        var order = new RequestMedicalTest(_store);

        Assert.Equal(ErrorKind.Invalid, (await give.HandleAsync(new ExecuteInterventionCommand(id, "leeches"))).Error!.Kind);
        Assert.Equal(ErrorKind.Invalid, (await give.HandleAsync(new ExecuteInterventionCommand(id, "oxygen", Amount: -1))).Error!.Kind);
        Assert.Equal(ErrorKind.Invalid, (await order.HandleAsync(new RequestMedicalTestCommand(id, "crystal-ball"))).Error!.Kind);
        Assert.Equal(ErrorKind.Invalid, (await order.HandleAsync(new RequestMedicalTestCommand(id, "ecg", "excellent"))).Error!.Kind);
        Assert.Equal(ErrorKind.NotFound, (await give.HandleAsync(new ExecuteInterventionCommand("not-a-session", "oxygen"))).Error!.Kind);
        Assert.Equal(ErrorKind.Invalid, (await new AdvanceSimulation(_store).HandleAsync(new AdvanceSimulationCommand(id, 5000))).Error!.Kind);

        var handover = new HandoverAssessment("icu", DiagnosisGrade.Close, true, false, true, false, false, false);
        Assert.True((await new CompleteSimulation(_store, NullLogger<CompleteSimulation>.Instance).HandleAsync(new CompleteSimulationCommand(id, handover, PoliteAndClear))).IsSuccess);
        Assert.Equal(ErrorKind.Conflict, (await give.HandleAsync(new ExecuteInterventionCommand(id, "oxygen"))).Error!.Kind);
        Assert.Equal(ErrorKind.Conflict, (await order.HandleAsync(new RequestMedicalTestCommand(id, "ecg"))).Error!.Kind);
    }

    [Fact]
    public async Task A_report_is_refused_until_the_session_is_completed()
    {
        var id = (await Start.HandleAsync(new StartSimulationSessionCommand("pe", TraineeRole.Doctor))).Value!.SessionId;
        var result = await new GenerateSessionReport(_store).HandleAsync(new GenerateSessionReportQuery(id));
        Assert.Equal(ErrorKind.Conflict, result.Error!.Kind);
    }

    [Fact]
    public async Task The_store_refuses_new_sessions_when_it_is_full_and_forgets_idle_ones()
    {
        var time = new ManualTime();
        var store = new InMemorySimulationSessionStore(Options.Create(new SessionStoreOptions { MaximumSessions = 2, IdleMinutes = 30 }), time);
        var start = new StartSimulationSession(TestData.CaseRepository, store, NullLogger<StartSimulationSession>.Instance);

        var first = await start.HandleAsync(new StartSimulationSessionCommand("asthma", TraineeRole.Doctor));
        Assert.True((await start.HandleAsync(new StartSimulationSessionCommand("asthma", TraineeRole.Nurse))).IsSuccess);
        Assert.Equal(ErrorKind.Unavailable, (await start.HandleAsync(new StartSimulationSessionCommand("asthma", TraineeRole.Doctor))).Error!.Kind);

        time.Advance(TimeSpan.FromMinutes(31));
        Assert.True((await start.HandleAsync(new StartSimulationSessionCommand("asthma", TraineeRole.Doctor))).IsSuccess);
        Assert.Equal(ErrorKind.NotFound, (await new AdvanceSimulation(store).HandleAsync(new AdvanceSimulationCommand(first.Value!.SessionId, 1))).Error!.Kind);
    }

    private sealed class ManualTime : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 11, 11, 9, 0, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => _now;

        public void Advance(TimeSpan by) => _now += by;
    }
}
