---
name: google-docs-markdown
description: "Convert markdown files to formatted Google Docs via the API. Handles headings, lists, tables, code blocks, images, folder organization, and sharing. Use when you need to deliver professional documents to stakeholders via Google Drive. Trigger phrases: 'create a google doc', 'upload to google docs', 'share on google drive', 'send as google doc', 'markdown to google docs'."
---

# Google Docs Markdown

Convert markdown to fully formatted Google Docs -- headings, lists, tables, code blocks, and more -- via the Google Docs and Drive APIs. Organize into folders, add logos, and share with recipients in a single operation.

## When to Use

- Delivering professional documents to clients or collaborators via Google Drive
- Batch-uploading markdown files as formatted Google Docs
- Automating document workflows (draft in markdown, publish to Drive)
- Sharing branded documents with logos and organized folder structures
- Any time you need real Google Docs (not exported HTML or PDFs)

## What It Does

This skill provides a Python library (`gdocs.py`) that:

1. **Creates Google Docs from markdown** with proper formatting (H1-H6, bullets, numbered lists, checkboxes, blockquotes, tables, code blocks, horizontal rules, bold)
2. **Manages Drive folders** -- creates, organizes, and shares them
3. **Handles images** -- uploads to Drive and embeds at the top of documents (logos, headers)
4. **Shares with recipients** -- writer or reader access, with notification emails
5. **Batch uploads** -- process an entire directory of `.md` files into a shared folder

## Setup (One-Time)

### 1. Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable these APIs:
   - Google Docs API
   - Google Drive API

### 2. OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Desktop app**
4. Download the JSON file
5. Save it as `google_credentials.json` in the same directory as `gdocs.py` (or set a custom path)

### 3. Install Dependencies

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

### 4. First Run

The first time you run the library, it opens a browser for Google authorization. After authorizing, a `google_token.json` file is saved locally for future runs (auto-refreshes).

## Usage

### Python API

```python
from gdocs import GoogleDocsClient

client = GoogleDocsClient(
    credentials_file="path/to/google_credentials.json",  # optional, defaults to same dir
    token_file="path/to/google_token.json"                # optional, defaults to same dir
).authenticate()

# Create a single doc
doc_id, url = client.create_doc("My Document Title", markdown_text)
print(url)

# Create a doc in a folder
folder_id = client.create_folder("Project Documents")
doc_id, url = client.create_doc("Report", markdown_text, folder_id=folder_id)

# Share with someone
client.share(doc_id, "collaborator@email.com", role="writer")

# Batch upload a folder of .md files
result = client.upload_markdown_folder(
    source_dir="./docs/",
    folder_name="Project Documents",
    share_with="client@email.com",
    share_role="writer",
    title_prefix="Project Name",     # optional: prepends to doc titles
    logo_path="./assets/logo.png",   # optional: inserts at top of each doc
)
print(result["folder_url"])
for title, url in result["docs"]:
    print(f"  {title}: {url}")
```

### CLI

```bash
# Upload markdown files to a shared folder
python gdocs.py upload file1.md file2.md --folder "My Folder" --share user@email.com

# With logo and title prefix
python gdocs.py upload *.md --folder "Docs" --prefix "Project" --logo logo.png --share user@email.com

# Create a folder and share it
python gdocs.py folder "New Folder" --share user@email.com

# List recent docs
python gdocs.py list
```

### Claude Code Integration

To use this as a Claude Code skill:

1. Copy `gdocs.py` to a stable location (e.g., `~/.local/lib/gdocs.py`)
2. Place credentials alongside it or set custom paths
3. In Claude Code, import and use:

```python
import sys, os
sys.path.insert(0, os.path.expanduser("~/.local/lib"))
from gdocs import GoogleDocsClient

client = GoogleDocsClient().authenticate()
doc_id, url = client.create_doc("Title", markdown_content)
```

## API Reference

| Method | Purpose |
|--------|---------|
| `authenticate()` | Auth with Google (browser on first run, then auto-refresh) |
| `create_doc(title, markdown, folder_id=None)` | Create doc from markdown. Returns `(doc_id, url)` |
| `create_folder(name, parent_id=None)` | Create or find existing folder. Returns `folder_id` |
| `share(file_id, email, role="writer", message=None)` | Share file/folder with a user |
| `share_public(file_id, role="reader")` | Make publicly accessible via link |
| `move_to_folder(file_id, folder_id)` | Move file into a folder |
| `delete(file_id)` | Delete a file or folder |
| `list_files(folder_id=None, limit=20)` | List files (optionally within a folder) |
| `upload_image(filepath, folder_id=None, public=True)` | Upload image, returns `(file_id, uri)` |
| `insert_image(doc_id, uri, width_pt, height_pt, center=True)` | Insert image at top of doc |
| `upload_markdown_folder(source_dir, folder_name, ...)` | Batch upload all `.md` files from a directory |
| `folder_url(folder_id)` | Get the Drive folder URL |

## Markdown Features Supported

| Feature | How It Renders |
|---------|---------------|
| `# Heading` through `###### Heading` | Google Docs heading styles (H1-H6) |
| `- Bullet item` | Bulleted list |
| `1. Numbered item` | Numbered list |
| `- [x] Checkbox` | Indented checkbox text |
| `> Blockquote` | Indented + italicized paragraph |
| `| Table | Row |` | Tab-separated text (Google Docs has limited native table support via API) |
| `` ```code block``` `` | Courier New, 9pt monospace |
| `---` | Horizontal rule (underscores) |
| `**Bold**` | Bold markers are stripped (text preserved) |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `"empty range"` error | The library auto-filters these. If still occurs, check for empty code blocks or zero-length text in your markdown. |
| Token expired | Token auto-refreshes. If refresh fails, delete `google_token.json` and re-run (browser auth). |
| Scope error after changes | Delete the token file to re-authorize with new permissions. |
| Unicode errors on Windows | Run with `python -X utf8` to force UTF-8 mode. |
| Batch update limit | The library automatically chunks requests into batches of 100 (Google Docs API limit per call). |

## Anti-Patterns

- **Don't use for real-time collaboration** -- This creates documents, it doesn't sync them. For live editing, just use Google Docs directly.
- **Don't hardcode credentials paths** -- Use the constructor parameters or environment variables.
- **Don't skip the empty-range filter** -- The Google Docs API rejects `updateTextStyle` requests where `startIndex >= endIndex`. The library handles this automatically.
- **Don't upload massive documents in one shot** -- The batch update API has a practical limit. For very large documents (1000+ lines), consider splitting into multiple docs.

## Origin

Extracted from a real project: building protocol documents for a multi-week creative gathering in Panama. Three 100+ line markdown documents needed to be delivered as professionally formatted Google Docs with logos, organized in folders, and shared with the event organizer. The initial approach (manual Google Docs creation) was replaced with this automated pipeline that handles the full workflow in seconds.

The library was first built as a one-off upload script, then generalized into a reusable tool after recognizing the pattern would recur across projects.

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
