using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Graph;
using Azure.Identity;
using func_sharepoint_prod_001.Services;
using func_sharepoint_prod_001.Models;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Konfigurera Azure AD options
builder.Services.Configure<AzureAdOptions>(
    builder.Configuration.GetSection(AzureAdOptions.SectionName));

// Registrera GraphServiceClient med managed identity (för fallback)
builder.Services.AddSingleton<GraphServiceClient>(provider =>
{
    var credential = new DefaultAzureCredential();
    return new GraphServiceClient(credential);
});

// Registrera authentication service
builder.Services.AddScoped<IGraphAuthenticationService, GraphAuthenticationService>();

// Application Insights isn't enabled by default. See https://aka.ms/AAt8mw4.
// builder.Services
//     .AddApplicationInsightsTelemetryWorkerService()
//     .ConfigureFunctionsApplicationInsights();

builder.Build().Run();
