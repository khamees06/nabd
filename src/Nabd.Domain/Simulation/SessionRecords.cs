namespace Nabd.Domain.Simulation;

/// <summary>Identity of a simulation session.</summary>
/// <param name="Value">The identifier.</param>
public readonly record struct SessionId(Guid Value)
{
    /// <summary>A new, unique session identity.</summary>
    public static SessionId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString("N");
}

/// <summary>An order that is carried out: what, how much, and how the nurse's question about it was answered.</summary>
/// <param name="ActionId">The intervention, by its catalog id.</param>
/// <param name="Dose">The dose as it was said, or empty.</param>
/// <param name="Grade">How the order was judged when it was given; "good" unless a grader said otherwise.</param>
/// <param name="Amount">The dose as a number in the intervention's base unit, or 0 when it has none.</param>
/// <param name="Titration">Whether this changes a treatment that is already running.</param>
public sealed record InterventionOrder(string ActionId, string Dose = "", string Grade = "good", double Amount = 0, Titration Titration = Titration.None);

/// <summary>What carrying out an intervention does in the case at hand.</summary>
/// <param name="RiskSlowing">Points per minute taken off the rate at which risk rises.</param>
/// <param name="OnsetMinutes">Simulated minutes before the slowing starts.</param>
/// <param name="OxygenSaturationGain">For oxygen: the case's SpO2 gain, replacing the catalog's value.</param>
/// <param name="Effect">The case's own effect on the vital signs, laid over the catalog's general effect.</param>
public sealed record CareEffect(double RiskSlowing = 0, double OnsetMinutes = 0, double? OxygenSaturationGain = null, VitalEffect? Effect = null)
{
    /// <summary>An intervention the case gives no effect to.</summary>
    public static CareEffect None { get; } = new();
}

/// <summary>What a harmful order does once it reaches the patient.</summary>
/// <param name="Label">What the report calls the error.</param>
/// <param name="Risk">Points of risk it adds; 0 means the default for a harm.</param>
/// <param name="CountsAsDone">True when the step still counts as done (given too early, it still works).</param>
/// <param name="RiskSlowing">Slowing it still brings when it counts as done.</param>
/// <param name="OnsetMinutes">Simulated minutes before that slowing starts.</param>
/// <param name="OffCase">True for an order with no indication in this case.</param>
/// <param name="AllergyRisk">Points of risk when the patient is allergic to it; 0 means the default.</param>
/// <param name="CausesAnaphylaxis">True when the allergic reaction is anaphylaxis.</param>
public sealed record HarmProfile(
    string? Label,
    double Risk = 0,
    bool CountsAsDone = false,
    double RiskSlowing = 0,
    double OnsetMinutes = 0,
    bool OffCase = false,
    double AllergyRisk = 0,
    bool CausesAnaphylaxis = false);

/// <summary>An intervention that has been carried out, possibly several times.</summary>
/// <param name="ActionId">The intervention.</param>
/// <param name="FirstAt">Simulated minute of the first time.</param>
/// <param name="LastAt">Simulated minute of the latest time.</param>
/// <param name="Count">How many times it was given.</param>
/// <param name="Dose">The latest dose as it was said.</param>
/// <param name="Grade">How the first order was judged.</param>
/// <param name="TotalAmount">The amounts added up.</param>
/// <param name="LargestAmount">The largest single amount.</param>
public sealed record InterventionRecord(string ActionId, double FirstAt, double LastAt, int Count, string Dose, string Grade, double TotalAmount, double LargestAmount);

/// <summary>A treatment that slows the rise of risk from a given minute on.</summary>
/// <param name="ActionId">The intervention it came from.</param>
/// <param name="FromMinute">Simulated minute at which the slowing starts.</param>
/// <param name="PointsPerMinute">Points per minute taken off the rate.</param>
public sealed record RiskSlowing(string ActionId, double FromMinute, double PointsPerMinute);

/// <summary>A treatment's change to the vital signs, building up from a given minute.</summary>
/// <param name="ActionId">The intervention it came from.</param>
/// <param name="FromMinute">Simulated minute at which the change starts to build.</param>
/// <param name="RampMinutes">Simulated minutes over which it builds up.</param>
/// <param name="OxygenSaturation">Change in SpO2.</param>
/// <param name="HeartRate">Change in heart rate.</param>
/// <param name="RespiratoryRate">Change in respiratory rate.</param>
/// <param name="SystolicPressure">Change in systolic pressure.</param>
/// <param name="DiastolicPressure">Change in diastolic pressure.</param>
public sealed record VitalModifier(
    string ActionId,
    double FromMinute,
    double RampMinutes,
    double OxygenSaturation,
    double HeartRate,
    double RespiratoryRate,
    double SystolicPressure,
    double DiastolicPressure);

/// <summary>A harm that reached the patient.</summary>
/// <param name="AtMinute">Simulated minute at which the order was given.</param>
/// <param name="Label">What the report calls it.</param>
/// <param name="Risk">Points of risk it added.</param>
public sealed record HarmRecord(double AtMinute, string Label, double Risk);

/// <summary>A test that was ordered.</summary>
/// <param name="TestId">The test.</param>
/// <param name="AtMinute">Simulated minute at which it was ordered.</param>
/// <param name="ReasonGrade">How the reason given with the order was judged ("good", "weak", "ungraded").</param>
/// <param name="Indication">Whether the test fitted the case at that moment.</param>
/// <param name="ReadWrongly">True when the trainee then misread the result.</param>
/// <param name="JustificationAccepted">True when a written justification for a test outside the indication was accepted.</param>
public sealed record OrderedTest(string TestId, double AtMinute, string ReasonGrade, TestIndication Indication, bool ReadWrongly = false, bool JustificationAccepted = false);

/// <summary>A point of the risk curve kept for the report.</summary>
/// <param name="AtMinute">Simulated minute.</param>
/// <param name="Risk">Risk at that minute.</param>
public readonly record struct RiskPoint(double AtMinute, double Risk);

/// <summary>An anaphylactic reaction in progress, and when it was treated.</summary>
/// <param name="StartedAt">Simulated minute at which the reaction began.</param>
/// <param name="TreatedAt">Simulated minute at which adrenaline was given; null while untreated.</param>
public sealed record Anaphylaxis(double StartedAt, double? TreatedAt)
{
    /// <summary>True once adrenaline has been given.</summary>
    public bool IsTreated => TreatedAt is not null;
}
