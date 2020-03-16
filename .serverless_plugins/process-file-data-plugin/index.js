"use strict";

class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.provider = this.serverless.getProvider("aws");
        this.region = this.serverless.service.provider.region;
        this.hooks = {
            "after:deploy:deploy": this.afterDeployResources.bind(this) //this.afterDeployResources
        };
    }

    afterDeployResources() {
        const FunctionName = this.serverless.service.getFunction("dataSave").name;
        const payload = this.serverless.service.custom.filesToUpload;

        return this.provider.request("Lambda", "invoke", {
            FunctionName,
            Payload: JSON.stringify(payload)
        });
    }
}

module.exports = ServerlessPlugin;
