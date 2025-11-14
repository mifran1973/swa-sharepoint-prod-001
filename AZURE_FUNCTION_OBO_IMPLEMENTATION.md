# 🔐 AZURE FUNCTION: Implementera On-Behalf-Of Flow för Säkerhet

## 🚨 KRITISK SÄKERHETSUPPDATERING BEHÖVS

**Problem:** Nuvarande Azure Function använder Application permissions (Managed Identity) vilket ger ALLA användare tillgång till ALLA SharePoint-data.

**Lösning:** Implementera On-Behalf-Of (OBO) flow för användarspecifik åtkomst.

## 📋 IMPLEMENTATIONSPLAN

### 1. Uppdatera GetSharePointData.cs

```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using System.Net;
using System.Text.Json;

namespace SharePointFunction
{
    public class GetSharePointData
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;

        public GetSharePointData(ILoggerFactory loggerFactory, IConfiguration configuration)
        {
            _logger = loggerFactory.CreateLogger<GetSharePointData>();
            _configuration = configuration;
        }

        [Function("GetSharePointData")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            _logger.LogInformation("🔐 GetSharePointData function started with OBO flow");

            try
            {
                // Hämta och validera Authorization header
                if (!req.Headers.TryGetValues("Authorization", out var authValues))
                {
                    _logger.LogWarning("❌ No Authorization header found");
                    return CreateErrorResponse(req, "Authentication required", HttpStatusCode.Unauthorized);
                }

                var userToken = authValues.FirstOrDefault()?.Replace("Bearer ", "");
                if (string.IsNullOrEmpty(userToken))
                {
                    _logger.LogWarning("❌ Invalid Authorization header format");
                    return CreateErrorResponse(req, "Invalid token format", HttpStatusCode.Unauthorized);
                }

                _logger.LogInformation("✅ User token received, length: {TokenLength}", userToken.Length);

                // Implementera On-Behalf-Of flow
                var graphClient = await GetGraphClientWithUserContext(userToken);

                // Hämta SharePoint data med användarens behörigheter
                var sharePointData = await GetSharePointTicketsForUser(graphClient);

                _logger.LogInformation("✅ Successfully retrieved {Count} items for user", sharePointData.Count);

                return CreateSuccessResponse(req, sharePointData);
            }
            catch (MsalException ex)
            {
                _logger.LogError(ex, "❌ MSAL authentication error");
                return CreateErrorResponse(req, "Authentication failed", HttpStatusCode.Unauthorized);
            }
            catch (ServiceException ex)
            {
                _logger.LogError(ex, "❌ Microsoft Graph error");
                return CreateErrorResponse(req, $"Graph API error: {ex.Error?.Code}", HttpStatusCode.BadRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in GetSharePointData");
                return CreateErrorResponse(req, "Internal server error", HttpStatusCode.InternalServerError);
            }
        }

        private async Task<GraphServiceClient> GetGraphClientWithUserContext(string userToken)
        {
            var clientId = _configuration["AzureAd:ClientId"];
            var clientSecret = _configuration["AzureAd:ClientSecret"];
            var tenantId = _configuration["AzureAd:TenantId"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(tenantId))
            {
                throw new InvalidOperationException("Azure AD configuration is missing");
            }

            var app = ConfidentialClientApplicationBuilder
                .Create(clientId)
                .WithClientSecret(clientSecret)
                .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
                .Build();

            var userAssertion = new UserAssertion(userToken);
            var scopes = new[] { "https://graph.microsoft.com/.default" };

            _logger.LogInformation("🔄 Acquiring token using On-Behalf-Of flow...");

            var result = await app.AcquireTokenOnBehalfOf(scopes, userAssertion)
                .ExecuteAsync();

            _logger.LogInformation("✅ Successfully acquired OBO token");

            return new GraphServiceClient(new BaseBearerTokenAuthenticationProvider(
                new TokenProvider(result.AccessToken)));
        }

        private async Task<List<object>> GetSharePointTicketsForUser(GraphServiceClient graphClient)
        {
            try
            {
                // Hämta specifik SharePoint site och lista
                var siteId = "xzk57.sharepoint.com,662692cc-5daf-4766-85d8-8051823dfffa,63b107f3-3092-4203-bcdd-05ef41aad476";
                var listId = "cc4738d4-2058-4920-a16c-ebfa2e1b4303";

                _logger.LogInformation("📋 Fetching SharePoint list items for site: {SiteId}", siteId);

                var items = await graphClient.Sites[siteId]
                    .Lists[listId]
                    .Items
                    .Request()
                    .Expand("fields")
                    .GetAsync();

                _logger.LogInformation("✅ Retrieved {Count} raw items from SharePoint", items.Count);

                // Konvertera till format som frontend förväntar sig
                var tickets = new List<object>();

                foreach (var item in items)
                {
                    try
                    {
                        var ticket = new
                        {
                            Id = item.Id,
                            CreatedBy = new
                            {
                                User = new
                                {
                                    DisplayName = item.CreatedBy?.User?.DisplayName ?? "Unknown",
                                    Id = item.CreatedBy?.User?.Id ?? "",
                                    email = item.CreatedBy?.User?.Mail ?? ""
                                }
                            },
                            CreatedDateTime = item.CreatedDateTime?.ToString("yyyy-MM-ddTHH:mm:sszzz"),
                            LastModifiedBy = new
                            {
                                User = new
                                {
                                    DisplayName = item.LastModifiedBy?.User?.DisplayName ?? "Unknown",
                                    Id = item.LastModifiedBy?.User?.Id ?? "",
                                    email = item.LastModifiedBy?.User?.Mail ?? ""
                                },
                                Application = item.LastModifiedBy?.Application != null ? new
                                {
                                    DisplayName = item.LastModifiedBy.Application.DisplayName,
                                    Id = item.LastModifiedBy.Application.Id
                                } : null
                            },
                            LastModifiedDateTime = item.LastModifiedDateTime?.ToString("yyyy-MM-ddTHH:mm:sszzz"),
                            ContentType = new
                            {
                                Id = item.ContentType?.Id,
                                Name = item.ContentType?.Name
                            },
                            ParentReference = new
                            {
                                Id = item.ParentReference?.Id,
                                SiteId = item.ParentReference?.SiteId
                            },
                            WebUrl = item.WebUrl,
                            ETag = item.ETag,
                            Fields = ExtractFields(item.Fields?.AdditionalData)
                        };

                        tickets.Add(ticket);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ Failed to process item {ItemId}", item.Id);
                    }
                }

                _logger.LogInformation("✅ Successfully processed {Count} tickets", tickets.Count);
                return tickets;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error fetching SharePoint data");
                throw;
            }
        }

        private object ExtractFields(IDictionary<string, object> additionalData)
        {
            if (additionalData == null) return new { };

            // Extrahera relevanta fält för tickets
            var fields = new Dictionary<string, object>();

            var fieldMappings = new Dictionary<string, string>
            {
                { "Title", "Title" },
                { "Description", "Description" },
                { "TicketId", "TicketId" },
                { "Priority", "Priority" },
                { "Status", "TicketStatusName" },
                { "MainCategory", "MainCategory" },
                { "ContactName", "ContactName" },
                { "ContactMail", "ContactMail" }
            };

            foreach (var mapping in fieldMappings)
            {
                if (additionalData.ContainsKey(mapping.Value))
                {
                    fields[mapping.Key] = additionalData[mapping.Value];
                }
            }

            return fields;
        }

        private HttpResponseData CreateSuccessResponse(HttpRequestData req, object data)
        {
            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json; charset=utf-8");

            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });

            response.WriteString(json);
            return response;
        }

        private HttpResponseData CreateErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
        {
            var response = req.CreateResponse(statusCode);
            response.Headers.Add("Content-Type", "application/json; charset=utf-8");

            var error = new { error = message, timestamp = DateTime.UtcNow };
            var json = JsonSerializer.Serialize(error);

            response.WriteString(json);
            return response;
        }
    }

    // Helper class för token provider
    public class TokenProvider
    {
        private readonly string _token;
        public TokenProvider(string token) => _token = token;
        public Task<string> GetTokenAsync() => Task.FromResult(_token);
    }

    public class BaseBearerTokenAuthenticationProvider : IAuthenticationProvider
    {
        private readonly TokenProvider _tokenProvider;

        public BaseBearerTokenAuthenticationProvider(TokenProvider tokenProvider)
        {
            _tokenProvider = tokenProvider;
        }

        public async Task AuthenticateRequestAsync(HttpRequestMessage request)
        {
            var token = await _tokenProvider.GetTokenAsync();
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }
    }
}
```

