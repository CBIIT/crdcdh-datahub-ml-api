const AWS = require('aws-sdk');

class AWSClient {
    constructor(userProfile = "default", sagemaker_endpoint) {
        this.sagemaker_endpoint = sagemaker_endpoint;
       // Set AWS session with a specific profile name
        this.awsConfig = new AWS.Config({
            region: 'us-east-1', // specify the region, adjust as needed
            credentials: new AWS.SharedIniFileCredentials({ profile: userProfile }) // specify the profile name
        });
        // Create a SageMaker Runtime client instance
        this.sagemaker = new AWS.SageMakerRuntime(this.awsConfig);
    }

    // Define a function to invoke the SageMaker endpoint
    async invokeSageMakerEndpoint(inputData, endpointName = this.sagemaker_endpoint ) {
        const params = {
            EndpointName: endpointName, // Name of the SageMaker endpoint
            Body: JSON.stringify({ instances: inputData }), // Input data to be passed
            ContentType: 'application/json',
            Accept: 'application/json'
        };

        try {
            // Invoke the endpoint
            const response = await this.sagemaker.invokeEndpoint(params).promise();
            // console.log('Response:', JSON.parse(response.Body));
            return JSON.parse(response.Body);
        } catch (error) {
            console.error('Error invoking SageMaker endpoint:', error);
            throw error;
        }
    }

    close() {
        this.sagemaker = null;
    }   
}

module.exports ={
    AWSClient
}