using System.ComponentModel.DataAnnotations;

namespace func_sharepoint_prod_001.Models
{
    public class AzureAdOptions
    {
        public const string SectionName = "AzureAd";

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public string TenantId { get; set; } = string.Empty;

        [Required]
        public string ClientSecret { get; set; } = string.Empty;

        public string Authority => $"https://login.microsoftonline.com/{TenantId}";

        // Använd specifika delegated permissions för user context
        public string[] Scopes { get; set; } = new[] {
            "https://graph.microsoft.com/Sites.Read.All",
            "https://graph.microsoft.com/Sites.ReadWrite.All"
        };
    }
}