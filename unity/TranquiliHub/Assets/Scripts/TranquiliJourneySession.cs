using System;

namespace TranquiliWays.PrimeiraChama
{
    [Serializable]
    public sealed class TranquiliJourneySession
    {
        public string id;
        public string launchToken;
        public string createdAt;
        public string rawInput;
        public string inputMode;
        public string status;

        public bool IsReady()
        {
            return string.Equals(status, "ready", StringComparison.OrdinalIgnoreCase);
        }
    }
}
