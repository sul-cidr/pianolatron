#!/usr/bin/env bash

set -euo pipefail;

MAIN_BRANCH=main;
DEPLOY_BRANCH=gh-pages;
BUILD_FOLDER=build;

if [ ! -d "$BUILD_FOLDER" ]; then
  echo "'$BUILD_FOLDER' does not exist -- aborting!" >&2;
  exit 1;
fi;

current_branch=$(git rev-parse --abbrev-ref HEAD);
if [ "$current_branch" != "$MAIN_BRANCH" ]; then
  echo "Won't deploy from branch '$current_branch' -- aborting!" >&2;
  exit 1;
fi;


if unclean=$(git status --porcelain) && [ -n "$unclean" ]; then
  echo "Working directory is not clean -- aborting!" >&2
  exit 1;
fi;

COMMIT_MESSAGE="Deploy from $(git log -n 1 --format="%h" HEAD) at $(date +"%Y-%m-%d %H:%M:%S %Z")";

# Ensure $DEPLOY_BRANCH is up-to-date with remote
git fetch --force origin "$DEPLOY_BRANCH":"$DEPLOY_BRANCH";

git symbolic-ref HEAD refs/heads/"$DEPLOY_BRANCH";
touch "$BUILD_FOLDER/.nojekyll";

git --work-tree "$BUILD_FOLDER" reset --mixed --quiet;
git --work-tree "$BUILD_FOLDER" add --all;

set +o errexit
diff=$(git --work-tree "$BUILD_FOLDER" diff --exit-code --quiet HEAD --)$?
set -o errexit
case $diff in
  0) echo "$BUILD_FOLDER unchanged -- nothing to commit.";
     exit 0;
     ;;
  1) ;;
  *)
    echo "git diff exited with code $diff -- aborting.  Use 'git checkout --force $MAIN_BRANCH' to return to $MAIN_BRANCH." >&2
    exit "$diff"
    ;;
esac

git --work-tree "$BUILD_FOLDER" commit -m "$COMMIT_MESSAGE";
git push origin "$DEPLOY_BRANCH";

git checkout --force "$MAIN_BRANCH";
