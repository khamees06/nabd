using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Nabd.Application;
using Nabd.Application.Abstractions.Agents;
using Nabd.Domain;
using Nabd.Infrastructure;

namespace Nabd.Tests.Architecture;

/// <summary>
/// The dependency rule of the solution, checked on the compiled assemblies: dependencies point inwards
/// (Web → Application → Domain, Infrastructure → Application → Domain) and never the other way.
/// </summary>
public class LayeringTests
{
    private static readonly Assembly Domain = DomainAssembly.Reference;
    private static readonly Assembly Application = ApplicationAssembly.Reference;
    private static readonly Assembly Infrastructure = InfrastructureAssembly.Reference;
    private static readonly Assembly Web = typeof(Program).Assembly;

    private static string[] References(Assembly assembly) => [.. assembly.GetReferencedAssemblies().Select(a => a.Name!)];

    [Fact]
    public void The_solution_has_exactly_the_five_projects()
    {
        var folder = new DirectoryInfo(AppContext.BaseDirectory);
        while (folder is not null && !File.Exists(Path.Combine(folder.FullName, "Nabd.sln"))) folder = folder.Parent;
        Assert.NotNull(folder);
        var projects = File.ReadAllLines(Path.Combine(folder.FullName, "Nabd.sln"))
            .Where(l => l.StartsWith("Project(", StringComparison.Ordinal) && l.Contains(".csproj", StringComparison.Ordinal))
            .Select(l => l.Split('"')[3])
            .Order(StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(["Nabd.Application", "Nabd.Domain", "Nabd.Infrastructure", "Nabd.Tests", "Nabd.Web"], projects);
    }

    [Fact]
    public void The_domain_depends_on_nothing_but_the_base_class_library()
    {
        var references = References(Domain);
        Assert.DoesNotContain(references, r => r.StartsWith("Nabd.", StringComparison.Ordinal));
        Assert.DoesNotContain(references, r => r.StartsWith("Microsoft.", StringComparison.Ordinal));
        Assert.DoesNotContain(references, r => r is "System.Net.Http" or "System.Text.Json" or "System.IO.FileSystem" or "System.Net.Primitives");
    }

    [Fact]
    public void The_application_depends_on_the_domain_only()
    {
        var references = References(Application);
        Assert.Equal(["Nabd.Domain"], references.Where(r => r.StartsWith("Nabd.", StringComparison.Ordinal)));
        Assert.DoesNotContain(references, r => r.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal));
        Assert.DoesNotContain(references, r => r is "System.Net.Http");
    }

    [Fact]
    public void Infrastructure_depends_on_application_and_domain_and_not_on_the_web()
    {
        var references = References(Infrastructure);
        Assert.Equal(["Nabd.Application", "Nabd.Domain"], references.Where(r => r.StartsWith("Nabd.", StringComparison.Ordinal)).Order(StringComparer.Ordinal));
        Assert.DoesNotContain(references, r => r.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal));
    }

    [Fact]
    public void No_inner_layer_knows_the_web()
    {
        foreach (var assembly in new[] { Domain, Application, Infrastructure })
        {
            Assert.DoesNotContain("Nabd.Web", References(assembly));
        }
    }

    [Fact]
    public void Controllers_reach_infrastructure_only_through_application_contracts()
    {
        var controllers = Web.GetTypes().Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract).ToList();
        Assert.NotEmpty(controllers);
        foreach (var controller in controllers)
        {
            var used = controller.GetConstructors().SelectMany(c => c.GetParameters()).Select(p => p.ParameterType)
                .Concat(controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly).SelectMany(m => m.GetParameters()).Select(p => p.ParameterType))
                .Concat(controller.GetFields(BindingFlags.NonPublic | BindingFlags.Instance).Select(f => f.FieldType));
            Assert.DoesNotContain(used, t => t.Assembly == Infrastructure);
        }
    }

    [Fact]
    public void Every_use_case_is_a_sealed_class_with_one_handle_method()
    {
        var useCases = Application.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false, IsPublic: true } && t.GetMethod("HandleAsync") is not null)
            .ToList();
        Assert.Equal(
            ["AdvanceSimulation", "CompleteSimulation", "ExecuteIntervention", "GenerateSessionReport", "ProcessPatientMessage", "ReportHarmfulOrder", "RequestMedicalTest", "StartSimulationSession"],
            useCases.Select(t => t.Name).Order(StringComparer.Ordinal));
        Assert.All(useCases, t => Assert.True(t.IsSealed, $"{t.Name} should be sealed"));
    }

    [Fact]
    public void The_multi_agent_contracts_exist_and_nothing_implements_them_yet()
    {
        Type[] contracts = [typeof(IAgentOrchestrator), typeof(IRoomAgent), typeof(IPatientAgent), typeof(ICompanionAgent), typeof(INurseAgent), typeof(ISupervisorAgent)];
        Assert.All(contracts, c => Assert.True(c.IsInterface));
        var implementations = new[] { Domain, Application, Infrastructure, Web }
            .SelectMany(a => a.GetTypes())
            .Where(t => t.IsClass && contracts.Any(c => c.IsAssignableFrom(t)))
            .Select(t => t.FullName);
        Assert.Empty(implementations);
    }

    [Fact]
    public void Domain_types_carry_no_serialization_or_framework_attributes()
    {
        var offenders = Domain.GetTypes()
            .Where(t => t.GetCustomAttributesData().Any(a => a.AttributeType.Namespace is { } ns
                && (ns.StartsWith("System.Text.Json", StringComparison.Ordinal) || ns.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal) || ns.StartsWith("System.ComponentModel.DataAnnotations", StringComparison.Ordinal))))
            .Select(t => t.FullName);
        Assert.Empty(offenders);
    }
}
