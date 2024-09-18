// const { cosineSimilarity } = require('ml-distance'); 
const cosineSimilarity = require('compute-cosine-similarity');
const { ALLOWED_VALUES, CDE_TERM, CDE_PERMISSIVE_VALUES} = require("../common/constants");

class PermissiveValueSvc {
    constructor(termStore, mongoDAO, awsClient) {
        this.mongoDAO = mongoDAO;
        this.termStore = termStore;
        this.awsClient = awsClient;
    }

    toString() {
        return this.value;
    }

    async getPermissiveValue(param) {
        const {
            source,
            version,
            input_value,
            property_name
        } = param;
        // step 1: check if the input value existing in permissive values case-insensitively

        // step 2 check synonym

        // step 3 check AI, semantic similarity
        return {status: "failed", input_value: input_value, suggestion_type: "NCIt", permissive_value: null};
    }

}

async function searchFromPermissiveValues(awsClient, word, permissiveValues, topK = 10) {
    /*
     * Search similar words for a given word from permissive values
     */
    let response = null;
    let queryWord = preprocessText(word);
    let queryWords = [queryWord];
    let fromWords = permissiveValues.map(value => preprocessText(value));
    queryWords = [...queryWords, ...fromWords];

    let wordVec = null;
    let similarWord = [];

    try {
        // Invoke the endpoint and wait for the response
        wordVec = await awsClient.invokeSageMakerEndpoint(queryWords);
        // Parse the response and extract word vectors
        let queryVec = wordVec[0].vector;
        let permissiveVectors = wordVec.slice(1);
        let permissiveValIndex = 0;
        let similarities = {};

        // Calculate cosine similarity for each permissive value
        for (let item of permissiveVectors) {
            let similarity = cosineSimilarity(queryVec, item.vector);
            similarities[item.word] = similarity;
            permissiveValIndex++;
        }

        // Sort words by similarity and return the top K words
        const similarWords = Object.entries(similarities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topK)
            .filter(item => item[1] > 0.5);

        return similarWords;
    } catch (error) {
        console.error(error);
    }
}

module.exports = { searchFromPermissiveValues };


const preprocessText = (text) => {
    // Convert text to lowercase
    text = text ? text.toLowerCase() : '';
    // Remove punctuation (non-word characters except spaces)
    text = text ? text.replace(/[^\w\s]/g, '') : '';
    return text;
};

module.exports = {
    PermissiveValueSvc
};