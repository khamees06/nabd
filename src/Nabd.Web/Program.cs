var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

var app = builder.Build();

app.MapGet("/healthz", () => Results.Text("ok"));

app.Run();

/// <summary>Entry point of the web host. Declared partial so integration tests can start the application.</summary>
public partial class Program;
