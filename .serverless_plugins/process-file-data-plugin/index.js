"use strict";

class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.provider = this.serverless.getProvider("aws");
        this.region = this.serverless.service.provider.region;
        this.hooks = {
            "after:deploy:deploy": this.afterDeployResources.bind(this)
        };
    }

    afterDeployResources() {
        const FunctionName = this.serverless.service.getFunction("dataSaveVoice").name;
        const Payload = JSON.stringify(this.serverless.service.custom.filesToUpload);

        return this.provider.request("Lambda", "invoke", {
            FunctionName,
            Payload
        });
    }
}

module.exports = ServerlessPlugin;
