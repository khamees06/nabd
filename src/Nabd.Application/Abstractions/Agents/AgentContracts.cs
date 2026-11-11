using Nabd.Domain.Simulation;

namespace Nabd.Application.Abstractions.Agents;

/*
 * Contracts for the multi-agent system. Nothing implements them yet, on purpose: this phase prepares the place
 * where the agents will plug in and leaves today's behaviour untouched. Today the rooms' people are voiced by the
 * external understanding service behind IUnderstandingServiceGateway and, when it is unreachable, by the fixed
 * lines of the browser-side client.
 *
 * The shape follows what the legacy ER room already does (docs/legacy-audit/19-er-director-and-ending.md): a
 * director decides who speaks next (patient, relative, nurse or supervisor), and each speaker says one line from
 * the state of the room. An orchestrator replaces that director; an agent replaces one voice.
 */

/// <summary>Who can speak in the room.</summary>
public enum RoomSpeaker
{
    /// <summary>The patient.</summary>
    Patient,

    /// <summary>The relative who came with the patient.</summary>
    Companion,

    /// <summary>The bedside nurse (or, in the nurse's room, the doctor outside).</summary>
    Nurse,

    /// <summary>The supervising senior (or the clinical nurse instructor).</summary>
    Supervisor,
}

/// <summary>One line said in the room.</summary>
/// <param name="Speaker">Who said it; null for the trainee.</param>
/// <param name="Text">What was said.</param>
public sealed record RoomLine(RoomSpeaker? Speaker, string Text);

/// <summary>What an agent may know when it speaks: the clinical picture and the recent conversation.</summary>
/// <param name="SessionId">The session.</param>
/// <param name="CaseId">The case being played.</param>
/// <param name="Role">The trainee's role.</param>
/// <param name="SimulatedMinutes">Simulated minutes since the case began.</param>
/// <param name="Stage">How sick the patient is.</param>
/// <param name="Vitals">The vital signs on the monitor.</param>
/// <param name="InterventionsDone">Interventions carried out so far, by catalog id.</param>
/// <param name="RecentLines">The latest lines of the conversation, oldest first.</param>
public sealed record AgentContext(
    SessionId SessionId,
    string CaseId,
    TraineeRole Role,
    double SimulatedMinutes,
    ClinicalStage Stage,
    VitalSigns Vitals,
    IReadOnlyList<string> InterventionsDone,
    IReadOnlyList<RoomLine> RecentLines);

/// <summary>What an agent answers.</summary>
/// <param name="Speaker">Who speaks.</param>
/// <param name="Text">The line; null when the agent chooses to stay silent.</param>
/// <param name="Withheld">True when a line was produced but held back by a safety check (for example, it named the diagnosis).</param>
public sealed record AgentReply(RoomSpeaker Speaker, string? Text, bool Withheld = false);

/// <summary>One voice in the room.</summary>
public interface IRoomAgent
{
    /// <summary>Who this agent speaks for.</summary>
    RoomSpeaker Speaker { get; }

    /// <summary>Answers the trainee, or reacts to an event in the room described by <paramref name="cue"/>.</summary>
    Task<AgentReply> RespondAsync(AgentContext context, string cue, CancellationToken cancellationToken = default);
}

/// <summary>Speaks as the patient: symptoms and history in the patient's own words, never the diagnosis.</summary>
public interface IPatientAgent : IRoomAgent;

/// <summary>Speaks as the relative: worry, extra history, reactions to what the team does.</summary>
public interface ICompanionAgent : IRoomAgent;

/// <summary>Speaks as the nurse: confirms orders, asks for missing doses, challenges unsafe orders, reports numbers.</summary>
public interface INurseAgent : IRoomAgent;

/// <summary>Speaks as the supervisor: guiding questions and warnings, without giving the answer away.</summary>
public interface ISupervisorAgent : IRoomAgent;

/// <summary>Decides who speaks next and gathers the replies for one turn of the room.</summary>
public interface IAgentOrchestrator
{
    /// <summary>Handles a message from the trainee: who answers, and with what.</summary>
    Task<IReadOnlyList<AgentReply>> HandleTraineeMessageAsync(AgentContext context, string message, CancellationToken cancellationToken = default);

    /// <summary>Handles an event of the simulation (a stage change, a harm, a result): who reacts, and with what.</summary>
    Task<IReadOnlyList<AgentReply>> HandleSessionEventAsync(AgentContext context, SessionEvent sessionEvent, CancellationToken cancellationToken = default);
}
