const axios = require('axios');

async function getKills(playerName, tag) {
    try {
        const { data: { data: [game] } } = await axios(`https://api.henrikdev.xyz/valorant/v3/matches/na/${playerName}/${tag}`);
        const { players : { all_players } } = game;
        let stats;
        for (const playerIndex in all_players) {
            const player = all_players[playerIndex];
            if (player.name === playerName) {
              stats = player.stats;
            }
          }
        return stats.kills;
    } catch (e) {
        console.log(e);
    }

}

module.exports = {
    getKills: getKills
};
