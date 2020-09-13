const FS = require('fs');
let Models = false;
module.exports = {
    sleep : (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    log : (str) => {
        console.log(new Date().toLocaleString() + ': ' + str);
    },
    getModels : (reload = false) => {
        if ( Models && !reload ) { return Models; }
        Models = {};
        let modelDirectory = './models/';
        let modelFileNames = FS.readdirSync(modelDirectory).filter(filename => filename.substr(-3) == '.js');
        modelFileNames.forEach(modelFilename => {
            let modelName = modelFilename[0].toUpperCase() + modelFilename.slice(1, -3);
            Models[modelName] = require('.' + modelDirectory + modelFilename);
        });
        return Models;
    },
    toSafeName : (name) => {
        return name ? name.toLowerCase().replace(/ /g, '') : name;
    }
};