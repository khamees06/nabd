using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using Nabd.Application.Abstractions.Simulation;
using Nabd.Domain.Simulation;

namespace Nabd.Infrastructure.Simulation;

/// <summary>Limits of the in-memory session store.</summary>
public sealed class SessionStoreOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "Simulation:Sessions";

    /// <summary>The most sessions kept at once; a new one is refused beyond it.</summary>
    public int MaximumSessions { get; set; } = 500;

    /// <summary>Minutes after which an untouched session is dropped.</summary>
    public int IdleMinutes { get; set; } = 120;
}

/// <summary>
/// Sessions kept in the memory of the process. There is no database in this phase: a session lives until it has
/// been idle for a while or the application restarts. The store is bounded, so it cannot be used to exhaust memory.
/// </summary>
public sealed class InMemorySimulationSessionStore : ISimulationSessionStore
{
    private readonly ConcurrentDictionary<SessionId, (SessionEntry Entry, DateTimeOffset Touched)> _sessions = new();
    private readonly SessionStoreOptions _options;
    private readonly TimeProvider _time;

    /// <summary>Creates the store.</summary>
    public InMemorySimulationSessionStore(IOptions<SessionStoreOptions> options, TimeProvider time)
    {
        ArgumentNullException.ThrowIfNull(options);
        _options = options.Value;
        _time = time;
    }

    /// <inheritdoc />
    public Task<bool> TryAddAsync(SessionEntry entry, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(entry);
        DropIdle();
        if (_sessions.Count >= _options.MaximumSessions) return Task.FromResult(false);
        return Task.FromResult(_sessions.TryAdd(entry.Session.Id, (entry, _time.GetUtcNow())));
    }

    /// <inheritdoc />
    public Task<SessionEntry?> FindAsync(SessionId id, CancellationToken cancellationToken = default)
    {
        if (!_sessions.TryGetValue(id, out var found)) return Task.FromResult<SessionEntry?>(null);
        var now = _time.GetUtcNow();
        if (now - found.Touched > TimeSpan.FromMinutes(_options.IdleMinutes))
        {
            _sessions.TryRemove(id, out _);
            return Task.FromResult<SessionEntry?>(null);
        }

        _sessions[id] = (found.Entry, now);
        return Task.FromResult<SessionEntry?>(found.Entry);
    }

    private void DropIdle()
    {
        var limit = _time.GetUtcNow() - TimeSpan.FromMinutes(_options.IdleMinutes);
        foreach (var (id, value) in _sessions)
        {
            if (value.Touched < limit) _sessions.TryRemove(id, out _);
        }
    }
}
