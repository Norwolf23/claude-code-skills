---
name: google-drive-operator
description: Analyze, restructure, and manage Google Drive shared folders. List contents, read documents, rename files, create professional documents, and organize folder hierarchies -- all through the Google Drive and Docs APIs.
triggers:
  - analyze this drive folder
  - organize the drive
  - restructure drive folder
  - read drive contents
  - drive link
  - shared folder
  - google drive
---

# Google Drive Operator

A Claude Code skill for full CRUD operations on Google Drive: list, read, rename, move, create, delete, and format professional documents.

Drop a Google Drive folder link and this skill handles the rest -- from understanding the structure to reorganizing it and generating formatted documents.

## Prerequisites

- Python 3.10+
- Google Cloud project with **Google Docs API** and **Google Drive API** enabled
- OAuth 2.0 Client ID (Desktop app) credentials file
- Python packages: `google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib`

## Setup

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Google Docs API** and **Google Drive API**
4. Create OAuth 2.0 Client ID (Desktop app)
5. Download credentials JSON
6. On first run, a browser window opens for authorization -- token is cached for future use

## Workflow

When a user drops a Google Drive link, follow these 7 steps:

### 1. PARSE -- Extract folder/doc ID from URL

```python
import re

# Folder: https://drive.google.com/drive/folders/{FOLDER_ID}?usp=sharing
# Doc:    https://docs.google.com/document/d/{DOC_ID}/edit
folder_match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
doc_match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
folder_id = folder_match.group(1) if folder_match else None
doc_id = doc_match.group(1) if doc_match else None
```

### 2. LIST -- Recursive tree of contents

```python
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# Authenticate (see Setup)
creds = Credentials.from_authorized_user_file("token.json", [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
])
drive = build("drive", "v3", credentials=creds)
docs_svc = build("docs", "v1", credentials=creds)

def list_files(folder_id, limit=50):
    query = f"'{folder_id}' in parents and trashed=false"
    results = drive.files().list(
        q=query, pageSize=limit,
        fields="files(id, name, mimeType, modifiedTime, webViewLink)",
        orderBy="modifiedTime desc"
    ).execute()
    return results.get("files", [])

def tree(folder_id, indent=0):
    files = list_files(folder_id)
    for f in files:
        mime = f["mimeType"]
        is_folder = "folder" in mime
        is_doc = "document" in mime
        is_video = "video" in mime
        is_image = "image" in mime
        icon = "d" if is_folder else "D" if is_doc else "V" if is_video else "I" if is_image else "?"
        prefix = "  " * indent
        print(f"{prefix}{icon} {f['name']}")
        if is_folder:
            tree(f["id"], indent + 1)

tree(folder_id)
```

### 3. READ -- Extract text and images from Google Docs

```python
doc = docs_svc.documents().get(documentId=doc_id).execute()
content = doc.get("body", {}).get("content", [])
inline_objects = doc.get("inlineObjects", {})

for element in content:
    if "paragraph" in element:
        for elem in element["paragraph"].get("elements", []):
            if "textRun" in elem:
                text = elem["textRun"]["content"]
                print(text, end="")
            if "inlineObjectElement" in elem:
                obj_id = elem["inlineObjectElement"]["inlineObjectId"]
                props = inline_objects[obj_id]["inlineObjectProperties"]["embeddedObject"]
                uri = props.get("imageProperties", {}).get("sourceUri", "")
                print(f"[IMAGE: {uri}]")
```

### 4. CHECK PERMISSIONS -- Before any writes

```python
meta = drive.files().get(
    fileId=file_id,
    fields="capabilities(canEdit,canRename,canAddChildren,canShare,canComment)"
).execute()
caps = meta["capabilities"]

if not caps.get("canEdit"):
    print("View-only access. Request editor permissions before modifying.")
```

Always check per-file -- permissions may vary across files in the same shared folder.

### 5. MODIFY -- Rename, move, create, delete

```python
# Rename a file or folder
drive.files().update(fileId=fid, body={"name": new_name}, fields="id").execute()

# Move to a new parent folder
f = drive.files().get(fileId=fid, fields="parents").execute()
prev_parents = ",".join(f.get("parents", []))
drive.files().update(
    fileId=fid, addParents=new_parent_id, removeParents=prev_parents, fields="id"
).execute()

# Create a folder
meta = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
drive.files().create(body=meta, fields="id").execute()

# Delete a file or folder
drive.files().delete(fileId=file_id).execute()
```

### 6. FORMAT -- Build professional documents with precise control

The `DocBuilder` pattern gives you precise control over text formatting, inline images, and status labels. Useful for creating structured feedback or tracking documents.

