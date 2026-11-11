using System.Globalization;
using System.Text.Json;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;
using Nabd.Tests.Support;

namespace Nabd.Tests.GoldenMasters;

/// <summary>
/// Golden-master tests of the clinical core. Each trace was recorded from the legacy er.js
/// (tests/legacy-baseline/record-er-clinical.js): the inputs the clinical core received, in order, and the state
/// after them. The domain model replays the inputs and must be in the same state after every step, to the last
/// bit of every number, and must give the same score and verdict at the end.
/// </summary>
public class ErClinicalTraceTests
{
    public static TheoryData<string> Traces()
    {
        var data = new TheoryData<string>();
        foreach (var file in Directory.EnumerateFiles(TestData.GoldenMasters("ErClinical"), "*.json").Order(StringComparer.Ordinal))
        {
            data.Add(Path.GetFileNameWithoutExtension(file));
        }

        return data;
    }

    [Fact]
    public void The_recorded_traces_are_present()
    {
        // 6 cases x 7 scenario families + 3 rescue scenarios. A missing file would silently shrink the theory below.
        Assert.Equal(45, Traces().Count);
    }

    [Theory]
    [MemberData(nameof(Traces))]
    public async Task Domain_model_reproduces_the_legacy_trace(string scenario)
    {
        using var trace = JsonDocument.Parse(await File.ReadAllBytesAsync(Path.Combine(TestData.GoldenMasters("ErClinical"), scenario + ".json")));
        var root = trace.RootElement;
        var clinicalCase = await TestData.CaseRepository.FindAsync(root.GetProperty("case").GetString()!);
        Assert.NotNull(clinicalCase);
        var catalog = await TestData.CaseRepository.GetCatalogAsync();
        var role = root.GetProperty("role").GetString() == "nurse" ? TraineeRole.Nurse : TraineeRole.Doctor;

        var session = SimulationSession.Start(SessionId.New(), clinicalCase, catalog, role);
        AssertState(session, root.GetProperty("start"), "start");

        var index = 0;
        foreach (var step in root.GetProperty("steps").EnumerateArray())
        {
            var where = $"step {index++} ({step.GetProperty("t").GetString()})";
            switch (step.GetProperty("t").GetString())
            {
                case "ticks":
                    var dt = step.GetProperty("dt").GetDouble();
                    for (var n = step.GetProperty("n").GetInt32(); n > 0; n--) session.Tick(dt);
                    break;
                case "tick":
                    // The legacy tick handled inputs at two points: while its due jobs ran, and after the stage check.
                    session.BeginTick(step.GetProperty("dt").GetDouble());
                    foreach (var input in step.GetProperty("pre").EnumerateArray()) Apply(session, input);
                    session.ReassessStage();
                    foreach (var input in step.GetProperty("post").EnumerateArray()) Apply(session, input);
                    session.EndTick();
                    foreach (var input in step.GetProperty("post").EnumerateArray()) AssertConcluded(session, input, where);
                    break;
                case "in":
                    foreach (var input in step.GetProperty("evs").EnumerateArray())
                    {
                        Apply(session, input);
                        AssertConcluded(session, input, where);
                    }

                    break;
                default:
                    Assert.Fail($"{where}: unknown step type");
                    break;
            }

            AssertState(session, step.GetProperty("s"), where);
            if (step.TryGetProperty("x", out var x)) AssertDetail(session, x, where);
        }

        AssertFinal(session, root.GetProperty("final"));
    }

    /* ---------- applying one recorded input ---------- */

