using Nabd.Domain.Simulation;

namespace Nabd.Domain.Catalog;

/// <summary>
/// The interventions and tests every case shares: what can be ordered in the room, whatever the case.
/// </summary>
public sealed class ClinicalCatalog
{
    private readonly Dictionary<string, InterventionDefinition> _interventions;
    private readonly Dictionary<string, TestDefinition> _tests;

    /// <summary>Builds the catalog from its two lists.</summary>
    public ClinicalCatalog(IReadOnlyList<InterventionDefinition> interventions, IReadOnlyList<TestDefinition> tests)
    {
        Interventions = interventions;
        Tests = tests;
        _interventions = interventions.ToDictionary(i => i.Id, StringComparer.Ordinal);
        _tests = tests.ToDictionary(t => t.Id, StringComparer.Ordinal);
    }

    /// <summary>Every intervention, in catalog order.</summary>
    public IReadOnlyList<InterventionDefinition> Interventions { get; }

    /// <summary>Every test, in catalog order.</summary>
    public IReadOnlyList<TestDefinition> Tests { get; }

    /// <summary>The intervention with this id, or null.</summary>
    public InterventionDefinition? Intervention(string id) => _interventions.GetValueOrDefault(id);

    /// <summary>The test with this id, or null.</summary>
    public TestDefinition? Test(string id) => _tests.GetValueOrDefault(id);
}

/// <summary>An intervention the trainee can order: a drug, a procedure, a call for help.</summary>
/// <param name="Id">Stable identifier, for example <c>oxygen</c>.</param>
/// <param name="ArabicName">Name shown in Arabic.</param>
/// <param name="EnglishName">Name in English.</param>
/// <param name="RequiresDose">True when the order needs a dose or a flow.</param>
/// <param name="Repeat">Whether and how it can be given again; null when it is given once.</param>
/// <param name="Effect">Its general effect on the vital signs; a case may lay its own values over it.</param>
public sealed record InterventionDefinition(
    string Id,
    string ArabicName,
    string EnglishName,
    bool RequiresDose,
    RepeatRule? Repeat,
    VitalEffect? Effect);

/// <summary>How an intervention behaves when it is given again.</summary>
/// <param name="GapMinutes">Simulated minutes that must pass before it can be repeated.</param>
/// <param name="AgainShare">The share of the first dose's effect that a repeat adds (0 adds nothing).</param>
/// <param name="Maximum">The largest number of times it can be given.</param>
/// <param name="OnlyMoreAdds">
/// True when a repeat adds effect only if it is more than what is already running (oxygen at the same flow adds
/// nothing).
/// </param>
public sealed record RepeatRule(double GapMinutes, double AgainShare, int Maximum, bool OnlyMoreAdds);

/// <summary>A test the trainee can order.</summary>
/// <param name="Id">Stable identifier, for example <c>ecg</c>.</param>
/// <param name="ArabicName">Name shown in Arabic.</param>
/// <param name="EnglishName">Name in English.</param>
public sealed record TestDefinition(string Id, string ArabicName, string EnglishName);
