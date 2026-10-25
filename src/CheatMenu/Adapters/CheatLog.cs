using System;
using System.Globalization;
using System.IO;
using BepInEx.Logging;

namespace CheatMenu.Adapters;

/// <summary>Writes to the BepInEx log and to BepInEx/cheat-menu.log, which lists every cheat used with its time.</summary>
internal sealed class CheatLog
{
    private readonly ManualLogSource _source;
    private readonly string _path;
    private bool _hasReportedFileFailure;

    public CheatLog(ManualLogSource source, string path)
    {
        _source = source;
        _path = path;
    }

    public void Write(string line)
    {
        _source.LogInfo(line);

        try
        {
            File.AppendAllText(_path, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) + "  " + line + Environment.NewLine);
        }
        catch (Exception ex)
        {
            if (!_hasReportedFileFailure) _source.LogWarning("could not write " + _path + ": " + ex.Message);

            _hasReportedFileFailure = true;
        }
    }
}
