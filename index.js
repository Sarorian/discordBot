require('dotenv').config();

const axios = require('axios');
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
    } else if (message.content.startsWith('!balance')) {
        const args = message.content.split(' ');
        if (args.length < 11) {
          message.reply({
            content: 'Please provide 10 player usernames and tags.'
          });
          return;
        }
        const [_, ...userTags] = args;
        const players = Array.from({ length: 10 }, (_, i) => {
          const [name, tag] = userTags[i].split('#');
          return { name, tag };
        });
      
        const sentMessage = await message.channel.send('Computing balanced teams... :nerd:');
      
        try {
          const balancedTeams = await valo.balanceTeams(players);
          const team1Message = `${balancedTeams[0].map(player => `${player.name}`).join(', ')}`;
          const team2Message = `${balancedTeams[1].map(player => `${player.name}`).join(', ')}`;
      
          message.reply({
            embeds: [{
              color: 0x008080,
              title: 'Balanced Teams',
              fields: [
                {
                  name: 'Team 1',
                  value: team1Message,
                },
                {
                  name: 'Team 2',
                  value: team2Message,
                },
              ],
            }],
          });
      
        } catch (error) {
          console.error(error);
          message.reply({
            content: 'An error occurred while computing balanced teams. Please make sure all player names and tags are correct'
          });
        } finally {
          sentMessage.delete();
        }
      }
       else if (message.content.startsWith('!update')) {
        const playerIds = valo.playersList.map(player => player.id);
        try {
            const gamesArray = await Promise.all(playerIds.map(id => valo.getMatchID(id)));
            const sameGame = gamesArray.every(game => game === gamesArray[0]);
            if (!sameGame) {
                message.reply({
                    content: "Your most recent games are different, please use this command after you play a game with all 5 team members"
                });
                return;
            }
            await mongoose.connect(`mongodb+srv://shamowen5:${process.env.ATLAS_PASS}@sarorian.wh5lzfz.mongodb.net/BYDO`,
                { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("Connected to database successfully");
            const [data, playerData] = await Promise.all([
                valo.getTeamData(gamesArray[0]),
                valo.getPlayerData(gamesArray[0])
            ]);
            const { matchid, map } = data;
            const existingData = await teamData.findOne({ matchid });
            if (existingData) {
                console.log("Data already exists for this match");
                message.reply({
                    content: `This match has already been uploaded`
                });
            } else {
                const { DrSanic, Yahu, birdboys, InspiringPotato, Milkdrake } = playerData;
                await Promise.all([
                    teamData.create(data),
                    DrSanicData.create(DrSanic),
                    YahuData.create(Yahu),
                    birdboysData.create(birdboys),
                    InspiringPotatoData.create(InspiringPotato),
                    MilkdrakeData.create(Milkdrake)
                ]);
                console.log("Data Sucesfully Uploaded");
                message.reply({
                    content: `Data uploaded for your match on ${map}`
                });
            }
        } catch (e) {
            console.log(e);
        }
    } else if (message.content.startsWith('!kda')) {
        try {
            const args = message.content.split(' ');
            if (args.length === 1) {
                message.reply({
                    content: `!kda {player} (agent). If no agent is given the overall KDA will be returned. Case sensitive`
                });
                return;
            } else {
                const player = args[1];
                const agent = args[2] ? ` on ${args[2]}` : '';
                const agentEncoded = encodeURIComponent(args[2] || '');
                const { data } = await axios.get(`https://bydo.herokuapp.com/players/${player}/${agentEncoded}`);
                const { length, kills, deaths, assists } = data.reduce((acc, game) => ({
                    length: acc.length + 1,
                    kills: acc.kills + game.kills,
                    deaths: acc.deaths + game.deaths,
                    assists: acc.assists + game.assists,
                }), { length: 0, kills: 0, deaths: 0, assists: 0 });
                const kda = ((kills + assists) / deaths).toFixed(2);
                message.reply({
                    embeds: [{
                        color: 0xff0000,
                        title: 'KDA Stats',
                        description: `Overall KDA for **${player}**${agent} over ${length} games: ${kda}`,
                    }]
                });
            }
        } catch(e) {
            console.log(e);
            return;
        }
    } else if (message.content.startsWith('!winrate')) {
        try {
            const { data } = await axios.get('https://bydo.herokuapp.com/teamdata');
            const winrate = ((data.reduce((acc, game) => acc + game.win, 0) / data.length) * 100).toFixed(2);
            message.reply({
                embeds: [{
                    color: 0x0099ff,
                    title: `Winrate over ${data.length} games`,
                    description: `${winrate}%`,
                }]
            });
        } catch(e) {
            console.log(e);
            return;
        }
    } else if (message.content.startsWith('!map')) {
        const [, map] = message.content.split(' ');
        if (!map) {
            message.reply({
                content: `Please provide a map`
            })
            return;
        }
        try {
            const { data } = await axios.get(`https://bydo.herokuapp.com/teamdata/${map}`);
            if (data.status === 404) {
                message.reply({
                    content: `Please provide a valid map`
                })
                return;
            }
            const percentageFormatter = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });
            const { wins, attackWins, attackLosses, defenceWins, defenceLosses, length } = data.reduce((acc, game) => ({
                wins: acc.wins + game.win,
                attackWins: acc.attackWins + game.attack.wins,
                attackLosses: acc.attackLosses + game.attack.losses,
                defenceWins: acc.defenceWins + game.defence.wins,
                defenceLosses: acc.defenceLosses + game.defence.losses,
                length: acc.length + 1
            }), { wins: 0, attackWins: 0, attackLosses: 0, defenceWins: 0, defenceLosses: 0, length: 0 });
            const attackWinrate = percentageFormatter.format(attackWins / (attackWins + attackLosses));
            const defenceWinrate = percentageFormatter.format(defenceWins / (defenceWins + defenceLosses));
            message.reply({
                embeds: [{
                    title: `${map} Stats`,
                    color: 0x00ff00,
                    fields: [
                        {
                            name: "Attack winrate",
                            value: attackWinrate,
                            inline: true
                        },
                        {
                            name: "Defence winrate",
                            value: defenceWinrate,
                            inline: true
                        },
                        {
                            name: "Overall winrate",
                            value: percentageFormatter.format(wins/length),
                            inline: true
                        },
                        {
                            name: "Games played",
                            value: length,
                            inline: true
                        }
                    ]
                }]
            });
            return;
        } catch (e){
            console.log(e);
            return;
        }
    }
})

client.login(process.env.DISCORD_BOT_ID);
