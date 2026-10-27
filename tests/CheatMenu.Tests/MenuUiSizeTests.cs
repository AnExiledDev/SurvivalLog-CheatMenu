using System.Globalization;
using System.Text.RegularExpressions;
using CheatMenu.Core;
using Jint;
using Xunit;

namespace CheatMenu.Tests;

/// <summary>
/// The menu follows Exiled's Toolkit's UI size: the shipped bundle hands the Toolkit its window, run in Jint on a fake
/// game page (PageFake.js). The stage under the window fills the screen at any size, so handing it over would never let
/// the window be fitted; the window itself is what is zoomed and what must fit.
/// </summary>
public class MenuUiSizeTests
{
    [Fact]
    public void The_window_is_handed_over_once_and_fitted_to_the_screen()
    {
        var page = new Page();

        Assert.Equal(1, page.Number("handed.length"));
        Assert.True(page.Bool("handed[0].el === menuRoot().querySelector('#cm')"));
        Assert.True(page.Bool("!handed[0].options || handed[0].options.fit !== false"));
    }

    [Fact]
    public void Before_the_Toolkit_loads_the_window_waits_for_it()
    {
        var page = new Page("delete window.ExiledUi");

        Assert.Equal(1, page.Number("window.__exiledUiWait.length"));
        Assert.True(page.Bool("window.__exiledUiWait[0][0] === menuRoot().querySelector('#cm')"));
    }

    /// <summary>
    /// Zoom scales a window's pixel offsets but not its percentages, so a window placed by pixels drifts off center as
    /// it grows. Its left and top must be 50% less half its size to stay centered on the 1920x1080 stage at any zoom.
    /// </summary>
    [Fact]
    public void The_window_is_centered_on_the_stage_by_half_its_size_so_a_zoom_keeps_it_centered()
    {
        var rule = Regex.Match(LogicTests.Web("menu.css"), @"(?m)^#cm \{(?<body>[^}]*)\}").Groups["body"].Value;

        double Px(string property) => double.Parse(Regex.Match(rule, $@"(?<![-\w]){property}: (?<n>\d+(\.\d+)?)px").Groups["n"].Value, CultureInfo.InvariantCulture);

        double HalfOff(string property)
        {
            var calc = Regex.Match(rule, $@"(?<![-\w]){property}: calc\(50% - (?<n>\d+(\.\d+)?)px\)");

            Assert.True(calc.Success, $"#cm {property} is not calc(50% - Npx)");

            return double.Parse(calc.Groups["n"].Value, CultureInfo.InvariantCulture);
        }

        Assert.Equal(Px("width") / 2, HalfOff("left"));
        Assert.Equal(Px("height") / 2, HalfOff("top"));
    }

    /// <summary>The shipped bundle on PageFake.js; <paramref name="before"/> runs between the two.</summary>
    private sealed class Page
    {
        private readonly Engine _engine = new();

        public Page(string? before = null)
        {
            _engine.Execute(Resource("CheatMenu.Tests.PageFake.js"));
            if (before != null) _engine.Execute(before);
            _engine.Execute(PageBundle.Join(LogicTests.Web));
        }

        public int Number(string expression) => (int)_engine.Evaluate($"Number({expression})").AsNumber();

        public bool Bool(string expression) => _engine.Evaluate($"!!({expression})").AsBoolean();

        private static string Resource(string name)
        {
            using var stream = typeof(MenuUiSizeTests).Assembly.GetManifestResourceStream(name) ?? throw new InvalidOperationException(name + " is not embedded in the test assembly");
            using var reader = new StreamReader(stream);

            return reader.ReadToEnd();
        }
    }
}
