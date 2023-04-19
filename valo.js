const axios = require('axios');

const playersList = [
  {id: "a200cf03-30ec-5f98-9ee6-7941778ee290", name: "InspiringPotato"},
  {id: "486f88f1-22d1-52a9-9f1e-11896635a629", name: "Milkdrake"},
  {id: "71f15507-7683-5cf9-bd57-3afccd19beb7", name: "Yahu"},
  {id: "f88a0f4a-64ad-564f-829d-6ba192724557", name: "DrSanic"},
  {id: "85ecd4f1-d09b-5b86-b295-17f9874082d2", name: "birdboys"},
];

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

async function getTeam(url){
  try{
    const playerIds = playersList.map(i => i.id);
    const { data: { data : { players } }} = await axios(url)
    const team = players.all_players.filter(i => playerIds.includes(i.puuid))[0].team.toLowerCase();
    return team;
  } catch (e) {
    console.log(e);
  }
}

async function getMatchID(playerName, tag) {
  try {
      const { data: { data: [game] } } = await axios(`https://api.henrikdev.xyz/valorant/v3/matches/na/${playerName}/${tag}`);
      const { metadata } = game;
      return metadata.matchid; 
  } catch (e) {
      console.log(e);
  }

}

async function getMmr(playerName, tag) {
    const {data: {data: {elo}}} = await axios(`https://api.henrikdev.xyz/valorant/v1/mmr/na/${playerName}/${tag}`);
    return elo
}

