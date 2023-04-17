require('dotenv').config();

const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const test = require('./test.js');
const valo = require('./valoCode/valo.js');

client.on('ready', () => {
    console.log('bot is ready');
})

client.on('messageCreate', async (message) => {
    if (message.content === 'ping') {
        message.reply({
            content: 'pong',
        })
    } else if (message.content === 'quote') {
        message.reply({
            content: await test.apiTest(),
        })
    } else if (message.content.startsWith('!kills')) {
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
            content: `Kills for ${username} in their most recent game: ${await valo.getKills(username, tag)}`
        });
    }
})

client.login(process.env.DISCORD_BOT_ID);
