using Nabd.Domain.Common;
using Nabd.Domain.Simulation;

namespace Nabd.Domain.Cases;

/// <summary>
/// One emergency case as the simulation plays it: how the patient's risk moves, what the vital signs are at each
/// level of risk, which steps and tests the case expects, and where the patient belongs afterwards.
/// A case is reference data: it is loaded once and never changes during a session.
/// </summary>
/// <remarks>
/// The clinical content of the cases was written for training and has not been reviewed by a physician
/// (the data file carries <c>reviewed: false</c>). This type carries that flag unchanged.
/// </remarks>
public sealed class ClinicalCase
{
    private readonly Dictionary<string, CareStep> _careById;
    private readonly Dictionary<string, TestExpectation> _resultsById;

    /// <summary>Builds a case from its parts and checks that it can be simulated.</summary>
    public ClinicalCase(
        string id,
        RiskProfile risk,
        IReadOnlyList<VitalAnchor> vitalAnchors,
        double temperature,
        double? weightKg,
        bool ventricularTachycardiaWhenCritical,
        IReadOnlyList<CareStep> care,
        IReadOnlyList<TestExpectation> expectedResults,
        IReadOnlyDictionary<ClinicalStage, StageCue> stageCues,
        IReadOnlyList<ClinicalFinding> findings,
        DispositionRule disposition,
        CollapseRule? collapse)
    {
        if (string.IsNullOrWhiteSpace(id)) throw new DomainException("A clinical case needs an id.");
        if (vitalAnchors.Count < 2) throw new DomainException($"Case '{id}' needs at least two vital-sign anchors.");
        for (var i = 1; i < vitalAnchors.Count; i++)
        {
            if (vitalAnchors[i].AtRisk <= vitalAnchors[i - 1].AtRisk)
                throw new DomainException($"Case '{id}': vital-sign anchors must be in rising order of risk.");
        }

        Id = id;
        Risk = risk;
        VitalAnchors = vitalAnchors;
        Temperature = temperature;
        WeightKg = weightKg;
        VentricularTachycardiaWhenCritical = ventricularTachycardiaWhenCritical;
        Care = care;
        ExpectedResults = expectedResults;
        StageCues = stageCues;
        Findings = findings;
        Disposition = disposition;
        Collapse = collapse;
        _careById = care.ToDictionary(c => c.ActionId, StringComparer.Ordinal);
        _resultsById = expectedResults.ToDictionary(r => r.TestId, StringComparer.Ordinal);
    }

    /// <summary>Stable identifier of the case, for example <c>sepsis</c>.</summary>
    public string Id { get; }

    /// <summary>How the risk starts, drifts and where the stages begin.</summary>
    public RiskProfile Risk { get; }

    /// <summary>The untreated vital signs at given levels of risk, in rising order of risk.</summary>
    public IReadOnlyList<VitalAnchor> VitalAnchors { get; }

    /// <summary>Body temperature, degrees Celsius. It does not change during a session.</summary>
    public double Temperature { get; }

    /// <summary>Body weight in kilograms, when the case states one.</summary>
    public double? WeightKg { get; }

    /// <summary>True when the critical stage of this case is an unstable ventricular tachycardia.</summary>
    public bool VentricularTachycardiaWhenCritical { get; }

    /// <summary>What the case says about each intervention it plans for, in the order of the case file.</summary>
    public IReadOnlyList<CareStep> Care { get; }

    /// <summary>What the case says about each test it plans for, in the order of the case file.</summary>
    public IReadOnlyList<TestExpectation> ExpectedResults { get; }

    /// <summary>What happens at the bedside when a stage is reached.</summary>
    public IReadOnlyDictionary<ClinicalStage, StageCue> StageCues { get; }

    /// <summary>History facts and examination findings the trainee can obtain.</summary>
    public IReadOnlyList<ClinicalFinding> Findings { get; }

    /// <summary>Where the patient belongs after the emergency department.</summary>
    public DispositionRule Disposition { get; }

    /// <summary>The planned collapse of the case and what it changes, when the case has one.</summary>
    public CollapseRule? Collapse { get; }

    /// <summary>The case's entry for an intervention, or null when the case did not plan for it.</summary>
    public CareStep? CareFor(string actionId) => _careById.GetValueOrDefault(actionId);

    /// <summary>The case's entry for a test, or null when the case did not plan for it.</summary>
    public TestExpectation? ResultFor(string testId) => _resultsById.GetValueOrDefault(testId);

    /// <summary>
    /// The vital signs of the untreated patient at a level of risk: a straight line between the two anchors
    /// that enclose it.
    /// </summary>
    public VitalSigns VitalsAt(double risk)
    {
        var anchors = VitalAnchors;
        var i = 0;
        while (i < anchors.Count - 2 && risk > anchors[i + 1].AtRisk) i++;
        var a = anchors[i];
        var b = anchors[i + 1];
        var f = Numbers.Clamp((risk - a.AtRisk) / (b.AtRisk - a.AtRisk), 0, 1);
        return new VitalSigns(
            a.Vitals.HeartRate + f * (b.Vitals.HeartRate - a.Vitals.HeartRate),
            a.Vitals.SystolicPressure + f * (b.Vitals.SystolicPressure - a.Vitals.SystolicPressure),
            a.Vitals.DiastolicPressure + f * (b.Vitals.DiastolicPressure - a.Vitals.DiastolicPressure),
            a.Vitals.RespiratoryRate + f * (b.Vitals.RespiratoryRate - a.Vitals.RespiratoryRate),
            a.Vitals.OxygenSaturation + f * (b.Vitals.OxygenSaturation - a.Vitals.OxygenSaturation));
    }

