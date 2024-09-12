#!/bin/bash

# Replace this with the hash of your setup commit or any starting point commit
START_COMMIT_HASH="93703eea50cecdc085df34de219e9b0ab95fa5c3"

# Initialize counters
total_added=0
total_deleted=0

# Loop over all commits after the setup commit
for commit in $(git rev-list $START_COMMIT_HASH..HEAD); do
    # Get stats for the current commit
    stats=$(git show --shortstat $commit)

    # Extract added and deleted lines from the stats
    added=$(echo "$stats" | grep -oP '\d+(?= insertion)' | head -n 1)
    deleted=$(echo "$stats" | grep -oP '\d+(?= deletion)' | head -n 1)

    # If no additions or deletions were found, set to 0
    added=${added:-0}
    deleted=${deleted:-0}

    # Accumulate the totals
    total_added=$((total_added + added))
    total_deleted=$((total_deleted + deleted))
done

# Output the total counts
echo "Total lines added: $total_added"
echo "Total lines deleted: $total_deleted"
