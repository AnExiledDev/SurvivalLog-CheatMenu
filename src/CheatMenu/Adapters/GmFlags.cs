using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;
using CheatMenu.Core;
using GameCore.HotUpdate;

namespace CheatMenu.Adapters;

/// <summary>
/// The game's GM switches. Each is a static flag on its GM class that the rest of the game checks; some have no
/// setter left in the release build, so the flag's own field is used for all of them.
/// </summary>
internal sealed class GmFlags
{
    private readonly Dictionary<string, PropertyInfo> _fields = new(StringComparer.Ordinal);
    private readonly Action<string> _log;

    public GmFlags(Action<string> log)
    {
        _log = log;

        foreach (var name in GmFlagNames.All)
        {
            var field = typeof(WebGm).GetProperty("_" + name + "_k__BackingField", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static);

            if (field != null && field.PropertyType == typeof(bool)) _fields[name] = field;
            else log("GM switch " + name + " is not in this game build; its row will do nothing");
        }
    }

    public bool Set(string name, bool isOn)
    {
        if (!_fields.TryGetValue(name, out var field)) return false;

        try
        {
            field.SetValue(null, isOn);

            return true;
        }
        catch (Exception ex)
        {
            _log("could not set GM switch " + name + ": " + ex.Message);

            return false;
        }
    }

    /// <summary>Every switch the build has, as a JSON object of name to on or off.</summary>
    public string Json()
    {
        var json = new StringBuilder("{");

        foreach (var pair in _fields)
        {
            bool isOn;

            try
            {
                isOn = pair.Value.GetValue(null) is true;
            }
            catch (Exception)
            {
                continue;
            }

            if (json.Length > 1) json.Append(',');

            json.Append('"').Append(pair.Key).Append("\":").Append(isOn ? "true" : "false");
        }

        return json.Append('}').ToString();
    }
}
