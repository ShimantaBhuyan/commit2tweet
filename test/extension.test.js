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

  test("Should register command", () => {
    const context = { subscriptions: [] };
    extension.activate(context);
    assert.strictEqual(context.subscriptions.length, 1);
    assert(mockVscode.commands.registerCommand.calledOnce);
    assert(
      mockVscode.commands.registerCommand.calledWith(
        "commit2tweet.tweetCommitDiff"
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
    const command = mockVscode.commands.registerCommand.args[0][1];

    await command();

    assert(mockChildProcess.exec.calledOnce);
    assert(
      mockChildProcess.exec.calledWith("git diff HEAD^ HEAD", {
        cwd: "/test/path",
      })
    );
  });

  test("Should call API endpoint and open browser", async () => {
    const fakeDiff = "test diff";
    const fakeEndpoint = "https://api.example.com/tweet";
    const fakeApiKey = "testApiKey";
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
      callback(JSON.stringify({ tweet: fakeTweet }));
    });

    fakeResponse.on.withArgs("end").callsFake((event, callback) => {
      callback();
    });

    const context = { subscriptions: [] };
    extension.activate(context);
    const command = mockVscode.commands.registerCommand.args[0][1];

    await command();

    assert(mockHttps.request.calledOnce);
    assert(mockVscode.env.openExternal.calledOnce);
    assert(
      mockVscode.window.showInformationMessage.calledWith(
        "Tweet prepared and ready to post!"
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
    const command = mockVscode.commands.registerCommand.args[0][1];

    await command();

    assert(mockHttps.request.calledOnce);
    assert(mockVscode.window.showErrorMessage.calledOnce);
    assert(
      mockVscode.window.showErrorMessage.args[0][0].includes(
        "HTTP error! status: 500"
      )
    );
  });
});
