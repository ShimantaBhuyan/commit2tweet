[![.github/workflows/build-main.yml](https://github.com/ShimantaBhuyan/commit2tweet/actions/workflows/build-main.yml/badge.svg?branch=main)](https://github.com/ShimantaBhuyan/commit2tweet/actions/workflows/build-main.yml)

<img src="https://raw.githubusercontent.com/ShimantaBhuyan/commit2tweet/main/images/icon.png" width="50px" />

# commit2share

This extension allows you to share a Tweet or a LinkedIn post from your latest Git commit diffs, with just one click. It uses LLMs to generate a tweet/linkedin post summarizing the changes in your commit.

Run locally with Ollama!

![image](https://github.com/ShimantaBhuyan/commit2tweet/assets/32566682/9a7d1bc4-28d6-431a-b832-c30a45da7889)

## Get it in the VSCode Extension Marketplace

Search for "Commit2Share" or "Commit2Tweet" in the VSCode Extension Marketplace

Or go here: https://marketplace.visualstudio.com/items?itemName=ShimantaKrishnaBhuyan.commit2tweet

## Features

- Tweet/Share to LinkedIn your latest Git commit diff with a single click
- Summarizes the commit diff using AI
- Automatically opens the tweet in your default web browser
- Local LLMs with Ollama, and OpenAI api compatible

## Requirements

- Git installed and configured on your local machine
- (OPTIONAL) An API key for the LLM service (OpenAI compatible api)
- Login to X/Twitter and Linkedin in your default browser for seamless sharing

## How to Use

The Commit2Share extension allows you to easily share your latest commit changes on Twitter or LinkedIn directly from VS Code. Here's how to use it:

### Sharing to Twitter

1. Make sure you have committed your latest changes.
2. Use one of the following methods to tweet your commit diff:
   - Press `Ctrl+Alt+L` (Windows/Linux) or `Cmd+Ctrl+L` (Mac)
   - Open the Command Palette (F1 or Ctrl+Shift+P) and search for "Tweet Commit Diff"
   - Right-click in the editor and select "Tweet Commit Diff" from the context menu

### Sharing to LinkedIn

1. Ensure your latest changes are committed.
2. Share your commit diff to LinkedIn using one of these methods:
   - Press `Ctrl+Alt+K` (Windows/Linux) or `Cmd+Ctrl+K` (Mac)
   - Open the Command Palette (F1 or Ctrl+Shift+P) and search for "Share Commit Diff to LinkedIn"
   - Right-click in the editor and select "Share Commit Diff to LinkedIn" from the context menu

After triggering either command, the extension will:

1. Analyze your latest commit
2. Generate an appropriate message for the selected platform
3. Open your default browser with a pre-filled post ready for you to review and share

Note: Make sure you're logged into your Twitter or LinkedIn account in your default browser for a seamless sharing experience.

### Settings

You can customize the extension's behavior by modifying the following in your VS Code settings:

- `commit2tweet.endpoint`: [REQUIRED] The API endpoint for the LLM (default: `http://localhost:11434/api/chat`)
- `commit2tweet.apiKey`: API key to use for authentication (default: `null`)
- `commit2tweet.model`: [REQUIRED] The model to use for generating the tweet (default: `llama3`)

To access these settings, go to File > Preferences > Settings and search for "commit2tweet".

## Known Issues

Currently, there are no known issues with this extension.
