"""Notion -> text, using only the official ``notion-client`` (public API).

Kept as a first-class source to demonstrate external-API integration. Compared
to the original implementation:
* The token comes from backend config (env), never from the client.
* Page selection is deterministic (sorted, capped) so demos are reproducible -
  the old code picked a random subpage every run.
* No private/internal exporter calls and no extra async machinery; we walk the
  public blocks API and pull plain text out of rich-text spans.
"""
from __future__ import annotations

from config import config

MAX_PAGES = 5          # cap subpages pulled per request (free-tier friendly)
MAX_BLOCK_DEPTH = 3    # how deep to recurse into nested blocks

# Block types whose rich_text we treat as readable content.
_TEXT_BLOCKS = {
    "paragraph",
    "heading_1",
    "heading_2",
    "heading_3",
    "bulleted_list_item",
    "numbered_list_item",
    "to_do",
    "toggle",
    "quote",
    "callout",
    "code",
}


class NotionSourceError(RuntimeError):
    pass


class NotionDataFetcher:
    def __init__(self, top_page_ids, token: str | None = None, max_pages: int = MAX_PAGES):
        self.token = token or config.require_notion()
        self.top_page_ids = list(dict.fromkeys(top_page_ids))  # de-dupe, keep order
        self.max_pages = max_pages

        try:
            from notion_client import Client as NotionClient
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise NotionSourceError(
                "notion-client is not installed. Run "
                "`pip install -r requirements.txt` to use the Notion source."
            ) from exc

        self.notion = NotionClient(auth=self.token)

    def _child_pages(self, block_id: str) -> list[str]:
        try:
            children = self.notion.blocks.children.list(block_id=block_id)
        except Exception as exc:  # noqa: BLE001
            raise NotionSourceError(
                f"Could not read Notion page {block_id}: {exc}"
            ) from exc
        return [c["id"] for c in children["results"] if c.get("type") == "child_page"]

    def _block_text(self, block_id: str, depth: int = 0) -> str:
        if depth > MAX_BLOCK_DEPTH:
            return ""
        try:
            blocks = self.notion.blocks.children.list(block_id=block_id)["results"]
        except Exception:  # noqa: BLE001 - skip unreadable subtrees, don't fail the run
            return ""

        lines: list[str] = []
        for block in blocks:
            btype = block.get("type")
            if btype in _TEXT_BLOCKS:
                spans = block.get(btype, {}).get("rich_text", [])
                text = "".join(s.get("plain_text", "") for s in spans).strip()
                if text:
                    lines.append(text)
            if block.get("has_children"):
                nested = self._block_text(block["id"], depth + 1)
                if nested:
                    lines.append(nested)
        return "\n".join(lines)

    def fetch_text(self) -> str:
        """Return concatenated text from the child pages of the given page IDs."""
        subpage_ids: list[str] = []
        for top in self.top_page_ids:
            subpage_ids.extend(self._child_pages(top))

        selected = sorted(set(subpage_ids))[: self.max_pages]
        if not selected:
            raise NotionSourceError(
                "No child pages found under the given Notion page IDs. "
                "Make sure the integration is shared with those pages."
            )

        texts = [self._block_text(pid) for pid in selected]
        combined = "\n\n".join(t for t in texts if t).strip()
        if not combined:
            raise NotionSourceError("Found child pages but no readable text in them.")
        return combined
