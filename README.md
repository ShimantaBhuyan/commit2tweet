# commit2tweet

This extension allows you to tweet your latest Git commit diffs with just one click. It uses LLMs to generate a tweet summarizing the changes in your commit.

Run locally with Ollama!

## Get it in the VSCode Extension Marketplace

Search for "Commit2Tweet" in the VSCode Extension Marketplace

Or go here: https://marketplace.visualstudio.com/items?itemName=ShimantaKrishnaBhuyan.commit2tweet

## Features

- Tweet your latest Git commit diff with a single click
- Summarizes the commit diff using AI
- Automatically opens the tweet in your default web browser
- Local LLMs with Ollama, and OpenAI api compatible

## Requirements

- Git installed and configured on your local machine
- (OPTIONAL) An API key for the LLM service (OpenAI compatible api)
- Visual Studio Code extension API version 1.63.0 or higher

## Extension Settings

This extension has the following settings:

- `commit2tweet.endpoint`: The API endpoint for the LLM (default: `http://localhost:11434/api/chat`)
- `commit2tweet.apiKey`: API key to use for authentication (default: `null`)
- `commit2tweet.model`: The model to use for generating the tweet (default: `llama3`)

## Known Issues

Currently, there are no known issues with this extension.

## Release Notes

### 1.0.0

Initial release of commit2tweet.

---
