const {buildSchema} = require('graphql');
const {createHandler} = require("graphql-http/lib/use/express");
const {DATABASE_NAME} = require("../common/constants");
const config = require('../config');
const {TermReader} = require("../common/term-store");
const {MongoDAO} = require("../resource-access/mongoDAO");
const {AWSClient} = require("../resource-access/awsClient");
const {PermissiveValueSvc} = require("../services/permissive-val-svc");
const {apiAuthorization, extractAPINames, PUBLIC} = require("./api-authorization");
const { WebClient} = require('../resource-access/webClient');
const schema = buildSchema(require("fs").readFileSync("src/graphql/ml-api.graphql", "utf8"));
const public_api_list = extractAPINames(schema, PUBLIC)
const mongoDAO = new MongoDAO(config.mongo_db_connection_string, DATABASE_NAME);


let root;

mongoDAO.connect().then(async () => {
    const termStore = new TermReader(new WebClient());
    await termStore.init();
    const awsClient = new AWSClient(config.aws_profile, config.sagemaker_endpoint);
    const permissiveValueSvc = new PermissiveValueSvc(termStore, mongoDAO, awsClient);
    root = {
        version: () => {return config.version},
        getPermissiveValue: permissiveValueSvc.getPermissiveValue.bind(permissiveValueSvc),
    }
});

module.exports = (req, res, next) => {
    apiAuthorization(req, null, null, public_api_list).then((authorized) => {
        createHandler({
            schema: schema,
            rootValue: root,
            context: req.session
        })(req,res);
    })
    .catch((error) => {
        next(error);
    })
};