### 2. Uppdatera Azure AD App Registration

Lägg till delegated permissions:

```bash
az ad app permission add \
  --id 110bbc9c-7b2c-4364-afad-b954953e3b7b \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions 205e70e5-aba6-4c52-a976-6d2d46c48043=Scope

az ad app permission admin-consent \
  --id 110bbc9c-7b2c-4364-afad-b954953e3b7b
```

### 3. Konfigurera Azure Function App Settings

```bash
az functionapp config appsettings set \
  --name func-sharepoint-prod-001-hmeqadf6h0g9cng8 \
  --resource-group func-sharepoint-prod-001-hmeqadf6h0g9cng8 \
  --settings \
    "AzureAd__ClientId=110bbc9c-7b2c-4364-afad-b954953e3b7b" \
    "AzureAd__ClientSecret=<DIN_CLIENT_SECRET>" \
    "AzureAd__TenantId=14f493f8-7990-4a8d-9885-37e35f0fe7d3"
```

### 4. Uppdatera Program.cs

```csharp
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices((context, services) =>
    {
        // Lägg till konfiguration
        services.AddSingleton<IConfiguration>(context.Configuration);

        // Lägg till övriga services om behövs
    })
    .Build();

host.Run();
```

### 5. Uppdatera project file (.csproj)

Lägg till NuGet packages:

```xml
<PackageReference Include="Microsoft.Graph" Version="5.50.0" />
<PackageReference Include="Microsoft.Identity.Client" Version="4.56.0" />
```

## 🎯 RESULTAT EFTER IMPLEMENTATION

### ✅ Säkerhetsfördelar:

- **Användarspecifik data**: Varje användare ser endast SharePoint-data de har behörighet till
- **Inga exponerade secrets**: Function Key tagen bort från frontend
- **Audit trail**: Alla API-anrop loggas med rätt användare
- **Principle of least privilege**: Följer säkerhetsbästa praxis

### ✅ Tekniska fördelar:

- **On-Behalf-Of flow**: Använder användarens token för SharePoint-åtkomst
- **Robust felhantering**: Tydliga felmeddelanden
- **Detaljerad logging**: För debugging och monitoring
- **Type safety**: Strukturerad datahantering

## 🚀 DEPLOYMENT

1. Kör kod-uppdateringar i Azure Function
2. Konfigurera App Settings
3. Granta delegated permissions i Azure AD
4. Testa med olika användare
5. Verifiera att behörighetskontroll fungerar

## ⚠️ VIKTIGT

Efter denna implementation kommer:

- Frontend att kräva authentication
- Användare att se endast data de har tillgång till
- Function Key att inte längre fungera
- Säkerhet att följa Microsoft best practices

**IMPLEMENTERA DETTA I DIN ANDRA VS CODE MED AZURE FUNCTION-PROJEKTET!**
