using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using BepInEx.Unity.IL2CPP;
using CheatMenu.Core;

namespace CheatMenu.Adapters;

/// <summary>
/// Finds the DevCheats class (<see cref="ModTests"/>) in each loaded plugin's assembly and runs its methods. The page
/// can only run a method found here, by plugin id and method name, so a message cannot reach anything else.
/// </summary>
internal static class ModTestCheats
{
    private sealed record Found(ModTests.Mod Mod, Dictionary<string, MethodInfo> Methods);

    // Reading every plugin's types takes tens of ms, so it is done once and again only if the loaded plugins change.
    private static List<Found>? _found;
    private static int _foundFromPlugins = -1;

    /// <summary>Reads the test cheats now, while the game loads, so the first visit to the tab does not stall a frame.</summary>
    public static void Warm(Action<string> log) => Discover(log);

    public static string? List(Action<string> log, out string text)
    {
        text = ModTests.Json(Discover(log).Select(f => f.Mod));

        return null;
    }

    public static string? Run(string? mod, string? cheat, Action<string> log, out string text)
    {
        text = "";

        if (string.IsNullOrEmpty(mod) || string.IsNullOrEmpty(cheat)) return "pick a test cheat";

        var found = Discover(log).FirstOrDefault(f => f.Mod.Guid == mod);

        if (found == null) return "that mod is not loaded";
        if (!found.Methods.TryGetValue(cheat, out var method)) return "that mod has no such test cheat";

        try
        {
            text = method.Invoke(null, null) as string ?? "";

            return null;
        }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            log($"test cheat {mod} {cheat} failed: {ex.InnerException}");

            return ex.InnerException.GetType().Name + ": " + ex.InnerException.Message;
        }
    }

    private static List<Found> Discover(Action<string> log)
    {
        var plugins = IL2CPPChainloader.Instance.Plugins.Values.Where(p => p.Instance != null).ToList();

        if (_found != null && plugins.Count == _foundFromPlugins) return _found;

        var found = new List<Found>();

        foreach (var plugin in plugins)
        {
            try
            {
                var type = plugin.Instance!.GetType().Assembly.GetTypes().FirstOrDefault(t => t.Name == ModTests.TypeName && t.IsAbstract && t.IsSealed);

                if (type == null) continue;

                var methods = type.GetMethods(BindingFlags.Public | BindingFlags.Static)
                    .Where(m => m.ReturnType == typeof(string) && m.GetParameters().Length == 0 && !m.IsSpecialName)
                    .ToDictionary(m => m.Name, StringComparer.Ordinal);
                var cheats = methods.Values.OrderBy(m => m.MetadataToken).Select(Describe).ToList();

                found.Add(new Found(new ModTests.Mod(plugin.Metadata.GUID, plugin.Metadata.Name, cheats), methods));
            }
            catch (Exception ex)
            {
                log($"could not read the test cheats of {plugin.Metadata.Name}: {ex.Message}");
            }
        }

        _found = found;
        _foundFromPlugins = plugins.Count;

        return found;
    }

    private static ModTests.Cheat Describe(MethodInfo method)
    {
        var (label, labelZh) = ModTests.Split(method.GetCustomAttribute<DisplayNameAttribute>()?.DisplayName, ModTests.Words(method.Name));
        var (help, helpZh) = ModTests.Split(method.GetCustomAttribute<DescriptionAttribute>()?.Description, "");

        return new ModTests.Cheat(method.Name, label, labelZh, help, helpZh);
    }
}
