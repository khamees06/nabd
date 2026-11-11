using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;

namespace Nabd.Application.Abstractions.Simulation;

/// <summary>A running or finished session together with what the trainee handed over.</summary>
public sealed class SessionEntry
{
    /// <summary>Wraps a session that has just started.</summary>
    public SessionEntry(SimulationSession session) => Session = session;

    /// <summary>The session. Use cases change it only while holding <see cref="Gate"/>.</summary>
    public SimulationSession Session { get; }

    /// <summary>One use case at a time works on a session; the domain model is not thread-safe by itself.</summary>
    public Lock Gate { get; } = new();

    /// <summary>The graded handover, once the trainee has handed over.</summary>
    public HandoverAssessment? Handover { get; set; }

    /// <summary>How the trainee communicated, as recorded at the end.</summary>
    public CommunicationRecord? Communication { get; set; }
}

/// <summary>Keeps simulation sessions between requests.</summary>
public interface ISimulationSessionStore
{
    /// <summary>Stores a new session. Returns false when the store is full.</summary>
    Task<bool> TryAddAsync(SessionEntry entry, CancellationToken cancellationToken = default);

    /// <summary>The session with this id, or null when it does not exist or has expired.</summary>
    Task<SessionEntry?> FindAsync(SessionId id, CancellationToken cancellationToken = default);
}
