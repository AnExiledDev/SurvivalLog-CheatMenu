using System.IO;
using BepInEx;
using BepInEx.Unity.IL2CPP;
using CheatMenu.Adapters;
using HarmonyLib;
using UnityEngine;

namespace CheatMenu;

[BepInPlugin(Guid, "Cheat Menu", Version)]
[BepInDependency(OptionalLive.ToolkitGuid, BepInDependency.DependencyFlags.SoftDependency)]
public sealed class Plugin : BasePlugin
{
    private const string Guid = "com.dev.survivallog.cheatmenu";
    private const string Version = "0.1.0";

    public override void Load()
    {
        if (!OptionalLive.IsToolkitInstalled) Log.LogInfo(OptionalLive.MissingNote);

        var panelKey = Config.Bind("Controls", "PanelKey", KeyCode.F3,
            "Key that opens and closes the Cheat Menu, F3 by default. None turns the key off.\n" +
            "打开和关闭作弊菜单的按键，默认 F3。设为 None 则停用该按键。");

        var log = new CheatLog(Log, Path.Combine(Paths.BepInExRootPath, "cheat-menu.log"));
        var harmony = new Harmony(Guid);
        var gm = new GmBridge(log.Write);
        var flags = new GmFlags(log.Write);
        var presets = new PresetStore(Path.Combine(Paths.ConfigPath, "CheatMenu", "presets.json"), log.Write);
        var session = new CheatSession(gm, flags, presets, new WebPage(log.Write), log.Write);

        log.Write($"===== Cheat Menu {Version} started");
        InputGate.Apply(harmony, log.Write);
        PageMessages.Apply(harmony, log.Write);
        GmBridge.Apply(harmony, log.Write);

        OptionalLive.Watch(panelKey, key => session.Key = key);

        CheatTicker.Session = session;
        CheatTicker.Log = log.Write;
        AddComponent<CheatTicker>();
    }
}
