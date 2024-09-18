const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment');

/**
 * clean_up_key_value
 * Removes leading and trailing spaces from keys and values in a dictionary
 * @param {object} obj 
 * @returns {object} cleaned obj
 */
function cleanUpKeyValue(obj) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [
        typeof key === 'string' ? key.trim() : key,
        typeof value === 'string' ? value.trim() : value
    ]));
}

/**
 * Removes leading and trailing spaces from header names
 * @param {Array<string>} strArr
 * @returns {Array<string>} cleaned str array
 */
function cleanUpStrs(strArr) {
    return strArr.map(item => item.trim());
}

/**
 * Extract exception type name and message
 * @returns {string}
 */
function getExceptionMsg(err) {
    return `${err.name}: ${err.message}`;
}

/**
 * Dump list of dictionary to TSV file
 * @param {Array<object>} dictList 
 * @param {string} filePath 
 * @returns {boolean}
 */
// function dumpDictToTsv(dictList, filePath) {
//     if (!dictList || dictList.length === 0) return false;

//     const keys = Object.keys(dictList[0]);
//     const csvWriter = csv.stringify({ header: true, delimiter: '\t' });
    
//     fs.writeFileSync(filePath, csvWriter.write(dictList));
//     return true;
// }

/**
 * Dump list of dictionary to JSON file
 * @param {object} dict 
 * @param {string} filePath 
 * @returns {boolean}
 */
function dumpDictToJson(dict, filePath) {
    if (!dict || Object.keys(dict).length === 0) return false;

    Object.entries(dict).forEach(([k, v]) => {
        const path = filePath.replace("data", `${k}`);
        fs.writeFileSync(path, JSON.stringify(v, setDefault));
    });
    return true;
}

/**
 * Set default for JSON stringify
 * @param {*} obj 
 * @returns {*}
 */
function setDefault(obj) {
    if (obj instanceof Set) return [...obj];
    throw new TypeError('Unsupported type');
}

/**
 * Clean up the S3 download directory
 * @param {string} dir 
 */
function cleanupS3DownloadDir(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((filename) => {
            const filePath = path.join(dir, filename);
            if (fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                fs.rmdirSync(filePath, { recursive: true });
            }
        });
    } else {
        fs.mkdirSync(dir);
    }
}

/**
 * Case insensitive dictionary key lookup
 * @param {object} obj 
 * @param {string} k 
 * @param {*} defaultValue 
 * @returns {*} value
 */
function caseInsensitiveGet(obj, k, defaultValue) {
    const key = Object.keys(obj).find(key => key.toLowerCase() === k.toLowerCase());
    return key ? obj[key] : defaultValue;
}

/**
 * Download file from URL and load into dict
 * @param {string} url 
 * @returns {Promise<object>}
 */

/**
 * Get current date time string in ISO format
 * @returns {string}
 */
function currentDateTimeStr() {
    return new Date().toISOString();
}

/**
 * Get current time in specific format
 * @param {string} format 
 * @returns {string}
 */
function getDateTime(format = 'YYYY-MM-DDTHH:mm:ss') {
    return moment().format(format);
}

/**
 * Get current date time
 * @returns {Date}
 */
function currentDateTime() {
    return new Date();
}

/**
 * Get UUID v4 string
 * @returns {string}
 */
function getUuidStr() {
    return uuidv4();
}

/**
 * Get S3 file info
 * @param {string} bucketName 
 * @param {string} key 
 * @returns {Promise<object>}
 */
async function getS3FileInfo(bucketName, key) {
    const s3 = new AWS.S3();
    
    try {
        const res = await s3.headObject({ Bucket: bucketName, Key: key }).promise();
        return { size: res.ContentLength, lastModified: res.LastModified };
    } catch (err) {
        throw err;
    }
}

/**
 * Get S3 file MD5 and object size by object stream
 * @param {string} bucketName 
 * @param {string} key 
 * @returns {Promise<string>}
 */
async function getS3FileMd5(bucketName, key) {
    const s3 = new AWS.S3();

    try {
        const res = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
        return crypto.createHash('md5').update(res.Body).digest('hex');
    } catch (err) {
        throw err;
    }
}

/**
 * Create error object
 * @param {string} title 
 * @param {string} msg 
 * @returns {object}
 */
function createError(title, msg) {
    return { title, description: msg };
}

/**
 * DataFrame utility to remove trailing empty rows and columns
 * @param {Array<Array>} df 
 * @returns {Array<Array>}
 */
function removeTrailingEmptyColumnsAndRows(df) {
    // Remove empty columns
    let lastColIndex = df[0].length - 1;
    while (df.every(row => row[lastColIndex] === null || row[lastColIndex] === '')) {
        df = df.map(row => row.slice(0, -1));
        lastColIndex--;
    }

    // Remove trailing empty rows
    while (df[df.length - 1].every(val => val === null || val === '')) {
        df.pop();
    }

    return df;
}

module.exports = {
    cleanUpKeyValue,
    cleanUpStrs,
    getExceptionMsg,
    // dumpDictToTsv,
    dumpDictToJson,
    setDefault,
    cleanupS3DownloadDir,
    caseInsensitiveGet,
    downloadFileToDict,
    currentDateTimeStr,
    getDateTime,
    currentDateTime,
    getUuidStr,
    getS3FileInfo,
    getS3FileMd5,
    createError,
    removeTrailingEmptyColumnsAndRows
};
