using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using func_sharepoint_prod_001.Models;

namespace func_sharepoint_prod_001
{
    public class HealthCheck
    {
        private readonly ILogger _logger;
        private readonly AzureAdOptions _azureAdOptions;

        public HealthCheck(ILoggerFactory loggerFactory, IOptions<AzureAdOptions> azureAdOptions)
        {
            _logger = loggerFactory.CreateLogger<HealthCheck>();
            _azureAdOptions = azureAdOptions.Value;
        }

        [Function("HealthCheck")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
        {
            try
            {
                _logger.LogInformation("=== Health Check Started ===");

                // Kontrollera Azure AD konfiguration
                var healthStatus = new
                {
                    Status = "Healthy",
                    Timestamp = DateTime.UtcNow,
                    Configuration = new
                    {
                        AzureAdClientIdConfigured = !string.IsNullOrEmpty(_azureAdOptions.ClientId),
                        AzureAdTenantIdConfigured = !string.IsNullOrEmpty(_azureAdOptions.TenantId),
                        AzureAdClientSecretConfigured = !string.IsNullOrEmpty(_azureAdOptions.ClientSecret),
                        Authority = _azureAdOptions.Authority,
                        Scopes = _azureAdOptions.Scopes
                    },
                    Environment = new
                    {
                        MachineName = Environment.MachineName,
                        OSVersion = Environment.OSVersion.ToString(),
                        ProcessorCount = Environment.ProcessorCount
                    },
                    RequestInfo = new
                    {
                        Headers = req.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)),
                        Method = req.Method,
                        Url = req.Url.ToString()
                    }
                };

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(healthStatus);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed: {Message}", ex.Message);

                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new
                {
                    Status = "Unhealthy",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
                return errorResponse;
            }
        }
    }
}