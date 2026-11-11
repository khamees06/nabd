using System.Text.Json;
using Nabd.Domain.Simulation;
using Nabd.Infrastructure.LegacyData;
using Nabd.Tests.Support;

namespace Nabd.Tests.Infrastructure;

/// <summary>The legacy er-cases.json, read through the repository, against the raw file.</summary>
public class ErCaseFileMapperTests
{
    [Fact]
    public async Task The_file_gives_six_cases_and_the_shared_catalog()
    {
        var repository = TestData.CaseRepository;
        Assert.Equal(["asthma", "sepsis", "pe", "stemi", "dka", "htn"], await repository.ListCaseIdsAsync());
        var catalog = await repository.GetCatalogAsync();
        Assert.Equal(42, catalog.Interventions.Count);
        Assert.Equal(22, catalog.Tests.Count);
        Assert.Null(await repository.FindAsync("unknown"));
    }

    [Fact]
    public async Task The_clinical_content_is_reported_as_not_reviewed_by_a_physician()
    {
        // The data file says so itself. Nothing in the application may claim otherwise.
        Assert.False(await TestData.CaseRepository.IsClinicallyReviewedAsync());
    }

    [Fact]
    public async Task Every_field_the_clinical_core_uses_is_mapped_as_the_file_has_it()
    {
        using var raw = JsonDocument.Parse(await TestData.LegacyDataFiles.ReadAsync(LegacyDataFiles.ErCases));
        foreach (var rawCase in raw.RootElement.GetProperty("cases").EnumerateArray())
        {
            var id = rawCase.GetProperty("id").GetString()!;
            var mapped = (await TestData.CaseRepository.FindAsync(id))!;

            var risk = rawCase.GetProperty("risk");
            Assert.Equal(risk.GetProperty("start").GetDouble(), mapped.Risk.Start);
            Assert.Equal(risk.GetProperty("rate").GetDouble(), mapped.Risk.RatePerMinute);
            Assert.Equal(risk.GetProperty("watch").GetDouble(), mapped.Risk.Watch);
            Assert.Equal(risk.GetProperty("urgent").GetDouble(), mapped.Risk.Urgent);
            Assert.Equal(risk.GetProperty("critical").GetDouble(), mapped.Risk.Critical);
            Assert.Equal(risk.TryGetProperty("hold", out var hold), mapped.Risk.Hold is not null);
            if (mapped.Risk.Hold is not null) Assert.Equal((hold.GetProperty("until").GetString(), hold.GetProperty("at").GetDouble()), (mapped.Risk.Hold.UntilActionId, mapped.Risk.Hold.AtRisk));

            var anchors = rawCase.GetProperty("vitals").EnumerateArray().ToList();
            Assert.Equal(anchors.Count, mapped.VitalAnchors.Count);
            for (var i = 0; i < anchors.Count; i++)
            {
                Assert.Equal(anchors[i].GetProperty("at").GetDouble(), mapped.VitalAnchors[i].AtRisk);
                Assert.Equal(anchors[i].GetProperty("sbp").GetDouble(), mapped.VitalAnchors[i].Vitals.SystolicPressure);
                Assert.Equal(anchors[i].GetProperty("spo2").GetDouble(), mapped.VitalAnchors[i].Vitals.OxygenSaturation);
            }

            // The order of the entries matters: the score walks them in file order.
            var care = rawCase.GetProperty("care").EnumerateObject().ToList();
            Assert.Equal(care.Select(c => c.Name), mapped.Care.Select(c => c.ActionId));
            foreach (var entry in care)
            {
                var step = mapped.CareFor(entry.Name)!;
                Assert.Equal(entry.Value.TryGetProperty("key", out var key) && key.GetBoolean(), step.IsKey);
                Assert.Equal(entry.Value.TryGetProperty("by", out var by) ? by.GetDouble() : (double?)null, step.DueByMinute);
                Assert.Equal(entry.Value.TryGetProperty("slow", out var slow) ? slow.GetDouble() : 0, step.RiskSlowing);
                Assert.Equal(entry.Value.TryGetProperty("onset", out var onset) ? onset.GetDouble() : 0, step.OnsetMinutes);
                Assert.Equal(entry.Value.TryGetProperty("fx", out _), step.Effect is not null);
            }

            var results = rawCase.GetProperty("results").EnumerateObject().ToList();
            Assert.Equal(results.Select(r => r.Name), mapped.ExpectedResults.Select(r => r.TestId));
            Assert.Equal(rawCase.TryGetProperty("vt", out var vt) && vt.GetBoolean(), mapped.VentricularTachycardiaWhenCritical);
            Assert.Equal(rawCase.TryGetProperty("collapse", out _), mapped.Collapse is not null);
            Assert.Equal(rawCase.GetProperty("dispo").GetString(), mapped.Disposition.Right);
            Assert.Equal(rawCase.GetProperty("facts").GetArrayLength() + rawCase.GetProperty("exam").GetArrayLength(), mapped.Findings.Count);
        }
    }

    [Fact]
    public async Task Known_values_of_two_cases_are_read_correctly()
    {
        var sepsis = (await TestData.CaseRepository.FindAsync("sepsis"))!;
        Assert.Equal((46, 3, 56, 70, 85), (sepsis.Risk.Start, sepsis.Risk.RatePerMinute, sepsis.Risk.Watch, sepsis.Risk.Urgent, sepsis.Risk.Critical));
        Assert.Equal(("antibiotics", 58), (sepsis.Risk.Hold!.UntilActionId, sepsis.Risk.Hold.AtRisk));
        Assert.Equal(80, sepsis.WeightKg);
        Assert.Equal("antibiotics", sepsis.ResultFor("blood_culture")!.BeforeActionId);
        Assert.Equal(TestIndication.Harmful, sepsis.ResultFor("ct_head")!.WhenShocked);
        Assert.Equal(ClinicalStage.Urgent, sepsis.StageAt(70));
        Assert.Equal(104, sepsis.VitalsAt(46).SystolicPressure);

        var stemi = (await TestData.CaseRepository.FindAsync("stemi"))!;
        Assert.True(stemi.VentricularTachycardiaWhenCritical);
        Assert.Equal("cath", stemi.Disposition.Right);
        Assert.Equal(10, stemi.ResultFor("ecg")!.DueByMinute);
    }

    [Fact]
    public async Task Only_the_shipped_data_files_can_be_read()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => TestData.LegacyDataFiles.ReadAsync("../appsettings"));
        await Assert.ThrowsAsync<ArgumentException>(() => TestData.LegacyDataFiles.ReadAsync("er-cases.json"));
        Assert.Equal(8, LegacyDataFiles.KnownNames.Count);
    }
}
