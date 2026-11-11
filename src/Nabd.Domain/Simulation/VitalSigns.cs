namespace Nabd.Domain.Simulation;

/// <summary>The five vital signs the bedside monitor shows.</summary>
/// <param name="HeartRate">Heart rate, beats per minute.</param>
/// <param name="SystolicPressure">Systolic blood pressure, mmHg.</param>
/// <param name="DiastolicPressure">Diastolic blood pressure, mmHg.</param>
/// <param name="RespiratoryRate">Breaths per minute.</param>
/// <param name="OxygenSaturation">Peripheral oxygen saturation, percent.</param>
public readonly record struct VitalSigns(
    double HeartRate,
    double SystolicPressure,
    double DiastolicPressure,
    double RespiratoryRate,
    double OxygenSaturation);

/// <summary>A blood pressure reading taken by the cuff, in whole mmHg.</summary>
/// <param name="Systolic">Systolic pressure.</param>
/// <param name="Diastolic">Diastolic pressure.</param>
/// <param name="TakenAt">Simulated minute at which the cuff measured.</param>
public readonly record struct BloodPressureReading(double Systolic, double Diastolic, double TakenAt);

/// <summary>
/// What a treatment does to the vital signs: a change per sign, reached gradually over <see cref="RampMinutes"/>.
/// A sign the treatment does not touch is null.
/// </summary>
/// <param name="OxygenSaturation">Change in SpO2, percentage points.</param>
/// <param name="HeartRate">Change in heart rate.</param>
/// <param name="RespiratoryRate">Change in respiratory rate.</param>
/// <param name="SystolicPressure">Change in systolic pressure.</param>
/// <param name="DiastolicPressure">Change in diastolic pressure.</param>
/// <param name="RampMinutes">Simulated minutes over which the change builds up; null means the default.</param>
public sealed record VitalEffect(
    double? OxygenSaturation = null,
    double? HeartRate = null,
    double? RespiratoryRate = null,
    double? SystolicPressure = null,
    double? DiastolicPressure = null,
    double? RampMinutes = null)
{
    /// <summary>An effect that changes nothing.</summary>
    public static VitalEffect None { get; } = new();

    /// <summary>
    /// The catalog's general effect with the case's own values laid over it: a value the case gives replaces
    /// the catalog's value for that sign.
    /// </summary>
    public VitalEffect OverlaidWith(VitalEffect? specific) => specific is null
        ? this
        : new VitalEffect(
            specific.OxygenSaturation ?? OxygenSaturation,
            specific.HeartRate ?? HeartRate,
            specific.RespiratoryRate ?? RespiratoryRate,
            specific.SystolicPressure ?? SystolicPressure,
            specific.DiastolicPressure ?? DiastolicPressure,
            specific.RampMinutes ?? RampMinutes);

    /// <summary>True when at least one vital sign changes.</summary>
    public bool ChangesAnything =>
        IsSet(OxygenSaturation) || IsSet(HeartRate) || IsSet(RespiratoryRate) || IsSet(SystolicPressure) || IsSet(DiastolicPressure);

    private static bool IsSet(double? value) => value is not null && value != 0;
}
