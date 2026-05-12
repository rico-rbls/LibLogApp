import sys
import subprocess
from datetime import datetime

def sync_progress(commit_msg, worklog_entry):
    # 1. Append to Worklog
    try:
        with open("worklog.md", "a") as f:
            f.write(f"\n### {datetime.now().strftime('%b %d, %Y %I:%M %p')} - Automated Sync\n")
            f.write(f"* {worklog_entry}\n")
    except Exception as e:
        print(f"Error updating worklog: {e}")
        return

    # 2. Execute the Robles Git Loop
    try:
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        subprocess.run(["git", "push", "origin", "master"], check=True)
        print("\n✅ Success: overview.md updated, worklog.md appended, and codebase pushed to origin.")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Git Sync Failed. Please check your git configuration. Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python sync_progress.py \"<commit_msg>\" \"<worklog_entry>\"")
    else:
        sync_progress(sys.argv[1], sys.argv[2])