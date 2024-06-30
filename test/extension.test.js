const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

suite("Extension Test Suite", () => {
  let extension;
  let mockChildProcess;
  let mockHttps;
  let mockVscode;

  setup(() => {
    mockChildProcess = {
      exec: sinon.stub(),
    };

    mockHttps = {
      request: sinon.stub(),
    };

    mockVscode = {
      workspace: {
        workspaceFolders: [{ uri: { fsPath: "/test/path" } }],
        getConfiguration: sinon.stub().returns({
          get: sinon.stub(),
        }),
      },
      window: {
        showInformationMessage: sinon.stub(),
        showErrorMessage: sinon.stub(),
      },
      commands: {
        registerCommand: sinon.stub(),
      },
      env: {
        openExternal: sinon.stub(),
      },
      Uri: {
        parse: sinon.stub(),
      },
    };

    extension = proxyquire("../extension", {
      vscode: mockVscode,
      child_process: mockChildProcess,
      https: mockHttps,
    });
  });

  test("Extension should be present", () => {
    assert.ok(extension);
  });

  test("Should register commands", () => {
    const context = { subscriptions: [] };
    extension.activate(context);
    assert.strictEqual(context.subscriptions.length, 2);
    assert(mockVscode.commands.registerCommand.calledTwice);
    assert(
      mockVscode.commands.registerCommand.calledWith(
        "commit2tweet.tweetCommitDiff"
      )
    );
    assert(
      mockVscode.commands.registerCommand.calledWith(
        "commit2tweet.linkedinCommitDiff"
      )
    );
  });

  test("Should get last commit diff", async () => {
    const fakeDiff = "test diff";
    mockChildProcess.exec.callsFake((command, options, callback) => {
      callback(null, fakeDiff, "");
    });

    const context = { subscriptions: [] };
    extension.activate(context);
    const twitterCommand = mockVscode.commands.registerCommand.args[0][1];

    await twitterCommand();

    assert(mockChildProcess.exec.calledOnce);
    assert(
      mockChildProcess.exec.calledWith("git diff HEAD^ HEAD", {
        cwd: "/test/path",
      })
    );
  });

  test("Should call API endpoint and open browser for Twitter", async () => {
    const fakeDiff = "test diff";
    const fakeEndpoint = "https://api.example.com/tweet";
    const fakeApiKey = "testApiKey";
    const fakeModel = "gpt-3.5-turbo";
    const fakeTweet = "Generated tweet text";

    mockChildProcess.exec.callsFake((command, options, callback) => {
      callback(null, fakeDiff, "");
    });

    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("endpoint")
      .returns(fakeEndpoint);
    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("apiKey")
      .returns(fakeApiKey);
    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("model")
      .returns(fakeModel);

    const fakeRequest = {
      on: sinon.stub(),
      write: sinon.stub(),
      end: sinon.stub(),
    };

    const fakeResponse = {
      on: sinon.stub(),
      statusCode: 200,
    };

    mockHttps.request.callsFake((options, callback) => {
      callback(fakeResponse);
      return fakeRequest;
    });

    fakeResponse.on.withArgs("data").callsFake((event, callback) => {
      callback(
        JSON.stringify({ choices: [{ message: { content: fakeTweet } }] })
      );
    });

    fakeResponse.on.withArgs("end").callsFake((event, callback) => {
      callback();
    });

    const context = { subscriptions: [] };
    extension.activate(context);
    const twitterCommand = mockVscode.commands.registerCommand.args[0][1];

    await twitterCommand();

    assert(mockHttps.request.calledOnce);
    assert(mockVscode.env.openExternal.calledOnce);
    assert(
      mockVscode.window.showInformationMessage.calledWith(
        "Tweet prepared and ready to post!"
      )
    );
  });

  test("Should call API endpoint and open browser for LinkedIn", async () => {
    const fakeDiff = "test diff";
    const fakeEndpoint = "https://api.example.com/post";
    const fakeApiKey = "testApiKey";
    const fakeModel = "gpt-3.5-turbo";
    const fakePost = "Generated LinkedIn post content";

    mockChildProcess.exec.callsFake((command, options, callback) => {
      callback(null, fakeDiff, "");
    });

    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("endpoint")
      .returns(fakeEndpoint);
    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("apiKey")
      .returns(fakeApiKey);
    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("model")
      .returns(fakeModel);

    const fakeRequest = {
      on: sinon.stub(),
      write: sinon.stub(),
      end: sinon.stub(),
    };

    const fakeResponse = {
      on: sinon.stub(),
      statusCode: 200,
    };

    mockHttps.request.callsFake((options, callback) => {
      callback(fakeResponse);
      return fakeRequest;
    });

    fakeResponse.on.withArgs("data").callsFake((event, callback) => {
      callback(
        JSON.stringify({ choices: [{ message: { content: fakePost } }] })
      );
    });

    fakeResponse.on.withArgs("end").callsFake((event, callback) => {
      callback();
    });

    const context = { subscriptions: [] };
    extension.activate(context);
    const linkedinCommand = mockVscode.commands.registerCommand.args[1][1];

    await linkedinCommand();

    assert(mockHttps.request.calledOnce);
    assert(mockVscode.env.openExternal.calledOnce);
    assert(
      mockVscode.window.showInformationMessage.calledWith(
        "LinkedIn post prepared and ready to post!"
      )
    );
  });

  test("Should show error message on API failure", async () => {
    const fakeDiff = "test diff";
    const fakeEndpoint = "https://api.example.com/tweet";

    mockChildProcess.exec.callsFake((command, options, callback) => {
      callback(null, fakeDiff, "");
    });

    mockVscode.workspace
      .getConfiguration()
      .get.withArgs("endpoint")
      .returns(fakeEndpoint);

    const fakeRequest = {
      on: sinon.stub(),
      write: sinon.stub(),
      end: sinon.stub(),
    };

    const fakeResponse = {
      on: sinon.stub(),
      statusCode: 500,
    };

    mockHttps.request.callsFake((options, callback) => {
      callback(fakeResponse);
      return fakeRequest;
    });

    fakeResponse.on.withArgs("end").callsFake((event, callback) => {
      callback();
    });

    const context = { subscriptions: [] };
    extension.activate(context);
    const twitterCommand = mockVscode.commands.registerCommand.args[0][1];

    await twitterCommand();

    assert(mockHttps.request.calledOnce);
    assert(mockVscode.window.showErrorMessage.calledOnce);
    assert(
      mockVscode.window.showErrorMessage.args[0][0].includes(
        "HTTP error! status: 500"
      )
    );
  });
});