    private static void Apply(SimulationSession session, JsonElement input)
    {
        switch (input.GetProperty("t").GetString())
        {
            case "give":
                var def = input.GetProperty("def");
                var titration = input.GetProperty("titr").ValueKind == JsonValueKind.String
                    ? (input.GetProperty("titr").GetString() == "up" ? Titration.Up : Titration.Down)
                    : Titration.None;
                var spo2 = def.GetProperty("spo2").GetDouble();
                session.ApplyIntervention(
                    new InterventionOrder(Text(input, "id"), Text(input, "dose"), Text(input, "ok"), input.GetProperty("amt").GetDouble(), titration),
                    new CareEffect(def.GetProperty("slow").GetDouble(), def.GetProperty("onset").GetDouble(), spo2 == 0 ? null : spo2, Effect(def.GetProperty("fx"))));
                break;
            case "harm":
                var harm = input.GetProperty("def");
                session.ApplyHarm(
                    Text(input, "id"),
                    Text(input, "dose"),
                    new HarmProfile(
                        harm.GetProperty("label").GetString(), harm.GetProperty("risk").GetDouble(), harm.GetProperty("counts").GetBoolean(),
                        harm.GetProperty("slow").GetDouble(), harm.GetProperty("onset").GetDouble(), harm.GetProperty("off").GetBoolean(),
                        harm.GetProperty("allergyRisk").GetDouble(), harm.GetProperty("anaphylaxis").GetBoolean()),
                    input.GetProperty("allergic").GetBoolean());
                break;
            case "test":
                session.OrderTest(Text(input, "id"), Text(input, "reasonOk"));
                break;
            case "mark":
                session.MarkDone(Text(input, "id"));
                break;
            case "check":
                session.RecordBedsideCheck(Text(input, "id"));
                break;
            case "temp":
                session.NoteTemperatureMeasured();
                break;
            case "cuff":
                // The nurse's reading after a treatment. The model takes it by itself; the recorded input is not
                // replayed, so the state comparison after this step proves the model took it at the same moment.
                break;
            case "wrongDose":
                session.RecordWrongDose();
                break;
            case "fact":
                session.RecordHistory(Text(input, "id"));
                break;
            case "exam":
                session.RecordExamination(Text(input, "id"));
                break;
            case "conclude":
                // A handover ends the session here; an arrest (end: null) is the model's own doing and is only checked.
                if (input.GetProperty("end").ValueKind == JsonValueKind.Object) session.HandOver();
                break;
            default:
                Assert.Fail($"unknown input type '{input.GetProperty("t").GetString()}'");
                break;
        }
    }

    private static void AssertConcluded(SimulationSession session, JsonElement input, string where)
    {
        if (input.GetProperty("t").GetString() == "conclude") Assert.True(session.IsOver, $"{where}: the legacy session ended here, the model's did not");
    }

    private static VitalEffect? Effect(JsonElement fx)
    {
        if (fx.ValueKind != JsonValueKind.Object) return null;
        double? N(string name) => fx.TryGetProperty(name, out var v) ? v.GetDouble() : null;
        return new VitalEffect(N("spo2"), N("hr"), N("rr"), N("sbp"), N("dbp"), N("ramp"));
    }

    private static string Text(JsonElement owner, string name) => owner.GetProperty(name).GetString() ?? "";

    /* ---------- comparing the state ---------- */

    private static readonly string[] StateFields =
        ["sim", "risk", "stage", "topStage", "vt", "bpSys", "bpDia", "hr", "sbp", "dbp", "rr", "spo2", "netRate"];

    private static void AssertState(SimulationSession session, JsonElement expected, string where)
    {
        var v = session.CurrentVitals();
        double[] actual =
        [
            session.SimulatedMinutes, session.Risk, (int)session.Stage, (int)session.HighestStage, session.InVentricularTachycardia ? 1 : 0,
            session.Cuff.Systolic, session.Cuff.Diastolic, v.HeartRate, v.SystolicPressure, v.DiastolicPressure, v.RespiratoryRate, v.OxygenSaturation,
            session.NetRiskRate(),
        ];
        var i = 0;
        foreach (var value in expected.EnumerateArray())
        {
            var want = value.GetDouble();
            // Exact equality on purpose: the model is a line-for-line port and must not drift by a single bit.
            Assert.True(want == actual[i], $"{where}: {StateFields[i]} legacy={want.ToString("R", CultureInfo.InvariantCulture)} model={actual[i].ToString("R", CultureInfo.InvariantCulture)}");
            i++;
        }

        Assert.Equal(StateFields.Length, i);
    }

