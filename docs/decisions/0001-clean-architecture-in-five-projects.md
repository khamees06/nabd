# 0001 — Clean Architecture in five projects, with plain use-case classes

Status: accepted · 2026-11-11

## Context

The legacy site was one HTML file, nine stylesheets and six scripts with no boundaries: clinical rules, rendering,
storage and network calls were mixed in the same functions. The refactoring brief fixes the shape of the new
solution: exactly five projects (`Nabd.Domain`, `Nabd.Application`, `Nabd.Infrastructure`, `Nabd.Web`,
`Nabd.Tests`) on ASP.NET Core MVC.

## Decision

- Dependencies point inwards: Web → Application → Domain, Infrastructure → Application → Domain. Web references
  Infrastructure only in `Program.cs`, to register it.
- The domain has no package references at all.
- A use case is one sealed class with one `HandleAsync` method, registered directly with the container. There is
  no mediator library: with eight use cases it would add indirection and a dependency without removing any code.
- A use case reports an expected failure as a `Result<T>` with an `ErrorKind`; the controller maps the kind to a
  status code. Exceptions are for broken invariants (`DomainException`) and programming errors.
- The rule is enforced by tests on the compiled assemblies (`LayeringTests`), not by convention.

## Consequences

- A new use case costs one class and one line of registration.
- A reference that breaks the rule fails the build's test run, with the name of the offending reference.
- Cross-cutting behaviour (logging, validation) is written where it is needed instead of in a pipeline. If the
  number of use cases grows large, a pipeline can be introduced without changing their signatures.
