using Nabd.Domain.Cases;
using Nabd.Domain.Catalog;

namespace Nabd.Application.Abstractions.Data;

/// <summary>Read access to the emergency cases and to the catalog of interventions and tests they share.</summary>
public interface IClinicalCaseRepository
{
    /// <summary>The catalog of interventions and tests.</summary>
    Task<ClinicalCatalog> GetCatalogAsync(CancellationToken cancellationToken = default);

    /// <summary>The ids of every case, in the order of the data source.</summary>
    Task<IReadOnlyList<string>> ListCaseIdsAsync(CancellationToken cancellationToken = default);

    /// <summary>The case with this id, or null when there is none.</summary>
    Task<ClinicalCase?> FindAsync(string caseId, CancellationToken cancellationToken = default);

    /// <summary>
    /// True when the source marks its clinical content as reviewed by a physician. The current data is not.
    /// </summary>
    Task<bool> IsClinicallyReviewedAsync(CancellationToken cancellationToken = default);
}
