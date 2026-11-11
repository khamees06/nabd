using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Nabd.Application;
using Nabd.Infrastructure;
using Nabd.Web.ClientScripts;
using Nabd.Web.Controllers.Api;
using Nabd.Web.Http;

var builder = WebApplication.CreateBuilder(args);

// Presentation: MVC controllers and Razor views, plus the bundler that joins the client scripts.
builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(json => json.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    // A request body that cannot be read is answered with a plain problem document. The serializer's own
    // messages name internal types and are kept out of the response.
    .ConfigureApiBehaviorOptions(api => api.InvalidModelStateResponseFactory = context =>
        new ObjectResult(new ProblemDetails { Status = StatusCodes.Status400BadRequest, Title = "The request is not valid.", Detail = "The request body is missing, is not valid JSON, or has a field of the wrong type." })
        {
            StatusCode = StatusCodes.Status400BadRequest,
            ContentTypes = { "application/problem+json" },
        });
builder.Services.AddSingleton<IClientBundleProvider, ClientBundleProvider>();
builder.Services.AddProblemDetails();
builder.Services.AddNabdRateLimits(builder.Configuration);
builder.Services.AddOptions<ServerSessionsApiOptions>().Bind(builder.Configuration.GetSection(ServerSessionsApiOptions.SectionName));

// Application: the use cases. Infrastructure: legacy data, the session store, the gateway to the external services.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// The protective headers are written when the response starts, so an error response carries them too
// (the exception handler clears the headers that were set before the failure).
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        var headers = context.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers.XFrameOptions = "SAMEORIGIN";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        return Task.CompletedTask;
    });
    await next(context);
});

// A failure never shows its details to the browser: a short problem document, the details in the log.
app.UseExceptionHandler();

// Styles and images. Scripts and data are not static files: controllers serve them.
app.UseStaticFiles();
app.UseRateLimiter();
app.MapControllers();
app.MapMethods("/healthz", [HttpMethods.Get, HttpMethods.Head], () => Results.Text("ok"));

app.Run();

/// <summary>Entry point of the web host. Declared partial so integration tests can start the application.</summary>
public partial class Program;
