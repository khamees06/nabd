# 0009 — Multi-agent: contracts and extension points only

Status: accepted · 2026-11-11

## Context

The planned next step for the product is a multi-agent room: separate agents for the patient, the relative, the
nurse and the supervisor, coordinated by an orchestrator. The brief asks to prepare the architecture for it and
forbids implementing it now.

## Decision

- `Nabd.Application/Abstractions/Agents/AgentContracts.cs` defines `IAgentOrchestrator`, `IRoomAgent` and the four
  voices `IPatientAgent`, `ICompanionAgent`, `INurseAgent`, `ISupervisorAgent`, with `AgentContext` (what an agent
  may know) and `AgentReply` (what it answers, including a line withheld by a safety check).
- Nothing implements them. `The_multi_agent_contracts_exist_and_nothing_implements_them_yet` fails if an
  implementation appears in any layer, so adding one is a visible decision.
- The shape follows what the legacy room already does: a director decides who speaks next and each speaker says
  one line from the state of the room (`docs/legacy-audit/19-er-director-and-ending.md`).

## Extension points

| Point | Today | With agents |
|---|---|---|
| `ProcessPatientMessage` | Relays the room's request to the external service | Asks `IAgentOrchestrator.HandleTraineeMessageAsync` |
| `SimulationSession.Events` | Raised and unused outside tests | Fed to `IAgentOrchestrator.HandleSessionEventAsync` (a stage change, a harm, a result) |
| `IUnderstandingServiceGateway` | The only way out to a model | One of the tools an agent may use |
| `AgentContext` | Not built | Built by the application from the session and the conversation; it never carries the diagnosis or the scoring rules to an agent that plays a patient |

## Consequences

- The contracts are a proposal, not a proven design: they have no implementation to test them against. They are
  expected to change when the first agent is built, and changing them costs nothing today.
- The agents will need the conversation state on the server. Today the conversation lives in the browser, so the
  first step of the multi-agent phase is moving the room's conversation engine, not writing an agent.
