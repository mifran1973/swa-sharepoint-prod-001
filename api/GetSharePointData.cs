using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using System.Threading.Tasks;
using System.Net;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using func_sharepoint_prod_001.Services;

namespace func_sharepoint_prod_001
{
    public class GetSharePointData
    {
        private readonly ILogger _logger;
        private readonly IGraphAuthenticationService _graphAuthService;

        public GetSharePointData(ILoggerFactory loggerFactory, IGraphAuthenticationService graphAuthService)
        {
            _logger = loggerFactory.CreateLogger<GetSharePointData>();
            _graphAuthService = graphAuthService;
        }

        [Function("GetSharePointData")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            try
            {
                _logger.LogInformation("=== Starting GetSharePointData request ===");

                // Log alla headers för debugging
                _logger.LogInformation("Request headers:");
                foreach (var header in req.Headers)
                {
                    _logger.LogInformation("  {HeaderName}: {HeaderValue}", header.Key, string.Join(", ", header.Value));
                }

                // Säker header-extraktion för Authorization
                string? authHeader = null;
                try
                {
                    if (req.Headers.TryGetValues("Authorization", out var authValues))
                    {
                        authHeader = authValues.FirstOrDefault();
                        _logger.LogInformation("Authorization header found: {AuthHeaderStart}",
                            authHeader?.Substring(0, Math.Min(20, authHeader?.Length ?? 0)) + "...");
                    }
                    else
                    {
                        _logger.LogInformation("No Authorization header found");
                    }
                }
                catch (Exception headerEx)
                {
                    _logger.LogWarning(headerEx, "Error reading Authorization header, continuing without user auth");
                    authHeader = null;
                }

                // SÄKERHETSKONTROLL: Kräv user authorization
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("No valid Authorization header provided - access denied for security");
                    var unauthorizedResponse = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await unauthorizedResponse.WriteStringAsync("Authorization header with valid Bearer token is required for security. User authentication mandatory.");
                    return unauthorizedResponse;
                }

                _logger.LogInformation("Valid Bearer token detected, proceeding with user authentication");

                // Få rätt GraphServiceClient med robustare error handling
                GraphServiceClient graphServiceClient;
                try
                {
                    graphServiceClient = await _graphAuthService.GetGraphServiceClientAsync(authHeader);
                    _logger.LogInformation("GraphServiceClient created successfully");
                }
                catch (Exception authEx)
                {
                    _logger.LogError(authEx, "Failed to create GraphServiceClient, this should not happen due to fallback logic");
                    var authErrorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                    await authErrorResponse.WriteStringAsync($"Authentication service error: {authEx.Message}");
                    return authErrorResponse;
                }

                // Använd specifika Site ID och List ID för bättre prestanda och säkerhet
                var siteId = "xzk57.sharepoint.com,662692cc-5daf-4766-85d8-8051823dfffa,63b107f3-3092-4203-bcdd-05ef41aad476";
                var listId = "cc4738d4-2058-4920-a16c-ebfa2e1b4303";

                _logger.LogInformation("Using direct Site ID: {SiteId} and List ID: {ListId}", siteId, listId);

                // Kontrollera site access med user permissions
                Site? site = null;
                try
                {
                    site = await graphServiceClient.Sites[siteId]
                        .GetAsync();
                    _logger.LogInformation("Successfully accessed site: {SiteName} with user context", site?.DisplayName ?? "Unknown");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "User does not have access to SharePoint site {SiteId}", siteId);
                    var accessErrorResponse = req.CreateResponse(HttpStatusCode.Forbidden);
                    await accessErrorResponse.WriteStringAsync($"Access denied to SharePoint site. User may not have required permissions.");
                    return accessErrorResponse;
                }

                // Kontrollera list access med user permissions
                Microsoft.Graph.Models.List? list = null;
                try
                {
                    list = await graphServiceClient.Sites[siteId]
                        .Lists[listId]
                        .GetAsync();
                    _logger.LogInformation("Successfully accessed list: {ListName} with user context", list?.DisplayName ?? "Unknown");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "User does not have access to list {ListId} in site {SiteId}", listId, siteId);
                    var listAccessErrorResponse = req.CreateResponse(HttpStatusCode.Forbidden);
                    await listAccessErrorResponse.WriteStringAsync($"Access denied to Tickets list. User may not have required permissions.");
                    return listAccessErrorResponse;
                }

                // Hämta list items direkt med user-specifika permissions
                var items = await graphServiceClient.Sites[siteId]
                    .Lists[listId]
                    .Items
                    .GetAsync(requestConfiguration =>
                    {
                        // Lägg till expand för att få mer detaljerad data
                        requestConfiguration.QueryParameters.Expand = new string[] { "fields" };
                        // Begränsa antal items för prestanda
                        requestConfiguration.QueryParameters.Top = 100;
                    });

                // Skapa response med användarkontext (alltid User eftersom auth är obligatorisk)
                var userInfo = new Dictionary<string, object>();

                // Extrahera user info från token för säkerhetslogging och response
                try
                {
                    var userToken = authHeader.Substring("Bearer ".Length).Trim();
                    var handler = new JwtSecurityTokenHandler();
                    if (handler.CanReadToken(userToken))
                    {
                        var jwtToken = handler.ReadJwtToken(userToken);
                        userInfo["UserId"] = jwtToken.Claims.FirstOrDefault(c => c.Type == "oid")?.Value ?? "Unknown";
                        userInfo["UserName"] = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "Unknown";
                        userInfo["Email"] = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == "upn")?.Value ?? "Unknown";
                    }
                }
                catch (Exception tokenEx)
                {
                    _logger.LogWarning(tokenEx, "Could not parse user token for response");
                    userInfo["Error"] = "Could not parse user information from token";
                }

                var responseData = new
                {
                    AuthenticationType = "User", // Alltid User eftersom auth är obligatorisk
                    UserContext = userInfo.Count > 0 ? (object)userInfo : new { Error = "Could not parse user information" },
                    SecurityNote = "Data filtered by user SharePoint permissions - secure user isolation guaranteed",
                    SiteId = siteId,
                    ListId = listId,
                    ItemCount = items?.Value?.Count ?? 0,
                    Items = items?.Value ?? new List<ListItem>(),
                    Timestamp = DateTime.UtcNow
                };

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(responseData);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching SharePoint data: {Message}", ex.Message);
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteStringAsync($"Error: {ex.Message}");
                return errorResponse;
            }
        }
    }
}
