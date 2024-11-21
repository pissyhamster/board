import os

# File paths
html_file = "index.html"
css_file = "style.css"
js_file = "main.js"
output_file = "embed.html"

def read_file(file_path):
    """Reads the content of a file."""
    print(os.listdir())
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        return ""

def compile_embed(html, css, js):
    """Compiles HTML, CSS, and JS into one single HTML file."""
    # Insert CSS into a <style> tag
    style_tag = f"<style>\n{css}\n</style>"
    # Insert JS into a <script> tag
    script_tag = f"<script>\n{js}\n</script>"

    # Embed CSS and JS into the HTML file
    embedded_html = html.replace(
        '<link rel="stylesheet" href="style.css">',
        style_tag
    ).replace(
        '<script src="main.js"></script>',
        script_tag
    )

    return embedded_html

def main():
    # Read the content of the files
    html_content = read_file(html_file)
    print(f"got html: {len(html_content)}")
    css_content = read_file(css_file)
    print(f"got css: {len(css_content)}")
    js_content = read_file(js_file)
    print(f"got js: {len(js_content)}")

    # Compile embed HTML
    compiled_html = compile_embed(html_content, css_content, js_content)

    print(f"compiled html: {len(compiled_html)}")

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(compiled_html)

    print(f"Embed HTML created successfully: {output_file}")

if __name__ == "__main__":
    main()
    input("Compiled sucessfully!\n")
