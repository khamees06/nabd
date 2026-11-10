using Nabd.Application;
using Nabd.Domain;
using Nabd.Infrastructure;

namespace Nabd.Tests.Architecture;

public class SolutionSmokeTests
{
    [Fact]
    public void Every_layer_assembly_loads()
    {
        Assert.Equal("Nabd.Domain", DomainAssembly.Reference.GetName().Name);
        Assert.Equal("Nabd.Application", ApplicationAssembly.Reference.GetName().Name);
        Assert.Equal("Nabd.Infrastructure", InfrastructureAssembly.Reference.GetName().Name);
    }
}
