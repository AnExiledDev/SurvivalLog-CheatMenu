using System;
using System.IO;

namespace CheatMenu.Adapters;

/// <summary>The saved presets, kept as the panel wrote them in BepInEx/config/CheatMenu/presets.json.</summary>
internal sealed class PresetStore
{
    private readonly string _path;
    private readonly Action<string> _log;

    public PresetStore(string path, Action<string> log)
    {
        _path = path;
        _log = log;
    }

    /// <summary>The file's JSON, or "null" when there is none yet or it cannot be read.</summary>
    public string Load()
    {
        try
        {
            return File.Exists(_path) ? File.ReadAllText(_path) : "null";
        }
        catch (Exception ex)
        {
            _log("could not read " + _path + ": " + ex.Message);

            return "null";
        }
    }

    /// <summary>Writes through a temporary file, so a crash mid-write leaves the old presets.</summary>
    public void Save(string json)
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_path) ?? ".");

            var temporary = _path + ".tmp";
            File.WriteAllText(temporary, json);
            File.Move(temporary, _path, true);
        }
        catch (Exception ex)
        {
            _log("could not save presets to " + _path + ": " + ex.Message);
        }
    }
}
