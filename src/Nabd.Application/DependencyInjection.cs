using Microsoft.Extensions.DependencyInjection;
using Nabd.Application.Dialogue;
using Nabd.Application.Simulation;

namespace Nabd.Application;

/// <summary>Registers the use cases with the container.</summary>
public static class DependencyInjection
{
    /// <summary>Adds every use case. Use cases keep no state, so one instance per request is enough.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);
        services.AddScoped<StartSimulationSession>();
        services.AddScoped<AdvanceSimulation>();
        services.AddScoped<ExecuteIntervention>();
        services.AddScoped<ReportHarmfulOrder>();
        services.AddScoped<RequestMedicalTest>();
        services.AddScoped<CompleteSimulation>();
        services.AddScoped<GenerateSessionReport>();
        services.AddScoped<ProcessPatientMessage>();
        return services;
    }
}
