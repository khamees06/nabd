using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nabd.Application.Abstractions.Data;
using Nabd.Infrastructure.LegacyData;

namespace Nabd.Infrastructure;

/// <summary>Registers the infrastructure adapters with the container.</summary>
public static class DependencyInjection
{
    /// <summary>Adds the legacy data adapters and the external-service gateways.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<LegacyDataOptions>().Bind(configuration.GetSection(LegacyDataOptions.SectionName));
        services.AddSingleton<LegacyDataFiles>();
        services.AddSingleton<IClinicalCaseRepository, JsonClinicalCaseRepository>();
        services.AddSingleton<IClientDataDocumentSource, FileClientDataDocumentSource>();
        return services;
    }
}
