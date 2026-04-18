using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace TranquiliWays.PrimeiraChama
{
    public sealed class TranquiliHubBootstrap : MonoBehaviour
    {
        [Header("Backend")]
        [SerializeField] private string apiBaseUrl = "https://your-tranquili-host.example.com";

        [Header("Debug")]
        [SerializeField] private bool hydrateOnStart = true;
        [SerializeField] private bool verboseLogging = true;

        public string CurrentStatus { get; private set; } = "Awaiting deep link...";

        public TranquiliJourneySession CurrentSession { get; private set; }

        private void OnEnable()
        {
            Application.deepLinkActivated += HandleDeepLinkActivated;
        }

        private void OnDisable()
        {
            Application.deepLinkActivated -= HandleDeepLinkActivated;
        }

        private IEnumerator Start()
        {
            if (!hydrateOnStart)
            {
                yield break;
            }

            if (string.IsNullOrWhiteSpace(Application.absoluteURL))
            {
                SetStatus("Open the hub from Tranquili+ to hydrate the scene.");
                yield break;
            }

            yield return LoadSessionFromUrl(Application.absoluteURL);
        }

        private void HandleDeepLinkActivated(string url)
        {
            StopAllCoroutines();
            StartCoroutine(LoadSessionFromUrl(url));
        }

        private IEnumerator LoadSessionFromUrl(string url)
        {
            if (!TranquiliDeepLinkParser.TryParse(url, out TranquiliDeepLinkPayload payload))
            {
                SetStatus("Invalid deep link payload.");
                yield break;
            }

            SetStatus("Loading session from Tranquili+...");

            string requestUrl = BuildSessionRequestUrl(payload);

            using (UnityWebRequest request = UnityWebRequest.Get(requestUrl))
            {
                request.SetRequestHeader("Accept", "application/json");
                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    SetStatus("Could not fetch the session. Keep the calm hub alive.");

                    if (verboseLogging)
                    {
                        Debug.LogWarning($"[TranquiliHubBootstrap] Session request failed: {request.error}");
                    }

                    yield break;
                }

                TranquiliJourneySession session =
                    JsonUtility.FromJson<TranquiliJourneySession>(request.downloadHandler.text);

                if (session == null || string.IsNullOrWhiteSpace(session.id))
                {
                    SetStatus("Session payload is invalid.");
                    yield break;
                }

                CurrentSession = session;
                SetStatus($"Hub ready for session {session.id}.");

                if (verboseLogging)
                {
                    Debug.Log($"[TranquiliHubBootstrap] Session ready. Mode={session.inputMode} Status={session.status}");
                }
            }
        }

        private string BuildSessionRequestUrl(TranquiliDeepLinkPayload payload)
        {
            string root = apiBaseUrl.TrimEnd('/');
            string sessionId = UnityWebRequest.EscapeURL(payload.SessionId);
            string launchToken = UnityWebRequest.EscapeURL(payload.LaunchToken);

            return $"{root}/api/sessions/{sessionId}?token={launchToken}";
        }

        private void SetStatus(string status)
        {
            CurrentStatus = status;

            if (verboseLogging)
            {
                Debug.Log($"[TranquiliHubBootstrap] {status}");
            }
        }
    }
}
