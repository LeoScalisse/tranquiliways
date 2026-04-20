using System;

namespace TranquiliWays.PrimeiraChama
{
    public readonly struct TranquiliDeepLinkPayload
    {
        public TranquiliDeepLinkPayload(string sessionId, string launchToken)
        {
            SessionId = sessionId;
            LaunchToken = launchToken;
        }

        public string SessionId { get; }

        public string LaunchToken { get; }
    }

    public static class TranquiliDeepLinkParser
    {
        public static bool TryParse(string url, out TranquiliDeepLinkPayload payload)
        {
            payload = default;

            if (string.IsNullOrWhiteSpace(url))
            {
                return false;
            }

            if (!Uri.TryCreate(url, UriKind.Absolute, out Uri parsedUrl))
            {
                return false;
            }

            if (!string.Equals(parsedUrl.Scheme, "tranquiliways", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            if (!string.Equals(parsedUrl.Host, "session", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            string sessionId = parsedUrl.AbsolutePath.Trim('/');
            string launchToken = ReadQueryValue(parsedUrl.Query, "token");

            if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(launchToken))
            {
                return false;
            }

            payload = new TranquiliDeepLinkPayload(
                Uri.UnescapeDataString(sessionId),
                Uri.UnescapeDataString(launchToken)
            );

            return true;
        }

        private static string ReadQueryValue(string query, string key)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return string.Empty;
            }

            string[] parts = query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);

            foreach (string part in parts)
            {
                string[] pair = part.Split('=', 2, StringSplitOptions.None);

                if (pair.Length != 2)
                {
                    continue;
                }

                if (string.Equals(pair[0], key, StringComparison.OrdinalIgnoreCase))
                {
                    return pair[1];
                }
            }

            return string.Empty;
        }
    }
}
