require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const test = require('./test.js');
const valo = require('./valo.js');
const mongoose = require('mongoose');
const Models = require('./models.js');
const teamData = Models.teamData;
const DrSanicData = Models.DrSanicData;
const InspiringPotatoData = Models.InspiringPotatoData;
const YahuData = Models.YahuData;
const MilkdrakeData = Models.MilkdrakeData;
const birdboysData = Models.birdboysData;


client.on('ready', () => {
    console.log('bot is ready');
})

client.on('messageCreate', async (message) => {
    if (message.content === '!test') {
        message.reply({
            content: 'THIS SHITS ON YO',
        })
    } else if (message.content === 'quote') {
        message.reply({
            content: await test.apiTest(),
        })
    } else if (message.content.startsWith('!balance')) {
        const args = message.content.split(' ');
        if (args.length < 11) {
            message.reply({
                content: 'Please provide 10 player usernames and tags.'
            });
            return;
        }
        const players = [];
        for (let i = 1; i <= 10; i++) {
            const username = args[i].split('#')[0];
            const tag = args[i].split('#')[1];
            players.push({name: username, tag: tag});
        }
        const balancedTeams = await valo.balanceTeams(players);
        const team1Message = `Team 1: ${balancedTeams[0].map(player => `${player.name}#${player.tag}`).join(', ')}`;
        const team2Message = `Team 2: ${balancedTeams[1].map(player => `${player.name}#${player.tag}`).join(', ')}`;
        message.reply({
            content: `${team1Message}\n${team2Message}`,
        });
    } else if (message.content.startsWith('!matchID')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.reply({
                content: 'Please provide a username and tag.'
            });
            return;
        }
        const username = args[1].split('#')[0];
        const tag = args[1].split('#')[1];
        message.reply({
            content: `Match ID for ${username}'s most recent game: ${await valo.getMatchID(username, tag)}`
        });
    } else if (message.content.startsWith('!update')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.reply({
                content: 'Please provide a username and tag.'
            });
            return;
        }
        const username = args[1].split('#')[0];
        const tag = args[1].split('#')[1];
        try {
            mongoose.connect(`mongodb+srv://shamowen5:${process.env.ATLAS_PASS}@sarorian.wh5lzfz.mongodb.net/BYDO`, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("Connected to database successfully");

            const match = await valo.getMatchID(username, tag);
            const data = await valo.getTeamData(match);
            const playerData = await valo.getPlayerData(match);
            const DrSanicStats = playerData.DrSanic;
            const YahuStats = playerData.Yahu;
            const birdboysStats = playerData.birdboys;
            const InspiringPotatoStats = playerData.InspiringPotato;
            const MilkdrakeStats = playerData.Milkdrake;

            const matchnumber = data.matchid
            const existingData = await teamData.findOne({ matchid: matchnumber})
            if (existingData) {
                console.log("Data already exists for this match")
                message.reply({
                    content: `This match has already been uploaded`
                });
            } else {
                await teamData.create(data);
                await DrSanicData.create(DrSanicStats);
                await YahuData.create(YahuStats);
                await birdboysData.create(birdboysStats);
                await InspiringPotatoData.create(InspiringPotatoStats);
                await MilkdrakeData.create(MilkdrakeStats);
                console.log("Data Sucesfully Uploaded");
                message.reply({
                    content: `Data uploaded for your match on ${data.map}`
                });
            }
           
            
        } catch (e) {
            console.log(e);
        }
    }

})

client.login(process.env.DISCORD_BOT_ID);
