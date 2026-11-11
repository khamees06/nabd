namespace Nabd.Domain.Simulation;

/// <summary>How sick the patient is, from the risk thresholds of the case.</summary>
public enum ClinicalStage
{
    /// <summary>Below the first threshold.</summary>
    Calm = 0,

    /// <summary>Deterioration has begun.</summary>
    Watch = 1,

    /// <summary>Clear deterioration; the monitor alarms.</summary>
    Urgent = 2,

    /// <summary>Critical; arrest is close.</summary>
    Critical = 3,
}

/// <summary>The role the trainee plays in the room.</summary>
public enum TraineeRole
{
    /// <summary>The resident doctor who gives the orders.</summary>
    Doctor = 0,

    /// <summary>The nurse responsible for the bed.</summary>
    Nurse = 1,
}

/// <summary>How a session ended.</summary>
public enum SessionOutcome
{
    /// <summary>Handed over with the risk below the first threshold and every key step done.</summary>
    Stable = 0,

    /// <summary>Handed over while still at risk or with a key step missing.</summary>
    Unstable = 1,

    /// <summary>The patient arrested before a handover.</summary>
    Arrest = 2,
}

/// <summary>Whether a test fits the case at the moment it is ordered.</summary>
public enum TestIndication
{
    /// <summary>The case calls for it.</summary>
    Indicated = 0,

    /// <summary>Reasonable, neither required nor wrong.</summary>
    Acceptable = 1,

    /// <summary>Not needed in this case.</summary>
    NotIndicated = 2,

    /// <summary>Dangerous right now.</summary>
    Harmful = 3,
}

/// <summary>Whether a dose the trainee changed went up or down.</summary>
public enum Titration
{
    /// <summary>A plain order, not a change of a running treatment.</summary>
    None = 0,

    /// <summary>More of a running treatment.</summary>
    Up = 1,

    /// <summary>Less of a running treatment.</summary>
    Down = 2,
}
