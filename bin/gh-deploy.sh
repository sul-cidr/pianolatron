#!/usr/bin/env bash

set -euo pipefail;

MAIN_BRANCH=main;
DEPLOY_BRANCH=gh-pages;
BUILD_FOLDER=build;

function abort() {
  [ ! -t 1 ] && printf "%s\n" "$1" >&2 && exit "${2-1}";
  printf "\e[;31m%s\e[0m\n" "$1" >&2 && exit "${2-1}";
}


[ ! -d "$BUILD_FOLDER" ] && abort "'$BUILD_FOLDER' does not exist -- aborting!";

current_branch=$(git rev-parse --abbrev-ref HEAD);
[ "$current_branch" != "$MAIN_BRANCH" ] && abort "Won't deploy from branch '$current_branch' -- aborting!";

unclean=$(git status --porcelain) && [ -n "$unclean" ] && abort "Working directory is not clean -- aborting!";


COMMIT_MESSAGE="Deploy from $(git log -n 1 --format="%h" HEAD) at $(date +"%Y-%m-%d %H:%M:%S %Z")";

# Ensure $DEPLOY_BRANCH is up-to-date with remote
git fetch --force origin "$DEPLOY_BRANCH":"$DEPLOY_BRANCH";

git symbolic-ref HEAD refs/heads/"$DEPLOY_BRANCH";
touch "$BUILD_FOLDER/.nojekyll";

git --work-tree "$BUILD_FOLDER" reset --mixed --quiet;
git --work-tree "$BUILD_FOLDER" add --all;

set +o errexit;
diff=$(git --work-tree "$BUILD_FOLDER" diff --exit-code --quiet HEAD --)$?;
set -o errexit;
case $diff in
  0) git checkout --force "$MAIN_BRANCH";
     abort "'$BUILD_FOLDER' unchanged -- nothing to commit." 0;
     ;;
  1) git --work-tree "$BUILD_FOLDER" commit -m "$COMMIT_MESSAGE";
     git push origin "$DEPLOY_BRANCH";
     git checkout --force "$MAIN_BRANCH";
     ;;
  *)
    abort "git diff exited with code $diff -- aborting. Use 'git checkout --force $MAIN_BRANCH' to return to $MAIN_BRANCH." "$diff";;
esac;
