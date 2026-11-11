using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Nabd.Application.Common;
using Nabd.Application.Simulation;
using Nabd.Domain.Simulation;
using Nabd.Domain.Simulation.Scoring;
using Nabd.Web.Http;

namespace Nabd.Web.Controllers.Api;

/// <summary>Whether the server-side session API is reachable.</summary>
public sealed class ServerSessionsApiOptions
{
    /// <summary>Configuration section name.</summary>
    public const string SectionName = "Simulation:ServerSessionsApi";

    /// <summary>
    /// False (the default) answers every request 404. The browser-side room does not use this API yet, so it is
    /// switched on only where it is being developed or tested.
    /// </summary>
    public bool Enabled { get; set; }
}

/// <summary>
/// Answers 404 while the session API is switched off, before the request body is read or anything else runs:
/// a switched-off API must look as if it did not exist, whatever is sent to it.
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class ServerSessionsApiGateAttribute : Attribute, IResourceFilter, IOrderedFilter
{
    /// <summary>Runs before every other filter of the controller.</summary>
    public int Order => int.MinValue;

    /// <inheritdoc />
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        var options = context.HttpContext.RequestServices.GetRequiredService<IOptions<ServerSessionsApiOptions>>();
        if (!options.Value.Enabled) context.Result = new NotFoundResult();
    }

    /// <inheritdoc />
    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}

/// <summary>
/// The server-side simulation session, over HTTP: start a session, let time pass, give treatments, order tests,
/// hand over, read the report. Each action delegates to one use case of the application layer.
/// </summary>
/// <remarks>
/// A response carries only what a trainee may see (the monitor, the stage, what was done). The patient's risk,
/// the indication of a test and the scoring rules stay on the server until the report.
/// </remarks>
[ApiController]
[Route("api/simulation/sessions")]
[ServerSessionsApiGate]
[SameOriginOnly]
[RequestSizeLimit(16 * 1024)]
[EnableRateLimiting(RateLimitPolicies.Simulation)]
public sealed class SimulationSessionsController : ControllerBase
{
    /// <summary>Body of the request that starts a session.</summary>
    public sealed record StartRequest(string CaseId, TraineeRole Role = TraineeRole.Doctor);

    /// <summary>Body of the request that lets time pass.</summary>
    public sealed record AdvanceRequest(double ElapsedSeconds);

    /// <summary>Body of the request that carries out an intervention.</summary>
    public sealed record InterventionRequest(string ActionId, string? Dose = null, double Amount = 0, Titration Titration = Titration.None);

    /// <summary>Body of the request that reports a harmful order.</summary>
    public sealed record HarmfulOrderRequest(string ActionId, string? Dose, HarmProfile Harm, bool Allergic = false);

    /// <summary>Body of the request that orders a test.</summary>
    public sealed record TestRequest(string TestId, string ReasonGrade = "ungraded");

    /// <summary>Body of the request that completes a session.</summary>
    public sealed record CompletionRequest(
        HandoverAssessment? Handover,
        CommunicationRecord Communication,
        IReadOnlyList<string>? HistoryObtained = null,
        IReadOnlyList<string>? ExaminationsDone = null,
        int RejectedDoses = 0,
        IReadOnlyList<TestNote>? TestNotes = null);

    /// <summary>Starts a session. Starting is limited more tightly than the rest: the store holds a fixed number of sessions.</summary>
    [HttpPost("")]
    [EnableRateLimiting(RateLimitPolicies.SimulationStart)]
    public async Task<IActionResult> Start([FromBody] StartRequest request, [FromServices] StartSimulationSession useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new StartSimulationSessionCommand(request.CaseId, request.Role), cancellationToken), StatusCodes.Status201Created);

    /// <summary>Lets simulated time pass.</summary>
    [HttpPost("{id}/advance")]
    public async Task<IActionResult> Advance(string id, [FromBody] AdvanceRequest request, [FromServices] AdvanceSimulation useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new AdvanceSimulationCommand(id, request.ElapsedSeconds), cancellationToken));

    /// <summary>Carries out an intervention.</summary>
    [HttpPost("{id}/interventions")]
    public async Task<IActionResult> Intervene(string id, [FromBody] InterventionRequest request, [FromServices] ExecuteIntervention useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new ExecuteInterventionCommand(id, request.ActionId, request.Dose ?? "", request.Amount, request.Titration), cancellationToken));

    /// <summary>Reports an order that was judged harmful and given anyway.</summary>
    [HttpPost("{id}/harmful-orders")]
    public async Task<IActionResult> Harm(string id, [FromBody] HarmfulOrderRequest request, [FromServices] ReportHarmfulOrder useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new ReportHarmfulOrderCommand(id, request.ActionId, request.Dose ?? "", request.Harm, request.Allergic), cancellationToken));

    /// <summary>Orders a test.</summary>
    [HttpPost("{id}/tests")]
    public async Task<IActionResult> OrderTest(string id, [FromBody] TestRequest request, [FromServices] RequestMedicalTest useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new RequestMedicalTestCommand(id, request.TestId, request.ReasonGrade), cancellationToken));

    /// <summary>Hands the patient over and returns the report.</summary>
    [HttpPost("{id}/completion")]
    public async Task<IActionResult> Complete(string id, [FromBody] CompletionRequest request, [FromServices] CompleteSimulation useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new CompleteSimulationCommand(id, request.Handover, request.Communication, request.HistoryObtained, request.ExaminationsDone, request.RejectedDoses, request.TestNotes), cancellationToken));

    /// <summary>The report of a completed session.</summary>
    [HttpGet("{id}/report")]
    public async Task<IActionResult> Report(string id, [FromServices] GenerateSessionReport useCase, CancellationToken cancellationToken) =>
        ToResponse(await useCase.HandleAsync(new GenerateSessionReportQuery(id), cancellationToken));

    private IActionResult ToResponse<T>(Result<T> result, int successStatus = StatusCodes.Status200OK)
    {
        Response.Headers.CacheControl = "no-store";
        if (result.IsSuccess) return StatusCode(successStatus, result.Value);
        var status = result.Error!.Kind switch
        {
            ErrorKind.Invalid => StatusCodes.Status400BadRequest,
            ErrorKind.NotFound => StatusCodes.Status404NotFound,
            ErrorKind.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status503ServiceUnavailable,
        };
        return Problem(detail: result.Error.Message, statusCode: status);
    }
}