    private static void AssertDetail(SimulationSession session, JsonElement x, string where)
    {
        var done = x.GetProperty("done").EnumerateArray().Select(d => (d[0].GetString(), d[1].GetDouble(), d[2].GetDouble(), d[3].GetInt32(), d[4].GetString(), d[5].GetDouble(), d[6].GetDouble())).ToList();
        var mine = session.Interventions.Select(r => ((string?)r.ActionId, r.FirstAt, r.LastAt, r.Count, (string?)r.Grade, r.TotalAmount, r.LargestAmount)).ToList();
        Assert.True(done.SequenceEqual(mine), $"{where}: interventions done differ\n legacy: {string.Join(" ", done)}\n model:  {string.Join(" ", mine)}");

        Assert.True(x.GetProperty("harmed").EnumerateArray().Select(h => h.GetString()).ToHashSet().SetEquals(session.HarmfulOrders), $"{where}: harmful orders differ");
        var harms = x.GetProperty("harms").EnumerateArray().Select(h => (h[0].GetDouble(), h[1].GetDouble())).ToList();
        Assert.True(harms.SequenceEqual(session.Harms.Select(h => (h.AtMinute, h.Risk))), $"{where}: harms differ");
        Assert.True(x.GetProperty("unneeded").GetInt32() == session.UnneededOrders.Count, $"{where}: unneeded orders differ");
        Assert.True(x.GetProperty("lateTests").GetInt32() == session.LateTests.Count, $"{where}: late tests differ");
        Assert.True(x.GetProperty("wrongDoses").GetInt32() == session.WrongDoseCount, $"{where}: wrong doses differ");

        var tests = x.GetProperty("tests").EnumerateArray().Select(t => (t[0].GetString(), t[1].GetDouble(), t[2].GetString())).ToList();
        var myTests = session.Tests.Select(t => ((string?)t.TestId, t.AtMinute, (string?)IndicationName(t.Indication))).ToList();
        Assert.True(tests.SequenceEqual(myTests), $"{where}: tests differ\n legacy: {string.Join(" ", tests)}\n model:  {string.Join(" ", myTests)}");

        var effects = x.GetProperty("effects").EnumerateArray().Select(e => (e[0].GetString(), e[1].GetDouble(), e[2].GetDouble())).ToList();
        var mySlowings = session.RiskSlowings.Select(e => ((string?)e.ActionId, e.FromMinute, e.PointsPerMinute)).ToList();
        Assert.True(effects.SequenceEqual(mySlowings), $"{where}: risk slowings differ\n legacy: {string.Join(" ", effects)}\n model:  {string.Join(" ", mySlowings)}");
        Assert.True(x.GetProperty("mods").GetInt32() == session.VitalModifiers.Count, $"{where}: vital modifiers differ");

        var anaphylaxis = session.Anaphylaxis is null ? 0 : session.Anaphylaxis.IsTreated ? 2 : 1;
        Assert.True(x.GetProperty("anaph").GetInt32() == anaphylaxis, $"{where}: anaphylaxis state differs");
        Assert.True(x.GetProperty("temp").GetBoolean() == session.TemperatureKnown, $"{where}: temperature known differs");
        Assert.True(x.GetProperty("over").GetBoolean() == session.IsOver, $"{where}: over differs");
        Assert.True(x.GetProperty("outcome").GetString() == OutcomeName(session.Outcome), $"{where}: outcome differs");
    }

