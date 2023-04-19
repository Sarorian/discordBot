const mongoose = require('mongoose');

const playerData = {
    firstBloods: Number,
    firstDeaths: Number,
    agent: String,
    rank: String,
    kills: Number,
    deaths: Number,
    assists: Number,
    ACS: Number,
    ADR: Number
};

let teamDataSchema = mongoose.Schema({
        matchid: String,
        win: Boolean,
        attack: { wins: Number, losses: Number },
        defence: { wins: Number, losses: Number },
        plantedAt: { a: Number, b:Number, c: Number },
        winType: { bombDetonated: Number, bombDefused: Number, time: Number, kills: Number },
        startingSide: String,
        roundsWon: Number,
        roundsLost: Number,
        totalRounds: Number,
        map: String,
        comp: {
          InspiringPotato: String,
          Milkdrake: String,
          DrSanic: String,
          birdboys: String,
          Yahu: String
        }
});

let DrSanicSchema = mongoose.Schema(playerData);
let InspiringPotatoSchema = mongoose.Schema(playerData);
let YahuSchema = mongoose.Schema(playerData);
let MilkdrakeSchema = mongoose.Schema(playerData);
let birdboysSchema = mongoose.Schema(playerData);

let teamData = mongoose.model('teamData', teamDataSchema, 'teamData');
let DrSanicData = mongoose.model('DrSanic', DrSanicSchema, 'DrSanic');
let InspiringPotatoData = mongoose.model('InspiringPotato', InspiringPotatoSchema, 'InspiringPotato');
let MilkdrakeData = mongoose.model('Milkdrake', MilkdrakeSchema, 'Milkdrake');
let YahuData = mongoose.model('Yahu', YahuSchema, 'Yahu');
let birdboysData = mongoose.model('birdboys', birdboysSchema, 'birdboys');


module.exports.DrSanicData = DrSanicData;
module.exports.InspiringPotatoData = InspiringPotatoData;
module.exports.MilkdrakeData = MilkdrakeData;
module.exports.YahuData = YahuData;
module.exports.birdboysData = birdboysData;
module.exports.teamData = teamData;
