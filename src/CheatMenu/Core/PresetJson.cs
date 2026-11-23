using System.Text.Json;

namespace CheatMenu.Core;

/// <summary>The presets file goes into the panel's script as it is, so only a JSON list may go in.</summary>
public static class PresetJson
{
    /// <summary>The text when it is a JSON list, else "null" (the panel then starts with no presets).</summary>
    public static string OrNull(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "null";

        try
        {
            using var document = JsonDocument.Parse(text);

            return document.RootElement.ValueKind == JsonValueKind.Array ? text : "null";
        }
        catch (JsonException)
        {
            return "null";
        }
    }
}
