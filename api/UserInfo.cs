using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Text.Json;

namespace func_sharepoint_prod_001
{
    public class UserInfo
    {
        private readonly ILogger _logger;

        public UserInfo(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<UserInfo>();
        }

        [Function("UserInfo")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
        {
            try
            {
                _logger.LogInformation("=== UserInfo request started ===");

                // Log alla headers för debugging
                _logger.LogInformation("All request headers:");
                foreach (var header in req.Headers)
                {
                    _logger.LogInformation("  {HeaderName}: {HeaderValue}", header.Key, string.Join(", ", header.Value));
                }

                // Säker header-extraktion för Authorization
                string? authHeader = null;
                if (req.Headers.TryGetValues("Authorization", out var authValues))
                {
                    authHeader = authValues.FirstOrDefault();
                }

                if (string.IsNullOrEmpty(authHeader) ||
                    !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var anonymousResponse = req.CreateResponse(HttpStatusCode.OK);
                    await anonymousResponse.WriteAsJsonAsync(new
                    {
                        AuthenticationType = "Anonymous/ManagedIdentity",
                        Message = "No user authentication detected",
                        Headers = req.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)),
                        Timestamp = DateTime.UtcNow
                    });
                    return anonymousResponse;
                }

                var userToken = authHeader.Substring("Bearer ".Length).Trim();

                // Läs JWT token
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(userToken))
                {
                    var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await errorResponse.WriteStringAsync("Invalid JWT token format");
                    return errorResponse;
                }

                var jwtToken = handler.ReadJwtToken(userToken);

                // Extrahera användarinformation
                var userInfo = new
                {
                    AuthenticationType = "User",
                    UserId = jwtToken.Claims.FirstOrDefault(c => c.Type == "oid")?.Value,
                    UserPrincipalName = jwtToken.Claims.FirstOrDefault(c => c.Type == "upn")?.Value,
                    Name = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value,
                    Email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value,
                    TenantId = jwtToken.Claims.FirstOrDefault(c => c.Type == "tid")?.Value,
                    Audience = jwtToken.Claims.FirstOrDefault(c => c.Type == "aud")?.Value,
                    Issuer = jwtToken.Claims.FirstOrDefault(c => c.Type == "iss")?.Value,
                    ExpirationTime = DateTimeOffset.FromUnixTimeSeconds(long.Parse(
                        jwtToken.Claims.FirstOrDefault(c => c.Type == "exp")?.Value ?? "0")).ToString(),
                    Scopes = jwtToken.Claims.FirstOrDefault(c => c.Type == "scp")?.Value?.Split(' ') ?? Array.Empty<string>()
                };

                _logger.LogInformation("User authenticated: {UserId}", userInfo.UserId);

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(userInfo);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing user info: {Message}", ex.Message);
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteStringAsync($"Error: {ex.Message}");
                return errorResponse;
            }
        }
    }
}