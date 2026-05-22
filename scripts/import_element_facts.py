"""
Import element_facts.json into the eq_element_facts Supabase table.
Safe to re-run — uses upsert (on_conflict='symbol').

Usage:
  pip install -r requirements.txt
  python import_element_facts.py
"""

import json
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

def main():
    facts_path = os.path.join(os.path.dirname(__file__), "element_facts.json")
    if not os.path.exists(facts_path):
        print("element_facts.json not found — generate it via Claude Code first.")
        return

    with open(facts_path, "r", encoding="utf-8") as f:
        rows = json.load(f)

    print(f"Loaded {len(rows)} element rows from element_facts.json")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    result = client.table("eq_element_facts").upsert(rows, on_conflict="symbol").execute()
    print(f"Upserted {len(result.data)} rows successfully.")

if __name__ == "__main__":
    main()
