const axios = require('axios');

function add(num1, num2){
    let x = num1 + num2;
    return x
};

function returnTest() {
    return "Test";
}

async function apiTest(){
    let resp = await axios.get(`https://api.quotable.io/random`);
    const quote = resp.data.content;
    return quote;
}

module.exports = {
    add: add,
    returnTest: returnTest,
    apiTest: apiTest
};