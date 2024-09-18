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
        const property = this.termStore.get_term_by_property_name(source, version, property_name);
        if (!property) {
            throw new Error(`Property ${property_name} not found in ${source} version ${version}`);
        }
        let permissive_values = property[ALLOWED_VALUES];
        const {
            Code, 
            Version
        } = property[CDE_TERM]
        if (Code && Version) {
            const cdeData = await this.mongoDAO.getCDEPermissibleValues(Code, Version);
            if (cdeData) {
                permissive_values = cdeData[CDE_PERMISSIVE_VALUES];
            }
        }
        const match = permissive_values.find(value => value.toLowerCase() === input_value.toLowerCase());
        if (match) {
            return {status: "passed", input_value: input_value, suggestion_type: "NCIt", permissive_value: [{"value": match, "score": 1.00}]};
        }

        // step 2 check synonym

        // step 3 check AI, semantic similarity
        const similarWords = await searchFromPermissiveValues(this.awsClient, input_value, permissive_values);
        if (similarWords.length > 0) {
            const similarWordArray  = Object.entries(similarWords).map(item => {
                // Get the value of the object
                return { value: item[1][0], score: item[1][1] }; 
                 });   
            return {status: "passed", input_value: input_value, suggestion_type: "NCIt", permissive_value: similarWordArray};
        }

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