    private static void AssertFinal(SimulationSession session, JsonElement final)
    {
        Assert.Empty(final.GetProperty("errors").EnumerateArray());
        Assert.Equal(final.GetProperty("over").GetBoolean(), session.IsOver);
        Assert.Equal(final.GetProperty("outcome").GetString(), OutcomeName(session.Outcome));
        Assert.True(final.GetProperty("sim").GetDouble() == session.SimulatedMinutes, "final simulated time differs");
        Assert.True(final.GetProperty("risk").GetDouble() == session.Risk, "final risk differs");
        Assert.Equal(final.GetProperty("topStage").GetInt32(), (int)session.HighestStage);
        Assert.Equal(final.GetProperty("riskLog").GetInt32(), session.RiskHistory.Count);
        if (!final.TryGetProperty("score", out var score)) return; // the nurse role has its own score, not ported

        var input = final.GetProperty("input");
        Assert.True(input.GetProperty("facts").EnumerateArray().Select(f => f.GetString()).ToHashSet().SetEquals(session.HistoryObtained), "history obtained differs");
        Assert.True(input.GetProperty("exam").EnumerateArray().Select(f => f.GetString()).ToHashSet().SetEquals(session.ExaminationsDone), "examinations done differ");
        foreach (var t in input.GetProperty("tests").EnumerateArray())
        {
            session.AnnotateTest(Text(t, "id"), t.GetProperty("read").GetString() == "wrong", t.GetProperty("justOk").GetBoolean());
            Assert.Equal(t.GetProperty("reasonOk").GetString(), session.TestOf(Text(t, "id"))!.ReasonGrade);
        }

        HandoverAssessment? handover = null;
        if (input.GetProperty("end").ValueKind == JsonValueKind.Object)
        {
            var end = input.GetProperty("end");
            var g = end.GetProperty("grade");
            var dx = g.GetProperty("dx").GetString() switch { "right" => DiagnosisGrade.Right, "close" => DiagnosisGrade.Close, _ => DiagnosisGrade.Wrong };
            handover = new HandoverAssessment(
                Text(end, "dispo"), dx, g.GetProperty("s").GetBoolean(), g.GetProperty("b").GetBoolean(), g.GetProperty("a").GetBoolean(),
                g.GetProperty("r").GetBoolean(), g.GetProperty("invented").GetBoolean(), g.GetProperty("graded").GetBoolean());
        }

        var comm = input.GetProperty("comm");
        var communication = new CommunicationRecord(
            comm.GetProperty("introduced").GetBoolean(), comm.GetProperty("explained").GetBoolean(), comm.GetProperty("empathy").GetBoolean(),
            comm.GetProperty("rude").GetInt32(), comm.GetProperty("jargon").GetInt32());

        var mine = SessionScorer.Score(session, handover, communication);
        Assert.True(score.GetProperty("safe").GetDouble() == mine.Safety, $"safety score legacy={score.GetProperty("safe").GetDouble()} model={mine.Safety}");
        Assert.True(score.GetProperty("dxPts").GetDouble() == mine.Diagnosis, "diagnosis score differs");
        Assert.True(score.GetProperty("testPts").GetDouble() == mine.Tests, $"tests score legacy={score.GetProperty("testPts").GetDouble()} model={mine.Tests}");
        Assert.True(score.GetProperty("hist").GetDouble() == mine.History, "history score differs");
        Assert.True(score.GetProperty("comm").GetDouble() == mine.Communication, "communication score differs");
        Assert.True(score.GetProperty("hand").GetDouble() == mine.Handover, "handover score differs");
        Assert.True(score.GetProperty("total").GetDouble() == mine.Total, $"total score legacy={score.GetProperty("total").GetDouble()} model={mine.Total}");
        Assert.Equal(score.GetProperty("place").GetString(), mine.Destination switch { DestinationVerdict.Right => "right", DestinationVerdict.Dangerous => "bad", DestinationVerdict.Wrong => "wrong", _ => null });
        Assert.Equal(score.GetProperty("missedTests").EnumerateArray().Select(m => m.GetString()), mine.MissedTests);
        var safety = score.GetProperty("safety").EnumerateArray().Select(k => (k[0].GetString(), k[1].GetString(), k[2].ValueKind == JsonValueKind.Number ? k[2].GetDouble() : (double?)null)).ToList();
        var mySafety = mine.SafetyItems.Select(k => ((string?)k.Id, (string?)(k.State switch { TimelinessState.OnTime => "ontime", TimelinessState.Late => "late", _ => "missed" }), k.AtMinute)).ToList();
        Assert.True(safety.SequenceEqual(mySafety), $"safety items differ\n legacy: {string.Join(" ", safety)}\n model:  {string.Join(" ", mySafety)}");
        Assert.Equal(final.GetProperty("fell").GetBoolean(), session.HasCollapsed);

        if (final.TryGetProperty("verdict", out var verdict) && verdict.ValueKind == JsonValueKind.Object)
        {
            var judged = SessionScorer.Judge(session, mine, handover);
            Assert.Equal(verdict.GetProperty("passed").GetBoolean(), judged.Passed);
            Assert.Equal(verdict.GetProperty("fails").EnumerateArray().Select(f => FailureOf(f.GetString()!)), judged.Failures);
        }
    }

    /// <summary>The legacy failure lines, by the words each starts with.</summary>
    private static FailureReason FailureOf(string legacyLine) => legacyLine switch
    {
        "توقف القلب" => FailureReason.CardiacArrest,
        "أذى وصل إلى المريض" => FailureReason.PatientHarmed,
        "خطوة أساسية لم تحدث" => FailureReason.KeyStepMissed,
        "VT لم يُعالج" => FailureReason.VentricularTachycardiaUntreated,
        "الهبوط لم يُعالج" => FailureReason.CollapseUntreated,
        "التأق لم يُعالج" => FailureReason.AnaphylaxisUntreated,
        "لم تطلب أي فحص" => FailureReason.NoTestOrdered,
        "التشخيص خاطئ" => FailureReason.WrongDiagnosis,
        _ when legacyLine.StartsWith("وجهة خطرة", StringComparison.Ordinal) => FailureReason.DangerousDestination,
        _ => throw new InvalidOperationException($"Unknown legacy failure line: {legacyLine}"),
    };

    private static string IndicationName(TestIndication indication) => indication switch
    {
        TestIndication.Indicated => "indicated",
        TestIndication.Acceptable => "acceptable",
        TestIndication.Harmful => "harm",
        _ => "no",
    };

    private static string? OutcomeName(SessionOutcome? outcome) => outcome switch
    {
        SessionOutcome.Stable => "stable",
        SessionOutcome.Unstable => "unstable",
        SessionOutcome.Arrest => "arrest",
        _ => null,
    };
}
