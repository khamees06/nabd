using Nabd.Domain.Common;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;
using Nabd.Tests.Support;

namespace Nabd.Tests.Domain;

/// <summary>
/// The clinical rules, one at a time and in plain terms. The golden masters prove the model equals the legacy
/// code; these tests say what the rules are.
/// </summary>
public class SimulationSessionTests
{
    private static async Task<SimulationSession> StartAsync(string caseId, TraineeRole role = TraineeRole.Doctor) =>
        SimulationSession.Start(SessionId.New(), (await TestData.CaseRepository.FindAsync(caseId))!, await TestData.CaseRepository.GetCatalogAsync(), role);

    private static void Run(SimulationSession session, double seconds)
    {
        for (var i = 0; i < seconds * 10 && !session.IsOver; i++) session.Tick(0.1);
    }

    private static CareEffect EffectOf(SimulationSession session, string actionId)
    {
        var step = session.Case.CareFor(actionId)!;
        return new CareEffect(step.RiskSlowing, step.OnsetMinutes, step.OxygenSaturationGain, step.Effect);
    }

    [Fact]
    public async Task Untreated_risk_rises_at_the_rate_of_the_case()
    {
        var session = await StartAsync("sepsis"); // starts at 46, gains 3 per minute
        Run(session, 60);
        Assert.Equal(1, session.SimulatedMinutes, precision: 9);
        Assert.Equal(49, session.Risk, precision: 9);
        Assert.Equal(3, session.NetRiskRate());
    }

    [Fact]
    public async Task One_call_never_advances_more_than_two_seconds()
    {
        var session = await StartAsync("asthma");
        session.Tick(3600);
        Assert.Equal(2.0 / 60, session.SimulatedMinutes, precision: 12);
    }

    [Fact]
    public async Task The_stage_follows_the_risk_up_and_the_cuff_measures_when_the_patient_gets_sick()
    {
        var session = await StartAsync("sepsis"); // watch 56, urgent 70
        Assert.Equal(ClinicalStage.Calm, session.Stage);
        Run(session, 205); // 46 + 3 * 3.42 = 56.25
        Assert.Equal(ClinicalStage.Watch, session.Stage);
        Run(session, 280); // past 70
        Assert.Equal(ClinicalStage.Urgent, session.Stage);
        Assert.Contains(session.Events, e => e is StageChanged { Stage: ClinicalStage.Urgent, Improved: false });
        Assert.True(session.SimulatedMinutes - session.Cuff.TakenAt <= 1.0 + 1e-9, "once sick, the cuff cycles every minute");
    }

    [Fact]
    public async Task A_treatment_slows_the_risk_only_after_its_onset()
    {
        var session = await StartAsync("sepsis"); // oxygen: slows by 1.2 after 1 minute
        session.ApplyIntervention(new InterventionOrder("oxygen", "15 L/min", Amount: 15), EffectOf(session, "oxygen"));
        Assert.Equal(3, session.NetRiskRate());
        Run(session, 61);
        Assert.Equal(1.8, session.NetRiskRate(), precision: 9);
    }

    [Fact]
    public async Task Oxygen_raises_the_saturation_gradually_and_never_above_99()
    {
        var session = await StartAsync("sepsis");
        var before = session.CurrentVitals().OxygenSaturation;
        session.ApplyIntervention(new InterventionOrder("oxygen", "15 L/min", Amount: 15), EffectOf(session, "oxygen"));
        Assert.Equal(before, session.CurrentVitals().OxygenSaturation); // nothing yet at the moment of the order
        Run(session, 20);
        var after = session.CurrentVitals().OxygenSaturation;
        Assert.InRange(after, before + 4, 99);
    }

    [Fact]
    public async Task The_same_oxygen_flow_again_adds_nothing_and_a_higher_flow_adds_a_share()
    {
        var session = await StartAsync("asthma");
        session.ApplyIntervention(new InterventionOrder("oxygen", "6 L/min", Amount: 6), EffectOf(session, "oxygen"));
        session.ApplyIntervention(new InterventionOrder("oxygen", "6 L/min", Amount: 6), EffectOf(session, "oxygen"));
        Assert.Single(session.VitalModifiers);
        session.ApplyIntervention(new InterventionOrder("oxygen", "15 L/min", Amount: 15), EffectOf(session, "oxygen"));
        Assert.Equal(2, session.VitalModifiers.Count);
        Assert.Equal(session.VitalModifiers[0].OxygenSaturation * 0.3, session.VitalModifiers[1].OxygenSaturation, precision: 9);
        Assert.Equal(3, session.RecordOf("oxygen")!.Count);
    }

    [Fact]
    public async Task Supportive_care_holds_a_septic_patient_but_only_the_antibiotic_turns_him_round()
    {
        var session = await StartAsync("sepsis"); // hold at 58 until antibiotics
        session.ApplyIntervention(new InterventionOrder("oxygen", Amount: 15), EffectOf(session, "oxygen"));
        session.ApplyIntervention(new InterventionOrder("fluids", "500 mL", Amount: 500), EffectOf(session, "fluids"));
        Run(session, 300);
        Assert.True(session.Risk <= 58);
        Assert.Equal(0, session.NetRiskRate()); // would be negative, but the cause is untreated
        session.ApplyIntervention(new InterventionOrder("antibiotics"), EffectOf(session, "antibiotics"));
        Run(session, 300);
        Assert.True(session.NetRiskRate() < 0);
    }

