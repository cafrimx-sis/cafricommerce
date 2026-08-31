namespace Ecommerce.API.DTOs
{
    public class PayPalWebhookPayload
    {
        public string EventType { get; set; } = string.Empty;
        public PayPalResource? Resource { get; set; }
    }

    public class PayPalResource
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}