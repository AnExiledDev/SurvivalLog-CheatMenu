using System.Text.Json;

namespace CheatMenu.Core;

/// <summary>
/// Checks a GM message from the panel before it reaches the game: a JSON object whose msgHead is a positive whole
/// number, as the game's GM handler reads it. The handler picks its command from msgHead alone.
/// </summary>
public static class GmRequest
{
    /// <summary>The msgHead, or null with the reason when the message is not one the game could read.</summary>
    public static int? Head(string json, out string why)
    {
        why = "";

        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
            {
                why = "not a JSON object";

                return null;
            }

            if (!root.TryGetProperty("msgHead", out var head) || head.ValueKind != JsonValueKind.Number || !head.TryGetInt32(out var value) || value <= 0)
            {
                why = "no msgHead";

                return null;
            }

            return value;
        }
        catch (JsonException ex)
        {
            why = "bad JSON: " + ex.Message;

            return null;
        }
    }
}