async function balanceTeams(players) {
    const maxMmrDiff = 300;
    
    // Add MMR to each player
    for (const player of players) {
      const mmr = await getMmr(player.name, player.tag);
      player.mmr = mmr;
    }
  
    // Sort players by MMR
    const sortedPlayers = players.sort((a, b) => b.mmr - a.mmr);
  
    // Divide players into teams
    let team1 = [];
    let team2 = [];
    let totalMmrTeam1 = 0;
    let totalMmrTeam2 = 0;
    for (const player of sortedPlayers) {
      const shouldAddToTeam1 = Math.random() >= 0.5 && team1.length < 5;
      if (shouldAddToTeam1) {
        if (totalMmrTeam1 + player.mmr - totalMmrTeam2 <= maxMmrDiff) {
          team1.push(player);
          totalMmrTeam1 += player.mmr;
        } else {
          team2.push(player);
          totalMmrTeam2 += player.mmr;
        }
      } else {
        if (totalMmrTeam2 + player.mmr - totalMmrTeam1 <= maxMmrDiff) {
          team2.push(player);
          totalMmrTeam2 += player.mmr;
        } else {
          team1.push(player);
          totalMmrTeam1 += player.mmr;
        }
      }
    }
  
    // If the teams don't have exactly 5 players each, redistribute the players
    if (team1.length !== 5 || team2.length !== 5) {
      const playersToRedistribute = team1.concat(team2);
      team1 = [];
      team2 = [];
      totalMmrTeam1 = 0;
      totalMmrTeam2 = 0;
      for (const player of playersToRedistribute) {
        const shouldAddToTeam1 = Math.random() >= 0.5 && team1.length < 5;
        if (shouldAddToTeam1) {
          if (totalMmrTeam1 + player.mmr - totalMmrTeam2 <= maxMmrDiff) {
            team1.push(player);
            totalMmrTeam1 += player.mmr;
          } else {
            team2.push(player);
            totalMmrTeam2 += player.mmr;
          }
        } else {
          if (totalMmrTeam2 + player.mmr - totalMmrTeam1 <= maxMmrDiff) {
            team2.push(player);
            totalMmrTeam2 += player.mmr;
          } else {
            team1.push(player);
            totalMmrTeam1 += player.mmr;
          }
        }
      }
    }
  
    return [team1, team2];
  }

  async function getTeamData(match){
    try {
      //Constructing the returned array
      let teamData = 
        {matchid: "",
          win: false,
        attack: {
          wins: 0,
          losses: 0
        },
        defence: {
          wins: 0,
          losses: 0
        },
        plantedAt: {
          a: 0,
          b: 0,
          c: 0
        },
        winType: {
          bombDetonated: 0,
          bombDefused: 0,
          time: 0,
          kills: 0,
        },
        startingSide: "",
        roundsWon: 0,
        roundsLost: 0,
        totalRounds: 0,
        map: "",
        comp: {
          InspiringPotato: "",
          Milkdrake: "",
          Yahu: "",
          DrSanic: "",
          birdboys: ""
        }
        }
      const team = await getTeam(`https://api.henrikdev.xyz/valorant/v2/match/${match}`);
      const { data: { data : { metadata, teams, rounds, players  } }} = await axios(`https://api.henrikdev.xyz/valorant/v2/match/${match}`)
      teamData.matchid = metadata.matchid;
      //Getting Win Data
      teamData.win = teams[team].has_won;
      //Getting Round Data
      teamData.roundsWon = teams[team].rounds_won;
      teamData.roundsLost = teams[team].rounds_lost;
      teamData.totalRounds = metadata.rounds_played; 
      //Getting Map Data
      teamData.map = metadata.map;
      //Making function that processes round data (used later)
      function processRounds(rounds, side) {
        rounds.forEach(round => {
          const winningTeam = round.winning_team.toLowerCase();
          const winType = round.end_type;
          const plantSite = round.plant_events?.plant_site?.toLowerCase();
          const plantData = () => {
            if (plantSite !== undefined && side === "attack"){
              teamData.plantedAt[plantSite]++;
            }
          };
          const updateData = (type, side) => {
            teamData.winType[type]++;
            teamData[side].wins++;
          };
          if (side === "attack"){
            if (winningTeam === team && winType === "Bomb detonated") {
              updateData("bombDetonated", "attack");
            } else if (winningTeam === team && winType === "Eliminated") {
              updateData("kills", "attack");
            } else if (winningTeam === team && winType === "Round timer expired") {
              updateData("time", "attack");
            }
          }
          if (side === "defence"){
            if (winningTeam === team && winType === "Bomb defused") {
              updateData("bombDefused", "defence");
            } else if (winningTeam === team && winType === "Eliminated") {
              updateData("kills", "defence");
            } else if (winningTeam === team && winType === "Round timer expired") {
              updateData("time", "defence");
            }
          }
          plantData();
          teamData[side].losses = rounds.length - teamData[side].wins;
        });
      }
      //Making function to process overtime rounds (used later)
      function processOvertimeRounds(rounds, overtimeSide) {
        rounds.forEach(round => {
          const winningTeam = round.winning_team.toLowerCase(); 
          const winType = round.end_type
          const plantSite = round.plant_events?.plant_site?.toLowerCase();
          const plantData = () => {
            if (plantSite !== undefined && overtimeSide === "attack"){
              teamData.plantedAt[plantSite]++
            }
          }
          const updateData = (type, side) => {
            teamData.winType[type]++
            teamData[side].wins++
          }
          if (overtimeSide === "attack"){
            if (winningTeam === team && winType === "Bomb detonated") {
              updateData("bombDetonated", "attack");
            } else if (winningTeam === team && winType === "Eliminated") {
              updateData("kills", "attack");
            } else if (winningTeam === team &&  winType === "Round timer expired") {
              updateData("time", "attack");
            }
          }
          if (overtimeSide === "defence"){
            if (winningTeam === team && winType === "Bomb defused") {
              updateData("bombDefused", "defence");
            } else if (winningTeam === team && winType === "Eliminated") {
              updateData("kills", "defence");
            } else if (winningTeam === team && winType === "Round timer expired") {
              updateData("time", "defence");
            }
          }
          if (winningTeam !== team) {
            teamData[overtimeSide].losses++;
          }
          plantData();
          overtimeSide = (overtimeSide === "attack") ? "defence" : "attack";
        });
      }
      //Getting data from first half (first 12 rounds)
      const first12Rounds = rounds.slice(0,12);
      let startingSide;
      if (team === "red") {
        startingSide = "attack"
      } else if (team === "blue") {
        startingSide = "defence"
      }
      teamData.startingSide = startingSide;
      processRounds(first12Rounds, startingSide);
      //Getting data from the rest of the rounds
      let endingSide;
      endingSide = (startingSide === "attack") ? "defence" : "attack";
      let overtime = false;
      if (rounds.length > 25) {
        overtime = true
      }
      let lastRounds;
      if (overtime) {
        //If overtime happened
        lastRounds = rounds.slice(12,24);
        processRounds(lastRounds, endingSide);
        let overtimeRounds = rounds.slice(24);
        processOvertimeRounds(overtimeRounds,startingSide)
      } else {
        //If overtime didnt happen
        lastRounds = rounds.slice(12);
        processRounds(lastRounds, endingSide);
      }
  
      for (const player of playersList) {
        const puuidToFind = player.id;
        const currentPlayer = players.all_players.find(p => p.puuid === puuidToFind);
        teamData.comp[player.name] = currentPlayer.character
      }
      // console.log(teamData);
      return teamData;
    } catch (e) {
      console.log(e);
    }
  }

  async function getPlayerData(match){
    try {
      //Getting base player array
      let playerArr = playersList.reduce((acc,cur)=> {
        acc[cur.name] = {firstBloods: 0,
                        firstDeaths: 0, 
                        agent: "", 
                        rank: "",
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                        ACS: 0,
                        ADR: 0};
        return acc;
      },{})
      const { data: { data : { rounds, players, metadata } }} = await axios(`https://api.henrikdev.xyz/valorant/v2/match/${match}`)
      const team = await getTeam(`https://api.henrikdev.xyz/valorant/v2/match/${match}`);
      //Getting First Blood Data
      let finalData = rounds.reduce((acc,cur) => {
          const firstKill =  cur.player_stats
              .map(i => ({puuid: i.player_puuid, killTime: i.kill_events[0]?.kill_time_in_round}))
              .filter(i => typeof i.killTime !== 'undefined')
              .sort((a,b) => a.killTime - b.killTime)[0]
          for (const player of playersList) {
              if (player.id === firstKill.puuid) {
                  acc[player.name].firstBloods++
              }
          }
          return acc;
      },playerArr)
      //Getting First Death Data
      finalData = rounds.reduce((acc,cur) => {
        const firstDeath =  cur.player_stats
            .map(i => ({puuid: i.kill_events[0]?.victim_puuid, killTime: i.kill_events[0]?.kill_time_in_round}))
            .filter(i => typeof i.killTime !== 'undefined')
            .sort((a,b) => a.killTime - b.killTime)[0];
        for (const player of playersList) {
            if (player.id === firstDeath.puuid) {
                acc[player.name].firstDeaths++
            }
        }
        return acc;
    },playerArr)
      //Getting Agent Data
    for (const player of playersList) {
      finalData[player.name].agent = players[team].filter(i => player.id === i.puuid)[0].character
    }
    //Getting Rank Data
    for (const player of playersList) {
      finalData[player.name].rank = players[team].filter(i => player.id === i.puuid)[0].currenttier_patched;
    }
    //Getting Kills
    for (const player of playersList) {
      finalData[player.name].kills = players[team].filter(i => player.id === i.puuid)[0].stats.kills;
    }
    //Getting Deaths
    for (const player of playersList) {
      finalData[player.name].deaths = players[team].filter(i => player.id === i.puuid)[0].stats.deaths;
    }
    //Getting Assists
    for (const player of playersList) {
      finalData[player.name].assists = players[team].filter(i => player.id === i.puuid)[0].stats.assists;
    }
    //Getting ACS
    for (const player of playersList) {
      const acs = players[team].filter(i => player.id === i.puuid)[0].stats.score / metadata.rounds_played;
      finalData[player.name].ACS = Number(acs.toFixed(2));
    }
    //Getting ADR (Average Damage per Round)
    for (const player of playersList) {
      const adr = players[team].filter(i => player.id === i.puuid)[0].damage_made / metadata.rounds_played;
      finalData[player.name].ADR = Number(adr.toFixed(2));
    }
      // console.log(finalData);
      return finalData;
    } catch (e) {
      console.log(e)
    }
  }

module.exports = {
    getTeamData: getTeamData,
    getPlayerData: getPlayerData,
    getKills: getKills,
    balanceTeams: balanceTeams,
    getMatchID: getMatchID
};
