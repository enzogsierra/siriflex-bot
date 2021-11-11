import fetch from 'cross-fetch';
import {Client, Intents, MessageEmbed} from 'discord.js';


const Bot = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
Bot.login("token");


// When bot starts
Bot.on("ready", () =>
{
    console.log(`Logged in as ${Bot.user.tag}`);
});

// When someone sends a message
Bot.on("messageCreate", async function(msg)
{
    if(msg.author.bot) return;

    //
    if(msg.content === "sexo")
    {
        msg.channel.send("SEXOOOO");
    }

    //
    if(msg.author.discriminator == 8614 && Math.floor(Math.random() * 11) == 0)
    {
        msg.channel.send("un hambre tengo");
    }
    if(msg.author.discriminator == 9924 && Math.floor(Math.random() * 11) == 0)
    {
        msg.channel.send("otakus de mierda");
    }


    // !ranked playerName
    if(msg.content.startsWith("!rank"))
    {
        if(msg.content.trim() == "!rank") return msg.reply('!rank "nick" (sin comillas imbécil)');
        
        try
        {
            const name = msg.content.substr(msg.content.indexOf(" ") + 1);

            // Verificar que sea un jugador de Steam válido
            const data = await getPlayerData(name);
            if(!data) return msg.reply("Jugador no encontrado, verifica mayúsculas y minúsculas.");

            // Verificar que tenga partidas Rankeds en la temporada actual
            const stats = await getMostPlayedRankedMode(data.id);
            if(!stats) return msg.reply("Este jugador no tiene partidas Rankeds en esta temporada.");

            //
            const {mode, roundsPlayed, wins, winRatio, kills, deaths, kda, damageDealt} = stats;
            const {tier, subTier} = stats.currentTier;

            const embed = new MessageEmbed();
            embed.setColor('#1a9116');

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

            msg.channel.send({embeds: [embed]});
        }
        catch
        {
            msg.channel.send("Ocurrio un error");
        }
    }

    // !text "text"
    if(msg.content.startsWith("!text"))
    {
        if(msg.content.trim() == "!text") return msg.reply('!text "texto"');

        const text = msg.content.substr(msg.content.indexOf(" ") + 1);

        msg.delete()
            .then(e =>
            {
                msg.channel.send(text);
            }
        );
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

async function getPlayerRankedStats(accountId)
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
    return Object.keys(tmp.data.attributes.rankedGameModeStats).length ? (tmp.data) : (null);
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
