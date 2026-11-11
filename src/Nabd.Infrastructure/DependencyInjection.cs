using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Nabd.Application.Abstractions.Ai;
using Nabd.Application.Abstractions.Data;
using Nabd.Application.Abstractions.Simulation;
using Nabd.Infrastructure.Ai;
using Nabd.Infrastructure.LegacyData;
using Nabd.Infrastructure.Simulation;

namespace Nabd.Infrastructure;

/// <summary>Registers the infrastructure adapters with the container.</summary>
public static class DependencyInjection
{
    /// <summary>Adds the legacy data adapters, the session store and the gateway to the understanding services.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // Legacy JSON data, read only here.
        services.AddOptions<LegacyDataOptions>().Bind(configuration.GetSection(LegacyDataOptions.SectionName));
        services.AddSingleton<LegacyDataFiles>();
        services.AddSingleton<IClinicalCaseRepository, JsonClinicalCaseRepository>();
        services.AddSingleton<IClientDataDocumentSource, FileClientDataDocumentSource>();

        // Simulation sessions, in memory.
        services.TryAddSingleton(TimeProvider.System);
        services.AddOptions<SessionStoreOptions>().Bind(configuration.GetSection(SessionStoreOptions.SectionName));
        services.AddSingleton<ISimulationSessionStore, InMemorySimulationSessionStore>();

        // The external understanding services.
        services.AddOptions<UnderstandingServicesOptions>().Bind(configuration.GetSection(UnderstandingServicesOptions.SectionName));
        services.AddHttpClient(HttpUnderstandingServiceGateway.HttpClientName, client =>
        {
            // Each request carries its own, shorter time limit; this is only the outer bound.
            client.Timeout = TimeSpan.FromSeconds(65);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Nabd/1.0");
        });
        services.AddSingleton<IUnderstandingServiceGateway, HttpUnderstandingServiceGateway>();
        return services;
    }
}
