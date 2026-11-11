namespace Nabd.Domain.Common;

/// <summary>
/// The two numeric helpers the legacy simulation used everywhere. They are kept exactly as they were, because
/// the golden-master tests compare this model with the legacy one bit for bit.
/// </summary>
internal static class Numbers
{
    /// <summary>Limits <paramref name="value"/> to the range from <paramref name="low"/> to <paramref name="high"/>.</summary>
    /// <remarks>The legacy order of operations: the upper limit is applied first, then the lower one.</remarks>
    public static double Clamp(double value, double low, double high) => Math.Max(low, Math.Min(high, value));

    /// <summary>Rounds to the nearest whole number; a half rounds up, as JavaScript's Math.round does.</summary>
    public static double Round(double value) => Math.Floor(value + 0.5);
}
