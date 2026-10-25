using System.Globalization;
using System.Text.Json;

namespace CheatMenu.Core;

/// <summary>
/// An action's arguments: a flat JSON object from the panel. A missing or unreadable value is null, so each action
/// decides for itself whether it can run without it.
/// </summary>
public sealed class ActArgs
{
    private readonly JsonElement? _root;

    private ActArgs(JsonElement? root)
    {
        _root = root;
    }

    public static ActArgs Parse(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new ActArgs(null);

        try
        {
            using var document = JsonDocument.Parse(json);

            return document.RootElement.ValueKind == JsonValueKind.Object ? new ActArgs(document.RootElement.Clone()) : new ActArgs(null);
        }
        catch (JsonException)
        {
            return new ActArgs(null);
        }
    }

    public double? Number(string key)
    {
        if (_root is not { } root || !root.TryGetProperty(key, out var value)) return null;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number)) return number;

        if (value.ValueKind == JsonValueKind.String && double.TryParse(value.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)) return parsed;

        return null;
    }

    public long? Long(string key) => Number(key) is { } n && n == System.Math.Floor(n) && n >= long.MinValue && n <= long.MaxValue ? (long)n : null;

    public int? Int(string key) => Long(key) is { } n && n >= int.MinValue && n <= int.MaxValue ? (int)n : null;

    public bool? Bool(string key)
    {
        if (_root is not { } root || !root.TryGetProperty(key, out var value)) return null;

        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Number => value.GetDouble() != 0,
            _ => null,
        };
    }

    public string? Text(string key) => _root is { } root && root.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}
