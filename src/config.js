require('dotenv').config();

let config = {
    //info variables
    version: process.env.VERSION || 'Version not set',
    date: process.env.DATE || new Date(),
    //Mongo DB
    mongo_db_user: process.env.MONGO_DB_USER,
    mongo_db_password: process.env.MONGO_DB_PASSWORD,
    mongo_db_host: process.env.MONGO_DB_HOST,
    mongo_db_port: process.env.MONGO_DB_PORT,

    //session
    session_secret: process.env.SESSION_SECRET,
    session_timeout: parseInt(process.env.SESSION_TIMEOUT_SECONDS) * 1000 || 30 * 60 * 1000,
    token_secret: process.env.SESSION_SECRET,
    token_timeout: parseInt(process.env.TOKEN_TIMEOUT) * 1000 || 30 * 24 * 60 * 60 * 1000,
    // Scheduled cronjob once a day (1am) eastern time at default
    schedule_job: process.env.SCHEDULE_JOB || "1 0 1 * * *",
    model_url: getModelUrl(),
    tier: getTier(),
    aws_profile: process.env.AWS_PROFILE || "default",
    sagemaker_endpoint: process.env.SAGEMAKER_ENDPOINT || "crdcdh-ml-dev-endpoint"
};
config.mongo_db_connection_string = `mongodb://${config.mongo_db_user}:${config.mongo_db_password}@${config.mongo_db_host}:${process.env.MONGO_DB_PORT}`;
function getModelUrl() {
    // if MODEL_URL exists, it overrides
    if (process.env.MODEL_URL) {
        return process.env.MODEL_URL;
    }
    const tier = extractTierName();
    // By default url
    const modelUrl = ['https://raw.githubusercontent.com/CBIIT/crdc-datahub-models/', tier || 'master', '/cache/content.json']
    if (tier?.length > 0) {
        modelUrl[1] = tier.toLowerCase();
    }
    return modelUrl.join("");
}

function extractTierName() {
    return process.env.TIER?.replace(/[^a-zA-Z\d]/g, '').trim();
}

function getTier() {
    const tier = extractTierName();
    return tier?.length > 0 ? `[${tier.toUpperCase()}]` : '';
}

module.exports = config;
