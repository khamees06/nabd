using System.Text.Json;
using Nabd.Domain.Cases;
using Nabd.Domain.Catalog;
using Nabd.Domain.Simulation;

namespace Nabd.Infrastructure.LegacyData.ErCases;

/// <summary>The content of er-cases.json as domain objects.</summary>
/// <param name="Catalog">Interventions and tests.</param>
/// <param name="Cases">The cases, in file order.</param>
/// <param name="Reviewed">The file's own flag: whether a physician reviewed the clinical content.</param>
public sealed record ErCaseFile(ClinicalCatalog Catalog, IReadOnlyList<ClinicalCase> Cases, bool Reviewed);

/// <summary>
/// Maps the legacy er-cases.json to the domain model. It reads only the fields the clinical core uses; the
/// conversation fields (keywords, spoken lines, teaching notes) stay with the legacy client and are not mapped.
/// The order of entries in the file is kept, because the scoring rules walk them in that order.
/// </summary>
public static class ErCaseFileMapper
{
    /// <summary>Parses the file and maps it.</summary>
    public static ErCaseFile Map(ReadOnlyMemory<byte> json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        var interventions = root.GetProperty("actions").EnumerateArray().Select(MapIntervention).ToList();
        var tests = root.GetProperty("tests").EnumerateArray()
            .Select(t => new TestDefinition(Text(t, "id")!, Text(t, "ar") ?? "", Text(t, "en") ?? ""))
            .ToList();
        var cases = root.GetProperty("cases").EnumerateArray().Select(MapCase).ToList();
        var reviewed = root.TryGetProperty("reviewed", out var r) && r.ValueKind == JsonValueKind.True;
        return new ErCaseFile(new ClinicalCatalog(interventions, tests), cases, reviewed);
    }

    private static InterventionDefinition MapIntervention(JsonElement a)
    {
        RepeatRule? repeat = null;
        if (a.TryGetProperty("repeat", out var r) && r.ValueKind == JsonValueKind.Object)
        {
            repeat = new RepeatRule(Number(r, "gap") ?? 0, Number(r, "again") ?? 0, (int)(Number(r, "max") ?? 0), Flag(r, "up"));
        }

        return new InterventionDefinition(Text(a, "id")!, Text(a, "ar") ?? "", Text(a, "en") ?? "", Flag(a, "dose"), repeat, Effect(a, "fx"));
    }

    private static ClinicalCase MapCase(JsonElement c)
    {
        var id = Text(c, "id")!;
        var risk = c.GetProperty("risk");
        RiskHold? hold = null;
        if (risk.TryGetProperty("hold", out var h) && h.ValueKind == JsonValueKind.Object)
        {
            hold = new RiskHold(Text(h, "until")!, Number(h, "at") ?? 0);
        }

        var profile = new RiskProfile(
            Number(risk, "start") ?? 0, Number(risk, "rate") ?? 0, Number(risk, "watch") ?? 0, Number(risk, "urgent") ?? 0, Number(risk, "critical") ?? 0, hold);

        var anchors = c.GetProperty("vitals").EnumerateArray()
            .Select(v => new VitalAnchor(
                Number(v, "at") ?? 0,
                new VitalSigns(Number(v, "hr") ?? 0, Number(v, "sbp") ?? 0, Number(v, "dbp") ?? 0, Number(v, "rr") ?? 0, Number(v, "spo2") ?? 0)))
            .ToList();

        var care = c.GetProperty("care").EnumerateObject()
            .Select(p => new CareStep(
                p.Name, Flag(p.Value, "key"), Number(p.Value, "by"), Number(p.Value, "slow") ?? 0, Number(p.Value, "onset") ?? 0,
                Number(p.Value, "spo2"), Effect(p.Value, "fx")))
            .ToList();

        var results = c.GetProperty("results").EnumerateObject()
            .Select(p => new TestExpectation(
                p.Name, Indication(Text(p.Value, "ind")) ?? TestIndication.NotIndicated, Indication(Text(p.Value, "whenShock")),
                Number(p.Value, "by"), Text(p.Value, "before")))
            .ToList();

        var cues = new Dictionary<ClinicalStage, StageCue>();
        if (c.TryGetProperty("stageLines", out var lines) && lines.ValueKind == JsonValueKind.Object)
        {
            foreach (var (name, stage) in new[] { ("watch", ClinicalStage.Watch), ("urgent", ClinicalStage.Urgent), ("critical", ClinicalStage.Critical) })
            {
                if (lines.TryGetProperty(name, out var line) && line.ValueKind == JsonValueKind.Object)
                {
                    cues[stage] = new StageCue(line.TryGetProperty("parts", out var parts) && parts.ValueKind == JsonValueKind.Array);
                }
            }
        }

        var findings = new List<ClinicalFinding>();
        foreach (var f in Items(c, "facts")) findings.Add(new ClinicalFinding(Text(f, "id")!, IsExamination: false, Flag(f, "red")));
        foreach (var f in Items(c, "exam")) findings.Add(new ClinicalFinding(Text(f, "id")!, IsExamination: true, Flag(f, "red")));

        var disposition = new DispositionRule(Text(c, "dispo") ?? "", Strings(c, "dispoAlso"), Strings(c, "dispoBad"));
        CollapseRule? collapse = null;
        if (c.TryGetProperty("collapse", out var col) && col.ValueKind == JsonValueKind.Object)
        {
            collapse = new CollapseRule(Text(col, "need")!, Text(col, "dispo") ?? "");
        }

        return new ClinicalCase(
            id, profile, anchors, Number(c, "temp") ?? 0, Number(c, "kg"), Flag(c, "vt"), care, results, cues, findings, disposition, collapse);
    }

    private static VitalEffect? Effect(JsonElement owner, string name) =>
        owner.TryGetProperty(name, out var fx) && fx.ValueKind == JsonValueKind.Object
            ? new VitalEffect(Number(fx, "spo2"), Number(fx, "hr"), Number(fx, "rr"), Number(fx, "sbp"), Number(fx, "dbp"), Number(fx, "ramp"))
            : null;

    private static TestIndication? Indication(string? value) => value switch
    {
        "indicated" => TestIndication.Indicated,
        "acceptable" => TestIndication.Acceptable,
        "no" => TestIndication.NotIndicated,
        "harm" => TestIndication.Harmful,
        null or "" => null,
        _ => throw new InvalidDataException($"er-cases.json: unknown test indication '{value}'."),
    };

    private static IEnumerable<JsonElement> Items(JsonElement owner, string name) =>
        owner.TryGetProperty(name, out var list) && list.ValueKind == JsonValueKind.Array ? list.EnumerateArray() : [];

    private static List<string> Strings(JsonElement owner, string name) =>
        [.. Items(owner, name).Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!)];

    private static string? Text(JsonElement owner, string name) =>
        owner.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static double? Number(JsonElement owner, string name) =>
        owner.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetDouble() : null;

    private static bool Flag(JsonElement owner, string name) =>
        owner.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.True;
}
