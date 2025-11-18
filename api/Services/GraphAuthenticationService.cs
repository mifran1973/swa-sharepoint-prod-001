using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using System.IdentityModel.Tokens.Jwt;
using func_sharepoint_prod_001.Models;

namespace func_sharepoint_prod_001.Services
{
    public interface IGraphAuthenticationService
    {
        Task<GraphServiceClient> GetGraphServiceClientAsync(string? authorizationHeader);
    }

    public class GraphAuthenticationService : IGraphAuthenticationService
    {
        private readonly ILogger<GraphAuthenticationService> _logger;
        private readonly AzureAdOptions _azureAdOptions;
        private readonly GraphServiceClient _managedIdentityGraphClient;

        public GraphAuthenticationService(
            ILogger<GraphAuthenticationService> logger,
            IConfiguration configuration,
            GraphServiceClient managedIdentityGraphClient)
        {
            _logger = logger;
            _managedIdentityGraphClient = managedIdentityGraphClient;

            _azureAdOptions = new AzureAdOptions();
            configuration.GetSection(AzureAdOptions.SectionName).Bind(_azureAdOptions);
        }

        public async Task<GraphServiceClient> GetGraphServiceClientAsync(string? authorizationHeader)
        {
            _logger.LogInformation("=== GraphAuthenticationService: Starting authentication ===");

            // SÄKERHETSKRAV: Authorization header är obligatorisk
            if (string.IsNullOrEmpty(authorizationHeader))
            {
                _logger.LogError("No Authorization header provided - access denied for security");
                throw new UnauthorizedAccessException("Authorization header with Bearer token is required for security. No fallback to system identity allowed.");
            }

            if (!authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError("Invalid Authorization header format - must start with 'Bearer '. Header: {Header}",
                    authorizationHeader.Substring(0, Math.Min(20, authorizationHeader.Length)));
                throw new UnauthorizedAccessException("Invalid Authorization header format. Must start with 'Bearer ' followed by a valid token.");
            }

            try
            {
                // Extrahera user token från Authorization header
                var userToken = authorizationHeader.Substring("Bearer ".Length).Trim();
                _logger.LogInformation("Extracted user token, length: {TokenLength}", userToken.Length);

                // Validera token format - OBLIGATORISK för säkerhet
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(userToken))
                {
                    _logger.LogError("Invalid JWT token format provided");
                    throw new UnauthorizedAccessException("Invalid JWT token format. Please provide a valid Bearer token.");
                }

                var jwtToken = handler.ReadJwtToken(userToken);
                var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == "oid")?.Value ?? "Unknown";
                var userName = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "Unknown";
                var tenantId = jwtToken.Claims.FirstOrDefault(c => c.Type == "tid")?.Value ?? "Unknown";

                _logger.LogInformation("Processing user token for user: {UserId} ({UserName}) in tenant: {TenantId}",
                    userId, userName, tenantId);

                // Kontrollera Azure AD konfiguration - OBLIGATORISK för säkerhet
                if (string.IsNullOrEmpty(_azureAdOptions.ClientId) ||
                    string.IsNullOrEmpty(_azureAdOptions.ClientSecret) ||
                    string.IsNullOrEmpty(_azureAdOptions.TenantId))
                {
                    _logger.LogError("Azure AD configuration is incomplete - no fallback allowed for security. ClientId: {ClientId}, TenantId: {TenantId}",
                        !string.IsNullOrEmpty(_azureAdOptions.ClientId) ? "SET" : "MISSING",
                        !string.IsNullOrEmpty(_azureAdOptions.TenantId) ? "SET" : "MISSING");
                    throw new InvalidOperationException("Azure AD configuration is incomplete. ClientId, ClientSecret, and TenantId are required for secure operation.");
                }

                // Använd On-Behalf-Of flow för att få Graph access token
                _logger.LogInformation("Attempting On-Behalf-Of token acquisition...");
                var graphClient = await GetOnBehalfOfGraphClientAsync(userToken);
                _logger.LogInformation("Successfully created user-specific Graph client");
                return graphClient;
            }
            catch (MsalException msalEx)
            {
                _logger.LogError(msalEx, "MSAL error during On-Behalf-Of flow: {ErrorCode} - {ErrorDescription}",
                    msalEx.ErrorCode, msalEx.Message);
                throw new UnauthorizedAccessException($"Failed to authenticate user token: {msalEx.Message}", msalEx);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating user-specific Graph client");
                throw new UnauthorizedAccessException($"Authentication failed: {ex.Message}", ex);
            }
        }

        private async Task<GraphServiceClient> GetOnBehalfOfGraphClientAsync(string userToken)
        {
            try
            {
                _logger.LogInformation("Building MSAL ConfidentialClientApplication...");
                var app = ConfidentialClientApplicationBuilder
                    .Create(_azureAdOptions.ClientId)
                    .WithClientSecret(_azureAdOptions.ClientSecret)
                    .WithAuthority(_azureAdOptions.Authority)
                    .Build();

                var userAssertion = new UserAssertion(userToken);
                _logger.LogInformation("Created UserAssertion, attempting token acquisition for scopes: {Scopes}",
                    string.Join(", ", _azureAdOptions.Scopes));

                var result = await app.AcquireTokenOnBehalfOf(_azureAdOptions.Scopes, userAssertion)
                    .ExecuteAsync();

                _logger.LogInformation("Successfully acquired OBO token. Expires: {ExpiresOn}", result.ExpiresOn);

                var credential = new DelegateTokenCredential((tokenRequestContext, cancellationToken) =>
                {
                    return Task.FromResult(new Azure.Core.AccessToken(result.AccessToken, result.ExpiresOn));
                });

                return new GraphServiceClient(credential);
            }
            catch (MsalUiRequiredException uiEx)
            {
                _logger.LogError(uiEx, "User interaction required for On-Behalf-Of flow: {ErrorCode}", uiEx.ErrorCode);
                throw;
            }
            catch (MsalServiceException serviceEx)
            {
                _logger.LogError(serviceEx, "MSAL service error during On-Behalf-Of flow: {ErrorCode} - {Claims}",
                    serviceEx.ErrorCode, serviceEx.Claims);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during On-Behalf-Of token acquisition");
                throw;
            }
        }
    }

    // Hjälpklass för DelegateTokenCredential
    public class DelegateTokenCredential : Azure.Core.TokenCredential
    {
        private readonly Func<Azure.Core.TokenRequestContext, CancellationToken, Task<Azure.Core.AccessToken>> _getToken;

        public DelegateTokenCredential(Func<Azure.Core.TokenRequestContext, CancellationToken, Task<Azure.Core.AccessToken>> getToken)
        {
            _getToken = getToken;
        }

        public override Azure.Core.AccessToken GetToken(Azure.Core.TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return GetTokenAsync(requestContext, cancellationToken).GetAwaiter().GetResult();
        }

        public override ValueTask<Azure.Core.AccessToken> GetTokenAsync(Azure.Core.TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            return new ValueTask<Azure.Core.AccessToken>(_getToken(requestContext, cancellationToken));
        }
    }
}