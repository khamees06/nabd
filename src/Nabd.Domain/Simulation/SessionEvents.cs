namespace Nabd.Domain.Simulation;

/// <summary>Something that happened in a session, at a simulated minute.</summary>
/// <param name="AtMinute">Simulated minute at which it happened.</param>
public abstract record SessionEvent(double AtMinute);

/// <summary>The stage the trainee is told about changed.</summary>
/// <param name="AtMinute">Simulated minute.</param>
/// <param name="Stage">The new stage.</param>
/// <param name="Improved">True when the patient got better, false when worse.</param>
public sealed record StageChanged(double AtMinute, ClinicalStage Stage, bool Improved) : SessionEvent(AtMinute);

/// <summary>An intervention was carried out.</summary>
/// <param name="AtMinute">Simulated minute.</param>
/// <param name="ActionId">The intervention.</param>
/// <param name="Dose">The dose as it was said.</param>
public sealed record InterventionGiven(double AtMinute, string ActionId, string Dose) : SessionEvent(AtMinute);

/// <summary>A harmful order took its effect on the patient.</summary>
/// <param name="AtMinute">Simulated minute.</param>
/// <param name="ActionId">The intervention.</param>
/// <param name="Label">What the report calls it.</param>
/// <param name="Risk">Points of risk it added.</param>
public sealed record PatientHarmed(double AtMinute, string ActionId, string Label, double Risk) : SessionEvent(AtMinute);

/// <summary>A test was ordered.</summary>
/// <param name="AtMinute">Simulated minute.</param>
/// <param name="TestId">The test.</param>
/// <param name="Indication">Whether it fitted the case at that moment.</param>
public sealed record TestOrdered(double AtMinute, string TestId, TestIndication Indication) : SessionEvent(AtMinute);

/// <summary>A shock ended the ventricular tachycardia.</summary>
/// <param name="AtMinute">Simulated minute.</param>
public sealed record RhythmRestored(double AtMinute) : SessionEvent(AtMinute);

/// <summary>The patient arrested.</summary>
/// <param name="AtMinute">Simulated minute.</param>
public sealed record PatientArrested(double AtMinute) : SessionEvent(AtMinute);
