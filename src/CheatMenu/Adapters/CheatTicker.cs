using System;
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;

namespace CheatMenu.Adapters;

/// <summary>
/// The Unity object that hands frames to the session. Each distinct failure is logged once, never rethrown into the
/// game; a failure that repeats every frame would otherwise flood the log. A frame where the mod's own work is slow
/// is logged too, at most once a minute, so a laggy menu can be told apart from a laggy game.
/// </summary>
public sealed class CheatTicker : MonoBehaviour
{
    private const int MaxReportedFailures = 20;
    private const double SlowFrameMs = 30;
    private const float SlowReportEverySeconds = 60f;

    internal static CheatSession? Session;
    internal static Action<string> Log = _ => { };
    private static readonly HashSet<string> ReportedFailures = new();
    private static readonly Stopwatch Frame = new();
    private static double _worstMs;
    private static string? _worstPart;
    private static float _nextSlowReportAt;

    public CheatTicker(IntPtr pointer) : base(pointer)
    {
    }

    private void Update()
    {
        Frame.Restart();

        try
        {
            Session?.Update();
        }
        catch (Exception ex)
        {
            if (ReportedFailures.Count < MaxReportedFailures && ReportedFailures.Add(ex.GetType().FullName + ": " + ex.Message)) Log("update failed (each distinct failure reported once): " + ex);
        }

        NoteSlowFrame(Frame.Elapsed.TotalMilliseconds, Session?.SlowPart);
    }

    private static void NoteSlowFrame(double ms, string? part)
    {
        if (ms < SlowFrameMs) return;

        if (ms > _worstMs)
        {
            _worstMs = ms;
            _worstPart = part;
        }

        if (Time.unscaledTime < _nextSlowReportAt) return;

        Log($"the menu's own work took {_worstMs:0} ms in one frame (slowest in the last minute){(_worstPart == null ? "" : ": " + _worstPart)}");
        _worstMs = 0;
        _worstPart = null;
        _nextSlowReportAt = Time.unscaledTime + SlowReportEverySeconds;
    }
}
