const fs = require('fs');

function cleanString(s) {
    var output = new String();
    output = s;
    output = output.replace(/[!@#$%^*,.?"~:;{}|<>\/]/g, '');
    return output;
}
module.exports = { cleanString }
