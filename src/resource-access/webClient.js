const https = require("https");
const axios = require('axios');
const yaml = require('js-yaml');

class WebClient {
    constructor() {
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    async downloadFileToDict(url) {
        if (!url || url.indexOf("http") !== 0) {
            throw new Error("No URL provided when fetchJsonFromUrl");
        }
        const fileExt = url.split('.').pop();
        const result = await new Promise((resolve, reject) => {
            try {
                https.get(url, (res) => {
                    if (res.statusCode !== 200) {
                        return reject(`Failed to fetch data. Status code: ${res.statusCode}`);
                    }
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
        
                    res.on('end', () => {
                        try {
                            // resolve the data
                            resolve(data);
                        } catch (e) {
                            reject(new Error("Failed to parse JSON data"));
                        }
                    });
                }).on("error", (err) => {
                    // Handle network errors
                    reject(new Error("Unable to access the specified URL: " + err.message));
                });
    
            }
            catch (err) {
                reject(err);
            }
        });

        if (fileExt === "yaml" || fileExt === "yml") {
            return yaml.load(result);
        }
        else if (fileExt === "json") {
            return JSON.parse(result);
        }
        else {
            throw new Error("Unsupported file extension: " + fileExt);
        }
    }

    async invokeAPI(url, method, data) {
        return await axios({
            method: method,
            url: url,
            data: data,
            httpsAgent: this.httpsAgent
        }).then(res => {

            return response.data;
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
    }
}

module.exports = {
    WebClient
};

