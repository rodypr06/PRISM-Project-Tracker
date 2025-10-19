# Pasting Notes from Notion and Other Apps

## Overview
The notes feature now supports pasting formatted text from Notion, Markdown editors, and other applications. Line breaks and formatting are automatically preserved.

## What Was Fixed

### 1. **Added `remark-breaks` Plugin**
This plugin converts single line breaks into `<br>` tags in markdown, preserving the formatting you see in your source document.

### 2. **Enhanced Markdown Rendering**
- Line breaks are preserved automatically
- Paragraph spacing maintained
- Better handling of pasted content

### 3. **Custom Component Styling**
Added special CSS classes for markdown paragraphs and line breaks to ensure proper spacing.

## How to Paste from Notion

### Method 1: Direct Copy/Paste (Recommended)
1. In Notion, select the content you want to copy
2. Press `Cmd+C` (Mac) or `Ctrl+C` (Windows)
3. In PRISM, click "+ Add Note"
4. Paste into the Content field with `Cmd+V` or `Ctrl+V`
5. Ensure "Enable markdown formatting" is checked
6. Click "Create Note"

**Notion will automatically convert to markdown format when you paste!**

### Method 2: Export as Markdown
1. In Notion, click the `...` menu on your page
2. Select "Export"
3. Choose "Markdown & CSV" format
4. Download and unzip the file
5. Open the `.md` file in a text editor
6. Copy the content
7. Paste into PRISM notes

## Supported Formatting from Notion

### ✅ **Fully Supported**
- **Headings** (H1-H6)
- **Bold** text
- **Italic** text
- **Strikethrough** text
- **Inline code** (`code`)
- **Code blocks** with syntax highlighting
- **Bullet lists**
- **Numbered lists**
- **Nested lists**
- **Blockquotes**
- **Links**
- **Horizontal rules**
- **Line breaks** (preserved automatically)
- **Emojis** 🎉 ✨ 🚀

### ⚠️ **Partially Supported**
- **Tables** (supported but may need manual adjustment)
- **Task lists** (checkboxes work in markdown)
- **Images** (links work, but images need to be uploaded as attachments)

### ❌ **Not Supported**
- **Notion databases** (needs to be copied as text)
- **Embedded content** (videos, tweets, etc.)
- **Toggle lists** (will appear as regular lists)
- **Callouts** (will appear as blockquotes)
- **Inline equations** (appears as plain text)

## Example: Pasting from Notion

### In Notion:
```
# Meeting Notes - Oct 19, 2025

## Attendees
- John Doe
- Jane Smith

## Key Points
1. Discussed Q4 goals
2. Reviewed budget allocation
3. Planned next sprint

**Important:** All deliverables due by Nov 1st

> "This is our most critical quarter" - CEO
```

### Result in PRISM:
The content will render with:
- Proper heading hierarchy
- Formatted lists with spacing
- Bold text highlighted
- Blockquote styled correctly
- All line breaks preserved

## Tips for Best Results

### 1. **Keep Markdown Enabled**
Always keep the "Enable markdown formatting" checkbox checked when pasting from Notion or markdown editors.

### 2. **Clean Up After Paste (Optional)**
After pasting, you can:
- Add extra blank lines between sections for better spacing
- Remove unwanted Notion metadata
- Adjust heading levels if needed

### 3. **Test with Preview**
After saving, expand the note to see how it renders. If formatting looks off:
- Click Edit
- Adjust the markdown syntax
- Save again

### 4. **Use Emojis**
Emojis from Notion paste perfectly! 🎯 ✅ 🚀

### 5. **Code Blocks**
For code blocks, Notion's formatting is preserved:

\`\`\`javascript
function example() {
  return "This will render with syntax highlighting";
}
\`\`\`

## Troubleshooting

### Issue: No Line Breaks
**Solution**: Make sure "Enable markdown formatting" is checked. If still having issues, manually add an extra blank line between paragraphs.

### Issue: Lists Not Formatting
**Solution**: Ensure there's a blank line before the list starts.

**Before:**
```
Here's my list:
- Item 1
- Item 2
```

**After:**
```
Here's my list:

- Item 1
- Item 2
```

### Issue: Code Not Highlighting
**Solution**: Make sure your code block has the language specified:

\`\`\`javascript  (✅ Good - has language)
\`\`\`           (❌ Bad - no language)

### Issue: Headers Too Large
**Solution**: In Notion, use smaller heading levels (H2, H3) instead of H1.

## Advanced: Markdown Syntax Reference

### Headings
```markdown
# H1 - Main Title
## H2 - Section
### H3 - Subsection
#### H4 - Sub-subsection
```

### Text Formatting
```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`Inline code`
```

### Lists
```markdown
- Unordered item
  - Nested item
    - Double nested

1. Ordered item
2. Another item
   1. Nested ordered
```

### Links and Images
```markdown
[Link text](https://example.com)
![Alt text](image-url) - Images show as links, upload as attachment instead
```

### Blockquotes
```markdown
> This is a quote
> It can span multiple lines
```

### Code Blocks
\`\`\`javascript
const example = "code here";
console.log(example);
\`\`\`

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Horizontal Rule
```markdown
---
or
***
```

## Best Practices

1. **Structure Your Notes**: Use headings to organize content
2. **Add Context**: Include dates, attendees, or project names in titles
3. **Use Lists**: Break down information into digestible points
4. **Highlight Important Info**: Use bold for key points
5. **Add Emojis**: Make notes more visual and easier to scan 🎯
6. **Attach Files**: Upload PDFs, Word docs for reference
7. **Regular Updates**: Edit notes as projects evolve

## Feature Compatibility

| Source | Compatibility | Notes |
|--------|---------------|-------|
| Notion | ✅ Excellent | Direct paste works perfectly |
| Google Docs | ⚠️ Partial | Copy as plain text, loses formatting |
| Microsoft Word | ⚠️ Partial | Better to export as markdown first |
| Markdown Files | ✅ Perfect | Native markdown format |
| Plain Text | ✅ Perfect | Works with or without markdown |
| Obsidian | ✅ Perfect | Native markdown compatibility |
| VS Code | ✅ Perfect | Markdown files paste directly |
| Bear Notes | ✅ Excellent | Markdown compatible |
| Roam Research | ✅ Good | Most formatting preserved |

## Summary

The PRISM notes feature now seamlessly handles content from Notion and other markdown-compatible apps. Simply copy from your source, paste into PRISM, and your formatting is automatically preserved with proper line breaks, spacing, and styling! 🎉
