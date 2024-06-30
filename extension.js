const vscode = require("vscode");
const cp = require("child_process");
const http = require("http");
const https = require("https");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "commit2tweet" is now active!');

  let twitterShareDisposable = vscode.commands.registerCommand(
    "commit2tweet.tweetCommitDiff",
    async function () {
      vscode.window.showInformationMessage(
        "Analysing your commit and preparing the tweet..."
      );
      try {
        // Send diff to the configured endpoint
        const shareText = await shareToTwitter();

        // Encode the tweet text for URL
        const encodedTweetURL = encodeURI(
          `http://twitter.com/share?text=${shareText}`
        );

        // Open Twitter with the pre-filled tweet
        vscode.env.openExternal(vscode.Uri.parse(encodedTweetURL));

        vscode.window.showInformationMessage(
          "Tweet prepared and ready to post!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
  );

  let linkedinShareDisposable = vscode.commands.registerCommand(
    "commit2tweet.linkedinCommitDiff",
    async function () {
      vscode.window.showInformationMessage(
        "Analysing your commit and preparing the linkedin post..."
      );
      try {
        // Send diff to the configured endpoint
        const shareText = await shareToLinkedin();

        // Encode the linkedin post for URL
        const encodedLinkedinURL = encodeURI(
          `https://www.linkedin.com/feed/?shareActive=true&text=${shareText}`
        );

        // Open LinkedIn with the pre-filled post
        vscode.env.openExternal(vscode.Uri.parse(encodedLinkedinURL));

        vscode.window.showInformationMessage(
          "LinkedIn post prepared and ready to post!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(twitterShareDisposable);
  context.subscriptions.push(linkedinShareDisposable);
}

async function shareToTwitter() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  let gitPath = null;

  if (Array.isArray(workspaceFolders) && workspaceFolders.length > 0) {
    gitPath = workspaceFolders[0].uri.fsPath;
  } else {
    throw new Error("No workspace folder found");
  }

  // Get the diff of the last commit
  const diff = await getLastCommitDiff(gitPath);

  // Get the configured endpoint and API key
  const config = vscode.workspace.getConfiguration("commit2tweet");
  const endpoint = config.get("endpoint");
  const apiKey = config.get("apiKey");
  const model = config.get("model");

  if (!endpoint) {
    throw new Error("Endpoint not configured");
  }

  // Send diff to the configured endpoint
  const shareText = await getShareText(diff, endpoint, apiKey, model);

  return shareText;
}

async function shareToLinkedin() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  let gitPath = null;

  if (Array.isArray(workspaceFolders) && workspaceFolders.length > 0) {
    gitPath = workspaceFolders[0].uri.fsPath;
  } else {
    throw new Error("No workspace folder found");
  }

  // Get the diff of the last commit
  const diff = await getLastCommitDiff(gitPath);

  // Get the configured endpoint and API key
  const config = vscode.workspace.getConfiguration("commit2tweet");
  const endpoint = config.get("endpoint");
  const apiKey = config.get("apiKey");
  const model = config.get("model");

  if (!endpoint) {
    throw new Error("Endpoint not configured");
  }

  // Send diff to the configured endpoint
  const shareText = await getShareText(
    diff,
    endpoint,
    apiKey,
    model,
    "linkedin"
  );

  return shareText;
}

function getLastCommitDiff(gitPath) {
  return new Promise((resolve, reject) => {
    cp.exec(
      "git diff HEAD^ HEAD",
      { cwd: gitPath },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to get git diff: ${stderr}`));
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

function getTweetPrompt(diff) {
  return `You are a senior developer building side projects. 
  For showcasing your side projects to the world, you have decided to tweet what you are building every time you commit and push your code. 
  Summarise the following git diff and generate a banger tweet about it:\n\n${diff}. 
  RESPOND WITH THE TEXT FOR THE TWEET ONLY AND DO NOT USE ANY HASHTAGS.`;
}

function getLinkedinPrompt(diff) {
  return `You are a senior developer building side projects. 
  For showcasing your side projects to the world, you have decided to share to LinkedIn what you are building every time you commit and push your code. 
  Summarise the following git diff and generate a banger LinkedIn post about it:\n\n${diff}. 
  RESPOND WITH THE TEXT FOR THE LINKEDIN POST ONLY AND DO NOT USE ANY HASHTAGS.`;
}

function getShareText(diff, endpoint, apiKey, model, shareTo = "twitter") {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || null,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (apiKey) {
      options.headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const protocol = url.protocol === "https:" ? https : http;

    const req = protocol.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const _data = data.data != null ? data.data : data;
            const jsonResponse = JSON.parse(_data);
            let content = "";

            if (jsonResponse.choices && jsonResponse.choices[0]) {
              if (
                jsonResponse.choices[0].message &&
                jsonResponse.choices[0].message.content
              ) {
                content = jsonResponse.choices[0].message.content;
              } else if (jsonResponse.choices[0].text) {
                content = jsonResponse.choices[0].text;
              }
            } else if (jsonResponse.message && jsonResponse.message.content) {
              content = jsonResponse.message.content;
            }

            resolve(content.trim());
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("error", (error) => {
      reject(new Error(`Failed to get tweet text: ${error.message}`));
    });

    const promptText =
      shareTo == "twitter" ? getTweetPrompt(diff) : getLinkedinPrompt(diff);

    const requestBody = JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
      stream: false,
      stop: null,
    });

    req.write(requestBody);
    req.end();
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
