using System;

namespace CheatMenu.Core;

/// <summary>
/// What the panel asks for. It sends "slmod|cheatmenu|" followed by a verb and its arguments; anything else parses to
/// Unknown so it can be logged rather than acted on.
/// </summary>
public abstract record PageCommand
{
    public const string Prefix = "slmod|cheatmenu|";

    private PageCommand()
    {
    }

    public sealed record Close : PageCommand;

    /// <summary>One of the game's own GM messages, as the game's GM panel would send it, tagged with the panel's request id.</summary>
    public sealed record Gm(string RequestId, string Json) : PageCommand;

    /// <summary>One of the game's GM switches set on or off.</summary>
    public sealed record Flag(string Name, bool IsOn) : PageCommand;

    /// <summary>The whole preset list, to be written to the presets file.</summary>
    public sealed record SavePresets(string Json) : PageCommand;

    /// <summary>One of the mod's own actions, with its JSON arguments ("" for none), tagged with the panel's request id.</summary>
    public sealed record Act(string RequestId, string Name, string ArgsJson) : PageCommand;

    /// <summary>One of the mod's holds turned on or off.</summary>
    public sealed record Hold(string Name, bool IsOn) : PageCommand;

    /// <summary>A text box in the menu gained or lost focus, so the keyboard goes to the menu or back to the game.</summary>
    public sealed record Focus(bool IsTyping) : PageCommand;

    public sealed record Ready : PageCommand;

    public sealed record NoScript : PageCommand;

    public sealed record Unknown(string Text) : PageCommand;

    public static bool IsOurs(string? message) => message is not null && message.StartsWith(Prefix, StringComparison.Ordinal);

    /// <summary>Parses a whole message, prefix included. JSON goes last, so it may hold the separator itself.</summary>
    public static PageCommand Parse(string message)
    {
        if (!IsOurs(message)) return new Unknown(message);

        var rest = message.Substring(Prefix.Length);
        var verb = Head(ref rest);

        switch (verb)
        {
            case "close" when rest.Length == 0:
                return new Close();
            case "ready" when rest.Length == 0:
                return new Ready();
            case "noscript" when rest.Length == 0:
                return new NoScript();
            case "gm":
            {
                var id = Head(ref rest);

                return id.Length > 0 && rest.Length > 0 ? new Gm(id, rest) : new Unknown(message);
            }
            case "flag":
            {
                var name = Head(ref rest);

                return GmFlagNames.IsKnown(name) && rest is "0" or "1" ? new Flag(name, rest == "1") : new Unknown(message);
            }
            case "act":
            {
                var id = Head(ref rest);
                var name = Head(ref rest);

                return id.Length > 0 && ModCheats.IsAction(name) ? new Act(id, name, rest) : new Unknown(message);
            }
            case "hold":
            {
                var name = Head(ref rest);

                return ModCheats.IsHold(name) && rest is "0" or "1" ? new Hold(name, rest == "1") : new Unknown(message);
            }
            case "focus" when rest is "0" or "1":
                return new Focus(rest == "1");
            case "presets" when rest.Length > 0:
                return new SavePresets(rest);
            default:
                return new Unknown(message);
        }
    }

    /// <summary>Takes the text up to the next separator off the front of <paramref name="rest"/>.</summary>
    private static string Head(ref string rest)
    {
        var at = rest.IndexOf('|');

        if (at < 0)
        {
            var all = rest;
            rest = "";

            return all;
        }

        var head = rest.Substring(0, at);
        rest = rest.Substring(at + 1);

        return head;
    }
}
