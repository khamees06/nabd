using System.Text.Json.Serialization;
using Nabd.Application;
using Nabd.Infrastructure;
using Nabd.Web.ClientScripts;
using Nabd.Web.Controllers.Api;
using Nabd.Web.Http;

var builder = WebApplication.CreateBuilder(args);

// Presentation: MVC controllers and Razor views, plus the bundler that joins the client scripts.
builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(json => json.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSingleton<IClientBundleProvider, ClientBundleProvider>();
builder.Services.AddProblemDetails();
builder.Services.AddNabdRateLimits(builder.Configuration);
builder.Services.AddOptions<ServerSessionsApiOptions>().Bind(builder.Configuration.GetSection(ServerSessionsApiOptions.SectionName));

// Application: the use cases. Infrastructure: legacy data, the session store, the gateway to the external services.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// A failure never shows its details to the browser: a short problem document, the details in the log.
app.UseExceptionHandler();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.XContentTypeOptions = "nosniff";
    headers.XFrameOptions = "SAMEORIGIN";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next(context);
});

// Styles and images. Scripts and data are not static files: controllers serve them.
app.UseStaticFiles();
app.UseRateLimiter();
app.MapControllers();
app.MapGet("/healthz", () => Results.Text("ok"));

app.Run();

/// <summary>Entry point of the web host. Declared partial so integration tests can start the application.</summary>
public partial class Program;