    [Fact]
    public async Task Risk_never_falls_below_the_floor_of_the_resuscitation_room()
    {
        var session = await StartAsync("asthma");
        foreach (var step in session.Case.Care.Where(c => c.IsKey)) session.ApplyIntervention(new InterventionOrder(step.ActionId), EffectOf(session, step.ActionId));
        Run(session, 3000);
        Assert.True(session.Risk >= SimulationSession.RiskFloor);
    }

    [Fact]
    public async Task A_harm_raises_the_risk_a_moment_after_the_order_and_is_not_a_step_done()
    {
        var session = await StartAsync("asthma");
        var before = session.Risk;
        session.ApplyHarm("sedative", "", new HarmProfile("مهدئ", Risk: 16), allergic: false);
        Assert.Equal(before, session.Risk);
        Assert.False(session.HasDone("sedative"));
        Run(session, 19);
        Assert.True(session.Risk > before + 15);
        Assert.Contains("sedative", session.HarmfulOrders);
        Assert.Contains(session.Events, e => e is PatientHarmed { ActionId: "sedative", Risk: 16 });
    }

    [Fact]
    public async Task Anaphylaxis_stops_short_of_arrest_and_adrenaline_treats_it()
    {
        var session = await StartAsync("sepsis");
        session.ApplyHarm("antibiotics", "augmentin", new HarmProfile(null, AllergyRisk: 28, CausesAnaphylaxis: true), allergic: true);
        Run(session, 19);
        Assert.NotNull(session.Anaphylaxis);
        Assert.False(session.Anaphylaxis!.IsTreated);
        Assert.True(session.Risk <= 88);
        Assert.True(session.NetRiskRate() >= 3); // it does not settle on its own
        var atReaction = session.Risk;
        session.ApplyIntervention(new InterventionOrder("adrenaline", "0.5 mg IM"), CareEffect.None);
        Run(session, 10);
        Assert.True(session.Anaphylaxis.IsTreated);
        Assert.True(session.Risk < atReaction - 15);
    }

    [Fact]
    public async Task A_test_that_is_safe_at_first_becomes_harmful_once_the_pressure_has_fallen()
    {
        var early = await StartAsync("pe");
        Assert.Equal(TestIndication.Indicated, early.OrderTest("ctpa", "good").Indication);

        var late = await StartAsync("pe");
        while (late.UntreatedSystolicPressure() >= 90 && !late.IsOver) Run(late, 5);
        var risk = late.Risk;
        Assert.Equal(TestIndication.Harmful, late.OrderTest("ctpa", "good").Indication);
        Assert.Equal(Math.Min(100, risk + 6), late.Risk, precision: 9);
    }

    [Fact]
    public async Task Ordering_the_same_test_twice_keeps_the_first_order()
    {
        var session = await StartAsync("dka");
        var first = session.OrderTest("glucose", "good");
        Run(session, 30);
        Assert.Same(first, session.OrderTest("glucose", "weak"));
        Assert.Single(session.Tests);
    }

    [Fact]
    public async Task At_a_risk_of_100_the_patient_arrests_and_the_session_ends()
    {
        var session = await StartAsync("htn");
        Run(session, 3000);
        Assert.True(session.IsOver);
        Assert.Equal(SessionOutcome.Arrest, session.Outcome);
        Assert.Equal(100, session.Risk);
        Assert.IsType<PatientArrested>(session.Events[^1]);
        var minutes = session.SimulatedMinutes;
        session.Tick(1);
        Assert.Equal(minutes, session.SimulatedMinutes); // time stops with the session
    }

    [Fact]
    public async Task A_handover_is_stable_only_below_the_first_threshold_with_every_key_step_done()
    {
        var early = await StartAsync("asthma");
        early.HandOver();
        Assert.Equal(SessionOutcome.Unstable, early.Outcome); // key steps missing

        var treated = await StartAsync("asthma");
        foreach (var step in treated.Case.Care.Where(c => c.IsKey)) treated.ApplyIntervention(new InterventionOrder(step.ActionId), EffectOf(treated, step.ActionId));
        Run(treated, 300);
        treated.HandOver();
        Assert.Equal(SessionOutcome.Stable, treated.Outcome);
    }

    [Fact]
    public async Task A_dangerous_destination_fails_the_session_whatever_the_score()
    {
        var session = await StartAsync("asthma");
        foreach (var step in session.Case.Care.Where(c => c.IsKey)) session.ApplyIntervention(new InterventionOrder(step.ActionId), EffectOf(session, step.ActionId));
        Run(session, 300);
        session.OrderTest("peak_flow", "good");
        session.HandOver();
        var handover = new HandoverAssessment("home", DiagnosisGrade.Right, true, true, true, true, false, true);
        var score = SessionScorer.Score(session, handover, new CommunicationRecord(true, true, true, 0, 0));
        Assert.Equal(DestinationVerdict.Dangerous, score.Destination);
        Assert.Contains(FailureReason.DangerousDestination, SessionScorer.Judge(session, score, handover).Failures);
    }

    [Fact]
    public async Task An_order_for_something_the_catalog_does_not_have_is_a_domain_error()
    {
        var session = await StartAsync("asthma");
        Assert.Throws<DomainException>(() => session.ApplyIntervention(new InterventionOrder("leeches"), CareEffect.None));
        Assert.Throws<DomainException>(() => session.AnnotateTest("ecg", readWrongly: true, justificationAccepted: false));
    }
}
