import {Client, Intents, MessageEmbed} from 'discord.js';
import fetch from 'cross-fetch';

// Load .env file
import dotenv from 'dotenv';
dotenv.config();


// Load bot
const Bot = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
Bot.login(process.env.DISCORD_BOT_TOKEN);


// When bot starts
Bot.on("ready", () =>
{
    console.log(`Logged in as ${Bot.user.tag}`);
});

// When someone sends a message
Bot.on("messageCreate", async function(msg)
{
    if(msg.author.bot) return; // Avoid bot using commands


    // !ranked playerName
    if(msg.content.startsWith("!rank"))
    {
        if(msg.content.trim() == "!rank") return msg.reply('!rank "nick"');
        
        try
        {
            const name = msg.content.substr(msg.content.indexOf(" ") + 1);

            // Verify if is a valid Steam player
            const data = await getPlayerData(name);
            if(!data) return msg.reply("Jugador no encontrado, verifica mayúsculas y minúsculas.");

            // Verify player to have rankeds matchs
            const stats = await getMostPlayedRankedMode(data.id);
            if(!stats) return msg.reply("Este jugador no tiene partidas Rankeds en esta temporada.");

            //
            const {mode, roundsPlayed, wins, winRatio, kills, deaths, kda, damageDealt} = stats;
            const {tier, subTier} = stats.currentTier;

            const embed = new MessageEmbed();
            embed.setTitle(`${name} - Ranked`);
            embed.addField("Rango", `${tier} ${subTier} - ${mode}`, false);
            embed.addField("Partidas", `${roundsPlayed}`, true);
            embed.addField("Victorias", `${wins}`, true);
            embed.addField("Promedio", `${(winRatio * 100).toFixed(0)}%`, true);
            embed.addField("Asesinatos", `${kills}`, true);
            embed.addField("Muertes", `${deaths}`, true);
            embed.addField("K/D", `${kda.toFixed(1)}`, true);
            embed.addField("Daño promedio", `${(damageDealt / roundsPlayed).toFixed(0)}`, true);
            embed.setFooter("Temporada 14");
            embed.setColor('#1a9116');
            msg.channel.send({embeds: [embed]});
        }
        catch
        {
            msg.channel.send("Ocurrio un error");
        }
    }

    // !avatar "user"
    if(msg.content.startsWith("!avatar"))
    {
        const data = (msg.mentions.users.size) ? (msg.mentions.users.first()) : (msg.author);
        const {username, id, avatar} = data;
        const url = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;

        const embed = new MessageEmbed();
        embed.setAuthor(`Avatar de ${username}`);
        embed.setTitle("Imagen completa");
        embed.setURL(`${url}?size=2048`); // Full-size image
        embed.setImage(`${url}?size=512`); // Embed message image
        embed.setColor('#1a9116');
        msg.channel.send({embeds: [embed]});
    }
});



//
async function getPlayerData(playerName)
{
    const opts =
    {
        headers: 
        {
            Accept: "application/vnd.api+json",
            Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNzZmOWYzMC1kNWM0LTAxMzktZTRlOS02Mzk3ZDNjNzNlYmIiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNjI3OTExMTg1LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImxhdGFtZXZlbnRzIn0.12S_uXEy_S0BNplFWvyyJmRd9Hbe5AXXQ1bLWtAmiqE"
        }
    };

    let tmp = await fetch(`https://api.pubg.com/shards/steam/players?filter[playerNames]=${playerName}`, opts);
    tmp = await tmp.json();
    return tmp.errors ? (null) : (tmp.data[0]);
}

async function getMostPlayedRankedMode(accountId)
{
    const opts =
    {
        headers: 
        {
            Accept: "application/vnd.api+json",
            Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNzZmOWYzMC1kNWM0LTAxMzktZTRlOS02Mzk3ZDNjNzNlYmIiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNjI3OTExMTg1LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImxhdGFtZXZlbnRzIn0.12S_uXEy_S0BNplFWvyyJmRd9Hbe5AXXQ1bLWtAmiqE"
        }
    };

    let tmp = await fetch(`https://api.pubg.com/shards/steam/players/${accountId}/seasons/division.bro.official.pc-2018-14/ranked`, opts);
    tmp = await tmp.json();

    //
    if(!Object.keys(tmp.data.attributes.rankedGameModeStats).length) return null;

    let stats = [];
    let mostRounds = 0; 

    Object.keys(tmp.data.attributes.rankedGameModeStats).forEach(key =>
    {
        const data = tmp.data.attributes.rankedGameModeStats[key];
        if(data.roundsPlayed > mostRounds)
        {
            stats = data;
            mostRounds = data.roundsPlayed;
        }

        switch(key)
        {
            case 'solo': stats.mode = "Solo TPP"; break;
            case 'duo': stats.mode = "Duo TPP"; break;
            case 'squad': stats.mode = "Squad TPP"; break;
            case 'solo-fpp': stats.mode = "Solo FPP"; break;
            case 'duo-fpp': stats.mode = "Duo FPP"; break;
            case 'squad-fpp': stats.mode = "Squad FPP"; break;
            default: stats.mode = "Unknown mode"; break;
        }
    });
    return stats;
}
