using System.IO;
using BepInEx;
using BepInEx.Unity.IL2CPP;
using CheatMenu.Adapters;
using CheatMenu.Core;
using ExiledToolkit;
using ExiledToolkit.Game;
using ExiledToolkit.Kit;
using HarmonyLib;
using UnityEngine;

namespace CheatMenu;

[BepInPlugin(Guid, "Cheat Menu", Version)]
[BepInDependency(ToolkitGuid, ToolkitVersion)]
public sealed class Plugin : BasePlugin
{
    private const string Guid = "com.dev.survivallog.cheatmenu";
    private const string Version = "0.4.7";

    /// <summary>Exiled's Toolkit: its shared helpers, toasts, live settings, UI size and typing check all come from it.</summary>
    private const string ToolkitGuid = "com.dev.survivallog.exiledtoolkit";
    private const string ToolkitVersion = ">=0.19.0";

    /// <summary>The name the page script hands its window to the Toolkit's UI size with.</summary>
    private const string UiSizeName = "CheatMenu";

    public override void Load()
    {
        ModUiSize.Bind(Config, UiSizeName);

        var panelKey = Config.Bind("Controls", "PanelKey", KeyCode.F3,
            "Key that opens and closes the Cheat Menu, F3 by default. None turns the key off.\n" +
            "打开和关闭作弊菜单的按键，默认 F3。设为 None 则停用该按键。");

        var log = new ModLog(Log, "cheat-menu.log");
        var hooks = new PatchKit(new Harmony(Guid), log.Write);
        var gm = new GmBridge(log.Write);
        var flags = new GmFlags(log.Write);
        var presets = new PresetStore(Path.Combine(Paths.ConfigPath, "CheatMenu", "presets.json"), log.Write);
        var page = new WebPage(typeof(Plugin).Assembly, log.Write);
        var inbox = ExiledToolkit.Web.PageInbox.Listen(PageCommand.Prefix);
        var session = new CheatSession(gm, flags, new ModActions(gm, hooks, log.Write), new Holds(gm, flags, hooks, log.Write), presets, page, inbox, log.Write);

        log.Write($"===== Cheat Menu {Version} started");
        GmBridge.Apply(hooks);

        LiveSettings.Watch(panelKey, key => session.Key = key);

        CheatTicker.Session = session;
        CheatTicker.Log = log.Write;
        AddComponent<CheatTicker>();
    }
}
