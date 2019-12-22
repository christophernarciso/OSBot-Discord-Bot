require('dotenv').config();
const Trie = require('trie-search');
const Discord = require('discord.js');
const commandsData = require('./info/commands.json');
const classData = require('./info/classes.json');
const indexData = require('./info/index.json');
const bot = new Discord.Client();
const token = process.env.TOKEN;

// Setup our trie search for class
let classSearch = new Trie('name', {min: 3, ignoreCase: true});
classSearch.addAll(classData);
// Setup our trie search for index
let indexSearch = new Trie('name', {min: 3, ignoreCase: true});
indexSearch.addAll(indexData);

bot.login(token);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
    if (msg.author.bot)
        return;

    let msgContent = msg.content;
    let fullCommand = msgContent.split(' ');
    let search;

    if (msgContent === '!commands') {
        msg.reply('Here are a list of options available for this bot!\n')
            .then(() => {
                let commandString = '';
                for (let i = 0; i < commandsData.commands.length; i++) {
                    let command = commandsData.commands[i];
                    commandString += '```\n' + command['name'] + ' - ' + command['desc'] + '\n```\n';
                }
                msg.channel.send(commandString).then(() =>
                    console.log(`Replied to user ${msg.author.username} with available commands!`)
                );
            });
    } else if (msgContent === "!snippets") {
        msg.reply('https://osbot.org/forum/forum/251-snippets/');
    } else if (msgContent === '!tutorials') {
        msg.reply('https://osbot.org/forum/forum/250-tutorials/');
    } else if (msgContent === '!help') {
        msg.reply("Hey if you need scripting help then please head over to:\nhttps://osbot.org/forum/forum/249-scripting-help/" +
            " \nIf you were looking for commands please do !commands");
    } else if (msgContent.startsWith('!class')) {
        if (fullCommand.length > 1) {
            let search = classSearch.get(fullCommand[1]);

            if (!search.length) {
                msg.reply('Try providing a more accurate search term.');
                return;
            }

            let lengthOfSearch = search.length;
            let classString = lengthOfSearch > 1 ? 'Here are some classes from your search:\n' : 'Found a class from your search:\n';

            for (let i = 0; i < search.length; i++) {
                let data = search[i];
                classString += `${data['name']} class can be found at ${data['url']}\n\n`
            }

            msg.reply(classString)
                .then(() => console.log(`Successfully found data for search: ` + fullCommand[1]));
        } else {
            msg.reply('Try providing a search term in your command. <!class bank>');
        }
    } else if (msgContent.startsWith('!index')) {
        if (fullCommand.length > 1) {
            search = indexSearch.get(fullCommand[1]);

            if (!search.length) {
                msg.reply('Try providing a more accurate search term.');
                return;
            }

            let lengthOfSearch = search.length;
            let indexString = lengthOfSearch > 1 ? 'Here are some results from your search:\n' : 'Found a result from your search:\n';

            for (let i = 0; i < 10; i++) {
                let data = search[i];
                // Incase there are less than 10 results.
                if (!data)
                    continue;
                indexString += `${data['name']}\n${data['desc']}\n${data['url']}\n\n`
            }

            msg.reply(indexString)
                .then(() => console.log(`Successfully found data for search: ` + fullCommand[1]));
        } else {
            msg.reply('Try providing a search term in your command. <!index open>');
        }
    }
});