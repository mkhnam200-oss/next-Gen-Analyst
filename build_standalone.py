from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "Next-Gen-Analyst.html"


def replace_once(source: str, old: str, new: str) -> str:
    count = source.count(old)
    if count != 1:
        raise ValueError(f"Expected one source marker, found {count}: {old}")
    return source.replace(old, new, 1)


html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css" / "styles.css").read_text(encoding="utf-8")
config = (ROOT / "js" / "config.js").read_text(encoding="utf-8")
app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")

html = replace_once(
    html,
    '<link rel="stylesheet" href="css/styles.css">',
    f"<style>\n{css}\n</style>",
)
html = replace_once(
    html,
    '<script src="js/config.js"></script>',
    f"<script>\n{config}\n</script>",
)
html = replace_once(
    html,
    '<script src="js/app.js"></script>',
    f"<script>\n{app}\n</script>",
)

OUTPUT.write_text(html, encoding="utf-8", newline="")
print(f"Created {OUTPUT}")