    /// <summary>The stage a level of risk belongs to.</summary>
    public ClinicalStage StageAt(double risk) =>
        risk >= Risk.Critical ? ClinicalStage.Critical
        : risk >= Risk.Urgent ? ClinicalStage.Urgent
        : risk >= Risk.Watch ? ClinicalStage.Watch
        : ClinicalStage.Calm;
}

/// <summary>How the patient's risk behaves in a case. Risk runs from 0 to 100; at 100 the patient arrests.</summary>
/// <param name="Start">Risk when the case begins.</param>
/// <param name="RatePerMinute">Points of risk gained per simulated minute with no treatment.</param>
/// <param name="Watch">Risk at which the first stage of deterioration begins.</param>
/// <param name="Urgent">Risk at which the urgent stage begins.</param>
/// <param name="Critical">Risk at which the critical stage begins.</param>
/// <param name="Hold">The case's ceiling for supportive care, when it has one.</param>
public sealed record RiskProfile(double Start, double RatePerMinute, double Watch, double Urgent, double Critical, RiskHold? Hold);

/// <summary>
/// Supportive care alone does not turn this patient round: until the named step is done, the risk does not fall
/// while it is at or below <paramref name="AtRisk"/>.
/// </summary>
/// <param name="UntilActionId">The intervention that treats the cause.</param>
/// <param name="AtRisk">The level at which the risk is held.</param>
public sealed record RiskHold(string UntilActionId, double AtRisk);

/// <summary>The untreated vital signs at one level of risk.</summary>
/// <param name="AtRisk">The level of risk.</param>
/// <param name="Vitals">The vital signs at that level.</param>
public sealed record VitalAnchor(double AtRisk, VitalSigns Vitals);

/// <summary>What the case says about one intervention.</summary>
/// <param name="ActionId">The intervention, by its catalog id.</param>
/// <param name="IsKey">True when the case cannot be managed safely without this step.</param>
/// <param name="DueByMinute">Simulated minute by which a key step should be done; null when no time is set.</param>
/// <param name="RiskSlowing">Points per minute this step takes off the rate at which risk rises.</param>
/// <param name="OnsetMinutes">Simulated minutes before the slowing starts.</param>
/// <param name="OxygenSaturationGain">For oxygen: the SpO2 gain in this case, replacing the catalog's value.</param>
/// <param name="Effect">The case's own effect on the vital signs, laid over the catalog's general effect.</param>
public sealed record CareStep(
    string ActionId,
    bool IsKey,
    double? DueByMinute,
    double RiskSlowing,
    double OnsetMinutes,
    double? OxygenSaturationGain,
    VitalEffect? Effect);

/// <summary>What the case says about one test.</summary>
/// <param name="TestId">The test, by its catalog id.</param>
/// <param name="Indication">Whether the test fits the case.</param>
/// <param name="WhenShocked">The indication once the systolic pressure has fallen below 90, when it differs.</param>
/// <param name="DueByMinute">Simulated minute by which the test should be ordered, for time-critical tests.</param>
/// <param name="BeforeActionId">An intervention this test should come before (cultures before the antibiotic).</param>
public sealed record TestExpectation(
    string TestId,
    TestIndication Indication,
    TestIndication? WhenShocked,
    double? DueByMinute,
    string? BeforeActionId);

/// <summary>What happens at the bedside when a stage is reached.</summary>
/// <param name="NamesMeasuredSigns">
/// True when the nurse's line for this stage quotes numbers from the monitor; the cuff then measures at once so
/// that what she says and what the tile shows agree.
/// </param>
public sealed record StageCue(bool NamesMeasuredSigns);

/// <summary>A history fact or an examination finding the trainee can obtain.</summary>
/// <param name="Id">Identifier of the finding within the case.</param>
/// <param name="IsExamination">True for an examination finding, false for a history fact.</param>
/// <param name="IsRedFlag">True when missing it costs history points.</param>
public sealed record ClinicalFinding(string Id, bool IsExamination, bool IsRedFlag);

/// <summary>Where the patient belongs after the emergency department.</summary>
/// <param name="Right">The right destination.</param>
/// <param name="AlsoAcceptable">Other destinations accepted as right while the patient has not collapsed.</param>
/// <param name="Dangerous">Destinations that are unsafe for this patient.</param>
public sealed record DispositionRule(string Right, IReadOnlyList<string> AlsoAcceptable, IReadOnlyList<string> Dangerous);

/// <summary>
/// The planned collapse of a case: once the patient has reached the critical stage, or the rescue treatment has
/// been given, the right destination changes and the rescue treatment becomes required.
/// </summary>
/// <param name="RescueActionId">The treatment that the collapse calls for.</param>
/// <param name="Destination">The right destination after a collapse.</param>
public sealed record CollapseRule(string RescueActionId, string Destination);
