"""
Google Docs & Drive API Library
================================
General-purpose library for creating, uploading, and sharing
Google Docs from markdown content.

Setup (one-time):
    1. Google Cloud Console -> Create project -> Enable Docs API + Drive API
    2. Create OAuth 2.0 Client ID (Desktop app)
    3. Save credentials JSON next to this file (or pass custom path)
    4. First run opens browser for authorization

Usage from Python:
    from gdocs import GoogleDocsClient
    client = GoogleDocsClient().authenticate()
    doc_id, url = client.create_doc("My Title", markdown_text, folder_id="...")
    client.share(doc_id, "email@example.com", role="writer")

Usage from CLI:
    python gdocs.py upload file.md --title "My Doc" --folder "My Folder"
    python gdocs.py upload *.md --folder "Project Docs" --share user@email.com
    python gdocs.py folder "Project Name" --share user@email.com
    python gdocs.py list

Dependencies:
    pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
"""

import argparse
import glob
import os
import re
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Default credential paths: same directory as this script.
# Override by passing custom paths to GoogleDocsClient().
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(_SCRIPT_DIR, "google_credentials.json")
TOKEN_FILE = os.path.join(_SCRIPT_DIR, "google_token.json")
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
]


class GoogleDocsClient:
    """Client for Google Docs and Drive operations."""

    def __init__(self, credentials_file=None, token_file=None):
        self.credentials_file = credentials_file or CREDENTIALS_FILE
        self.token_file = token_file or TOKEN_FILE
        self._creds = None
        self._docs = None
        self._drive = None

    def authenticate(self):
        """Authenticate with Google. Opens browser on first run."""
        if os.path.exists(self.token_file):
            self._creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)

        if not self._creds or not self._creds.valid:
            if self._creds and self._creds.expired and self._creds.refresh_token:
                self._creds.refresh(Request())
            else:
                print("Opening browser for Google authorization...")
                flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                self._creds = flow.run_local_server(port=0)

            with open(self.token_file, "w") as f:
                f.write(self._creds.to_json())

        self._docs = build("docs", "v1", credentials=self._creds)
        self._drive = build("drive", "v3", credentials=self._creds)
        return self

    @property
    def docs(self):
        if not self._docs:
            self.authenticate()
        return self._docs

    @property
    def drive(self):
        if not self._drive:
            self.authenticate()
        return self._drive

    # --- Folder operations ---

    def create_folder(self, name, parent_id=None):
        """Create a Drive folder. Returns existing folder if name matches."""
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        results = self.drive.files().list(q=query, fields="files(id, name)").execute()
        existing = results.get("files", [])

        if existing:
            return existing[0]["id"]

        meta = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
        if parent_id:
            meta["parents"] = [parent_id]
        folder = self.drive.files().create(body=meta, fields="id").execute()
        return folder["id"]

    def share(self, file_id, email, role="writer", message=None):
        """Share a file or folder with an email address."""
        permission = {"type": "user", "role": role, "emailAddress": email}
        kwargs = {"fileId": file_id, "body": permission, "sendNotificationEmail": True}
        if message:
            kwargs["emailMessage"] = message
        try:
            self.drive.permissions().create(**kwargs).execute()
            return True
        except Exception as e:
            print(f"Warning: Could not share with {email}: {e}")
            return False

    def share_public(self, file_id, role="reader"):
        """Make a file publicly accessible."""
        permission = {"type": "anyone", "role": role}
        self.drive.permissions().create(fileId=file_id, body=permission).execute()

    def move_to_folder(self, file_id, folder_id):
        """Move a file into a folder."""
        file = self.drive.files().get(fileId=file_id, fields="parents").execute()
        prev_parents = ",".join(file.get("parents", []))
        self.drive.files().update(
            fileId=file_id, addParents=folder_id,
            removeParents=prev_parents, fields="id, parents"
        ).execute()

    def folder_url(self, folder_id):
        return f"https://drive.google.com/drive/folders/{folder_id}"

    def delete(self, file_id):
        """Delete a file or folder."""
        self.drive.files().delete(fileId=file_id).execute()

    def list_files(self, folder_id=None, limit=20):
        """List files, optionally within a folder."""
        query = "trashed=false"
        if folder_id:
            query = f"'{folder_id}' in parents and trashed=false"
        results = self.drive.files().list(
            q=query, pageSize=limit,
            fields="files(id, name, mimeType, modifiedTime, webViewLink)",
            orderBy="modifiedTime desc"
        ).execute()
        return results.get("files", [])

    # --- Document operations ---

    def create_doc(self, title, markdown_text, folder_id=None):
        """Create a Google Doc from markdown. Returns (doc_id, url)."""
        doc = self.docs.documents().create(body={"title": title}).execute()
        doc_id = doc["documentId"]

        if folder_id:
            self.move_to_folder(doc_id, folder_id)

        requests = self._markdown_to_requests(markdown_text)
        requests = self._filter_valid_requests(requests)

        if requests:
            for j in range(0, len(requests), 100):
                chunk = requests[j:j + 100]
                self.docs.documents().batchUpdate(
                    documentId=doc_id, body={"requests": chunk}
                ).execute()

        url = f"https://docs.google.com/document/d/{doc_id}/edit"
        return doc_id, url

    def insert_image(self, doc_id, image_uri, width_pt=250, height_pt=57, center=True):
        """Insert an image at the top of a document."""
        requests = [
            {
                "insertInlineImage": {
                    "uri": image_uri,
                    "location": {"index": 1},
                    "objectSize": {
                        "width": {"magnitude": width_pt, "unit": "PT"},
                        "height": {"magnitude": height_pt, "unit": "PT"},
                    },
                }
            },
            {"insertText": {"location": {"index": 2}, "text": "\n"}},
        ]
        if center:
            requests.append({
                "updateParagraphStyle": {
                    "range": {"startIndex": 1, "endIndex": 3},
                    "paragraphStyle": {"alignment": "CENTER"},
                    "fields": "alignment",
                }
            })
        self.docs.documents().batchUpdate(
            documentId=doc_id, body={"requests": requests}
        ).execute()

    def upload_image(self, filepath, folder_id=None, public=True):
        """Upload an image to Drive. Returns (file_id, uri for Docs embedding)."""
        name = os.path.basename(filepath)
        meta = {"name": name}
        if folder_id:
            meta["parents"] = [folder_id]
        media = MediaFileUpload(filepath, mimetype="image/png")
        f = self.drive.files().create(body=meta, media_body=media, fields="id").execute()
        file_id = f["id"]
        if public:
            self.share_public(file_id)
        uri = f"https://drive.google.com/uc?id={file_id}"
        return file_id, uri

    # --- Batch operations ---

    def upload_markdown_folder(self, source_dir, folder_name, share_with=None,
                                share_role="writer", title_prefix="", logo_path=None):
        """Upload all .md files from a directory into a Google Drive folder.

        Returns dict with folder_url and list of (title, doc_url) tuples.
        """
        folder_id = self.create_folder(folder_name)
        print(f"Folder: {self.folder_url(folder_id)}")

        # Check existing docs
        existing = {f["name"]: f["id"] for f in self.list_files(folder_id)}

        # Upload logo if provided
        logo_uri = None
        if logo_path and os.path.exists(logo_path):
            _, logo_uri = self.upload_image(logo_path, folder_id)
            print(f"Logo uploaded: {logo_uri}")

        # Process markdown files
        md_files = sorted(glob.glob(os.path.join(source_dir, "*.md")))
        doc_urls = []

        for filepath in md_files:
            filename = os.path.basename(filepath)
            title = filename.replace(".md", "").replace("_", " ")
            title = re.sub(r"^\d+\s+", "", title)
            if title_prefix:
                title = f"{title_prefix} - {title}"

            if title in existing:
                url = f"https://docs.google.com/document/d/{existing[title]}/edit"
                doc_urls.append((title, url))
                print(f"SKIP (exists): {title}")
                continue

            with open(filepath, "r", encoding="utf-8") as f:
                markdown_text = f.read()

            doc_id, url = self.create_doc(title, markdown_text, folder_id)
            print(f"Created: {title} -> {url}")

            if logo_uri:
                self.insert_image(doc_id, logo_uri)

            doc_urls.append((title, url))

        # Share
        if share_with:
            for email in (share_with if isinstance(share_with, list) else [share_with]):
                self.share(folder_id, email, share_role)
                print(f"Shared with {email} ({share_role})")

        return {
            "folder_id": folder_id,
            "folder_url": self.folder_url(folder_id),
            "docs": doc_urls,
        }

    # --- Internal: Markdown parser ---

    @staticmethod
    def _filter_valid_requests(requests):
        """Remove requests with empty ranges that the API rejects."""
        def valid(req):
            for key in ("updateTextStyle", "updateParagraphStyle"):
                if key in req:
                    r = req[key].get("range", {})
                    if r.get("startIndex", 0) >= r.get("endIndex", 0):
                        return False
            return True
        return [r for r in requests if valid(r)]

    @staticmethod
    def _markdown_to_requests(markdown_text):
        """Convert markdown to Google Docs API batch update requests."""
        requests = []
        index = 1

        lines = markdown_text.split("\n")
        i = 0

        while i < len(lines):
            line = lines[i]

            if not line.strip():
                requests.append({"insertText": {"location": {"index": index}, "text": "\n"}})
                index += 1
                i += 1
                continue

            # Headings
            heading_match = re.match(r"^(#{1,6})\s+(.*)", line)
            if heading_match:
                level = len(heading_match.group(1))
                text = re.sub(r"\*\*(.*?)\*\*", r"\1", heading_match.group(2).strip())
                requests.append({"insertText": {"location": {"index": index}, "text": text + "\n"}})
                style_map = {1: "HEADING_1", 2: "HEADING_2", 3: "HEADING_3",
                             4: "HEADING_4", 5: "HEADING_5", 6: "HEADING_6"}
                requests.append({
                    "updateParagraphStyle": {
                        "range": {"startIndex": index, "endIndex": index + len(text) + 1},
                        "paragraphStyle": {"namedStyleType": style_map.get(level, "HEADING_4")},
                        "fields": "namedStyleType",
                    }
                })
                index += len(text) + 1
                i += 1
                continue

            # Horizontal rule
            if line.strip() in ("---", "***", "___"):
                rule = "________________________________________\n"
                requests.append({"insertText": {"location": {"index": index}, "text": rule}})
                index += len(rule)
                i += 1
                continue

            # Blockquote
            if line.startswith(">"):
                text = re.sub(r"\*\*(.*?)\*\*", r"\1", re.sub(r"^>\s*", "", line).strip()) + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": text}})
                requests.append({
                    "updateParagraphStyle": {
                        "range": {"startIndex": index, "endIndex": index + len(text)},
                        "paragraphStyle": {"indentStart": {"magnitude": 36, "unit": "PT"}},
                        "fields": "indentStart",
                    }
                })
                requests.append({
                    "updateTextStyle": {
                        "range": {"startIndex": index, "endIndex": index + len(text) - 1},
                        "textStyle": {"italic": True},
                        "fields": "italic",
                    }
                })
                index += len(text)
                i += 1
                continue

            # Table
            if "|" in line and line.strip().startswith("|"):
                table_lines = []
                while i < len(lines) and "|" in lines[i] and lines[i].strip().startswith("|"):
                    row = lines[i].strip()
                    if re.match(r"^\|[\s\-:|]+\|$", row):
                        i += 1
                        continue
                    cells = [re.sub(r"\*\*(.*?)\*\*", r"\1", c.strip()) for c in row.split("|")[1:-1]]
                    table_lines.append("\t".join(cells))
                    i += 1
                text = "\n".join(table_lines) + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": text}})
                index += len(text)
                continue

            # Code block
            if line.strip().startswith("```"):
                code_lines = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("```"):
                    code_lines.append(lines[i])
                    i += 1
                i += 1
                text = "\n".join(code_lines) + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": text}})
                if len(text) > 1:
                    requests.append({
                        "updateTextStyle": {
                            "range": {"startIndex": index, "endIndex": index + len(text) - 1},
                            "textStyle": {
                                "weightedFontFamily": {"fontFamily": "Courier New"},
                                "fontSize": {"magnitude": 9, "unit": "PT"},
                            },
                            "fields": "weightedFontFamily,fontSize",
                        }
                    })
                index += len(text)
                continue

            # Checkbox
            cb = re.match(r"^(\s*)- \[([ x])\]\s+(.*)", line)
            if cb:
                text = re.sub(r"\*\*(.*?)\*\*", r"\1", cb.group(3).strip())
                prefix = "[x] " if cb.group(2) == "x" else "[ ] "
                full = prefix + text + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": full}})
                pts = 36 + (len(cb.group(1)) // 2) * 18
                requests.append({
                    "updateParagraphStyle": {
                        "range": {"startIndex": index, "endIndex": index + len(full)},
                        "paragraphStyle": {
                            "indentStart": {"magnitude": pts, "unit": "PT"},
                            "indentFirstLine": {"magnitude": pts - 18, "unit": "PT"},
                        },
                        "fields": "indentStart,indentFirstLine",
                    }
                })
                index += len(full)
                i += 1
                continue

            # Bullet list
            bul = re.match(r"^(\s*)[-*]\s+(.*)", line)
            if bul:
                text = "  " + re.sub(r"\*\*(.*?)\*\*", r"\1", bul.group(2).strip()) + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": text}})
                requests.append({
                    "createParagraphBullets": {
                        "range": {"startIndex": index, "endIndex": index + len(text)},
                        "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE",
                    }
                })
                index += len(text)
                i += 1
                continue

            # Numbered list
            num = re.match(r"^(\d+)\.\s+(.*)", line)
            if num:
                text = re.sub(r"\*\*(.*?)\*\*", r"\1", num.group(2).strip()) + "\n"
                requests.append({"insertText": {"location": {"index": index}, "text": text}})
                requests.append({
                    "createParagraphBullets": {
                        "range": {"startIndex": index, "endIndex": index + len(text)},
                        "bulletPreset": "NUMBERED_DECIMAL_NESTED",
                    }
                })
                index += len(text)
                i += 1
                continue

            # Regular paragraph
            text = re.sub(r"\*\*(.*?)\*\*", r"\1", line.strip()) + "\n"
            requests.append({"insertText": {"location": {"index": index}, "text": text}})
            index += len(text)
            i += 1

        return requests


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Google Docs & Drive CLI")
    sub = parser.add_subparsers(dest="command")

    # upload
    up = sub.add_parser("upload", help="Upload markdown files to Google Docs")
    up.add_argument("files", nargs="+", help="Markdown files to upload")
    up.add_argument("--title", help="Title for single file upload")
    up.add_argument("--folder", help="Drive folder name", default="Uploads")
    up.add_argument("--share", help="Email to share with")
    up.add_argument("--role", default="writer", choices=["reader", "writer"])
    up.add_argument("--logo", help="Path to logo image to insert at top")
    up.add_argument("--prefix", default="", help="Title prefix for docs")

    # folder
    fl = sub.add_parser("folder", help="Create a Drive folder")
    fl.add_argument("name", help="Folder name")
    fl.add_argument("--share", help="Email to share with")
    fl.add_argument("--role", default="writer", choices=["reader", "writer"])

    # list
    ls = sub.add_parser("list", help="List recent docs")
    ls.add_argument("--folder-id", help="Folder ID to list")
    ls.add_argument("--limit", type=int, default=20)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    client = GoogleDocsClient()
    client.authenticate()

    if args.command == "upload":
        folder_id = client.create_folder(args.folder)
        print(f"Folder: {client.folder_url(folder_id)}")

        logo_uri = None
        if args.logo and os.path.exists(args.logo):
            _, logo_uri = client.upload_image(args.logo, folder_id)

        for filepath in args.files:
            with open(filepath, "r", encoding="utf-8") as f:
                md = f.read()
            title = args.title or os.path.basename(filepath).replace(".md", "").replace("_", " ")
            title = re.sub(r"^\d+\s+", "", title)
            if args.prefix:
                title = f"{args.prefix} - {title}"
            doc_id, url = client.create_doc(title, md, folder_id)
            if logo_uri:
                client.insert_image(doc_id, logo_uri)
            print(f"  {title}: {url}")

        if args.share:
            client.share(folder_id, args.share, args.role)
            print(f"Shared with {args.share} ({args.role})")

    elif args.command == "folder":
        folder_id = client.create_folder(args.name)
        print(f"Created: {client.folder_url(folder_id)}")
        if args.share:
            client.share(folder_id, args.share, args.role)
            print(f"Shared with {args.share}")

    elif args.command == "list":
        files = client.list_files(args.folder_id, args.limit)
        for f in files:
            print(f"  {f['name']}  {f.get('webViewLink', '')}")


if __name__ == "__main__":
    main()
