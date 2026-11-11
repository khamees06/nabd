using Nabd.Application.Abstractions.Data;
using Nabd.Domain.Cases;
using Nabd.Domain.Catalog;
using Nabd.Infrastructure.LegacyData.ErCases;

namespace Nabd.Infrastructure.LegacyData;

/// <summary>
/// Cases and catalog read from the legacy er-cases.json. The file is read and mapped once, on first use; the
/// domain objects it yields are immutable, so one copy serves every request.
/// </summary>
public sealed class JsonClinicalCaseRepository : IClinicalCaseRepository
{
    private readonly LegacyDataFiles _files;
    private readonly Lock _gate = new();
    private Task<ErCaseFile>? _file;

    /// <summary>Creates the repository over the legacy data files.</summary>
    public JsonClinicalCaseRepository(LegacyDataFiles files)
    {
        ArgumentNullException.ThrowIfNull(files);
        _files = files;
    }

    /// <summary>The mapped file. A load that failed is not remembered: the next caller tries again.</summary>
    private Task<ErCaseFile> FileAsync(CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            if (_file is null || _file.IsFaulted || _file.IsCanceled) _file = LoadAsync();
            return _file.WaitAsync(cancellationToken);
        }
    }

    private async Task<ErCaseFile> LoadAsync() =>
        ErCaseFileMapper.Map(await _files.ReadAsync(LegacyDataFiles.ErCases).ConfigureAwait(false));

    /// <inheritdoc />
    public async Task<ClinicalCatalog> GetCatalogAsync(CancellationToken cancellationToken = default) =>
        (await FileAsync(cancellationToken).ConfigureAwait(false)).Catalog;

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ListCaseIdsAsync(CancellationToken cancellationToken = default) =>
        [.. (await FileAsync(cancellationToken).ConfigureAwait(false)).Cases.Select(c => c.Id)];

    /// <inheritdoc />
    public async Task<ClinicalCase?> FindAsync(string caseId, CancellationToken cancellationToken = default) =>
        (await FileAsync(cancellationToken).ConfigureAwait(false)).Cases.FirstOrDefault(c => c.Id == caseId);

    /// <inheritdoc />
    public async Task<bool> IsClinicallyReviewedAsync(CancellationToken cancellationToken = default) =>
        (await FileAsync(cancellationToken).ConfigureAwait(false)).Reviewed;
}