```python
class DocBuilder:
    """Builds Google Docs content with precise formatting control."""

    def __init__(self):
        self.reqs = []
        self.idx = 1

    def text(self, text, heading=None, bold=False):
        """Insert text, optionally as a heading or bold."""
        self.reqs.append({"insertText": {"location": {"index": self.idx}, "text": text}})
        end = self.idx + len(text)
        if heading:
            self.reqs.append({"updateParagraphStyle": {
                "range": {"startIndex": self.idx, "endIndex": end},
                "paragraphStyle": {"namedStyleType": heading},
                "fields": "namedStyleType"
            }})
        if bold and len(text.strip()) > 0:
            self.reqs.append({"updateTextStyle": {
                "range": {"startIndex": self.idx, "endIndex": end - 1},
                "textStyle": {"bold": True}, "fields": "bold"
            }})
        self.idx = end

    def image(self, uri, width=400, height=250):
        """Insert an inline image from a public URI."""
        self.reqs.append({"insertInlineImage": {
            "uri": uri, "location": {"index": self.idx},
            "objectSize": {
                "width": {"magnitude": width, "unit": "PT"},
                "height": {"magnitude": height, "unit": "PT"}
            }
        }})
        self.idx += 1
        self.reqs.append({"insertText": {"location": {"index": self.idx}, "text": "\n"}})
        self.idx += 1

    def status(self, label="PENDING"):
        """Insert a colored status label (orange for PENDING, green for DONE)."""
        tag = f"Status: {label}\n"
        self.reqs.append({"insertText": {"location": {"index": self.idx}, "text": tag}})
        end = self.idx + len(tag) - 1
        color = (
            {"red": 0.85, "green": 0.55, "blue": 0.0} if label == "PENDING"
            else {"red": 0.0, "green": 0.6, "blue": 0.0}
        )
        self.reqs.append({"updateTextStyle": {
            "range": {"startIndex": self.idx, "endIndex": end},
            "textStyle": {"bold": True, "foregroundColor": {"color": {"rgbColor": color}}},
            "fields": "bold,foregroundColor"
        }})
        self.idx += len(tag)

    def hr(self):
        """Insert a horizontal rule."""
        rule = "________________________________________\n"
        self.reqs.append({"insertText": {"location": {"index": self.idx}, "text": rule}})
        self.idx += len(rule)

    def send(self, doc_id, docs_service, batch_size=35):
        """Send all accumulated requests to the API in batches."""
        valid = []
        for r in self.reqs:
            skip = False
            for key in ("updateTextStyle", "updateParagraphStyle"):
                if key in r:
                    rng = r[key].get("range", {})
                    if rng.get("startIndex", 0) >= rng.get("endIndex", 0):
                        skip = True
            if not skip:
                valid.append(r)
        for i in range(0, len(valid), batch_size):
            chunk = valid[i:i + batch_size]
            docs_service.documents().batchUpdate(
                documentId=doc_id, body={"requests": chunk}
            ).execute()
```

To clear a document before rebuilding:

```python
def clear_doc(doc_id, docs_service):
    """Remove all content from a Google Doc (preserving the document itself)."""
    doc = docs_service.documents().get(documentId=doc_id).execute()
    content = doc.get("body", {}).get("content", [])
    if len(content) > 1:
        end_index = content[-1]["endIndex"] - 1
        if end_index > 1:
            docs_service.documents().batchUpdate(
                documentId=doc_id,
                body={"requests": [{"deleteContentRange": {
                    "range": {"startIndex": 1, "endIndex": end_index}
                }}]}
            ).execute()
```

### 7. VERIFY -- Confirm final state

Always end with a recursive tree listing to confirm the result matches expectations.

## Conventions

These naming conventions help keep shared Drive folders organized:

| Element | Convention | Example |
|---------|-----------|---------|
| Dated documents | `[YYYY-MM-DD] Title` | `[2026-02-20] Homepage Changes` |
| Folder names | Match local project directory names | `website-panama` |
| Asset folders | Prefix with `assets --` | `assets -- Hero Background` |
| Status tracking | Built into each document | PENDING / IN PROGRESS / REVIEW / DONE |

## Gotchas

- **Shared folder permissions**: Check `capabilities` per file before writing. Editor access may not propagate instantly after sharing.
- **Google-hosted image URIs**: Images from `lh7-rt.googleusercontent.com/docsz/...` work for re-embedding via `insertInlineImage` as long as the `?key=` parameter is intact.
- **Non-ASCII text in shell**: Spanish accents, emoji, and special characters break inline Python in bash. Write a `.py` file instead and run it.
- **Batch API limits**: Send max 35-50 requests per `batchUpdate` call. More than that risks timeouts.
- **Image re-embedding**: Always capture image URIs from `inlineObjects` BEFORE clearing a document -- they're destroyed when content is deleted.
- **WebFetch on Drive URLs**: Returns JavaScript framework code, not file listings. Always use the Drive API directly.

## Quality Criteria

- [ ] All folder/file operations verified with a final tree listing
- [ ] Permissions checked before any write operations
- [ ] Documents formatted with consistent naming conventions
- [ ] Status tracking built into feedback documents
- [ ] No orphaned files or broken references after restructuring
- [ ] Non-ASCII content handled via temp Python files (not inline bash)

## Origin

Extracted from a real project: Restructuring a client's shared Google Drive feedback folder into an organized multi-project collaboration space. The session involved analyzing folder contents, renaming files to match local project structure, rebuilding raw feedback documents into professional status-tracked documents with re-embedded screenshots, and creating project briefs for multiple workstreams.

---

*Part of the [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) collection -- skills extracted from real AI-assisted development sessions.*
